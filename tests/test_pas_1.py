from __future__ import annotations

import copy
import importlib.util
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check_pas_1.py"

spec = importlib.util.spec_from_file_location("check_pas_1", SCRIPT)
check = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(check)


def _artifacts():
    return check.validate_required_files()


def _members():
    return check.package_members()


def _counts():
    return check.validate_package_members(_members())


def _assert_rejected(func, value, message: str) -> None:
    with pytest.raises(SystemExit, match=message):
        func(value)


def test_pas_1_artifacts_and_package_members_pass() -> None:
    artifacts = _artifacts()
    members = _members()
    counts = check.validate_package_members(members)
    check.validate_standard(artifacts["PAS_1_PACKAGE_ASSEMBLY_STANDARD"])
    check.validate_boundary(artifacts["PACKAGE_BOUNDARY_REPORT"], members)
    check.validate_identity(artifacts["PACKAGE_IDENTITY_RECORD"])
    check.validate_inventory(artifacts["PACKAGE_INVENTORY"], counts)
    check.validate_composition(artifacts["PACKAGE_COMPOSITION_REPORT"], counts)
    check.validate_manifest(artifacts["PACKAGE_MANIFEST"])
    check.validate_ownership(artifacts["PACKAGE_OWNERSHIP_REPORT"])
    check.validate_disposition(artifacts["PACKAGE_DISPOSITION_REGISTER"])
    check.validate_dependency(artifacts["PACKAGE_DEPENDENCY_REPORT"])
    check.validate_authorization(artifacts["PACKAGE_AUTHORIZATION_RECORD"])
    check.validate_certification(artifacts["PACKAGE_ASSEMBLY_CERTIFICATION_REPORT"])
    check.validate_no_prohibited_truths(artifacts)


def test_rejects_wrong_member_count() -> None:
    members = _members()
    _assert_rejected(check.validate_package_members, members[:-1], "package member count")


def test_rejects_unknown_package_member() -> None:
    members = _members()
    members[-1] = "docs/governance/PCS_1/PACKAGE_SEAL_MANIFEST.json"
    _assert_rejected(check.validate_package_members, members, "unknown package members")


def test_rejects_boundary_without_pcs_exclusion() -> None:
    boundary = copy.deepcopy(_artifacts()["PACKAGE_BOUNDARY_REPORT"])
    boundary["excluded_path_roots"] = []
    with pytest.raises(SystemExit, match="PCS-1 exclusion"):
        check.validate_boundary(boundary, _members())


def test_rejects_identity_status_drift() -> None:
    identity = copy.deepcopy(_artifacts()["PACKAGE_IDENTITY_RECORD"])
    identity["package_status"] = "SEALED"
    _assert_rejected(check.validate_identity, identity, "package status")


def test_rejects_uncategorized_inventory() -> None:
    inventory = copy.deepcopy(_artifacts()["PACKAGE_INVENTORY"])
    inventory["uncategorized_allowed"] = True
    with pytest.raises(SystemExit, match="uncategorized"):
        check.validate_inventory(inventory, _counts())


def test_rejects_orphan_validator() -> None:
    composition = copy.deepcopy(_artifacts()["PACKAGE_COMPOSITION_REPORT"])
    composition["orphan_validators"] = ["scripts/check_epl_1.py"]
    with pytest.raises(SystemExit, match="orphan_validators"):
        check.validate_composition(composition, _counts())


def test_rejects_manifest_missing_certification() -> None:
    manifest = copy.deepcopy(_artifacts()["PACKAGE_MANIFEST"])
    manifest["certification_reference"] = ""
    _assert_rejected(check.validate_manifest, manifest, "certification_reference")


def test_rejects_ownership_ambiguity() -> None:
    ownership = copy.deepcopy(_artifacts()["PACKAGE_OWNERSHIP_REPORT"])
    ownership["ownership_ambiguity"] = True
    with pytest.raises(SystemExit, match="ownership_ambiguity"):
        check.validate_no_prohibited_truths({"PACKAGE_OWNERSHIP_REPORT": ownership})


def test_rejects_dependency_conflict() -> None:
    dependency = copy.deepcopy(_artifacts()["PACKAGE_DEPENDENCY_REPORT"])
    dependency["dependency_conflicts"] = ["PCS-1 incorporated too early"]
    _assert_rejected(check.validate_dependency, dependency, "dependency conflicts")


def test_rejects_authorization_that_implies_publication() -> None:
    auth = copy.deepcopy(_artifacts()["PACKAGE_AUTHORIZATION_RECORD"])
    auth["assembly_implies_publication"] = True
    _assert_rejected(check.validate_authorization, auth, "publication")


def test_rejects_certification_not_ready_for_pcs_1() -> None:
    cert = copy.deepcopy(_artifacts()["PACKAGE_ASSEMBLY_CERTIFICATION_REPORT"])
    cert["package_ready_for_pcs_1"] = False
    _assert_rejected(check.validate_certification, cert, "PCS-1")
