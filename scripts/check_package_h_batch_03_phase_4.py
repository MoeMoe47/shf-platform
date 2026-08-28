#!/usr/bin/env python3
"""Validate Package H Batch 03 IGLS-1 Phase 4 verification artifacts."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "docs" / "releases" / "PACKAGE_H_BATCH_03_PHASE_4"
PHASE1 = ROOT / "docs" / "releases" / "PACKAGE_H_BATCH_03_PHASE_1"
PHASE2 = ROOT / "docs" / "releases" / "PACKAGE_H_BATCH_03_PHASE_2"
PHASE3 = ROOT / "docs" / "releases" / "PACKAGE_H_BATCH_03_PHASE_3"
EPL1 = ROOT / "docs" / "governance" / "EPL_1"
MISSION_ID = "PACKAGE_H_BATCH_03_IGLS_1_PHASE_4"
REQUIRED_ARTIFACTS = [
    "CONSTITUTIONAL_VERIFICATION_FRAMEWORK",
    "ACCEPTANCE_CRITERIA_SPECIFICATION",
    "EVIDENCE_MATRIX",
    "EPL_EVIDENCE_REGISTRATION_PLAN",
    "VERIFICATION_TAXONOMY",
    "FAILURE_CLASSIFICATION",
    "TRACEABILITY_VERIFICATION_MATRIX",
    "CONSTITUTIONAL_VERIFICATION_REPORT",
]
REQUIRED_TAXONOMY = {
    "Mission Verification",
    "Architecture Verification",
    "Blueprint Verification",
    "Decision Verification",
    "Implementation Readiness Verification",
    "Evidence Verification",
    "Repository Verification",
    "Certification Verification",
    "Publication Verification",
}
REQUIRED_FAILURE_SEVERITIES = {"Critical", "Major", "Minor", "Advisory", "Informational"}
PROHIBITED_TRUE_KEYS = {
    "implementation_authorized",
    "runtime_added",
    "api_added",
    "ui_added",
    "persistence_added",
    "deployment_authorized",
    "deployment_added",
    "publication_authorized",
    "publication_performed",
    "registry_mutation_performed",
}


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def load_json(name: str) -> dict[str, Any]:
    path = BASE / f"{name}.json"
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        fail(f"missing artifact: {path.relative_to(ROOT)}")
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def walk_values(value: Any):
    if isinstance(value, dict):
        for key, item in value.items():
            yield key, item
            yield from walk_values(item)
    elif isinstance(value, list):
        for item in value:
            yield from walk_values(item)


def validate_required_files() -> dict[str, dict[str, Any]]:
    for path, label in ((PHASE1, "Phase 1"), (PHASE2, "Phase 2"), (PHASE3, "Phase 3"), (EPL1, "EPL-1")):
        require(path.exists(), f"{label} artifacts must exist before Phase 4")
    artifacts: dict[str, dict[str, Any]] = {}
    for name in REQUIRED_ARTIFACTS:
        md = BASE / f"{name}.md"
        js = BASE / f"{name}.json"
        require(md.exists(), f"missing markdown artifact: {md.relative_to(ROOT)}")
        require(js.exists(), f"missing JSON artifact: {js.relative_to(ROOT)}")
        artifacts[name] = load_json(name)
        require(artifacts[name].get("mission_id") == MISSION_ID, f"{name} mission_id mismatch")
    return artifacts


def validate_cvf(cvf: dict[str, Any]) -> None:
    require(cvf.get("framework_id") == "CVF-1", "framework_id must be CVF-1")
    for key in ("verification_principles", "verification_scope", "verification_lifecycle", "verification_states", "verification_gates", "verification_dependencies", "verification_severity_levels", "verification_failure_classes", "blocking_rules", "waiver_rules", "reverification_rules", "independent_review_rules", "certification_entry_rules", "certification_exit_rules", "publication_entry_rules"):
        require(cvf.get(key), f"CVF missing {key}")
    require("EPL-1" in cvf.get("verification_dependencies", []), "CVF must depend on EPL-1")


def validate_acs(acs: dict[str, Any]) -> None:
    criteria = acs.get("criteria", [])
    require(len(criteria) >= 4, "acceptance criteria incomplete")
    required = {"acceptance_criterion_id", "requirement_source", "mission_reference", "architecture_reference", "blueprint_reference", "decision_reference", "subject", "description", "expected_result", "preconditions", "inputs", "outputs", "pass_condition", "fail_condition", "severity", "blocking_status", "verification_method", "evidence_required", "certification_dependency", "publication_dependency"}
    ids = []
    for item in criteria:
        missing = [key for key in required if not item.get(key)]
        require(not missing, f"{item.get('acceptance_criterion_id', 'criterion')} missing {missing}")
        ids.append(item["acceptance_criterion_id"])
    require(len(ids) == len(set(ids)), "duplicate acceptance criterion id")


def validate_em(em: dict[str, Any], acs: dict[str, Any]) -> None:
    criterion_ids = {item["acceptance_criterion_id"] for item in acs.get("criteria", [])}
    evidence = em.get("evidence", [])
    require(len(evidence) >= len(criterion_ids), "evidence matrix incomplete")
    evidence_ids = []
    mapped_criteria = set()
    required = {"evidence_requirement_id", "acceptance_criterion_id", "epl_1_evidence_category", "evidence_producer", "evidence_owner", "evidence_validator", "evidence_format", "evidence_integrity_method", "evidence_hash_requirement", "evidence_fingerprint_requirement", "repository_state", "validator_required", "test_required", "certification_use", "publication_use", "retention_class", "supersession_rules"}
    for item in evidence:
        missing = [key for key in required if not item.get(key)]
        require(not missing, f"{item.get('evidence_requirement_id', 'evidence')} missing {missing}")
        evidence_ids.append(item["evidence_requirement_id"])
        mapped_criteria.add(item["acceptance_criterion_id"])
    require(len(evidence_ids) == len(set(evidence_ids)), "duplicate evidence requirement id")
    require(criterion_ids <= mapped_criteria, "orphan acceptance criterion without evidence")


def validate_erp(erp: dict[str, Any]) -> None:
    require(erp.get("plan_id") == "ERP-1", "plan_id must be ERP-1")
    require(erp.get("uses_permanent_epl_1") is True, "ERP must use EPL-1")
    require(erp.get("creates_new_evidence_system") is False, "ERP must not create new evidence system")
    for key in ("evidence_namespaces", "registration_workflow", "evidence_ownership", "registration_authority", "chain_of_custody", "registration_timing", "validation_timing", "certification_timing", "publication_timing", "evidence_bundles", "evidence_set_composition", "repository_references", "retention_strategy"):
        require(erp.get(key), f"ERP missing {key}")


def validate_taxonomy(taxonomy: dict[str, Any]) -> None:
    require(REQUIRED_TAXONOMY <= set(taxonomy.get("verification_classes", [])), "verification taxonomy incomplete")


def validate_failure(failure: dict[str, Any]) -> None:
    severities = {item.get("severity") for item in failure.get("failure_classes", [])}
    require(REQUIRED_FAILURE_SEVERITIES <= severities, "failure classes incomplete")
    for item in failure.get("failure_classes", []):
        for key in ("detection_method", "blocking_behavior", "escalation", "recovery_requirements", "reverification_requirements"):
            require(item.get(key), f"{item.get('severity', 'failure')} missing {key}")
    required_sufficiency = {"Complete", "Incomplete", "Insufficient", "Conflicting", "Superseded", "Invalid", "Expired", "Untrusted"}
    require(required_sufficiency <= set(failure.get("evidence_sufficiency_states", [])), "evidence sufficiency states incomplete")


def validate_traceability(trace: dict[str, Any], acs: dict[str, Any]) -> None:
    criterion_ids = {item["acceptance_criterion_id"] for item in acs.get("criteria", [])}
    links = trace.get("links", [])
    linked = {item.get("verification_item") for item in links}
    require(criterion_ids <= linked, "traceability missing criterion")
    for item in links:
        for key in ("mission", "architecture", "blueprint", "decision_ledger", "implementation_readiness", "evidence_provenance_ledger"):
            require(item.get(key), f"{item.get('verification_item', 'trace')} missing {key}")


def validate_no_prohibited_truths(artifacts: dict[str, dict[str, Any]]) -> None:
    for name, artifact in artifacts.items():
        for key, value in walk_values(artifact):
            if key in PROHIBITED_TRUE_KEYS:
                require(value is False, f"{name} prohibited key is true: {key}")


def main() -> None:
    artifacts = validate_required_files()
    validate_cvf(artifacts["CONSTITUTIONAL_VERIFICATION_FRAMEWORK"])
    validate_acs(artifacts["ACCEPTANCE_CRITERIA_SPECIFICATION"])
    validate_em(artifacts["EVIDENCE_MATRIX"], artifacts["ACCEPTANCE_CRITERIA_SPECIFICATION"])
    validate_erp(artifacts["EPL_EVIDENCE_REGISTRATION_PLAN"])
    validate_taxonomy(artifacts["VERIFICATION_TAXONOMY"])
    validate_failure(artifacts["FAILURE_CLASSIFICATION"])
    validate_traceability(artifacts["TRACEABILITY_VERIFICATION_MATRIX"], artifacts["ACCEPTANCE_CRITERIA_SPECIFICATION"])
    validate_no_prohibited_truths(artifacts)
    print("PASS: Package H Batch 03 IGLS-1 Phase 4 verification validation OK.")


if __name__ == "__main__":
    main()
