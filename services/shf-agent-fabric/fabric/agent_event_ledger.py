from __future__ import annotations

import json
import hashlib
import time
from pathlib import Path
from typing import Any, Dict, List

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "db"
EVENTS_PATH = DB / "agent_events.jsonl"

def _canon(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

def _sha256(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def _now_epoch_ms() -> int:
    return int(time.time() * 1000)

def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

def append_event(kind: str, payload: Dict[str, Any], actor: str = "shf-admin") -> Dict[str, Any]:
    EVENTS_PATH.parent.mkdir(parents=True, exist_ok=True)

    prev_hash = ""
    if EVENTS_PATH.exists():
        try:
            last = EVENTS_PATH.read_text(encoding="utf-8").splitlines()[-1]
            prev_hash = json.loads(last).get("hash", "") or ""
        except Exception:
            prev_hash = ""

    evt = {
        "ts": _now_epoch_ms(),
        "iso": _now_iso(),
        "actor": actor,
        "kind": kind,
        "payload": payload,
        "prev_hash": prev_hash,
    }
    evt["hash"] = _sha256(_canon(evt))

    with EVENTS_PATH.open("a", encoding="utf-8") as f:
        f.write(_canon(evt) + "\n")

    return evt

def verify_agent_ledger(limit: int = 0) -> Dict[str, Any]:
    if not EVENTS_PATH.exists():
        return {"ok": True, "pass": True, "events": 0, "reason": "no events"}

    lines = EVENTS_PATH.read_text(encoding="utf-8").splitlines()
    if limit and limit > 0:
        lines = lines[-limit:]

    prev = ""
    count = 0
    for ln in lines:
        count += 1
        try:
            evt = json.loads(ln)
        except Exception:
            return {"ok": False, "pass": False, "events": count, "reason": "invalid json"}

        expected = evt.get("prev_hash", "") or ""
        if expected != prev:
            return {"ok": False, "pass": False, "events": count, "reason": "prev_hash mismatch"}

        h = evt.get("hash", "") or ""
        tmp = dict(evt)
        tmp.pop("hash", None)
        calc = _sha256(_canon(tmp))
        if h != calc:
            return {"ok": False, "pass": False, "events": count, "reason": "hash mismatch"}

        prev = h

    return {"ok": True, "pass": True, "events": len(lines), "reason": "chained v1 verified"}
