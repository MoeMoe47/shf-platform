from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
REGISTRY_DIR = ROOT / "registry"

def _load_agents() -> dict[str, dict[str, Any]]:
    agents: dict[str, dict[str, Any]] = {}
    if not REGISTRY_DIR.exists():
        return agents

    for p in sorted(REGISTRY_DIR.glob("*.json")):
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue

        name = data.get("name")
        if not name:
            continue

        agent_id = data.get("agentId") or data.get("id") or data.get("agent_id")
        layer = data.get("layer")
        policy = data.get("policy") or {}

        agents[name] = {
            "name": name,
            "agentId": agent_id,
            "layer": layer,
            "policy": {
                "humanApproval": bool(policy.get("humanApproval", True)),
                "maxSteps": int(policy.get("maxSteps", 6)),
                "notes": str(policy.get("notes", "")),
            },
            "raw": data,
            "source": str(p),
        }

    return agents

AGENTS = _load_agents()

def list_agents() -> list[dict[str, Any]]:
    return [
        {
            "name": a["name"],
            "agentId": a.get("agentId"),
            "layer": a.get("layer"),
            "policy": a.get("policy", {"humanApproval": True, "maxSteps": 6, "notes": ""}),
        }
        for a in AGENTS.values()
    ]

def get_agent_by_name(name: str) -> dict[str, Any] | None:
    return AGENTS.get(name)

def find_agent_by_name(name: str) -> dict[str, Any] | None:
    return AGENTS.get(name)
