from __future__ import annotations

import copy
import importlib.util
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check_package_h_batch_03_phase_6.py"

spec = importlib.util.spec_from_file_location("check_package_h_batch_03_phase_6", SCRIPT)
check = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(check)


def _artifacts():
    return check.validate_required_files()


def _assert_rejected(func, *args, message: str) -> None:
    with pytest.raises(SystemExit, match=message):
        func(*args)


def test_phase_6_package_passes() -> None:
    artifacts = _artifacts()
    check.validate_phase5_authorization()
    check.validate_authoritative_sources()
    check.validate_implementation_symbols()
    check.validate_register(artifacts["CAPABILITY_IMPLEMENTATION_REGISTER"])
    check.validate_capability_reports(artifacts)
    check.validate_traceability(artifacts["IMPLEMENTATION_TRACEABILITY_MATRIX"])
    check.validate_evidence(artifacts["IMPLEMENTATION_EVIDENCE_MATRIX"], artifacts["EPL_1_PHASE_6_REGISTRATION_MAPPING"])
    check.validate_scope(artifacts["PHASE_6_SCOPE_INTEGRITY_REPORT"])
    check.validate_manifest(artifacts["PACKAGE_H_BATCH_03_PHASE_6_MANIFEST"])
    check.validate_decision(artifacts)
    check.validate_test_files()


def test_rejects_missing_authorized_capability() -> None:
    register = copy.deepcopy(_artifacts()["CAPABILITY_IMPLEMENTATION_REGISTER"])
    register["capabilities"] = register["capabilities"][:-1]
    _assert_rejected(check.validate_register, register, message="capability")


def test_rejects_unauthorized_capability() -> None:
    manifest = copy.deepcopy(_artifacts()["PACKAGE_H_BATCH_03_PHASE_6_MANIFEST"])
    manifest["unauthorized_capabilities"] = ["B03-CAP-999"]
    _assert_rejected(check.validate_manifest, manifest, message="unauthorized")


def test_rejects_missing_traceability_symbol() -> None:
    trace = copy.deepcopy(_artifacts()["IMPLEMENTATION_TRACEABILITY_MATRIX"])
    trace["rows"][0]["implementation_symbol"] = "missing_symbol"
    _assert_rejected(check.validate_traceability, trace, message="symbol")


def test_rejects_unmapped_acceptance_criterion() -> None:
    trace = copy.deepcopy(_artifacts()["IMPLEMENTATION_TRACEABILITY_MATRIX"])
    trace["unmapped_acceptance_criteria"] = ["ACS-1-001"]
    _assert_rejected(check.validate_traceability, trace, message="unmapped")


def test_rejects_orphan_evidence() -> None:
    trace = copy.deepcopy(_artifacts()["IMPLEMENTATION_TRACEABILITY_MATRIX"])
    trace["orphan_evidence_requirements"] = ["EM-1-001"]
    _assert_rejected(check.validate_traceability, trace, message="orphan")


def test_rejects_evidence_not_mapped_to_epl_1() -> None:
    artifacts = _artifacts()
    mapping = copy.deepcopy(artifacts["EPL_1_PHASE_6_REGISTRATION_MAPPING"])
    mapping["evidence_records"] = mapping["evidence_records"][:-1]
    _assert_rejected(check.validate_evidence, artifacts["IMPLEMENTATION_EVIDENCE_MATRIX"], mapping, message="EPL-1")


def test_rejects_duplicate_evidence_authority() -> None:
    mapping = copy.deepcopy(_artifacts()["EPL_1_PHASE_6_REGISTRATION_MAPPING"])
    mapping["creates_new_evidence_system"] = True
    _assert_rejected(check.validate_evidence, _artifacts()["IMPLEMENTATION_EVIDENCE_MATRIX"], mapping, message="evidence system")


def test_rejects_scope_expansion_flags() -> None:
    scope = copy.deepcopy(_artifacts()["PHASE_6_SCOPE_INTEGRITY_REPORT"])
    scope["new_registry_created"] = True
    _assert_rejected(check.validate_scope, scope, message="new_registry_created")


def test_rejects_deployment_flag() -> None:
    manifest = copy.deepcopy(_artifacts()["PACKAGE_H_BATCH_03_PHASE_6_MANIFEST"])
    manifest["deployment_performed"] = True
    _assert_rejected(check.validate_manifest, manifest, message="deployment")


def test_rejects_phase_6_self_authorizing_production() -> None:
    readiness = copy.deepcopy(_artifacts()["PHASE_6_CERTIFICATION_READINESS_REPORT"])
    readiness["production_release_authorized"] = True
    with pytest.raises(SystemExit, match="production_release_authorized"):
        check.validate_scope(readiness)


def test_rejects_wrong_next_phase() -> None:
    readiness = copy.deepcopy(_artifacts()["PHASE_6_CERTIFICATION_READINESS_REPORT"])
    readiness["next_authorized_phase"] = "IGLS-1 Phase 8 - DEPLOYMENT"
    artifacts = _artifacts()
    artifacts["PHASE_6_CERTIFICATION_READINESS_REPORT"] = readiness
    _assert_rejected(check.validate_decision, artifacts, message="next phase")


def test_rejects_missing_phase_7_boundary() -> None:
    readiness = copy.deepcopy(_artifacts()["PHASE_6_CERTIFICATION_READINESS_REPORT"])
    readiness["does_not_replace_phase_7"] = False
    artifacts = _artifacts()
    artifacts["PHASE_6_CERTIFICATION_READINESS_REPORT"] = readiness
    _assert_rejected(check.validate_decision, artifacts, message="Phase 7")
