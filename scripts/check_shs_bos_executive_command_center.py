#!/usr/bin/env python3
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]

CORE_FILES = [
    "src/system/executive-command-center/shsExecutiveCommandCenterTypes.js",
    "src/system/executive-command-center/shsExecutiveCommandCenterSources.js",
    "src/system/executive-command-center/shsExecutiveCommandCenterAggregator.js",
    "src/system/executive-command-center/shsExecutiveCommandCenterHealth.js",
    "src/system/executive-command-center/shsExecutiveCommandCenterReadiness.js",
    "src/system/executive-command-center/shsExecutiveCommandCenterPriorities.js",
    "src/system/executive-command-center/shsExecutiveCommandCenterRisks.js",
    "src/system/executive-command-center/shsExecutiveCommandCenterActions.js",
    "src/system/executive-command-center/shsExecutiveCommandCenterSnapshots.js",
    "src/system/executive-command-center/shsExecutiveCommandCenterStorage.js",
    "src/system/executive-command-center/shsExecutiveCommandCenterMetrics.js",
    "src/system/executive-command-center/shsExecutiveCommandCenterSafety.js",
    "src/system/executive-command-center/shsExecutiveCommandCenterNavigation.js",
    "src/system/executive-command-center/shsExecutiveCommandCenterStatus.js",
]

ADMIN_FILES = [
    "src/pages/admin/executive-command/ShsBosExecutiveCommandCenterPage.jsx",
    "src/pages/admin/executive-command/components/ExecutiveCommandHeader.jsx",
    "src/pages/admin/executive-command/components/ExecutiveSystemHealthPanel.jsx",
    "src/pages/admin/executive-command/components/ExecutiveReadinessPanel.jsx",
    "src/pages/admin/executive-command/components/ExecutivePriorityQueue.jsx",
    "src/pages/admin/executive-command/components/ExecutiveRiskPanel.jsx",
    "src/pages/admin/executive-command/components/ExecutiveRuntimePanel.jsx",
    "src/pages/admin/executive-command/components/ExecutiveGovernancePanel.jsx",
    "src/pages/admin/executive-command/components/ExecutiveAgentPanel.jsx",
    "src/pages/admin/executive-command/components/ExecutiveBusinessOperationsPanel.jsx",
    "src/pages/admin/executive-command/components/ExecutiveLayerHealthGrid.jsx",
    "src/pages/admin/executive-command/components/ExecutiveActivityTimeline.jsx",
    "src/pages/admin/executive-command/components/ExecutiveSafeActionsPanel.jsx",
    "src/pages/admin/executive-command/components/ExecutiveSnapshotPanel.jsx",
    "src/pages/admin/executive-command/components/ExecutiveDataPosturePanel.jsx",
    "src/pages/admin/executive-command/components/ExecutiveSafetyPanel.jsx",
    "src/pages/admin/executive-command/components/ExecutiveNavigationPanel.jsx",
    "src/pages/admin/executive-command/shsBosExecutiveCommandCenter.css",
]

DOC_FILES = [
    "docs/SHS_BOS_EXECUTIVE_COMMAND_CENTER_V1.md",
    "docs/SHS_BOS_EXECUTIVE_COMMAND_CENTER_V1.json",
    "docs/SHS_BOS_EXECUTIVE_COMMAND_CENTER_V1_MANUAL_GOVERNANCE_REVIEW.md",
    "docs/SHS_BOS_EXECUTIVE_COMMAND_CENTER_V1_MANUAL_GOVERNANCE_REVIEW.json",
]

WIRING_FILES = [
    "package.json",
    "src/router/AdminRoutes.jsx",
    "src/components/admin/AdminSidebar.jsx",
    "src/system/identity/hubAccessControl.js",
    "src/system/routes/crossAppRouteBridge.js",
]

SOURCE_GROUPS = [
    "system_registry",
    "system_orchestrator",
    "command_bus",
    "event_bus",
    "job_scheduler",
    "notification_alert_fabric",
    "tracking_intelligence",
    "durable_persistence",
    "agent_workbench",
    "agent_workflow_engine",
    "controlled_executor",
    "production_automation",
    "direct_connect_proof",
    "shs_reports",
    "governance_truth_oracle",
    "client_operations_business_signals",
]

