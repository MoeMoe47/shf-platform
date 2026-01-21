import os
from fastapi import Header, HTTPException

def require_admin_key(x_admin_key: str = Header(default=None)):
    expected = (os.getenv("ADMIN_API_KEY", "") or "").strip()
    if not expected:
        raise HTTPException(status_code=500, detail="ADMIN_API_KEY not set on server")
    if not x_admin_key or x_admin_key.strip() != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")
