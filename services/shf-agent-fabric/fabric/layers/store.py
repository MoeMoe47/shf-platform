import json
from pathlib import Path
from typing import Any, Dict, List

DEFAULT_LAYER_REGISTRY_PATH = Path("contracts/layers/layer_registry.json")


class LayerRegistryError(Exception):
    pass


def load_layer_registry(path: Path = DEFAULT_LAYER_REGISTRY_PATH) -> Dict[str, Any]:
    if not path.exists():
        raise LayerRegistryError(f"Layer registry not found: {path}")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        raise LayerRegistryError(f"Layer registry parse error: {e}")

    if "layers" not in data or not isinstance(data["layers"], list):
        raise LayerRegistryError("Layer registry must include a top-level 'layers' array")

    # Basic sanity: layer_id uniqueness
    seen = set()
    for L in data["layers"]:
        lid = L.get("layer_id")
        if lid in seen:
            raise LayerRegistryError(f"Duplicate layer_id detected: {lid}")
        seen.add(lid)

    return data


def active_layers(reg: Dict[str, Any]) -> List[Dict[str, Any]]:
    layers = reg.get("layers", [])
    return [L for L in layers if L.get("status") == "active"]


def layer_index(reg: Dict[str, Any]) -> Dict[int, Dict[str, Any]]:
    return {int(L["layer_id"]): L for L in reg.get("layers", []) if "layer_id" in L}

def verify_layers_registry() -> dict:
    """
    Infra-facing verify: layers registry exists + is valid JSON + has minimal structure.
    Returns a dict (never raises in normal conditions).
    """
    try:
        path = DEFAULT_LAYER_REGISTRY_PATH
        if hasattr(path, "__fspath__"):
            path_str = str(path)
        else:
            path_str = str(DEFAULT_LAYER_REGISTRY_PATH)

        pth = Path(path_str)
        if not pth.exists():
            return {"ok": False, "layers": 0, "path": path_str, "error": "missing_file"}

        data = json.loads(pth.read_text(encoding="utf-8"))

        # Accept either {"layers":[...]} or raw list [...]
        if isinstance(data, dict) and "layers" in data and isinstance(data["layers"], list):
            n = len(data["layers"])
            return {"ok": True, "layers": n, "path": path_str, "error": ""}
        if isinstance(data, list):
            return {"ok": True, "layers": len(data), "path": path_str, "error": ""}

        return {"ok": False, "layers": 0, "path": path_str, "error": "unexpected_shape"}
    except Exception as e:
        return {"ok": False, "layers": 0, "path": str(DEFAULT_LAYER_REGISTRY_PATH), "error": f"{type(e).__name__}: {e}"}

