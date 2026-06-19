#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "docs/VERIFIED_AGGREGATION_LAYER_V1.md",
    "docs/VERIFIED_AGGREGATION_LAYER_V1.json",
    "services/shf-agent-fabric/services/verified_aggregation_service.py",
    "services/shf-agent-fabric/routers/verified_aggregation_routes.py",
    "services/shf-agent-fabric/tests/test_verified_aggregation_routes.py",
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
        if "### Verified Aggregation" not in registry:
            failures.append("MASTER_LAYER_REGISTRY.md missing structured Verified Aggregation entry")
        block = registry.split("### Verified Aggregation", 1)[1].split("\n### ", 1)[0] if "### Verified Aggregation" in registry else ""
        if "Enforcement Status: Formalized V1" not in block:
            failures.append("MASTER_LAYER_REGISTRY.md missing Verified Aggregation Formalized V1 enforcement status")
        for phrase in ("Data Aggregator", "Data Normalization", "Truth Spine", "Oracle", "Reports", "Data Approval Gateway", "SHF Impact Data Spine"):
            if phrase not in block:
                failures.append(f"MASTER_LAYER_REGISTRY.md Verified Aggregation block missing boundary reference: {phrase}")
    else:
        failures.append("missing docs/MASTER_LAYER_REGISTRY.md")

    guardrails_path = ROOT / "docs" / "TRUTH_SPINE_GUARDRAILS.md"
    if guardrails_path.exists():
        guardrails = guardrails_path.read_text(encoding="utf-8")
        if "Verified Aggregation" not in guardrails or "may not verify truth" not in guardrails:
            failures.append("TRUTH_SPINE_GUARDRAILS.md missing Verified Aggregation boundary")
    else:
        failures.append("missing docs/TRUTH_SPINE_GUARDRAILS.md")

    routes_path = "services/shf-agent-fabric/routers/verified_aggregation_routes.py"
    if (ROOT / routes_path).exists():
        routes = _read(routes_path)
        if 'prefix="/verified-aggregation"' not in routes:
            failures.append("verified_aggregation_routes.py missing /verified-aggregation prefix")
        for route in REQUIRED_ROUTES:
            if route not in routes:
                failures.append(f"verified_aggregation_routes.py missing route: {route}")

    main_path = "services/shf-agent-fabric/main.py"
    if (ROOT / main_path).exists():
        main_py = _read(main_path)
        if "verified_aggregation_router" not in main_py:
            failures.append("main.py missing verified_aggregation_router import")
        if "include_router(verified_aggregation_router)" not in main_py:
            failures.append("main.py missing verified_aggregation_router mount")

    reports_path = "services/shf-agent-fabric/routers/reports_routes.py"
    if (ROOT / reports_path).exists():
        reports = _read(reports_path)
        if "verified_aggregation" not in reports:
            failures.append("reports_routes.py missing verified_aggregation summary reference")

    watchtower_path = "services/shf-agent-fabric/routers/watchtower_routes.py"
    if (ROOT / watchtower_path).exists():
        watchtower = _read(watchtower_path)
        if "verified_aggregation" not in watchtower:
            failures.append("watchtower_routes.py missing verified_aggregation coverage reference")

    package_path = ROOT / "package.json"
    if package_path.exists():
        package = json.loads(package_path.read_text(encoding="utf-8"))
        scripts = package.get("scripts", {})
        if "check:verified-aggregation" not in scripts:
            failures.append("package.json missing check:verified-aggregation")
        if "check:verified-aggregation" not in scripts.get("check:governance", ""):
            failures.append("package.json check:governance does not include check:verified-aggregation")

    service_path = "services/shf-agent-fabric/services/verified_aggregation_service.py"
    if (ROOT / service_path).exists():
        service = _read(service_path).lower()
        forbidden = [
            "verified aggregation verifies truth",
            "verified aggregation overrides truth spine",
            "verified aggregation overrides oracle",
            "verified aggregation mutates shf impact data",
            "verified aggregation directly publishes",
            "verified aggregation directly marks public_approved",
            "verified aggregation replaces reports",
            "verified aggregation replaces data aggregator",
            "verified aggregation writes production records",
        ]
        for phrase in forbidden:
            if phrase in service:
                failures.append(f"verified_aggregation_service.py contains forbidden authority phrase: {phrase}")

    if failures:
        print("FAIL: Verified Aggregation Layer checks failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("PASS: Verified Aggregation Layer V1 boundary, routes, docs, and governance checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
