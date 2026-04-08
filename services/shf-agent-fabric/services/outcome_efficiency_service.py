import sqlite3
import uuid
from datetime import datetime

DB = "db/shf_agent_fabric.db"

def _conn():
    return sqlite3.connect(DB)

def _table_columns(cur, table_name: str):
    try:
        rows = cur.execute(f"PRAGMA table_info({table_name})").fetchall()
        return {r[1] for r in rows}
    except Exception:
        return set()

def compute_efficiency(program_id):
    conn = _conn()
    cur = conn.cursor()

    verified_cols = _table_columns(cur, "verified_outcomes")
    payment_cols = _table_columns(cur, "outcome_payments")
    contract_cols = _table_columns(cur, "outcome_contracts")

    # -----------------------------------------
    # verified outcomes
    # -----------------------------------------
    outcomes = 0

    if "program_id" in verified_cols and "verification_status" in verified_cols:
        cur.execute("""
        SELECT COUNT(*)
        FROM verified_outcomes
        WHERE program_id = ?
          AND verification_status = 'verified'
        """, (program_id,))
        outcomes = cur.fetchone()[0] or 0

    elif "program_id" in verified_cols:
        cur.execute("""
        SELECT COUNT(*)
        FROM verified_outcomes
        WHERE program_id = ?
        """, (program_id,))
        outcomes = cur.fetchone()[0] or 0

    # -----------------------------------------
    # capital deployed
    # -----------------------------------------
    capital = 0.0

    # best case: outcome_payments joins to verified_outcomes by outcome_id
    if {"outcome_id", "payment_amount"}.issubset(payment_cols) and {"outcome_id", "program_id"}.issubset(verified_cols):
        cur.execute("""
        SELECT COALESCE(SUM(op.payment_amount), 0)
        FROM outcome_payments op
        JOIN verified_outcomes vo
          ON vo.outcome_id = op.outcome_id
        WHERE vo.program_id = ?
        """, (program_id,))
        capital = float(cur.fetchone()[0] or 0)

    # fallback: outcome_payments joins to outcome_contracts by contract_id
    elif {"contract_id", "payment_amount"}.issubset(payment_cols) and {"contract_id", "program_id"}.issubset(contract_cols):
        cur.execute("""
        SELECT COALESCE(SUM(op.payment_amount), 0)
        FROM outcome_payments op
        JOIN outcome_contracts oc
          ON oc.contract_id = op.contract_id
        WHERE oc.program_id = ?
        """, (program_id,))
        capital = float(cur.fetchone()[0] or 0)

    # weaker fallback: if payments table itself has program_id
    elif {"program_id", "payment_amount"}.issubset(payment_cols):
        cur.execute("""
        SELECT COALESCE(SUM(payment_amount), 0)
        FROM outcome_payments
        WHERE program_id = ?
        """, (program_id,))
        capital = float(cur.fetchone()[0] or 0)

    cost_per_outcome = 0.0
    if outcomes > 0:
        cost_per_outcome = capital / outcomes

    efficiency_score = 0.0
    if cost_per_outcome > 0:
        efficiency_score = 1 / cost_per_outcome

    snapshot_id = str(uuid.uuid4())

    cur.execute("""
    INSERT INTO outcome_efficiency_snapshots
    (snapshot_id, program_id, verified_outcomes, capital_deployed, cost_per_outcome, efficiency_score, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        snapshot_id,
        program_id,
        outcomes,
        capital,
        cost_per_outcome,
        efficiency_score,
        datetime.utcnow().isoformat()
    ))

    conn.commit()
    conn.close()

    return {
        "program_id": program_id,
        "verified_outcomes": outcomes,
        "capital_deployed": capital,
        "cost_per_outcome": cost_per_outcome,
        "efficiency_score": efficiency_score
    }
