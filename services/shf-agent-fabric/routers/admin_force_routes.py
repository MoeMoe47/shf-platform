from fastapi import APIRouter, Depends
from fabric.admin_auth import require_admin_key
from fabric.force_mode import force_enabled

router = APIRouter(prefix="/admin/force", tags=["admin-force"])

@router.get("/status", dependencies=[Depends(require_admin_key)])
def force_status():
    return {"ok": True, "force_enabled": bool(force_enabled())}
