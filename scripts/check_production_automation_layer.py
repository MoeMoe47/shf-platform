#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "docs/PRODUCTION_AUTOMATION_LAYER_V1.md",
    "docs/PRODUCTION_AUTOMATION_LAYER_V1.json",
    "services/shf-agent-fabric/services/production_automation_service.py",
    "services/shf-agent-fabric/routers/production_automation_routes.py",
    "services/shf-agent-fabric/tests/test_production_automation_routes.py",
]

REQUIRED_ROUTES = [
    "/health",
    "/schema",
    "/summary",
    "/evaluate",
    "/batch-evaluate",
    "/readiness",
]


def _read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def main() -> int:
    failures: list[str] = []

    for rel_path in REQUIRED_FILES:
        if not (ROOT / rel_path).exists():
            failures.append(f"missing required file: {rel_path}")

    registry_path = ROOT / "docs" / "MASTER_LAYER_REGISTRY.md"
    if registry_path.exists():
        registry = registry_path.read_text(encoding="utf-8")
        if "### Production Automation" not in registry:
            failures.append("MASTER_LAYER_REGISTRY.md missing structured Production Automation entry")
        block = registry.split("### Production Automation", 1)[1].split("\n### ", 1)[0] if "### Production Automation" in registry else ""
        if "Formalized V1" not in block:
            failures.append("MASTER_LAYER_REGISTRY.md missing Production Automation Formalized V1 enforcement status")
        for text in ("execute automation in V1", "Event/Webhook", "Notification / Alert", "Policy Engine", "Readiness Gate", "Audit & Verification"):
            if text not in block:
                failures.append(f"MASTER_LAYER_REGISTRY.md Production Automation entry missing boundary/dependency text: {text}")
    else:
        failures.append("missing docs/MASTER_LAYER_REGISTRY.md")

    guardrails_path = ROOT / "docs" / "TRUTH_SPINE_GUARDRAILS.md"
    if guardrails_path.exists():
        guardrails = guardrails_path.read_text(encoding="utf-8")
        if "Production Automation" not in guardrails or "may not execute automation in V1" not in guardrails:
            failures.append("TRUTH_SPINE_GUARDRAILS.md missing Production Automation boundary")
    else:
        failures.append("missing docs/TRUTH_SPINE_GUARDRAILS.md")

    routes_path = "services/shf-agent-fabric/routers/production_automation_routes.py"
    if (ROOT / routes_path).exists():
        routes = _read(routes_path)
        if 'prefix="/production-automation"' not in routes:
            failures.append("production_automation_routes.py missing /production-automation prefix")
        for route in REQUIRED_ROUTES:
            if route not in routes:
                failures.append(f"production_automation_routes.py missing route: {route}")

    main_path = "services/shf-agent-fabric/main.py"
    if (ROOT / main_path).exists():
        main_py = _read(main_path)
        if "production_automation_router" not in main_py:
            failures.append("main.py missing production_automation_router import")
        if "include_router(production_automation_router)" not in main_py:
            failures.append("main.py missing production_automation_router mount")

    reports_path = "services/shf-agent-fabric/routers/reports_routes.py"
    if (ROOT / reports_path).exists():
        reports = _read(reports_path)
        if "production_automation" not in reports:
            failures.append("reports_routes.py missing production_automation summary reference")

    watchtower_path = "services/shf-agent-fabric/routers/watchtower_routes.py"
    if (ROOT / watchtower_path).exists():
        watchtower = _read(watchtower_path)
        if "production_automation" not in watchtower:
            failures.append("watchtower_routes.py missing production_automation coverage reference")

    package_path = ROOT / "package.json"
    if package_path.exists():
        package = json.loads(package_path.read_text(encoding="utf-8"))
        scripts = package.get("scripts", {})
        if "check:production-automation" not in scripts:
            failures.append("package.json missing check:production-automation")
        if "check:production-automation" not in scripts.get("check:governance", ""):
            failures.append("package.json check:governance does not include check:production-automation")

    service_path = "services/shf-agent-fabric/services/production_automation_service.py"
    if (ROOT / service_path).exists():
        service = _read(service_path).lower()
        forbidden = [
            "production automation verifies truth",
            "production automation overrides truth spine",
            "production automation overrides oracle",
            "production automation mutates shf impact data",
            "production automation directly publishes",
            "production automation directly marks public_approved",
            "production automation sends webhooks",
            "production automation sends notifications",
            "production automation executes automation",
            "production automation writes production records",
        ]
        for phrase in forbidden:
            if phrase in service:
                failures.append(f"production_automation_service.py contains forbidden authority phrase: {phrase}")

    if failures:
        print("FAIL: Production Automation Layer checks failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("PASS: Production Automation Layer V1 boundary, routes, docs, and governance checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
