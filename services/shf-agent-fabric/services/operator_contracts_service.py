from datetime import datetime, timezone
import uuid

from services.operator_events_service import write_operator_event
from services.operator_treasury_ledger_service import seed_pool_balance

def _now():
    return datetime.now(timezone.utc).isoformat()

def _id(prefix):
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


import json
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "contracts.json"

def _load_contracts():
    if DATA_FILE.exists():
        try:
            with open(DATA_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def _save_contracts():
    with open(DATA_FILE, "w") as f:
        json.dump(CONTRACTS, f, indent=2)

CONTRACTS = _load_contracts()

def create_contract(body: dict):
    contract_id = _id("ctr")
    now = _now()

    contract = {
        "id": contract_id,
        "contract_code": body["contract_code"],
        "name": body["name"],
        "outcome_type": body["outcome_type"],
        "verification_method": body["verification_method"],
        "payout_amount": float(body["payout_amount"]),
        "currency": body.get("currency", "USD"),
        "pool_id": body.get("pool_id"),
        "max_supply": body.get("max_supply"),
        "active_count": 0,
        "fulfilled_count": 0,
        "status": "draft",
        "risk_score": body.get("risk_score"),
        "notes": body.get("notes"),
        "created_by": body["created_by"],
        "created_at": now,
        "updated_at": now,
    }

    for existing in CONTRACTS.values():
        if existing["contract_code"] == contract["contract_code"]:
            return {"ok": False, "error": "contract_code already exists"}

    if contract["payout_amount"] <= 0:
        return {"ok": False, "error": "payout_amount must be positive"}

    CONTRACTS[contract_id] = contract
    _save_contracts()

    if contract.get("pool_id"):
        seed_pool_balance(contract["pool_id"], float(contract["max_supply"] or 0) * float(contract["payout_amount"]))

    evt = write_operator_event(
        "contract_created",
        "contract",
        contract_id,
        body["created_by"],
        contract,
    )

    return {"ok": True, "contract": contract, "event_id": evt["id"]}

def list_contracts(status=None, pool_id=None, outcome_type=None):
    items = list(CONTRACTS.values())

    if status:
        items = [x for x in items if x.get("status") == status]
    if pool_id:
        items = [x for x in items if x.get("pool_id") == pool_id]
    if outcome_type:
        items = [x for x in items if x.get("outcome_type") == outcome_type]

    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items

def get_contract(contract_id: str):
    contract = CONTRACTS.get(contract_id)
    if not contract:
        return {"ok": False, "error": "contract not found"}
    return {"ok": True, "contract": contract}

def activate_contract(contract_id: str, actor_id: str):
    contract = CONTRACTS.get(contract_id)
    if not contract:
        return {"ok": False, "error": "contract not found"}

    if not contract.get("pool_id"):
        return {"ok": False, "error": "active contracts require pool_id"}

    contract["status"] = "active"
    _save_contracts()
    contract["updated_at"] = _now()

    evt = write_operator_event(
        "contract_activated",
        "contract",
        contract_id,
        actor_id,
        contract,
    )

    return {"ok": True, "contract": contract, "event_id": evt["id"]}

def pause_contract(contract_id: str, actor_id: str):
    contract = CONTRACTS.get(contract_id)
    if not contract:
        return {"ok": False, "error": "contract not found"}

    contract["status"] = "paused"
    _save_contracts()
    contract["updated_at"] = _now()

    evt = write_operator_event(
        "contract_paused",
        "contract",
        contract_id,
        actor_id,
        contract,
    )

    return {"ok": True, "contract": contract, "event_id": evt["id"]}

def close_contract(contract_id: str, actor_id: str):
    contract = CONTRACTS.get(contract_id)
    if not contract:
        return {"ok": False, "error": "contract not found"}

    contract["status"] = "closed"
    _save_contracts()
    contract["updated_at"] = _now()

    evt = write_operator_event(
        "contract_closed",
        "contract",
        contract_id,
        actor_id,
        contract,
    )

    return {"ok": True, "contract": contract, "event_id": evt["id"]}
