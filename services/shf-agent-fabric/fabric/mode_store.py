import json
from pathlib import Path

MODE_FILE = Path(__file__).resolve().parent.parent / "db" / "fabric_mode.json"

def read_mode(default: str = "ON") -> str:
    try:
        if MODE_FILE.exists():
            data = json.loads(MODE_FILE.read_text() or "{}")
            m = (data.get("mode") or default).upper().strip()
            if m in ("ON", "OFF"):
                return m
    except Exception:
        pass
    return default

def write_mode(mode: str) -> str:
    mode = (mode or "ON").upper().strip()
    if mode not in ("ON", "OFF"):
        mode = "ON"
    MODE_FILE.parent.mkdir(parents=True, exist_ok=True)
    MODE_FILE.write_text(json.dumps({"mode": mode}, indent=2) + "\n")
    return mode
