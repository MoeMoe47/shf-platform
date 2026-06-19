#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "docs/WAREHOUSE_SYNC_LAYER_V1.md",
    "docs/WAREHOUSE_SYNC_LAYER_V1.json",
    "services/shf-agent-fabric/services/warehouse_sync_service.py",
    "services/shf-agent-fabric/routers/warehouse_sync_routes.py",
    "services/shf-agent-fabric/tests/test_warehouse_sync_routes.py",
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
        if "### Warehouse Sync" not in registry:
            failures.append("MASTER_LAYER_REGISTRY.md missing structured Warehouse Sync entry")
        block = registry.split("### Warehouse Sync", 1)[1].split("\n### ", 1)[0] if "### Warehouse Sync" in registry else ""
        if "Formalized V1" not in block:
            failures.append("MASTER_LAYER_REGISTRY.md missing Warehouse Sync Formalized V1 enforcement status")
        for text in ("write warehouse records", "Reports", "Watchtower", "Batch/Import", "Adapter Layer", "Data Approval Gateway"):
            if text not in block:
                failures.append(f"MASTER_LAYER_REGISTRY.md Warehouse Sync entry missing boundary/dependency text: {text}")
    else:
        failures.append("missing docs/MASTER_LAYER_REGISTRY.md")

    guardrails_path = ROOT / "docs" / "TRUTH_SPINE_GUARDRAILS.md"
    if guardrails_path.exists():
        guardrails = guardrails_path.read_text(encoding="utf-8")
        if "Warehouse Sync" not in guardrails or "may not write to warehouse in V1" not in guardrails:
            failures.append("TRUTH_SPINE_GUARDRAILS.md missing Warehouse Sync boundary")
    else:
        failures.append("missing docs/TRUTH_SPINE_GUARDRAILS.md")

    routes_path = "services/shf-agent-fabric/routers/warehouse_sync_routes.py"
    if (ROOT / routes_path).exists():
        routes = _read(routes_path)
        if 'prefix="/warehouse-sync"' not in routes:
            failures.append("warehouse_sync_routes.py missing /warehouse-sync prefix")
        for route in REQUIRED_ROUTES:
            if route not in routes:
                failures.append(f"warehouse_sync_routes.py missing route: {route}")

    main_path = "services/shf-agent-fabric/main.py"
    if (ROOT / main_path).exists():
        main_py = _read(main_path)
        if "warehouse_sync_router" not in main_py:
            failures.append("main.py missing warehouse_sync_router import")
        if "include_router(warehouse_sync_router)" not in main_py:
            failures.append("main.py missing warehouse_sync_router mount")

    reports_path = "services/shf-agent-fabric/routers/reports_routes.py"
    if (ROOT / reports_path).exists():
        reports = _read(reports_path)
        if "warehouse_sync" not in reports:
            failures.append("reports_routes.py missing warehouse_sync summary reference")

    watchtower_path = "services/shf-agent-fabric/routers/watchtower_routes.py"
    if (ROOT / watchtower_path).exists():
        watchtower = _read(watchtower_path)
        if "warehouse_sync" not in watchtower:
            failures.append("watchtower_routes.py missing warehouse_sync coverage reference")

    package_path = ROOT / "package.json"
    if package_path.exists():
        package = json.loads(package_path.read_text(encoding="utf-8"))
        scripts = package.get("scripts", {})
        if "check:warehouse-sync" not in scripts:
            failures.append("package.json missing check:warehouse-sync")
        if "check:warehouse-sync" not in scripts.get("check:governance", ""):
            failures.append("package.json check:governance does not include check:warehouse-sync")

    service_path = "services/shf-agent-fabric/services/warehouse_sync_service.py"
    if (ROOT / service_path).exists():
        service = _read(service_path).lower()
        forbidden = [
            "warehouse sync verifies truth",
            "warehouse sync overrides truth spine",
            "warehouse sync overrides oracle",
            "warehouse sync mutates shf impact data",
            "warehouse sync directly publishes",
            "warehouse sync directly marks public_approved",
            "warehouse sync replaces reports",
            "warehouse sync replaces watchtower",
            "warehouse sync writes warehouse",
            "warehouse sync creates exports",
        ]
        for phrase in forbidden:
            if phrase in service:
                failures.append(f"warehouse_sync_service.py contains forbidden authority phrase: {phrase}")

    if failures:
        print("FAIL: Warehouse Sync Layer checks failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("PASS: Warehouse Sync Layer V1 boundary, routes, docs, and governance checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
