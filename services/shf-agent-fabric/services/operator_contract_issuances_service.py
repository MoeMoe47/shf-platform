from datetime import datetime, timezone
import json
import uuid
from pathlib import Path

from services.operator_events_service import write_operator_event
from services.operator_contracts_service import CONTRACTS, _save_contracts
from services.operator_treasury_ledger_service import reserve_funds, settle_reserved_funds
from services.operator_allocations_service import consume_allocation_capacity, settle_allocation_capacity

def _now():
    return datetime.now(timezone.utc).isoformat()

def _id(prefix):
    return f"{prefix}_{uuid.uuid4().hex[:12]}"

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "contract_issuances.json"

def _load_issuances():
    if DATA_FILE.exists():
        try:
            with open(DATA_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def _save_issuances():
    with open(DATA_FILE, "w") as f:
        json.dump(ISSUANCES, f, indent=2)

ISSUANCES = _load_issuances()

def issue_contract(contract_id: str, body: dict):
    contract = CONTRACTS.get(contract_id)
    if not contract:
        return {"ok": False, "error": "contract not found"}

    if contract.get("status") != "active":
        return {"ok": False, "error": "contract must be active before issuance"}

    max_supply = contract.get("max_supply")
    active_count = int(contract.get("active_count", 0))
    if max_supply is not None and active_count >= int(max_supply):
        return {"ok": False, "error": "contract max_supply reached"}

    issuance_id = _id("ctri")
    now = _now()

    issuance = {
        "id": issuance_id,
        "contract_id": contract_id,
        "contract_code": contract.get("contract_code"),
        "participant_id": body["participant_id"],
        "program_id": body["program_id"],
        "submission_id": body.get("submission_id"),
        "state": "issued",
        "reserved_amount": None,
        "payout_amount": float(contract["payout_amount"]),
        "issued_at": now,
        "submitted_at": None,
        "verified_at": None,
        "settled_at": None,
        "created_at": now,
        "updated_at": now,
        "actor_id": body["actor_id"],
    }

    consume_result = consume_allocation_capacity(
        pool_id=contract.get("pool_id"),
        contract_id=contract_id,
        actor_id=body["actor_id"],
        issuance_id=issuance_id,
    )
    if not consume_result.get("ok"):
        return consume_result

    ISSUANCES[issuance_id] = issuance
    _save_issuances()

    contract["active_count"] = active_count + 1
    contract["updated_at"] = now
    _save_contracts()

    evt = write_operator_event(
        "contract_issued",
        "contract_issuance",
        issuance_id,
        body["actor_id"],
        issuance,
    )
    return {"ok": True, "issuance": issuance, "event_id": evt["id"]}

def list_issuances(state=None, contract_id=None, participant_id=None):
    items = list(ISSUANCES.values())
    if state:
        items = [x for x in items if x.get("state") == state]
    if contract_id:
        items = [x for x in items if x.get("contract_id") == contract_id]
    if participant_id:
        items = [x for x in items if x.get("participant_id") == participant_id]
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items

def get_issuance(issuance_id: str):
    issuance = ISSUANCES.get(issuance_id)
    if not issuance:
        return {"ok": False, "error": "issuance not found"}
    return {"ok": True, "issuance": issuance}

def submit_issuance(issuance_id: str, body: dict):
    issuance = ISSUANCES.get(issuance_id)
    if not issuance:
        return {"ok": False, "error": "issuance not found"}

    if issuance["state"] != "issued":
        return {"ok": False, "error": "only issued contracts can be submitted"}

    issuance["state"] = "submitted"
    issuance["submission_id"] = body.get("submission_id") or issuance.get("submission_id")
    issuance["submitted_at"] = _now()
    issuance["updated_at"] = issuance["submitted_at"]
    _save_issuances()

    evt = write_operator_event(
        "contract_submitted",
        "contract_issuance",
        issuance_id,
        body["actor_id"],
        issuance,
    )
    return {"ok": True, "issuance": issuance, "event_id": evt["id"]}

def verify_issuance(issuance_id: str, body: dict):
    issuance = ISSUANCES.get(issuance_id)
    if not issuance:
        return {"ok": False, "error": "issuance not found"}

    if issuance["state"] != "submitted":
        return {"ok": False, "error": "only submitted issuances can be verified"}

    contract = CONTRACTS.get(issuance["contract_id"])
    if not contract:
        return {"ok": False, "error": "contract not found for issuance"}

    pool_id = contract.get("pool_id")
    if not pool_id:
        return {"ok": False, "error": "contract missing pool_id"}

    reserve_result = reserve_funds(
        pool_id=pool_id,
        amount=float(issuance["payout_amount"]),
        ref_type="contract_issuance",
        ref_id=issuance_id,
        actor_id=body["actor_id"],
    )
    if not reserve_result.get("ok"):
        return reserve_result

    issuance["state"] = "verified"
    issuance["reserved_amount"] = float(issuance["payout_amount"])
    issuance["verified_at"] = _now()
    issuance["updated_at"] = issuance["verified_at"]
    _save_issuances()

    evt = write_operator_event(
        "contract_verified",
        "contract_issuance",
        issuance_id,
        body["actor_id"],
        issuance,
    )
    return {"ok": True, "issuance": issuance, "event_id": evt["id"]}

def settle_issuance(issuance_id: str, body: dict):
    issuance = ISSUANCES.get(issuance_id)
    if not issuance:
        return {"ok": False, "error": "issuance not found"}

    if issuance["state"] != "verified":
        return {"ok": False, "error": "only verified issuances can be settled"}

    contract = CONTRACTS.get(issuance["contract_id"])
    if not contract:
        return {"ok": False, "error": "contract not found for issuance"}

    pool_id = contract.get("pool_id")
    if not pool_id:
        return {"ok": False, "error": "contract missing pool_id"}

    settle_result = settle_reserved_funds(
        pool_id=pool_id,
        amount=float(issuance["payout_amount"]),
        ref_type="contract_issuance",
        ref_id=issuance_id,
        actor_id=body["actor_id"],
    )
    if not settle_result.get("ok"):
        return settle_result

    issuance["state"] = "settled"
    issuance["settled_at"] = _now()
    issuance["updated_at"] = issuance["settled_at"]
    _save_issuances()

    contract = CONTRACTS.get(issuance["contract_id"])
    if contract:
        contract["fulfilled_count"] = int(contract.get("fulfilled_count", 0)) + 1
        active_count = int(contract.get("active_count", 0))
        contract["active_count"] = max(0, active_count - 1)
        contract["updated_at"] = issuance["settled_at"]
        _save_contracts()

        settle_allocation_capacity(
            pool_id=contract.get("pool_id"),
            contract_id=issuance["contract_id"],
            actor_id=body["actor_id"],
            issuance_id=issuance_id,
        )

    evt = write_operator_event(
        "contract_settled",
        "contract_issuance",
        issuance_id,
        body["actor_id"],
        issuance,
    )
    return {"ok": True, "issuance": issuance, "event_id": evt["id"]}
