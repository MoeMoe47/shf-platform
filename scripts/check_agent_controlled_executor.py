#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "docs/AGENT_CONTROLLED_EXECUTOR_V1.md",
    "docs/AGENT_CONTROLLED_EXECUTOR_V1.json",
    "src/data/agents/agentControlledExecutor.js",
    "src/data/agents/agentExecutionRecords.js",
    "src/data/agents/agentExecutionStorage.js",
    "src/data/agents/agentExecutionSafety.js",
    "src/data/agents/agentExecutionMetrics.js",
    "src/pages/admin/agents/components/AgentControlledExecutorPanel.jsx",
    "src/pages/admin/agents/components/AgentExecutionRecordTable.jsx",
    "src/pages/admin/agents/components/AgentExecutionSafetyPanel.jsx",
]

ALLOWED_ACTIONS = [
    "create_execution_record",
    "mark_task_simulated_complete",
    "add_operator_note",
    "attach_context_packet",
    "create_recommendation_packet",
    "mark_workflow_step_reviewed",
    "mark_coordination_handoff_reviewed",
]

BLOCKED_ACTIONS = [
    "publish_report",
    "mark_public_approved",
    "mutate_shf_impact_data",
    "send_webhook",
    "send_notification",
    "write_warehouse_record",
    "mutate_auth",
    "mutate_production_record",
    "execute_shell",
    "call_external_api",
    "write_arbitrary_file",
    "bypass_approval",
    "bypass_governance",
]

DANGEROUS_FALSE_TOKENS = [
    "production_action_executed: false",
    "report_published: false",
    "public_data_mutated: false",
    "public_approved_mutated: false",
    "shf_impact_data_mutated: false",
    "external_message_sent: false",
    "webhook_sent: false",
    "notification_sent: false",
    "warehouse_write_performed: false",
    "auth_modified: false",
]

FORBIDDEN_TRUE_PATTERNS = [
    "production_action_executed: true",
    "report_published: true",
    "public_data_mutated: true",
    "public_approved_mutated: true",
    "shf_impact_data_mutated: true",
    "external_message_sent: true",
    "webhook_sent: true",
    "notification_sent: true",
    "warehouse_write_performed: true",
    "auth_modified: true",
    "\"production_action_executed\": true",
    "\"report_published\": true",
    "\"public_data_mutated\": true",
    "\"public_approved_mutated\": true",
    "\"shf_impact_data_mutated\": true",
    "\"external_message_sent\": true",
    "\"webhook_sent\": true",
    "\"notification_sent\": true",
    "\"warehouse_write_performed\": true",
    "\"auth_modified\": true",
]

FORBIDDEN_FRONTEND_TOKENS = [
    "shfImpactData",
    "publishReport(",
    "sendWebhook(",
    "sendNotification(",
    "writeWarehouse",
    "markPublicApproved",
    "fetch(",
    "XMLHttpRequest",
]

FORBIDDEN_BACKEND_ENDPOINT_PATTERNS = [
    "agent_controlled_executor",
    "agent-controlled-executor",
    "AgentControlledExecutor",
    "/agent-executor/execute",
    "/agent-controlled-executor/execute",
    "/agent-controlled-executor/run",
]


def read(rel):
    path = ROOT / rel
    if not path.exists():
        raise SystemExit(f"FAIL: missing required file {rel}")
    return path.read_text(encoding="utf-8")


def main():
    for rel in REQUIRED_FILES:
        read(rel)

    safety = read("src/data/agents/agentExecutionSafety.js")
    storage = read("src/data/agents/agentExecutionStorage.js")
    records = read("src/data/agents/agentExecutionRecords.js")
    metrics = read("src/data/agents/agentExecutionMetrics.js")
    controlled = read("src/data/agents/agentControlledExecutor.js")
    panel = read("src/pages/admin/agents/components/AgentControlledExecutorPanel.jsx")
    record_table = read("src/pages/admin/agents/components/AgentExecutionRecordTable.jsx")
    safety_panel = read("src/pages/admin/agents/components/AgentExecutionSafetyPanel.jsx")
    workbench = read("src/pages/admin/agents/AgentWorkbenchPage.jsx")
    package_json = read("package.json")

    scanned = "\n".join([safety, storage, records, metrics, controlled, panel, record_table, safety_panel, workbench])

    for action in ALLOWED_ACTIONS:
        if action not in safety:
            raise SystemExit(f"FAIL: missing allowlisted action {action}")

    for action in BLOCKED_ACTIONS:
        if action not in safety:
            raise SystemExit(f"FAIL: missing blocked action {action}")

    for token in DANGEROUS_FALSE_TOKENS:
        if token not in safety and token not in records and token not in workbench:
            raise SystemExit(f"FAIL: missing dangerous false token {token}")

    for token in FORBIDDEN_TRUE_PATTERNS:
        if token in scanned:
            raise SystemExit(f"FAIL: dangerous flag set true: {token}")

    for token in FORBIDDEN_FRONTEND_TOKENS:
        if token in scanned:
            raise SystemExit(f"FAIL: forbidden executor frontend token present: {token}")

    for token in [
        "AgentControlledExecutorPanel",
        "AgentExecutionRecordTable",
        "AgentExecutionSafetyPanel",
        "runControlledExecutionRequest",
        "resetAgentExecutionRequests",
        "resetAgentExecutionRecords",
        "getLatestApprovalForTask",
        "approval.approval_status !== \"approved\"",
        "Controlled Executor V1 only performs approved local/internal actions",
    ]:
        if token not in workbench and token not in panel and token not in safety_panel and token not in safety:
            raise SystemExit(f"FAIL: Workbench integration missing {token}")

    backend_paths = [
        path for path in (ROOT / "services").rglob("*")
        if path.is_file() and path.suffix in {".py", ".js", ".ts", ".jsx"}
    ]
    backend_text = "\n".join(path.read_text(encoding="utf-8", errors="ignore") for path in backend_paths)
    for pattern in FORBIDDEN_BACKEND_ENDPOINT_PATTERNS:
        if pattern in backend_text:
            raise SystemExit(f"FAIL: forbidden backend executor endpoint pattern present: {pattern}")

    if '"check:agent-controlled-executor": "python3 scripts/check_agent_controlled_executor.py"' not in package_json:
        raise SystemExit("FAIL: package.json missing check:agent-controlled-executor script")

    print("PASS: Agent Controlled Executor V1 validation OK.")


if __name__ == "__main__":
    main()
