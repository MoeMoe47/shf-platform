from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from services.truth_pipeline.models import utc_now

STORE_DIR = Path(__file__).resolve().parent / "runtime_state"
STATE_PATH = STORE_DIR / "state.json"


def _empty_state() -> dict[str, Any]:
    return {
        "schema_version": "shs.truth_pipeline.store.v1",
        "updated_at": utc_now(),
        "source_claims": [],
        "aggregations": [],
        "entity_resolutions": [],
        "verifications": [],
        "reconciliations": [],
        "truth_packages": [],
        "report_readiness": [],
        "action_events": [],
        "recompute_results": [],
        "tracking_events": [],
        "audit_records": [],
        "failure_records": [],
        "transition_results": [],
        "runtime_gate_results": [],
        "dead_letters": [],
    }


def ensure_store() -> None:
    STORE_DIR.mkdir(parents=True, exist_ok=True)
    if not STATE_PATH.exists():
        write_state(_empty_state())


def read_state() -> dict[str, Any]:
    ensure_store()
    try:
        data = json.loads(STATE_PATH.read_text(encoding="utf-8") or "{}")
    except json.JSONDecodeError:
        data = {}
    if not isinstance(data, dict):
        return _empty_state()
    state = _empty_state()
    state.update(data)
    return state


def write_state(state: dict[str, Any]) -> dict[str, Any]:
    STORE_DIR.mkdir(parents=True, exist_ok=True)
    state = dict(state)
    state["updated_at"] = utc_now()
    STATE_PATH.write_text(json.dumps(state, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return state


def replace_collection(collection: str, records: list[dict[str, Any]]) -> dict[str, Any]:
    state = read_state()
    state[collection] = records
    return write_state(state)
