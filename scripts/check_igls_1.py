#!/usr/bin/env python3
"""Validate IGLS-1 governance standard artifacts."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
GOV = ROOT / "docs" / "governance"
SPEC_MD = GOV / "IGLS_1_IMPLEMENTATION_GOVERNANCE_LIFECYCLE_STANDARD.md"
SPEC_JSON = GOV / "IGLS_1_IMPLEMENTATION_GOVERNANCE_LIFECYCLE_STANDARD.json"
LOCK_JSON = GOV / "IGLS_1_GOVERNANCE_LOCK.json"
MANIFEST_JSON = GOV / "IGLS_1_ARTIFACT_MANIFEST.json"

PHASE_ORDER = [
    "MISSION_DEFINITION",
    "ARCHITECTURE_CHARTER",
    "BLUEPRINT",
    "ACCEPTANCE_AND_EVIDENCE",
    "GOVERNANCE_LOCK",
    "GOVERNED_IMPLEMENTATION",
    "INDEPENDENT_RELEASE_CERTIFICATION",
    "REPOSITORY_PUBLICATION",
    "POST_PUBLICATION_VERIFICATION",
    "NEXT_PACKAGE_AUTHORIZATION",
]
MANDATORY_GATES = [
    "Initiation Gate",
    "Architecture Gate",
    "Design Completeness Gate",
    "Governance Lock Gate",
    "Implementation Authorization Gate",
    "Implementation Completion Gate",
    "Independent Certification Gate",
    "Publication Authorization Gate",
    "Publication Verification Gate",
    "Next-Package Authorization Gate",
]
ACCEPTANCE_CLASSES = {"BLOCKING", "REQUIRED", "ADVISORY"}
REQUIRED_TEMPLATE_NAMES = [
    "IGLS_1_MISSION_DEFINITION_TEMPLATE.md",
    "IGLS_1_ARCHITECTURE_CHARTER_TEMPLATE.md",
    "IGLS_1_BLUEPRINT_TEMPLATE.md",
    "IGLS_1_ACCEPTANCE_CRITERIA_TEMPLATE.md",
    "IGLS_1_EVIDENCE_MATRIX_TEMPLATE.md",
    "IGLS_1_VALIDATION_PLAN_TEMPLATE.md",
    "IGLS_1_GOVERNANCE_LOCK_TEMPLATE.md",
    "IGLS_1_IMPLEMENTATION_REPORT_TEMPLATE.md",
    "IGLS_1_INDEPENDENT_RELEASE_REVIEW_TEMPLATE.md",
    "IGLS_1_RELEASE_CERTIFICATE_TEMPLATE.md",
    "IGLS_1_PUBLICATION_CHECKLIST_TEMPLATE.md",
    "IGLS_1_PUBLICATION_COMPLETION_CERTIFICATE_TEMPLATE.md",
    "IGLS_1_POST_PUBLICATION_VERIFICATION_TEMPLATE.md",
    "IGLS_1_NEXT_PACKAGE_AUTHORIZATION_TEMPLATE.md",
]


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def load_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def _require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def validate_contract(contract: dict[str, Any], manifest: dict[str, Any], lock: dict[str, Any], root: Path = ROOT) -> None:
    _require(contract.get("standard_id") == "IGLS-1", "standard_id must be IGLS-1")
    _require(contract.get("version") == "1.0", "version must be 1.0")
    _require(lock.get("standard_id") == contract.get("standard_id"), "lock standard id mismatch")
    _require(lock.get("version") == contract.get("version"), "lock version mismatch")

    phases = contract.get("lifecycle_phases")
    _require(isinstance(phases, list), "lifecycle_phases must be a list")
    ids = [phase.get("phase_id") for phase in phases]
    _require(len(ids) == 10, "exactly ten lifecycle phases are required")
    _require(ids == PHASE_ORDER, "phase ordering is not canonical")
    _require(len(set(ids)) == len(ids), "duplicate phase identifier found")

    for phase in phases:
        phase_id = phase.get("phase_id", "UNKNOWN")
        for key in ("entry_conditions", "required_artifacts", "required_evidence", "prohibited_actions", "exit_conditions"):
            _require(phase.get(key), f"{phase_id} missing {key}")
        _require(phase.get("next_permitted_phase"), f"{phase_id} missing next permitted phase")

    _require(contract.get("gates") == MANDATORY_GATES, "mandatory gates missing or out of order")
    _require(len(contract.get("separation_of_duties", [])) >= 6, "separation-of-duty rules incomplete")
    _require(contract.get("traceability_chain") == [
        "Mission",
        "Architecture Charter",
        "Blueprint",
        "Acceptance Criterion",
        "Implementation",
        "Validator",
        "Test",
        "Evidence",
        "Certification",
        "Publication",
        "Post-Publication Verification",
    ], "traceability chain incomplete")
    _require(set(contract.get("acceptance_classifications", {}).keys()) == ACCEPTANCE_CLASSES, "acceptance classifications must be Blocking, Required, Advisory")
    _require(contract.get("classification_rules", {}).get("silent_reclassification_allowed") is False, "silent reclassification must be prohibited")
    _require(contract.get("repository_integrity_rules"), "repository-integrity rules missing")
    _require(contract.get("evidence_integrity_rules"), "evidence-integrity rules missing")
    _require(contract.get("exception_governance", {}).get("implied_exceptions_allowed") is False, "implied exceptions must be prohibited")
    _require(contract.get("supersession", {}).get("silent_supersession_allowed") is False, "silent supersession must be prohibited")
    _require("NEXT_PACKAGE_AUTHORIZATION" in ids, "next-package authorization phase missing")
    _require("POST_PUBLICATION_VERIFICATION" in ids, "publication verification phase missing")

    authority = contract.get("authority_registration", {})
    _require(authority.get("registration_type") == "governance_standard", "IGLS-1 must register as a governance standard")
    _require(authority.get("registered_with") == "Governance Layer", "IGLS-1 must register with Governance Layer")
    _require(authority.get("runtime_layer") is False, "IGLS-1 must not register as a runtime layer")
    _require(authority.get("duplicate_authority_introduced") is False, "duplicate authority introduced")
    _require(authority.get("duplicate_registry_introduced") is False, "duplicate registry introduced")
    _require(lock.get("master_layer_registry_change_required") is False, "Master Layer Registry change must not be required")
    _require(lock.get("runtime_added") is False and lock.get("api_added") is False and lock.get("ui_added") is False and lock.get("persistence_added") is False, "runtime/API/UI/persistence must not be added")

    templates = manifest.get("templates", [])
    _require(manifest.get("required_template_count") == len(REQUIRED_TEMPLATE_NAMES), "template count mismatch")
    _require(len(templates) == len(REQUIRED_TEMPLATE_NAMES), "manifest template list incomplete")
    for name in REQUIRED_TEMPLATE_NAMES:
        path = root / "docs" / "governance" / "templates" / name
        _require(str(path.relative_to(root)) in templates, f"template missing from manifest: {name}")
        _require(path.exists(), f"template file missing: {name}")
        text = path.read_text(encoding="utf-8")
        for field in ("Document Identity:", "Canonical Owner:", "Required Evidence:", "Validation Commands:", "Approval State:", "Change-Control Rules:"):
            _require(field in text, f"{name} missing template field: {field}")


def validate_markdown(contract: dict[str, Any]) -> None:
    text = SPEC_MD.read_text(encoding="utf-8")
    _require("Standard ID: IGLS-1" in text, "markdown missing standard id")
    _require("Version: 1.0" in text, "markdown version mismatch")
    for phase_id in PHASE_ORDER:
        _require(phase_id in text, f"markdown missing phase: {phase_id}")
    _require(contract["standard_name"] in text, "markdown/JSON standard name mismatch")


def run_existing_architecture_validators() -> None:
    commands = [
        [sys.executable, "scripts/check_master_layer_registry.py"],
        [sys.executable, "scripts/check_shs_bos_v1_layer_audit.py"],
        [sys.executable, "scripts/check_shs_bos_layer_family_architecture.py"],
    ]
    for command in commands:
        result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, check=False, timeout=90)
        if result.stdout:
            print(result.stdout, end="")
        if result.stderr:
            print(result.stderr, end="", file=sys.stderr)
        if result.returncode:
            fail(f"validator failed: {' '.join(command)}")


def main() -> None:
    for path in (SPEC_MD, SPEC_JSON, LOCK_JSON, MANIFEST_JSON):
        _require(path.exists(), f"missing required artifact: {path.relative_to(ROOT)}")
    contract = load_json(SPEC_JSON)
    lock = load_json(LOCK_JSON)
    manifest = load_json(MANIFEST_JSON)
    validate_contract(contract, manifest, lock)
    validate_markdown(contract)
    run_existing_architecture_validators()
    print("PASS: IGLS-1 governance lifecycle standard validation OK.")


if __name__ == "__main__":
    main()
