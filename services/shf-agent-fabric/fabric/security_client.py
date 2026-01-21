import os
import requests
from fabric.settings import SECURITY_ENABLED, SECURITY_BASE_URL

def get_security_status():
    enabled = SECURITY_ENABLED
    base = (SECURITY_BASE_URL or "http://127.0.0.1:8091").strip()

    if not enabled:
        return {"ok": True, "mode": "stub", "baseUrl": base, "note": "SECURITY_ENABLED=0 (disabled)."}

    try:
        r = requests.get(f"{base}/status", timeout=1.5)
        r.raise_for_status()
        data = r.json()
        return {"ok": True, "mode": "live", "baseUrl": base, "security": data}
    except Exception as e:
        return {"ok": False, "mode": "live", "baseUrl": base, "error": str(e)}
