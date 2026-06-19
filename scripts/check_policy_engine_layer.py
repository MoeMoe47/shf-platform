#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "docs/POLICY_ENGINE_LAYER_V1.md",
    "docs/POLICY_ENGINE_LAYER_V1.json",
    "services/shf-agent-fabric/services/policy_engine_service.py",
    "services/shf-agent-fabric/routers/policy_engine_routes.py",
    "services/shf-agent-fabric/tests/test_policy_engine_routes.py",
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
        if "### Policy Engine" not in registry:
            failures.append("MASTER_LAYER_REGISTRY.md missing structured Policy Engine entry")
        block = registry.split("### Policy Engine", 1)[1].split("\n### ", 1)[0] if "### Policy Engine" in registry else ""
        if "Enforcement Status: Formalized V1" not in block:
            failures.append("MASTER_LAYER_REGISTRY.md missing Policy Engine Formalized V1 enforcement status")
    else:
        failures.append("missing docs/MASTER_LAYER_REGISTRY.md")

    guardrails_path = ROOT / "docs" / "TRUTH_SPINE_GUARDRAILS.md"
    if guardrails_path.exists():
        guardrails = guardrails_path.read_text(encoding="utf-8")
        if "Policy Engine" not in guardrails or "may not verify truth" not in guardrails:
            failures.append("TRUTH_SPINE_GUARDRAILS.md missing Policy Engine boundary")
    else:
        failures.append("missing docs/TRUTH_SPINE_GUARDRAILS.md")

    ai_guardrails_path = ROOT / "docs" / "AI_SWARM_GUARDRAILS_V1.md"
    if ai_guardrails_path.exists():
        ai_guardrails = ai_guardrails_path.read_text(encoding="utf-8")
        if "Policy Engine Boundary" not in ai_guardrails:
            failures.append("AI_SWARM_GUARDRAILS_V1.md missing Policy Engine boundary note")

    routes_path = "services/shf-agent-fabric/routers/policy_engine_routes.py"
    if (ROOT / routes_path).exists():
        routes = _read(routes_path)
        if 'prefix="/policy-engine"' not in routes:
            failures.append("policy_engine_routes.py missing /policy-engine prefix")
        for route in REQUIRED_ROUTES:
            if route not in routes:
                failures.append(f"policy_engine_routes.py missing route: {route}")

    main_path = "services/shf-agent-fabric/main.py"
    if (ROOT / main_path).exists():
        main_py = _read(main_path)
        if "policy_engine_router" not in main_py:
            failures.append("main.py missing policy_engine_router import")
        if "include_router(policy_engine_router)" not in main_py:
            failures.append("main.py missing policy_engine_router mount")

    reports_path = "services/shf-agent-fabric/routers/reports_routes.py"
    if (ROOT / reports_path).exists():
        reports = _read(reports_path)
        if "policy_engine" not in reports:
            failures.append("reports_routes.py missing policy_engine summary reference")

    watchtower_path = "services/shf-agent-fabric/routers/watchtower_routes.py"
    if (ROOT / watchtower_path).exists():
        watchtower = _read(watchtower_path)
        if "policy_engine" not in watchtower:
            failures.append("watchtower_routes.py missing policy_engine coverage reference")

    package_path = ROOT / "package.json"
    if package_path.exists():
        package = json.loads(package_path.read_text(encoding="utf-8"))
        scripts = package.get("scripts", {})
        if "check:policy-engine" not in scripts:
            failures.append("package.json missing check:policy-engine")
        if "check:policy-engine" not in scripts.get("check:governance", ""):
            failures.append("package.json check:governance does not include check:policy-engine")

    service_path = "services/shf-agent-fabric/services/policy_engine_service.py"
    if (ROOT / service_path).exists():
        service = _read(service_path).lower()
        forbidden = [
            "policy engine verifies truth",
            "policy engine overrides truth spine",
            "policy engine overrides oracle",
            "policy engine mutates shf impact data",
            "policy engine directly publishes",
            "policy engine directly marks public_approved",
            "policy engine replaces ai guardrails",
            "policy engine replaces identity",
        ]
        for phrase in forbidden:
            if phrase in service:
                failures.append(f"policy_engine_service.py contains forbidden authority phrase: {phrase}")

    if failures:
        print("FAIL: Policy Engine Layer checks failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("PASS: Policy Engine Layer V1 boundary, routes, docs, and governance checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
