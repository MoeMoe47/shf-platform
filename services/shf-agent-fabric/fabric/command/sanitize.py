from __future__ import annotations

"""
Safe-output boundary for Agent Fabric Command Center read projections.

Projections are built from structured fields and reason codes. This module is
the last line of defence before a projection leaves the service: it drops keys
that must never reach a browser and redacts any string that looks like a
filesystem path, traceback, exception text, secret, or environment value.
"""

import re
from typing import Any

# Keys that are never emitted, at any depth.
BLOCKED_KEYS = frozenset(
    {
        "path",
        "paths",
        "stdout",
        "stderr",
        "stdout_tail",
        "stderr_tail",
        "traceback",
        "exception",
        "error",
        "baseUrl",
        "base_url",
        "secret",
        "secrets",
        "token",
        "tokens",
        "password",
        "key",
        "keys",
        "keyring",
        "kid",
        "kids",
        "active_kid",
        "env",
        "environ",
        "command",
        "cmd",
        "args",
        "payload_json",
        "material_preview",
    }
)

REDACTED = "[redacted]"

_UNSAFE_PATTERNS = (
    # Absolute POSIX paths with at least two segments, Windows drive paths, home-relative paths.
    re.compile(r"(?<![\w:])/(?:[\w.@+-]+/)+[\w.@+-]*"),
    re.compile(r"\b[A-Za-z]:\\"),
    re.compile(r"~/"),
    # Tracebacks and exception text.
    re.compile(r"Traceback \(most recent call last\)"),
    re.compile(r"\bFile \""),
    re.compile(r"\b[A-Z][A-Za-z]*(?:Error|Exception)\b"),
    # Secrets / env assignments / bearer tokens / long hex or base64 blobs.
    re.compile(r"(?i)\b(?:secret|password|passwd|api[_-]?key|admin[_-]?key|hmac|token|keyring)\b\s*[:=]"),
    re.compile(r"(?i)\bbearer\s+[\w.-]+"),
    re.compile(r"\b[A-Z][A-Z0-9_]{2,}=\S+"),
    re.compile(r"\b[a-fA-F0-9]{40,}\b"),
    re.compile(r"\b[A-Za-z0-9+/]{48,}={0,2}"),
)

_REASON_CODE = re.compile(r"^[A-Z][A-Z0-9_]{1,63}$")


def is_unsafe_text(value: str) -> bool:
    return any(p.search(value) for p in _UNSAFE_PATTERNS)


def safe_text(value: str) -> str:
    return REDACTED if is_unsafe_text(value) else value


def safe_reason_code(value: Any, default: str = "UNSPECIFIED") -> str:
    """Reason codes are UPPER_SNAKE identifiers; anything else collapses to `default`."""
    text = str(value or "").strip()
    return text if _REASON_CODE.match(text) else default


# Evidence hashes are shown as recorded. Only these keys, and only an exact
# 64-hex SHA-256 value, are exempt from the long-hex redaction rule.
HASH_KEYS = frozenset({"sha256", "snapshotSha256", "snapshot_sha256"})
_SHA256 = re.compile(r"^[a-fA-F0-9]{64}$")


def _sanitize_item(key: str, value: Any) -> Any:
    if key in HASH_KEYS and isinstance(value, str) and _SHA256.match(value):
        return value
    return sanitize(value)


def sanitize(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(k): _sanitize_item(str(k), v) for k, v in value.items() if str(k) not in BLOCKED_KEYS}
    if isinstance(value, (list, tuple)):
        return [sanitize(v) for v in value]
    if isinstance(value, str):
        return safe_text(value)
    if value is None or isinstance(value, (bool, int, float)):
        return value
    return REDACTED
