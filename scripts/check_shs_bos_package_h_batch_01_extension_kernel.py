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
DOC_ROOT = ROOT / "docs" / "architecture"
PYTEST_TIMEOUT_SECONDS = 90

EXPECTED_LIFECYCLE = (
    "DISCOVERED",
    "REGISTERED",
    "VALIDATED",
    "OWNER_APPROVED",
    "READY",
    "ACTIVE",
    "LIMITED",
    "SUSPENDED",
    "DISABLED",
    "RETIRED",
)
EXPECTED_DOCS = (
    "SHS_BOS_PACKAGE_H_BATCH_01_KERNEL_IMPLEMENTATION_SUMMARY_V1.json",
    "SHS_BOS_PACKAGE_H_BATCH_01_KERNEL_ARCHITECTURE_SUMMARY_V1.json",
    "SHS_BOS_PACKAGE_H_BATCH_01_KERNEL_DEPENDENCY_GRAPH_V1.json",
    "SHS_BOS_PACKAGE_H_BATCH_01_KERNEL_PUBLIC_API_INVENTORY_V1.json",
    "SHS_BOS_PACKAGE_H_BATCH_01_KERNEL_INTERFACE_INVENTORY_V1.json",
    "SHS_BOS_PACKAGE_H_BATCH_01_KERNEL_MODEL_INVENTORY_V1.json",
    "SHS_BOS_PACKAGE_H_BATCH_01_KERNEL_VALIDATION_REPORT_V1.json",
    "SHS_BOS_PACKAGE_H_BATCH_01_KERNEL_FUTURE_INTEGRATION_CHECKLIST_V1.json",
)
EXPECTED_KERNEL_SOURCE = (
    "__init__.py",
    "constants.py",
    "diagnostics.py",
    "errors.py",
    "events.py",
    "interfaces.py",
    "lifecycle.py",
    "models.py",
    "registry.py",
    "serialization.py",
    "utilities.py",
    "validation.py",
    "versioning.py",
)
EXPECTED_TOTAL_PATH_COUNT = len(EXPECTED_KERNEL_SOURCE) + (len(EXPECTED_DOCS) * 2) + 2
PROHIBITED_TOKENS = (
    "Oracle",
    "Truth Spine",
    "Executive Command",
    "ClientOps",
    "Watchtower",
    "Tracking Intelligence",
    "Source Registry",
    "API Gateway",
    "Package G",
    "Package F",
    "Package E",
    "Package D",
)
ALLOWED_IMPORT_PREFIXES = ("__future__", "dataclasses", "datetime", "enum", "json", "re", "typing", "services.extension_kernel")


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def kernel_files() -> tuple[Path, ...]:
    files = tuple(sorted(KERNEL_ROOT.glob("*.py")))
    if not files:
        fail("extension kernel package is missing")
    return files


def validate_candidate_inventory() -> None:
    source = tuple(path.name for path in kernel_files())
    if source != EXPECTED_KERNEL_SOURCE:
        fail(f"kernel source inventory mismatch: {source}")
    forbidden = [
        path
        for path in KERNEL_ROOT.rglob("*")
        if "__pycache__" in path.parts or path.suffix in {".pyc", ".pyo"}
    ]
    if any(path.name in EXPECTED_KERNEL_SOURCE for path in forbidden):
        fail("bytecode/cache artifact was included as kernel source")
    docs = tuple(sorted(DOC_ROOT / name for name in EXPECTED_DOCS))
    markdown = tuple(path.with_suffix(".md") for path in docs)
    for path in docs + markdown:
        if not path.exists():
            fail(f"missing kernel candidate document: {path.relative_to(ROOT)}")
    actual_total = len(source) + len(docs) + len(markdown) + 2
    if actual_total != EXPECTED_TOTAL_PATH_COUNT:
        fail(f"candidate path count mismatch: expected {EXPECTED_TOTAL_PATH_COUNT}, found {actual_total}")


def validate_owner_blind_source() -> None:
    for path in kernel_files():
        text = path.read_text()
        for token in PROHIBITED_TOKENS:
            if token in text:
                fail(f"owner or protected token found in kernel source: {path.relative_to(ROOT)} -> {token}")


def validate_imports() -> None:
    for path in kernel_files():
        tree = ast.parse(path.read_text())
        for node in ast.walk(tree):
            module = ""
            if isinstance(node, ast.Import):
                names = [alias.name for alias in node.names]
            elif isinstance(node, ast.ImportFrom):
                names = [node.module or ""]
            else:
                continue
            for module in names:
                if not module.startswith(ALLOWED_IMPORT_PREFIXES):
                    fail(f"disallowed import in {path.relative_to(ROOT)}: {module}")


def validate_contracts() -> None:
    sys.path.insert(0, str(SERVICE_ROOT))
    from services.extension_kernel import CAPABILITY_TYPES, KERNEL_SCHEMA_VERSION, LIFECYCLE_STATES, validate_manifest
    from services.extension_kernel.models import ExtensionDescriptor, ExtensionManifest, ExtensionMetadata, ExtensionSecurityContract

    if KERNEL_SCHEMA_VERSION != "shs.extension_kernel.foundation.v1":
        fail("kernel schema version mismatch")
    if tuple(LIFECYCLE_STATES) != EXPECTED_LIFECYCLE:
        fail("kernel lifecycle state mismatch")
    if len(CAPABILITY_TYPES) < 12:
        fail("kernel capability contract set is incomplete")
    manifest = ExtensionManifest(
        descriptor=ExtensionDescriptor(
            extension_id="validator.kernel.fixture",
            name="Validator Fixture",
            description="Owner independent validator fixture",
            version="1.0.0",
            compatibility_version="1.0.0",
        ),
        metadata=ExtensionMetadata(created_by="validator"),
        lifecycle_state="REGISTERED",
        security=ExtensionSecurityContract(trust_level="DECLARED"),
    )
    if not validate_manifest(manifest).ok:
        fail("valid generic manifest was rejected")


def validate_docs() -> None:
    for name in EXPECTED_DOCS:
        path = DOC_ROOT / name
        if not path.exists():
            fail(f"missing generated JSON artifact: {path.relative_to(ROOT)}")
        data = json.loads(path.read_text())
        if data.get("package") != "PACKAGE_H" or data.get("batch") != "BATCH_01":
            fail(f"invalid package metadata in {path.relative_to(ROOT)}")
        if data.get("owner_registrations") != 0 or data.get("runtime_wiring") != 0:
            fail(f"artifact violates owner/runtime isolation: {path.relative_to(ROOT)}")


def run_pytest() -> None:
    env = {
        **os.environ,
        "PYTHONDONTWRITEBYTECODE": "1",
        "PYTEST_ADDOPTS": "-p no:cacheprovider",
    }
    result = subprocess.run(
        [sys.executable, "-m", "pytest", "services/shf-agent-fabric/tests/test_extension_kernel_foundation.py", "-q"],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        timeout=PYTEST_TIMEOUT_SECONDS,
        check=False,
    )
    if result.stdout:
        print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)
    if result.returncode:
        fail(f"focused pytest failed with exit code {result.returncode}")


def main() -> None:
    validate_candidate_inventory()
    validate_owner_blind_source()
    validate_imports()
    validate_contracts()
    validate_docs()
    run_pytest()
    print("PASS: SHS BOS Package H Batch 01 extension kernel validation OK.")


if __name__ == "__main__":
    main()
