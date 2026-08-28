from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body, Depends, Header, HTTPException, Request

from auth.csrf import validate_csrf
from auth.dependencies import require_permission
from auth.permissions import SHF_EVENT_CREATE, SHF_EVENT_READ, SHF_EVIDENCE_CREATE
from services.evidence_projection_service import ProjectionError, project_operational_event_to_truth
from services.operational_event_service import OperationalEventError, ingest_operational_event, list_operational_events, storage_status


router = APIRouter(prefix="/shf/ingestion", tags=["shf-ingestion"])


def _raise_operational_error(exc: OperationalEventError) -> None:
    if exc.reason == "actor_missing_organization_scope":
        raise HTTPException(status_code=403, detail="Forbidden: no organization scope on this account")
    raise HTTPException(status_code=422, detail={"error": exc.reason, **exc.detail})


def _raise_projection_error(exc: ProjectionError) -> None:
    if exc.reason == "event_not_found":
        raise HTTPException(status_code=404, detail="Not found")
    if exc.reason == "malformed_event":
        raise HTTPException(status_code=422, detail={"error": exc.reason})
    if exc.reason == "missing_truth_projection_permission":
        raise HTTPException(status_code=403, detail="Forbidden")
    if exc.status_code == 503:
        raise HTTPException(status_code=503, detail={"error": exc.reason, "retryable": exc.retryable})
    raise HTTPException(status_code=exc.status_code, detail={"error": exc.reason, "retryable": exc.retryable})


@router.post("/events")
def create_operational_event(
    request: Request,
    payload: Dict[str, Any] = Body(default={}),
    x_correlation_id: str | None = Header(default=None),
    session=Depends(require_permission(SHF_EVENT_CREATE)),
) -> Dict[str, Any]:
    validate_csrf(request, session)
    try:
        result = ingest_operational_event(payload or {}, session, correlation_id=x_correlation_id)
    except OperationalEventError as exc:
        _raise_operational_error(exc)
    return {"ok": True, **result}


@router.get("/events")
def read_operational_events(session=Depends(require_permission(SHF_EVENT_READ))) -> Dict[str, Any]:
    try:
        events = list_operational_events(session)
    except OperationalEventError as exc:
        _raise_operational_error(exc)
    return {"ok": True, "count": len(events), "events": events}


@router.get("/storage")
def read_operational_storage_status(session=Depends(require_permission(SHF_EVENT_READ))) -> Dict[str, Any]:
    return {"ok": True, "storage": storage_status()}


@router.post("/events/{event_id}/truth-projection")
def project_event_truth_claim(
    event_id: str,
    request: Request,
    payload: Dict[str, Any] = Body(default={}),
    session=Depends(require_permission(SHF_EVIDENCE_CREATE)),
) -> Dict[str, Any]:
    validate_csrf(request, session)
    try:
        result = project_operational_event_to_truth(event_id, session)
    except ProjectionError as exc:
        _raise_projection_error(exc)
    return {"ok": True, **result}
