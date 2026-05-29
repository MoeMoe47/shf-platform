from __future__ import annotations

import json
from pathlib import Path
from datetime import datetime, timezone
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DB_DIR = ROOT / "db"
DB_DIR.mkdir(parents=True, exist_ok=True)

# Stores enable/disable overrides for agents and layers
# - disabled agents: { "agent:<agentId>": {enabled:false, ts, reason?, gov_approval?} }
# - disabled layers: { "layer:L02": {enabled:false, ts, reason?, gov_approval?} }
OVERRIDES_PATH = DB_DIR / "agent_store_overrides.json"

# Append-only gate history (auditor-friendly, last-N retrievable)
GATE_HISTORY_PATH = DB_DIR / "gate_history.jsonl"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _read() -> dict[str, Any]:
    if not OVERRIDES_PATH.exists():
        return {"schema_version": "1.0", "overrides": {}}
    try:
        data = json.loads(OVERRIDES_PATH.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            return {"schema_version": "1.0", "overrides": {}}
        if "overrides" not in data or not isinstance(data.get("overrides"), dict):
            data["overrides"] = {}
        if "schema_version" not in data:
            data["schema_version"] = "1.0"
        return data
    except Exception:
        return {"schema_version": "1.0", "overrides": {}}


def _write(data: dict[str, Any]) -> None:
    OVERRIDES_PATH.parent.mkdir(parents=True, exist_ok=True)
    OVERRIDES_PATH.write_text(
        json.dumps(data, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def _key_agent(agent_id: str) -> str:
    return f"agent:{agent_id}"


def _key_layer(layer_key: str) -> str:
    return f"layer:{layer_key}"


# -------------------------
# Agent enable/disable
# -------------------------
def is_agent_enabled(agent_id: str) -> bool:
    data = _read()
    ov = (data.get("overrides") or {}).get(_key_agent(agent_id))
    if not isinstance(ov, dict):
        return True
    return bool(ov.get("enabled", True))


def set_agent_enabled(
    agent_id: str,
    enabled: bool,
    *,
    reason: str | None = None,
    gov_approval: str | None = None,
) -> bool:
    data = _read()
    overrides: dict[str, Any] = data.setdefault("overrides", {})
    overrides[_key_agent(agent_id)] = {
        "enabled": bool(enabled),
        "ts": _now_iso(),
        "reason": reason,
        "gov_approval": gov_approval,
    }
    _write(data)
    return bool(enabled)


def list_disabled_agents() -> list[dict[str, Any]]:
    data = _read()
    out: list[dict[str, Any]] = []
    for k, v in (data.get("overrides") or {}).items():
        if not isinstance(k, str) or not k.startswith("agent:"):
            continue
        if not isinstance(v, dict):
            continue
        if v.get("enabled", True) is False:
            out.append({"agentId": k.split("agent:", 1)[1], **v})
    return out


# -------------------------
# Layer enable/disable
# -------------------------
def is_layer_enabled(layer_key: str) -> bool:
    data = _read()
    ov = (data.get("overrides") or {}).get(_key_layer(layer_key))
    if not isinstance(ov, dict):
        return True
    return bool(ov.get("enabled", True))


def set_layer_enabled(
    layer_key: str,
    enabled: bool,
    *,
    reason: str | None = None,
    gov_approval: str | None = None,
) -> bool:
    data = _read()
    overrides: dict[str, Any] = data.setdefault("overrides", {})
    overrides[_key_layer(layer_key)] = {
        "enabled": bool(enabled),
        "ts": _now_iso(),
        "reason": reason,
        "gov_approval": gov_approval,
    }
    _write(data)
    return bool(enabled)


def get_layer_disable_meta(layer_key: str) -> dict[str, Any] | None:
    data = _read()
    ov = (data.get("overrides") or {}).get(_key_layer(layer_key))
    if not isinstance(ov, dict):
        return None
    if ov.get("enabled", True) is False:
        return ov
    return None


def list_disabled_layers() -> list[dict[str, Any]]:
    data = _read()
    out: list[dict[str, Any]] = []
    for k, v in (data.get("overrides") or {}).items():
        if not isinstance(k, str) or not k.startswith("layer:"):
            continue
        if not isinstance(v, dict):
            continue
        if v.get("enabled", True) is False:
            out.append({"layer": k.split("layer:", 1)[1], **v})
    return out


# -------------------------
# Gate history (append-only)
# -------------------------
def append_gate_history(event: dict[str, Any]) -> None:
    try:
        payload = dict(event)
        payload.setdefault("ts", _now_iso())
        line = json.dumps(payload, sort_keys=True)
        with GATE_HISTORY_PATH.open("a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        # Never block the system because history logging failed
        return


def list_gate_history(limit: int = 50) -> list[dict[str, Any]]:
    if limit <= 0:
        return []
    if not GATE_HISTORY_PATH.exists():
        return []
    try:
        lines = GATE_HISTORY_PATH.read_text(encoding="utf-8").splitlines()
        tail = lines[-limit:]
        out: list[dict[str, Any]] = []
        for ln in reversed(tail):
            try:
                v = json.loads(ln)
                if isinstance(v, dict):
                    out.append(v)
            except Exception:
                continue
        return out
    except Exception:
        return []
