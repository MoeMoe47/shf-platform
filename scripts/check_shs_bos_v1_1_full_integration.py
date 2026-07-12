#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT_JSON = ROOT / "docs" / "SHS_BOS_V1_1_FULL_INTEGRATION_AUDIT.json"

REQUIRED_FILES = [
    "docs/SHS_BOS_V1_1_FULL_INTEGRATION_AUDIT.md",
    "docs/SHS_BOS_V1_1_FULL_INTEGRATION_AUDIT.json",
    "docs/SHS_BOS_EXECUTIVE_COMMAND_CENTER_V1.md",
    "docs/SHS_SYSTEM_ORCHESTRATOR_V1.md",
    "docs/SHS_COMMAND_BUS_V1.md",
    "docs/SHS_EVENT_BUS_MESSAGE_FABRIC_V1.md",
    "docs/SHS_JOB_SCHEDULER_V1.md",
    "docs/SHS_NOTIFICATION_ALERT_FABRIC_V1.md",
    "docs/SHS_DURABLE_PERSISTENCE_LAYER_V1.md",
    "docs/SHS_TRACKING_INTELLIGENCE_LAYER_V1.md",
    "docs/SHS_SYSTEM_REGISTRY_DEPENDENCY_INTELLIGENCE_V1.md",
    "docs/AGENT_V1_FINAL_READINESS_AUDIT.md",
    "docs/AGENT_MEMORY_CONTEXT_LAYER_V1.md",
    "docs/AGENT_COORDINATION_LAYER_V1.md",
    "docs/AGENT_WORKFLOW_ENGINE_V1.md",
    "docs/AGENT_CONTROLLED_EXECUTOR_V1.md",
    "docs/AGENT_BACKEND_CONTRACT_BRIDGE_V1.md",
    "docs/PRODUCTION_AUTOMATION_V2.md",
    "docs/SHS_DIRECT_CONNECT_BATCH2_DIRECT_SOURCE_PROOF.md",
    "docs/MANUAL_GOVERNANCE_REVIEWS_V1.md",
    "docs/SHRV1_PRECOMMIT_HOOK_RELIABILITY_FIX_V1.md",
    "docs/MASTER_LAYER_REGISTRY.md",
    "docs/TRUTH_SPINE_GUARDRAILS.md",
    "src/system/executive-command-center/shsExecutiveCommandCenterAggregator.js",
    "src/system/executive-command-center/shsExecutiveCommandCenterSources.js",
    "src/system/executive-command-center/shsExecutiveCommandCenterActions.js",
    "src/system/command-bus/shsCommandBus.js",
    "src/system/event-bus/shsEventBus.js",
    "src/system/job-scheduler/shsJobScheduler.js",
    "src/system/notification-fabric/shsNotificationCenter.js",
    "src/system/persistence/persistenceService.js",
    "src/system/tracking/shsTrackingTypes.js",
    "src/system/system-registry/shsSystemRegistryEntries.js",
    "src/router/AdminRoutes.jsx",
    "src/components/admin/AdminSidebar.jsx",
    "src/system/identity/hubAccessControl.js",
    "src/system/routes/crossAppRouteBridge.js",
    ".pre-commit-config.yaml",
    "tools/precommit/check_ledger_precommit.py",
    "tools/precommit/check_registry_guard.py",
]

EXPECTED_INTEGRATION_IDS = {f"INT-{index:02d}" for index in range(1, 39)}

EXPECTED_ROUTES = [
    "/ops/executive-command",
    "/ops/orchestrator",
    "/ops/command-bus",
    "/ops/event-bus",
    "/ops/scheduler",
    "/ops/notifications",
    "/ops/tracking",
    "/ops/persistence",
    "/ops/system-registry",
    "/ops/agents",
    "/ops/reports",
    "/ops/direct-connect",
]

EXPECTED_PACKAGE_SCRIPTS = [
    "check:shs-v1-1-integration",
    "check:shs-executive-command",
    "check:shs-command-bus",
    "check:shs-event-bus",
    "check:shs-job-scheduler",
    "check:shs-notification-fabric",
    "check:shs-system-registry",
    "check:shs-tracking",
    "check:shs-persistence",
    "check:shs-orchestrator",
    "check:agent-controlled-executor",
    "check:agent-workflow",
    "check:agent-coordination",
    "check:agent-memory-context",
    "check:agent-approval-stub",
    "check:agent-contract-bridge",
    "check:production-automation-v2",
    "check:direct-connect-batch2",
    "check:governance",
]

