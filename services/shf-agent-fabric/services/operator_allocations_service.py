from datetime import datetime, timezone
import json
import uuid
from pathlib import Path

from services.operator_events_service import write_operator_event

def _now():
    return datetime.now(timezone.utc).isoformat()

def _id(prefix):
    return f"{prefix}_{uuid.uuid4().hex[:12]}"

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "allocations.json"

def _load_allocations():
    if DATA_FILE.exists():
        try:
            with open(DATA_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def _save_allocations():
    with open(DATA_FILE, "w") as f:
        json.dump(ALLOCATIONS, f, indent=2)

ALLOCATIONS = _load_allocations()

def create_allocation(body: dict):
    allocation_id = _id("alloc")
    now = _now()

    max_contracts = int(body["max_contracts"])
    payout_amount = float(body["payout_amount"])
    allocated_capital = float(body.get("allocated_capital", max_contracts * payout_amount))

    if max_contracts <= 0:
        return {"ok": False, "error": "max_contracts must be positive"}

    if payout_amount <= 0:
        return {"ok": False, "error": "payout_amount must be positive"}

    for existing in ALLOCATIONS.values():
        if existing["pool_id"] == body["pool_id"] and existing["contract_id"] == body["contract_id"]:
            return {"ok": False, "error": "allocation already exists for pool_id + contract_id"}

    allocation = {
        "id": allocation_id,
        "pool_id": body["pool_id"],
        "contract_id": body["contract_id"],
        "contract_code": body.get("contract_code"),
        "max_contracts": max_contracts,
        "allocated_capital": allocated_capital,
        "issued_count": 0,
        "settled_count": 0,
        "remaining_capacity": max_contracts,
        "status": "active",
        "notes": body.get("notes"),
        "created_by": body["created_by"],
        "created_at": now,
        "updated_at": now,
    }

    ALLOCATIONS[allocation_id] = allocation
    _save_allocations()

    evt = write_operator_event(
        "allocation_created",
        "allocation",
        allocation_id,
        body["created_by"],
        allocation,
    )
    return {"ok": True, "allocation": allocation, "event_id": evt["id"]}

def list_allocations(pool_id=None, contract_id=None, status=None):
    items = list(ALLOCATIONS.values())
    if pool_id:
        items = [x for x in items if x.get("pool_id") == pool_id]
    if contract_id:
        items = [x for x in items if x.get("contract_id") == contract_id]
    if status:
        items = [x for x in items if x.get("status") == status]
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items

def get_allocation(allocation_id: str):
    item = ALLOCATIONS.get(allocation_id)
    if not item:
        return {"ok": False, "error": "allocation not found"}
    return {"ok": True, "allocation": item}

def find_active_allocation(pool_id: str, contract_id: str):
    for item in ALLOCATIONS.values():
        if item.get("pool_id") == pool_id and item.get("contract_id") == contract_id and item.get("status") == "active":
            return item
    return None

def consume_allocation_capacity(pool_id: str, contract_id: str, actor_id: str, issuance_id: str):
    item = find_active_allocation(pool_id, contract_id)
    if not item:
        return {"ok": False, "error": "no active allocation for pool_id + contract_id"}

    if int(item.get("remaining_capacity", 0)) <= 0:
        return {"ok": False, "error": "allocation capacity exhausted"}

    item["issued_count"] = int(item.get("issued_count", 0)) + 1
    item["remaining_capacity"] = int(item.get("remaining_capacity", 0)) - 1
    item["updated_at"] = _now()
    _save_allocations()

    evt = write_operator_event(
        "allocation_consumed",
        "allocation",
        item["id"],
        actor_id,
        {
            "allocation_id": item["id"],
            "pool_id": pool_id,
            "contract_id": contract_id,
            "issuance_id": issuance_id,
            "issued_count": item["issued_count"],
            "remaining_capacity": item["remaining_capacity"],
        },
    )
    return {"ok": True, "allocation": item, "event_id": evt["id"]}

def settle_allocation_capacity(pool_id: str, contract_id: str, actor_id: str, issuance_id: str):
    item = find_active_allocation(pool_id, contract_id)
    if not item:
        return {"ok": False, "error": "no active allocation for pool_id + contract_id"}

    item["settled_count"] = int(item.get("settled_count", 0)) + 1
    item["updated_at"] = _now()
    _save_allocations()

    evt = write_operator_event(
        "allocation_settled",
        "allocation",
        item["id"],
        actor_id,
        {
            "allocation_id": item["id"],
            "pool_id": pool_id,
            "contract_id": contract_id,
            "issuance_id": issuance_id,
            "settled_count": item["settled_count"],
        },
    )
    return {"ok": True, "allocation": item, "event_id": evt["id"]}
