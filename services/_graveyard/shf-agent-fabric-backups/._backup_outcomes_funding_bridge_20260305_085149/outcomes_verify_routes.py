from __future__ import annotations

from fastapi import APIRouter, HTTPException
from typing import Any, Dict

from fabric.outcomes.verify import verify_submission, replay_verify
from fabric.outcomes.verify_store import (
    upsert_verify_bundle,
    get_decision_by_submission,
)

router = APIRouter(prefix="/api/v1/outcomes", tags=["outcomes"])

@router.post("/verify/{submission_id}")
def verify(submission_id: str) -> Dict[str, Any]:
    try:
        vr = verify_submission(submission_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="submission not found")

    bundle = upsert_verify_bundle(
        submission_id=submission_id,
        decision_hash=vr.decision_hash,
        status=vr.status,
        ruleset_sha256=vr.ruleset_sha256,
        manifest_fingerprint=vr.manifest_fingerprint,
        amount_cents=vr.amount_cents,
        currency=vr.currency,
    )
    return {
        "ok": True,
        "idempotent": bundle["idempotent"],
        "decision": bundle["decision"],
        "credit": bundle["credit"],
        "payout_intent": bundle["payout_intent"],
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

    return {
        "ok": True,
        "decision": decision,
        "replay": res,
    }
