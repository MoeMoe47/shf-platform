from __future__ import annotations

import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from auth.audit import record_auth_event, safe_hash
from auth.config import get_auth_settings
from auth.permissions import permissions_for_role
from auth.store import AuthUser


@dataclass
class AuthSession:
    token_hash: str
    user_id: str
    email: str
    display_name: str
    role: str
    csrf_token: str
    issued_at: datetime
    expires_at: datetime
    idle_expires_at: datetime
    last_seen_at: datetime
    last_authenticated_at: datetime
    revoked: bool = False


_SESSIONS: dict[str, AuthSession] = {}


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.replace(microsecond=0).isoformat()


def _hash_token(token: str) -> str:
    return safe_hash(token)


def create_session(user: AuthUser) -> tuple[str, AuthSession]:
    settings = get_auth_settings()
    token = secrets.token_urlsafe(40)
    issued = now_utc()
    session = AuthSession(
        token_hash=_hash_token(token),
        user_id=user.user_id,
        email=user.email,
        display_name=user.display_name,
        role=user.role,
        csrf_token=secrets.token_urlsafe(24),
        issued_at=issued,
        expires_at=issued + timedelta(minutes=settings.absolute_minutes),
        idle_expires_at=issued + timedelta(minutes=settings.idle_minutes),
        last_seen_at=issued,
        last_authenticated_at=issued,
    )
    _SESSIONS[session.token_hash] = session
    record_auth_event("session_created", user_id=user.user_id, session_id=token, role=user.role)
    return token, session


def get_session(token: str | None) -> AuthSession | None:
    if not token:
        return None
    session = _SESSIONS.get(_hash_token(token))
    if not session:
        return None
    current = now_utc()
    if session.revoked:
        return None
    if current >= session.expires_at or current >= session.idle_expires_at:
        session.revoked = True
        record_auth_event("session_expired", user_id=session.user_id, session_id=token, role=session.role)
        return None
    session.last_seen_at = current
    session.idle_expires_at = current + timedelta(minutes=get_auth_settings().idle_minutes)
    return session


def rotate_session(token: str | None) -> tuple[str, AuthSession] | None:
    old = get_session(token)
    if not old:
        return None
    old.revoked = True
    user = AuthUser(
        user_id=old.user_id,
        email=old.email,
        display_name=old.display_name,
        role=old.role,
        password_hash="",
        disabled=False,
    )
    new_token, session = create_session(user)
    record_auth_event("session_rotated", user_id=session.user_id, session_id=new_token, role=session.role)
    return new_token, session


def revoke_session(token: str | None, reason: str = "revoked") -> bool:
    if not token:
        return False
    session = _SESSIONS.get(_hash_token(token))
    if not session:
        return False
    session.revoked = True
    record_auth_event("session_revoked", user_id=session.user_id, session_id=token, role=session.role, reason=reason)
    return True


def revoke_all_sessions(user_id: str, reason: str = "all_sessions_revoked") -> int:
    count = 0
    for session in _SESSIONS.values():
        if session.user_id == user_id and not session.revoked:
            session.revoked = True
            count += 1
            record_auth_event("all_sessions_revoked", user_id=user_id, session_id=session.token_hash, role=session.role, reason=reason)
    return count


def sanitized_identity(session: AuthSession) -> dict:
    permissions = permissions_for_role(session.role)
    return {
        "authenticated": True,
        "user_id": session.user_id,
        "email": session.email,
        "display_name": session.display_name,
        "role": session.role,
        "permissions": permissions,
        "session_id": session.token_hash,
        "session_status": "active",
        "issued_at": iso(session.issued_at),
        "expires_at": iso(session.expires_at),
        "idle_expires_at": iso(session.idle_expires_at),
        "last_authenticated_at": iso(session.last_authenticated_at),
        "reauth_required": False,
        "csrf_token": session.csrf_token,
        "user": {
            "id": session.user_id,
            "email": session.email,
            "name": session.display_name,
            "role": session.role,
        },
        "memberships": [
            {
                "organization_id": "shs-bos",
                "organization_type": "internal_operations",
                "role": session.role,
                "role_name": session.role,
            }
        ],
    }


def active_session_summaries() -> list[dict]:
    current = now_utc()
    items = []
    for session in _SESSIONS.values():
        status = "revoked" if session.revoked else "active"
        if not session.revoked and (current >= session.expires_at or current >= session.idle_expires_at):
            status = "expired"
        items.append(
            {
                "session_id": session.token_hash,
                "user_id": session.user_id,
                "email": session.email,
                "role": session.role,
                "status": status,
                "issued_at": iso(session.issued_at),
                "expires_at": iso(session.expires_at),
                "last_seen_at": iso(session.last_seen_at),
            }
        )
    return items

