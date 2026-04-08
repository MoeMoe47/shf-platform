from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from fabric.outcomes.store import get_conn, ensure_tables_sqlite
from fabric.pools.store import ensure_pool_tables_sqlite


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:16]}"


def ensure_allocation_tables_sqlite(conn) -> None:
    ensure_tables_sqlite(conn)
    ensure_pool_tables_sqlite(conn)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS pool_allocations (
        allocation_id TEXT PRIMARY KEY,
        pool_id TEXT NOT NULL,
        credit_id TEXT NOT NULL UNIQUE,
        amount_cents INTEGER NOT NULL,
        state TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)
    conn.commit()


def reserve_from_pool(
    *,
    pool_id: str,
    credit_id: str,
    amount_cents: int,
) -> Dict[str, object]:
    conn = get_conn()
    ensure_allocation_tables_sqlite(conn)

    cur = conn.execute(
        "SELECT available_amount, reserved_amount FROM funding_pools WHERE pool_id = ?",
        (pool_id,),
    )
    row = cur.fetchone()

    if not row:
        raise ValueError("pool not found")

    available = int(row[0])

    if available < amount_cents:
        raise ValueError("insufficient pool funds")

    allocation_id = _new_id("alloc")
    created_at = _now()

    conn.execute(
        """
        INSERT INTO pool_allocations
        (allocation_id, pool_id, credit_id, amount_cents, state, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            allocation_id,
            pool_id,
            credit_id,
            int(amount_cents),
            "RESERVED",
            created_at,
        ),
    )

    conn.execute(
        """
        UPDATE funding_pools
        SET
            available_amount = available_amount - ?,
            reserved_amount = reserved_amount + ?,
            updated_at = ?
        WHERE pool_id = ?
        """,
        (
            int(amount_cents),
            int(amount_cents),
            created_at,
            pool_id,
        ),
    )

    conn.commit()

    return {
        "allocation_id": allocation_id,
        "pool_id": pool_id,
        "credit_id": credit_id,
        "amount_cents": int(amount_cents),
        "state": "RESERVED",
        "created_at": created_at,
    }


def get_allocations_by_pool(pool_id: str) -> List[Dict[str, object]]:
    conn = get_conn()
    ensure_allocation_tables_sqlite(conn)

    cur = conn.execute(
        """
        SELECT allocation_id, pool_id, credit_id, amount_cents, state, created_at
        FROM pool_allocations
        WHERE pool_id = ?
        ORDER BY created_at DESC
        """,
        (pool_id,),
    )
    rows = cur.fetchall()

    out: List[Dict[str, object]] = []
    for r in rows:
        out.append({
            "allocation_id": r[0],
            "pool_id": r[1],
            "credit_id": r[2],
            "amount_cents": int(r[3]),
            "state": r[4],
            "created_at": r[5],
        })
    return out


def get_allocation_by_credit(credit_id: str) -> Optional[Dict[str, object]]:
    conn = get_conn()
    ensure_allocation_tables_sqlite(conn)

    cur = conn.execute(
        """
        SELECT allocation_id, pool_id, credit_id, amount_cents, state, created_at
        FROM pool_allocations
        WHERE credit_id = ?
        """,
        (credit_id,),
    )
    row = cur.fetchone()

    if not row:
        return None

    return {
        "allocation_id": row[0],
        "pool_id": row[1],
        "credit_id": row[2],
        "amount_cents": int(row[3]),
        "state": row[4],
        "created_at": row[5],
    }
