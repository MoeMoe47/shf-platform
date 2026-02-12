"""
Canonical Registry Authority

- Single source of truth for business/program registry
- Hash-stable, audit-safe
- Append-only event logging
- Enforced at startup via compliance gate

DO NOT bypass or duplicate registry logic elsewhere.
"""

from __future__ import annotations

import json
import os
import time
import hashlib
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from threading import Lock

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "db"

# ✅ CONTRACT PATH (Gate G / registry guard expects this exact pin)
REGISTRY_PATH = ROOT / "contracts/registry/registry.json"
EVENTS_PATH = DB / "registry_events.jsonl"

_lock = Lock()

ISO = "time"  # marker; we store epoch_ms and iso

# ---------------------------
# Helpers
# ---------------------------

def _now_epoch_ms() -> int:
    return int(time.time() * 1000)

def _now_iso() -> str:
    # lightweight ISO-ish UTC without importing datetime heavy paths
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

def _json_canon(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

def _sha256_text(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def entity_hash(entity: Dict[str, Any]) -> str:
    # hash everything except volatile keys that should not change hash meaningfully
    e = dict(entity)
    # keep timestamps in hash (legal/audit wants it), but exclude computed hash itself
    e.pop("hash", None)
    return _sha256_text(_json_canon(e))

def _read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8") or "")
    except Exception:
        return default



# ---------------------------
# Public API (Canon)
# ---------------------------

def load_registry() -> Dict[str, Any]:
    """
    Load the canonical registry from the contract path.

    Returns the full registry JSON object (dict). If missing or invalid, returns {}.
    """
    return _read_json(REGISTRY_PATH, default={})
def _write_json(path: Path, obj: Any):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def _registry_entities(reg: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Normalize registry JSON into a flat list of entity dicts.
    Supports either:
      - {"entities":[...]}  (preferred)
      - {"businesses":[...], "apps":[...]} (legacy-ish but tolerated)
      - { ...arbitrary... } (returns [])
    """
    if isinstance(reg, dict):
        if isinstance(reg.get("entities"), list):
            return [e for e in reg["entities"] if isinstance(e, dict)]
        out: List[Dict[str, Any]] = []
        for k in ("businesses", "apps"):
            v = reg.get(k)
            if isinstance(v, list):
                out.extend([e for e in v if isinstance(e, dict)])
        return out
    return []


def list_entities(kind: str | None = None) -> List[Dict[str, Any]]:
    """
    Return entities from the canonical registry, optionally filtered by kind/type.

    kind matches entity["kind"] or entity["type"] (case-insensitive).
    """
    reg = load_registry()
    ents = _registry_entities(reg)

    if not kind:
        return ents

    k = str(kind).strip().lower()
    return [
        e for e in ents
        if str(e.get("kind", e.get("type", ""))).strip().lower() == k
    ]


def _entity_index(entities: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """
    Build an index by common id keys.
    Prefers: id -> entity, else app_id/business_id -> entity.
    """
    idx: Dict[str, Dict[str, Any]] = {}
    for e in entities:
        if not isinstance(e, dict):
            continue
        for key in ("id", "app_id", "business_id"):
            v = e.get(key)
            if isinstance(v, str) and v.strip():
                idx[v.strip()] = e
                break
    return idx


def get_entity(entity_id: str) -> Dict[str, Any] | None:
    """
    Fetch a single entity by id (or app_id/business_id).
    Returns None if not found.
    """
    if not entity_id:
        return None
    ents = list_entities()
    idx = _entity_index(ents)
    return idx.get(str(entity_id).strip())


def upsert_entity(entity: Dict[str, Any]) -> Dict[str, Any]:
    """
    Insert or update an entity in the canonical registry.
    - Computes entity hash
    - Writes registry.json
    - Appends an audit event
    Returns the stored entity.
    """
    if not isinstance(entity, dict):
        raise TypeError("entity must be a dict")

    # Determine stable id key
    entity_id = entity.get("id") or entity.get("app_id") or entity.get("business_id")
    if not isinstance(entity_id, str) or not entity_id.strip():
        raise ValueError("entity must include an id (id/app_id/business_id)")

    with _lock:
        reg = load_registry()
        entities = reg.get("entities", [])
        if not isinstance(entities, list):
            entities = []

        idx = _entity_index(entities)

        now_ms = _now_epoch_ms()
        now_iso = _now_iso()

        stored = dict(entity)
        # Set timestamps (keep in-hash per your comment)
        if "created_at_ms" not in stored:
            stored["created_at_ms"] = now_ms
            stored["created_at_iso"] = now_iso
        stored["updated_at_ms"] = now_ms
        stored["updated_at_iso"] = now_iso

        stored["hash"] = entity_hash(stored)

        if entity_id in idx:
            # replace existing
            new_entities = []
            for e in entities:
                if not isinstance(e, dict):
                    continue
                eid = e.get("id") or e.get("app_id") or e.get("business_id")
                if str(eid).strip() == entity_id:
                    new_entities.append(stored)
                else:
                    new_entities.append(e)
            reg["entities"] = new_entities
            action = "upsert_update"
        else:
            entities.append(stored)
            reg["entities"] = entities
            action = "upsert_insert"

        # Optional: maintain top-level metadata if present
        meta = reg.get("meta", {})
        if isinstance(meta, dict):
            meta["updated_at_ms"] = now_ms
            meta["updated_at_iso"] = now_iso
            reg["meta"] = meta

        _write_json(REGISTRY_PATH, reg)

        evt = {
            "ts_ms": now_ms,
            "ts_iso": now_iso,
            "action": action,
            "entity_id": entity_id,
            "entity_hash": stored["hash"],
        }
        evt.update(_actor_from_env())
        _append_event(evt)

        return stored




def add_attestation(entity_id: str, attestation: Dict[str, Any]) -> Dict[str, Any]:
    """
    Append an attestation record to an entity.
    - attestation is stored under entity["attestations"] (list)
    - timestamps + actor info added
    - registry rewritten + event appended
    Returns updated entity.
    """
    if not entity_id:
        raise ValueError("entity_id required")
    if not isinstance(attestation, dict):
        raise ValueError("attestation must be a dict")

    entity_id = str(entity_id).strip()

    with _lock:
        reg = load_registry()
        entities = reg.get("entities", [])
        if not isinstance(entities, list):
            entities = []

        found = None
        new_entities = []

        now_ms = _now_epoch_ms()
        now_iso = _now_iso()
        actor = _actor_from_env()

        # normalize attestation payload
        att = dict(attestation)
        att.setdefault("ts_ms", now_ms)
        att.setdefault("ts_iso", now_iso)
        att.setdefault("actor", actor.get("actor"))
        att.setdefault("source", actor.get("source"))

        for e in entities:
            if not isinstance(e, dict):
                continue
            eid = e.get("id") or e.get("app_id") or e.get("business_id")
            if str(eid).strip() == entity_id:
                updated = dict(e)
                atts = updated.get("attestations")
                if not isinstance(atts, list):
                    atts = []
                atts.append(att)
                updated["attestations"] = atts

                updated["updated_at_ms"] = now_ms
                updated["updated_at_iso"] = now_iso
                updated["hash"] = entity_hash(updated)

                found = updated
                new_entities.append(updated)
            else:
                new_entities.append(e)

        if found is None:
            raise KeyError(entity_id)

        reg["entities"] = new_entities

        meta = reg.get("meta", {})
        if isinstance(meta, dict):
            meta["updated_at_ms"] = _now_epoch_ms()
            meta["updated_at_iso"] = _now_iso()
            reg["meta"] = meta

        _write_json(REGISTRY_PATH, reg)

        evt = {
            "ts_ms": _now_epoch_ms(),
            "ts_iso": _now_iso(),
            "action": "add_attestation",
            "entity_id": entity_id,
            "attestation": att,
            "entity_hash": found.get("hash"),
        }
        evt.update(actor)
        _append_event(evt)

        return found

def set_lifecycle(entity_id: str, lifecycle: str, reason: str = "") -> Dict[str, Any]:
    """
    Convenience admin mutation:
    - find entity by id/app_id/business_id
    - set entity["lifecycle"] = lifecycle
    - optionally set entity["lifecycle_reason"]
    - writes registry + appends event
    Returns the updated entity.
    """
    if not entity_id:
        raise ValueError("entity_id required")
    entity_id = str(entity_id).strip()
    lifecycle = str(lifecycle).strip()

    with _lock:
        reg = load_registry()
        entities = reg.get("entities", [])
        if not isinstance(entities, list):
            entities = []

        found = None
        new_entities = []
        for e in entities:
            if not isinstance(e, dict):
                continue
            eid = e.get("id") or e.get("app_id") or e.get("business_id")
            if str(eid).strip() == entity_id:
                updated = dict(e)
                updated["lifecycle"] = lifecycle
                if reason:
                    updated["lifecycle_reason"] = reason

                now_ms = _now_epoch_ms()
                now_iso = _now_iso()
                updated["updated_at_ms"] = now_ms
                updated["updated_at_iso"] = now_iso
                updated["hash"] = entity_hash(updated)

                found = updated
                new_entities.append(updated)
            else:
                new_entities.append(e)

        if found is None:
            raise KeyError(entity_id)

        reg["entities"] = new_entities

        meta = reg.get("meta", {})
        if isinstance(meta, dict):
            meta["updated_at_ms"] = _now_epoch_ms()
            meta["updated_at_iso"] = _now_iso()
            reg["meta"] = meta

        _write_json(REGISTRY_PATH, reg)

        evt = {
            "ts_ms": _now_epoch_ms(),
            "ts_iso": _now_iso(),
            "action": "set_lifecycle",
            "entity_id": entity_id,
            "lifecycle": lifecycle,
            "reason": reason,
            "entity_hash": found.get("hash"),
        }
        evt.update(_actor_from_env())
        _append_event(evt)

        return found

def delete_entity(entity_id: str) -> bool:
    """
    Remove an entity from the canonical registry by id/app_id/business_id.
    Returns True if deleted, False if not found.
    """
    if not entity_id:
        return False
    entity_id = str(entity_id).strip()

    with _lock:
        reg = load_registry()
        entities = reg.get("entities", [])
        if not isinstance(entities, list) or not entities:
            return False

        kept = []
        removed = None
        for e in entities:
            if not isinstance(e, dict):
                continue
            eid = e.get("id") or e.get("app_id") or e.get("business_id")
            if str(eid).strip() == entity_id:
                removed = e
                continue
            kept.append(e)

        if removed is None:
            return False

        now_ms = _now_epoch_ms()
        now_iso = _now_iso()

        reg["entities"] = kept
        meta = reg.get("meta", {})
        if isinstance(meta, dict):
            meta["updated_at_ms"] = now_ms
            meta["updated_at_iso"] = now_iso
            reg["meta"] = meta

        _write_json(REGISTRY_PATH, reg)

        evt = {
            "ts_ms": now_ms,
            "ts_iso": now_iso,
            "action": "delete",
            "entity_id": entity_id,
            "entity_hash": removed.get("hash"),
        }
        evt.update(_actor_from_env())
        _append_event(evt)

        return True

def _append_event(evt: Dict[str, Any]):
    EVENTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    line = _json_canon(evt) + "\n"
    with EVENTS_PATH.open("a", encoding="utf-8") as f:
        f.write(line)

def _actor_from_env() -> Dict[str, Any]:
    # keep simple, can enrich later with user/session/IP
    return {
        "actor": os.getenv("SHF_ACTOR", "shf-admin"),
        "source": os.getenv("SHF_ACTOR_SOURCE", "cli"),
    }

# ---------------------------
# Registry Schema (Canon)
# ---------------------------

LEGAL_CLASSIFICATIONS = {"public", "partner", "internal", "restricted", "regulated"}
DATA_CATEGORIES = {
    "none", "pii", "phi", "financial", "education_records", "case_notes", "children_data"
}

def default_policy() -> Dict[str, Any]:
    return {"humanApproval": True, "maxSteps": 6, "notes": ""}


def read_events(limit: int = 200, since_epoch_ms: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Read registry event ledger (jsonl).
    Returns newest-first (most recent events first).
    """
    try:
        limit = int(limit)
    except Exception:
        limit = 200
    limit = max(1, min(limit, 5000))

    since = None
    if since_epoch_ms is not None:
        try:
            since = int(since_epoch_ms)
        except Exception:
            since = None

    if not EVENTS_PATH.exists():
        return []

    out: List[Dict[str, Any]] = []
    try:
        lines = EVENTS_PATH.read_text(encoding="utf-8", errors="replace").splitlines()
    except Exception:
        return []

    # walk backwards for newest-first
    for line in reversed(lines):
        s = (line or "").strip()
        if not s:
            continue
        try:
            evt = json.loads(s)
        except Exception:
            continue
        if since is not None:
            ts = evt.get("ts_ms") or evt.get("epoch_ms") or evt.get("time_ms")
            try:
                ts_i = int(ts)
            except Exception:
                ts_i = None
            if ts_i is None or ts_i < since:
                continue
        out.append(evt)
        if len(out) >= limit:
            break

    return out

