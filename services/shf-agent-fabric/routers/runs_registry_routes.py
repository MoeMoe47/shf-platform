from fastapi import APIRouter

router = APIRouter(prefix="/runs/registry", tags=["runs-registry"])

@router.get("/ping")
def ping():
    return {"ok": True, "service": "runs-registry", "mode": "stub"}
