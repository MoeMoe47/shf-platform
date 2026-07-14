from __future__ import annotations

from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

from auth.audit import record_auth_event

_FAILURES: dict[str, deque[datetime]] = defaultdict(deque)
WINDOW_SECONDS = 60
MAX_FAILURES = 6


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _key(email: str, ip: str) -> str:
    return f"{str(email or '').strip().lower()}|{ip or 'unknown'}"


def is_limited(email: str, ip: str) -> bool:
    key = _key(email, ip)
    cutoff = _now() - timedelta(seconds=WINDOW_SECONDS)
    bucket = _FAILURES[key]
    while bucket and bucket[0] < cutoff:
        bucket.popleft()
    return len(bucket) >= MAX_FAILURES


def record_failure(email: str, ip: str) -> None:
    key = _key(email, ip)
    _FAILURES[key].append(_now())
    if is_limited(email, ip):
        record_auth_event("rate_limit_triggered", result="blocked", reason="login_failure_threshold", ip=ip)


def reset_failures(email: str, ip: str) -> None:
    _FAILURES.pop(_key(email, ip), None)


def rate_limit_status() -> dict:
    return {"window_seconds": WINDOW_SECONDS, "max_failures": MAX_FAILURES, "tracked_keys": len(_FAILURES)}

