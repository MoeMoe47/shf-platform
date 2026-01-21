from __future__ import annotations

import os
import json
from pathlib import Path
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from typing import Optional

from routers.runs_routes import validate_run, dry_run, execute_run
from .audit import write_audit

router = APIRouter(prefix="/admin/align/plans", tags=["alignment-admin-plans"])

ROOT = Path(__file__).resolve().parents[2]
PLANS_DIR = ROOT / "db" / "plans"

def require_admin_key(x_admin_key: str | None):
    expected = (os.getenv("ADMIN_API_KEY", "") or "").strip()
    if not expected:
        raise HTTPException(status_code=500, detail="ADMIN_API_KEY not set on server")
    if not x_admin_key or x_admin_key.strip() != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")

class ApproveExecuteBody(BaseModel):
    approved: bool = True

@router.get("")
def list_plans(x_admin_key: str | None = Header(default=None, alias="X-Admin-Key")):
    require_admin_key(x_admin_key)
    PLANS_DIR.mkdir(parents=True, exist_ok=True)
    out = []
    for p in sorted(PLANS_DIR.glob("*.json")):
        pid = p.stem
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            data = {}
        out.append({
            "planId": pid,
            "file": str(p),
            "status": data.get("status"),
            "approvalRequired": data.get("approvalRequired", True),
            "approved": data.get("approved"),
            "agent": (data.get("agent") or {}).get("name") if isinstance(data.get("agent"), dict) else None,
            "requestId": data.get("requestId"),
            "executedAt": data.get("executedAt"),
        })
    return {"plans": out}

@router.post("/{plan_id}/validate")
def admin_validate(plan_id: str, x_admin_key: str | None = Header(default=None, alias="X-Admin-Key")):
    require_admin_key(x_admin_key)
    res = validate_run({"planId": plan_id}, x_admin_key=x_admin_key)
    audit_ref = write_audit({"kind":"admin_plan_validate","planId":plan_id})
    return {"ok": True, "planId": plan_id, "validation": res.get("validation"), "audit_ref": audit_ref}

@router.post("/{plan_id}/dry-run")
def admin_dry_run(plan_id: str, x_admin_key: str | None = Header(default=None, alias="X-Admin-Key")):
    require_admin_key(x_admin_key)
    res = dry_run({"planId": plan_id}, x_admin_key=x_admin_key)
    audit_ref = write_audit({"kind":"admin_plan_dry_run","planId":plan_id})
    return {"ok": True, "planId": plan_id, "wouldWrite": res.get("wouldWrite", []), "validation": res.get("validation"), "audit_ref": audit_ref}

@router.post("/{plan_id}/approve-execute")
def admin_approve_execute(plan_id: str, body: ApproveExecuteBody, x_admin_key: str | None = Header(default=None, alias="X-Admin-Key")):
    require_admin_key(x_admin_key)
    payload = {"planId": plan_id, "approved": bool(body.approved)}
    res = execute_run(payload, x_admin_key=x_admin_key)
    audit_ref = write_audit({"kind":"admin_plan_approve_execute","planId":plan_id,"approved":bool(body.approved),"runId":res.get("runId")})
    return {**res, "audit_ref": audit_ref}
