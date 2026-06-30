#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "docs/AGENT_COORDINATION_LAYER_V1.md",
    "docs/AGENT_COORDINATION_LAYER_V1.json",
    "src/data/agents/agentCoordinationPlans.js",
    "src/data/agents/agentCoordinationStorage.js",
    "src/data/agents/agentCoordinationTemplates.js",
    "src/data/agents/agentHandoffRecords.js",
    "src/data/agents/agentCoordinationMetrics.js",
    "src/data/agents/agentCoordinationSafety.js",
    "src/pages/admin/agents/components/AgentCoordinationPanel.jsx",
    "src/pages/admin/agents/components/AgentCoordinationPlanDetail.jsx",
    "src/pages/admin/agents/components/AgentHandoffTrail.jsx",
    "src/pages/admin/agents/components/AgentWorkflowTemplatePanel.jsx",
    "src/pages/admin/agents/components/AgentCoordinationSafetyPanel.jsx",
]

REQUIRED_WORKFLOWS = [
    "sales_to_delivery",
    "report_generation",
    "qa_delivery",
    "clientops_review",
    "governance_review",
    "launch_readiness",
]

FORBIDDEN_TRUE_PATTERNS = [
    r"execution_enabled_v1\s*:\s*true",
    r"production_action_executed\s*:\s*true",
    r"report_published\s*:\s*true",
    r"public_data_mutated\s*:\s*true",
    r"public_approved_mutated\s*:\s*true",
    r"shf_impact_data_mutated\s*:\s*true",
    r"external_message_sent\s*:\s*true",
    r"webhook_sent\s*:\s*true",
    r"warehouse_write_performed\s*:\s*true",
]


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


def require(condition: bool, message: str, failures: list[str]) -> None:
    if not condition:
        failures.append(message)


def main() -> int:
    failures: list[str] = []

    for rel in REQUIRED_FILES:
        require((ROOT / rel).exists(), f"missing required file: {rel}", failures)

    if failures:
        for failure in failures:
            print(f"FAIL: {failure}")
        return 1

    templates = read("src/data/agents/agentCoordinationTemplates.js")
    plans = read("src/data/agents/agentCoordinationPlans.js")
    handoffs = read("src/data/agents/agentHandoffRecords.js")
    storage = read("src/data/agents/agentCoordinationStorage.js")
    safety = read("src/data/agents/agentCoordinationSafety.js")
    workbench = read("src/pages/admin/agents/AgentWorkbenchPage.jsx")
    safe_stub = read("src/data/agents/agentSafeExecutionStub.js")
    package_json = json.loads(read("package.json"))

    for workflow in REQUIRED_WORKFLOWS:
        require(workflow in templates, f"missing workflow template: {workflow}", failures)

    for component in [
        "AgentCoordinationPanel",
        "AgentCoordinationPlanDetail",
        "AgentHandoffTrail",
        "AgentWorkflowTemplatePanel",
        "AgentCoordinationSafetyPanel",
    ]:
        require(component in workbench, f"Workbench must import/render {component}", failures)

    for flag in [
        "execution_enabled_v1: false",
        "production_action_executed: false",
        "report_published: false",
        "public_data_mutated: false",
        "public_approved_mutated: false",
        "shf_impact_data_mutated: false",
        "external_message_sent: false",
        "webhook_sent: false",
        "warehouse_write_performed: false",
    ]:
        require(flag in safety or flag in plans, f"missing false dangerous flag: {flag}", failures)

    for token in [
        "requested_public_approval",
        "requested_report_publish",
        "requested_external_delivery",
        "requested_webhook",
        "requested_warehouse_write",
        "requested_auth_mutation",
        "context_packet_blocked",
    ]:
        require(token in safety, f"missing safety token: {token}", failures)

    require("localStorage" in storage, "coordination storage must use localStorage-safe V1 pattern", failures)
    require("coordination_plan_blocked_items" in safe_stub, "safe stub must consider blocked coordination plans", failures)
    require(
        package_json.get("scripts", {}).get("check:agent-coordination") == "python3 scripts/check_agent_coordination_layer.py",
        "package script check:agent-coordination missing",
        failures,
    )

    scan_targets = [
        "src/data/agents/agentCoordinationPlans.js",
        "src/data/agents/agentCoordinationStorage.js",
        "src/data/agents/agentCoordinationTemplates.js",
        "src/data/agents/agentHandoffRecords.js",
        "src/data/agents/agentCoordinationSafety.js",
        "src/pages/admin/agents/AgentWorkbenchPage.jsx",
        "src/pages/admin/agents/components/AgentCoordinationPanel.jsx",
        "src/pages/admin/agents/components/AgentCoordinationPlanDetail.jsx",
        "src/pages/admin/agents/components/AgentHandoffTrail.jsx",
        "src/pages/admin/agents/components/AgentWorkflowTemplatePanel.jsx",
        "src/pages/admin/agents/components/AgentCoordinationSafetyPanel.jsx",
    ]
    for rel in scan_targets:
        text = read(rel)
        require("shfImpactData" not in text, f"{rel} must not reference shfImpactData", failures)
        for pattern in FORBIDDEN_TRUE_PATTERNS:
            require(not re.search(pattern, text), f"{rel} contains forbidden enabled flag pattern: {pattern}", failures)

    if failures:
        for failure in failures:
            print(f"FAIL: {failure}")
        return 1

    print("PASS: Agent Coordination Layer V1 validation OK.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
