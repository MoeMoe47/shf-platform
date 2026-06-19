#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "docs/ADAPTER_LAYER_V1.md",
    "docs/ADAPTER_LAYER_V1.json",
    "services/shf-agent-fabric/services/adapter_layer_service.py",
    "services/shf-agent-fabric/routers/adapter_layer_routes.py",
    "services/shf-agent-fabric/tests/test_adapter_layer_routes.py",
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
        if "### Adapter Layer" not in registry:
            failures.append("MASTER_LAYER_REGISTRY.md missing structured Adapter Layer entry")
        block = registry.split("### Adapter Layer", 1)[1].split("\n### ", 1)[0] if "### Adapter Layer" in registry else ""
        if "Formalized V1" not in block:
            failures.append("MASTER_LAYER_REGISTRY.md missing Adapter Layer Formalized V1 enforcement status")
        for text in ("Source Registry", "Data Aggregator", "Data Normalization", "API Gateway", "Event/Webhook"):
            if text not in block:
                failures.append(f"MASTER_LAYER_REGISTRY.md Adapter Layer entry missing boundary/dependency text: {text}")
    else:
        failures.append("missing docs/MASTER_LAYER_REGISTRY.md")

    guardrails_path = ROOT / "docs" / "TRUTH_SPINE_GUARDRAILS.md"
    if guardrails_path.exists():
        guardrails = guardrails_path.read_text(encoding="utf-8")
        if "Adapter Layer" not in guardrails or "may not perform final normalization" not in guardrails:
            failures.append("TRUTH_SPINE_GUARDRAILS.md missing Adapter Layer boundary")
    else:
        failures.append("missing docs/TRUTH_SPINE_GUARDRAILS.md")

    routes_path = "services/shf-agent-fabric/routers/adapter_layer_routes.py"
    if (ROOT / routes_path).exists():
        routes = _read(routes_path)
        if 'prefix="/adapter-layer"' not in routes:
            failures.append("adapter_layer_routes.py missing /adapter-layer prefix")
        for route in REQUIRED_ROUTES:
            if route not in routes:
                failures.append(f"adapter_layer_routes.py missing route: {route}")

    main_path = "services/shf-agent-fabric/main.py"
    if (ROOT / main_path).exists():
        main_py = _read(main_path)
        if "adapter_layer_router" not in main_py:
            failures.append("main.py missing adapter_layer_router import")
        if "include_router(adapter_layer_router)" not in main_py:
            failures.append("main.py missing adapter_layer_router mount")

    reports_path = "services/shf-agent-fabric/routers/reports_routes.py"
    if (ROOT / reports_path).exists():
        reports = _read(reports_path)
        if "adapter_layer" not in reports:
            failures.append("reports_routes.py missing adapter_layer summary reference")

    watchtower_path = "services/shf-agent-fabric/routers/watchtower_routes.py"
    if (ROOT / watchtower_path).exists():
        watchtower = _read(watchtower_path)
        if "adapter_layer" not in watchtower:
            failures.append("watchtower_routes.py missing adapter_layer coverage reference")

    package_path = ROOT / "package.json"
    if package_path.exists():
        package = json.loads(package_path.read_text(encoding="utf-8"))
        scripts = package.get("scripts", {})
        if "check:adapter-layer" not in scripts:
            failures.append("package.json missing check:adapter-layer")
        if "check:adapter-layer" not in scripts.get("check:governance", ""):
            failures.append("package.json check:governance does not include check:adapter-layer")

    service_path = "services/shf-agent-fabric/services/adapter_layer_service.py"
    if (ROOT / service_path).exists():
        service = _read(service_path).lower()
        forbidden = [
            "adapter layer verifies truth",
            "adapter layer overrides truth spine",
            "adapter layer overrides oracle",
            "adapter layer mutates shf impact data",
            "adapter layer directly publishes",
            "adapter layer directly marks public_approved",
            "adapter layer replaces source registry",
            "adapter layer replaces data aggregator",
            "adapter layer performs final normalization",
            "adapter layer calls external systems",
        ]
        for phrase in forbidden:
            if phrase in service:
                failures.append(f"adapter_layer_service.py contains forbidden authority phrase: {phrase}")

    if failures:
        print("FAIL: Adapter Layer checks failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("PASS: Adapter Layer V1 boundary, routes, docs, and governance checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
