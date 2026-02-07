from __future__ import annotations

import json
from threading import Lock
from typing import Any, Dict, Optional

from fabric.events.schema import normalize_event
from .config import ensure_db, EVENTS_JSONL, APP_ID

_lock = Lock()


def emit(
    action: str,
    *,
    actor_type: str = "system",
    context: Optional[Dict[str, Any]] = None,
    metrics: Optional[Dict[str, Any]] = None,
    flags: Optional[Dict[str, Any]] = None,
    outcome: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Append-only event emission using canonical normalize_event().
    Writes: db/arena/arena_events.jsonl
    """
    ensure_db()

    raw = {
        "actor_type": actor_type,
        "action": action,
        "context": {"app_id": APP_ID, **(context or {})},
        "metrics": metrics or {},
        "flags": flags or {},
    }
    if outcome:
        raw["outcome"] = outcome

    e = normalize_event(raw)
    line = json.dumps(e, separators=(",", ":"), ensure_ascii=False)

    with _lock:
        with EVENTS_JSONL.open("a", encoding="utf-8") as f:
            f.write(line + "\n")

    return e
