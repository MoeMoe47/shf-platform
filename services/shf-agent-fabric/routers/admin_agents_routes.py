from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from fabric.registry import list_agents, get_agent_by_name
from fabric.agent_store import is_agent_enabled, set_agent_enabled, list_disabled_agents
from fabric.admin_auth import require_admin_key
from fabric.feedback import log_event

router = APIRouter(prefix="/admin/agents", tags=["admin-agents"], dependencies=[Depends(require_admin_key)])

class EnabledBody(BaseModel):
    enabled: bool

@router.get("")
def admin_list_agents():
    overrides = list_disabled_agents()
    agents = []
    for a in list_agents():
        name = a.get("name")
        agents.append({
            "name": name,
            "agentId": a.get("agentId"),
            "layer": a.get("layer"),
            "enabled": is_agent_enabled(name),
            "policy": a.get("policy", {}),
        })
    return {"agents": agents, "overrides": overrides}

@router.get("/{name}/enabled")
def admin_get_agent_enabled(name: str):
    agent = get_agent_by_name(name)
    if not agent:
        raise HTTPException(status_code=404, detail="agent not found")
    return {"name": name, "enabled": is_agent_enabled(name)}

@router.post("/{name}/enabled")
def admin_set_agent_enabled(name: str, body: EnabledBody):
    agent = get_agent_by_name(name)
    if not agent:
        raise HTTPException(status_code=404, detail="agent not found")

    enabled = set_agent_enabled(name, body.enabled)
    log_event(kind="admin", outcome="ok", agent_name=name, agent_id=agent.get("agentId"), layer=agent.get("layer"),
              message=f"agent enabled set to {enabled}")
    return {"name": name, "enabled": enabled}
