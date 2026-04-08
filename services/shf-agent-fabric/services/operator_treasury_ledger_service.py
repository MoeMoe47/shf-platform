from datetime import datetime, timezone
import json
import uuid
from pathlib import Path

def _now():
    return datetime.now(timezone.utc).isoformat()

def _id(prefix):
    return f"{prefix}_{uuid.uuid4().hex[:12]}"

LEDGER_FILE = Path(__file__).resolve().parent.parent / "data" / "treasury_ledger.json"
BAL_FILE = Path(__file__).resolve().parent.parent / "data" / "pool_balances.json"

def _load_json(path, default):
    if path.exists():
        try:
            with open(path, "r") as f:
                return json.load(f)
        except Exception:
            return default
    return default

def _save_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

LEDGER = _load_json(LEDGER_FILE, [])
POOL_BALANCES = _load_json(BAL_FILE, {})

def save_all():
    _save_json(LEDGER_FILE, LEDGER)
    _save_json(BAL_FILE, POOL_BALANCES)

def ensure_pool_balance(pool_id: str):
    if pool_id not in POOL_BALANCES:
        POOL_BALANCES[pool_id] = {
            "pool_id": pool_id,
            "committed_amount": 0.0,
            "reserved_amount": 0.0,
            "settled_amount": 0.0,
            "available_amount": 0.0,
            "updated_at": _now(),
        }
        save_all()
    return POOL_BALANCES[pool_id]

def seed_pool_balance(pool_id: str, committed_amount: float):
    bal = ensure_pool_balance(pool_id)
    bal["committed_amount"] = float(committed_amount)
    bal["available_amount"] = float(committed_amount) - float(bal["reserved_amount"]) - float(bal["settled_amount"])
    bal["updated_at"] = _now()
    save_all()
    return bal

def reserve_funds(pool_id: str, amount: float, ref_type: str, ref_id: str, actor_id: str):
    bal = ensure_pool_balance(pool_id)
    amount = float(amount)

    if bal["available_amount"] < amount:
        return {"ok": False, "error": "insufficient available pool balance"}

    bal["reserved_amount"] += amount
    bal["available_amount"] -= amount
    bal["updated_at"] = _now()

    entry = {
        "id": _id("led"),
        "entry_type": "reserve_created",
        "pool_id": pool_id,
        "amount": amount,
        "ref_type": ref_type,
        "ref_id": ref_id,
        "actor_id": actor_id,
        "created_at": _now(),
    }
    LEDGER.append(entry)
    save_all()
    return {"ok": True, "entry": entry, "balance": bal}

def settle_reserved_funds(pool_id: str, amount: float, ref_type: str, ref_id: str, actor_id: str):
    bal = ensure_pool_balance(pool_id)
    amount = float(amount)

    if bal["reserved_amount"] < amount:
        return {"ok": False, "error": "insufficient reserved balance"}

    bal["reserved_amount"] -= amount
    bal["settled_amount"] += amount
    bal["updated_at"] = _now()

    entry = {
        "id": _id("led"),
        "entry_type": "settlement_completed",
        "pool_id": pool_id,
        "amount": amount,
        "ref_type": ref_type,
        "ref_id": ref_id,
        "actor_id": actor_id,
        "created_at": _now(),
    }
    LEDGER.append(entry)
    save_all()
    return {"ok": True, "entry": entry, "balance": bal}

def list_ledger(limit=100):
    return list(reversed(LEDGER[-limit:]))

def list_pool_balances():
    items = list(POOL_BALANCES.values())
    items.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
    return items
