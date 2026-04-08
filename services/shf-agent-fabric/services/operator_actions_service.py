from datetime import datetime, timezone
import uuid

from services.operator_events_service import write_operator_event

def _now():
    return datetime.now(timezone.utc).isoformat()

def _id(prefix):
    return f"{prefix}_{uuid.uuid4().hex[:12]}"

DISPUTES = {
    "test1": {
        "id": "test1",
        "status": "open",
        "resolution": None,
        "program_id": "pilot",
        "amount": 25000,
        "created_at": _now(),
    }
}

POOLS = {}

PAYOUTS = {
    "pay1": {
        "id": "pay1",
        "status": "ready",
        "program_id": "pilot",
        "pool_id": "pool_test",
        "amount": 15000,
        "created_at": _now(),
    }
}

def resolve_dispute(dispute_id: str, body: dict):
    dispute = DISPUTES.get(dispute_id)

    if not dispute:
        return {"ok": False, "error": "dispute not found"}

    if dispute.get("status") == "resolved":
        return {"ok": False, "error": "already resolved"}

    dispute["status"] = "resolved"
    dispute["resolution"] = body["resolution"]
    dispute["resolved_at"] = _now()
    dispute["resolved_by"] = body["actor_id"]

    evt = write_operator_event(
        "dispute_resolved",
        "dispute",
        dispute_id,
        body["actor_id"],
        dispute
    )

    return {"ok": True, "dispute": dispute, "event_id": evt["id"]}


def settle_payout(payout_id: str, body: dict):
    payout = PAYOUTS.get(payout_id)

    if not payout:
        return {"ok": False, "error": "payout not found"}

    if payout.get("status") == "settled":
        return {"ok": False, "error": "already settled"}

    payout["status"] = "settled"
    payout["settled_at"] = _now()
    payout["settled_by"] = body["actor_id"]

    evt = write_operator_event(
        "payout_settled",
        "payout",
        payout_id,
        body["actor_id"],
        payout
    )

    return {"ok": True, "payout": payout, "event_id": evt["id"]}


def create_pool(body: dict):
    pool_id = _id("pool")

    pool = {
        "id": pool_id,
        "name": body["name"],
        "program_id": body["program_id"],
        "committed_amount": body["committed_amount"],
        "reserved_amount": 0,
        "deployed_amount": 0,
        "currency": body.get("currency", "USD"),
        "status": "active"
    }

    POOLS[pool_id] = pool

    evt = write_operator_event(
        "pool_created",
        "pool",
        pool_id,
        body["actor_id"],
        pool
    )

    return {"ok": True, "pool": pool, "event_id": evt["id"]}


def allocate_capital(pool_id: str, body: dict):
    pool = POOLS.get(pool_id)

    if not pool:
        return {"ok": False, "error": "pool not found"}

    amount = float(body["amount"])
    mode = body["allocation_type"]

    if mode == "reserve":
        pool["reserved_amount"] += amount
    elif mode == "deploy":
        pool["deployed_amount"] += amount
    elif mode == "release":
        pool["reserved_amount"] -= amount
    else:
        return {"ok": False, "error": "invalid allocation_type"}

    evt = write_operator_event(
        "capital_allocated",
        "pool",
        pool_id,
        body["actor_id"],
        {
            "amount": amount,
            "allocation_type": mode
        }
    )

    return {"ok": True, "pool": pool, "event_id": evt["id"]}
