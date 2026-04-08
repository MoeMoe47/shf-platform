from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from fabric.outcomes.store import get_conn, ensure_tables_sqlite


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:16]}"


def ensure_treasury_tables_sqlite(conn) -> None:
    ensure_tables_sqlite(conn)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS treasury_accounts (
        account_id TEXT PRIMARY KEY,
        account_code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        account_type TEXT NOT NULL,
        currency TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS treasury_entries (
        entry_id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        direction TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        reference_type TEXT,
        reference_id TEXT,
        memo TEXT,
        created_at TEXT NOT NULL
    )
    """)

    conn.commit()


def create_account(
    *,
    account_code: str,
    name: str,
    account_type: str,
    currency: str = "USD",
    status: str = "ACTIVE",
) -> Dict[str, object]:
    conn = get_conn()
    ensure_treasury_tables_sqlite(conn)

    account_id = _new_id("acct")
    ts = _now()

    conn.execute(
        """
        INSERT INTO treasury_accounts
        (account_id, account_code, name, account_type, currency, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (account_id, account_code, name, account_type, currency, status, ts, ts),
    )
    conn.commit()

    return {
        "account_id": account_id,
        "account_code": account_code,
        "name": name,
        "account_type": account_type,
        "currency": currency,
        "status": status,
        "created_at": ts,
        "updated_at": ts,
    }


def get_account_by_code(account_code: str) -> Optional[Dict[str, object]]:
    conn = get_conn()
    ensure_treasury_tables_sqlite(conn)

    cur = conn.execute(
        """
        SELECT account_id, account_code, name, account_type, currency, status, created_at, updated_at
        FROM treasury_accounts
        WHERE account_code = ?
        """,
        (account_code,),
    )
    row = cur.fetchone()
    if not row:
        return None

    return {
        "account_id": row[0],
        "account_code": row[1],
        "name": row[2],
        "account_type": row[3],
        "currency": row[4],
        "status": row[5],
        "created_at": row[6],
        "updated_at": row[7],
    }


def post_entry(
    *,
    account_id: str,
    direction: str,
    amount_cents: int,
    reference_type: Optional[str] = None,
    reference_id: Optional[str] = None,
    memo: Optional[str] = None,
) -> Dict[str, object]:
    conn = get_conn()
    ensure_treasury_tables_sqlite(conn)

    if direction not in {"DEBIT", "CREDIT"}:
        raise ValueError("direction must be DEBIT or CREDIT")

    entry_id = _new_id("tent")
    created_at = _now()

    conn.execute(
        """
        INSERT INTO treasury_entries
        (entry_id, account_id, direction, amount_cents, reference_type, reference_id, memo, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            entry_id,
            account_id,
            direction,
            int(amount_cents),
            reference_type,
            reference_id,
            memo,
            created_at,
        ),
    )
    conn.commit()

    return {
        "entry_id": entry_id,
        "account_id": account_id,
        "direction": direction,
        "amount_cents": int(amount_cents),
        "reference_type": reference_type,
        "reference_id": reference_id,
        "memo": memo,
        "created_at": created_at,
    }


def list_entries_by_account(account_id: str) -> List[Dict[str, object]]:
    conn = get_conn()
    ensure_treasury_tables_sqlite(conn)

    cur = conn.execute(
        """
        SELECT entry_id, account_id, direction, amount_cents, reference_type, reference_id, memo, created_at
        FROM treasury_entries
        WHERE account_id = ?
        ORDER BY created_at DESC
        """,
        (account_id,),
    )
    rows = cur.fetchall()

    out: List[Dict[str, object]] = []
    for row in rows:
        out.append({
            "entry_id": row[0],
            "account_id": row[1],
            "direction": row[2],
            "amount_cents": int(row[3]),
            "reference_type": row[4],
            "reference_id": row[5],
            "memo": row[6],
            "created_at": row[7],
        })
    return out
