import json
from pathlib import Path
from threading import Lock

BASE = Path(__file__).resolve().parent.parent / "db"
AGENT_FLAGS = BASE / "agent_flags.json"
LAYER_FLAGS = BASE / "layer_flags.json"

_lock = Lock()

def _read(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text() or "{}")
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}

def _write(path: Path, data: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n")

def _normalize_disabled_only(flags: dict) -> dict:
    out = {}
    for k, v in (flags or {}).items():
        if v is True:
            out[str(k)] = True
    return out

def is_agent_enabled(name: str) -> bool:
    flags = _normalize_disabled_only(_read(AGENT_FLAGS))
    return not flags.get(name, False)

def set_agent_enabled(name: str, enabled: bool):
    with _lock:
        flags = _normalize_disabled_only(_read(AGENT_FLAGS))
        if enabled:
            flags.pop(name, None)
        else:
            flags[str(name)] = True
        _write(AGENT_FLAGS, flags)
        return enabled

def list_disabled_agents() -> dict:
    return _normalize_disabled_only(_read(AGENT_FLAGS))

def is_layer_enabled(layer: str) -> bool:
    flags = _normalize_disabled_only(_read(LAYER_FLAGS))
    return not flags.get(layer, False)

def set_layer_enabled(layer: str, enabled: bool):
    with _lock:
        flags = _normalize_disabled_only(_read(LAYER_FLAGS))
        if enabled:
            flags.pop(layer, None)
        else:
            flags[str(layer)] = True
        _write(LAYER_FLAGS, flags)
        return enabled

def list_disabled_layers() -> dict:
    return _normalize_disabled_only(_read(LAYER_FLAGS))