DANGEROUS_TRUE_KEYS = [
    "execution_enabled",
    "autonomous_execution_enabled",
    "production_mutation_enabled",
    "public_approved_mutation_enabled",
    "shf_impact_data_mutation_enabled",
    "external_delivery_enabled",
    "webhook_delivery_enabled",
    "webhook_send_enabled",
    "email_delivery_enabled",
    "sms_delivery_enabled",
    "push_delivery_enabled",
    "warehouse_write_enabled",
    "auth_mutation_enabled",
    "shell_execution_enabled",
    "python_execution_enabled",
    "external_api_enabled",
    "banking_connection_enabled",
    "oauth_connection_enabled",
    "payment_execution_enabled",
    "network_delivery_enabled",
    "report_publish_enabled",
    "credential_storage_enabled",
    "cron_server_enabled",
    "external_worker_enabled",
    "public_publish_enabled",
]

SAFETY_SCAN_FILES = [
    "src/system/executive-command-center/shsExecutiveCommandCenterTypes.js",
    "src/system/executive-command-center/shsExecutiveCommandCenterActions.js",
    "src/data/orchestrator/shsOrchestratorSafety.js",
    "src/data/orchestrator/shsOrchestratorPlans.js",
    "src/system/command-bus/shsCommandTypes.js",
    "src/system/event-bus/shsEventBusTypes.js",
    "src/system/job-scheduler/shsJobTypes.js",
    "src/system/notification-fabric/shsNotificationTypes.js",
    "src/system/persistence/persistenceTypes.js",
    "src/system/tracking/shsTrackingTypes.js",
    "src/data/agents/agentExecutionSafety.js",
    "src/data/agents/agentCoordinationSafety.js",
    "src/data/agents/agentWorkflowSafety.js",
    "src/data/agents/productionAutomationV2Runs.js",
    "src/data/shsDirectConnectData.js",
]


def read(path: str | Path) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    sys.exit(1)


def require_files() -> None:
    missing = [path for path in REQUIRED_FILES if not (ROOT / path).exists()]
    if missing:
        fail(f"missing required files: {', '.join(missing)}")


