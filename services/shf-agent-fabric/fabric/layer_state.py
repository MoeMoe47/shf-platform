from fabric.agent_store import is_layer_enabled, set_layer_enabled, list_disabled_layers

def get_layer_enabled(layer: str, default: bool = True) -> bool:
    if not layer:
        return default
    return is_layer_enabled(layer)

def set_layer_enabled_flag(layer: str, enabled: bool) -> bool:
    return set_layer_enabled(layer, enabled)

def get_all_layer_flags() -> dict:
    return list_disabled_layers()
