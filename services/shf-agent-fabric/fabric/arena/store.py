from __future__ import annotations

import json
from datetime import datetime, timezone
from threading import Lock
from typing import Any, Dict, Optional, Tuple
import uuid

from .config import ensure_db, AGENTS_JSON, ROUNDS_JSONL, SIGNALS_JSONL

_lock = Lock()

def _utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def _read_agents() -> Dict[str, Any]:
    ensure_db()
    if not AGENTS_JSON.exists() or AGENTS_JSON.stat().st_size == 0:
        return {"agents": {}}
    return json.loads(AGENTS_JSON.read_text(encoding="utf-8") or '{"agents":{}}')

def _write_agents(doc: Dict[str, Any]) -> None:
    AGENTS_JSON.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

def create_agent_draft(payload: Dict[str, Any]) -> Dict[str, Any]:
    ensure_db()
    agent_id = payload.get("agentId") or f"agt_{uuid.uuid4().hex[:12]}"
    now = _utc_iso()

    agent = {
        "agentId": agent_id,
        "ownerStudentId": str(payload.get("ownerStudentId") or "stu_unknown"),
        "name": str(payload.get("name") or "Unnamed Agent"),
        "avatarId": str(payload.get("avatarId") or "robot_01"),
        "persona": str(payload.get("persona") or "TEACHER"),
        "strengths": payload.get("strengths") if isinstance(payload.get("strengths"), dict) else {},
        "communication": payload.get("communication") if isinstance(payload.get("communication"), dict) else {},
        "learningMode": str(payload.get("learningMode") or "ADAPTIVE"),
        "status": "DRAFT",
        "createdAt": now,
        "version": "v1",
    }

    with _lock:
        doc = _read_agents()
        doc.setdefault("agents", {})
        doc["agents"][agent_id] = agent
        _write_agents(doc)

    return agent

def release_agent(agent_id: str) -> Tuple[bool, Dict[str, Any]]:
    with _lock:
        doc = _read_agents()
        agents = doc.get("agents") if isinstance(doc.get("agents"), dict) else {}
        a = agents.get(agent_id)
        if not a:
            return False, {"error": "AGENT_NOT_FOUND", "agentId": agent_id}
        if a.get("status") == "LOCKED_RELEASED":
            return True, a
        a["status"] = "LOCKED_RELEASED"
        agents[agent_id] = a
        doc["agents"] = agents
        _write_agents(doc)
    return True, a

def get_agent(agent_id: str) -> Optional[Dict[str, Any]]:
    doc = _read_agents()
    agents = doc.get("agents") if isinstance(doc.get("agents"), dict) else {}
    a = agents.get(agent_id)
    return dict(a) if isinstance(a, dict) else None

def list_agents(status: Optional[str] = None) -> Dict[str, Dict[str, Any]]:
    doc = _read_agents()
    agents = doc.get("agents") if isinstance(doc.get("agents"), dict) else {}
    out: Dict[str, Dict[str, Any]] = {}
    for k, v in agents.items():
        if not isinstance(v, dict):
            continue
        if status and v.get("status") != status:
            continue
        out[k] = dict(v)
    return out

def append_round(round_doc: Dict[str, Any]) -> None:
    ensure_db()
    line = json.dumps(round_doc, separators=(",", ":"), ensure_ascii=False)
    with _lock:
        with ROUNDS_JSONL.open("a", encoding="utf-8") as f:
            f.write(line + "\n")

def append_signal(signal_doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Append a signal row to db/arena/signals.jsonl.

    v1 fix:
      - inject ts (UTC Z)
      - inject signalId (stable uuid)
      - return the saved doc (helps metrics/debug)
    """
    ensure_db()
    doc = dict(signal_doc or {})

    doc.setdefault("signalId", f"sig_{uuid.uuid4().hex[:12]}")
    doc.setdefault("ts", _utc_iso())

    line = json.dumps(doc, separators=(",", ":"), ensure_ascii=False)
    with _lock:
        with SIGNALS_JSONL.open("a", encoding="utf-8") as f:
            f.write(line + "\n")
    return doc

