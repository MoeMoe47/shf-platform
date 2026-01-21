from fastapi import APIRouter
from fabric.security_client import get_security_status
from fabric.runtime_state import get_mode

router = APIRouter()

@router.get("/status")
def status():
    return {
        "fabric": {"mode": get_mode()},
        "security": get_security_status()
    }
