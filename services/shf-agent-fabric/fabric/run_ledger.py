from __future__ import annotations

import json
from pathlib import Path
from threading import Lock
from datetime import datetime, timezone

from fabric.events.schema import normalize_event

_lock = Lock()

BASE = Path(__file__).resolve().parent.parent
DB = BASE / "db"
DB.mkdir(exist_ok=True)

# Keep current location to avoid breaking existing tooling
RUNS_LOG = DB / "runs.jsonl"

def write_run_event(event: dict) -> dict:
    """
    Writes a normalized SHF event record to db/runs.jsonl.
    Preserves backward compatibility: you can still pass legacy shapes.
    """
    rec = dict(event or {})

    # Keep old ts behavior if provided, otherwise set it
    rec.setdefault("ts", datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"))

    # Normalize into canonical schema
    norm = normalize_event(rec)

    with _lock:
        with RUNS_LOG.open("a", encoding="utf-8") as f:
            f.write(json.dumps(norm) + "\n")
    return {"ok": True, "event_id": norm.get("event_id")}
