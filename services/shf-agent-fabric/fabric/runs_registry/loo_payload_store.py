from __future__ import annotations

import json
from pathlib import Path
from threading import Lock
from datetime import datetime, timezone
from typing import Any, Dict, Optional

_lock = Lock()

BASE = Path(__file__).resolve().parent.parent.parent
DB = BASE / "db"
DB.mkdir(exist_ok=True)

RUNS_DIR = DB / "runs"
RUNS_DIR.mkdir(exist_ok=True)


def _utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _path_for(run_id: str) -> Path:
    safe = "".join(c for c in (run_id or "") if c.isalnum() or c in ("-", "_")).strip()
    if not safe:
        safe = "unknown"
    return RUNS_DIR / f"loo_payload.{safe}.json"


def save_latest_loo_payload(run_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Stores the latest LOO payload for a run. Overwrites any previous.
    """
    p = _path_for(run_id)
    rec = {
        "run_id": run_id,
        "stored_ts": _utc_iso(),
        "payload": payload if isinstance(payload, dict) else {},
    }
    with _lock:
        p.write_text(json.dumps(rec, indent=2) + "\n", encoding="utf-8")
    return {"ok": True, "run_id": run_id, "path": str(p), "stored_ts": rec["stored_ts"]}


def load_latest_loo_payload(run_id: str) -> Dict[str, Any]:
    """
    Loads the latest LOO payload for a run, if present.
    """
    p = _path_for(run_id)
    if not p.exists():
        return {"ok": False, "error": "LOO_PAYLOAD_NOT_FOUND", "run_id": run_id}

    try:
        obj = json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:
        return {"ok": False, "error": "LOO_PAYLOAD_READ_ERROR", "detail": str(e), "run_id": run_id}

    payload = obj.get("payload") if isinstance(obj, dict) else {}
    stored_ts = obj.get("stored_ts") if isinstance(obj, dict) else None

    return {"ok": True, "run_id": run_id, "stored_ts": stored_ts, "payload": payload, "path": str(p)}
