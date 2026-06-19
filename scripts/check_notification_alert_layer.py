#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "docs/NOTIFICATION_ALERT_LAYER_V1.md",
    "docs/NOTIFICATION_ALERT_LAYER_V1.json",
    "services/shf-agent-fabric/services/notification_alert_service.py",
    "services/shf-agent-fabric/routers/notification_alert_routes.py",
    "services/shf-agent-fabric/tests/test_notification_alert_routes.py",
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
        if "### Notification / Alert" not in registry:
            failures.append("MASTER_LAYER_REGISTRY.md missing structured Notification / Alert entry")
        block = registry.split("### Notification / Alert", 1)[1].split("\n### ", 1)[0] if "### Notification / Alert" in registry else ""
        if "Formalized V1" not in block:
            failures.append("MASTER_LAYER_REGISTRY.md missing Notification / Alert Formalized V1 enforcement status")
        for text in ("send notifications in V1", "Event/Webhook", "Production Automation", "Policy Engine", "Watchtower", "Reports"):
            if text not in block:
                failures.append(f"MASTER_LAYER_REGISTRY.md Notification / Alert entry missing boundary/dependency text: {text}")
    else:
        failures.append("missing docs/MASTER_LAYER_REGISTRY.md")

    guardrails_path = ROOT / "docs" / "TRUTH_SPINE_GUARDRAILS.md"
    if guardrails_path.exists():
        guardrails = guardrails_path.read_text(encoding="utf-8")
        if "Notification / Alert" not in guardrails or "may not send notifications in V1" not in guardrails:
            failures.append("TRUTH_SPINE_GUARDRAILS.md missing Notification / Alert boundary")
    else:
        failures.append("missing docs/TRUTH_SPINE_GUARDRAILS.md")

    routes_path = "services/shf-agent-fabric/routers/notification_alert_routes.py"
    if (ROOT / routes_path).exists():
        routes = _read(routes_path)
        if 'prefix="/notification-alert"' not in routes:
            failures.append("notification_alert_routes.py missing /notification-alert prefix")
        for route in REQUIRED_ROUTES:
            if route not in routes:
                failures.append(f"notification_alert_routes.py missing route: {route}")

    main_path = "services/shf-agent-fabric/main.py"
    if (ROOT / main_path).exists():
        main_py = _read(main_path)
        if "notification_alert_router" not in main_py:
            failures.append("main.py missing notification_alert_router import")
        if "include_router(notification_alert_router)" not in main_py:
            failures.append("main.py missing notification_alert_router mount")

    reports_path = "services/shf-agent-fabric/routers/reports_routes.py"
    if (ROOT / reports_path).exists():
        reports = _read(reports_path)
        if "notification_alert" not in reports:
            failures.append("reports_routes.py missing notification_alert summary reference")

    watchtower_path = "services/shf-agent-fabric/routers/watchtower_routes.py"
    if (ROOT / watchtower_path).exists():
        watchtower = _read(watchtower_path)
        if "notification_alert" not in watchtower:
            failures.append("watchtower_routes.py missing notification_alert coverage reference")

    package_path = ROOT / "package.json"
    if package_path.exists():
        package = json.loads(package_path.read_text(encoding="utf-8"))
        scripts = package.get("scripts", {})
        if "check:notification-alert" not in scripts:
            failures.append("package.json missing check:notification-alert")
        if "check:notification-alert" not in scripts.get("check:governance", ""):
            failures.append("package.json check:governance does not include check:notification-alert")

    service_path = "services/shf-agent-fabric/services/notification_alert_service.py"
    if (ROOT / service_path).exists():
        service = _read(service_path).lower()
        forbidden = [
            "notification alert verifies truth",
            "notification alert overrides truth spine",
            "notification alert overrides oracle",
            "notification alert mutates shf impact data",
            "notification alert directly publishes",
            "notification alert directly marks public_approved",
            "notification alert sends notifications",
            "notification alert sends email",
            "notification alert sends sms",
            "notification alert sends webhooks",
            "notification alert writes production records",
        ]
        for phrase in forbidden:
            if phrase in service:
                failures.append(f"notification_alert_service.py contains forbidden authority phrase: {phrase}")

    if failures:
        print("FAIL: Notification / Alert Layer checks failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("PASS: Notification / Alert Layer V1 boundary, routes, docs, and governance checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
