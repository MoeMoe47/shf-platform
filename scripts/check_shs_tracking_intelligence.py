#!/usr/bin/env python3
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]

CORE_FILES = [
    "src/system/tracking/shsTrackingTypes.js",
    "src/system/tracking/shsTrackingEvents.js",
    "src/system/tracking/shsTrackingStreams.js",
    "src/system/tracking/shsTrackingStorage.js",
    "src/system/tracking/shsTrackingSafety.js",
    "src/system/tracking/shsTrackingMetrics.js",
    "src/system/tracking/shsTrackingSignals.js",
    "src/system/tracking/shsTrackingTimeline.js",
    "src/system/tracking/shsTrackingEntityLinks.js",
    "src/system/tracking/shsTrackingReadiness.js",
]

ADMIN_FILES = [
    "src/pages/admin/tracking/ShsTrackingIntelligencePage.jsx",
    "src/pages/admin/tracking/components/TrackingOverviewPanel.jsx",
    "src/pages/admin/tracking/components/TrackingStreamPanel.jsx",
    "src/pages/admin/tracking/components/TrackingEventTimeline.jsx",
    "src/pages/admin/tracking/components/TrackingSignalPanel.jsx",
    "src/pages/admin/tracking/components/TrackingEntityLinkPanel.jsx",
    "src/pages/admin/tracking/components/TrackingReadinessPanel.jsx",
    "src/pages/admin/tracking/components/TrackingSafetyPanel.jsx",
    "src/pages/admin/tracking/components/TrackingReportUsePanel.jsx",
    "src/pages/admin/tracking/shsTrackingIntelligence.css",
]

DOC_FILES = [
    "docs/SHS_TRACKING_INTELLIGENCE_LAYER_V1.md",
    "docs/SHS_TRACKING_INTELLIGENCE_LAYER_V1.json",
]

WIRING_FILES = [
    "package.json",
    "src/router/AdminRoutes.jsx",
    "src/components/admin/AdminSidebar.jsx",
    "src/system/identity/hubAccessControl.js",
    "src/system/routes/crossAppRouteBridge.js",
]


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

    docs_json = json.loads(read("docs/SHS_TRACKING_INTELLIGENCE_LAYER_V1.json"))
    if docs_json.get("name") != "SHS Tracking Intelligence Layer V1":
        fail("docs JSON name mismatch")

    package = read("package.json")
    if '"check:shs-tracking": "python3 scripts/check_shs_tracking_intelligence.py"' not in package:
        fail("package script missing")

    streams = read("src/system/tracking/shsTrackingStreams.js")
    stream_count = streams.count("stream_id:")
    if stream_count != 12:
        fail(f"expected exactly 12 streams, found {stream_count}")
    for stream_name in [
        "Sales Activity Stream",
        "Production Movement Stream",
        "QA Readiness Stream",
        "ClientOps Lifecycle Stream",
        "Reports Usage Stream",
        "Agent Activity Stream",
        "Orchestrator Coordination Stream",
        "Direct Connect Proof Stream",
        "Persistence Snapshot Stream",
        "Support / Maintenance Stream",
        "Revenue / Renewal Signal Stream",
        "Governance / Readiness Stream",
    ]:
        if stream_name not in streams:
            fail(f"missing stream: {stream_name}")

    require_token("src/system/tracking/shsTrackingTypes.js", "SHS Tracking Intelligence V1 records internal operational events only")
    require_token("src/system/tracking/shsTrackingTypes.js", "external_tracking_enabled: false")
    require_token("src/system/tracking/shsTrackingTypes.js", "public_approved_mutation_enabled: false")
    require_token("src/system/tracking/shsTrackingTypes.js", "shf_impact_data_mutation_enabled: false")

    events = read("src/system/tracking/shsTrackingEvents.js")
    for token in [
        "tracking_event_id",
        "event_type",
        "event_name",
        "event_source",
        "event_action",
        "entity_type",
        "client_id",
        "project_id",
        "report_id",
        "agent_id",
        "workflow_id",
        "visibility: input.visibility || \"internal_only\"",
        "safety_status",
        "metadata",
    ]:
        if token not in events:
            fail(f"event model missing token: {token}")

    signals = read("src/system/tracking/shsTrackingSignals.js")
    for token in [
        "upgrade_opportunity",
        "renewal_risk",
        "report_engagement",
        "support_hotspot",
        "qa_blocker",
        "production_delay",
        "agent_activity_spike",
        "proof_gap",
        "governance_attention",
        "client_value_signal",
        "revenue_signal",
        "impact_report_candidate",
        "generateTrackingSignals",
    ]:
        if token not in signals:
            fail(f"signal model missing token: {token}")

    for path, tokens in {
        "src/system/tracking/shsTrackingSafety.js": ["scanTrackingEventSafety", "credential", "api[_-]?key", "oauth", "pixel", "cookie", "warehouse"],
        "src/system/tracking/shsTrackingTimeline.js": ["createTrackingTimeline", "groupTimelineByStream"],
        "src/system/tracking/shsTrackingEntityLinks.js": ["createTrackingEntityLinks", "filterTrackingEvents"],
        "src/system/tracking/shsTrackingMetrics.js": ["event_count_by_stream", "open_blockers", "tracking readiness score"],
        "src/system/tracking/shsTrackingReadiness.js": ["score >= 80", "dangerous_tracking_enabled", "no_external_tracking"],
    }.items():
        source = read(path)
        for token in tokens:
            if token not in source:
                fail(f"missing token in {path}: {token}")

    require_token("src/router/AdminRoutes.jsx", 'path="/ops/tracking"')
    require_token("src/components/admin/AdminSidebar.jsx", 'to: "/ops/tracking"')
    require_token("src/system/identity/hubAccessControl.js", '"/ops/tracking": ["shs_admin"]')
    require_token("src/system/routes/crossAppRouteBridge.js", "admin.html#/ops/tracking")

    combined = "\n".join(read(path) for path in CORE_FILES + ADMIN_FILES + DOC_FILES)
    forbidden_patterns = [
        r"external_tracking_enabled:\s*true",
        r"third_party_analytics_enabled:\s*true",
        r"cookie_tracking_enabled:\s*true",
        r"pixel_tracking_enabled:\s*true",
        r"webhook_sending_enabled:\s*true",
        r"notification_sending_enabled:\s*true",
        r"warehouse_write_enabled:\s*true",
        r"report_publishing_enabled:\s*true",
        r"public_approved_mutation_enabled:\s*true",
        r"shf_impact_data_mutation_enabled:\s*true",
        r"fetch\(",
        r"axios\.",
        r"XMLHttpRequest",
        r"gtag\(",
        r"analytics\.track",
        r"document\.cookie",
        r"new Image\(",
        r"sendWebhook\(",
        r"sendNotification\(",
        r"writeWarehouse",
        r"markPublicApproved\(",
        r"mutateShfImpactData\(",
        r"accessToken\s*:",
        r"refreshToken\s*:",
        r"privateKey\s*:",
    ]
    for pattern in forbidden_patterns:
        if re.search(pattern, combined, re.IGNORECASE):
            fail(f"forbidden tracking token present: {pattern}")

    print("PASS: SHS Tracking Intelligence Layer V1 validation OK.")


if __name__ == "__main__":
    main()

