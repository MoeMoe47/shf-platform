from __future__ import annotations

from fastapi import Response

from auth.config import get_auth_settings


def set_session_cookie(response: Response, token: str) -> None:
    settings = get_auth_settings()
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/",
        max_age=settings.absolute_minutes * 60,
    )


def clear_session_cookie(response: Response) -> None:
    settings = get_auth_settings()
    response.delete_cookie(
        key=settings.cookie_name,
        path="/",
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )

