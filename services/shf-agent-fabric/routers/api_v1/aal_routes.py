from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.aal_service import (
    auto_recompute_from_new_event,
    ingest_aal_event,
    list_anomaly_signals,
    list_participant_risk,
    list_program_health,
    list_signal_weights,
    recompute_participant_risk,
    recompute_program_health,
    record_learning_feedback,
)

router = APIRouter(prefix="/api/v1/aal", tags=["aal"])


class AALEventIn(BaseModel):
    event_id: str = Field(..., min_length=1)
    event_type: str = Field(..., min_length=1)
    source_system: str = Field(..., min_length=1)
    source_record_id: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    occurred_at: datetime
    payload_json: Dict[str, Any]
    schema_version: Optional[str] = "1.0"


class AALFeedbackIn(BaseModel):
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    feedback_type: str = Field(..., min_length=1)
    feedback_value: Optional[float] = None
    notes_json: Dict[str, Any] = Field(default_factory=dict)


@router.post("/events")
def post_aal_event(body: AALEventIn) -> Dict[str, Any]:
    try:
        result = ingest_aal_event(body.model_dump())
        return {"ok": True, "result": result}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/program-health")
def get_program_health(program_id: Optional[str] = None) -> Dict[str, Any]:
    rows = list_program_health(program_id=program_id)
    return {"ok": True, "items": rows}


@router.get("/participant-risk")
def get_participant_risk(participant_id: Optional[str] = None) -> Dict[str, Any]:
    rows = list_participant_risk(participant_id=participant_id)
    return {"ok": True, "items": rows}


@router.post("/recompute/program-health")
def recompute_program_health_endpoint() -> Dict[str, Any]:
    try:
        n = recompute_program_health()
        return {"ok": True, "programs_processed": n}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/recompute/participant-risk")
def recompute_participant_risk_endpoint() -> Dict[str, Any]:
    try:
        n = recompute_participant_risk()
        return {"ok": True, "participants_processed": n}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/recompute/auto")
def recompute_auto_endpoint() -> Dict[str, Any]:
    try:
        result = auto_recompute_from_new_event()
        return {"ok": True, "result": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/weights")
def get_weights() -> Dict[str, Any]:
    return {"ok": True, "items": list_signal_weights()}


@router.get("/anomalies")
def get_anomalies(status: Optional[str] = None) -> Dict[str, Any]:
    return {"ok": True, "items": list_anomaly_signals(status=status)}


@router.post("/feedback")
def post_feedback(body: AALFeedbackIn) -> Dict[str, Any]:
    try:
        result = record_learning_feedback(
            entity_type=body.entity_type,
            entity_id=body.entity_id,
            feedback_type=body.feedback_type,
            feedback_value=body.feedback_value,
            notes_json=body.notes_json,
        )
        return {"ok": True, "result": result}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/priority-queue")
def get_priority_queue():
    from services.aal_service import build_priority_queue
    return {"ok": True, "items": build_priority_queue()}

