from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel

from auth.audit import recent_auth_events, record_auth_event
from auth.config import get_auth_settings, validate_auth_configuration
from auth.cookies import clear_session_cookie, set_session_cookie
from auth.csrf import validate_csrf, validate_origin
from auth.dependencies import require_authenticated_user, require_permission, session_cookie
from auth.permissions import PERMISSIONS, ROLE_PERMISSION_MAP, ROLE_SHS_ADMIN, route_access_matrix
from auth.rate_limit import is_limited, rate_limit_status, record_failure, reset_failures
from auth.sessions import active_session_summaries, create_session, get_session, revoke_all_sessions, revoke_session, rotate_session, sanitized_identity
from auth.store import authenticate_user, find_user_by_email, list_sanitized_users

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginPayload(BaseModel):
    email: str
    password: str


@router.post("/login")
async def login(payload: LoginPayload, request: Request, response: Response) -> dict:
    validate_origin(request)
    ip = request.client.host if request.client else ""
    email = payload.email.strip().lower()
    if is_limited(email, ip):
        raise HTTPException(status_code=429, detail="Login temporarily unavailable")
    user = authenticate_user(email, payload.password)
    if not user or user.disabled:
        record_failure(email, ip)
        record_auth_event("login_failure", result="failed", reason="invalid_credentials", ip=ip, user_agent=request.headers.get("user-agent", ""))
        raise HTTPException(status_code=401, detail="Invalid email or password")
    reset_failures(email, ip)
    token, session = create_session(user)
    set_session_cookie(response, token)
    record_auth_event("login_success", user_id=user.user_id, session_id=token, role=user.role, ip=ip, user_agent=request.headers.get("user-agent", ""))
    return sanitized_identity(session)


@router.get("/me")
async def me(request: Request) -> dict:
    session = require_authenticated_user(request)
    return sanitized_identity(session) | {"environment": get_auth_settings().environment}


@router.post("/logout")
async def logout(request: Request, response: Response) -> dict:
    session = require_authenticated_user(request)
    validate_csrf(request, session)
    revoke_session(session_cookie(request), reason="logout")
    clear_session_cookie(response)
    record_auth_event("logout", user_id=session.user_id, role=session.role)
    return {"ok": True, "session_status": "revoked"}


@router.post("/session/refresh")
async def refresh_session(request: Request, response: Response) -> dict:
    session = require_authenticated_user(request)
    validate_csrf(request, session)
    rotated = rotate_session(session_cookie(request))
    if not rotated:
        raise HTTPException(status_code=401, detail="Authentication required")
    token, new_session = rotated
    set_session_cookie(response, token)
    record_auth_event("session_refreshed", user_id=new_session.user_id, session_id=token, role=new_session.role)
    return sanitized_identity(new_session)


@router.post("/session/revoke")
async def revoke_current_session(request: Request, response: Response) -> dict:
    session = require_authenticated_user(request)
    validate_csrf(request, session)
    revoke_session(session_cookie(request), reason="self_revoke")
    clear_session_cookie(response)
    return {"ok": True, "session_status": "revoked"}


@router.post("/session/revoke-all")
async def revoke_all_for_user(
    request: Request,
    response: Response,
    session=Depends(require_permission("bos.identity.manage")),
) -> dict:
    validate_csrf(request, session)
    count = revoke_all_sessions(session.user_id)
    clear_session_cookie(response)
    return {"ok": True, "revoked_count": count}


@router.get("/audit")
async def audit_events(session=Depends(require_permission("bos.identity.read"))) -> dict:
    return {"events": recent_auth_events(), "viewer_role": session.role}


@router.get("/readiness")
async def readiness() -> dict:
    config = validate_auth_configuration()
    deductions = []
    if config["blockers"]:
        deductions.append({"points": 100, "reason": "production auth configuration blocker"})
    score = max(0, 100 - sum(item["points"] for item in deductions))
    return {
        "name": "SHS Production Authentication & Identity Hardening V1",
        "score": score,
        "ready": score >= 90 and not config["blockers"],
        "configuration": config,
        "rate_limit": rate_limit_status(),
        "active_sessions": active_session_summaries(),
    }


@router.get("/route-access-matrix")
async def route_matrix(session=Depends(require_permission("bos.identity.read"))) -> dict:
    return {"routes": route_access_matrix(), "viewer_role": session.role}


@router.get("/permission-matrix")
async def permission_matrix(session=Depends(require_permission("bos.identity.read"))) -> dict:
    return {
        "roles": ROLE_PERMISSION_MAP,
        "permissions": list(PERMISSIONS),
        "viewer_role": session.role,
    }


@router.get("/users")
async def users(session=Depends(require_permission("bos.identity.read"))) -> dict:
    return {"users": list_sanitized_users(), "viewer_role": session.role}


@router.get("/decision-preview")
async def decision_preview(route: str, role: str = ROLE_SHS_ADMIN) -> dict:
    matrix = route_access_matrix()
    selected = next((item for item in matrix if item["route"] == route), None)
    allowed = bool(selected and role == selected["required_role"])
    user = find_user_by_email("shs@demo.shs")
    return {
        "route": route,
        "role": role,
        "allowed": allowed,
        "source": "server_policy_preview",
        "demo_user_available": bool(user),
    }

