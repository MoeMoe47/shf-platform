from fastapi import APIRouter, Depends
from pydantic import BaseModel

from fabric.admin_auth import require_admin_key
from fabric.runtime_state import get_mode, set_mode
from fabric.registry import list_agents
from fabric.agent_store import (
    set_agent_enabled,
    set_layer_enabled,
    list_disabled_agents,
    list_disabled_layers,
)
from fabric.feedback import log_event

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin_key)],
)

class ModeBody(BaseModel):
    mode: str

class EnabledBody(BaseModel):
    enabled: bool

@router.get("/mode")
def read_mode():
    return {"mode": get_mode()}

@router.post("/mode")
def update_mode(body: ModeBody):
    m = set_mode(body.mode)
    log_event(kind="admin", outcome="ok", message=f"mode={m}")
    return {"mode": m}

@router.get("/agents")
def agents_summary():
    disabled = list_disabled_agents()
    return {
        "agents": [
            {
                "name": a["name"],
                "agentId": a["agentId"],
                "layer": a["layer"],
                "enabled": a["name"] not in disabled,
                "policy": a.get("policy", {}),
            }
            for a in list_agents()
        ],
        "overrides": disabled,
    }

@router.post("/agents/{name}/enabled")
def set_agent(name: str, body: EnabledBody):
    enabled = set_agent_enabled(name, body.enabled)
    log_event(kind="admin", outcome="ok", message=f"agent {name} enabled={enabled}")
    return {"name": name, "enabled": enabled}

@router.get("/layers")
def layers_summary():
    disabled = list_disabled_layers()
    layers = sorted({a.get("layer") for a in list_agents() if a.get("layer")})
    return {
        "layers": [{"layer": L, "enabled": L not in disabled} for L in layers],
        "overrides": disabled,
    }

@router.post("/layers/{layer}/enabled")
def set_layer(layer: str, body: EnabledBody):
    enabled = set_layer_enabled(layer, body.enabled)
    log_event(kind="admin", outcome="ok", message=f"layer {layer} enabled={enabled}")
    return {"layer": layer, "enabled": enabled}
