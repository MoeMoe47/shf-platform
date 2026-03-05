from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Tuple

BRIDGE_VERSION = "outcomes_funding_bridge_v1"

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def _canonical_json(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

def sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def _service_root() -> Path:
    # fabric/funding/journal/outcome_bridge.py -> journal -> funding -> fabric -> service root
    return Path(__file__).resolve().parents[3]

def _journal_path() -> Path:
    # Keep this inside service db/ so it travels with your sqlite-first pilot.
    p = _service_root() / "db" / "funding_outcome_journal.jsonl"
    p.parent.mkdir(parents=True, exist_ok=True)
    return p

@dataclass(frozen=True)
class FundingJournalEvent:
    event_id: str
    event_hash: str
    created_at: str
    payload: Dict[str, Any]

def make_event_payload(
    submission_id: str,
    decision_hash: str,
    ruleset_sha256: str,
    manifest_fingerprint: str,
    credit_id: str,
    amount_cents: int,
    currency: str,
    payout_intent_id: str,
) -> Dict[str, Any]:
    created_at = _now_iso()
    payload = {
        "bridge": BRIDGE_VERSION,
        "created_at": created_at,
        "submission_id": submission_id,
        "decision_hash": decision_hash,
        "policy": {
            "ruleset_sha256": ruleset_sha256,
            "manifest_fingerprint": manifest_fingerprint,
        },
        "credit": {
            "credit_id": credit_id,
            "amount_cents": int(amount_cents),
            "currency": currency,
        },
        "payout_intent": {
            "intent_id": payout_intent_id,
            "state": "INTENDED",
        },
    }
    return payload

def compute_event_hash(payload: Dict[str, Any]) -> Tuple[str, str]:
    # Deterministic ID derived from payload hash (stable & replayable)
    h = sha256_hex(_canonical_json(payload))
    event_id = f"fev_{h[:16]}"
    return event_id, h

def append_event(payload: Dict[str, Any]) -> FundingJournalEvent:
    event_id, event_hash = compute_event_hash(payload)
    rec = {
        "event_id": event_id,
        "event_hash": event_hash,
        "payload": payload,
    }
    jp = _journal_path()
    with jp.open("a", encoding="utf-8") as f:
        f.write(_canonical_json(rec) + "\n")

    return FundingJournalEvent(
        event_id=event_id,
        event_hash=event_hash,
        created_at=payload.get("created_at", ""),
        payload=payload,
    )

def find_event(event_id: str) -> Dict[str, Any] | None:
    jp = _journal_path()
    if not jp.exists():
        return None
    with jp.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except Exception:
                continue
            if rec.get("event_id") == event_id:
                return rec
    return None
