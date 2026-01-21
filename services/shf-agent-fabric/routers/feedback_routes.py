from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from fabric.security import require_admin_key
from fabric.feedback import log_event

router = APIRouter()

class FeedbackBody(BaseModel):
    kind: str = "feedback"
    outcome: str = "ok"
    agentName: str | None = None
    agentId: str | None = None
    layer: str | None = None
    message: str = ""
    requestId: str | None = None
    meta: dict | None = None

@router.post("/feedback")
def create_feedback(body: FeedbackBody, _ok: bool = Depends(require_admin_key)):
    log_event(
        kind=body.kind,
        outcome=body.outcome,
        agent_name=body.agentName,
        agent_id=body.agentId,
        layer=body.layer,
        message=body.message,
        request_id=body.requestId,
        meta=body.meta or {},
    )
    return {"ok": True}
