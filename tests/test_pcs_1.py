from __future__ import annotations

import copy
import importlib.util
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check_pcs_1.py"

spec = importlib.util.spec_from_file_location("check_pcs_1", SCRIPT)
check = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(check)


def _artifacts():
    return check.validate_required_files()


def _pas():
    return check.validate_pas_inputs()


def _assert_rejected(func, value, message: str) -> None:
    with pytest.raises(SystemExit, match=message):
        func(value)


def test_pcs_1_artifacts_pass() -> None:
    artifacts = _artifacts()
    pas = _pas()
    check.validate_standard(artifacts["PCS_1_PACKAGE_CONSTITUTIONAL_SEALING_STANDARD"])
    check.validate_seal_spec(artifacts["PACKAGE_SEAL_SPECIFICATION"])
    check.validate_boundary(artifacts["PACKAGE_BOUNDARY_SPECIFICATION"])
    check.validate_completeness(artifacts["PACKAGE_COMPLETENESS_SPECIFICATION"])
    check.validate_integrity(artifacts["PACKAGE_INTEGRITY_SPECIFICATION"])
    check.validate_manifest_spec(artifacts["PACKAGE_MANIFEST_SPECIFICATION"])
    check.validate_traceability(artifacts["PACKAGE_TRACEABILITY_SPECIFICATION"])
    check.validate_version(artifacts["PACKAGE_VERSION_SPECIFICATION"])
    check.validate_record_template(artifacts["PACKAGE_SEAL_RECORD_TEMPLATE"])
    check.validate_reseal_policy(artifacts["PACKAGE_RESEAL_POLICY"])
    check.validate_certification(artifacts["PACKAGE_SEAL_CERTIFICATION_REPORT"])
    check.validate_seal_record(artifacts["PACKAGE_CONSTITUTIONAL_SEAL_RECORD"], pas)
    check.validate_certificate(artifacts["PACKAGE_SEAL_CERTIFICATE"])
    check.validate_manifest(artifacts["PACKAGE_SEAL_MANIFEST"], pas)
    check.validate_registry_entry(artifacts["PACKAGE_SEAL_REGISTRY_ENTRY"])
    check.validate_integrity_certificate(artifacts["PACKAGE_INTEGRITY_CERTIFICATE"])
    check.validate_authorization(artifacts["PACKAGE_SEAL_AUTHORIZATION"])
    check.validate_audit(artifacts["PACKAGE_SEAL_AUDIT_RECORD"])
    check.validate_transition(artifacts["PACKAGE_STATUS_TRANSITION_RECORD"])
    check.validate_summary(artifacts["PACKAGE_SEAL_SUMMARY"])
    check.validate_no_prohibited_truths(artifacts)


def test_rejects_missing_package_component() -> None:
    standard = copy.deepcopy(_artifacts()["PCS_1_PACKAGE_CONSTITUTIONAL_SEALING_STANDARD"])
    standard["package_components"].remove("Evidence")
    _assert_rejected(check.validate_standard, standard, "package components")


def test_rejects_missing_seal_field() -> None:
    seal = copy.deepcopy(_artifacts()["PACKAGE_SEAL_SPECIFICATION"])
    seal["seal_required_fields"].remove("Integrity Hash")
    _assert_rejected(check.validate_seal_spec, seal, "seal fields")


def test_rejects_identity_mutation_in_seal_record() -> None:
    seal = copy.deepcopy(_artifacts()["PACKAGE_CONSTITUTIONAL_SEAL_RECORD"])
    seal["package_version"] = "2.0"
    _assert_rejected(lambda value: check.validate_seal_record(value, _pas()), seal, "package version")


def test_rejects_pas_member_count_drift_in_manifest() -> None:
    manifest = copy.deepcopy(_artifacts()["PACKAGE_SEAL_MANIFEST"])
    manifest["pas_1_member_count"] = 194
    _assert_rejected(lambda value: check.validate_manifest(value, _pas()), manifest, "member count")


def test_rejects_orphan_artifacts_permission() -> None:
    completeness = copy.deepcopy(_artifacts()["PACKAGE_COMPLETENESS_SPECIFICATION"])
    completeness["orphan_artifacts_allowed"] = True
    with pytest.raises(SystemExit, match="orphan_artifacts_allowed"):
        check.validate_no_prohibited_truths({"PACKAGE_COMPLETENESS_SPECIFICATION": completeness})


def test_rejects_runtime_expansion() -> None:
    record = copy.deepcopy(_artifacts()["PACKAGE_CONSTITUTIONAL_SEAL_RECORD"])
    record["runtime_expansion"] = True
    with pytest.raises(SystemExit, match="runtime_expansion"):
        check.validate_no_prohibited_truths({"PACKAGE_CONSTITUTIONAL_SEAL_RECORD": record})


def test_rejects_publication_authorization() -> None:
    auth = copy.deepcopy(_artifacts()["PACKAGE_SEAL_AUTHORIZATION"])
    auth["publication_authorized"] = True
    _assert_rejected(check.validate_authorization, auth, "publication")


def test_rejects_invalid_state_transition() -> None:
    transition = copy.deepcopy(_artifacts()["PACKAGE_STATUS_TRANSITION_RECORD"])
    transition["to_status"] = "PACKAGE_H_BATCH_03_PUBLISHED"
    _assert_rejected(check.validate_transition, transition, "to-status")


def test_rejects_missing_integrity_check() -> None:
    cert = copy.deepcopy(_artifacts()["PACKAGE_INTEGRITY_CERTIFICATE"])
    cert["verified_integrity"].remove("Evidence integrity")
    _assert_rejected(check.validate_integrity_certificate, cert, "integrity coverage")


def test_rejects_summary_readiness_drift() -> None:
    summary = copy.deepcopy(_artifacts()["PACKAGE_SEAL_SUMMARY"])
    summary["package_ready_for_gwrrc_1"] = False
    _assert_rejected(check.validate_summary, summary, "GWRRC-1")


def test_rejects_certification_state_drift() -> None:
    cert = copy.deepcopy(_artifacts()["PACKAGE_SEAL_CERTIFICATION_REPORT"])
    cert["certification_state"] = "STANDARD_READY"
    _assert_rejected(check.validate_certification, cert, "certification state")
