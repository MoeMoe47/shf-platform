from __future__ import annotations
import os
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from typing import Literal, Optional, List
from .store import load_registry, save_registry
from .containment import load_flags, save_flags, force_app_state, clear_forced_app_state
from .audit import write_audit

router = APIRouter(prefix="/admin/align", tags=["alignment-admin"])
SwarmState = Literal["OFF", "LIMITED", "ON"]

def require_admin_key(x_admin_key: str | None):
    expected = (os.getenv("ADMIN_API_KEY", "") or "").strip()
    if not expected:
        raise HTTPException(status_code=500, detail="ADMIN_API_KEY not set on server")
    if not x_admin_key or x_admin_key.strip() != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")

class PatchState(BaseModel):
    state: SwarmState

class PatchContainment(BaseModel):
    block_agents: Optional[List[str]] = None
    block_capabilities: Optional[List[str]] = None

@router.get("/apps")
def apps(x_admin_key: str | None = Header(default=None)):
    require_admin_key(x_admin_key)
    reg = load_registry()
    return {"apps": [a.model_dump() for a in reg.values()]}

@router.patch("/apps/{app_id}/state")
def set_state(app_id: str, body: PatchState, x_admin_key: str | None = Header(default=None)):
    require_admin_key(x_admin_key)
    reg = load_registry()
    if app_id not in reg:
        raise HTTPException(status_code=404, detail="unknown app_id")
    reg[app_id].swarm.state = body.state
    save_registry(reg)
    audit_ref = write_audit({"kind":"admin_app_state","app_id":app_id,"state":body.state})
    return {"ok": True, "app_id": app_id, "state": body.state, "audit_ref": audit_ref}

@router.get("/containment")
def get_containment(x_admin_key: str | None = Header(default=None)):
    require_admin_key(x_admin_key)
    return load_flags()

@router.patch("/containment")
def patch_containment(body: PatchContainment, x_admin_key: str | None = Header(default=None)):
    require_admin_key(x_admin_key)
    flags = load_flags()
    if body.block_agents is not None:
        flags.setdefault("agents", {})["blocked"] = body.block_agents
    if body.block_capabilities is not None:
        flags.setdefault("capabilities", {})["blocked"] = body.block_capabilities
    save_flags(flags)
    audit_ref = write_audit({"kind":"admin_containment_patch","flags":flags})
    return {"ok": True, "flags": flags, "audit_ref": audit_ref}

@router.post("/containment/apps/{app_id}/{state}")
def force_app(app_id: str, state: SwarmState, x_admin_key: str | None = Header(default=None)):
    require_admin_key(x_admin_key)
    force_app_state(app_id, state)
    audit_ref = write_audit({"kind":"admin_force_app_state","app_id":app_id,"state":state})
    return {"ok": True, "app_id": app_id, "forced_state": state, "audit_ref": audit_ref}

@router.delete("/containment/apps/{app_id}")
def clear_forced(app_id: str, x_admin_key: str | None = Header(default=None)):
    require_admin_key(x_admin_key)
    clear_forced_app_state(app_id)
    audit_ref = write_audit({"kind":"admin_clear_forced_app_state","app_id":app_id})
    return {"ok": True, "app_id": app_id, "audit_ref": audit_ref}
