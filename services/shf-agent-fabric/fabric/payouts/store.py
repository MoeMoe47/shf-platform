from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Optional, Union

from fabric.outcomes.store import get_conn, ensure_tables_sqlite
from fabric.credits.store import ensure_credit_tables_sqlite


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:16]}"


def ensure_payout_tables_sqlite(conn) -> None:
    """
    Payout-intent bootstrap for the pilot SQLite lane.

    Keep the live table name unchanged:
      payout_intents
    """
    ensure_tables_sqlite(conn)
    ensure_credit_tables_sqlite(conn)
    conn.execute("""
    CREATE TABLE IF NOT EXISTS payout_intents (
      intent_id        TEXT PRIMARY KEY,
      credit_id        TEXT NOT NULL UNIQUE,
      destination_json TEXT NOT NULL,
      state            TEXT NOT NULL,
      amount_cents     INTEGER NOT NULL DEFAULT 0,
      created_at       TEXT NOT NULL
    );
    """)
    conn.commit()

    # Backward-compatible migration for older local SQLite files that may
    # already have payout_intents without amount_cents.
    cur = conn.execute("PRAGMA table_info(payout_intents)")
    cols = [r[1] for r in cur.fetchall()]
    if "amount_cents" not in cols:
        conn.execute("ALTER TABLE payout_intents ADD COLUMN amount_cents INTEGER NOT NULL DEFAULT 0")
        conn.commit()


def get_intent_by_credit(credit_id: str) -> Optional[Dict[str, object]]:
    conn = get_conn()
    ensure_payout_tables_sqlite(conn)
    cur = conn.execute(
        "SELECT intent_id, credit_id, destination_json, state, amount_cents, created_at "
        "FROM payout_intents WHERE credit_id = ?",
        (credit_id,),
    )
    row = cur.fetchone()
    if not row:
        return None
    return {
        "intent_id": row[0],
        "credit_id": row[1],
        "destination": json.loads(row[2] or "{}"),
        "state": row[3],
        "amount_cents": int(row[4]),
        "created_at": row[5],
    }


def get_payout_intent(intent_id: str) -> Optional[Dict[str, object]]:
    conn = get_conn()
    ensure_payout_tables_sqlite(conn)
    cur = conn.execute(
        "SELECT intent_id, credit_id, destination_json, state, amount_cents, created_at "
        "FROM payout_intents WHERE intent_id = ?",
        (intent_id,),
    )
    row = cur.fetchone()
    if not row:
        return None
    return {
        "intent_id": row[0],
        "credit_id": row[1],
        "destination": json.loads(row[2] or "{}"),
        "state": row[3],
        "amount_cents": int(row[4]),
        "created_at": row[5],
    }


def create_payout_intent(
    *,
    credit_id: str,
    destination: Union[str, Dict[str, object]],
    amount_cents: int = 0,
    intent_id: Optional[str] = None,
    state: str = "INTENDED",
    created_at: Optional[str] = None,
) -> Dict[str, object]:
    """
    Backward-compatible payout intent creation.

    Supports:
    - outcomes verify flow, which can pass a dict destination and explicit IDs
    - standalone settlement tests, which can pass a simple string destination
    """
    conn = get_conn()
    ensure_payout_tables_sqlite(conn)

    if intent_id is None:
        intent_id = _new_id("pi")
    if created_at is None:
        created_at = _now()

    if isinstance(destination, str):
        destination_obj: Dict[str, object] = {
            "type": "DESTINATION_REF",
            "value": destination,
        }
    else:
        destination_obj = destination

    conn.execute(
        """
        INSERT INTO payout_intents
        (intent_id, credit_id, destination_json, state, amount_cents, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            intent_id,
            credit_id,
            json.dumps(destination_obj, sort_keys=True),
            state,
            int(amount_cents),
            created_at,
        ),
    )
    conn.commit()

    return {
        "intent_id": intent_id,
        "credit_id": credit_id,
        "destination": destination_obj,
        "state": state,
        "amount_cents": int(amount_cents),
        "created_at": created_at,
    }
