from fabric.agent_store import is_agent_enabled, is_layer_enabled

def agent_allowed(agent: dict) -> bool:
    name = agent.get("name")
    layer = agent.get("layer")
    if layer and not is_layer_enabled(layer):
        return False
    if name and not is_agent_enabled(name):
        return False
    return True
