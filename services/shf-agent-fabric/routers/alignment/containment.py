from __future__ import annotations
import json, os
from datetime import datetime, timezone
from typing import Dict, Any

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
FLAGS_PATH = os.getenv("ALIGN_CONTAINMENT_PATH", os.path.join(BASE_DIR, "db", "alignment", "containment_flags.json"))

def _now_iso():
    return datetime.now(timezone.utc).isoformat()

def load_flags() -> Dict[str, Any]:
    if not os.path.exists(FLAGS_PATH):
        return {"apps": {}, "agents": {"blocked": []}, "capabilities": {"blocked": []}}
    with open(FLAGS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def save_flags(flags: Dict[str, Any]) -> None:
    os.makedirs(os.path.dirname(FLAGS_PATH), exist_ok=True)
    with open(FLAGS_PATH, "w", encoding="utf-8") as f:
        json.dump(flags, f, indent=2)
        f.write("\n")

def get_l26_effect(app_id: str, requested_agents: list[str], requested_caps: list[str]) -> Dict[str, Any]:
    flags = load_flags()
    forced_app_state = flags.get("apps", {}).get(app_id)
    blocked_agents = set(flags.get("agents", {}).get("blocked", []))
    blocked_caps = set(flags.get("capabilities", {}).get("blocked", []))
    return {
        "forced_app_state": forced_app_state,
        "blocked_agents_now": [a for a in requested_agents if a in blocked_agents],
        "blocked_caps_now": [c for c in requested_caps if c in blocked_caps],
        "checked_at": _now_iso(),
    }

def force_app_state(app_id: str, state: str):
    flags = load_flags()
    flags.setdefault("apps", {})[app_id] = state
    save_flags(flags)

def clear_forced_app_state(app_id: str):
    flags = load_flags()
    flags.get("apps", {}).pop(app_id, None)
    save_flags(flags)
