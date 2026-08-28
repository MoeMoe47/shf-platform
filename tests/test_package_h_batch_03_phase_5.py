from __future__ import annotations

import copy
import importlib.util
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check_package_h_batch_03_phase_5.py"

spec = importlib.util.spec_from_file_location("check_package_h_batch_03_phase_5", SCRIPT)
check = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(check)


def _artifacts():
    return check.validate_required_files()


def _assert_rejected(func, *args, message: str) -> None:
    with pytest.raises(SystemExit, match=message):
        func(*args)


def test_phase_5_artifacts_pass() -> None:
    artifacts = _artifacts()
    check.validate_gls(artifacts["GOVERNANCE_LOCK_SPECIFICATION"])
    check.validate_iag(artifacts["IMPLEMENTATION_AUTHORIZATION_GATE"])
    check.validate_cri(artifacts["CONSTITUTIONAL_READINESS_INDEX"], artifacts["IMPLEMENTATION_AUTHORIZATION_GATE"])
    check.validate_gfm(artifacts["GOVERNANCE_FREEZE_MANIFEST"])
    check.validate_prerequisites(artifacts["PHASE_5_PREREQUISITE_MATRIX"])
    check.validate_scope(artifacts["IMPLEMENTATION_SCOPE_AUTHORIZATION"])
    check.validate_decision(
        artifacts["PHASE_5_AUTHORIZATION_DECISION"],
        artifacts["IMPLEMENTATION_AUTHORIZATION_GATE"],
        artifacts["IMPLEMENTATION_SCOPE_AUTHORIZATION"],
        artifacts["GOVERNANCE_FREEZE_MANIFEST"],
    )
    check.validate_report(artifacts["PACKAGE_H_BATCH_03_PHASE_5_CERTIFICATION_REPORT"], artifacts["PHASE_5_AUTHORIZATION_DECISION"])
    check.validate_epl_mapping(artifacts["EPL_1_PHASE_5_REGISTRATION_MAPPING"], artifacts["IMPLEMENTATION_AUTHORIZATION_GATE"])
    check.validate_no_prohibited_truths(artifacts)
    check.validate_file_scope()


def test_authorization_algorithm_authorizes_clean_gate_set() -> None:
    gates = [{"result": "PASS"} for _ in range(20)]
    assert check.evaluate_authorization(gates, [], [], True, True, True, True) == "AUTHORIZED"


def test_authorization_algorithm_rejects_failed_gate() -> None:
    gates = [{"result": "PASS"} for _ in range(19)] + [{"result": "FAIL"}]
    assert check.evaluate_authorization(gates, [], [], True, True, True, True) == "NOT_AUTHORIZED"


def test_authorization_algorithm_rejects_blocker() -> None:
    gates = [{"result": "PASS"} for _ in range(20)]
    assert check.evaluate_authorization(gates, [], ["blocker"], True, True, True, True) == "NOT_AUTHORIZED"


def test_authorization_algorithm_escalates_conflict() -> None:
    gates = [{"result": "PASS"} for _ in range(20)]
    assert check.evaluate_authorization(gates, ["conflict"], [], True, True, True, True) == "REQUIRES_CONSTITUTIONAL_REVIEW"


def test_authorization_algorithm_escalates_ambiguous_gate() -> None:
    gates = [{"result": "PASS"} for _ in range(19)] + [{"result": "REQUIRES_REVIEW"}]
    assert check.evaluate_authorization(gates, [], [], True, True, True, True) == "REQUIRES_CONSTITUTIONAL_REVIEW"


def test_rejects_missing_locked_artifact() -> None:
    gls = copy.deepcopy(_artifacts()["GOVERNANCE_LOCK_SPECIFICATION"])
    gls["locked_artifacts"] = [item for item in gls["locked_artifacts"] if item["artifact_id"] != "EPL-1"]
    _assert_rejected(check.validate_gls, gls, message="locked artifacts")


def test_rejects_unlocked_artifact() -> None:
    gls = copy.deepcopy(_artifacts()["GOVERNANCE_LOCK_SPECIFICATION"])
    gls["locked_artifacts"][0]["lock_state"] = "OPEN"
    _assert_rejected(check.validate_gls, gls, message="not locked")


def test_rejects_wrong_gate_count() -> None:
    iag = copy.deepcopy(_artifacts()["IMPLEMENTATION_AUTHORIZATION_GATE"])
    iag["gates"] = iag["gates"][:-1]
    _assert_rejected(check.validate_iag, iag, message="20 gates")


def test_rejects_not_applicable_gate_result() -> None:
    iag = copy.deepcopy(_artifacts()["IMPLEMENTATION_AUTHORIZATION_GATE"])
    iag["gates"][0]["result"] = "NOT_APPLICABLE"
    _assert_rejected(check.validate_iag, iag, message="must PASS")


