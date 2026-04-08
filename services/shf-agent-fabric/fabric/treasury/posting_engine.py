from __future__ import annotations

from typing import Dict, List, Optional

from fabric.treasury.store import ensure_treasury_tables_sqlite
from fabric.outcomes.store import get_conn


def _normalize_direction(direction: str) -> str:
    d = direction.upper().strip()
    if d not in {"DEBIT", "CREDIT"}:
        raise ValueError("direction must be DEBIT or CREDIT")
    return d


def validate_balanced_entries(entries: List[Dict[str, object]]) -> Dict[str, int]:
    debit_total = 0
    credit_total = 0

    for entry in entries:
        direction = _normalize_direction(str(entry["direction"]))
        amount_cents = int(entry["amount_cents"])

        if amount_cents <= 0:
            raise ValueError("amount_cents must be > 0")

        if direction == "DEBIT":
            debit_total += amount_cents
        else:
            credit_total += amount_cents

    if debit_total != credit_total:
        raise ValueError(
            f"unbalanced transaction: debits={debit_total} credits={credit_total}"
        )

    return {
        "debit_total": debit_total,
        "credit_total": credit_total,
    }


def ensure_posting_tables_sqlite(conn) -> None:
    ensure_treasury_tables_sqlite(conn)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS treasury_transactions (
        transaction_id TEXT PRIMARY KEY,
        reference_type TEXT,
        reference_id TEXT,
        memo TEXT,
        created_at TEXT NOT NULL
    )
    """)
    conn.commit()


def post_balanced_transaction(
    *,
    transaction_id: str,
    entries: List[Dict[str, object]],
    reference_type: Optional[str] = None,
    reference_id: Optional[str] = None,
    memo: Optional[str] = None,
    created_at: str,
) -> Dict[str, object]:
    totals = validate_balanced_entries(entries)

    conn = get_conn()
    ensure_posting_tables_sqlite(conn)

    conn.execute(
        """
        INSERT INTO treasury_transactions
        (transaction_id, reference_type, reference_id, memo, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            transaction_id,
            reference_type,
            reference_id,
            memo,
            created_at,
        ),
    )

    for entry in entries:
        conn.execute(
            """
            INSERT INTO treasury_entries
            (entry_id, account_id, direction, amount_cents, reference_type, reference_id, memo, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                str(entry["entry_id"]),
                str(entry["account_id"]),
                _normalize_direction(str(entry["direction"])),
                int(entry["amount_cents"]),
                reference_type,
                reference_id,
                memo,
                created_at,
            ),
        )

    conn.commit()

    return {
        "transaction_id": transaction_id,
        "reference_type": reference_type,
        "reference_id": reference_id,
        "memo": memo,
        "created_at": created_at,
        "debit_total": totals["debit_total"],
        "credit_total": totals["credit_total"],
        "entry_count": len(entries),
        "ok": True,
    }
