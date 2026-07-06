#!/usr/bin/env python3
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]

CORE_FILES = [
    "src/system/event-bus/shsEventBusTypes.js",
    "src/system/event-bus/shsEventSchemas.js",
    "src/system/event-bus/shsEventBus.js",
    "src/system/event-bus/shsEventRouter.js",
    "src/system/event-bus/shsEventSubscribers.js",
    "src/system/event-bus/shsEventStorage.js",
    "src/system/event-bus/shsEventReplay.js",
    "src/system/event-bus/shsEventSafety.js",
    "src/system/event-bus/shsEventMetrics.js",
    "src/system/event-bus/shsEventReadiness.js",
]

ADMIN_FILES = [
    "src/pages/admin/event-bus/ShsEventBusPage.jsx",
    "src/pages/admin/event-bus/components/EventBusOverviewPanel.jsx",
    "src/pages/admin/event-bus/components/EventChannelPanel.jsx",
    "src/pages/admin/event-bus/components/EventTimelinePanel.jsx",
    "src/pages/admin/event-bus/components/EventSubscriberPanel.jsx",
    "src/pages/admin/event-bus/components/EventReplayPanel.jsx",
    "src/pages/admin/event-bus/components/EventSafetyPanel.jsx",
    "src/pages/admin/event-bus/components/EventReadinessPanel.jsx",
    "src/pages/admin/event-bus/shsEventBus.css",
]

DOC_FILES = [
    "docs/SHS_EVENT_BUS_MESSAGE_FABRIC_V1.md",
    "docs/SHS_EVENT_BUS_MESSAGE_FABRIC_V1.json",
]

WIRING_FILES = [
    "package.json",
    "src/router/AdminRoutes.jsx",
    "src/components/admin/AdminSidebar.jsx",
    "src/system/identity/hubAccessControl.js",
    "src/system/routes/crossAppRouteBridge.js",
]

EXPECTED_CHANNELS = [
    "orchestrator.events",
    "tracking.events",
    "persistence.events",
    "registry.events",
    "agent.events",
    "workflow.events",
    "report.events",
    "direct_connect.events",
    "governance.events",
    "system.events",
]

EVENT_MODEL_FIELDS = [
    "event_id",
    "event_type",
    "event_name",
    "source_layer",
    "target_layers",
    "entity_type",
    "entity_id",
    "risk_level",
    "visibility",
    "payload",
    "safety_status",
    "timestamp",
    "operator_note",
]

