#!/usr/bin/env python3
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]

CORE_FILES = [
    "src/system/notification-fabric/shsNotificationTypes.js",
    "src/system/notification-fabric/shsNotificationRules.js",
    "src/system/notification-fabric/shsNotificationCenter.js",
    "src/system/notification-fabric/shsAlertQueue.js",
    "src/system/notification-fabric/shsEscalationRules.js",
    "src/system/notification-fabric/shsNotificationSafety.js",
    "src/system/notification-fabric/shsNotificationMetrics.js",
    "src/system/notification-fabric/shsNotificationStorage.js",
]

ADMIN_FILES = [
    "src/pages/admin/notifications/ShsNotificationFabricPage.jsx",
    "src/pages/admin/notifications/shsNotificationFabric.css",
]

DOC_FILES = [
    "docs/SHS_NOTIFICATION_ALERT_FABRIC_V1.md",
    "docs/SHS_NOTIFICATION_ALERT_FABRIC_V1.json",
]

WIRING_FILES = [
    "package.json",
    "src/router/AdminRoutes.jsx",
    "src/components/admin/AdminSidebar.jsx",
    "src/system/identity/hubAccessControl.js",
    "src/system/routes/crossAppRouteBridge.js",
]

ALERT_TYPES = [
    "governance",
    "readiness",
    "report",
    "agent",
    "workflow",
    "persistence",
    "tracking",
    "registry",
    "scheduler",
    "system",
]

SAFETY_COPY = (
    "SHS BOS Notification & Alert Fabric V1 creates internal admin-only operator awareness records. "
    "It does not send external email, SMS, push notifications, webhooks, third-party alerts, network "
    "delivery, report publishing, production mutation, auth mutation, or warehouse writes."
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

    docs_json = json.loads(read("docs/SHS_NOTIFICATION_ALERT_FABRIC_V1.json"))
    if docs_json.get("name") != "SHS BOS Notification & Alert Fabric V1":
        fail("docs JSON name mismatch")
    if docs_json.get("route") != "admin.html#/ops/notifications":
        fail("docs JSON route mismatch")
    if docs_json.get("alert_type_count") != 10:
        fail("docs JSON alert_type_count must be 10")

    types = read("src/system/notification-fabric/shsNotificationTypes.js")
    for token in [
        SAFETY_COPY,
        "external_email_enabled: false",
        "sms_send_enabled: false",
        "webhook_send_enabled: false",
        "push_send_enabled: false",
        "third_party_alert_enabled: false",
        "network_delivery_enabled: false",
        "production_mutation_enabled: false",
        "public_approval_mutation_enabled: false",
        "shf_impact_data_mutation_enabled: false",
        "report_publish_enabled: false",
        "warehouse_write_enabled: false",
        "auth_mutation_enabled: false",
        "credential_storage_enabled: false",
        "local_inbox_only",
        "internal_admin_only",
    ]:
        if token not in types:
            fail(f"missing token in shsNotificationTypes.js: {token}")

    for alert_type in ALERT_TYPES:
        require_token("src/system/notification-fabric/shsNotificationTypes.js", f'"{alert_type}"')
        require_token("src/system/notification-fabric/shsNotificationRules.js", f'alert_type: "{alert_type}"')

    for path, tokens in {
        "src/system/notification-fabric/shsNotificationRules.js": [
            "Governance alert",
            "Readiness alert",
            "Report alert",
            "Agent alert",
            "Workflow alert",
            "Persistence alert",
            "Tracking alert",
            "Registry alert",
            "Scheduler alert",
            "System alert",
        ],
        "src/system/notification-fabric/shsNotificationCenter.js": [
            "getNotificationCenterState",
            "createInternalNotification",
            "queueNotificationAlert",
            "createEscalationPreview",
            "createBlockedExternalDeliveryPreview",
        ],
        "src/system/notification-fabric/shsAlertQueue.js": [
            "getAlertQueue",
            "queueNotificationAlert",
        ],
        "src/system/notification-fabric/shsEscalationRules.js": [
            "createEscalationPreview",
            "local_preview_only: true",
            "external_delivery: false",
        ],
        "src/system/notification-fabric/shsNotificationSafety.js": [
            "scanNotificationSafety",
            "createBlockedExternalDeliveryPreview",
            "blocked key pattern",
            "blocked value pattern",
        ],
        "src/system/notification-fabric/shsNotificationMetrics.js": [
            "calculateNotificationMetrics",
            "alert_type_count",
        ],
        "src/system/notification-fabric/shsNotificationStorage.js": [
            "createInternalNotification",
            "queueAlert",
            "acknowledgeNotification",
            "archiveNotification",
            "localStorage",
        ],
        "src/pages/admin/notifications/ShsNotificationFabricPage.jsx": [
            "Internal Notification Inbox",
            "Alert Queue",
            "Severity",
            "Escalation Preview",
            "Blocked External Delivery",
            "External delivery blocked",
            "Create Internal Notification",
            "Queue Alert",
            "Acknowledge",
            "Archive",
        ],
    }.items():
        source = read(path)
        for token in tokens:
            if token not in source:
                fail(f"missing token in {path}: {token}")

    require_token("src/router/AdminRoutes.jsx", 'path="/ops/notifications"')
    require_token("src/components/admin/AdminSidebar.jsx", 'to: "/ops/notifications"')
    require_token("src/system/identity/hubAccessControl.js", '"/ops/notifications": ["shs_admin"]')
    require_token("src/system/routes/crossAppRouteBridge.js", "admin.html#/ops/notifications")
    require_token("package.json", '"check:shs-notification-fabric": "python3 scripts/check_shs_notification_alert_fabric.py"')

    combined = "\n".join(read(path) for path in CORE_FILES + ADMIN_FILES + DOC_FILES)
    forbidden_patterns = [
        r"external_email_enabled:\s*true",
        r"sms_send_enabled:\s*true",
        r"webhook_send_enabled:\s*true",
        r"push_send_enabled:\s*true",
        r"third_party_alert_enabled:\s*true",
        r"network_delivery_enabled:\s*true",
        r"production_mutation_enabled:\s*true",
        r"public_approval_mutation_enabled:\s*true",
        r"shf_impact_data_mutation_enabled:\s*true",
        r"report_publish_enabled:\s*true",
        r"warehouse_write_enabled:\s*true",
        r"auth_mutation_enabled:\s*true",
        r"credential_storage_enabled:\s*true",
        r"fetch\(",
        r"axios\.",
        r"XMLHttpRequest",
        r"new WebSocket",
        r"navigator\.serviceWorker",
        r"Notification\.requestPermission",
        r"sendEmail\(",
        r"sendSms\(",
        r"sendSMS\(",
        r"sendWebhook\(",
        r"sendPush\(",
        r"sendNotification\(",
        r"writeWarehouse",
        r"markPublicApproved\(",
        r"mutateShfImpactData\(",
        r"publishReport\(",
        r"accessToken\s*:",
        r"refreshToken\s*:",
        r"privateKey\s*:",
        r"apiKey\s*:",
    ]
    for pattern in forbidden_patterns:
        if re.search(pattern, combined, re.IGNORECASE):
            fail(f"forbidden Notification Fabric token present: {pattern}")

    print("PASS: SHS BOS Notification & Alert Fabric V1 validation OK.")


if __name__ == "__main__":
    main()
