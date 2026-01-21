from __future__ import annotations

import os
from fastapi import Header, HTTPException

def require_admin_key(x_admin_key: str | None = Header(default=None, alias="X-Admin-Key")):
    expected = os.environ.get("ADMIN_API_KEY")
    if not expected:
        raise HTTPException(status_code=500, detail="ADMIN_API_KEY not set")
    if not x_admin_key or x_admin_key != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True
