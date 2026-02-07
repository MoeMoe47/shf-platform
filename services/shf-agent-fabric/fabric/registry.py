from __future__ import annotations

import json
from pathlib import Path
from threading import Lock
from typing import Any, Tuple

ROOT = Path(__file__).resolve().parents[1]
REGISTRY_DIR = ROOT / "registry"

_lock = Lock()
AGENTS: dict[str, dict[str, Any]] = {}

def _coerce_policy(policy: dict | None) -> dict[str, Any]:
    policy = policy or {}
    return {
        "humanApproval": bool(policy.get("humanApproval", True)),
        "maxSteps": int(policy.get("maxSteps", 6)),
        "notes": str(policy.get("notes", "")),
    }

def _extract_identity(data: dict[str, Any]) -> Tuple[str | None, str | None]:
    name = data.get("name")
    agent_id = data.get("agentId") or data.get("id") or data.get("agent_id")
    return (name, agent_id)

def _load_agents() -> dict[str, dict[str, Any]]:
    agents: dict[str, dict[str, Any]] = {}
    if not REGISTRY_DIR.exists():
        return agents

    for p in sorted(REGISTRY_DIR.glob("*.json")):
        try:
            raw = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        if not isinstance(raw, dict):
            continue

        name, agent_id = _extract_identity(raw)
        if not name:
            continue

        layer = raw.get("layer")
        policy = _coerce_policy(raw.get("policy") if isinstance(raw.get("policy"), dict) else {})

        agents[name] = {
            "name": name,
            "agentId": agent_id,
            "layer": layer,
            "policy": policy,
            "raw": raw,
            "source": str(p),
        }

    return agents

def reload_agents() -> dict[str, Any]:
    global AGENTS
    with _lock:
        AGENTS = _load_agents()
        return {"ok": True, "count": len(AGENTS)}

def list_agents(include_meta: bool = False) -> list[dict[str, Any]]:
    with _lock:
        out = []
        for a in AGENTS.values():
            base = {
                "name": a["name"],
                "agentId": a.get("agentId"),
                "layer": a.get("layer"),
                "policy": a.get("policy", {"humanApproval": True, "maxSteps": 6, "notes": ""}),
            }
            if include_meta:
                base["source"] = a.get("source")
            out.append(base)
        return out

def get_agent_by_name(name: str) -> dict[str, Any] | None:
    with _lock:
        return AGENTS.get(name)

def find_agent_by_name(name: str) -> dict[str, Any] | None:
    return get_agent_by_name(name)

def validate_agent_spec(spec: dict[str, Any]) -> Tuple[bool, str]:
    if not isinstance(spec, dict):
        return (False, "spec must be an object")
    name = spec.get("name")
    if not name or not isinstance(name, str):
        return (False, "missing or invalid 'name'")
    if "/" in name or "\\" in name or ".." in name:
        return (False, "invalid 'name' (path-like)")
    policy = spec.get("policy", {})
    if policy is not None and not isinstance(policy, dict):
        return (False, "'policy' must be an object if provided")
    if isinstance(policy, dict) and "maxSteps" in policy:
        try:
            ms = int(policy.get("maxSteps"))
            if ms < 1 or ms > 50:
                return (False, "policy.maxSteps out of range (1..50)")
        except Exception:
            return (False, "policy.maxSteps must be an integer")
    return (True, "ok")

def write_agent_spec(spec: dict[str, Any]) -> dict[str, Any]:
    ok, msg = validate_agent_spec(spec)
    if not ok:
        return {"ok": False, "error": msg}

    name = spec["name"].strip()
    REGISTRY_DIR.mkdir(parents=True, exist_ok=True)
    path = REGISTRY_DIR / f"{name}.json"

    path.write_text(json.dumps(spec, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    reload_agents()

    return {"ok": True, "name": name, "path": str(path)}

reload_agents()
