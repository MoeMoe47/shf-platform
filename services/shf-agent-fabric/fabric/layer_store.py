import json
from pathlib import Path

LAYERS_FILE = Path(__file__).resolve().parent.parent / "db" / "layer_flags.json"

def _load() -> dict:
    try:
        if LAYERS_FILE.exists():
            return json.loads(LAYERS_FILE.read_text()) or {}
    except Exception:
        pass
    return {}

def _save(data: dict) -> None:
    LAYERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    LAYERS_FILE.write_text(json.dumps(data, indent=2) + "\n")

def is_layer_enabled(layer: str, default: bool = True) -> bool:
    data = _load()
    if layer in data:
        return not data[layer]   # stored = disabled
    return default

def set_layer_enabled(layer: str, enabled: bool) -> bool:
    data = _load()
    if enabled:
        data.pop(layer, None)
    else:
        data[layer] = True
    _save(data)
    return enabled

def list_layer_flags() -> dict:
    return _load()