def load_report() -> dict:
    if not REPORT_JSON.exists():
        fail("missing integration audit JSON report")
    try:
        return json.loads(REPORT_JSON.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON report: {exc}")


def validate_matrix(report: dict) -> dict[str, int]:
    matrix = report.get("integration_matrix", [])
    ids = {item.get("integration_id") for item in matrix}
    if ids != EXPECTED_INTEGRATION_IDS:
        missing = sorted(EXPECTED_INTEGRATION_IDS - ids)
        extra = sorted(ids - EXPECTED_INTEGRATION_IDS)
        fail(f"integration matrix id mismatch missing={missing} extra={extra}")
    counts = {key: 0 for key in ["pass", "partial", "missing", "blocked", "needs_review"]}
    for item in matrix:
        status = item.get("status")
        if status not in counts:
            fail(f"invalid integration status for {item.get('integration_id')}: {status}")
        counts[status] += 1
        if item.get("source_verified") is not True:
            fail(f"source not verified for {item.get('integration_id')}")
        if item.get("safety_status") != "pass":
            fail(f"safety status not pass for {item.get('integration_id')}")
        if not item.get("implementation_evidence"):
            fail(f"missing implementation evidence for {item.get('integration_id')}")
    summary = report.get("integration_summary", {})
    if summary.get("total") != 38:
        fail("integration summary total must be 38")
    for key, value in counts.items():
        if summary.get(key) != value:
            fail(f"integration summary mismatch for {key}: expected {value}, got {summary.get(key)}")
    if counts["missing"] or counts["blocked"]:
        fail("integration matrix contains missing or blocked paths")
    return counts


def validate_routes() -> int:
    routes = read("src/router/AdminRoutes.jsx")
    access = read("src/system/identity/hubAccessControl.js")
    sidebar = read("src/components/admin/AdminSidebar.jsx")
    bridge = read("src/system/routes/crossAppRouteBridge.js")
    bridge_optional = {"/ops/reports", "/ops/direct-connect"}
    for route in EXPECTED_ROUTES:
        if route not in routes:
            fail(f"route missing from AdminRoutes: {route}")
        if f'"{route}": ["shs_admin"]' not in access:
            fail(f"route missing shs_admin-only access mapping: {route}")
        if route not in bridge and route not in bridge_optional:
            fail(f"route missing from crossAppRouteBridge: {route}")
    for route in ["/ops/executive-command", "/ops/command-bus", "/ops/event-bus", "/ops/scheduler", "/ops/notifications", "/ops/agents", "/ops/direct-connect", "/ops/reports"]:
        if route not in sidebar:
            fail(f"route missing from admin sidebar: {route}")
    return len(EXPECTED_ROUTES)


def validate_package_scripts() -> None:
    package = json.loads(read("package.json"))
    scripts = package.get("scripts", {})
    for script in EXPECTED_PACKAGE_SCRIPTS:
        if script not in scripts:
            fail(f"missing package script: {script}")


def validate_source_evidence() -> int:
    source = read("src/system/executive-command-center/shsExecutiveCommandCenterSources.js")
    required_tokens = [
        "getCommands",
        "getEventBusEvents",
        "getJobs",
        "getNotifications",
        "calculatePersistenceMetrics",
        "calculateTrackingReadiness",
        "calculateRegistrySystemReadiness",
        "getShsOrchestratorTemplates",
        "direct_source_proof_only_no_live_external_integration",
    ]
    for token in required_tokens:
        if token not in source:
            fail(f"Executive Command Center source summary missing token: {token}")
    types = read("src/system/executive-command-center/shsExecutiveCommandCenterTypes.js")
    match = re.search(r"EXECUTIVE_SOURCE_GROUPS\s*=\s*Object\.freeze\(\[(.*?)\]\)", types, re.S)
    if not match:
        fail("Executive Command Center source group export missing")
    source_groups = re.findall(r'"([^"]+)"', match.group(1))
    if len(source_groups) < 16:
        fail(f"expected at least 16 Executive Command Center source groups, found {len(source_groups)}")
    return len(source_groups)


def validate_dangerous_flags(report: dict) -> int:
    enabled = []
    for path in SAFETY_SCAN_FILES:
        text = read(path)
        for key in DANGEROUS_TRUE_KEYS:
            if re.search(rf"\b{re.escape(key)}\s*:\s*true\b", text):
                enabled.append(f"{path}:{key}")
    if enabled:
        fail(f"dangerous capability flags enabled: {', '.join(enabled)}")
    dangerous = report.get("dangerous_flags", {})
    if dangerous.get("enabled_count") != 0:
        fail("report dangerous_flags.enabled_count must be 0")
    if dangerous.get("items") not in ([], None):
        fail("report dangerous_flags.items must be empty")
    return 0


def validate_boundaries(report: dict) -> None:
    direct_connect = read("src/data/shsDirectConnectData.js")
    for token in [
        "No live external integrations in V1.",
        "No credential storage in V1.",
        "Direct Connect does not bypass SHF approval.",
        "no live banking integration exists in V1",
    ]:
        if token not in direct_connect:
            fail(f"Direct Connect boundary token missing: {token}")
    if report.get("shs_shf_boundary", {}).get("result") != "PASS":
        fail("SHS/SHF boundary result must be PASS")
    if report.get("end_to_end_scenario", {}).get("result") != "PASS":
        fail("end-to-end scenario result must be PASS")
    if report.get("responsibility_boundaries", {}).get("result") != "PASS":
        fail("responsibility boundary result must be PASS")
    if report.get("v1_1_blockers"):
        fail("report must not contain V1.1 blockers for a ready-with-owner-review decision")


def validate_precommit() -> None:
    config = read(".pre-commit-config.yaml")
    ledger = read("tools/precommit/check_ledger_precommit.py")
    registry = read("tools/precommit/check_registry_guard.py")
    if "shf-ledger-verify" not in config or "shf-registry-guard" not in config:
        fail("pre-commit hook IDs missing")
    if "SHRV1 ledger verification (direct, no server restart)" not in ledger:
        fail("ledger pre-commit direct/no-restart proof missing")
    if "subprocess.Popen" not in ledger or "timeout" not in ledger:
        fail("ledger pre-commit bounded subprocess behavior missing")
    if "registry_canon.py must pin REGISTRY_PATH" not in registry:
        fail("registry guard canonical path enforcement missing")
    banned = ["uvicorn", "curl", "ADMIN_API_KEY", "localhost:8090"]
    for token in banned:
        if token in config:
            fail(f"pre-commit config contains banned runtime/server token: {token}")


def main() -> int:
    require_files()
    report = load_report()
    if report.get("name") != "SHS BOS V1.1 Full Integration Audit":
        fail("report name mismatch")
    if report.get("branch") != "v1.1-development":
        fail("report branch mismatch")
    counts = validate_matrix(report)
    route_count = validate_routes()
    validate_package_scripts()
    source_group_count = validate_source_evidence()
    dangerous_count = validate_dangerous_flags(report)
    validate_boundaries(report)
    validate_precommit()
    if report.get("final_decision") not in {"V1_1_INTEGRATION_READY", "V1_1_INTEGRATION_READY_WITH_OWNER_REVIEW"}:
        fail("final decision is not ready or ready with owner review")
    if report.get("v1_1_integration_ready") is not True:
        fail("v1_1_integration_ready must be true")
    warning_count = len(report.get("warnings", []))
    blocker_count = len(report.get("v1_1_blockers", []))
    print(
        "PASS: SHS BOS V1.1 full integration audit validation OK. "
        f"integrations=38 pass={counts['pass']} partial={counts['partial']} "
        f"needs_review={counts['needs_review']} blockers={blocker_count} "
        f"warnings={warning_count} dangerous_flags={dangerous_count} "
        f"routes={route_count} source_groups={source_group_count}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
