from __future__ import annotations

from fastapi import HTTPException, Request

from auth.config import get_auth_settings
from auth.sessions import AuthSession

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


def validate_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    if not origin:
        return
    if origin not in get_auth_settings().allowed_origins:
        raise HTTPException(status_code=403, detail="Origin is not allowed")


def validate_csrf(request: Request, session: AuthSession) -> None:
    if request.method.upper() in SAFE_METHODS:
        return
    validate_origin(request)
    header_name = get_auth_settings().csrf_header_name
    supplied = request.headers.get(header_name)
    if not supplied or supplied != session.csrf_token:
        raise HTTPException(status_code=403, detail="CSRF token is invalid")

