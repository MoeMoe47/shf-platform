#!/usr/bin/env python3
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]

CORE_FILES = [
    "src/system/command-bus/shsCommandTypes.js",
    "src/system/command-bus/shsCommandSchemas.js",
    "src/system/command-bus/shsCommandRegistry.js",
    "src/system/command-bus/shsCommandBus.js",
    "src/system/command-bus/shsCommandRouter.js",
    "src/system/command-bus/shsCommandQueue.js",
    "src/system/command-bus/shsCommandDispatcher.js",
    "src/system/command-bus/shsCommandHandlers.js",
    "src/system/command-bus/shsCommandApprovals.js",
    "src/system/command-bus/shsCommandValidator.js",
    "src/system/command-bus/shsCommandPolicies.js",
    "src/system/command-bus/shsCommandPermissions.js",
    "src/system/command-bus/shsCommandHistory.js",
    "src/system/command-bus/shsCommandMetrics.js",
    "src/system/command-bus/shsCommandReadiness.js",
    "src/system/command-bus/shsCommandSafety.js",
    "src/system/command-bus/shsCommandStorage.js",
]

ADMIN_FILES = [
    "src/pages/admin/command-bus/ShsCommandBusPage.jsx",
    "src/pages/admin/command-bus/components/CommandOverviewPanel.jsx",
    "src/pages/admin/command-bus/components/CommandQueuePanel.jsx",
    "src/pages/admin/command-bus/components/CommandHistoryPanel.jsx",
    "src/pages/admin/command-bus/components/CommandApprovalPanel.jsx",
    "src/pages/admin/command-bus/components/CommandPreviewPanel.jsx",
    "src/pages/admin/command-bus/components/CommandMetricsPanel.jsx",
    "src/pages/admin/command-bus/components/CommandPolicyPanel.jsx",
    "src/pages/admin/command-bus/components/CommandSafetyPanel.jsx",
    "src/pages/admin/command-bus/components/CommandPermissionsPanel.jsx",
    "src/pages/admin/command-bus/components/CommandValidatorPanel.jsx",
    "src/pages/admin/command-bus/components/CommandAuditPanel.jsx",
    "src/pages/admin/command-bus/components/CommandReadinessPanel.jsx",
    "src/pages/admin/command-bus/shsCommandBus.css",
]

DOC_FILES = [
    "docs/SHS_COMMAND_BUS_V1.md",
    "docs/SHS_COMMAND_BUS_V1.json",
]

WIRING_FILES = [
    "package.json",
    "src/router/AdminRoutes.jsx",
    "src/components/admin/AdminSidebar.jsx",
    "src/system/identity/hubAccessControl.js",
    "src/system/routes/crossAppRouteBridge.js",
]

EXPECTED_COMMAND_TYPES = [
    "system",
    "workflow",
    "tracking",
    "persistence",
    "registry",
    "governance",
    "reports",
    "agent",
    "client_ops",
    "website_studio",
    "production",
    "sales",
    "direct_connect",
    "qa",
    "scheduler",
    "notifications",
    "analytics",
    "identity",
    "security",
]

COMMAND_MODEL_FIELDS = [
    "command_id",
    "command_type",
    "command_name",
    "source_layer",
    "target_layer",
    "requested_by",
    "requested_at",
    "risk_level",
    "approval_required",
    "execution_mode",
    "payload",
    "validation_status",
    "approval_status",
    "execution_status",
    "completion_status",
    "audit_status",
    "notes",
]

