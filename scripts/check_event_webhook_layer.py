#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "docs/EVENT_WEBHOOK_LAYER_V1.md",
    "docs/EVENT_WEBHOOK_LAYER_V1.json",
    "services/shf-agent-fabric/services/event_webhook_service.py",
    "services/shf-agent-fabric/routers/event_webhook_routes.py",
    "services/shf-agent-fabric/tests/test_event_webhook_routes.py",
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
        if "### Event/Webhook" not in registry:
            failures.append("MASTER_LAYER_REGISTRY.md missing structured Event/Webhook entry")
        block = registry.split("### Event/Webhook", 1)[1].split("\n### ", 1)[0] if "### Event/Webhook" in registry else ""
        if "Formalized V1" not in block:
            failures.append("MASTER_LAYER_REGISTRY.md missing Event/Webhook Formalized V1 enforcement status")
        for text in ("send external webhooks", "Policy Engine", "Watchtower", "Audit & Verification"):
            if text not in block:
                failures.append(f"MASTER_LAYER_REGISTRY.md Event/Webhook entry missing boundary/dependency text: {text}")
    else:
        failures.append("missing docs/MASTER_LAYER_REGISTRY.md")

    guardrails_path = ROOT / "docs" / "TRUTH_SPINE_GUARDRAILS.md"
    if guardrails_path.exists():
        guardrails = guardrails_path.read_text(encoding="utf-8")
        if "Event / Webhook" not in guardrails or "may not send external webhooks in V1" not in guardrails:
            failures.append("TRUTH_SPINE_GUARDRAILS.md missing Event / Webhook boundary")
    else:
        failures.append("missing docs/TRUTH_SPINE_GUARDRAILS.md")

    routes_path = "services/shf-agent-fabric/routers/event_webhook_routes.py"
    if (ROOT / routes_path).exists():
        routes = _read(routes_path)
        if 'prefix="/event-webhook"' not in routes:
            failures.append("event_webhook_routes.py missing /event-webhook prefix")
        for route in REQUIRED_ROUTES:
            if route not in routes:
                failures.append(f"event_webhook_routes.py missing route: {route}")

    main_path = "services/shf-agent-fabric/main.py"
    if (ROOT / main_path).exists():
        main_py = _read(main_path)
        if "event_webhook_router" not in main_py:
            failures.append("main.py missing event_webhook_router import")
        if "include_router(event_webhook_router)" not in main_py:
            failures.append("main.py missing event_webhook_router mount")

    reports_path = "services/shf-agent-fabric/routers/reports_routes.py"
    if (ROOT / reports_path).exists():
        reports = _read(reports_path)
        if "event_webhook" not in reports:
            failures.append("reports_routes.py missing event_webhook summary reference")

    watchtower_path = "services/shf-agent-fabric/routers/watchtower_routes.py"
    if (ROOT / watchtower_path).exists():
        watchtower = _read(watchtower_path)
        if "event_webhook" not in watchtower:
            failures.append("watchtower_routes.py missing event_webhook coverage reference")

    package_path = ROOT / "package.json"
    if package_path.exists():
        package = json.loads(package_path.read_text(encoding="utf-8"))
        scripts = package.get("scripts", {})
        if "check:event-webhook" not in scripts:
            failures.append("package.json missing check:event-webhook")
        if "check:event-webhook" not in scripts.get("check:governance", ""):
            failures.append("package.json check:governance does not include check:event-webhook")

    service_path = "services/shf-agent-fabric/services/event_webhook_service.py"
    if (ROOT / service_path).exists():
        service = _read(service_path).lower()
        forbidden = [
            "event webhook verifies truth",
            "event webhook overrides truth spine",
            "event webhook overrides oracle",
            "event webhook mutates shf impact data",
            "event webhook directly publishes",
            "event webhook directly marks public_approved",
            "event webhook sends external webhooks",
            "event webhook replaces watchtower",
        ]
        for phrase in forbidden:
            if phrase in service:
                failures.append(f"event_webhook_service.py contains forbidden authority phrase: {phrase}")

    if failures:
        print("FAIL: Event / Webhook Layer checks failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("PASS: Event / Webhook Layer V1 boundary, routes, docs, and governance checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
