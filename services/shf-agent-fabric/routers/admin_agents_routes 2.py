from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Any

from fabric.registry import (
    list_agents,
    get_agent_by_name,
    reload_agents,
    write_agent_spec,
)
from fabric.agent_store import is_agent_enabled, set_agent_enabled, list_disabled_agents
from fabric.admin_auth import require_admin_key
from fabric.feedback import log_event
from fabric.registry_canon import list_entities

router = APIRouter(
    prefix="/admin/agents",
    tags=["admin-agents"],
    dependencies=[Depends(require_admin_key)],
)

class EnabledBody(BaseModel):
    enabled: bool

class PublishBody(BaseModel):
    spec: dict[str, Any]

@router.get("")
def admin_list_agents():
    overrides = list_disabled_agents()
    agents = []
    for a in list_entities(kind='agent'):
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
    agent = get_entity(name)
    if not agent:
        raise HTTPException(status_code=404, detail="agent not found")
    return {"name": name, "enabled": is_agent_enabled(name)}

@router.post("/{name}/enabled")
def admin_set_agent_enabled(name: str, body: EnabledBody):
    agent = get_entity(name)
    if not agent:
        raise HTTPException(status_code=404, detail="agent not found")

    enabled = set_agent_enabled(name, body.enabled)
    log_event(
        kind="admin",
        outcome="ok",
        agent_name=name,
        agent_id=agent.get("agentId"),
        layer=agent.get("layer"),
        message=f"agent enabled set to {enabled}",
    )
    return {"name": name, "enabled": enabled}

@router.get("/registry/reload")
def admin_registry_reload():
    r = reload_agents()
    log_event(kind="admin", outcome="ok", message=f"registry reload count={r.get('count')}")
    return r

@router.get("/registry/{name}")
def admin_registry_get_raw(name: str):
    agent = get_entity(name)
    if not agent:
        raise HTTPException(status_code=404, detail="agent not found")
    return {
        "name": agent.get("name"),
        "agentId": agent.get("agentId"),
        "layer": agent.get("layer"),
        "policy": agent.get("policy", {}),
        "source": agent.get("source"),
        "raw": agent.get("raw"),
        "enabled": is_agent_enabled(name),
    }

@router.post("/registry/publish")
def admin_registry_publish(body: PublishBody):
    r = write_agent_spec(body.spec)
    if not r.get("ok"):
        raise HTTPException(status_code=400, detail=r.get("error") or "publish failed")

    name = r.get("name")
    agent = get_entity(name) if name else None
    log_event(
        kind="admin",
        outcome="ok",
        agent_name=name,
        agent_id=(agent.get("agentId") if agent else None),
        layer=(agent.get("layer") if agent else None),
        message="agent spec published",
    )
    return r
