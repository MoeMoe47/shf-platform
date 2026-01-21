from fastapi import HTTPException
from fabric.runtime_state import get_mode

def require_mode_on():
    if get_mode() != "ON":
        raise HTTPException(status_code=503, detail="Agent Fabric is OFF (FABRIC_MODE=OFF)")
