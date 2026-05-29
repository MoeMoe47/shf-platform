from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from fabric.admin_auth import require_admin_key
from fabric.agent_canon import (
    list_agents,
    get_agent,
    upsert_agent,
    delete_agent,
    set_agent_lifecycle,
    add_attestation,
    verify_agents,
    read_agent_events,
)
from fabric.agent_store import (
    is_agent_enabled,
    set_agent_enabled,
    list_disabled_agents,
)
from fabric.feedback import log_event


router = APIRouter(
    prefix="/admin/agents",
    tags=["admin-agents"],
    dependencies=[Depends(require_admin_key)],
)


class AgentUpsertBody(BaseModel):
    agent: dict[str, Any]


class EnabledBody(BaseModel):
    enabled: bool
    reason: str | None = None
    gov_approval: str | None = None


class LifecycleBody(BaseModel):
    lifecycle: str


class AttestationBody(BaseModel):
    note: str


@router.get("")
def admin_list_agents():
    """
    Canonical agent list.

    Source of truth:
    contracts/agents/agents.json
    """
    disabled = list_disabled_agents()
    agents = []

    for agent in list_agents():
        agent_id = agent.get("agent_id") or agent.get("agentId") or agent.get("id")
        agents.append({
            "agent_id": agent_id,
            "agentId": agent.get("agentId") or agent_id,
            "name": agent.get("name") or agent.get("label") or agent_id,
            "label": agent.get("label"),
            "layer": agent.get("layer"),
            "role": agent.get("role"),
            "lifecycle": agent.get("lifecycle"),
            "version": agent.get("version"),
            "enabled": is_agent_enabled(str(agent_id)),
            "policy": agent.get("policy", {}),
            "capabilities": agent.get("capabilities", []),
            "allowedTools": agent.get("allowedTools", agent.get("allowed_tools", [])),
            "visibility": agent.get("visibility", "internal"),
        })

    return {
        "ok": True,
        "source": "contracts/agents/agents.json",
        "count": len(agents),
        "agents": agents,
        "disabled": disabled,
    }


@router.get("/verify")
def admin_verify_agents():
    return verify_agents()


@router.get("/events")
def admin_agent_events(limit: int = 200):
    return {
        "ok": True,
        "events": read_agent_events(limit=limit),
    }




@router.get("/summary/health")
def admin_agent_health_summary_safe():
    """
    Safe Agent Health Summary route.

    Uses /summary/health so it does not conflict with /{agent_id}.
    """
    required_fields = [
        "agent_id",
        "agentId",
        "name",
        "layer",
        "role",
        "visibility",
        "lifecycle",
        "version",
        "capabilities",
        "allowedTools",
        "policy",
        "inputs",
        "outputs",
        "memoryScope",
        "eventLogging",
        "healthCheck",
    ]

    agents = list_agents()
    rows = []

    ready_count = 0
    warning_count = 0
    user_visible_count = 0
    internal_count = 0
    approval_required_count = 0

    for agent in agents:
        agent_id = agent.get("agent_id") or agent.get("agentId") or agent.get("id")
        missing = []

        for field in required_fields:
            value = agent.get(field)
            if value is None or value == "" or value == [] or value == {}:
                missing.append(field)

        policy = agent.get("policy") if isinstance(agent.get("policy"), dict) else {}
        human_approval = bool(policy.get("humanApproval", False))
        max_steps = policy.get("maxSteps")

        if "policy" not in missing:
            if "humanApproval" not in policy:
                missing.append("policy.humanApproval")
            if "maxSteps" not in policy:
                missing.append("policy.maxSteps")

        visibility = agent.get("visibility", "internal")

        if visibility == "user_visible":
            user_visible_count += 1
        else:
            internal_count += 1

        if human_approval:
            approval_required_count += 1

        enabled = is_agent_enabled(str(agent_id))
        status = "ready" if enabled and not missing else "warning"

        if status == "ready":
            ready_count += 1
        else:
            warning_count += 1

        rows.append({
            "agent_id": agent_id,
            "name": agent.get("name") or agent.get("label") or agent_id,
            "layer": agent.get("layer"),
            "visibility": visibility,
            "lifecycle": agent.get("lifecycle"),
            "enabled": enabled,
            "status": status,
            "missing": missing,
            "tool_count": len(agent.get("allowedTools") or []),
            "capability_count": len(agent.get("capabilities") or []),
            "input_count": len(agent.get("inputs") or []),
            "output_count": len(agent.get("outputs") or []),
            "humanApproval": human_approval,
            "maxSteps": max_steps,
            "memoryScope": agent.get("memoryScope"),
            "eventLogging": bool(agent.get("eventLogging", False)),
            "healthCheck": agent.get("healthCheck", {}),
        })

    return {
        "ok": warning_count == 0,
        "source": "contracts/agents/agents.json",
        "summary": {
            "total": len(rows),
            "ready": ready_count,
            "warning": warning_count,
            "user_visible": user_visible_count,
            "internal": internal_count,
            "approval_required": approval_required_count,
        },
        "agents": rows,
    }





