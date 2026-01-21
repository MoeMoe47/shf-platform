from fastapi import APIRouter, Depends
from pydantic import BaseModel
from fabric.registry import list_agents
from fabric.agent_store import is_layer_enabled, set_layer_enabled, list_disabled_layers
from fabric.admin_auth import require_admin_key
from fabric.feedback import log_event

router = APIRouter(prefix="/admin/layers", tags=["admin-layers"], dependencies=[Depends(require_admin_key)])

class EnabledBody(BaseModel):
    enabled: bool

@router.get("")
def list_layers():
    overrides = list_disabled_layers()
    layers = sorted({a.get("layer") for a in list_agents() if a.get("layer")})
    return {
        "layers": [{"layer": L, "enabled": is_layer_enabled(L)} for L in layers],
        "overrides": overrides,
    }

@router.get("/{layer}/enabled")
def read_layer(layer: str):
    return {"layer": layer, "enabled": is_layer_enabled(layer)}

@router.post("/{layer}/enabled")
def update_layer(layer: str, body: EnabledBody):
    enabled = set_layer_enabled(layer, body.enabled)
    log_event(kind="admin", outcome="ok", layer=layer, message=f"layer enabled set to {enabled}")
    return {"layer": layer, "enabled": enabled}
