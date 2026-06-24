#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_AGENT_IDS = [
    "shs_sales_agent",
    "shs_project_agent",
    "shs_library_agent",
    "shs_qa_agent",
    "shs_clientops_agent",
    "shs_report_agent",
    "shs_governance_agent",
    "shs_executive_agent",
]

DANGEROUS_FLAGS = [
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


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    sys.exit(1)


def read(path: str) -> str:
    full = ROOT / path
    if not full.exists():
        fail(f"missing required file: {path}")
    return full.read_text(encoding="utf-8")


def load_json(path: str) -> Any:
    full = ROOT / path
    if not full.exists():
        fail(f"missing required json: {path}")
    return json.loads(full.read_text(encoding="utf-8"))


def backend_flag_value(agent: dict[str, Any], flag: str) -> Any:
    policy = agent.get("policy") if isinstance(agent.get("policy"), dict) else {}
    alias = CAMEL_FLAG_ALIASES.get(flag)
    if flag in agent:
        return agent.get(flag)
    if flag in policy:
        return policy.get(flag)
    if alias and alias in policy:
        return policy.get(alias)
    if alias and alias in agent:
        return agent.get(alias)
    return False


def main() -> None:
    required_files = [
        "docs/AGENT_BACKEND_CONTRACT_BRIDGE_V1.md",
        "docs/AGENT_BACKEND_CONTRACT_BRIDGE_V1.json",
        "src/data/agents/agentContractBridge.js",
        "src/pages/admin/agents/components/AgentContractBridgePanel.jsx",
        "services/shf-agent-fabric/services/agent_contract_bridge_service.py",
        "services/shf-agent-fabric/routers/agent_contract_bridge_routes.py",
        "services/shf-agent-fabric/tests/test_agent_contract_bridge_routes.py",
    ]
    for path in required_files:
        if not (ROOT / path).exists():
            fail(f"missing required file: {path}")

    report = load_json("docs/AGENT_BACKEND_CONTRACT_BRIDGE_V1.json")
    if report.get("v1_complete") is not True:
        fail("docs json must mark v1_complete true")

    workforce_source = read("src/data/agents/shsAgentWorkforce.js")
    for agent_id in REQUIRED_AGENT_IDS:
        if f'id: "{agent_id}"' not in workforce_source:
            fail(f"missing frontend canonical agent: {agent_id}")
    for flag in DANGEROUS_FLAGS[:9]:
        if re.search(rf"{re.escape(flag)}\s*:\s*true", workforce_source):
            fail(f"frontend dangerous flag is true: {flag}")
    if "audit_required: true" not in workforce_source:
        fail("frontend audit_required true missing")
    if "human_approval_required: true" not in workforce_source:
        fail("frontend human_approval_required true missing")

    backend_agents = load_json("services/shf-agent-fabric/contracts/agents/agents.json")
    for agent_id in REQUIRED_AGENT_IDS:
        agent = backend_agents.get(agent_id)
        if not isinstance(agent, dict):
            fail(f"missing backend contract agent: {agent_id}")
        policy = agent.get("policy") if isinstance(agent.get("policy"), dict) else {}
        if policy.get("humanApproval") is not True:
            fail(f"backend humanApproval true missing: {agent_id}")
        if policy.get("auditRequired") is not True:
            fail(f"backend auditRequired true missing: {agent_id}")
        for flag in DANGEROUS_FLAGS:
            if backend_flag_value(agent, flag) is True:
                fail(f"backend dangerous flag is true: {agent_id}:{flag}")

    bridge_service = read("services/shf-agent-fabric/services/agent_contract_bridge_service.py")
    bridge_route = read("services/shf-agent-fabric/routers/agent_contract_bridge_routes.py")
    workbench = read("src/pages/admin/agents/AgentWorkbenchPage.jsx")
    panel = read("src/pages/admin/agents/components/AgentContractBridgePanel.jsx")
    package_json = load_json("package.json")

    for required_text in [
        "execution_enabled\": False",
        "contracts/agents/agents.json",
        "dangerous_flags_enabled",
        "alignment_status",
    ]:
        if required_text not in bridge_service:
            fail(f"bridge service missing safety text: {required_text}")

    forbidden_route_patterns = [
        r"@router\.post",
        r"@router\.put",
        r"@router\.patch",
        r"@router\.delete",
        r"execute_agent",
        r"production_action",
    ]
    for pattern in forbidden_route_patterns:
        if re.search(pattern, bridge_route):
            fail(f"bridge route contains forbidden execution/write pattern: {pattern}")

    if "AgentContractBridgePanel" not in workbench:
        fail("Workbench does not render AgentContractBridgePanel")
    if "Execution Enabled" not in panel or "String(summary.execution_enabled)" not in panel:
        fail("Contract bridge panel must display execution enabled false")
    if "read" not in panel.lower() or "no production action" not in panel.lower():
        fail("Contract bridge panel must display read-only/no-production-action note")
    if package_json.get("scripts", {}).get("check:agent-contract-bridge") != "python3 scripts/check_agent_contract_bridge.py":
        fail("package.json missing check:agent-contract-bridge script")

    print("PASS: Agent Backend Contract Bridge V1 validator")


if __name__ == "__main__":
    main()
