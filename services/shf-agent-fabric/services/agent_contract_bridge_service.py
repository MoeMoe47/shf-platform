from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List


REQUIRED_SHS_AGENT_IDS = [
    "shs_sales_agent",
    "shs_project_agent",
    "shs_library_agent",
    "shs_qa_agent",
    "shs_clientops_agent",
    "shs_report_agent",
    "shs_governance_agent",
    "shs_executive_agent",
]

DANGEROUS_FLAG_NAMES = [
    "can_execute_production_actions",
    "can_publish_reports",
    "can_mutate_public_data",
    "can_mark_public_approved",
    "can_mutate_shf_impact_data",
    "can_send_external_messages",
    "can_send_webhooks",
    "can_write_warehouse_records",
    "can_modify_auth",
    "execution_allowed",
    "execution_enabled",
    "production_action_executed",
    "public_approved_mutated",
    "shf_impact_data_mutated",
    "webhook_sent",
    "notification_sent",
    "warehouse_write_performed",
]

CAMEL_FLAG_ALIASES = {
    "can_execute_production_actions": "canExecuteProductionActions",
    "can_publish_reports": "canPublishReports",
    "can_mutate_public_data": "canMutatePublicData",
    "can_mark_public_approved": "canMarkPublicApproved",
    "can_mutate_shf_impact_data": "canMutateShfImpactData",
    "can_send_external_messages": "canSendExternalMessages",
    "can_send_webhooks": "canSendWebhooks",
    "can_write_warehouse_records": "canWriteWarehouseRecords",
    "can_modify_auth": "canModifyAuth",
}

BLOCKED_POWER_NEEDLES = [
    "execute_production",
    "mutate_production",
    "publish_report",
    "mark_public_approved",
    "mutate_shf_impact_data",
    "send_external_webhook",
    "send_notification",
    "write_warehouse_record",
    "modify_auth",
    "warehouse_write",
]


def _contracts_path() -> Path:
    return Path(__file__).resolve().parent.parent / "contracts" / "agents" / "agents.json"


def load_backend_agent_contracts() -> Dict[str, Dict[str, Any]]:
    path = _contracts_path()
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        return {}
    return {str(key): dict(value or {}) for key, value in data.items() if isinstance(value, dict)}


def _agent_id(agent: Dict[str, Any], fallback: str = "") -> str:
    return str(agent.get("agent_id") or agent.get("agentId") or agent.get("id") or fallback)


def _policy(agent: Dict[str, Any]) -> Dict[str, Any]:
    value = agent.get("policy")
    return dict(value) if isinstance(value, dict) else {}


def _flag_value(agent: Dict[str, Any], flag: str) -> Any:
    policy = _policy(agent)
    if flag in agent:
        return agent.get(flag)
    if flag in policy:
        return policy.get(flag)
    alias = CAMEL_FLAG_ALIASES.get(flag)
    if alias and alias in policy:
        return policy.get(alias)
    if alias and alias in agent:
        return agent.get(alias)
    return False


def _dangerous_flags_enabled(agent: Dict[str, Any]) -> List[str]:
    agent_id = _agent_id(agent)
    enabled: List[str] = []
    for flag in DANGEROUS_FLAG_NAMES:
        if _flag_value(agent, flag) is True:
            enabled.append(f"{agent_id}:{flag}")
    return enabled


def _has_blocked_power(agent: Dict[str, Any]) -> bool:
    haystack = " ".join(
        str(item)
        for key in ("capabilities", "allowedTools", "allowed_tools")
        for item in (agent.get(key) if isinstance(agent.get(key), list) else [])
    ).lower()
    return any(needle in haystack for needle in BLOCKED_POWER_NEEDLES)


def build_agent_contract_bridge_summary() -> Dict[str, Any]:
    warnings: List[str] = []
    blockers: List[str] = []
    try:
        backend_agents = load_backend_agent_contracts()
        contracts_readable = True
    except Exception as exc:  # pragma: no cover - defensive health response
        backend_agents = {}
        contracts_readable = False
        warnings.append(f"backend_contract_unreadable:{type(exc).__name__}")

    backend_ids = sorted(_agent_id(agent, key) for key, agent in backend_agents.items())
    matched_agents = sorted(agent_id for agent_id in REQUIRED_SHS_AGENT_IDS if agent_id in backend_ids)
    missing_backend_agents = sorted(agent_id for agent_id in REQUIRED_SHS_AGENT_IDS if agent_id not in backend_ids)
    extra_backend_agents = sorted(agent_id for agent_id in backend_ids if agent_id not in REQUIRED_SHS_AGENT_IDS)

    dangerous_flags_enabled: List[str] = []
    human_approval_missing: List[str] = []
    audit_required_missing: List[str] = []
    blocked_power_agents: List[str] = []
    for agent_id in REQUIRED_SHS_AGENT_IDS:
        agent = backend_agents.get(agent_id)
        if not agent:
            continue
        policy = _policy(agent)
        dangerous_flags_enabled.extend(_dangerous_flags_enabled(agent))
        if policy.get("humanApproval") is not True and agent.get("human_approval_required") is not True:
            human_approval_missing.append(agent_id)
        if policy.get("auditRequired") is not True and agent.get("audit_required") is not True:
            audit_required_missing.append(agent_id)
        if _has_blocked_power(agent):
            blocked_power_agents.append(agent_id)

    if missing_backend_agents:
        blockers.append("required_backend_agents_missing")
    if dangerous_flags_enabled:
        blockers.append("dangerous_flags_enabled")
    if human_approval_missing:
        blockers.append("human_approval_required_missing")
    if audit_required_missing:
        blockers.append("audit_required_missing")
    if blocked_power_agents:
        blockers.append("blocked_power_in_allowed_surface")
    if extra_backend_agents:
        warnings.append("extra_backend_agents_present")
    if not contracts_readable:
        warnings.append("contracts_not_readable")

    if blockers:
        alignment_status = "blocked"
    elif warnings:
        alignment_status = "needs_review"
    else:
        alignment_status = "aligned"

    return {
        "ok": True,
        "layer": "agent_contract_bridge",
        "canonical_agent_count": len(REQUIRED_SHS_AGENT_IDS),
        "backend_agent_count": len(backend_ids),
        "matched_agents": matched_agents,
        "missing_backend_agents": missing_backend_agents,
        "extra_backend_agents": extra_backend_agents,
        "dangerous_flags_enabled": sorted(dangerous_flags_enabled),
        "execution_enabled": False,
        "contracts_readable": contracts_readable,
        "alignment_status": alignment_status,
        "warnings": sorted(set(warnings)),
        "blockers": sorted(set(blockers)),
        "human_approval_missing": sorted(human_approval_missing),
        "audit_required_missing": sorted(audit_required_missing),
        "blocked_power_agents": sorted(blocked_power_agents),
        "backend_contract_source": "services/shf-agent-fabric/contracts/agents/agents.json",
    }


def agent_contract_bridge_health() -> Dict[str, Any]:
    summary = build_agent_contract_bridge_summary()
    return {
        "ok": summary["contracts_readable"],
        "service": "agent_contract_bridge",
        "status": "read_only_v1",
        "execution_enabled": False,
        "summary": summary,
    }


def agent_contract_bridge_agents() -> Dict[str, Any]:
    agents = load_backend_agent_contracts()
    return {
        "ok": True,
        "layer": "agent_contract_bridge",
        "source": "services/shf-agent-fabric/contracts/agents/agents.json",
        "execution_enabled": False,
        "agents": [agents[agent_id] for agent_id in sorted(agents.keys())],
    }
