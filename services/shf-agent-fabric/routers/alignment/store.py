from __future__ import annotations

from typing import Dict

from .models import AppManifest
from fabric.registry_canon import (
    load_registry as canon_load_registry,
    upsert_entity,
)

def _is_app_entity(v: dict) -> bool:
    # tolerate either key name while the schema stabilizes
    t = (v.get("type") or v.get("kind") or "").strip().lower()
    return t == "app"

def load_registry() -> Dict[str, AppManifest]:
    """
    Alignment store is now a VIEW over the canonical registry contract.
    No direct file I/O allowed here.
    """
    raw = canon_load_registry() or {}
    out: Dict[str, AppManifest] = {}
    for k, v in raw.items():
        if isinstance(v, dict) and _is_app_entity(v):
            out[k] = AppManifest(**v)
    return out

def save_registry(reg: Dict[str, AppManifest]) -> None:
    """
    Writes go through registry_canon (evented + hashed).
    """
    for k, v in reg.items():
        payload = v.model_dump() if hasattr(v, "model_dump") else dict(v)  # pydantic v2 vs fallback
        if not _is_app_entity(payload):
            payload["type"] = "app"
        upsert_entity(entity_id=k, entity=payload)

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
    # optional in canon: only update if present locally
    reg = load_registry()
    if app_id in reg:
        # keep behavior: update timestamp field if your model has it
        if hasattr(reg[app_id], "last_seen_at"):
            from datetime import datetime, timezone
            reg[app_id].last_seen_at = datetime.now(timezone.utc).isoformat()
        save_registry(reg)
