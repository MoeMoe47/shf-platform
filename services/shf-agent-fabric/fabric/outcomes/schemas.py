from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime

OutcomeStatus = Literal["RECEIVED", "VALIDATED", "REJECTED", "VERIFIED"]

class OutcomeSubmissionIn(BaseModel):
    idempotency_key: str = Field(..., min_length=8)
    participant_id: str
    program_id: str
    outcome_type: str
    artifact_ids: List[str] = Field(default_factory=list)
    evidence_root_hash: str

class OutcomeSubmissionOut(BaseModel):
    submission_id: str
    idempotency_key: str
    status: OutcomeStatus
    created_at: datetime
    payload: Dict[str, Any]
