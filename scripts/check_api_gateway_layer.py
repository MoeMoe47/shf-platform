#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "docs/API_GATEWAY_LAYER_V1.md",
    "docs/API_GATEWAY_LAYER_V1.json",
    "services/shf-agent-fabric/services/api_gateway_service.py",
    "services/shf-agent-fabric/routers/api_gateway_routes.py",
    "services/shf-agent-fabric/tests/test_api_gateway_routes.py",
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
        if "### API Gateway" not in registry:
            failures.append("MASTER_LAYER_REGISTRY.md missing structured API Gateway entry")
        block = registry.split("### API Gateway", 1)[1].split("\n### ", 1)[0] if "### API Gateway" in registry else ""
        if "Formalized V1" not in block:
            failures.append("MASTER_LAYER_REGISTRY.md missing API Gateway Formalized V1 enforcement status")
        for text in ("forward requests in V1", "Identity / Access Control", "Policy Engine", "AI Guardrails"):
            if text not in block:
                failures.append(f"MASTER_LAYER_REGISTRY.md API Gateway entry missing boundary/dependency text: {text}")
    else:
        failures.append("missing docs/MASTER_LAYER_REGISTRY.md")

    guardrails_path = ROOT / "docs" / "TRUTH_SPINE_GUARDRAILS.md"
    if guardrails_path.exists():
        guardrails = guardrails_path.read_text(encoding="utf-8")
        if "API Gateway" not in guardrails or "may not forward requests in V1" not in guardrails:
            failures.append("TRUTH_SPINE_GUARDRAILS.md missing API Gateway boundary")
    else:
        failures.append("missing docs/TRUTH_SPINE_GUARDRAILS.md")

    routes_path = "services/shf-agent-fabric/routers/api_gateway_routes.py"
    if (ROOT / routes_path).exists():
        routes = _read(routes_path)
        if 'prefix="/api-gateway"' not in routes:
            failures.append("api_gateway_routes.py missing /api-gateway prefix")
        for route in REQUIRED_ROUTES:
            if route not in routes:
                failures.append(f"api_gateway_routes.py missing route: {route}")

    main_path = "services/shf-agent-fabric/main.py"
    if (ROOT / main_path).exists():
        main_py = _read(main_path)
        if "api_gateway_router" not in main_py:
            failures.append("main.py missing api_gateway_router import")
        if "include_router(api_gateway_router)" not in main_py:
            failures.append("main.py missing api_gateway_router mount")

    reports_path = "services/shf-agent-fabric/routers/reports_routes.py"
    if (ROOT / reports_path).exists():
        reports = _read(reports_path)
        if "api_gateway" not in reports:
            failures.append("reports_routes.py missing api_gateway summary reference")

    watchtower_path = "services/shf-agent-fabric/routers/watchtower_routes.py"
    if (ROOT / watchtower_path).exists():
        watchtower = _read(watchtower_path)
        if "api_gateway" not in watchtower:
            failures.append("watchtower_routes.py missing api_gateway coverage reference")

    package_path = ROOT / "package.json"
    if package_path.exists():
        package = json.loads(package_path.read_text(encoding="utf-8"))
        scripts = package.get("scripts", {})
        if "check:api-gateway" not in scripts:
            failures.append("package.json missing check:api-gateway")
        if "check:api-gateway" not in scripts.get("check:governance", ""):
            failures.append("package.json check:governance does not include check:api-gateway")

    service_path = "services/shf-agent-fabric/services/api_gateway_service.py"
    if (ROOT / service_path).exists():
        service = _read(service_path).lower()
        forbidden = [
            "api gateway verifies truth",
            "api gateway overrides truth spine",
            "api gateway overrides oracle",
            "api gateway mutates shf impact data",
            "api gateway directly publishes",
            "api gateway directly marks public_approved",
            "api gateway replaces identity",
            "api gateway forwards requests in v1",
        ]
        for phrase in forbidden:
            if phrase in service:
                failures.append(f"api_gateway_service.py contains forbidden authority phrase: {phrase}")

    if failures:
        print("FAIL: API Gateway Layer checks failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("PASS: API Gateway Layer V1 boundary, routes, docs, and governance checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
