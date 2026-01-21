from __future__ import annotations
import os, json
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
AUDIT_PATH = os.getenv("ALIGN_AUDIT_PATH", os.path.join(BASE_DIR, "logs", "alignment.audit.log"))

def _now_iso():
    return datetime.now(timezone.utc).isoformat()

def write_audit(event: dict) -> str:
    os.makedirs(os.path.dirname(AUDIT_PATH), exist_ok=True)
    event = {**event, "ts": _now_iso()}
    with open(AUDIT_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(event) + "\n")
    return f"audit:{event.get('request_id','')}"
