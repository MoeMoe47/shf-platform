from __future__ import annotations

from fastapi import HTTPException, Request

from auth.audit import record_auth_event
from auth.config import get_auth_settings
from auth.csrf import validate_csrf
from auth.permissions import has_any_permission, has_permission, normalize_role
from auth.sessions import AuthSession, get_session


def session_cookie(request: Request) -> str:
    return request.cookies.get(get_auth_settings().cookie_name, "")


def require_authenticated_user(request: Request) -> AuthSession:
    session = get_session(session_cookie(request))
    if not session:
        record_auth_event(
            "access_denied",
            route=request.url.path,
            method=request.method,
            result="denied",
            reason="missing_or_invalid_session",
            ip=request.client.host if request.client else "",
            user_agent=request.headers.get("user-agent", ""),
        )
        raise HTTPException(status_code=401, detail="Authentication required")
    return session


def require_role(*roles: str):
    allowed = {normalize_role(role) for role in roles}

    def dependency(request: Request) -> AuthSession:
        session = require_authenticated_user(request)
        if normalize_role(session.role) not in allowed:
            record_auth_event("role_check_failed", user_id=session.user_id, route=request.url.path, method=request.method, result="denied", role=session.role)
            raise HTTPException(status_code=403, detail="Forbidden")
        return session

    return dependency


def require_permission(permission: str):
    def dependency(request: Request) -> AuthSession:
        session = require_authenticated_user(request)
        if not has_permission(session.role, permission):
            record_auth_event(
                "permission_check_failed",
                user_id=session.user_id,
                route=request.url.path,
                method=request.method,
                result="denied",
                role=session.role,
                permission=permission,
            )
            raise HTTPException(status_code=403, detail="Forbidden")
        return session

    return dependency


def require_any_permission(*permissions: str):
    def dependency(request: Request) -> AuthSession:
        session = require_authenticated_user(request)
        if not has_any_permission(session.role, permissions):
            raise HTTPException(status_code=403, detail="Forbidden")
        return session

    return dependency


def require_recent_authentication(request: Request) -> AuthSession:
    session = require_authenticated_user(request)
    validate_csrf(request, session)
    return session


def optional_identity(request: Request) -> AuthSession | None:
    return get_session(session_cookie(request))

