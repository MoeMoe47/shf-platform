from fastapi import APIRouter

router = APIRouter(prefix="/registry", tags=["registry"])

@router.get("/ping")
def ping():
    return {"ok": True, "service": "registry", "mode": "stub"}
