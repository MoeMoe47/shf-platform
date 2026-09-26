from __future__ import annotations

"""
Agent Fabric Command Center — read projections (AFCC-2A).

READ ONLY. Every route here projects state that already exists; none of them
runs verification, spawns subprocesses, recomputes Watchtower risk, or writes
anything. Privileged actions stay where they are:

  ACTION (privileged, X-Admin-Key)          READ (this router)
  GET /admin/infra/verify          ->  records result ->  /infrastructure
  GET /admin/observability/verify  ->  records result ->  /observability
  GET /watchtower/summary (evaluation, writes history) -> /watchtower (persisted state)

Access (a request must satisfy one):
  - a Fabric session with `bos.governance.read`, or
  - AFCC-2A.2/2A.3: the SHS API service identity (`service:shs-api`, the existing
    HMAC keyring used for internal ingestion), GET only, and only on the
    COMMAND_READ_PATHS allow-list in services/internal_service_identity.py.
    SHS enforces the user's SHS `bos.governance.read` permission before it signs.
AFCC-2A.1 removed the transitional X-Admin-Key read; no admin key is accepted here.
"""

from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse

from auth.audit import record_auth_event
from auth.dependencies import session_cookie
from auth.permissions import has_permission
from auth.sessions import get_session
from fabric.command.sanitize import sanitize
from services.internal_service_identity import authenticate_internal_read_request, has_internal_service_headers
from fabric.command.verification_results import read_verification_result

COMMAND_READ_PERMISSION = "bos.governance.read"
CONTRACT = "afcc.read.v1"

router = APIRouter(prefix="/api/v1-command-center/agent-fabric", tags=["v1-command-center"])


def require_command_read(request: Request) -> Dict[str, str]:
    session = get_session(session_cookie(request))
    if session:
        if has_permission(session.role, COMMAND_READ_PERMISSION):
            return {"access": "session"}
        record_auth_event(
            "permission_check_failed",
            user_id=session.user_id,
            route=request.url.path,
            method=request.method,
            result="denied",
            role=session.role,
            permission=COMMAND_READ_PERMISSION,
        )
        raise HTTPException(status_code=403, detail="Forbidden")

    if has_internal_service_headers(request.headers):
        try:
            authenticate_internal_read_request(method=request.method, path=request.url.path, headers=request.headers)
        except ValueError as exc:
            record_auth_event(
                "service_auth_failed",
                route=request.url.path,
                method=request.method,
                result="denied",
                reason=str(exc),
                permission=COMMAND_READ_PERMISSION,
            )
            raise HTTPException(status_code=401, detail="Authentication required")
        return {"access": "shs_service"}

    raise HTTPException(status_code=401, detail="Authentication required")


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _envelope(kind: str, access: Dict[str, str], body: Dict[str, Any]) -> Dict[str, Any]:
    return sanitize(
        {
            "contract": CONTRACT,
            "kind": kind,
            "read_only": True,
            "generated_at": _now().isoformat().replace("+00:00", "Z"),
            "access": access["access"],
            **body,
        }
    )


def _projection_failure(kind: str) -> JSONResponse:
    # No exception text leaves the service.
    return JSONResponse(
        status_code=503,
        content={"contract": CONTRACT, "kind": kind, "read_only": True, "state": "BACKEND_ERROR", "reason_code": "PROJECTION_READ_FAILED"},
    )


def _verification_projection(kind: str, action_id: str) -> Dict[str, Any]:
    record = read_verification_result(kind)
    source = {"authority": f"Agent Fabric {kind} verifier", "store": "command_verification", "action": action_id, "run_on_read": False}
    if record is None:
        return {"source": source, "state": "NOT_YET_VERIFIED", "reason_code": "NO_VERIFICATION_RECORDED"}
    if record.get("unreadable"):
        return {"source": source, "state": "BACKEND_ERROR", "reason_code": "VERIFICATION_RECORD_UNREADABLE"}
    verified_at = record.get("verified_at")
    age = None
    try:
        age = max(0, int((_now() - datetime.fromisoformat(str(verified_at).replace("Z", "+00:00"))).total_seconds()))
    except (TypeError, ValueError):
        age = None
    checks = [c for c in record.get("checks") or [] if isinstance(c, dict)]
    return {
        "source": source,
        "state": "AVAILABLE",
        "status": record.get("status"),
        "last_verified_at": verified_at,
        "trigger": record.get("trigger"),
        "checks": checks,
        "degraded": [c.get("name") for c in checks if c.get("ok") is not True],
        "staleness": {"age_seconds": age, "threshold_seconds": None, "threshold": "NOT_DEFINED"},
    }


@router.get("/watchtower")
def read_watchtower(access=Depends(require_command_read)):
    try:
        from fabric.watchtower.read_projection import build_watchtower_read_projection

        return _envelope("watchtower", access, build_watchtower_read_projection(_now()))
    except Exception:
        return _projection_failure("watchtower")


@router.get("/infrastructure")
def read_infrastructure(access=Depends(require_command_read)):
    try:
        return _envelope("infrastructure", access, _verification_projection("infrastructure", "admin.infra.verify"))
    except Exception:
        return _projection_failure("infrastructure")


@router.get("/observability")
def read_observability(access=Depends(require_command_read)):
    try:
        return _envelope("observability", access, _verification_projection("observability", "admin.observability.verify"))
    except Exception:
        return _projection_failure("observability")


# ------------------------------------------------------------------ AFCC-2A.2
# Former admin-key-only lanes, projected to the fields the Command Center uses.


def _fleet_read(kind: str, build):
    try:
        return build()
    except Exception:
        return None


@router.get("/agents/health")
def read_agents_health(access=Depends(require_command_read)):
    from fabric.command.fleet_projections import agents_health_projection

    body = _fleet_read("agents_health", agents_health_projection)
    return _envelope("agents_health", access, body) if body is not None else _projection_failure("agents_health")


@router.get("/agents/readiness")
def read_agents_readiness(access=Depends(require_command_read)):
    from fabric.command.fleet_projections import agents_readiness_projection

    body = _fleet_read("agents_readiness", agents_readiness_projection)
    return _envelope("agents_readiness", access, body) if body is not None else _projection_failure("agents_readiness")


@router.get("/gate")
def read_gate(access=Depends(require_command_read)):
    from fabric.command.fleet_projections import gate_projection

    body = _fleet_read("gate", gate_projection)
    return _envelope("gate", access, body) if body is not None else _projection_failure("gate")


@router.get("/runs/recent")
def read_runs_recent(access=Depends(require_command_read)):
    from fabric.command.fleet_projections import runs_recent_projection

    body = _fleet_read("runs_recent", runs_recent_projection)
    return _envelope("runs_recent", access, body) if body is not None else _projection_failure("runs_recent")
