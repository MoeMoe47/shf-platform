from __future__ import annotations
from fastapi import APIRouter, Header, HTTPException
from typing import Optional, Dict, Any
from fabric.outcomes.schemas import OutcomeSubmissionIn, OutcomeSubmissionOut
from fabric.outcomes.store import submit_outcome, get_submission_by_id

router = APIRouter(prefix="/api/v1/outcomes", tags=["outcomes"])

@router.post("/submit", response_model=OutcomeSubmissionOut)
def submit(
    body: OutcomeSubmissionIn,
    idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key"),
):
    payload: Dict[str, Any] = body.model_dump()
    # Header overrides body if present
    if idempotency_key:
        payload["idempotency_key"] = idempotency_key

    res = submit_outcome(payload)
    return {
        "submission_id": res["submission_id"],
        "idempotency_key": res["idempotency_key"],
        "status": res["status"],
        "created_at": res["created_at"],
        "payload": payload,
    }

@router.get("/{submission_id}")
def get_submission(submission_id: str):
    row = get_submission_by_id(submission_id)
    if not row:
        raise HTTPException(status_code=404, detail="submission not found")
    return row
