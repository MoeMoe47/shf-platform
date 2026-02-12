from __future__ import annotations
import json, os
from datetime import datetime, timezone
from typing import Dict
from .models import AppManifest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
REGISTRY_PATH = os.path.join(BASE_DIR, "contracts", "registry", "registry.json")

def _now_iso():
    return datetime.now(timezone.utc).isoformat()

def load_registry() -> Dict[str, AppManifest]:
    if not os.path.exists(REGISTRY_PATH):
        return {}
    with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)
    out: Dict[str, AppManifest] = {}
    for k, v in raw.items():
        out[k] = AppManifest(**v)
    return out

def save_registry(reg: Dict[str, AppManifest]) -> None:
    os.makedirs(os.path.dirname(REGISTRY_PATH), exist_ok=True)
    raw = {k: v.model_dump() for k, v in reg.items()}
    with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(raw, f, indent=2)
        f.write("\n")

def get_app(app_id: str) -> AppManifest | None:
    return load_registry().get(app_id)

def set_app_state(app_id: str, state: str) -> AppManifest:
    reg = load_registry()
    if app_id not in reg:
        raise KeyError(app_id)
    reg[app_id].swarm.state = state
    save_registry(reg)
    return reg[app_id]

def touch_last_seen(app_id: str) -> None:
    reg = load_registry()
    if app_id in reg:
        reg[app_id].last_seen_at = _now_iso()
        save_registry(reg)