@router.get("/summary/execution-readiness")
def admin_agent_execution_readiness():
    """
    Agent Execution Readiness V1.

    This does not execute agents. It checks whether each agent is safe,
    complete, and ready to be wired into SHS workflows.
    """
    agents = list_agents()
    rows = []

    ready_count = 0
    blocked_count = 0
    review_count = 0
    auto_safe_count = 0
    approval_required_count = 0

    for agent in agents:
        agent_id = agent.get("agent_id") or agent.get("agentId") or agent.get("id")
        policy = agent.get("policy") if isinstance(agent.get("policy"), dict) else {}

        enabled = is_agent_enabled(str(agent_id))
        lifecycle = agent.get("lifecycle")
        visibility = agent.get("visibility", "internal")
        allowed_tools = agent.get("allowedTools") or []
        inputs = agent.get("inputs") or []
        outputs = agent.get("outputs") or []
        capabilities = agent.get("capabilities") or []

        human_approval = bool(policy.get("humanApproval", False))
        max_steps = policy.get("maxSteps")

        blockers = []
        warnings = []

        if not agent_id:
            blockers.append("missing_agent_id")
        if not enabled:
            blockers.append("agent_disabled")
        if lifecycle != "active":
            blockers.append("lifecycle_not_active")
        if not isinstance(allowed_tools, list):
            blockers.append("allowedTools_not_list")
        if not isinstance(inputs, list) or len(inputs) == 0:
            blockers.append("missing_inputs")
        if not isinstance(outputs, list) or len(outputs) == 0:
            blockers.append("missing_outputs")
        if not isinstance(capabilities, list) or len(capabilities) == 0:
            warnings.append("missing_capabilities")
        if max_steps is None:
            blockers.append("missing_policy_maxSteps")
        elif not isinstance(max_steps, int):
            blockers.append("policy_maxSteps_not_integer")
        elif max_steps <= 0:
            blockers.append("policy_maxSteps_invalid")
        elif max_steps > 10:
            warnings.append("policy_maxSteps_high")

        if "humanApproval" not in policy:
            blockers.append("missing_policy_humanApproval")

        can_auto_execute = (
            enabled
            and lifecycle == "active"
            and not human_approval
            and len(blockers) == 0
        )

        needs_review = human_approval and len(blockers) == 0

        if blockers:
            status = "blocked"
            blocked_count += 1
        elif needs_review:
            status = "approval_required"
            review_count += 1
            approval_required_count += 1
        else:
            status = "auto_ready"
            ready_count += 1

        if can_auto_execute:
            auto_safe_count += 1

        rows.append({
            "agent_id": agent_id,
            "name": agent.get("name") or agent.get("label") or agent_id,
            "layer": agent.get("layer"),
            "visibility": visibility,
            "lifecycle": lifecycle,
            "enabled": enabled,
            "execution_status": status,
            "can_auto_execute": can_auto_execute,
            "humanApproval": human_approval,
            "maxSteps": max_steps,
            "tool_count": len(allowed_tools) if isinstance(allowed_tools, list) else 0,
            "input_count": len(inputs) if isinstance(inputs, list) else 0,
            "output_count": len(outputs) if isinstance(outputs, list) else 0,
            "capability_count": len(capabilities) if isinstance(capabilities, list) else 0,
            "blockers": blockers,
            "warnings": warnings,
            "recommended_next_step": (
                "Wire into workflow with controlled dry-run first."
                if status == "auto_ready"
                else "Keep human approval gate before execution."
                if status == "approval_required"
                else "Fix blockers before wiring this agent."
            ),
        })

    return {
        "ok": blocked_count == 0,
        "source": "contracts/agents/agents.json",
        "summary": {
            "total": len(rows),
            "auto_ready": ready_count,
            "approval_required": review_count,
            "blocked": blocked_count,
            "auto_safe": auto_safe_count,
            "human_approval_required": approval_required_count,
        },
        "agents": rows,
    }


