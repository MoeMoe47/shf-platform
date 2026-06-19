#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "docs/BATCH_IMPORT_LAYER_V1.md",
    "docs/BATCH_IMPORT_LAYER_V1.json",
    "services/shf-agent-fabric/services/batch_import_service.py",
    "services/shf-agent-fabric/routers/batch_import_routes.py",
    "services/shf-agent-fabric/tests/test_batch_import_routes.py",
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
        if "### Batch/Import" not in registry:
            failures.append("MASTER_LAYER_REGISTRY.md missing structured Batch/Import entry")
        block = registry.split("### Batch/Import", 1)[1].split("\n### ", 1)[0] if "### Batch/Import" in registry else ""
        if "Formalized V1" not in block:
            failures.append("MASTER_LAYER_REGISTRY.md missing Batch/Import Formalized V1 enforcement status")
        for text in ("Adapter Layer", "Source Registry", "Data Aggregator", "Data Normalization", "write production records"):
            if text not in block:
                failures.append(f"MASTER_LAYER_REGISTRY.md Batch/Import entry missing boundary/dependency text: {text}")
    else:
        failures.append("missing docs/MASTER_LAYER_REGISTRY.md")

    guardrails_path = ROOT / "docs" / "TRUTH_SPINE_GUARDRAILS.md"
    if guardrails_path.exists():
        guardrails = guardrails_path.read_text(encoding="utf-8")
        if "Batch / Import" not in guardrails or "may not write production records in V1" not in guardrails:
            failures.append("TRUTH_SPINE_GUARDRAILS.md missing Batch / Import boundary")
    else:
        failures.append("missing docs/TRUTH_SPINE_GUARDRAILS.md")

    routes_path = "services/shf-agent-fabric/routers/batch_import_routes.py"
    if (ROOT / routes_path).exists():
        routes = _read(routes_path)
        if 'prefix="/batch-import"' not in routes:
            failures.append("batch_import_routes.py missing /batch-import prefix")
        for route in REQUIRED_ROUTES:
            if route not in routes:
                failures.append(f"batch_import_routes.py missing route: {route}")

    main_path = "services/shf-agent-fabric/main.py"
    if (ROOT / main_path).exists():
        main_py = _read(main_path)
        if "batch_import_router" not in main_py:
            failures.append("main.py missing batch_import_router import")
        if "include_router(batch_import_router)" not in main_py:
            failures.append("main.py missing batch_import_router mount")

    reports_path = "services/shf-agent-fabric/routers/reports_routes.py"
    if (ROOT / reports_path).exists():
        reports = _read(reports_path)
        if "batch_import" not in reports:
            failures.append("reports_routes.py missing batch_import summary reference")

    watchtower_path = "services/shf-agent-fabric/routers/watchtower_routes.py"
    if (ROOT / watchtower_path).exists():
        watchtower = _read(watchtower_path)
        if "batch_import" not in watchtower:
            failures.append("watchtower_routes.py missing batch_import coverage reference")

    package_path = ROOT / "package.json"
    if package_path.exists():
        package = json.loads(package_path.read_text(encoding="utf-8"))
        scripts = package.get("scripts", {})
        if "check:batch-import" not in scripts:
            failures.append("package.json missing check:batch-import")
        if "check:batch-import" not in scripts.get("check:governance", ""):
            failures.append("package.json check:governance does not include check:batch-import")

    service_path = "services/shf-agent-fabric/services/batch_import_service.py"
    if (ROOT / service_path).exists():
        service = _read(service_path).lower()
        forbidden = [
            "batch import verifies truth",
            "batch import overrides truth spine",
            "batch import overrides oracle",
            "batch import mutates shf impact data",
            "batch import directly publishes",
            "batch import directly marks public_approved",
            "batch import replaces adapter layer",
            "batch import replaces source registry",
            "batch import replaces data aggregator",
            "batch import performs final normalization",
            "batch import writes production records",
        ]
        for phrase in forbidden:
            if phrase in service:
                failures.append(f"batch_import_service.py contains forbidden authority phrase: {phrase}")

    if failures:
        print("FAIL: Batch / Import Layer checks failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("PASS: Batch / Import Layer V1 boundary, routes, docs, and governance checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
