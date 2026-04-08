from __future__ import annotations

from typing import Dict, Optional

from fabric.outcomes.store import get_conn, ensure_tables_sqlite


def ensure_credit_tables_sqlite(conn) -> None:
    """
    Credit table bootstrap for the pilot SQLite lane.

    Keep the live table name unchanged:
      outcome_credits
    """
    ensure_tables_sqlite(conn)
    conn.execute("""
    CREATE TABLE IF NOT EXISTS outcome_credits (
      credit_id     TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL UNIQUE,
      decision_id   TEXT NOT NULL UNIQUE,
      amount_cents  INTEGER NOT NULL,
      currency      TEXT NOT NULL,
      created_at    TEXT NOT NULL
    );
    """)
    conn.commit()


def get_credit_by_submission(submission_id: str) -> Optional[Dict[str, object]]:
    conn = get_conn()
    ensure_credit_tables_sqlite(conn)
    cur = conn.execute(
        "SELECT credit_id, submission_id, decision_id, amount_cents, currency, created_at "
        "FROM outcome_credits WHERE submission_id = ?",
        (submission_id,),
    )
    row = cur.fetchone()
    if not row:
        return None
    return {
        "credit_id": row[0],
        "submission_id": row[1],
        "decision_id": row[2],
        "amount_cents": int(row[3]),
        "currency": row[4],
        "created_at": row[5],
    }


def create_credit(
    *,
    credit_id: str,
    submission_id: str,
    decision_id: str,
    amount_cents: int,
    currency: str,
    created_at: str,
) -> Dict[str, object]:
    conn = get_conn()
    ensure_credit_tables_sqlite(conn)
    conn.execute(
        """
        INSERT INTO outcome_credits
        (credit_id, submission_id, decision_id, amount_cents, currency, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (credit_id, submission_id, decision_id, int(amount_cents), currency, created_at),
    )
    conn.commit()
    return {
        "credit_id": credit_id,
        "submission_id": submission_id,
        "decision_id": decision_id,
        "amount_cents": int(amount_cents),
        "currency": currency,
        "created_at": created_at,
    }