@router.get("/{agent_id}")
def admin_get_agent(agent_id: str):
    agent = get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="agent not found")

    return {
        "ok": True,
        "agent": agent,
        "enabled": is_agent_enabled(agent_id),
    }


@router.post("/{agent_id}")
def admin_upsert_agent(agent_id: str, body: AgentUpsertBody):
    agent = upsert_agent(agent_id, body.agent)
    log_event(
        kind="admin",
        outcome="ok",
        agent_id=agent_id,
        layer=agent.get("layer"),
        message="agent upserted through canonical admin route",
    )
    return {
        "ok": True,
        "agent": agent,
    }





class AgentDryRunBody(BaseModel):
    context: dict[str, Any] = {}
    goal: str | None = None


@router.post("/{agent_id}/dry-run")
def admin_agent_dry_run(agent_id: str, body: AgentDryRunBody):
    """
    Controlled Agent Dry-Run V1.

    This route does NOT execute real tools.
    This route does NOT modify official records.
    This route does NOT approve verification, reports, or partner decisions.

    It proves an agent can be loaded, checked, and safely simulated
    against supplied context.
    """
    agent = get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="agent not found")

    enabled = is_agent_enabled(agent_id)
    lifecycle = agent.get("lifecycle")
    policy = agent.get("policy") if isinstance(agent.get("policy"), dict) else {}
    human_approval = bool(policy.get("humanApproval", False))
    max_steps = policy.get("maxSteps")

    blockers = []

    if not enabled:
        blockers.append("agent_disabled")
    if lifecycle != "active":
        blockers.append("lifecycle_not_active")
    if max_steps is None:
        blockers.append("missing_policy_maxSteps")
    if "humanApproval" not in policy:
        blockers.append("missing_policy_humanApproval")

    context = body.context if isinstance(body.context, dict) else {}
    goal = (body.goal or "").strip()

    dry_run_id = f"dryrun_{agent_id}"

    if blockers:
        log_event(
            kind="agent_dry_run",
            outcome="blocked",
            agent_id=agent_id,
            layer=agent.get("layer"),
            message=f"dry-run blocked: {', '.join(blockers)}",
        )
        return {
            "ok": False,
            "dry_run_id": dry_run_id,
            "agent_id": agent_id,
            "status": "blocked",
            "blockers": blockers,
            "safe_to_wire": False,
            "message": "Agent is not ready for dry-run workflow wiring.",
        }

    visibility = agent.get("visibility", "internal")
    capabilities = agent.get("capabilities") or []
    allowed_tools = agent.get("allowedTools") or []
    inputs = agent.get("inputs") or []
    outputs = agent.get("outputs") or []

    matched_inputs = [k for k in inputs if k in context]
    missing_context = [k for k in inputs if k not in context]

    simulated_response = {
        "summary": f"{agent.get('name', agent_id)} dry-run completed safely.",
        "agent_role": agent.get("role"),
        "goal_received": goal or None,
        "context_keys_received": sorted(list(context.keys())),
        "matched_inputs": matched_inputs,
        "missing_context": missing_context,
        "capabilities_available": capabilities,
        "tools_declared_but_not_executed": allowed_tools,
        "outputs_expected": outputs,
        "policy_note": policy.get("notes"),
        "approval_gate": (
            "Human approval required before real execution."
            if human_approval
            else "Auto workflow wiring allowed only after controlled integration test."
        ),
        "recommended_next_step": (
            "Connect this agent to a page-level dry-run panel first."
            if visibility == "user_visible"
            else "Connect this agent to a backend workflow dry-run first."
        ),
    }

    log_event(
        kind="agent_dry_run",
        outcome="ok",
        agent_id=agent_id,
        layer=agent.get("layer"),
        message="controlled agent dry-run completed",
    )

    return {
        "ok": True,
        "dry_run_id": dry_run_id,
        "agent_id": agent_id,
        "name": agent.get("name"),
        "layer": agent.get("layer"),
        "visibility": visibility,
        "lifecycle": lifecycle,
        "enabled": enabled,
        "humanApproval": human_approval,
        "maxSteps": max_steps,
        "status": "approval_required_dry_run"
        if human_approval
        else "auto_ready_dry_run",
        "real_tools_executed": False,
        "official_records_modified": False,
        "safe_to_wire": True,
        "simulated_response": simulated_response,
    }





