from __future__ import annotations

import os
from dataclasses import dataclass


LOCAL_ORIGINS = (
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
)


def env_flag(name: str, default: str = "0") -> bool:
    return os.getenv(name, default).strip().lower() in {"1", "true", "yes", "on"}


def environment() -> str:
    return os.getenv("SHS_AUTH_ENV", os.getenv("ENVIRONMENT", "development")).strip().lower()


def is_production() -> bool:
    return environment() == "production"


@dataclass(frozen=True)
class AuthSettings:
    environment: str
    cookie_name: str
    cookie_secure: bool
    cookie_samesite: str
    idle_minutes: int
    absolute_minutes: int
    demo_identity_enabled: bool
    allowed_origins: tuple[str, ...]
    csrf_header_name: str = "x-csrf-token"


def _int_env(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)).strip())
    except ValueError:
        return default


def get_allowed_origins() -> tuple[str, ...]:
    configured = [
        item.strip()
        for item in os.getenv("AUTH_ALLOWED_ORIGINS", "").split(",")
        if item.strip()
    ]
    if configured:
        return tuple(configured)
    if is_production():
        return ()
    return LOCAL_ORIGINS


def get_auth_settings() -> AuthSettings:
    env = environment()
    return AuthSettings(
        environment=env,
        cookie_name=os.getenv("AUTH_COOKIE_NAME", "shs_bos_session").strip() or "shs_bos_session",
        cookie_secure=env_flag("AUTH_COOKIE_SECURE", "1" if env == "production" else "0"),
        cookie_samesite=os.getenv("AUTH_COOKIE_SAMESITE", "lax").strip().lower() or "lax",
        idle_minutes=max(5, _int_env("AUTH_SESSION_IDLE_MINUTES", 60)),
        absolute_minutes=max(15, _int_env("AUTH_SESSION_ABSOLUTE_MINUTES", 480)),
        demo_identity_enabled=env_flag("AUTH_DEMO_IDENTITY_ENABLED", "0"),
        allowed_origins=get_allowed_origins(),
    )


def validate_auth_configuration() -> dict:
    settings = get_auth_settings()
    blockers: list[str] = []
    warnings: list[str] = []
    if settings.cookie_samesite not in {"lax", "strict", "none"}:
        blockers.append("AUTH_COOKIE_SAMESITE must be lax, strict, or none")
    if settings.absolute_minutes <= settings.idle_minutes:
        blockers.append("AUTH_SESSION_ABSOLUTE_MINUTES must exceed AUTH_SESSION_IDLE_MINUTES")
    if settings.environment == "production":
        if settings.demo_identity_enabled:
            blockers.append("AUTH_DEMO_IDENTITY_ENABLED is forbidden in production")
        if not settings.cookie_secure:
            blockers.append("AUTH_COOKIE_SECURE must be true in production")
        if not settings.allowed_origins:
            blockers.append("AUTH_ALLOWED_ORIGINS is required in production")
        if os.getenv("AUTH_TEST_USER_STORE_ENABLED", "0").strip() == "1":
            blockers.append("AUTH_TEST_USER_STORE_ENABLED is forbidden in production")
    else:
        if not settings.cookie_secure:
            warnings.append("development cookie secure flag is false for local HTTP compatibility")
    return {
        "ok": not blockers,
        "environment": settings.environment,
        "cookie_secure": settings.cookie_secure,
        "cookie_samesite": settings.cookie_samesite,
        "idle_minutes": settings.idle_minutes,
        "absolute_minutes": settings.absolute_minutes,
        "demo_identity_enabled": settings.demo_identity_enabled,
        "allowed_origin_count": len(settings.allowed_origins),
        "blockers": blockers,
        "warnings": warnings,
    }

