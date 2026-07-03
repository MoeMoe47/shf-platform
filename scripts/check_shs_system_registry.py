#!/usr/bin/env python3
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]

CORE_FILES = [
    "src/system/system-registry/shsSystemRegistryTypes.js",
    "src/system/system-registry/shsSystemRegistryEntries.js",
    "src/system/system-registry/shsSystemDependencyGraph.js",
    "src/system/system-registry/shsSystemRegistryStorage.js",
    "src/system/system-registry/shsSystemRegistryMetrics.js",
    "src/system/system-registry/shsSystemRegistrySafety.js",
    "src/system/system-registry/shsSystemRegistryScanner.js",
    "src/system/system-registry/shsSystemBlastRadius.js",
    "src/system/system-registry/shsSystemLayerHealth.js",
    "src/system/system-registry/shsSystemRegistryReadiness.js",
    "src/system/system-registry/shsSystemLifecycle.js",
    "src/system/system-registry/shsSystemVersionHistory.js",
    "src/system/system-registry/shsSystemArchitectureTimeline.js",
]

ADMIN_FILES = [
    "src/pages/admin/system-registry/ShsSystemRegistryPage.jsx",
    "src/pages/admin/system-registry/components/SystemRegistryOverviewPanel.jsx",
    "src/pages/admin/system-registry/components/SystemLayerList.jsx",
    "src/pages/admin/system-registry/components/SystemLayerDetail.jsx",
    "src/pages/admin/system-registry/components/SystemDependencyGraphPanel.jsx",
    "src/pages/admin/system-registry/components/SystemBlastRadiusPanel.jsx",
    "src/pages/admin/system-registry/components/SystemReadinessPanel.jsx",
    "src/pages/admin/system-registry/components/SystemRegistrySafetyPanel.jsx",
    "src/pages/admin/system-registry/components/SystemValidatorMatrix.jsx",
    "src/pages/admin/system-registry/components/SystemLifecyclePanel.jsx",
    "src/pages/admin/system-registry/components/SystemArchitectureTimeline.jsx",
    "src/pages/admin/system-registry/shsSystemRegistry.css",
]

DOC_FILES = [
    "docs/SHS_SYSTEM_REGISTRY_DEPENDENCY_INTELLIGENCE_V1.md",
    "docs/SHS_SYSTEM_REGISTRY_DEPENDENCY_INTELLIGENCE_V1.json",
]

WIRING_FILES = [
    "package.json",
    "src/router/AdminRoutes.jsx",
    "src/components/admin/AdminSidebar.jsx",
    "src/system/identity/hubAccessControl.js",
    "src/system/routes/crossAppRouteBridge.js",
]

SAFETY_COPY = (
    "SHS System Registry & Dependency Intelligence V1 maps internal layer relationships only. "
    "It does not execute workflows, mutate data, publish reports, change public approval, "
    "send external messages, write warehouse records, or modify auth."
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

    docs_json = json.loads(read("docs/SHS_SYSTEM_REGISTRY_DEPENDENCY_INTELLIGENCE_V1.json"))
    if docs_json.get("name") != "SHS System Registry & Dependency Intelligence V1":
        fail("docs JSON name mismatch")
    if docs_json.get("layer_count", 0) < 32:
        fail("docs JSON layer_count must be at least 32")

    entries = read("src/system/system-registry/shsSystemRegistryEntries.js")
    if entries.count("layer_id:") < 32:
        fail("registry must contain at least 32 layer entries")
    for required_layer in [
        "Master Layer Registry",
        "Truth Spine",
        "Oracle Layer",
        "SHS System Orchestrator",
        "Durable Persistence Layer",
        "Tracking Intelligence Layer",
        "System Registry & Dependency Intelligence",
    ]:
        if required_layer not in entries:
            fail(f"missing required layer: {required_layer}")

    for path, tokens in {
        "src/system/system-registry/shsSystemRegistryTypes.js": [
            SAFETY_COPY,
            "lifecycle_status",
            "version_history",
            "health",
            "dangerous_capabilities",
            "production_mutation: false",
            "credential_storage: false",
        ],
        "src/system/system-registry/shsSystemDependencyGraph.js": [
            "getLayerById",
            "listLayers",
            "listByCategory",
            "listByReleaseStatus",
            "getDependencies",
            "getDependents",
            "getTransitiveDependencies",
            "getTransitiveDependents",
            "detectCircularDependencies",
            "detectMissingDependencies",
            "detectMissingDocs",
            "detectMissingValidators",
            "calculateLayerReadiness",
            "calculateSystemReadiness",
        ],
        "src/system/system-registry/shsSystemBlastRadius.js": [
            "getBlastRadius",
            "direct_dependents",
            "transitive_dependents",
            "validators_to_run",
            "manual_reviews_required",
            "risk_level",
            "safe_change_guidance",
        ],
        "src/system/system-registry/shsSystemRegistrySafety.js": [
            "scanSystemRegistrySafety",
            "missing docs",
            "missing validator",
            "dependency cycle",
        ],
        "src/system/system-registry/shsSystemRegistryReadiness.js": [
            "calculateRegistryLayerReadiness",
            "calculateRegistrySystemReadiness",
            "score >= 85",
            "publicApprovalMutationRisk",
            "shfImpactMutationRisk",
            "authMutationRisk",
        ],
        "src/system/system-registry/shsSystemLifecycle.js": ["listLifecycleStates"],
        "src/system/system-registry/shsSystemVersionHistory.js": ["getVersionHistory", "listVersionHistory"],
        "src/system/system-registry/shsSystemArchitectureTimeline.js": [
            "Foundation / Governance",
            "Future: Capability Registry",
            "Future: Event Bus / Message Spine",
            "Future: Scheduler",
            "Future: Observability V2",
            "Future: AI Decision Engine",
        ],
    }.items():
        source = read(path)
        for token in tokens:
            if token not in source:
                fail(f"missing token in {path}: {token}")

    require_token("src/router/AdminRoutes.jsx", 'path="/ops/system-registry"')
    require_token("src/components/admin/AdminSidebar.jsx", 'to: "/ops/system-registry"')
    require_token("src/system/identity/hubAccessControl.js", '"/ops/system-registry": ["shs_admin"]')
    require_token("src/system/routes/crossAppRouteBridge.js", "admin.html#/ops/system-registry")
    require_token("package.json", '"check:shs-system-registry": "python3 scripts/check_shs_system_registry.py"')

    combined = "\n".join(read(path) for path in CORE_FILES + ADMIN_FILES + DOC_FILES)
    forbidden_patterns = [
        r"production_mutation:\s*true",
        r"public_approval_mutation:\s*true",
        r"shf_impact_mutation:\s*true",
        r"external_delivery:\s*true",
        r"webhook_send:\s*true",
        r"notification_send:\s*true",
        r"warehouse_write:\s*true",
        r"auth_mutation:\s*true",
        r"credential_storage:\s*true",
        r"markPublicApproved\(",
        r"mutateShfImpactData\(",
        r"sendWebhook\(",
        r"sendNotification\(",
        r"writeWarehouse",
        r"executeWorkflow\(",
        r"executeAgent\(",
        r"fetch\(",
        r"axios\.",
        r"XMLHttpRequest",
        r"document\.cookie",
        r"accessToken\s*:",
        r"refreshToken\s*:",
        r"privateKey\s*:",
    ]
    for pattern in forbidden_patterns:
        if re.search(pattern, combined, re.IGNORECASE):
            fail(f"forbidden system registry token present: {pattern}")

    print("PASS: SHS System Registry & Dependency Intelligence V1 validation OK.")


if __name__ == "__main__":
    main()