class PageContextDryRunBody(BaseModel):
    surface: str
    page: str | None = None
    selected_state: dict[str, Any] = {}
    oracle_truth_package: dict[str, Any] = {}
    verification_state: str | None = None
    drawer_context: dict[str, Any] = {}
    map_context: dict[str, Any] = {}
    goal: str | None = None


@router.post("/{agent_id}/page-context-dry-run")
def admin_agent_page_context_dry_run(agent_id: str, body: PageContextDryRunBody):
    """
    Page Context Dry-Run V1.

    This simulates how a page, map, drawer, dashboard, or report will send
    synchronized context into an agent.

    It does not execute real tools.
    It does not modify official records.
    It does not bypass human approval.
    """
    agent = get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="agent not found")

    enabled = is_agent_enabled(agent_id)
    policy = agent.get("policy") if isinstance(agent.get("policy"), dict) else {}
    lifecycle = agent.get("lifecycle")

    blockers = []

    if not enabled:
        blockers.append("agent_disabled")
    if lifecycle != "active":
        blockers.append("lifecycle_not_active")
    if "humanApproval" not in policy:
        blockers.append("missing_policy_humanApproval")
    if "maxSteps" not in policy:
        blockers.append("missing_policy_maxSteps")

    selected_state = body.selected_state if isinstance(body.selected_state, dict) else {}
    drawer_context = body.drawer_context if isinstance(body.drawer_context, dict) else {}
    map_context = body.map_context if isinstance(body.map_context, dict) else {}
    oracle_truth_package = body.oracle_truth_package if isinstance(body.oracle_truth_package, dict) else {}

    normalized_context = {
        "surface": body.surface,
        "page": body.page,
        "selected_entity": selected_state.get("selected_entity") or selected_state.get("entity"),
        "selected_county": selected_state.get("selected_county") or selected_state.get("county"),
        "selected_region": selected_state.get("selected_region") or selected_state.get("region"),
        "oracle_truth_package": oracle_truth_package,
        "verification_state": body.verification_state,
        "ui_context": {
            "surface": body.surface,
            "page": body.page,
            "drawer": drawer_context,
            "map": map_context,
            "selected_state": selected_state,
        },
    }

    agent_inputs = agent.get("inputs") or []
    matched_inputs = [k for k in agent_inputs if k in normalized_context and normalized_context.get(k) not in (None, "", [], {})]
    missing_context = [k for k in agent_inputs if k not in matched_inputs]

    if blockers:
        log_event(
            kind="agent_page_context_dry_run",
            outcome="blocked",
            agent_id=agent_id,
            layer=agent.get("layer"),
            message=f"page context dry-run blocked: {', '.join(blockers)}",
        )

        return {
            "ok": False,
            "agent_id": agent_id,
            "status": "blocked",
            "blockers": blockers,
            "safe_to_wire": False,
            "official_records_modified": False,
            "real_tools_executed": False,
        }

    readiness = "complete_context" if not missing_context else "partial_context"

    analyst_preview = {
        "plain_language_summary": (
            f"{agent.get('name', agent_id)} received synchronized page context from "
            f"{body.surface}."
        ),
        "selected_focus": {
            "entity": normalized_context.get("selected_entity"),
            "county": normalized_context.get("selected_county"),
            "region": normalized_context.get("selected_region"),
        },
        "truth_status": oracle_truth_package.get("truthStatus"),
        "confidence_score": oracle_truth_package.get("confidenceScore"),
        "readiness_status": oracle_truth_package.get("readinessStatus"),
        "verification_state": body.verification_state,
        "recommended_next_action": (
            "Use this payload shape to sync the AI Analyst with map, drawer, and dashboard state."
            if readiness == "complete_context"
            else "Add the missing context keys before wiring this page into the live analyst panel."
        ),
        "risk_notes": missing_context,
    }

    log_event(
        kind="agent_page_context_dry_run",
        outcome="ok",
        agent_id=agent_id,
        layer=agent.get("layer"),
        message=f"page context dry-run completed for {body.surface}",
    )

    return {
        "ok": True,
        "agent_id": agent_id,
        "name": agent.get("name"),
        "surface": body.surface,
        "page": body.page,
        "status": readiness,
        "safe_to_wire": len(missing_context) == 0,
        "real_tools_executed": False,
        "official_records_modified": False,
        "humanApproval": bool(policy.get("humanApproval", False)),
        "matched_inputs": matched_inputs,
        "missing_context": missing_context,
        "normalized_context": normalized_context,
        "analyst_preview": analyst_preview,
    }


