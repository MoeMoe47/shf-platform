from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from fabric.outcomes.store import get_conn, ensure_tables_sqlite


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:16]}"


def ensure_pool_tables_sqlite(conn) -> None:
    """
    Funding-pool bootstrap for the pilot SQLite lane.

    This is intentionally simple for MVP:
    - one table for pools
    - explicit committed / available / reserved / deployed amounts
    """
    ensure_tables_sqlite(conn)
    conn.execute("""
    CREATE TABLE IF NOT EXISTS funding_pools (
      pool_id            TEXT PRIMARY KEY,
      pool_code          TEXT NOT NULL UNIQUE,
      name               TEXT NOT NULL,
      status             TEXT NOT NULL,
      funder_type        TEXT,
      funder_id          TEXT,
      strategy_type      TEXT,
      currency           TEXT NOT NULL,
      committed_amount   INTEGER NOT NULL,
      available_amount   INTEGER NOT NULL,
      reserved_amount    INTEGER NOT NULL,
      deployed_amount    INTEGER NOT NULL,
      created_at         TEXT NOT NULL,
      updated_at         TEXT NOT NULL
    );
    """)
    conn.commit()


def create_pool(
    *,
    name: str,
    committed_amount: int,
    pool_code: Optional[str] = None,
    status: str = "ACTIVE",
    funder_type: Optional[str] = None,
    funder_id: Optional[str] = None,
    strategy_type: Optional[str] = None,
    currency: str = "USD",
) -> Dict[str, object]:
    conn = get_conn()
    ensure_pool_tables_sqlite(conn)

    pool_id = _new_id("pool")
    created_at = _now_iso()
    updated_at = created_at
    committed_amount = int(committed_amount)
    available_amount = committed_amount
    reserved_amount = 0
    deployed_amount = 0

    if not pool_code:
        pool_code = f"POOL-{pool_id[-8:].upper()}"

    conn.execute(
        """
        INSERT INTO funding_pools
        (
          pool_id, pool_code, name, status,
          funder_type, funder_id, strategy_type, currency,
          committed_amount, available_amount, reserved_amount, deployed_amount,
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            pool_id,
            pool_code,
            name,
            status,
            funder_type,
            funder_id,
            strategy_type,
            currency,
            committed_amount,
            available_amount,
            reserved_amount,
            deployed_amount,
            created_at,
            updated_at,
        ),
    )
    conn.commit()

    return {
        "pool_id": pool_id,
        "pool_code": pool_code,
        "name": name,
        "status": status,
        "funder_type": funder_type,
        "funder_id": funder_id,
        "strategy_type": strategy_type,
        "currency": currency,
        "committed_amount": committed_amount,
        "available_amount": available_amount,
        "reserved_amount": reserved_amount,
        "deployed_amount": deployed_amount,
        "created_at": created_at,
        "updated_at": updated_at,
    }


def get_pool_by_id(pool_id: str) -> Optional[Dict[str, object]]:
    conn = get_conn()
    ensure_pool_tables_sqlite(conn)
    cur = conn.execute(
        """
        SELECT
          pool_id, pool_code, name, status,
          funder_type, funder_id, strategy_type, currency,
          committed_amount, available_amount, reserved_amount, deployed_amount,
          created_at, updated_at
        FROM funding_pools
        WHERE pool_id = ?
        """,
        (pool_id,),
    )
    row = cur.fetchone()
    if not row:
        return None

    return {
        "pool_id": row[0],
        "pool_code": row[1],
        "name": row[2],
        "status": row[3],
        "funder_type": row[4],
        "funder_id": row[5],
        "strategy_type": row[6],
        "currency": row[7],
        "committed_amount": int(row[8]),
        "available_amount": int(row[9]),
        "reserved_amount": int(row[10]),
        "deployed_amount": int(row[11]),
        "created_at": row[12],
        "updated_at": row[13],
    }


def list_pools() -> List[Dict[str, object]]:
    conn = get_conn()
    ensure_pool_tables_sqlite(conn)
    cur = conn.execute(
        """
        SELECT
          pool_id, pool_code, name, status,
          funder_type, funder_id, strategy_type, currency,
          committed_amount, available_amount, reserved_amount, deployed_amount,
          created_at, updated_at
        FROM funding_pools
        ORDER BY created_at DESC
        """
    )
    rows = cur.fetchall()

    out: List[Dict[str, object]] = []
    for row in rows:
        out.append(
            {
                "pool_id": row[0],
                "pool_code": row[1],
                "name": row[2],
                "status": row[3],
                "funder_type": row[4],
                "funder_id": row[5],
                "strategy_type": row[6],
                "currency": row[7],
                "committed_amount": int(row[8]),
                "available_amount": int(row[9]),
                "reserved_amount": int(row[10]),
                "deployed_amount": int(row[11]),
                "created_at": row[12],
                "updated_at": row[13],
            }
        )
    return out
