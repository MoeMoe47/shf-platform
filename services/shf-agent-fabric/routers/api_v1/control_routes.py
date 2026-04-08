from fastapi import APIRouter
from services.control_service import create_hold, release_hold

router = APIRouter(prefix="/api/v1/control", tags=["control"])

@router.post("/hold")
def create_control_hold(body: dict):
    result = create_hold(
        body.get("entity_type"),
        body.get("entity_id"),
        body.get("reason")
    )
    return {"ok": True, "result": result}

@router.post("/release")
def release_control_hold(body: dict):
    result = release_hold(body.get("hold_id"))
    return {"ok": True, "result": result}