@router.delete("/{agent_id}")
def admin_delete_agent(agent_id: str):
    deleted = delete_agent(agent_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="agent not found")

    log_event(
        kind="admin",
        outcome="ok",
        agent_id=agent_id,
        message="agent deleted through canonical admin route",
    )
    return {
        "ok": True,
        "deleted": True,
        "agent_id": agent_id,
    }


@router.get("/{agent_id}/enabled")
def admin_get_agent_enabled(agent_id: str):
    agent = get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="agent not found")

    return {
        "ok": True,
        "agent_id": agent_id,
        "enabled": is_agent_enabled(agent_id),
    }


@router.post("/{agent_id}/enabled")
def admin_set_agent_enabled(agent_id: str, body: EnabledBody):
    agent = get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="agent not found")

    enabled = set_agent_enabled(
        agent_id,
        body.enabled,
        reason=body.reason,
        gov_approval=body.gov_approval,
    )

    log_event(
        kind="admin",
        outcome="ok",
        agent_id=agent_id,
        layer=agent.get("layer"),
        message=f"agent enabled set to {enabled}",
    )

    return {
        "ok": True,
        "agent_id": agent_id,
        "enabled": enabled,
    }


@router.post("/{agent_id}/lifecycle")
def admin_set_agent_lifecycle(agent_id: str, body: LifecycleBody):
    allowed = {"draft", "active", "paused", "retired", "disabled"}
    lifecycle = body.lifecycle.strip().lower()

    if lifecycle not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"invalid lifecycle. allowed: {sorted(allowed)}",
        )

    try:
        agent = set_agent_lifecycle(agent_id, lifecycle)
    except KeyError:
        raise HTTPException(status_code=404, detail="agent not found")

    log_event(
        kind="admin",
        outcome="ok",
        agent_id=agent_id,
        layer=agent.get("layer"),
        message=f"agent lifecycle set to {lifecycle}",
    )

    return {
        "ok": True,
        "agent": agent,
    }


