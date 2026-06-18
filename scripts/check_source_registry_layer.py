#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "docs/SOURCE_REGISTRY_LAYER_V1.md",
    "docs/SOURCE_REGISTRY_LAYER_V1.json",
    "services/shf-agent-fabric/services/source_registry_service.py",
    "services/shf-agent-fabric/routers/source_registry_routes.py",
    "services/shf-agent-fabric/tests/test_source_registry_routes.py",
]

REQUIRED_ROUTES = [
    "/health",
    "/schema",
    "/summary",
    "/sources",
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
        if "| Source Registry Layer |" not in registry:
            failures.append("MASTER_LAYER_REGISTRY.md missing Official Layers row for Source Registry Layer")
        if "### Source Registry Layer" not in registry:
            failures.append("MASTER_LAYER_REGISTRY.md missing structured Source Registry Layer entry")
    else:
        failures.append("missing docs/MASTER_LAYER_REGISTRY.md")

    guardrails_path = ROOT / "docs" / "TRUTH_SPINE_GUARDRAILS.md"
    if guardrails_path.exists():
        guardrails = guardrails_path.read_text(encoding="utf-8")
        if "Source Registry" not in guardrails or "may not verify truth" not in guardrails:
            failures.append("TRUTH_SPINE_GUARDRAILS.md missing Source Registry boundary")
    else:
        failures.append("missing docs/TRUTH_SPINE_GUARDRAILS.md")

    if (ROOT / "services/shf-agent-fabric/routers/source_registry_routes.py").exists():
        routes = _read("services/shf-agent-fabric/routers/source_registry_routes.py")
        if 'prefix="/source-registry"' not in routes:
            failures.append("source_registry_routes.py missing /source-registry prefix")
        for route in REQUIRED_ROUTES:
            if route not in routes:
                failures.append(f"source_registry_routes.py missing route: {route}")

    if (ROOT / "services/shf-agent-fabric/main.py").exists():
        main_py = _read("services/shf-agent-fabric/main.py")
        if "source_registry_router" not in main_py:
            failures.append("main.py missing source_registry_router import")
        if "include_router(source_registry_router)" not in main_py:
            failures.append("main.py missing source_registry_router mount")

    package_path = ROOT / "package.json"
    if package_path.exists():
        package = json.loads(package_path.read_text(encoding="utf-8"))
        scripts = package.get("scripts", {})
        if "check:source-registry" not in scripts:
            failures.append("package.json missing check:source-registry")
        if "check:source-registry" not in scripts.get("check:governance", ""):
            failures.append("package.json check:governance does not include check:source-registry")

    if (ROOT / "services/shf-agent-fabric/services/source_registry_service.py").exists():
        service = _read("services/shf-agent-fabric/services/source_registry_service.py").lower()
        forbidden = [
            "source registry verifies truth",
            "source registry public approves",
            "source registry overrides truth spine",
            "source registry mutates shf impact data",
        ]
        for phrase in forbidden:
            if phrase in service:
                failures.append(f"source_registry_service.py contains forbidden authority phrase: {phrase}")

    if failures:
        print("FAIL: Source Registry Layer checks failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("PASS: Source Registry Layer V1 boundary, routes, docs, and governance checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
