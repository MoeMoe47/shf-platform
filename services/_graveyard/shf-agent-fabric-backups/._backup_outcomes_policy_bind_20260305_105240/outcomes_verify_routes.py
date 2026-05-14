from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException

from fabric.outcomes.store import get_submission_by_id
from fabric.outcomes.verify import verify_submission, replay_verify
from fabric.outcomes.verify_store import (
    upsert_verify_bundle,
    get_decision_by_submission,
    get_credit_by_submission,
    get_intent_by_credit,
    get_funding_event_link,
    link_funding_event,
)
from fabric.funding.journal.outcome_bridge import (
    make_event_payload,
    append_event,
    compute_event_hash,
    find_event,
)

router = APIRouter(prefix="/api/v1/outcomes", tags=["outcomes"])


def _resolve_policy_meta() -> tuple[str, str]:
    """
    Best-effort: pull the same policy identifiers Funding uses.
    - ruleset_sha256: from fabric.funding.ruleset_hash.attach_ruleset_sha256
    - manifest_fingerprint: from fabric.funding.manifest_signed (function/const varies)
    Returns ("UNKNOWN","UNKNOWN") if not available.
    """
    ruleset_sha256 = "UNKNOWN"
    manifest_fingerprint = "UNKNOWN"

    # ruleset sha
    try:
        from fabric.funding.ruleset_hash import attach_ruleset_sha256  # type: ignore
        tmp = attach_ruleset_sha256({})
        rs = (tmp.get("ruleset_sha256") or "").strip()
        if rs:
            ruleset_sha256 = rs
    except Exception:
        pass

    # manifest fingerprint (try common names + constant)
    try:
        import fabric.funding.manifest_signed as ms  # type: ignore

        # try functions first
        for name in (
            "get_manifest_fingerprint",
            "manifest_fingerprint",
            "current_manifest_fingerprint",
            "fingerprint",
        ):
            fn = getattr(ms, name, None)
            if callable(fn):
                try:
                    val = fn()
                except TypeError:
                    continue
                if isinstance(val, str) and val.strip():
                    manifest_fingerprint = val.strip()
                    break

        # then try constants
        if manifest_fingerprint == "UNKNOWN":
            for cname in ("MANIFEST_FINGERPRINT", "MANIFEST_FP", "FINGERPRINT"):
                val = getattr(ms, cname, None)
                if isinstance(val, str) and val.strip():
                    manifest_fingerprint = val.strip()
                    break
    except Exception:
        pass

    return ruleset_sha256, manifest_fingerprint



@router.post("/verify/{submission_id}")
def verify(submission_id: str) -> Dict[str, Any]:
    # 1) verify decision (deterministic)
    try:
        vr = verify_submission(submission_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="submission not found")

    # 2) create decision + credit + payout intent (idempotent)
    
    # Fill policy identifiers if outcomes verifier doesn't provide them yet
    rs = (getattr(vr, "ruleset_sha256", "") or "").strip() or "UNKNOWN"
    mf = (getattr(vr, "manifest_fingerprint", "") or "").strip() or "UNKNOWN"
    if rs == "UNKNOWN" or mf == "UNKNOWN":
        rs2, mf2 = _resolve_policy_meta()
        if rs == "UNKNOWN":
            rs = rs2
        if mf == "UNKNOWN":
            mf = mf2

    bundle = upsert_verify_bundle(
        submission_id=submission_id,
        decision_hash=vr.decision_hash,
        status=vr.status,
        ruleset_sha256=rs,
        manifest_fingerprint=mf,
        amount_cents=vr.amount_cents,
        currency=vr.currency,
    )

    # 3) Funding Journal Bridge (append-only, replayable) + DB link (idempotent)
    existing_link = get_funding_event_link(submission_id)
    if existing_link:
        funding_link = {**existing_link, "idempotent": True}
        funding_event = find_event(existing_link["funding_event_id"])
    else:
        payload = make_event_payload(
            submission_id=submission_id,
            decision_hash=bundle["decision"]["decision_hash"],
            ruleset_sha256=bundle["decision"]["ruleset_sha256"],
            manifest_fingerprint=bundle["decision"]["manifest_fingerprint"],
            credit_id=bundle["credit"]["credit_id"],
            amount_cents=bundle["credit"]["amount_cents"],
            currency=bundle["credit"]["currency"],
            payout_intent_id=bundle["payout_intent"]["intent_id"],
        )
        fev = append_event(payload)
        funding_link = link_funding_event(submission_id, fev.event_id, fev.event_hash)
        funding_event = {"event_id": fev.event_id, "event_hash": fev.event_hash, "payload": fev.payload}

    return {
        "ok": True,
        "idempotent": bundle["idempotent"],
        "decision": bundle["decision"],
        "credit": bundle["credit"],
        "payout_intent": bundle["payout_intent"],
        "funding_link": funding_link,
        "funding_event": funding_event,
    }


@router.get("/replay/{submission_id}")
def replay(submission_id: str) -> Dict[str, Any]:
    decision = get_decision_by_submission(submission_id)
    if not decision:
        raise HTTPException(status_code=404, detail="decision not found (verify first)")

    try:
        res = replay_verify(
            submission_id=submission_id,
            stored_decision_hash=decision["decision_hash"],
            stored_ruleset_sha256=decision["ruleset_sha256"],
            stored_manifest_fingerprint=decision["manifest_fingerprint"],
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="submission not found")

    return {"ok": True, "decision": decision, "replay": res}


@router.get("/chain/{submission_id}")
def chain(submission_id: str) -> Dict[str, Any]:
    sub = get_submission_by_id(submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="submission not found")

    decision = get_decision_by_submission(submission_id)
    if not decision:
        raise HTTPException(status_code=404, detail="decision not found (verify first)")

    credit = get_credit_by_submission(submission_id)
    intent = get_intent_by_credit(credit["credit_id"]) if credit else None

    link = get_funding_event_link(submission_id)
    funding_event = find_event(link["funding_event_id"]) if link else None

    # Replay checks
    outcomes_replay = replay_verify(
        submission_id=submission_id,
        stored_decision_hash=decision["decision_hash"],
        stored_ruleset_sha256=decision["ruleset_sha256"],
        stored_manifest_fingerprint=decision["manifest_fingerprint"],
    )

    funding_replay = None
    if funding_event and funding_event.get("payload"):
        event_id2, event_hash2 = compute_event_hash(funding_event["payload"])
        funding_replay = {
            "stored_event_id": funding_event.get("event_id"),
            "stored_event_hash": funding_event.get("event_hash"),
            "recomputed_event_id": event_id2,
            "recomputed_event_hash": event_hash2,
            "match": (funding_event.get("event_hash") == event_hash2 and funding_event.get("event_id") == event_id2),
        }

    return {
        "ok": True,
        "submission": sub,
        "decision": decision,
        "credit": credit,
        "payout_intent": intent,
        "funding_link": link,
        "funding_event": funding_event,
        "replay": {"outcomes": outcomes_replay, "funding_event": funding_replay},
    }