DANGEROUS_FALSE_TOKENS = [
    "execution_enabled: false",
    "autonomous_execution_enabled: false",
    "production_mutation_enabled: false",
    "public_publish_enabled: false",
    "public_approved_mutation_enabled: false",
    "shf_impact_data_mutation_enabled: false",
    "external_delivery_enabled: false",
    "webhook_delivery_enabled: false",
    "email_delivery_enabled: false",
    "sms_delivery_enabled: false",
    "push_delivery_enabled: false",
    "warehouse_write_enabled: false",
    "auth_mutation_enabled: false",
    "shell_execution_enabled: false",
    "python_execution_enabled: false",
    "external_api_enabled: false",
    "banking_connection_enabled: false",
    "oauth_connection_enabled: false",
    "payment_execution_enabled: false",
]

SAFETY_STATEMENT = (
    "SHS BOS Executive Command Center V1 provides governed visibility, triage, safe previews, "
    "and navigation across internal operating layers. It does not autonomously execute commands, "
    "mutate production systems, publish reports, change public approval, mutate SHF Impact Data, "
    "send external messages, write warehouse records, modify authentication, or create live external integrations."
)


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def fail(message):
    print(f"FAIL: {message}")
    sys.exit(1)


def require_files(paths):
    missing = [path for path in paths if not (ROOT / path).exists()]
    if missing:
        fail(f"missing files: {', '.join(missing)}")


def require_token(path, token):
    if token not in read(path):
        fail(f"missing token in {path}: {token}")


