#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "docs/DATA_VERIFICATION_LAYER_V1.md",
    "docs/DATA_VERIFICATION_LAYER_V1.json",
    "services/shf-agent-fabric/services/data_verification_service.py",
    "services/shf-agent-fabric/routers/data_verification_routes.py",
    "services/shf-agent-fabric/tests/test_data_verification_routes.py",
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
        if "| Data Verification Layer |" not in registry:
            failures.append("MASTER_LAYER_REGISTRY.md missing Official Layers row for Data Verification Layer")
        if "### Data Verification Layer" not in registry:
            failures.append("MASTER_LAYER_REGISTRY.md missing structured Data Verification Layer entry")
    else:
        failures.append("missing docs/MASTER_LAYER_REGISTRY.md")

    guardrails_path = ROOT / "docs" / "TRUTH_SPINE_GUARDRAILS.md"
    if guardrails_path.exists():
        guardrails = guardrails_path.read_text(encoding="utf-8")
        if "Data Verification" not in guardrails or "may not verify truth" not in guardrails:
            failures.append("TRUTH_SPINE_GUARDRAILS.md missing Data Verification boundary")
    else:
        failures.append("missing docs/TRUTH_SPINE_GUARDRAILS.md")

    if (ROOT / "services/shf-agent-fabric/routers/data_verification_routes.py").exists():
        routes = _read("services/shf-agent-fabric/routers/data_verification_routes.py")
        if 'prefix="/data-verification"' not in routes:
            failures.append("data_verification_routes.py missing /data-verification prefix")
        for route in REQUIRED_ROUTES:
            if route not in routes:
                failures.append(f"data_verification_routes.py missing route: {route}")

    if (ROOT / "services/shf-agent-fabric/main.py").exists():
        main_py = _read("services/shf-agent-fabric/main.py")
        if "data_verification_router" not in main_py:
            failures.append("main.py missing data_verification_router import")
        if "include_router(data_verification_router)" not in main_py:
            failures.append("main.py missing data_verification_router mount")

    package_path = ROOT / "package.json"
    if package_path.exists():
        package = json.loads(package_path.read_text(encoding="utf-8"))
        scripts = package.get("scripts", {})
        if "check:data-verification" not in scripts:
            failures.append("package.json missing check:data-verification")
        if "check:data-verification" not in scripts.get("check:governance", ""):
            failures.append("package.json check:governance does not include check:data-verification")

    if (ROOT / "services/shf-agent-fabric/services/data_verification_service.py").exists():
        service = _read("services/shf-agent-fabric/services/data_verification_service.py").lower()
        forbidden = [
            "data verification verifies truth",
            "data verification public approves",
            "data verification overrides truth spine",
            "verification_status = \"verified\"",
            "public_approved = true",
        ]
        for phrase in forbidden:
            if phrase in service:
                failures.append(f"data_verification_service.py contains forbidden authority phrase: {phrase}")

    if failures:
        print("FAIL: Data Verification Layer checks failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("PASS: Data Verification Layer V1 boundary, routes, docs, and governance checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
