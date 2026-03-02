"""
Canonical Data Registry Authority

- Single source of truth for datasets/signals
- Hash-stable, audit-safe
- Append-only event logging
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from threading import Lock
from typing import Any, Dict, List, Optional

from fabric.data_event_ledger import append_event, verify_data_ledger

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "db"

# ✅ CONTRACT PATH (pins canon)
DATA_PATH = ROOT / "contracts/data/data.json"

_lock = Lock()

def _now_epoch_ms() -> int:
    return int(time.time() * 1000)

def _read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        txt = path.read_text(encoding="utf-8") or ""
        return json.loads(txt) if txt.strip() else default
    except Exception:
        return default

def _write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, sort_keys=True) + "\n", encoding="utf-8")

def load_data_registry() -> Dict[str, Any]:
    raw = _read_json(DATA_PATH, default={})
    return raw if isinstance(raw, dict) else {}

def save_data_registry(reg: Dict[str, Any]) -> None:
    _write_json(DATA_PATH, reg)

def list_datasets() -> List[Dict[str, Any]]:
    reg = load_data_registry()
    out: List[Dict[str, Any]] = []
    for dataset_id, ds in reg.items():
        if isinstance(ds, dict):
            d = dict(ds)
            d.setdefault("dataset_id", dataset_id)
            out.append(d)
    out.sort(key=lambda x: (x.get("label", ""), x.get("dataset_id", "")))
    return out

def get_dataset(dataset_id: str) -> Optional[Dict[str, Any]]:
    reg = load_data_registry()
    d = reg.get(dataset_id)
    if isinstance(d, dict):
        out = dict(d)
        out.setdefault("dataset_id", dataset_id)
        return out
    return None

def upsert_dataset(dataset_id: str, ds: Dict[str, Any], actor: str = "shf-admin") -> Dict[str, Any]:
    with _lock:
        reg = load_data_registry()
        cur = reg.get(dataset_id) if isinstance(reg.get(dataset_id), dict) else {}
        merged = dict(cur)
        merged.update(ds or {})
        merged["dataset_id"] = dataset_id
        merged.setdefault("type", "table")
        merged.setdefault("lifecycle", "active")
        merged.setdefault("owner_app_id", "unknown")
        merged.setdefault("schema_version", "v1")
        merged.setdefault("pii", False)
        merged.setdefault("retention_days", 0)
        merged.setdefault("access", {"read_roles": ["admin"], "write_roles": ["admin"]})
        merged.setdefault("attestations", [])
        merged.setdefault("created_at", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))
        merged["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        reg[dataset_id] = merged
        save_data_registry(reg)
        append_event("data_upsert", {"dataset_id": dataset_id}, actor=actor)
        return merged

def delete_dataset(dataset_id: str, actor: str = "shf-admin") -> bool:
    with _lock:
        reg = load_data_registry()
        if dataset_id in reg:
            reg.pop(dataset_id, None)
            save_data_registry(reg)
            append_event("data_delete", {"dataset_id": dataset_id}, actor=actor)
            return True
        return False

def set_dataset_lifecycle(dataset_id: str, lifecycle: str, actor: str = "shf-admin") -> Dict[str, Any]:
    d = get_dataset(dataset_id)
    if not d:
        raise KeyError(dataset_id)
    d["lifecycle"] = lifecycle
    return upsert_dataset(dataset_id, d, actor=actor)

def add_attestation(dataset_id: str, note: str, actor: str = "shf-admin") -> Dict[str, Any]:
    d = get_dataset(dataset_id)
    if not d:
        raise KeyError(dataset_id)
    att = {"ts": _now_epoch_ms(), "iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "actor": actor, "note": note}
    d.setdefault("attestations", [])
    d["attestations"].append(att)
    out = upsert_dataset(dataset_id, d, actor=actor)
    append_event("data_attest", {"dataset_id": dataset_id, "note": note}, actor=actor)
    return out

def read_data_events(limit: int = 200) -> List[Dict[str, Any]]:
    path = DB / "data_events.jsonl"
    if not path.exists():
        return []
    lines = path.read_text(encoding="utf-8").splitlines()
    if limit and limit > 0:
        lines = lines[-limit:]
    out: List[Dict[str, Any]] = []
    for ln in lines:
        try:
            out.append(json.loads(ln))
        except Exception:
            continue
    return out

def verify_data_registry() -> Dict[str, Any]:
    reg = load_data_registry()
    ok = isinstance(reg, dict)
    ledger = verify_data_ledger()
    return {"ok": bool(ok and ledger.get("pass")), "datasets": len(reg) if isinstance(reg, dict) else 0, "ledger": ledger}
