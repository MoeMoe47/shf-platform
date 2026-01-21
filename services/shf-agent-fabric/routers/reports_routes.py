from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/snapshot")
def snapshot():
    return {
        "ts": datetime.utcnow().isoformat(),
        "usage": {"requests": 0, "users": 0, "apps": 0},
        "containment": {"limited": 0, "off": 0, "on": 0, "forced": 0},
        "outcomes": {"executed": 0, "failed": 0},
        "system": {"errors": 0, "p95_ms": 0}
    }

@router.get("/usage.csv")
def usage_csv():
    return "requests,users,apps\n0,0,0\n"

@router.get("/containment.csv")
def containment_csv():
    return "limited,off,on,forced\n0,0,0,0\n"

@router.get("/outcomes.csv")
def outcomes_csv():
    return "executed,failed\n0,0\n"

@router.get("/system.csv")
def system_csv():
    return "errors,p95_ms\n0,0\n"
