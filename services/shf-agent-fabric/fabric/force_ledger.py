import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

def _root() -> Path:
    return Path(__file__).resolve().parents[1]

def append_force_event(ev: Dict[str, Any]) -> None:
    base = _root() / "registry" / "audit"
    base.mkdir(parents=True, exist_ok=True)
    fp = base / "force.audit.jsonl"
    ev = dict(ev)
    ev.setdefault("ts", datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"))
    fp.write_text("", encoding="utf-8") if not fp.exists() else None
    with fp.open("a", encoding="utf-8") as f:
        f.write(json.dumps(ev, ensure_ascii=False) + "\n")
