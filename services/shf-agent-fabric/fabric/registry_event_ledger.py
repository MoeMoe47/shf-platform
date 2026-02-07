from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DB_DIR = ROOT / "db"
DB_DIR.mkdir(parents=True, exist_ok=True)

# Default location used by existing registry implementations
EVENTS_PATH = DB_DIR / "registry_events.jsonl"


def _sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _canon_json(obj: Any) -> str:
    """
    Deterministic canonical JSON for hashing.
    MUST remain stable across versions.
    """
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _event_payload_for_hash(ev: dict[str, Any]) -> dict[str, Any]:
    """
    Only include stable, auditable fields used for hashing.
    IMPORTANT: this list must NEVER change without a version bump.
    """
    keys = [
        "action",
        "actor",
        "source",
        "reason",
        "orgId",
        "entityId",
        "kind",
        "name",
        "beforeHash",
        "afterHash",
        "ts",
        "tsMs",
    ]
    return {k: ev.get(k) for k in keys if k in ev}


def compute_event_id_v0(ev: dict[str, Any]) -> str:
    """
    Legacy format (v0): eventId = sha256(canon(payload))
    """
    payload = _event_payload_for_hash(ev)
    return _sha256_hex(_canon_json(payload).encode("utf-8"))


def compute_event_id_v1(prev_event_id: str, ev: dict[str, Any]) -> str:
    """
    Chained format (v1): eventId = sha256(prev_event_id + "|" + canon(payload))
    """
    payload = _event_payload_for_hash(ev)
    msg = f"{prev_event_id}|{_canon_json(payload)}".encode("utf-8")
    return _sha256_hex(msg)


def read_events(limit: int = 200, entity_id: str | None = None) -> list[dict[str, Any]]:
    """
    Read events in chronological order (oldest → newest).
    """
    if not EVENTS_PATH.exists():
        return []

    items: list[dict[str, Any]] = []
    with EVENTS_PATH.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                ev = json.loads(line)
            except Exception:
                continue
            if not isinstance(ev, dict):
                continue
            if entity_id and ev.get("entityId") != entity_id:
                continue
            items.append(ev)

    if limit and len(items) > limit:
        items = items[-limit:]
    return items


def list_ledger_events(limit: int = 50, entity_id: str | None = None) -> list[dict[str, Any]]:
    """
    Return newest-first for auditors.
    """
    evs = read_events(limit=0, entity_id=entity_id)
    if limit and len(evs) > limit:
        evs = evs[-limit:]
    return list(reversed(evs))


def verify_ledger(entity_id: str | None = None) -> dict[str, Any]:
    """
    Verification rules:
    - Accept v1 (preferred, chained) OR v0 (legacy).
    - Allow ONE mismatch at index 0 (legacy genesis tolerance).
    - Any mismatch after index 0 => FAIL.
    """
    evs = read_events(limit=0, entity_id=entity_id)
    if not evs:
        return {
            "ok": True,
            "pass": True,
            "count": 0,
            "legacy_detected": False,
            "legacy_unverified_genesis": False,
            "format": "empty",
        }

    legacy_detected = False
    legacy_unverified_genesis = False

    prev_event_id = "GENESIS"
    derived_chain = "GENESIS"

    for idx, ev in enumerate(evs):
        if not isinstance(ev, dict):
            return {
                "ok": False,
                "pass": False,
                "broken_index": idx,
                "reason": "invalid_event_object",
            }

        stored = ev.get("eventId")
        if not isinstance(stored, str) or len(stored) < 8:
            return {
                "ok": False,
                "pass": False,
                "broken_index": idx,
                "reason": "missing_eventId",
            }

        v0 = compute_event_id_v0(ev)
        v1 = compute_event_id_v1(prev_event_id, ev)

        if stored == v1:
            prev_event_id = stored
        elif stored == v0:
            legacy_detected = True
            prev_event_id = stored
        else:
            if idx == 0:
                legacy_detected = True
                legacy_unverified_genesis = True
                prev_event_id = stored
            else:
                return {
                    "ok": False,
                    "pass": False,
                    "broken_index": idx,
                    "reason": "hash_mismatch",
                    "eventId": stored,
                }

        derived_chain = _sha256_hex(f"{derived_chain}|{stored}".encode("utf-8"))

    return {
        "ok": True,
        "pass": True,
        "count": len(evs),
        "legacy_detected": legacy_detected,
        "legacy_unverified_genesis": legacy_unverified_genesis,
        "format": (
            "mixed_legacy_unverified_genesis"
            if legacy_unverified_genesis
            else ("mixed_v0_v1" if legacy_detected else "v1")
        ),
        "derived_chain_head": derived_chain,
        "head_eventId": prev_event_id,
    }


def auditor_one_liner(v: dict[str, Any]) -> str:
    """
    One-line auditor-safe summary.
    """
    if v.get("pass") is True:
        count = int(v.get("count", 0) or 0)
        if count == 0:
            return "LEDGER PASS: no events."
        if v.get("legacy_unverified_genesis"):
            return f"LEDGER PASS: events={count} (legacy genesis tolerated; derived chain active)."
        if v.get("legacy_detected"):
            return f"LEDGER PASS: events={count} (legacy v0 detected; derived chain active)."
        return f"LEDGER PASS: chained v1 verified, events={count}."
    return f"LEDGER FAIL: {v.get('reason')} at index={v.get('broken_index')}."
