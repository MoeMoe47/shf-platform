#!/usr/bin/env python3
"""Validate SHS BOS V1.2 Package H Batch 02 owner onboarding implementation."""

from __future__ import annotations

import ast
import json
import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SERVICE_ROOT = ROOT / "services" / "shf-agent-fabric"
KERNEL_ROOT = SERVICE_ROOT / "services" / "extension_kernel"
TEST_PATH = SERVICE_ROOT / "tests" / "test_extension_kernel_owner_onboarding.py"
MATRIX_JSON = ROOT / "docs" / "releases" / "PACKAGE_H_BATCH_02_EVIDENCE_ACCEPTANCE_MATRIX.json"
GOVERNANCE_LOCK = ROOT / "docs" / "releases" / "PACKAGE_H_BATCH_02_GOVERNANCE_LOCK.json"
BLUEPRINT = ROOT / "docs" / "releases" / "SHS_BOS_V1_2_PACKAGE_H_BATCH_02_BLUEPRINT.md"

EXPECTED_IMPLEMENTATION_PATHS = (
    "services/shf-agent-fabric/services/extension_kernel/owner_onboarding.py",
    "services/shf-agent-fabric/services/extension_kernel/__init__.py",
    "services/shf-agent-fabric/tests/test_extension_kernel_owner_onboarding.py",
    "scripts/check_shs_bos_v1_2_package_h_batch_02_owner_onboarding.py",
)
PROHIBITED_ACTIVE_PATHS = (
    "services/shf-agent-fabric/services/owner_onboarding/service.py",
    "services/shf-agent-fabric/services/owner_onboarding/__init__.py",
    "services/shf-agent-fabric/routers/extension_owner_onboarding_routes.py",
)
PROHIBITED_IMPORT_PREFIXES = (
    "fastapi",
    "requests",
    "httpx",
    "services.owner_onboarding",
    "services.shared_integration",
)
REQUIRED_FAILURE_CODES = {
    "OWNER_ID_MISSING",
    "OWNER_ID_INVALID",
    "AUTHORITY_DOMAIN_MISSING",
    "AUTHORITY_DOMAIN_INVALID",
    "CAPABILITY_MISSING",
    "CAPABILITY_ID_INVALID",
    "CAPABILITY_TYPE_INVALID",
    "CONTRACT_VERSION_INVALID",
    "REGISTRATION_VERSION_INVALID",
    "COMPATIBILITY_RANGE_INVALID",
    "OWNERSHIP_COLLISION",
    "AUTHORITY_BOUNDARY_VIOLATION",
    "OWNER_PRIVATE_IMPORT_DECLARED",
    "DEPENDENCY_DECLARATION_INVALID",
    "GOVERNANCE_STATUS_OWNED_ELSEWHERE",
    "SECRET_FIELD_DECLARED",
    "READINESS_NOT_PROVEN",
}


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def read_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def validate_governance_artifacts() -> None:
    for path in (MATRIX_JSON, GOVERNANCE_LOCK, BLUEPRINT):
        if not path.exists():
            fail(f"missing governance artifact: {path.relative_to(ROOT)}")
    matrix = read_json(MATRIX_JSON)
    lock = read_json(GOVERNANCE_LOCK)
    rows = matrix.get("rows", [])
    if len(rows) != 33:
        fail("evidence matrix must contain 33 rows")
    if len({row.get("acceptance_criterion_id") for row in rows}) != 33:
        fail("evidence matrix contains duplicate or missing criterion ids")
    if lock.get("locked_classification") != {"BLOCKING": 26, "REQUIRED": 7, "ADVISORY": 0}:
        fail("governance lock classification mismatch")
    if lock.get("implementation_authorized") is not False:
        fail("governance lock must not authorize implementation by itself")


def validate_paths() -> None:
    for rel_path in EXPECTED_IMPLEMENTATION_PATHS:
        if not (ROOT / rel_path).exists():
            fail(f"missing implementation path: {rel_path}")
    for rel_path in PROHIBITED_ACTIVE_PATHS:
        if (ROOT / rel_path).exists():
            fail(f"prohibited archived implementation restored: {rel_path}")


def validate_imports() -> None:
    for path in (KERNEL_ROOT / "owner_onboarding.py", TEST_PATH):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            modules: list[str]
            if isinstance(node, ast.Import):
                modules = [alias.name for alias in node.names]
            elif isinstance(node, ast.ImportFrom):
                modules = [node.module or ""]
            else:
                continue
            for module in modules:
                if module.startswith(PROHIBITED_IMPORT_PREFIXES):
                    fail(f"prohibited import in {path.relative_to(ROOT)}: {module}")


def validate_contract_behavior() -> None:
    sys.path.insert(0, str(SERVICE_ROOT))
    from services.extension_kernel import (
        OWNER_ONBOARDING_FAILURE_CODES,
        InMemoryExtensionRegistry,
        OwnerCapabilityDeclaration,
        OwnerOnboardingDeclaration,
        register_owner_declaration,
        validate_owner_declaration,
    )

    if set(OWNER_ONBOARDING_FAILURE_CODES) != REQUIRED_FAILURE_CODES:
        fail("failure code set is incomplete or unstable")
    valid = OwnerOnboardingDeclaration(
        owner_id="owner.validator",
        authority_domain="domain.validator",
        capability_declarations=(OwnerCapabilityDeclaration(capability_id="domain.validator.read", capability_type="READ"),),
        readiness_evidence=("validator.ready",),
    )
    registry = InMemoryExtensionRegistry()
    registered = register_owner_declaration(valid, registry=registry)
    if not registered.ok or registry.lookup("registration.owner.validator.onboarding") is None:
        fail("valid owner declaration did not register")
    invalid = OwnerOnboardingDeclaration(owner_id="", authority_domain="", capability_declarations=())
    rejected = validate_owner_declaration(invalid)
    if rejected.ok or "OWNER_ID_MISSING" not in {issue.code for issue in rejected.issues}:
        fail("invalid owner declaration was not rejected deterministically")


def run_focused_tests() -> None:
    env = {
        **os.environ,
        "PYTHONDONTWRITEBYTECODE": "1",
        "PYTEST_ADDOPTS": "-p no:cacheprovider",
    }
    result = subprocess.run(
        [sys.executable, "-m", "pytest", str(TEST_PATH.relative_to(ROOT)), "-q"],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        timeout=90,
        check=False,
    )
    if result.stdout:
        print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)
    if result.returncode:
        fail(f"focused owner-onboarding tests failed with exit code {result.returncode}")


def main() -> None:
    validate_governance_artifacts()
    validate_paths()
    validate_imports()
    validate_contract_behavior()
    run_focused_tests()
    print("PASS: SHS BOS V1.2 Package H Batch 02 owner onboarding validation OK.")


if __name__ == "__main__":
    main()
