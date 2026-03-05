from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from fabric.outcomes.store import get_conn, ensure_tables_sqlite, get_submission_by_id

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:16]}"

def ensure_verify_tables_sqlite(conn) -> None:
    # Submission table comes from ensure_tables_sqlite(conn)
    conn.execute("""
    CREATE TABLE IF NOT EXISTS outcome_decisions (
      decision_id          TEXT PRIMARY KEY,
      submission_id        TEXT NOT NULL UNIQUE,
      decision_hash        TEXT NOT NULL,
      status               TEXT NOT NULL,
      ruleset_sha256       TEXT NOT NULL,
      manifest_fingerprint TEXT NOT NULL,
      created_at           TEXT NOT NULL
    );
    """)
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
    conn.execute("""
    CREATE TABLE IF NOT EXISTS payout_intents (
      intent_id     TEXT PRIMARY KEY,
      credit_id     TEXT NOT NULL UNIQUE,
      destination_json TEXT NOT NULL,
      state         TEXT NOT NULL,
      created_at    TEXT NOT NULL
    );
    """)
    conn.commit()

def get_decision_by_submission(submission_id: str) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    ensure_tables_sqlite(conn)
    ensure_verify_tables_sqlite(conn)
    cur = conn.execute(
        "SELECT decision_id, submission_id, decision_hash, status, ruleset_sha256, manifest_fingerprint, created_at "
        "FROM outcome_decisions WHERE submission_id = ?",
        (submission_id,),
    )
    row = cur.fetchone()
    if not row:
        return None
    return {
        "decision_id": row[0],
        "submission_id": row[1],
        "decision_hash": row[2],
        "status": row[3],
        "ruleset_sha256": row[4],
        "manifest_fingerprint": row[5],
        "created_at": row[6],
    }

def get_credit_by_submission(submission_id: str) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    ensure_tables_sqlite(conn)
    ensure_verify_tables_sqlite(conn)
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

def get_intent_by_credit(credit_id: str) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    ensure_tables_sqlite(conn)
    ensure_verify_tables_sqlite(conn)
    cur = conn.execute(
        "SELECT intent_id, credit_id, destination_json, state, created_at "
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
        "created_at": row[4],
    }

def upsert_verify_bundle(
    submission_id: str,
    decision_hash: str,
    status: str,
    ruleset_sha256: str,
    manifest_fingerprint: str,
    amount_cents: int,
    currency: str,
) -> Dict[str, Any]:
    """
    Idempotent: if decision exists for submission_id, return the existing bundle.
    Otherwise create decision + credit + payout intent.
    """
    # Must exist
    sub = get_submission_by_id(submission_id)
    if not sub:
        raise KeyError("submission not found")

    conn = get_conn()
    ensure_tables_sqlite(conn)
    ensure_verify_tables_sqlite(conn)

    existing_decision = get_decision_by_submission(submission_id)
    if existing_decision:
        existing_credit = get_credit_by_submission(submission_id)
        existing_intent = get_intent_by_credit(existing_credit["credit_id"]) if existing_credit else None
        return {
            "decision": existing_decision,
            "credit": existing_credit,
            "payout_intent": existing_intent,
            "idempotent": True,
        }

    decision_id = _new_id("dec")
    created_at = _now_iso()
    conn.execute(
        """
        INSERT INTO outcome_decisions
        (decision_id, submission_id, decision_hash, status, ruleset_sha256, manifest_fingerprint, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (decision_id, submission_id, decision_hash, status, ruleset_sha256, manifest_fingerprint, created_at),
    )

    credit_id = _new_id("cred")
    conn.execute(
        """
        INSERT INTO outcome_credits
        (credit_id, submission_id, decision_id, amount_cents, currency, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (credit_id, submission_id, decision_id, int(amount_cents), currency, created_at),
    )

    intent_id = _new_id("pi")
    # Destination is modular: you can later resolve from partner/program registry.
    destination = {
        "type": "PROGRAM_DESTINATION",
        "program_id": sub["program_id"],
        "notes": "MVP payout intent; execution handled by transfer adapters later",
    }
    conn.execute(
        """
        INSERT INTO payout_intents
        (intent_id, credit_id, destination_json, state, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (intent_id, credit_id, json.dumps(destination, sort_keys=True), "INTENDED", created_at),
    )

    conn.commit()

    return {
        "decision": {
            "decision_id": decision_id,
            "submission_id": submission_id,
            "decision_hash": decision_hash,
            "status": status,
            "ruleset_sha256": ruleset_sha256,
            "manifest_fingerprint": manifest_fingerprint,
            "created_at": created_at,
        },
        "credit": {
            "credit_id": credit_id,
            "submission_id": submission_id,
            "decision_id": decision_id,
            "amount_cents": int(amount_cents),
            "currency": currency,
            "created_at": created_at,
        },
        "payout_intent": {
            "intent_id": intent_id,
            "credit_id": credit_id,
            "destination": destination,
            "state": "INTENDED",
            "created_at": created_at,
        },
        "idempotent": False,
    }


def ensure_funding_event_table(conn) -> None:
    conn.execute("""
    CREATE TABLE IF NOT EXISTS outcome_funding_events (
      submission_id TEXT PRIMARY KEY,
      funding_event_id TEXT NOT NULL,
      funding_event_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    """)
    conn.commit()

def get_funding_event_link(submission_id: str) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    ensure_tables_sqlite(conn)
    ensure_verify_tables_sqlite(conn)
    ensure_funding_event_table(conn)
    cur = conn.execute(
        "SELECT submission_id, funding_event_id, funding_event_hash, created_at FROM outcome_funding_events WHERE submission_id = ?",
        (submission_id,),
    )
    row = cur.fetchone()
    if not row:
        return None
    return {
        "submission_id": row[0],
        "funding_event_id": row[1],
        "funding_event_hash": row[2],
        "created_at": row[3],
    }

def link_funding_event(submission_id: str, funding_event_id: str, funding_event_hash: str) -> Dict[str, Any]:
    conn = get_conn()
    ensure_tables_sqlite(conn)
    ensure_verify_tables_sqlite(conn)
    ensure_funding_event_table(conn)

    existing = get_funding_event_link(submission_id)
    if existing:
        return {**existing, "idempotent": True}

    created_at = _now_iso()
    conn.execute(
        "INSERT INTO outcome_funding_events (submission_id, funding_event_id, funding_event_hash, created_at) VALUES (?, ?, ?, ?)",
        (submission_id, funding_event_id, funding_event_hash, created_at),
    )
    conn.commit()
    return {
        "submission_id": submission_id,
        "funding_event_id": funding_event_id,
        "funding_event_hash": funding_event_hash,
        "created_at": created_at,
        "idempotent": False,
    }

