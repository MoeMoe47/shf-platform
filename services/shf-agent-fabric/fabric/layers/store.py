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
