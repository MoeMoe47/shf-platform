from __future__ import annotations

import sqlite3
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException

from fabric.governance.store import list_disputes
from fabric.pools.store import list_pools, get_pool_by_id
from fabric.pools.allocations_store import get_allocations_by_pool
from fabric.treasury.store import get_account_by_code, list_entries_by_account
from fabric.payouts.store import get_payout_intent
from fabric.outcomes.store import get_conn, ensure_tables_sqlite
from fabric.outcomes.verify_store import ensure_verify_tables_sqlite

router = APIRouter(prefix="/api/v1/operator", tags=["operator"])


def _safe_scalar(conn: sqlite3.Connection, sql: str, params: tuple = (), default: int = 0) -> int:
    try:
        cur = conn.execute(sql, params)
        row = cur.fetchone()
        if not row or row[0] is None:
            return default
        return int(row[0])
    except Exception:
        return default


def _safe_table_exists(conn: sqlite3.Connection, table_name: str) -> bool:
    try:
        cur = conn.execute(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
            (table_name,),
        )
        return cur.fetchone() is not None
    except Exception:
        return False


@router.get("/summary")
def operator_summary() -> Dict[str, Any]:
    pools = list_pools()
    open_disputes = list_disputes(state="OPEN")

    committed_total = sum(int(p.get("committed_amount", 0)) for p in pools)
    reserved_total = sum(int(p.get("reserved_amount", 0)) for p in pools)
    deployed_total = sum(int(p.get("deployed_amount", 0)) for p in pools)

    return {
        "ok": True,
        "summary": {
            "pool_count": len(pools),
            "open_dispute_count": len(open_disputes),
            "committed_amount_total": committed_total,
            "reserved_amount_total": reserved_total,
            "deployed_amount_total": deployed_total,
        },
    }


@router.get("/flow")
def operator_flow() -> Dict[str, Any]:
    conn = get_conn()
    ensure_tables_sqlite(conn)
    ensure_verify_tables_sqlite(conn)

    verified_outcomes = _safe_scalar(
        conn,
        "SELECT COUNT(*) FROM outcome_decisions WHERE status = ?",
        ("VERIFIED",),
    )

    credits_minted_count = _safe_scalar(conn, "SELECT COUNT(*) FROM outcome_credits")
    credits_minted_amount_cents = _safe_scalar(
        conn,
        "SELECT COALESCE(SUM(amount_cents), 0) FROM outcome_credits",
    )

    allocations_count = 0
    allocations_amount_cents = 0
    if _safe_table_exists(conn, "pool_allocations"):
        allocations_count = _safe_scalar(conn, "SELECT COUNT(*) FROM pool_allocations")
        allocations_amount_cents = _safe_scalar(
            conn,
            "SELECT COALESCE(SUM(amount_cents), 0) FROM pool_allocations",
        )

    payout_intents_count = _safe_scalar(conn, "SELECT COUNT(*) FROM payout_intents")
    payout_intended_count = _safe_scalar(
        conn,
        "SELECT COUNT(*) FROM payout_intents WHERE state = ?",
        ("INTENDED",),
    )
    payout_settled_count = _safe_scalar(
        conn,
        "SELECT COUNT(*) FROM payout_intents WHERE state = ?",
        ("SETTLED",),
    )

    treasury_entries_count = 0
    if _safe_table_exists(conn, "treasury_entries"):
        treasury_entries_count = _safe_scalar(conn, "SELECT COUNT(*) FROM treasury_entries")

    disputes_open_count = len(list_disputes(state="OPEN"))

    stages = [
        {
            "key": "outcome_verified",
            "label": "Outcome Verified",
            "count": verified_outcomes,
            "amount_cents": 0,
            "status": "LIVE",
        },
        {
            "key": "credit_minted",
            "label": "Credit Minted",
            "count": credits_minted_count,
            "amount_cents": credits_minted_amount_cents,
            "status": "LIVE",
        },
        {
            "key": "pool_allocated",
            "label": "Pool Allocation",
            "count": allocations_count,
            "amount_cents": allocations_amount_cents,
            "status": "LIVE",
        },
        {
            "key": "payout_intent",
            "label": "Payout Intent",
            "count": payout_intents_count,
            "amount_cents": 0,
            "status": "LIVE",
        },
        {
            "key": "settlement",
            "label": "Settlement",
            "count": payout_settled_count,
            "amount_cents": 0,
            "status": "LIVE",
        },
        {
            "key": "treasury_ledger",
            "label": "Treasury Ledger",
            "count": treasury_entries_count,
            "amount_cents": 0,
            "status": "LIVE",
        },
    ]

    return {
        "ok": True,
        "flow": {
            "stages": stages,
            "totals": {
                "verified_outcomes": verified_outcomes,
                "credits_minted_count": credits_minted_count,
                "credits_minted_amount_cents": credits_minted_amount_cents,
                "allocations_count": allocations_count,
                "allocations_amount_cents": allocations_amount_cents,
                "payout_intents_count": payout_intents_count,
                "payout_intended_count": payout_intended_count,
                "payout_settled_count": payout_settled_count,
                "treasury_entries_count": treasury_entries_count,
                "disputes_open_count": disputes_open_count,
            },
        },
    }


@router.get("/disputes")
def operator_disputes(state: Optional[str] = None) -> Dict[str, Any]:
    return {"ok": True, "items": list_disputes(state=state)}


@router.get("/pools")
def operator_pools() -> Dict[str, Any]:
    return {"ok": True, "items": list_pools()}


@router.get("/pools/{pool_id}")
def operator_pool_detail(pool_id: str) -> Dict[str, Any]:
    pool = get_pool_by_id(pool_id)
    if not pool:
        raise HTTPException(status_code=404, detail="pool not found")

    allocations = get_allocations_by_pool(pool_id)

    return {
        "ok": True,
        "pool": pool,
        "allocations": allocations,
    }


@router.get("/payouts/{intent_id}")
def operator_payout_detail(intent_id: str) -> Dict[str, Any]:
    payout = get_payout_intent(intent_id)
    if not payout:
        raise HTTPException(status_code=404, detail="payout intent not found")

    return {
        "ok": True,
        "payout": payout,
    }


@router.get("/treasury/accounts/{account_code}")
def operator_treasury_account(account_code: str) -> Dict[str, Any]:
    acct = get_account_by_code(account_code)
    if not acct:
        raise HTTPException(status_code=404, detail="treasury account not found")

    entries = list_entries_by_account(str(acct["account_id"]))

    debit_total = sum(int(x["amount_cents"]) for x in entries if x["direction"] == "DEBIT")
    credit_total = sum(int(x["amount_cents"]) for x in entries if x["direction"] == "CREDIT")

    return {
        "ok": True,
        "account": acct,
        "ledger": {
            "entry_count": len(entries),
            "debit_total": debit_total,
            "credit_total": credit_total,
            "entries": entries,
        },
    }
