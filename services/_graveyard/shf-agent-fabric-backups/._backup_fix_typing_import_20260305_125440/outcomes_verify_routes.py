from __future__ import annotations

from datetime import datetime, timezone

from typing import
from typing import Optional Any, Dict, Optional
from fabric.outcomes import proof_signature_store

import hashlib
from pathlib import Path
import hmac
import json
import os

from fastapi import
from pydantic import BaseModel APIRouter, HTTPException, Body

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



def _canonicalize_proof_for_signing(proof: dict) -> dict:
    """
    Deterministic canonical proof for signing:
    - Remove volatile fields like generated_at
    - Keep everything else stable
    """
    if not isinstance(proof, dict):
        return proof
    cp = dict(proof)
    cp.pop("generated_at", None)
    # If nested generated_at fields exist, remove them too (safe)
    for k, v in list(cp.items()):
        if isinstance(v, dict):
            vv = dict(v)
            vv.pop("generated_at", None)
            cp[k] = vv
    return cp


def _stable_json_bytes(obj: dict) -> bytes:
    # Stable ordering + compact separators for deterministic HMAC
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _proof_hmac_key() -> bytes:
    # Deterministic signing key. In prod: inject from KMS/Secret Manager.
    # For MVP: allow env override; else fall back to stable dev key.
    key = os.environ.get("SHF_OUTCOMES_PROOF_HMAC_KEY", "").strip()
    if not key:
        key = "shf_dev_outcomes_proof_key_change_me"
    return key.encode("utf-8")


def _sign_proof(canonical_proof: dict) -> dict:
    b = _stable_json_bytes(canonical_proof)
    proof_sha256 = hashlib.sha256(b).hexdigest()
    sig = hmac.new(_proof_hmac_key(), b, hashlib.sha256).hexdigest()
    return {"signature": sig, "proof_sha256": proof_sha256}


def proof_bundle(submission_id: str) -> Dict[str, Any]:
    """
    Internal helper used by /proof/{submission_id}/sign.
    It calls the existing GET proof handler if present; otherwise falls back to chain().
    """
    fn = globals().get("proof")
    if callable(fn):
        return fn(submission_id)  # type: ignore[misc]
    fn2 = globals().get("chain")
    if callable(fn2):
        # Fallback if proof() was renamed/removed; still produces a stable bundle.
        return fn2(submission_id)  # type: ignore[misc]
    raise NameError("Neither proof() nor chain() is defined; cannot build proof bundle.")
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
@router.get("/proof/{submission_id}")
def proof(submission_id: str) -> Dict[str, Any]:
    """
    Portable proof artifact: a single response that carries the whole chain
    + replay verification for both outcomes decision + funding event.
    """
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

    policy = {
        "ruleset_sha256": decision.get("ruleset_sha256"),
        "manifest_fingerprint": decision.get("manifest_fingerprint"),
    }

    return {
        "schema_version": "OUTCOMES_PROOF_V1",
        "ok": True,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "submission_id": submission_id,
        "submission": sub,
        "decision": decision,
        "policy": policy,
        "credit": credit,
        "payout_intent": intent,
        "funding_link": link,
        "funding_event": funding_event,
        "replay": {"outcomes": outcomes_replay, "funding_event": funding_replay},
    }


@router.post("/proof/{submission_id}/sign")
def sign_proof(submission_id: str) -> Dict[str, Any]:
    """
    Deterministic signature over the *canonical* proof.
    - Proof response may contain generated_at (volatile)
    - Signature is computed over canonical proof with generated_at removed
    """
    # Build the proof (may include generated_at)
    proof = proof_bundle(submission_id)

    # Canonicalize for signing (remove volatile fields)
    canonical = _canonicalize_proof_for_signing(proof)

    # Deterministic signature over canonical proof JSON bytes
    signed = _sign_proof(canonical)

    # Option A (SHF): persist signature at sign-time (append-only, auditable)
    try:
        _alg = locals().get("algorithm") or (expected.get("algorithm") if isinstance(locals().get("expected"), dict) else None) or "HMAC-SHA256"
        _sig = locals().get("signature") or (expected.get("signature") if isinstance(locals().get("expected"), dict) else None) or None
        _psh = locals().get("proof_sha256") or (locals().get("proof", {}).get("proof_sha256") if isinstance(locals().get("proof"), dict) else None) or ""
        _gat = locals().get("generated_at")
        if hasattr(_gat, "isoformat"):
            _gat = _gat.isoformat()
        if _sig:
            proof_signature_store.save_signature(
                submission_id=submission_id,
                algorithm=str(_alg),
                signature=str(_sig),
                proof_sha256=str(_psh),
                generated_at=str(_gat) if _gat is not None else "",
            )
    except Exception:
        # Never break signing; store is best-effort in MVP (still append-only when available)
        pass


    
    # Option A: persist signature record (JSONL)
    try:
        _sigstore_append(submission_id=submission_id, algorithm=algorithm, signature=signature, proof_sha256=proof_sha256)
    except Exception:
        pass

    return {
        "ok": True,
        "schema_version": "OUTCOMES_PROOF_SIGNATURE_V1",
        "generated_at": proof.get("generated_at"),
        "submission_id": submission_id,
        "algorithm": "HMAC-SHA256",
        "signature": signed["signature"],
        "proof_sha256": signed["proof_sha256"],
        "proof": proof,
    }





@router.post("/proof/{submission_id}/verify-signature")
def verify_proof_signature(submission_id: str, body: "VerifySignatureRequest" = None) -> Dict[str, Any]:
    """
    Option A (sig store): if body.signature not provided, uses stored signature (latest) if available.
    Always recomputes expected signature from canonical proof and compares.
    """
    stored = _sigstore_latest(submission_id)

    provided_sig = None
    if body is not None and getattr(body, "signature", None):
        provided_sig = body.signature
    elif stored is not None:
        provided_sig = stored.get("signature")

    proof = proof_bundle(submission_id)
    proof_canonical = {k: v for k, v in proof.items() if k != "generated_at"}

    expected = _sign_proof(proof_canonical)
    expected_sig = expected.get("signature") if isinstance(expected, dict) else expected
    expected_alg = expected.get("algorithm") if isinstance(expected, dict) else None

    match = bool(provided_sig) and (provided_sig == expected_sig)

    return {
        "ok": True,
        "submission_id": submission_id,
        "match": match,
        "provided_signature": provided_sig,
        "expected_signature": expected_sig,
        "algorithm": expected_alg or (stored.get("algorithm") if stored else None),
        "store_schema_version": stored.get("store_schema_version") if stored else None,
        "stored_proof_sha256": stored.get("proof_sha256") if stored else None,
    }