SAFETY_COPY = (
    "SHS BOS Event Bus / Message Fabric V1 routes internal local events only. "
    "It does not use external brokers, send network messages, mutate production data, "
    "publish reports, change public approval, write warehouse records, modify auth, or store credentials."
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

    docs_json = json.loads(read("docs/SHS_EVENT_BUS_MESSAGE_FABRIC_V1.json"))
    if docs_json.get("name") != "SHS BOS Event Bus / Message Fabric V1":
        fail("docs JSON name mismatch")
    if docs_json.get("product_name") != "SHS BOS":
        fail("docs JSON product_name mismatch")
    if docs_json.get("channel_count") != 10:
        fail("docs JSON channel_count must be exactly 10")

    types = read("src/system/event-bus/shsEventBusTypes.js")
    if SAFETY_COPY not in types:
        fail("missing exact safety copy")
    for channel in EXPECTED_CHANNELS:
        if channel not in types:
            fail(f"missing channel: {channel}")
    for field in EVENT_MODEL_FIELDS:
        if field not in types:
            fail(f"missing event model field: {field}")

    for path, tokens in {
        "src/system/event-bus/shsEventSchemas.js": [
            "validateShsEventSchema",
            "SHS_EVENT_REQUIRED_FIELDS",
            "visibility must be internal_only",
            "getEventChannelByType",
        ],
        "src/system/event-bus/shsEventBus.js": [
            "getEventBusState",
            "createSampleSafeEvent",
            "subscribeLocalLayer",
            "unsubscribeLocalLayer",
            "archiveLocalEvent",
        ],
        "src/system/event-bus/shsEventRouter.js": [
            "routeEvent",
            "listEventRoutes",
            "network_delivery: false",
            "external_broker: false",
        ],
        "src/system/event-bus/shsEventSubscribers.js": [
            "SHS_EVENT_DEFAULT_SUBSCRIBERS",
            "createSubscriber",
            "local_only: true",
            "in_memory_preview",
        ],
        "src/system/event-bus/shsEventStorage.js": [
            "publishLocalEvent",
            "createSampleSafeEvent",
            "createDangerousPayloadPreview",
            "archiveLocalEvent",
            "localStorage",
        ],
        "src/system/event-bus/shsEventReplay.js": [
            "createEventReplayPreview",
            "summarizeReplayPreview",
            "preview_only: true",
            "production_mutation: false",
        ],
        "src/system/event-bus/shsEventSafety.js": [
            "scanEventSafety",
            "SHS_EVENT_DANGEROUS_CAPABILITIES",
            "external broker",
            "public approval mutation",
            "warehouse",
        ],
        "src/system/event-bus/shsEventMetrics.js": ["calculateEventBusMetrics"],
        "src/system/event-bus/shsEventReadiness.js": [
            "calculateEventBusReadiness",
            "SHS_EVENT_CHANNELS.length !== 10",
            "dangerous",
        ],
    }.items():
        source = read(path)
        for token in tokens:
            if token not in source:
                fail(f"missing token in {path}: {token}")

    require_token("src/router/AdminRoutes.jsx", 'path="/ops/event-bus"')
    require_token("src/components/admin/AdminSidebar.jsx", 'to: "/ops/event-bus"')
    require_token("src/system/identity/hubAccessControl.js", '"/ops/event-bus": ["shs_admin"]')
    require_token("src/system/routes/crossAppRouteBridge.js", "admin.html#/ops/event-bus")
    require_token("package.json", '"check:shs-event-bus": "python3 scripts/check_shs_event_bus.py"')

    combined = "\n".join(read(path) for path in CORE_FILES + ADMIN_FILES + DOC_FILES)
    source_combined = "\n".join(read(path) for path in CORE_FILES + ADMIN_FILES)
    forbidden_patterns = [
        r"external_broker_enabled:\s*true",
        r"network_delivery_enabled:\s*true",
        r"webhook_send_enabled:\s*true",
        r"notification_send_enabled:\s*true",
        r"production_mutation_enabled:\s*true",
        r"public_approval_mutation_enabled:\s*true",
        r"shf_impact_data_mutation_enabled:\s*true",
        r"report_publish_enabled:\s*true",
        r"warehouse_write_enabled:\s*true",
        r"auth_mutation_enabled:\s*true",
        r"credential_storage_enabled:\s*true",
        r"autonomous_execution_enabled:\s*true",
        r"fetch\(",
        r"axios\.",
        r"XMLHttpRequest",
        r"new WebSocket",
        r"sendWebhook\(",
        r"sendNotification\(",
        r"writeWarehouse",
        r"markPublicApproved\(",
        r"mutateShfImpactData\(",
        r"executeAgent\(",
        r"executeWorkflow\(",
        r"accessToken\s*:",
        r"refreshToken\s*:",
        r"privateKey\s*:",
    ]
    for pattern in forbidden_patterns:
        if re.search(pattern, combined, re.IGNORECASE):
            fail(f"forbidden Event Bus token present: {pattern}")

    forbidden_source_patterns = [
        r"new\s+Kafka",
        r"from ['\"]kafka",
        r"from ['\"]redis",
        r"from ['\"]rabbitmq",
        r"createClient\(",
        r"amqp",
    ]
    for pattern in forbidden_source_patterns:
        if re.search(pattern, source_combined, re.IGNORECASE):
            fail(f"forbidden Event Bus source integration present: {pattern}")

    print("PASS: SHS BOS Event Bus / Message Fabric V1 validation OK.")


if __name__ == "__main__":
    main()
