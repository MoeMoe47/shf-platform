#!/usr/bin/env python3
"""Validate PAS-1 package assembly artifacts for Package H Batch 03."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "docs" / "governance" / "PAS_1"
STANDARD_ID = "PAS-1"
PACKAGE_ID = "PACKAGE_H_BATCH_03"
EXPECTED_MEMBER_COUNT = 193
REQUIRED_ARTIFACTS = [
    "PAS_1_PACKAGE_ASSEMBLY_STANDARD",
    "PACKAGE_ASSEMBLY_SPECIFICATION",
    "PACKAGE_BOUNDARY_REPORT",
    "PACKAGE_INVENTORY",
    "PACKAGE_COMPOSITION_REPORT",
    "PACKAGE_MANIFEST",
    "PACKAGE_OWNERSHIP_REPORT",
    "PACKAGE_DISPOSITION_REGISTER",
    "PACKAGE_AUTHORIZATION_RECORD",
    "PACKAGE_IDENTITY_RECORD",
    "PACKAGE_DEPENDENCY_REPORT",
    "PACKAGE_ASSEMBLY_CERTIFICATION_REPORT",
]
PACKAGE_ROOTS = [
    "docs/governance/EPL_1",
    "docs/releases/PACKAGE_H_BATCH_03_PHASE_1",
    "docs/releases/PACKAGE_H_BATCH_03_PHASE_2",
    "docs/releases/PACKAGE_H_BATCH_03_PHASE_3",
    "docs/releases/PACKAGE_H_BATCH_03_PHASE_4",
    "docs/releases/PACKAGE_H_BATCH_03_PHASE_5",
    "docs/releases/PACKAGE_H_BATCH_03_PHASE_6",
    "docs/releases/PACKAGE_H_BATCH_03_PHASE_7",
]
PACKAGE_FILES = [
    "scripts/check_epl_1.py",
    "scripts/check_package_h_batch_03_phase_1.py",
    "scripts/check_package_h_batch_03_phase_2.py",
    "scripts/check_package_h_batch_03_phase_3.py",
    "scripts/check_package_h_batch_03_phase_4.py",
    "scripts/check_package_h_batch_03_phase_5.py",
    "scripts/check_package_h_batch_03_phase_6.py",
    "scripts/check_package_h_batch_03_phase_7.py",
    "tests/test_epl_1.py",
    "tests/test_package_h_batch_03_phase_1.py",
    "tests/test_package_h_batch_03_phase_2.py",
    "tests/test_package_h_batch_03_phase_3.py",
    "tests/test_package_h_batch_03_phase_4.py",
    "tests/test_package_h_batch_03_phase_5.py",
    "tests/test_package_h_batch_03_phase_6.py",
    "tests/test_package_h_batch_03_phase_7.py",
    "services/shf-agent-fabric/services/extension_kernel/runtime_owner_closure.py",
    "services/shf-agent-fabric/services/extension_kernel/__init__.py",
    "services/shf-agent-fabric/tests/test_extension_kernel_runtime_owner_closure.py",
]
REQUIRED_IDENTITY_FIELDS = {
    "package_identifier",
    "package_name",
    "package_version",
    "owning_package",
    "owning_governance_standard",
    "lifecycle_version",
    "certification_version",
    "assembly_version",
    "manifest_version",
    "integrity_identifier",
    "traceability_identifier",
    "evidence_identifier",
    "repository_identifier",
    "package_status",
    "package_classification",
}
REQUIRED_CERTIFICATION_CHECKS = {
    "Package Boundary",
    "Package Identity",
    "Package Inventory",
    "Package Composition",
    "Manifest",
    "Ownership",
    "Disposition",
    "Dependency Graph",
    "Authorization Record",
    "Package Completeness",
}
PROHIBITED_TRUE_KEYS = {
    "architecture_redesigned",
    "runtime_modified_by_pas_1",
    "features_implemented_by_pas_1",
    "apis_introduced",
    "deployment_performed",
    "publication_performed",
    "git_mutation_performed",
    "assembly_authorizes_sealing",
    "implementation_changes_by_pas_1",
    "runtime_changes_by_pas_1",
    "unknown_members_allowed",
    "duplicate_ownership",
    "duplicate_constitutional_authority",
    "conflicting_package_membership",
    "conflicting_lifecycle_ownership",
    "ownership_ambiguity",
    "duplicate_authority",
    "undefined_disposition_allowed",
    "runtime_expansion_by_pas_1",
    "architecture_expansion_by_pas_1",
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


def package_members() -> list[str]:
    members: set[str] = set()
    for root in PACKAGE_ROOTS:
        path = ROOT / root
        require(path.exists(), f"missing package root: {root}")
        for file_path in path.rglob("*"):
            if file_path.is_file():
                members.add(file_path.relative_to(ROOT).as_posix())
    for name in PACKAGE_FILES:
        require((ROOT / name).exists(), f"missing package file: {name}")
        members.add(name)
    return sorted(members)


def category_for(path: str) -> str:
    if path.startswith("docs/governance/EPL_1/"):
        return "Governance"
    if path.startswith("docs/releases/PACKAGE_H_BATCH_03_PHASE_"):
        return "Release Artifacts"
    if path.startswith("scripts/check_"):
        return "Validators"
    if path.startswith("tests/test_") or path.startswith("services/shf-agent-fabric/tests/"):
        return "Focused Tests"
    if path.endswith("runtime_owner_closure.py"):
        return "Implementation"
    if path.endswith("extension_kernel/__init__.py"):
        return "Runtime Support"
    return "Unknown"


def validate_required_files() -> dict[str, dict[str, Any]]:
    require(BASE.exists(), f"missing directory: {BASE.relative_to(ROOT)}")
    artifacts: dict[str, dict[str, Any]] = {}
    for name in REQUIRED_ARTIFACTS:
        md = BASE / f"{name}.md"
        js = BASE / f"{name}.json"
        require(md.exists(), f"missing markdown artifact: {md.relative_to(ROOT)}")
        require(js.exists(), f"missing JSON artifact: {js.relative_to(ROOT)}")
        artifacts[name] = load_json(name)
        require(artifacts[name].get("standard_id") == STANDARD_ID, f"{name} standard_id mismatch")
        require(artifacts[name].get("canonical_owner") == "Governance Layer", f"{name} owner mismatch")
        require(md.read_text(encoding="utf-8").strip().startswith("# "), f"{name} markdown title missing")
    return artifacts


def validate_package_members(members: list[str]) -> dict[str, int]:
    require(len(members) == EXPECTED_MEMBER_COUNT, f"package member count mismatch: {len(members)}")
    counts: dict[str, int] = {}
    unknown: list[str] = []
    for member in members:
        category = category_for(member)
        counts[category] = counts.get(category, 0) + 1
        if category == "Unknown":
            unknown.append(member)
    require(not unknown, f"unknown package members: {unknown}")
    require(counts.get("Governance") == 22, "governance count mismatch")
    require(counts.get("Release Artifacts") == 152, "release artifact count mismatch")
    require(counts.get("Validators") == 8, "validator count mismatch")
    require(counts.get("Focused Tests") == 9, "focused test count mismatch")
    require(counts.get("Implementation") == 1, "implementation count mismatch")
    require(counts.get("Runtime Support") == 1, "runtime support count mismatch")
    require(not any(member.startswith("docs/governance/PCS_1/") for member in members), "PCS-1 was incorporated into Package H Batch 03")
    return counts


def validate_standard(standard: dict[str, Any]) -> None:
    require(standard.get("standard_name") == "Package Assembly Standard", "standard name mismatch")
    require(standard.get("target_package_identifier") == PACKAGE_ID, "target package mismatch")
    require(set(standard.get("required_artifacts", [])) == set(REQUIRED_ARTIFACTS), "required artifacts mismatch")


def validate_boundary(boundary: dict[str, Any], members: list[str]) -> None:
    require(boundary.get("package_identifier") == PACKAGE_ID, "boundary package mismatch")
    require(boundary.get("expected_member_count") == len(members), "boundary member count mismatch")
    require("docs/governance/PCS_1/" in boundary.get("excluded_path_roots", []), "PCS-1 exclusion missing")
    for root in PACKAGE_ROOTS:
        require(f"{root}/" in boundary.get("included_path_roots", []), f"boundary root missing {root}")
    for path in PACKAGE_FILES:
        require(path in boundary.get("included_files", []), f"boundary file missing {path}")


def validate_identity(identity: dict[str, Any]) -> None:
    require(REQUIRED_IDENTITY_FIELDS <= set(identity), "identity fields incomplete")
    require(identity.get("package_identifier") == PACKAGE_ID, "identity package mismatch")
    require(identity.get("package_status") == "ASSEMBLED", "package status mismatch")
    require(identity.get("package_classification") == "CONSTITUTIONAL_PACKAGE", "package classification mismatch")


def validate_inventory(inventory: dict[str, Any], counts: dict[str, int]) -> None:
    require(inventory.get("expected_member_count") == EXPECTED_MEMBER_COUNT, "inventory count mismatch")
    categories = inventory.get("inventory_categories", {})
    for category in counts:
        require(category in categories, f"inventory category missing {category}")
    require(inventory.get("uncategorized_allowed") is False, "uncategorized artifacts must be prohibited")
    require(inventory.get("inventory_is_repository_derived") is True, "inventory must be repository derived")


def validate_composition(composition: dict[str, Any], counts: dict[str, int]) -> None:
    require(composition.get("total_package_members") == EXPECTED_MEMBER_COUNT, "composition count mismatch")
    require(composition.get("documentation_artifacts") == counts["Governance"] + counts["Release Artifacts"], "documentation count mismatch")
    require(composition.get("validators") == counts["Validators"], "validator count mismatch")
    require(composition.get("focused_tests") == counts["Focused Tests"], "focused test count mismatch")
    require(composition.get("runtime_support_files") == counts["Implementation"] + counts["Runtime Support"], "runtime summary mismatch")
    for field in ("orphan_artifacts", "orphan_validators", "orphan_tests", "orphan_documentation", "orphan_evidence", "deferred_artifacts"):
        require(composition.get(field) == [], f"{field} must be empty")


def validate_manifest(manifest: dict[str, Any]) -> None:
    require(manifest.get("package_identifier") == PACKAGE_ID, "manifest package mismatch")
    require(manifest.get("expected_member_count") == EXPECTED_MEMBER_COUNT, "manifest count mismatch")
    require(manifest.get("manifest_complete") is True, "manifest completeness missing")
    for field in (
        "inventory_reference",
        "ownership_reference",
        "lifecycle_reference",
        "dependency_reference",
        "evidence_reference",
        "runtime_support_reference",
        "implementation_reference",
        "release_artifact_reference",
        "certification_reference",
        "version_information",
    ):
        require(manifest.get(field), f"manifest missing {field}")


def validate_ownership(ownership: dict[str, Any]) -> None:
    require(ownership.get("package_identifier") == PACKAGE_ID, "ownership package mismatch")
    require(ownership.get("responsible_package") == "Package H", "responsible package mismatch")
    require("EPL-1" in ownership.get("responsible_standard", ""), "EPL-1 ownership reference missing")
    require(len(ownership.get("responsible_phases", [])) == 7, "responsible phases incomplete")


def validate_disposition(disposition: dict[str, Any]) -> None:
    require(disposition.get("package_identifier") == PACKAGE_ID, "disposition package mismatch")
    values = set(disposition.get("dispositions", {}).values())
    required = {"Included", "Implementation", "Runtime Support", "Focused Test", "Excluded"}
    require(required <= values, "dispositions incomplete")
    require(disposition.get("undefined_disposition_allowed") is False, "undefined disposition must be prohibited")


def validate_dependency(dependency: dict[str, Any]) -> None:
    require(dependency.get("package_identifier") == PACKAGE_ID, "dependency package mismatch")
    required = {"IGLS-1", "EPL-1", "Master Layer Registry", "Extension Kernel Batch 02 Owner Onboarding", "Python pytest"}
    require(required <= set(dependency.get("required_dependencies", [])), "required dependencies incomplete")
    require(dependency.get("dependency_conflicts") == [], "dependency conflicts present")
    require(dependency.get("dependency_graph_complete") is True, "dependency graph incomplete")


def validate_authorization(auth: dict[str, Any]) -> None:
    require(auth.get("package_identifier") == PACKAGE_ID, "authorization package mismatch")
    require(auth.get("package_completely_assembled") is True, "package assembly authorization missing")
    require(auth.get("assembly_authorizes_submission_to_pcs_1") is True, "PCS-1 submission authorization missing")
    require(auth.get("assembly_implies_sealing") is False, "assembly must not imply sealing")
    require(auth.get("assembly_implies_publication") is False, "assembly must not imply publication")
    require(auth.get("assembly_implies_deployment") is False, "assembly must not imply deployment")


def validate_certification(cert: dict[str, Any]) -> None:
    require(cert.get("package_identifier") == PACKAGE_ID, "certification package mismatch")
    require(REQUIRED_CERTIFICATION_CHECKS <= set(cert.get("certification_checks", [])), "certification checks incomplete")
    require(cert.get("package_ready_for_pcs_1") is True, "package must be ready for PCS-1")


def validate_no_prohibited_truths(artifacts: dict[str, dict[str, Any]]) -> None:
    for name, artifact in artifacts.items():
        for key, value in walk_values(artifact):
            if key in PROHIBITED_TRUE_KEYS:
                require(value is False, f"{name} prohibited key is true: {key}")


def main() -> None:
    artifacts = validate_required_files()
    members = package_members()
    counts = validate_package_members(members)
    validate_standard(artifacts["PAS_1_PACKAGE_ASSEMBLY_STANDARD"])
    validate_boundary(artifacts["PACKAGE_BOUNDARY_REPORT"], members)
    validate_identity(artifacts["PACKAGE_IDENTITY_RECORD"])
    validate_inventory(artifacts["PACKAGE_INVENTORY"], counts)
    validate_composition(artifacts["PACKAGE_COMPOSITION_REPORT"], counts)
    validate_manifest(artifacts["PACKAGE_MANIFEST"])
    validate_ownership(artifacts["PACKAGE_OWNERSHIP_REPORT"])
    validate_disposition(artifacts["PACKAGE_DISPOSITION_REGISTER"])
    validate_dependency(artifacts["PACKAGE_DEPENDENCY_REPORT"])
    validate_authorization(artifacts["PACKAGE_AUTHORIZATION_RECORD"])
    validate_certification(artifacts["PACKAGE_ASSEMBLY_CERTIFICATION_REPORT"])
    validate_no_prohibited_truths(artifacts)
    print("PAS_1_VALID")


if __name__ == "__main__":
    main()
