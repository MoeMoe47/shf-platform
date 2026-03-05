from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Callable

# Try multiple DB wiring strategies:
# 1) Use existing get_conn if available
# 2) Fallback to direct sqlite connect at db/fabric.sqlite
_get_conn: Optional[Callable[[], Any]] = None

def _try_import_get_conn() -> Optional[Callable[[], Any]]:
    # Common patterns in this repo:
    # - services/shf-agent-fabric/db/db.py (module name db.py inside db folder)
    # But db/ isn't guaranteed to be a Python package, so imports may fail.
    candidates = [
        ("db.db", "get_conn"),
        ("db", "get_conn"),
    ]
    for modname, attr in candidates:
        try:
            mod = __import__(modname, fromlist=[attr])
            fn = getattr(mod, attr, None)
            if callable(fn):
                return fn
        except Exception:
            continue
    return None

_get_conn = _try_import_get_conn()

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:16]}"

def _service_root() -> Path:
    # fabric/outcomes/store.py -> fabric/outcomes -> fabric -> service root
    return Path(__file__).resolve().parents[2]

def _sqlite_path() -> Path:
    # Your tree shows db/fabric.sqlite
    return _service_root() / "db" / "fabric.sqlite"

def get_conn():
    """
    Return a sqlite3 connection.
    Prefer existing repo DB connector if available; else open db/fabric.sqlite directly.
    """
    if _get_conn is not None:
        return _get_conn()

    db_path = _sqlite_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    return conn

def ensure_tables_sqlite(conn) -> None:
    conn.execute("""
    CREATE TABLE IF NOT EXISTS outcome_submissions (
      submission_id      TEXT PRIMARY KEY,
      idempotency_key    TEXT NOT NULL UNIQUE,
      participant_id     TEXT NOT NULL,
      program_id         TEXT NOT NULL,
      outcome_type       TEXT NOT NULL,
      artifact_ids_json  TEXT NOT NULL,
      evidence_root_hash TEXT NOT NULL,
      status             TEXT NOT NULL,
      created_at         TEXT NOT NULL
    );
    """)
    conn.commit()

def submit_outcome(payload: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_conn()
    ensure_tables_sqlite(conn)

    idem = payload["idempotency_key"]
    cur = conn.execute(
        "SELECT submission_id, status, created_at FROM outcome_submissions WHERE idempotency_key = ?",
        (idem,),
    )
    row = cur.fetchone()
    if row:
        submission_id, status, created_at = row
        return {
            "submission_id": submission_id,
            "idempotency_key": idem,
            "status": status,
            "created_at": created_at,
        }

    submission_id = _new_id("subm")
    created_at = _now_iso()
    conn.execute(
        """
        INSERT INTO outcome_submissions
        (submission_id, idempotency_key, participant_id, program_id, outcome_type, artifact_ids_json, evidence_root_hash, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            submission_id,
            idem,
            payload["participant_id"],
            payload["program_id"],
            payload["outcome_type"],
            json.dumps(payload.get("artifact_ids", [])),
            payload["evidence_root_hash"],
            "RECEIVED",
            created_at,
        ),
    )
    conn.commit()

    return {
        "submission_id": submission_id,
        "idempotency_key": idem,
        "status": "RECEIVED",
        "created_at": created_at,
    }

def get_submission_by_id(submission_id: str) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    ensure_tables_sqlite(conn)

    cur = conn.execute(
        "SELECT submission_id, idempotency_key, participant_id, program_id, outcome_type, artifact_ids_json, evidence_root_hash, status, created_at "
        "FROM outcome_submissions WHERE submission_id = ?",
        (submission_id,),
    )
    row = cur.fetchone()
    if not row:
        return None
    return {
        "submission_id": row[0],
        "idempotency_key": row[1],
        "participant_id": row[2],
        "program_id": row[3],
        "outcome_type": row[4],
        "artifact_ids": json.loads(row[5] or "[]"),
        "evidence_root_hash": row[6],
        "status": row[7],
        "created_at": row[8],
    }
