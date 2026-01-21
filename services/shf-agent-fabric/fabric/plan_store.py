import json
import secrets
from pathlib import Path
from threading import Lock

BASE_DIR = Path(__file__).resolve().parents[1]
PLANS_DIR = BASE_DIR / "db" / "plans"
_lock = Lock()

def _ensure_dirs():
    PLANS_DIR.mkdir(parents=True, exist_ok=True)

def _path(plan_id: str) -> Path:
    _ensure_dirs()
    return PLANS_DIR / f"{plan_id}.json"

def save_plan(plan: dict) -> str:
    plan_id = plan.get("planId") or secrets.token_hex(8)
    plan["planId"] = plan_id
    with _lock:
        _path(plan_id).write_text(json.dumps(plan, indent=2, sort_keys=True) + "\n")
    return plan_id

def load_plan(plan_id: str) -> dict | None:
    p = _path(plan_id)
    if not p.exists():
        return None
    return json.loads(p.read_text())

def mark_plan_status(plan_id: str, status: str) -> bool:
    with _lock:
        plan = load_plan(plan_id)
        if not plan:
            return False
        plan["status"] = status
        _path(plan_id).write_text(json.dumps(plan, indent=2, sort_keys=True) + "\n")
        return True

def list_recent_plans(limit: int = 10) -> list[dict]:
    _ensure_dirs()
    files = sorted(PLANS_DIR.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    out = []
    for p in files[: max(0, int(limit))]:
        try:
            out.append(json.loads(p.read_text()))
        except Exception:
            continue
    return out
