from __future__ import annotations

from types import SimpleNamespace
from typing import Any, Dict

from fastapi import APIRouter, Body, HTTPException, Request

from services.internal_service_identity import authenticate_internal_request
from services.operational_telemetry import emit_operational_telemetry
from services.evidence_projection_service import ProjectionError, project_operational_event_to_truth
from services.internal_ingestion_rate_limit_service import (
    InternalIngestionRateLimitError,
    consume_internal_ingestion_limit,
)
from services.operational_event_service import OperationalEventError, ingest_operational_event, validate_operational_event


router = APIRouter(prefix="/shf/internal/ingestion", tags=["shf-internal-ingestion"])

NON_PROJECTED_EVENTS = {
    ("shs.reporting", "report.created"),
    ("shs.grant_binder", "grant_binder.created"),
    ("shs.exchange", "funding_commitment.committed"),
}


@router.post("/events")
def create_internal_operational_event(request: Request, payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    try:
        principal = authenticate_internal_request(
            method=request.method,
            path=request.url.path,
            body=payload or {},
            headers=request.headers,
        )
    except ValueError as exc:
        reason = str(exc)
        emit_operational_telemetry(
            event_name="internal_ingestion_auth_rejected",
            severity="WARNING",
            component="agent_fabric",
            category="SECURITY",
            outcome="EXPECTED_DOMAIN_REJECTION",
            metadata={"reason": reason if reason in {"unauthorized_internal_service", "internal_service_event_not_allowed", "invalid_internal_service_signature", "unknown_internal_service_key"} else "authentication_rejected"},
        )
        status = 403 if reason in {"unauthorized_internal_service", "internal_service_event_not_allowed"} else 401
        raise HTTPException(status_code=status, detail="Invalid internal service authentication") from exc

    organization_id = str((payload or {}).get("organization_id") or "").strip()
    actor_id = str((payload or {}).get("originating_actor_id") or "").strip()
    actor_type = str((payload or {}).get("originating_actor_type") or "service_actor").strip()
    if not organization_id or not actor_id:
        raise HTTPException(status_code=422, detail="Trusted event scope is required")
    if str((payload or {}).get("tenant_id") or "") != f"tenant:{organization_id}":
        raise HTTPException(status_code=403, detail="Invalid trusted event scope")

    actor = SimpleNamespace(
        user_id=actor_id,
        role=actor_type,
        organization_id=organization_id,
        tenant_id=f"tenant:{organization_id}",
        service_id=principal.service_id,
        principal_type=principal.principal_type,
        permission=principal.permission,
    )
    try:
        validate_operational_event(payload or {}, actor)
        decision = consume_internal_ingestion_limit(principal.service_id)
    except OperationalEventError as exc:
        raise HTTPException(status_code=422, detail={"error": exc.reason, **exc.detail}) from exc
    except InternalIngestionRateLimitError as exc:
        if str(exc) == "rate_limit_backend_unavailable":
            raise HTTPException(status_code=503, detail={"error": "rate_limit_unavailable"}) from exc
        raise HTTPException(status_code=503, detail={"error": str(exc)}) from exc
    if not decision.allowed:
        raise HTTPException(
            status_code=429,
            headers={"Retry-After": str(decision.retry_after_seconds)},
            detail={"error": "rate_limited", "retry_after_seconds": decision.retry_after_seconds},
        )
    try:
        result = ingest_operational_event(payload or {}, actor, correlation_id=payload.get("correlation_id"))
    except OperationalEventError as exc:
        raise HTTPException(status_code=422, detail={"error": exc.reason, **exc.detail}) from exc
    event_key = (str(payload.get("producer_id") or "").strip(), str(payload.get("event_type") or "").strip())
    if event_key in NON_PROJECTED_EVENTS:
        return {
            "ok": True,
            "principal_type": principal.principal_type,
            "event": result["event"],
            "projection": None,
            "projection_status": "not_configured",
            "event_idempotent_replay": bool(result.get("idempotent_replay")),
            "projection_idempotent_replay": False,
            "idempotent_replay": bool(result.get("idempotent_replay")),
        }
    try:
        projection = project_operational_event_to_truth(result["event"]["event_id"], actor)
    except ProjectionError as exc:
        raise HTTPException(status_code=503 if exc.retryable else exc.status_code, detail={"error": exc.reason, "retryable": exc.retryable}) from exc
    return {
        "ok": True,
        "principal_type": principal.principal_type,
        "event": result["event"],
        "projection": projection["projection"],
        "event_idempotent_replay": bool(result.get("idempotent_replay")),
        "projection_idempotent_replay": bool(projection.get("idempotent_replay")),
        "idempotent_replay": bool(result.get("idempotent_replay")) and bool(projection.get("idempotent_replay")),
    }
