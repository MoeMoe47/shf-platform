from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from fabric.outcomes.store import get_conn, ensure_tables_sqlite


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:16]}"


def ensure_governance_tables_sqlite(conn) -> None:
    ensure_tables_sqlite(conn)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS governance_disputes (
        dispute_id TEXT PRIMARY KEY,
        reference_type TEXT NOT NULL,
        reference_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        state TEXT NOT NULL,
        opened_by TEXT NOT NULL,
        opened_at TEXT NOT NULL,
        resolved_by TEXT,
        resolved_at TEXT,
        resolution_notes TEXT
    )
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS governance_overrides (
        override_id TEXT PRIMARY KEY,
        reference_type TEXT NOT NULL,
        reference_id TEXT NOT NULL,
        override_type TEXT NOT NULL,
        reason TEXT NOT NULL,
        requested_by TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS governance_approvals (
        approval_id TEXT PRIMARY KEY,
        reference_type TEXT NOT NULL,
        reference_id TEXT NOT NULL,
        approver TEXT NOT NULL,
        decision TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL
    )
    """)

    conn.commit()


def open_dispute(
    *,
    reference_type: str,
    reference_id: str,
    reason: str,
    opened_by: str,
) -> Dict[str, object]:
    conn = get_conn()
    ensure_governance_tables_sqlite(conn)

    dispute_id = _new_id("disp")
    opened_at = _now()

    conn.execute(
        """
        INSERT INTO governance_disputes
        (dispute_id, reference_type, reference_id, reason, state, opened_by, opened_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            dispute_id,
            reference_type,
            reference_id,
            reason,
            "OPEN",
            opened_by,
            opened_at,
        ),
    )
    conn.commit()

    return {
        "dispute_id": dispute_id,
        "reference_type": reference_type,
        "reference_id": reference_id,
        "reason": reason,
        "state": "OPEN",
        "opened_by": opened_by,
        "opened_at": opened_at,
    }


def resolve_dispute(
    *,
    dispute_id: str,
    resolved_by: str,
    resolution_notes: str,
) -> Dict[str, object]:
    conn = get_conn()
    ensure_governance_tables_sqlite(conn)

    resolved_at = _now()

    conn.execute(
        """
        UPDATE governance_disputes
        SET state = 'RESOLVED',
            resolved_by = ?,
            resolved_at = ?,
            resolution_notes = ?
        WHERE dispute_id = ?
        """,
        (
            resolved_by,
            resolved_at,
            resolution_notes,
            dispute_id,
        ),
    )
    conn.commit()

    cur = conn.execute(
        """
        SELECT dispute_id, reference_type, reference_id, reason, state,
               opened_by, opened_at, resolved_by, resolved_at, resolution_notes
        FROM governance_disputes
        WHERE dispute_id = ?
        """,
        (dispute_id,),
    )
    row = cur.fetchone()
    if not row:
        raise ValueError("dispute not found")

    return {
        "dispute_id": row[0],
        "reference_type": row[1],
        "reference_id": row[2],
        "reason": row[3],
        "state": row[4],
        "opened_by": row[5],
        "opened_at": row[6],
        "resolved_by": row[7],
        "resolved_at": row[8],
        "resolution_notes": row[9],
    }


def create_override(
    *,
    reference_type: str,
    reference_id: str,
    override_type: str,
    reason: str,
    requested_by: str,
) -> Dict[str, object]:
    conn = get_conn()
    ensure_governance_tables_sqlite(conn)

    override_id = _new_id("ovr")
    created_at = _now()

    conn.execute(
        """
        INSERT INTO governance_overrides
        (override_id, reference_type, reference_id, override_type, reason, requested_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            override_id,
            reference_type,
            reference_id,
            override_type,
            reason,
            requested_by,
            created_at,
        ),
    )
    conn.commit()

    return {
        "override_id": override_id,
        "reference_type": reference_type,
        "reference_id": reference_id,
        "override_type": override_type,
        "reason": reason,
        "requested_by": requested_by,
        "created_at": created_at,
    }


def create_approval(
    *,
    reference_type: str,
    reference_id: str,
    approver: str,
    decision: str,
    notes: Optional[str] = None,
) -> Dict[str, object]:
    conn = get_conn()
    ensure_governance_tables_sqlite(conn)

    approval_id = _new_id("appr")
    created_at = _now()

    conn.execute(
        """
        INSERT INTO governance_approvals
        (approval_id, reference_type, reference_id, approver, decision, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            approval_id,
            reference_type,
            reference_id,
            approver,
            decision,
            notes,
            created_at,
        ),
    )
    conn.commit()

    return {
        "approval_id": approval_id,
        "reference_type": reference_type,
        "reference_id": reference_id,
        "approver": approver,
        "decision": decision,
        "notes": notes,
        "created_at": created_at,
    }


def list_disputes(state: Optional[str] = None) -> List[Dict[str, object]]:
    conn = get_conn()
    ensure_governance_tables_sqlite(conn)

    if state:
        cur = conn.execute(
            """
            SELECT dispute_id, reference_type, reference_id, reason, state,
                   opened_by, opened_at, resolved_by, resolved_at, resolution_notes
            FROM governance_disputes
            WHERE state = ?
            ORDER BY opened_at DESC
            """,
            (state,),
        )
    else:
        cur = conn.execute(
            """
            SELECT dispute_id, reference_type, reference_id, reason, state,
                   opened_by, opened_at, resolved_by, resolved_at, resolution_notes
            FROM governance_disputes
            ORDER BY opened_at DESC
            """
        )

    rows = cur.fetchall()
    out: List[Dict[str, object]] = []
    for row in rows:
        out.append({
            "dispute_id": row[0],
            "reference_type": row[1],
            "reference_id": row[2],
            "reason": row[3],
            "state": row[4],
            "opened_by": row[5],
            "opened_at": row[6],
            "resolved_by": row[7],
            "resolved_at": row[8],
            "resolution_notes": row[9],
        })
    return out
