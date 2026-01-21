import os

def _env_bool(key: str, default: str = "0") -> bool:
    val = (os.getenv(key, default) or "").strip().lower()
    return val in ("1", "true", "yes", "on")

ADMIN_API_KEY = (os.getenv("ADMIN_API_KEY", "") or "").strip()
SECURITY_ENABLED = _env_bool("SECURITY_ENABLED", "0")
SECURITY_BASE_URL = (os.getenv("SECURITY_BASE_URL", "http://127.0.0.1:8091") or "").strip()
FABRIC_MODE_DEFAULT = (os.getenv("FABRIC_MODE", "ON") or "ON").strip().upper()
