#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "docs/PUBLIC_APPROVAL_LAYER_V1.md",
    "docs/PUBLIC_APPROVAL_LAYER_V1.json",
    "services/shf-agent-fabric/services/public_approval_service.py",
    "services/shf-agent-fabric/routers/public_approval_routes.py",
    "services/shf-agent-fabric/tests/test_public_approval_routes.py",
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
        if "### Public Approval" not in registry:
            failures.append("MASTER_LAYER_REGISTRY.md missing structured Public Approval entry")
        public_block = registry.split("### Public Approval", 1)[1].split("\n### ", 1)[0] if "### Public Approval" in registry else ""
        if "Enforcement Status: Formalized V1" not in public_block:
            failures.append("MASTER_LAYER_REGISTRY.md missing Public Approval Formalized V1 enforcement status")
    else:
        failures.append("missing docs/MASTER_LAYER_REGISTRY.md")

    guardrails_path = ROOT / "docs" / "TRUTH_SPINE_GUARDRAILS.md"
    if guardrails_path.exists():
        guardrails = guardrails_path.read_text(encoding="utf-8")
        if "Public Approval" not in guardrails or "may not verify truth" not in guardrails:
            failures.append("TRUTH_SPINE_GUARDRAILS.md missing Public Approval boundary")
    else:
        failures.append("missing docs/TRUTH_SPINE_GUARDRAILS.md")

    routes_path = "services/shf-agent-fabric/routers/public_approval_routes.py"
    if (ROOT / routes_path).exists():
        routes = _read(routes_path)
        if 'prefix="/public-approval"' not in routes:
            failures.append("public_approval_routes.py missing /public-approval prefix")
        for route in REQUIRED_ROUTES:
            if route not in routes:
                failures.append(f"public_approval_routes.py missing route: {route}")

    main_path = "services/shf-agent-fabric/main.py"
    if (ROOT / main_path).exists():
        main_py = _read(main_path)
        if "public_approval_router" not in main_py:
            failures.append("main.py missing public_approval_router import")
        if "include_router(public_approval_router)" not in main_py:
            failures.append("main.py missing public_approval_router mount")

    reports_path = "services/shf-agent-fabric/routers/reports_routes.py"
    if (ROOT / reports_path).exists():
        reports = _read(reports_path)
        if "public_approval" not in reports:
            failures.append("reports_routes.py missing public_approval summary reference")

    watchtower_path = "services/shf-agent-fabric/routers/watchtower_routes.py"
    if (ROOT / watchtower_path).exists():
        watchtower = _read(watchtower_path)
        if "public_approval" not in watchtower:
            failures.append("watchtower_routes.py missing public_approval coverage reference")

    package_path = ROOT / "package.json"
    if package_path.exists():
        package = json.loads(package_path.read_text(encoding="utf-8"))
        scripts = package.get("scripts", {})
        if "check:public-approval" not in scripts:
            failures.append("package.json missing check:public-approval")
        if "check:public-approval" not in scripts.get("check:governance", ""):
            failures.append("package.json check:governance does not include check:public-approval")

    service_path = "services/shf-agent-fabric/services/public_approval_service.py"
    if (ROOT / service_path).exists():
        service = _read(service_path).lower()
        forbidden = [
            "public approval verifies truth",
            "public approval overrides truth spine",
            "public approval overrides oracle",
            "public approval mutates shf impact data",
            "public approval directly publishes",
            "public approval directly marks public_approved",
        ]
        for phrase in forbidden:
            if phrase in service:
                failures.append(f"public_approval_service.py contains forbidden authority phrase: {phrase}")

    if failures:
        print("FAIL: Public Approval Layer checks failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("PASS: Public Approval Layer V1 boundary, routes, docs, and governance checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