@router.post("/{agent_id}/attest")
def admin_attest_agent(agent_id: str, body: AttestationBody):
    note = body.note.strip()
    if not note:
        raise HTTPException(status_code=400, detail="attestation note is required")

    try:
        agent = add_attestation(agent_id, note)
    except KeyError:
        raise HTTPException(status_code=404, detail="agent not found")

    log_event(
        kind="admin",
        outcome="ok",
        agent_id=agent_id,
        layer=agent.get("layer"),
        message="agent attestation added",
    )

    return {
        "ok": True,
        "agent": agent,
    }


@router.get("/health-summary")
def admin_agent_health_summary():
    """
    Agent Health Summary V1.

    Checks whether each registered agent has the required operational fields
    for SHS top-tier agent infrastructure.
    """
    required_fields = [
        "agent_id",
        "agentId",
        "name",
        "layer",
        "role",
        "visibility",
        "lifecycle",
        "version",
        "capabilities",
        "allowedTools",
        "policy",
        "inputs",
        "outputs",
        "memoryScope",
        "eventLogging",
        "healthCheck",
    ]

    agents = list_agents()
    rows = []

    ready_count = 0
    warning_count = 0
    user_visible_count = 0
    internal_count = 0
    approval_required_count = 0

    for agent in agents:
        agent_id = agent.get("agent_id") or agent.get("agentId") or agent.get("id")
        missing = []

        for field in required_fields:
            value = agent.get(field)
            if value is None or value == "" or value == [] or value == {}:
                missing.append(field)

        policy = agent.get("policy") if isinstance(agent.get("policy"), dict) else {}
        human_approval = bool(policy.get("humanApproval", False))
        max_steps = policy.get("maxSteps")

        if "policy" not in missing:
            if "humanApproval" not in policy:
                missing.append("policy.humanApproval")
            if "maxSteps" not in policy:
                missing.append("policy.maxSteps")

        visibility = agent.get("visibility", "internal")
        if visibility == "user_visible":
            user_visible_count += 1
        else:
            internal_count += 1

        if human_approval:
            approval_required_count += 1

        enabled = is_agent_enabled(str(agent_id))
        status = "ready" if enabled and not missing else "warning"

        if status == "ready":
            ready_count += 1
        else:
            warning_count += 1

        rows.append({
            "agent_id": agent_id,
            "name": agent.get("name") or agent.get("label") or agent_id,
            "layer": agent.get("layer"),
            "visibility": visibility,
            "lifecycle": agent.get("lifecycle"),
            "enabled": enabled,
            "status": status,
            "missing": missing,
            "tool_count": len(agent.get("allowedTools") or []),
            "capability_count": len(agent.get("capabilities") or []),
            "input_count": len(agent.get("inputs") or []),
            "output_count": len(agent.get("outputs") or []),
            "humanApproval": human_approval,
            "maxSteps": max_steps,
            "memoryScope": agent.get("memoryScope"),
            "eventLogging": bool(agent.get("eventLogging", False)),
            "healthCheck": agent.get("healthCheck", {}),
        })

    return {
        "ok": warning_count == 0,
        "source": "contracts/agents/agents.json",
        "summary": {
            "total": len(rows),
            "ready": ready_count,
            "warning": warning_count,
            "user_visible": user_visible_count,
            "internal": internal_count,
            "approval_required": approval_required_count,
        },
        "agents": rows,
    }
