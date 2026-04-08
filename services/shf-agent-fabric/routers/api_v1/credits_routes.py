from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from fabric.credits.store import get_credit_by_submission

router = APIRouter(prefix="/api/v1/credits", tags=["credits"])


@router.get("/by-submission/{submission_id}")
def get_credit(submission_id: str) -> Dict[str, Any]:
    row = get_credit_by_submission(submission_id)
    if not row:
        raise HTTPException(status_code=404, detail="credit not found")
    return row