def test_rejects_gate_without_epl_mapping() -> None:
    iag = copy.deepcopy(_artifacts()["IMPLEMENTATION_AUTHORIZATION_GATE"])
    iag["gates"][0]["epl_1_mapping"] = ""
    _assert_rejected(check.validate_iag, iag, message="EPL-1 mapping")


def test_rejects_cri_override_claim() -> None:
    artifacts = _artifacts()
    cri = copy.deepcopy(artifacts["CONSTITUTIONAL_READINESS_INDEX"])
    cri["cannot_override_iag_1"] = False
    _assert_rejected(check.validate_cri, cri, artifacts["IMPLEMENTATION_AUTHORIZATION_GATE"], message="override")


def test_rejects_incomplete_freeze_manifest() -> None:
    gfm = copy.deepcopy(_artifacts()["GOVERNANCE_FREEZE_MANIFEST"])
    gfm["locked_artifact_records"] = [item for item in gfm["locked_artifact_records"] if item["artifact_id"] != "IRS-1"]
    _assert_rejected(check.validate_gfm, gfm, message="lock record")


def test_rejects_incomplete_prerequisite_matrix() -> None:
    matrix = copy.deepcopy(_artifacts()["PHASE_5_PREREQUISITE_MATRIX"])
    matrix["all_prerequisites_pass"] = False
    _assert_rejected(check.validate_prerequisites, matrix, message="prerequisites")


def test_rejects_scope_missing_capability() -> None:
    scope = copy.deepcopy(_artifacts()["IMPLEMENTATION_SCOPE_AUTHORIZATION"])
    scope["authorized_capabilities"] = scope["authorized_capabilities"][:-1]
    _assert_rejected(check.validate_scope, scope, message="capability")


def test_rejects_scope_missing_trace() -> None:
    scope = copy.deepcopy(_artifacts()["IMPLEMENTATION_SCOPE_AUTHORIZATION"])
    scope["authorized_capabilities"][0]["trace"].remove("EPL-1")
    _assert_rejected(check.validate_scope, scope, message="trace")


def test_rejects_phase_beyond_6_authorization() -> None:
    scope = copy.deepcopy(_artifacts()["IMPLEMENTATION_SCOPE_AUTHORIZATION"])
    scope["no_phase_beyond_6_authorized"] = False
    _assert_rejected(check.validate_scope, scope, message="Phase 6")


def test_rejects_decision_scope_mismatch() -> None:
    artifacts = _artifacts()
    decision = copy.deepcopy(artifacts["PHASE_5_AUTHORIZATION_DECISION"])
    decision["authorized_capabilities"] = ["B03-CAP-001"]
    _assert_rejected(
        check.validate_decision,
        decision,
        artifacts["IMPLEMENTATION_AUTHORIZATION_GATE"],
        artifacts["IMPLEMENTATION_SCOPE_AUTHORIZATION"],
        artifacts["GOVERNANCE_FREEZE_MANIFEST"],
        message="scope",
    )


def test_rejects_report_runtime_change() -> None:
    artifacts = _artifacts()
    report = copy.deepcopy(artifacts["PACKAGE_H_BATCH_03_PHASE_5_CERTIFICATION_REPORT"])
    report["runtime_or_production_changes_introduced"] = True
    _assert_rejected(check.validate_report, report, artifacts["PHASE_5_AUTHORIZATION_DECISION"], message="runtime")


def test_rejects_incomplete_epl_registration() -> None:
    artifacts = _artifacts()
    mapping = copy.deepcopy(artifacts["EPL_1_PHASE_5_REGISTRATION_MAPPING"])
    mapping["phase_5_evidence_records"] = mapping["phase_5_evidence_records"][:-1]
    _assert_rejected(check.validate_epl_mapping, mapping, artifacts["IMPLEMENTATION_AUTHORIZATION_GATE"], message="20 evidence")


def test_rejects_duplicate_evidence_system() -> None:
    artifacts = _artifacts()
    mapping = copy.deepcopy(artifacts["EPL_1_PHASE_5_REGISTRATION_MAPPING"])
    mapping["creates_new_evidence_system"] = True
    _assert_rejected(check.validate_epl_mapping, mapping, artifacts["IMPLEMENTATION_AUTHORIZATION_GATE"], message="evidence system")


def test_rejects_prohibited_runtime_truth() -> None:
    artifacts = copy.deepcopy(_artifacts())
    artifacts["IMPLEMENTATION_SCOPE_AUTHORIZATION"]["runtime_added"] = True
    _assert_rejected(check.validate_no_prohibited_truths, artifacts, message="runtime_added")
