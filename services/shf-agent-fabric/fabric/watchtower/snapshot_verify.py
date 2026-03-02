from __future__ import annotations

import json
import os
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from fabric.watchtower.decision_hash import decision_hash


def _repo_root() -> Path:
    # services/shf-agent-fabric/fabric/watchtower/snapshot_verify.py -> parents[2] == services/shf-agent-fabric
    return Path(__file__).resolve().parents[2]


def _db_path() -> Path:
    # Prefer explicit env; otherwise default to services/shf-agent-fabric/data/watchtower.db (your snapshots DB)
    p = os.getenv("SHF_WATCHTOWER_SNAPSHOT_DB_PATH", "").strip()
    if p:
        return Path(p).expanduser().resolve()
    return _repo_root() / "data" / "watchtower.db"


def _utc_now_z() -> str:
    # timezone-aware UTC
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _connect() -> sqlite3.Connection:
    dbp = _db_path()
    dbp.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(dbp))
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn


def ensure_snapshot_schema(conn: sqlite3.Connection) -> None:
    """
    Ensures the snapshots table exists and is indexable WITHOUT assuming 'ts'.
    We index by (program_id, id DESC) which works everywhere.
    """
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS risk_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            program_id TEXT NOT NULL,
            risk_band TEXT NOT NULL,
            quarantined INTEGER NOT NULL,
            action TEXT NOT NULL,
            decision_hash TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            created_utc TEXT NOT NULL
        );
        """
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_risk_snapshots_program_id_id ON risk_snapshots(program_id, id DESC);"
    )


def _canonical_payload(program_id: str, row: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    row = row or {}
    # Keep payload small + deterministic; include only stable enforcement-relevant fields.
    payload: Dict[str, Any] = {
        "program_id": str(program_id),
        "risk_band": str(row.get("risk_band") or "GREEN"),
        "quarantined": bool(row.get("quarantined") is True),
        "action": str(row.get("watchtower_action") or row.get("action") or "ALLOW"),
        "rank_score_01": float(row.get("rank_score_01") or 0.0),
        "health_01": float(row.get("health_01") or 0.0),
        "delta_score_01": float(row.get("delta_score_01") or 0.0),
        "trend_band": str(row.get("trend_band") or "FLAT").upper(),
    }
    return payload


def write_read_hash_validate(*, program_id: str = "__infra_verify__") -> Tuple[bool, str]:
    """
    Proves the snapshot store is usable at runtime:
      1) ensure schema
      2) write deterministic payload + decision_hash
      3) read it back
      4) recompute hash from payload_json and compare
    """
    payload = _canonical_payload(program_id)
    payload_json = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    dh = decision_hash(payload)

    with _connect() as conn:
        ensure_snapshot_schema(conn)
        cur = conn.execute(
            """
            INSERT INTO risk_snapshots (
                program_id, risk_band, quarantined, action, decision_hash, payload_json, created_utc
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload["program_id"],
                payload["risk_band"],
                1 if payload["quarantined"] else 0,
                payload["action"],
                dh,
                payload_json,
                _utc_now_z(),
            ),
        )
        rid = int(cur.lastrowid)
        conn.commit()

        row = conn.execute(
            """
            SELECT id, program_id, decision_hash, payload_json
            FROM risk_snapshots
            WHERE id=?
            """,
            (rid,),
        ).fetchone()

    if not row:
        return (False, "SNAPSHOT_READ_FAIL:no_row_returned")

    _id, _pid, stored_hash, stored_payload_json = row
    try:
        stored_payload = json.loads(stored_payload_json)
    except Exception:
        stored_payload = None

    if not isinstance(stored_payload, dict):
        return (False, "SNAPSHOT_READ_FAIL:payload_not_json_object")

    recomputed = decision_hash(stored_payload)

    if str(stored_hash) != str(recomputed):
        return (
            False,
            f"SNAPSHOT_HASH_MISMATCH: stored={stored_hash} recomputed={recomputed}",
        )

    return (True, "watchtower snapshot store OK (write+read+hash)")

def verify_snapshot_store(*, program_id: str = "__startup__") -> tuple[bool, str]:
    """
    Startup/infra-safe verifier:
      - ensures schema exists
      - writes a deterministic snapshot
      - reads it back
      - re-hashes + compares
    Returns (ok, message). Raises NOTHING (caller decides whether to hard-fail).
    """
    try:
        # Preferred: use the strict write+read+hash validation path if present
        if "write_read_hash_validate" in globals():
            ok, msg = write_read_hash_validate(program_id=program_id)  # type: ignore[name-defined]
            return bool(ok), str(msg)

        # Fallback (schema-only): still better than crashing import
        # If your module exposes ensure_snapshot_schema(conn), this will be exercised elsewhere.
        return True, "snapshot_verify: write_read_hash_validate missing; schema-only fallback ok"
    except Exception as e:
        return False, f"{type(e).__name__}: {e}"

