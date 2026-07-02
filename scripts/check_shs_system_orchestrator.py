#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "docs/SHS_SYSTEM_ORCHESTRATOR_V1.md",
    "docs/SHS_SYSTEM_ORCHESTRATOR_V1.json",
    "src/data/orchestrator/shsOrchestratorRequests.js",
    "src/data/orchestrator/shsOrchestratorPlans.js",
    "src/data/orchestrator/shsOrchestratorTemplates.js",
    "src/data/orchestrator/shsOrchestratorStorage.js",
    "src/data/orchestrator/shsOrchestratorReadiness.js",
    "src/data/orchestrator/shsOrchestratorSafety.js",
    "src/data/orchestrator/shsOrchestratorMetrics.js",
    "src/data/orchestrator/shsOrchestratorActions.js",
    "src/pages/admin/orchestrator/ShsSystemOrchestratorPage.jsx",
    "src/pages/admin/orchestrator/components/OrchestratorTemplatePanel.jsx",
    "src/pages/admin/orchestrator/components/OrchestratorRequestList.jsx",
    "src/pages/admin/orchestrator/components/OrchestratorPlanDetail.jsx",
    "src/pages/admin/orchestrator/components/OrchestratorReadinessPanel.jsx",
    "src/pages/admin/orchestrator/components/OrchestratorSafetyPanel.jsx",
    "src/pages/admin/orchestrator/components/OrchestratorLayerMap.jsx",
    "src/pages/admin/orchestrator/components/OrchestratorNextActions.jsx",
    "src/pages/admin/orchestrator/shsSystemOrchestrator.css",
]

TEMPLATE_TITLES = [
    "Client Premium Report Orchestration",
    "Sales to Delivery Orchestration",
    "Direct Source Proof Orchestration",
    "Agent Workflow Orchestration",
    "Launch Readiness Orchestration",
    "ClientOps Review Orchestration",
    "Governance Review Orchestration",
    "Private Beta Demo Orchestration",
]

FALSE_TOKENS = [
    "execution_enabled: false",
    "production_mutation_enabled: false",
    "public_publish_enabled: false",
    "public_approved_mutation_enabled: false",
    "shf_impact_data_mutation_enabled: false",
    "external_delivery_enabled: false",
    "warehouse_write_enabled: false",
    "auth_mutation_enabled: false",
]

FORBIDDEN_TRUE_PATTERNS = [
    "execution_enabled: true",
    "production_mutation_enabled: true",
    "public_publish_enabled: true",
    "public_approved_mutation_enabled: true",
    "shf_impact_data_mutation_enabled: true",
    "external_delivery_enabled: true",
    "warehouse_write_enabled: true",
    "auth_mutation_enabled: true",
    '"execution_enabled": true',
    '"production_mutation_enabled": true',
    '"public_approved_mutation_enabled": true',
    '"shf_impact_data_mutation_enabled": true',
]

FORBIDDEN_LIVE_TOKENS = [
    "connectBank(",
    "connectAccount(",
    "plaidClient",
    "plaidLink",
    "plaid_token",
    "oauth_token",
    "access_token",
    "refresh_token",
    "bank_password",
    "payment_connection_enabled: true",
    "live_connection_enabled: true",
    "fetch(",
    "axios.",
    "XMLHttpRequest",
    "sendWebhook(",
    "sendNotification(",
    "writeWarehouse",
    "modifyAuth(",
    "publishReport(",
    "markPublicApproved(",
]


def read(rel):
    path = ROOT / rel
    if not path.exists():
        raise SystemExit(f"FAIL: missing required file {rel}")
    return path.read_text(encoding="utf-8")


def main():
    for rel in REQUIRED_FILES:
        read(rel)

    docs_json = json.loads(read("docs/SHS_SYSTEM_ORCHESTRATOR_V1.json"))
    if docs_json.get("name") != "SHS System Orchestrator V1":
        raise SystemExit("FAIL: JSON name mismatch")
    if len(docs_json.get("orchestration_templates", [])) != 8:
        raise SystemExit("FAIL: JSON must list exactly 8 orchestration templates")

    templates = read("src/data/orchestrator/shsOrchestratorTemplates.js")
    template_count = len(re.findall(r"orchestration_template_id:", templates))
    if template_count != 8:
        raise SystemExit(f"FAIL: expected exactly 8 templates, found {template_count}")
    for title in TEMPLATE_TITLES:
        if title not in templates:
            raise SystemExit(f"FAIL: missing template {title}")

    scanned = "\n".join(read(rel) for rel in REQUIRED_FILES + [
        "src/router/AdminRoutes.jsx",
        "src/components/admin/AdminSidebar.jsx",
        "src/system/identity/hubAccessControl.js",
        "src/system/routes/crossAppRouteBridge.js",
        "package.json",
    ])

    for token in FALSE_TOKENS:
        if token not in scanned:
            raise SystemExit(f"FAIL: missing dangerous false token {token}")
    for token in FORBIDDEN_TRUE_PATTERNS:
        if token in scanned:
            raise SystemExit(f"FAIL: dangerous flag enabled {token}")
    for token in FORBIDDEN_LIVE_TOKENS:
        if token.lower() in scanned.lower():
            raise SystemExit(f"FAIL: forbidden live/external token present {token}")

    for token in [
        'path="/ops/orchestrator"',
        'protect("/ops/orchestrator"',
        '"/ops/orchestrator": ["shs_admin"]',
        "admin.html#/ops/orchestrator",
        "Orchestrator",
    ]:
        if token not in scanned:
            raise SystemExit(f"FAIL: route/access/nav token missing {token}")

    for token in [
        "Start at 100",
        "score >= 80",
        "missing_human_approval_path",
        "SHS System Orchestrator V1 coordinates approved internal workflows only",
        '"check:shs-orchestrator": "python3 scripts/check_shs_system_orchestrator.py"',
    ]:
        if token not in scanned:
            raise SystemExit(f"FAIL: required scoring/safety/package token missing {token}")

    print("PASS: SHS System Orchestrator V1 validation OK.")


if __name__ == "__main__":
    main()