def main():
    require_files(CORE_FILES + ADMIN_FILES + DOC_FILES + WIRING_FILES)

    docs_json = json.loads(read("docs/SHS_BOS_EXECUTIVE_COMMAND_CENTER_V1.json"))
    if docs_json.get("name") != "SHS BOS Executive Command Center V1":
        fail("docs JSON name mismatch")
    if docs_json.get("route") != "admin.html#/ops/executive-command":
        fail("docs JSON route mismatch")
    if len(docs_json.get("connected_source_groups", [])) < 16:
        fail("docs JSON must contain at least 16 connected source groups")
    if docs_json.get("access", {}).get("shs_admin") is not True:
        fail("shs_admin access must be true")
    if docs_json.get("access", {}).get("client_admin") is not False:
        fail("client_admin access must be false")
    if docs_json.get("access", {}).get("public") is not False:
        fail("public access must be false")

    manual_json = json.loads(read("docs/SHS_BOS_EXECUTIVE_COMMAND_CENTER_V1_MANUAL_GOVERNANCE_REVIEW.json"))
    if manual_json.get("manual_review_complete") is not True:
        fail("manual governance review must be complete")
    if manual_json.get("blockers"):
        fail("manual governance review has blockers")

    types = read("src/system/executive-command-center/shsExecutiveCommandCenterTypes.js")
    if SAFETY_STATEMENT not in types:
        fail("missing exact safety statement")
    for token in DANGEROUS_FALSE_TOKENS:
        require_token("src/system/executive-command-center/shsExecutiveCommandCenterTypes.js", token)
    for group in SOURCE_GROUPS:
        require_token("src/system/executive-command-center/shsExecutiveCommandCenterTypes.js", f'"{group}"')
        require_token("src/system/executive-command-center/shsExecutiveCommandCenterSources.js", f'layer_id: "{group}"')

    for path, tokens in {
        "src/system/executive-command-center/shsExecutiveCommandCenterSources.js": [
            "readExecutiveSourceSummaries",
            "data_posture",
            "direct_source_proof_only_no_live_external_integration",
            "no_private_client_payloads_loaded",
        ],
        "src/system/executive-command-center/shsExecutiveCommandCenterAggregator.js": [
            "getExecutiveCommandCenterState",
            "source_group_count",
            "safe_next_actions",
        ],
        "src/system/executive-command-center/shsExecutiveCommandCenterHealth.js": [
            "calculateExecutiveHealth",
            "deductions",
            "unavailable_layers",
            "degraded_layers",
        ],
        "src/system/executive-command-center/shsExecutiveCommandCenterReadiness.js": [
            "calculateExecutiveReadiness",
            "critical_blocker_exists",
            "dangerous_capability_flag_enabled",
            "data_posture_primarily_sample_or_unavailable",
        ],
        "src/system/executive-command-center/shsExecutiveCommandCenterPriorities.js": [
            "rankExecutivePriorities",
            "P0",
            "P1",
            "approval_required",
            "execution_enabled: false",
        ],
        "src/system/executive-command-center/shsExecutiveCommandCenterRisks.js": [
            "summarizeExecutiveRisks",
            "SHS / SHF boundary",
        ],
        "src/system/executive-command-center/shsExecutiveCommandCenterActions.js": [
            "createCommandPreviewIntent",
            "createOrchestrationPreviewIntent",
            "preview_only: true",
            "execution_enabled: false",
            "dispatch_requested: false",
            "activate_requested: false",
        ],
        "src/system/executive-command-center/shsExecutiveCommandCenterSnapshots.js": [
            "createSnapshotFromExecutiveState",
            "compareExecutiveSnapshots",
        ],
        "src/system/executive-command-center/shsExecutiveCommandCenterStorage.js": [
            "readCriticalStateRecords",
            "writeCriticalStateRecords",
            "addExecutiveOperatorNote",
            "markExecutivePriorityReviewed",
            "saveExecutiveSnapshot",
        ],
        "src/system/executive-command-center/shsExecutiveCommandCenterSafety.js": [
            "scanExecutiveSafety",
            "getExecutiveDangerousFlags",
            "buildExecutiveSafetySummary",
            "shs_shf_boundary_intact: true",
            "direct_connect_direct_source_proof_only: true",
        ],
        "src/system/executive-command-center/shsExecutiveCommandCenterNavigation.js": [
            "EXECUTIVE_NAVIGATION_TARGETS",
            "admin.html#/ops/executive-command",
            "admin_only: true",
        ],
        "src/pages/admin/executive-command/ShsBosExecutiveCommandCenterPage.jsx": [
            "Refresh Local Summary",
            "Mark reviewed",
            "Create Local Snapshot",
            "Compare Snapshots",
            "Run Local Safety Scan",
            "Show Blast-Radius Preview",
            "Command Preview",
            "Orchestration Preview",
        ],
        "src/pages/admin/executive-command/components/ExecutiveSafetyPanel.jsx": [
            "Direct Connect remains direct-source proof only",
            "cannot mark public-approved",
            "mutate SHF Impact Data",
        ],
    }.items():
        source = read(path)
        for token in tokens:
            if token not in source:
                fail(f"missing token in {path}: {token}")

    require_token("src/router/AdminRoutes.jsx", 'path="/ops/executive-command"')
    require_token("src/components/admin/AdminSidebar.jsx", 'to: "/ops/executive-command"')
    require_token("src/system/identity/hubAccessControl.js", '"/ops/executive-command": ["shs_admin"]')
    require_token("src/system/routes/crossAppRouteBridge.js", "admin.html#/ops/executive-command")
    require_token("package.json", '"check:shs-executive-command": "python3 scripts/check_shs_bos_executive_command_center.py"')

    combined = "\n".join(read(path) for path in CORE_FILES + ADMIN_FILES + DOC_FILES)
    forbidden_patterns = [
        r"execution_enabled:\s*true",
        r"autonomous_execution_enabled:\s*true",
        r"production_mutation_enabled:\s*true",
        r"public_publish_enabled:\s*true",
        r"public_approved_mutation_enabled:\s*true",
        r"shf_impact_data_mutation_enabled:\s*true",
        r"external_delivery_enabled:\s*true",
        r"webhook_delivery_enabled:\s*true",
        r"email_delivery_enabled:\s*true",
        r"sms_delivery_enabled:\s*true",
        r"push_delivery_enabled:\s*true",
        r"warehouse_write_enabled:\s*true",
        r"auth_mutation_enabled:\s*true",
        r"shell_execution_enabled:\s*true",
        r"python_execution_enabled:\s*true",
        r"external_api_enabled:\s*true",
        r"banking_connection_enabled:\s*true",
        r"oauth_connection_enabled:\s*true",
        r"payment_execution_enabled:\s*true",
        r"fetch\(",
        r"axios\.",
        r"XMLHttpRequest",
        r"new WebSocket",
        r"sendWebhook\(",
        r"sendEmail\(",
        r"sendSms\(",
        r"sendSMS\(",
        r"sendPush\(",
        r"writeWarehouse\(",
        r"markPublicApproved\(",
        r"mutateShfImpactData\(",
        r"publishReport\(",
        r"dispatchCommand\(",
        r"executeCommand\(",
        r"runShell\(",
        r"runPython\(",
        r"apiKey\s*:",
        r"accessToken\s*:",
        r"privateKey\s*:",
    ]
    for pattern in forbidden_patterns:
        if re.search(pattern, combined, re.IGNORECASE):
            fail(f"forbidden Executive Command Center token present: {pattern}")

    print("PASS: SHS BOS Executive Command Center V1 validation OK.")


if __name__ == "__main__":
    main()
