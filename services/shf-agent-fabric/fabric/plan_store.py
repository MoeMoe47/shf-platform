import json
import secrets
from datetime import datetime, timezone
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
        plan["statusUpdatedAt"] = datetime.now(timezone.utc).isoformat()
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


class PlanDecisionError(Exception):
    def __init__(self, code: str):
        super().__init__(code)
        self.code = code


def record_approval_decision(plan_id: str, decision: dict, may_decide) -> dict:
    """Atomically check eligibility and record an attributable approval decision.

    `may_decide(plan)` returns None or a refusal code. The decision is kept as
    `approvalDecision` (current) and appended to `approvalHistory` (all decisions).
    """
    with _lock:
        plan = load_plan(plan_id)
        if not plan:
            raise PlanDecisionError("PLAN_NOT_FOUND")
        refusal = may_decide(plan)
        if refusal:
            raise PlanDecisionError(refusal)
        approved = decision["decision"] == "APPROVED"
        plan["status"] = "APPROVED" if approved else "REJECTED"
        plan["approved"] = approved
        plan["statusUpdatedAt"] = decision["decided_at"]
        if not plan.get("correlationId") and decision.get("correlation_id"):
            plan["correlationId"] = decision["correlation_id"]
            plan["correlationSource"] = decision.get("correlation_source")
        plan["approvalDecision"] = decision
        plan.setdefault("approvalHistory", []).append(decision)
        _path(plan_id).write_text(json.dumps(plan, indent=2, sort_keys=True) + "\n")
        return plan
