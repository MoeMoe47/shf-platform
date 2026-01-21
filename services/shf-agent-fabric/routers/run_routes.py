from fastapi import APIRouter
from pydantic import BaseModel
from fabric.registry import find_agent_by_name
from fabric.runtime_state import get_mode
from fabric.agent_state import agent_allowed
from fabric.feedback import log_event
from fabric.planner import build_plan
from fabric.run_ledger import write_run_event
import secrets

router = APIRouter(tags=["run"])

class RunBody(BaseModel):
    agentName: str
    input: dict

@router.post("/run")
def run(body: RunBody):
    request_id = secrets.token_hex(6)

    if get_mode() != "ON":
        log_event(kind="run", outcome="blocked", message="FABRIC_MODE=OFF", request_id=request_id)
        write_run_event(request_id=request_id, route="run", outcome="blocked", message="FABRIC_MODE=OFF")
        return {"ok": False, "requestId": request_id, "blocked": True, "reason": "FABRIC_MODE=OFF"}

    agent = find_agent_by_name(body.agentName)
    if not agent:
        log_event(kind="run", outcome="error", message=f"unknown agent {body.agentName}", request_id=request_id)
        write_run_event(request_id=request_id, route="run", outcome="error", message="unknown agent")
        return {"ok": False, "requestId": request_id, "error": "unknown agent"}

    if not agent_allowed(agent):
        log_event(
            kind="run",
            outcome="blocked",
            agent_name=agent.get("name"),
            agent_id=agent.get("agentId"),
            layer=agent.get("layer"),
            message="agent or layer disabled",
            request_id=request_id,
        )
        write_run_event(
            request_id=request_id,
            route="run",
            outcome="blocked",
            agent_name=agent.get("name"),
            agent_id=agent.get("agentId"),
            layer=agent.get("layer"),
            message="agent or layer disabled",
        )
        return {"ok": False, "requestId": request_id, "blocked": True, "reason": "agent or layer disabled"}

    policy = agent.get("policy") or {}
    if policy.get("humanApproval", False):
        plan_obj = build_plan(agent, body.input)
        msg = "humanApproval=true. Use POST /plan then POST /runs/execute (admin-only) with approved=true."
        log_event(
            kind="run",
            outcome="blocked",
            agent_name=agent.get("name"),
            agent_id=agent.get("agentId"),
            layer=agent.get("layer"),
            message=msg,
            request_id=request_id,
        )
        write_run_event(
            request_id=request_id,
            route="run",
            outcome="blocked",
            agent_name=agent.get("name"),
            agent_id=agent.get("agentId"),
            layer=agent.get("layer"),
            plan=plan_obj,
            input_data=body.input,
            message=msg,
        )
        return {"ok": False, "requestId": request_id, "blocked": True, "reason": "approval required", "plan": plan_obj}

    output = {
        "type": "draft",
        "note": "Public stub executor. No tool execution.",
        "echo": body.input,
    }

    log_event(
        kind="run",
        outcome="ok",
        agent_name=agent.get("name"),
        agent_id=agent.get("agentId"),
        layer=agent.get("layer"),
        message="stub run executed",
        request_id=request_id,
    )
    write_run_event(
        request_id=request_id,
        route="run",
        outcome="ok",
        agent_name=agent.get("name"),
        agent_id=agent.get("agentId"),
        layer=agent.get("layer"),
        input_data=body.input,
        output_data=output,
        message="stub run executed",
    )

    return {
        "ok": True,
        "requestId": request_id,
        "agent": {"name": agent.get("name"), "layer": agent.get("layer"), "agentId": agent.get("agentId")},
        "output": output,
    }
