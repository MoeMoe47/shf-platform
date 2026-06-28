#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "docs/PRODUCTION_AUTOMATION_V2.md",
    "docs/PRODUCTION_AUTOMATION_V2.json",
    "src/data/agents/productionAutomationV2Recipes.js",
    "src/data/agents/productionAutomationV2Runs.js",
    "src/data/agents/productionAutomationV2Storage.js",
    "src/data/agents/productionAutomationV2Safety.js",
    "src/data/agents/productionAutomationV2Metrics.js",
    "src/pages/admin/agents/components/ProductionAutomationV2Panel.jsx",
    "src/pages/admin/agents/components/ProductionAutomationRunDetail.jsx",
    "src/pages/admin/agents/components/ProductionAutomationRecipePanel.jsx",
    "src/pages/admin/agents/components/ProductionAutomationSafetyPanel.jsx",
]

RECIPE_TYPES = [
    "sales_to_delivery",
    "report_readiness",
    "qa_delivery",
    "clientops_review",
    "launch_handoff",
    "daily_governance",
    "private_beta_demo",
]

REQUIRED_FALSE_TOKENS = [
    "execution_enabled_v2: false",
    "external_delivery_enabled: false",
    "production_mutation_enabled: false",
    "public_publish_enabled: false",
    "warehouse_write_enabled: false",
    "auth_mutation_enabled: false",
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
    "execution_enabled_v2: true",
    "external_delivery_enabled: true",
    "production_mutation_enabled: true",
    "public_publish_enabled: true",
    "warehouse_write_enabled: true",
    "auth_mutation_enabled: true",
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
]

FORBIDDEN_FRONTEND_TOKENS = [
    "shfImpactData",
    "publishReport(",
    "sendWebhook(",
    "sendNotification(",
    "writeWarehouse",
    "modifyAuth(",
    "executeShell(",
    "callExternalApi(",
]

FORBIDDEN_BACKEND_PATTERNS = [
    '@router.post("/run"',
    "@router.post('/run'",
    '@router.post("/execute"',
    "@router.post('/execute'",
    "/production-automation/run",
    "/production-automation/execute",
    "production_automation_v2_execute",
]


def read(rel):
    path = ROOT / rel
    if not path.exists():
        raise SystemExit(f"FAIL: missing required file {rel}")
    return path.read_text(encoding="utf-8")


def main():
    for rel in REQUIRED_FILES:
        read(rel)

    recipes = read("src/data/agents/productionAutomationV2Recipes.js")
    runs = read("src/data/agents/productionAutomationV2Runs.js")
    storage = read("src/data/agents/productionAutomationV2Storage.js")
    safety = read("src/data/agents/productionAutomationV2Safety.js")
    metrics = read("src/data/agents/productionAutomationV2Metrics.js")
    workbench = read("src/pages/admin/agents/AgentWorkbenchPage.jsx")
    panel = read("src/pages/admin/agents/components/ProductionAutomationV2Panel.jsx")
    detail = read("src/pages/admin/agents/components/ProductionAutomationRunDetail.jsx")
    recipe_panel = read("src/pages/admin/agents/components/ProductionAutomationRecipePanel.jsx")
    safety_panel = read("src/pages/admin/agents/components/ProductionAutomationSafetyPanel.jsx")
    package_json = read("package.json")
    scanned = "\n".join([recipes, runs, storage, safety, metrics, workbench, panel, detail, recipe_panel, safety_panel])

    for recipe_type in RECIPE_TYPES:
        if recipe_type not in recipes:
            raise SystemExit(f"FAIL: missing recipe type {recipe_type}")

    for token in REQUIRED_FALSE_TOKENS:
        if token not in scanned:
            raise SystemExit(f"FAIL: missing dangerous false token {token}")

    for token in FORBIDDEN_TRUE_PATTERNS:
        if token in scanned:
            raise SystemExit(f"FAIL: dangerous flag enabled: {token}")

    for token in FORBIDDEN_FRONTEND_TOKENS:
        if token in scanned:
            raise SystemExit(f"FAIL: forbidden frontend automation token present: {token}")

    for token in [
        "ProductionAutomationV2Panel",
        "ProductionAutomationRunDetail",
        "ProductionAutomationRecipePanel",
        "ProductionAutomationSafetyPanel",
        "createProductionAutomationV2RunFromRecipe",
        "applyProductionAutomationV2RunAction",
        "resetProductionAutomationV2Runs",
    ]:
        if token not in workbench and token not in storage:
            raise SystemExit(f"FAIL: Workbench/storage integration missing {token}")

    backend = "\n".join([
        read("services/shf-agent-fabric/services/production_automation_service.py"),
        read("services/shf-agent-fabric/routers/production_automation_routes.py"),
    ])
    for pattern in FORBIDDEN_BACKEND_PATTERNS:
        if pattern in backend:
            raise SystemExit(f"FAIL: forbidden backend V2 executor route present: {pattern}")

    if "src/data/shfImpactData.js" in scanned:
        raise SystemExit("FAIL: V2 frontend references SHF Impact Data Spine directly")

    if '"check:production-automation-v2": "python3 scripts/check_production_automation_v2.py"' not in package_json:
        raise SystemExit("FAIL: package.json missing check:production-automation-v2 script")

    print("PASS: Production Automation V2 validation OK.")


if __name__ == "__main__":
    main()
