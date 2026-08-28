from __future__ import annotations

import json
import logging
import threading
from datetime import datetime, timezone
from typing import Any, Callable

LOGGER = logging.getLogger(__name__)
SAFE_METADATA_KEYS = {"request_id", "correlation_id", "route_class", "outcome", "reason", "count", "status_code", "limiter_class", "migration_state", "threshold", "observed", "worker_state", "component", "producer_reference", "event_class", "backend", "duration_ms"}
_lock = threading.Lock()
_counters: dict[str, int] = {}
_sink: Callable[[dict[str, Any]], None] = lambda event: LOGGER.info(json.dumps(event, sort_keys=True))


def _safe_metadata(metadata: dict[str, Any] | None) -> dict[str, Any]:
    return {key: value for key, value in (metadata or {}).items() if key in SAFE_METADATA_KEYS and (value is None or isinstance(value, (str, int, float, bool)))}


def set_operational_telemetry_sink(sink: Callable[[dict[str, Any]], None] | None) -> None:
    global _sink
    _sink = sink or (lambda event: LOGGER.info(json.dumps(event, sort_keys=True)))


def emit_operational_telemetry(*, event_name: str, severity: str, component: str, category: str, outcome: str, metadata: dict[str, Any] | None = None) -> dict[str, Any]:
    event = {"event_name": event_name, "severity": severity, "component": component, "category": category, "timestamp": datetime.now(timezone.utc).isoformat(), "outcome": outcome, "metadata": _safe_metadata(metadata)}
    with _lock:
        key = f"{component}:{event_name}:{outcome}"
        _counters[key] = _counters.get(key, 0) + 1
    try:
        _sink(event)
    except Exception:
        LOGGER.error("operational_telemetry_sink_failure")
    return event


def operational_telemetry_snapshot() -> dict[str, int]:
    with _lock:
        return dict(_counters)


def reset_operational_telemetry_for_tests() -> None:
    with _lock:
        _counters.clear()
    set_operational_telemetry_sink(None)
