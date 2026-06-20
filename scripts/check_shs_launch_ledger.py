#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "services/shf-agent-fabric/services/shs_launch_ledger_service.py",
    "services/shf-agent-fabric/routers/shs_launch_ledger_routes.py",
    "services/shf-agent-fabric/tests/test_shs_launch_ledger_routes.py",
    "docs/paid-launch/SHS_LAUNCH_WORKFLOW_V1_1_BACKEND_LEDGER.md",
    "docs/paid-launch/SHS_LAUNCH_WORKFLOW_V1_1_BACKEND_LEDGER.json",
]

REQUIRED_ROUTES = [
    'prefix="/shs-launch-ledger"',
    '"/health"',
    '"/records"',
    '"/records/{ledger_id}"',
    '"/records/{ledger_id}/signoff"',
    '"/records/{ledger_id}/version"',
    '"/records/{ledger_id}/recalculate"',
    '"/audit"',
    '"/readiness"',
]

FORBIDDEN_PATTERNS = [
    '"public_approved": true',
    '"mutated_shf_impact_data": true',
    '"published_report": true',
    "from src.data.shfImpactData",
    "import shfImpactData",
    "shfImpactData.",
]


def _read(rel_path: str) -> str:
    return (ROOT / rel_path).read_text(encoding="utf-8")


def main() -> int:
    failures: list[str] = []

    for rel_path in REQUIRED_FILES:
        if not (ROOT / rel_path).exists():
            failures.append(f"missing required file: {rel_path}")

    service_path = "services/shf-agent-fabric/services/shs_launch_ledger_service.py"
    router_path = "services/shf-agent-fabric/routers/shs_launch_ledger_routes.py"
    main_path = "services/shf-agent-fabric/main.py"
    package_path = ROOT / "package.json"

    if (ROOT / service_path).exists():
        service = _read(service_path)
        if "RECORDS_PATH = DB_DIR / \"launch_records.json\"" not in service:
            failures.append("service missing launch_records.json persistence path")
        if "AUDIT_PATH = DB_DIR / \"launch_audit.jsonl\"" not in service:
            failures.append("service missing launch_audit.jsonl audit path")
        if '.open("a", encoding="utf-8")' not in service:
            failures.append("service audit ledger must append with open mode a")
        for flag in ("public_approved", "mutated_shf_impact_data", "published_report"):
            if f'"{flag}": False' not in service:
                failures.append(f"service does not force {flag} false")
        if "shfImpactData" in service:
            failures.append("service must not import or reference SHF Impact Data Spine")

    if (ROOT / router_path).exists():
        router = _read(router_path)
        for route in REQUIRED_ROUTES:
            if route not in router:
                failures.append(f"router missing required route marker: {route}")
        for flag in ("public_approved", "mutated_shf_impact_data", "published_report"):
            if f'"{flag}": False' not in router:
                failures.append(f"router does not force {flag} false in response safety flags")
        if "shfImpactData" in router:
            failures.append("router must not import or reference SHF Impact Data Spine")

    if (ROOT / main_path).exists():
        main_py = _read(main_path)
        if "shs_launch_ledger_router" not in main_py:
            failures.append("main.py missing shs_launch_ledger_router import")
        if "include_router(shs_launch_ledger_router)" not in main_py:
            failures.append("main.py missing shs_launch_ledger_router mount")
    else:
        failures.append("missing services/shf-agent-fabric/main.py")

    for rel_path in [
        service_path,
        router_path,
        "docs/paid-launch/SHS_LAUNCH_WORKFLOW_V1_1_BACKEND_LEDGER.md",
        "docs/paid-launch/SHS_LAUNCH_WORKFLOW_V1_1_BACKEND_LEDGER.json",
    ]:
        if (ROOT / rel_path).exists():
            content = _read(rel_path)
            lowered = content.lower()
            for pattern in FORBIDDEN_PATTERNS:
                if pattern.lower() in lowered:
                    failures.append(f"{rel_path} contains forbidden pattern: {pattern}")

    if package_path.exists():
        package = json.loads(package_path.read_text(encoding="utf-8"))
        scripts = package.get("scripts", {})
        if scripts.get("check:shs-launch-ledger") != "python3 scripts/check_shs_launch_ledger.py":
            failures.append("package.json missing check:shs-launch-ledger")
        if "check:shs-launch-ledger" not in scripts.get("check:governance", ""):
            failures.append("package.json check:governance does not include check:shs-launch-ledger")
    else:
        failures.append("missing package.json")

    if failures:
        print("FAIL: SHS Launch Ledger checks failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("PASS: SHS Launch Workflow V1.1 backend ledger, audit, safety, route, and governance checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