SAFETY_COPY = (
    "SHS BOS Command Bus V1 standardizes internal command requests for validation, approval, "
    "routing, preview, dry-run, and audit only. It does not execute autonomous AI, shell commands, "
    "Python, external APIs, webhooks, OAuth, banking, payments, report publishing, public approval "
    "mutation, SHF Impact mutation, production writes, file deletion, recursive execution, or command "
    "chaining without approval."
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

    docs_json = json.loads(read("docs/SHS_COMMAND_BUS_V1.json"))
    if docs_json.get("name") != "SHS BOS Command Bus V1":
        fail("docs JSON name mismatch")
    if docs_json.get("route") != "admin.html#/ops/command-bus":
        fail("docs JSON route mismatch")
    if docs_json.get("command_type_count") != 19:
        fail("docs JSON command_type_count must be exactly 19")

    types = read("src/system/command-bus/shsCommandTypes.js")
    if SAFETY_COPY not in types:
        fail("missing exact safety copy")
    for command_type in EXPECTED_COMMAND_TYPES:
        require_token("src/system/command-bus/shsCommandTypes.js", f'"{command_type}"')
        require_token("src/system/command-bus/shsCommandRegistry.js", f'command_type: "{command_type}"')
    for field in COMMAND_MODEL_FIELDS:
        require_token("src/system/command-bus/shsCommandTypes.js", f'"{field}"')

    for token in [
        '"preview"',
        '"dry_run"',
        '"manual"',
        '"approved"',
        '"blocked"',
        "autonomous_execution_enabled: false",
        "shell_execution_enabled: false",
        "python_execution_enabled: false",
        "production_write_enabled: false",
        "public_approval_mutation_enabled: false",
        "shf_impact_data_mutation_enabled: false",
        "file_deletion_enabled: false",
        "network_execution_enabled: false",
    ]:
        require_token("src/system/command-bus/shsCommandTypes.js", token)
    require_token("src/system/command-bus/shsCommandSchemas.js", "automatic and autonomous modes are not supported in V1")

    for path, tokens in {
        "src/system/command-bus/shsCommandSchemas.js": ["validateCommandSchema", "SHS_COMMAND_REQUIRED_FIELDS"],
        "src/system/command-bus/shsCommandBus.js": [
            "getCommandBusState",
            "createLocalCommand",
            "createBlockedLocalCommand",
            "queueCommand",
            "dryRunCommand",
            "previewCommand",
        ],
        "src/system/command-bus/shsCommandRouter.js": [
            "routeCommand",
            "listCommandRoutes",
            "execution_router_enabled: false",
            "external_api: false",
            "network_execution: false",
            "production_write: false",
        ],
        "src/system/command-bus/shsCommandDispatcher.js": [
            "dispatchCommandPreview",
            "execution_performed: false",
            "preview_only: true",
        ],
        "src/system/command-bus/shsCommandHandlers.js": [
            "previewCommand",
            "dryRunCommand",
            "auditCommand",
            "execution_performed: false",
        ],
        "src/system/command-bus/shsCommandApprovals.js": [
            "Safe",
            "Owner Review",
            "Governance Review",
            "Blocked",
            "approved_for_execution: false",
        ],
        "src/system/command-bus/shsCommandPermissions.js": [
            "checkCommandPermissions",
            "client_admin/public blocked from command bus",
        ],
        "src/system/command-bus/shsCommandPolicies.js": [
            "checkCommandPolicies",
            "automatic",
            "autonomous",
            "critical commands require governance review",
        ],
        "src/system/command-bus/shsCommandSafety.js": [
            "scanCommandSafety",
            "createBlockedCommandExamples",
            "createBlockedCommandPreview",
            "Delete Database",
            "Publish Reports",
            "Mark Public Approved",
            "Mutate Truth Spine",
            "Execute Shell",
            "Run Python",
            "Send External Email",
            "Webhook Delivery",
            "OAuth Login",
            "Bank Connection",
            "Payment Processing",
            "API Token Creation",
        ],
        "src/system/command-bus/shsCommandStorage.js": [
            "SHS_SAFE_SAMPLE_COMMANDS",
            "Generate Report Preview",
            "Run Governance Validation",
            "Refresh Registry Scan",
            "Preview Workflow",
            "Recalculate Readiness",
            "Refresh Tracking Metrics",
            "Dry-run Persistence Snapshot",
            "Queue Notification Preview",
            "Validate Route Access",
            "readCriticalStateRecords",
            "writeCriticalStateRecords",
        ],
        "src/system/command-bus/shsCommandMetrics.js": ["calculateCommandMetrics", "command_type_count"],
        "src/system/command-bus/shsCommandReadiness.js": ["calculateCommandReadiness", "SHS_COMMAND_TYPES.length !== 19"],
        "src/pages/admin/command-bus/ShsCommandBusPage.jsx": [
            "Command Bus",
            "Create Safe Sample Command",
            "Block Dangerous Command",
        ],
    }.items():
        source = read(path)
        for token in tokens:
            if token not in source:
                fail(f"missing token in {path}: {token}")

    admin_combined = "\n".join(read(path) for path in ADMIN_FILES)
    for token in ["Queue", "Approvals", "Preview", "Safety", "Permissions", "Audit", "Readiness", "Blocked Commands"]:
        if token not in admin_combined:
            fail(f"missing UI token: {token}")

    require_token("src/router/AdminRoutes.jsx", 'path="/ops/command-bus"')
    require_token("src/components/admin/AdminSidebar.jsx", 'to: "/ops/command-bus"')
    require_token("src/system/identity/hubAccessControl.js", '"/ops/command-bus": ["shs_admin"]')
    require_token("src/system/routes/crossAppRouteBridge.js", "admin.html#/ops/command-bus")
    require_token("package.json", '"check:shs-command-bus": "python3 scripts/check_shs_command_bus.py"')

    combined = "\n".join(read(path) for path in CORE_FILES + ADMIN_FILES + DOC_FILES)
    forbidden_patterns = [
        r"autonomous_execution_enabled:\s*true",
        r"self_modifying_behavior_enabled:\s*true",
        r"recursive_execution_enabled:\s*true",
        r"external_api_enabled:\s*true",
        r"webhook_send_enabled:\s*true",
        r"oauth_enabled:\s*true",
        r"credential_storage_enabled:\s*true",
        r"banking_enabled:\s*true",
        r"plaid_enabled:\s*true",
        r"payment_execution_enabled:\s*true",
        r"report_publish_enabled:\s*true",
        r"shf_impact_data_mutation_enabled:\s*true",
        r"public_approval_mutation_enabled:\s*true",
        r"production_write_enabled:\s*true",
        r"shell_execution_enabled:\s*true",
        r"python_execution_enabled:\s*true",
        r"file_deletion_enabled:\s*true",
        r"network_execution_enabled:\s*true",
        r"unapproved_command_chaining_enabled:\s*true",
        r"fetch\(",
        r"axios\.",
        r"XMLHttpRequest",
        r"new WebSocket",
        r"child_process",
        r"exec\(",
        r"spawn\(",
        r"eval\(",
        r"Function\(",
        r"sendWebhook\(",
        r"sendEmail\(",
        r"publishReport\(",
        r"markPublicApproved\(",
        r"mutateShfImpactData\(",
        r"deleteFile\(",
        r"deleteDatabase\(",
        r"accessToken\s*:",
        r"refreshToken\s*:",
        r"privateKey\s*:",
        r"apiKey\s*:",
    ]
    for pattern in forbidden_patterns:
        if re.search(pattern, combined, re.IGNORECASE):
            fail(f"forbidden Command Bus token present: {pattern}")

    print("PASS: SHS BOS Command Bus V1 validation OK.")


if __name__ == "__main__":
    main()
