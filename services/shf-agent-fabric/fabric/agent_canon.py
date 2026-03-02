"""
Canonical Agent Authority

- Single source of truth for agent registry
- Hash-stable, audit-safe
- Append-only event logging
- No bypasses / no duplicate registries
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from threading import Lock
from typing import Any, Dict, List, Optional

from fabric.agent_event_ledger import append_event, verify_agent_ledger

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "db"

# ✅ CONTRACT PATH (pins canon)
AGENTS_PATH = ROOT / "contracts/agents/agents.json"

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

def load_agents() -> Dict[str, Any]:
    raw = _read_json(AGENTS_PATH, default={})
    return raw if isinstance(raw, dict) else {}

def save_agents(reg: Dict[str, Any]) -> None:
    _write_json(AGENTS_PATH, reg)

def list_agents() -> List[Dict[str, Any]]:
    reg = load_agents()
    out: List[Dict[str, Any]] = []
    for agent_id, agent in reg.items():
        if isinstance(agent, dict):
            a = dict(agent)
            a.setdefault("agent_id", agent_id)
            out.append(a)
    out.sort(key=lambda x: (x.get("label", ""), x.get("agent_id", "")))
    return out

def get_agent(agent_id: str) -> Optional[Dict[str, Any]]:
    reg = load_agents()
    a = reg.get(agent_id)
    if isinstance(a, dict):
        out = dict(a)
        out.setdefault("agent_id", agent_id)
        return out
    return None

def upsert_agent(agent_id: str, agent: Dict[str, Any], actor: str = "shf-admin") -> Dict[str, Any]:
    with _lock:
        reg = load_agents()
        cur = reg.get(agent_id) if isinstance(reg.get(agent_id), dict) else {}
        merged = dict(cur)
        merged.update(agent or {})
        merged["agent_id"] = agent_id
        merged.setdefault("lifecycle", "active")
        merged.setdefault("version", "v1")
        merged.setdefault("policy", {"humanApproval": True, "maxSteps": 6, "notes": ""})
        merged.setdefault("capabilities", [])
        merged.setdefault("attestations", [])
        merged.setdefault("created_at", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))
        merged["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        reg[agent_id] = merged
        save_agents(reg)
        append_event("agent_upsert", {"agent_id": agent_id}, actor=actor)
        return merged

def delete_agent(agent_id: str, actor: str = "shf-admin") -> bool:
    with _lock:
        reg = load_agents()
        if agent_id in reg:
            reg.pop(agent_id, None)
            save_agents(reg)
            append_event("agent_delete", {"agent_id": agent_id}, actor=actor)
            return True
        return False

def set_agent_lifecycle(agent_id: str, lifecycle: str, actor: str = "shf-admin") -> Dict[str, Any]:
    a = get_agent(agent_id)
    if not a:
        raise KeyError(agent_id)
    a["lifecycle"] = lifecycle
    return upsert_agent(agent_id, a, actor=actor)

def add_attestation(agent_id: str, note: str, actor: str = "shf-admin") -> Dict[str, Any]:
    a = get_agent(agent_id)
    if not a:
        raise KeyError(agent_id)
    att = {"ts": _now_epoch_ms(), "iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "actor": actor, "note": note}
    a.setdefault("attestations", [])
    a["attestations"].append(att)
    out = upsert_agent(agent_id, a, actor=actor)
    append_event("agent_attest", {"agent_id": agent_id, "note": note}, actor=actor)
    return out

def read_agent_events(limit: int = 200) -> List[Dict[str, Any]]:
    path = DB / "agent_events.jsonl"
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

def verify_agents() -> Dict[str, Any]:
    reg = load_agents()
    ok = isinstance(reg, dict)
    ledger = verify_agent_ledger()
    return {"ok": bool(ok and ledger.get("pass")), "agents": len(reg) if isinstance(reg, dict) else 0, "ledger": ledger}
