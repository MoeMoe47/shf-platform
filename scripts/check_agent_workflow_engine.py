#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "docs/AGENT_WORKFLOW_ENGINE_V1.md",
    "docs/AGENT_WORKFLOW_ENGINE_V1.json",
    "src/data/agents/agentWorkflowRuns.js",
    "src/data/agents/agentWorkflowSteps.js",
    "src/data/agents/agentWorkflowTemplates.js",
    "src/data/agents/agentWorkflowStorage.js",
    "src/data/agents/agentWorkflowMetrics.js",
    "src/data/agents/agentWorkflowSafety.js",
    "src/pages/admin/agents/components/AgentWorkflowEnginePanel.jsx",
    "src/pages/admin/agents/components/AgentWorkflowRunDetail.jsx",
    "src/pages/admin/agents/components/AgentWorkflowStepList.jsx",
    "src/pages/admin/agents/components/AgentWorkflowProgress.jsx",
    "src/pages/admin/agents/components/AgentWorkflowSafetyPanel.jsx",
]

WORKFLOW_TYPES = [
    "sales_to_delivery",
    "report_generation",
    "qa_delivery",
    "clientops_review",
    "governance_review",
    "launch_readiness",
]

STEP_TITLES = [
    "Sales intake review",
    "Project setup review",
    "Library packet review",
    "QA readiness review",
    "Report readiness review",
    "Governance boundary review",
    "Executive handoff summary",
    "Premium preview review",
    "Executive summary review",
    "QA checklist review",
    "Project blocker review",
    "ClientOps handoff review",
    "Governance readiness review",
    "Client health review",
    "Upgrade opportunity review",
    "Report summary review",
    "Executive briefing",
    "Daily audit review",
    "Policy boundary review",
    "Executive signoff summary",
    "Readiness overview",
    "Governance audit review",
    "QA smoke review",
    "Report handoff review",
    "ClientOps readiness review",
    "Owner approval packet",
]

DANGEROUS_FALSE_TOKENS = [
    "execution_enabled_v1: false",
    "production_action_executed: false",
    "report_published: false",
    "public_data_mutated: false",
    "public_approved_mutated: false",
    "shf_impact_data_mutated: false",
    "external_message_sent: false",
    "webhook_sent: false",
    "warehouse_write_performed: false",
]

FORBIDDEN_TOKENS = [
    "shfImpactData",
    "executeProduction",
    "publishReport(",
    "sendWebhook(",
    "sendNotification(",
    "writeWarehouse",
    "markPublicApproved",
]

FORBIDDEN_TRUE_PATTERNS = [
    "execution_enabled_v1: true",
    "production_action_executed: true",
    "report_published: true",
    "public_data_mutated: true",
    "public_approved_mutated: true",
    "shf_impact_data_mutated: true",
    "external_message_sent: true",
    "webhook_sent: true",
    "warehouse_write_performed: true",
]


def read(rel):
    path = ROOT / rel
    if not path.exists():
      raise SystemExit(f"FAIL: missing required file {rel}")
    return path.read_text(encoding="utf-8")


def main():
    for rel in REQUIRED_FILES:
        read(rel)

    templates = read("src/data/agents/agentWorkflowTemplates.js")
    safety = read("src/data/agents/agentWorkflowSafety.js")
    storage = read("src/data/agents/agentWorkflowStorage.js")
    workbench = read("src/pages/admin/agents/AgentWorkbenchPage.jsx")
    safe_stub = read("src/data/agents/agentSafeExecutionStub.js")
    safe_panel = read("src/pages/admin/agents/components/AgentSafeExecutionPanel.jsx")
    package_json = read("package.json")

    for workflow_type in WORKFLOW_TYPES:
        if workflow_type not in templates:
            raise SystemExit(f"FAIL: missing workflow template {workflow_type}")

    for title in STEP_TITLES:
        if title not in templates:
            raise SystemExit(f"FAIL: missing workflow step title {title}")

    for token in DANGEROUS_FALSE_TOKENS:
        if token not in safety and token not in storage:
            raise SystemExit(f"FAIL: missing dangerous false token {token}")

    for token in [
        "AgentWorkflowEnginePanel",
        "AgentWorkflowRunDetail",
        "AgentWorkflowStepList",
        "AgentWorkflowProgress",
        "AgentWorkflowSafetyPanel",
        "createWorkflowRunFromTemplate",
        "createWorkflowRunFromCoordinationPlan",
        "applyWorkflowRunAction",
        "applyWorkflowStepAction",
    ]:
        if token not in workbench:
            raise SystemExit(f"FAIL: Workbench missing workflow token {token}")

    for token in ["workflow_run_blocked_items", "workflowRuns", "workflow_run_ids"]:
        if token not in safe_stub and token not in safe_panel:
            raise SystemExit(f"FAIL: safe stub integration missing {token}")

    for token in ["localStorage", "execution_enabled_v1", "completion_requires_finished_steps", "context_packet_blocked"]:
        if token not in storage and token not in safety:
            raise SystemExit(f"FAIL: workflow safety/storage missing {token}")

    scanned = "\n".join([
        templates,
        safety,
        storage,
        workbench,
        safe_stub,
        safe_panel,
    ])
    for token in FORBIDDEN_TOKENS:
        if token in scanned:
            raise SystemExit(f"FAIL: forbidden production token present: {token}")

    for token in FORBIDDEN_TRUE_PATTERNS:
        if token in scanned:
            raise SystemExit(f"FAIL: dangerous flag set true: {token}")

    if '"check:agent-workflow": "python3 scripts/check_agent_workflow_engine.py"' not in package_json:
        raise SystemExit("FAIL: package.json missing check:agent-workflow script")

    print("PASS: Agent Workflow Engine V1 validation OK.")


if __name__ == "__main__":
    main()
