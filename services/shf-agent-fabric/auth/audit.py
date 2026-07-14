from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timezone

from auth.config import environment

_EVENTS: list[dict] = []


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def safe_hash(value: str | None) -> str:
    if not value:
        return ""
    return hashlib.sha256(str(value).encode("utf-8")).hexdigest()[:24]


def record_auth_event(
    event_type: str,
    *,
    user_id: str = "",
    session_id: str = "",
    route: str = "",
    method: str = "",
    result: str = "allowed",
    reason: str = "",
    role: str = "",
    permission: str = "",
    ip: str = "",
    user_agent: str = "",
    metadata: dict | None = None,
) -> dict:
    event = {
        "auth_event_id": f"auth_evt_{secrets.token_hex(8)}",
        "event_type": event_type,
        "user_id": user_id,
        "session_id_hash": safe_hash(session_id),
        "route": route,
        "method": method,
        "result": result,
        "reason": reason,
        "role": role,
        "permission": permission,
        "ip_hash": safe_hash(ip),
        "user_agent_hash": safe_hash(user_agent),
        "timestamp": utc_now(),
        "environment": environment(),
        "metadata": metadata or {},
    }
    _EVENTS.append(event)
    del _EVENTS[:-200]
    return event


def recent_auth_events(limit: int = 50) -> list[dict]:
    return list(reversed(_EVENTS[-limit:]))

