from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from fabric.governance.store import (
    open_dispute,
    resolve_dispute,
    create_override,
    create_approval,
    list_disputes,
)

router = APIRouter(prefix="/api/v1/governance", tags=["governance"])


class OpenDisputeIn(BaseModel):
    reference_type: str
    reference_id: str
    reason: str
    opened_by: str


class ResolveDisputeIn(BaseModel):
    resolved_by: str
    resolution_notes: str


class CreateOverrideIn(BaseModel):
    reference_type: str
    reference_id: str
    override_type: str
    reason: str
    requested_by: str


class CreateApprovalIn(BaseModel):
    reference_type: str
    reference_id: str
    approver: str
    decision: str
    notes: Optional[str] = None


@router.post("/disputes")
def open_dispute_route(body: OpenDisputeIn) -> Dict[str, Any]:
    return open_dispute(**body.model_dump())


@router.post("/disputes/{dispute_id}/resolve")
def resolve_dispute_route(dispute_id: str, body: ResolveDisputeIn) -> Dict[str, Any]:
    return resolve_dispute(
        dispute_id=dispute_id,
        resolved_by=body.resolved_by,
        resolution_notes=body.resolution_notes,
    )


@router.get("/disputes")
def list_disputes_route(state: Optional[str] = None) -> Dict[str, Any]:
    return {"items": list_disputes(state=state)}


@router.post("/overrides")
def create_override_route(body: CreateOverrideIn) -> Dict[str, Any]:
    return create_override(**body.model_dump())


@router.post("/approvals")
def create_approval_route(body: CreateApprovalIn) -> Dict[str, Any]:
    return create_approval(**body.model_dump())
