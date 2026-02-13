from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any, Dict, Optional


def _repo_root() -> Path:
    # fabric/watchtower/audit.py -> fabric/watchtower -> fabric -> services/shf-agent-fabric
    return Path(__file__).resolve().parents[2]


def _audit_path() -> Path:
    # Keep it local + append-only; can be shipped to registry ledger later
    # Default: services/shf-agent-fabric/var/watchtower_audit.jsonl
    p = os.getenv("SHF_WATCHTOWER_AUDIT_PATH", "")
    if p.strip():
        return Path(p).expanduser().resolve()
    return _repo_root() / "var" / "watchtower_audit.jsonl"


def log_event(event: Dict[str, Any], *, kind: str, program_id: Optional[str] = None) -> None:
    """
    Append-only audit line, best-effort (must never crash core flows).
    """
    try:
        path = _audit_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "ts": int(time.time()),
            "kind": str(kind),
            "program_id": (str(program_id) if program_id else None),
            "event": event,
        }
        with path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(payload, sort_keys=True) + "\n")
    except Exception:
        # auditing should never take down the system
        return
