from __future__ import annotations

import copy
import importlib.util
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check_package_h_batch_03_phase_4.py"

spec = importlib.util.spec_from_file_location("check_package_h_batch_03_phase_4", SCRIPT)
check = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(check)


def _artifacts():
    return check.validate_required_files()


def _assert_rejected(func, *args, message: str) -> None:
    with pytest.raises(SystemExit, match=message):
        func(*args)


def test_phase_4_artifacts_pass() -> None:
    artifacts = _artifacts()
    check.validate_cvf(artifacts["CONSTITUTIONAL_VERIFICATION_FRAMEWORK"])
    check.validate_acs(artifacts["ACCEPTANCE_CRITERIA_SPECIFICATION"])
    check.validate_em(artifacts["EVIDENCE_MATRIX"], artifacts["ACCEPTANCE_CRITERIA_SPECIFICATION"])
    check.validate_erp(artifacts["EPL_EVIDENCE_REGISTRATION_PLAN"])
    check.validate_taxonomy(artifacts["VERIFICATION_TAXONOMY"])
    check.validate_failure(artifacts["FAILURE_CLASSIFICATION"])
    check.validate_traceability(artifacts["TRACEABILITY_VERIFICATION_MATRIX"], artifacts["ACCEPTANCE_CRITERIA_SPECIFICATION"])
    check.validate_no_prohibited_truths(artifacts)


def test_rejects_missing_verification_rule_trace() -> None:
    cvf = copy.deepcopy(_artifacts()["CONSTITUTIONAL_VERIFICATION_FRAMEWORK"])
    cvf["verification_dependencies"].remove("EPL-1")
    _assert_rejected(check.validate_cvf, cvf, message="EPL-1")


def test_rejects_acceptance_without_evidence_requirement() -> None:
    acs = copy.deepcopy(_artifacts()["ACCEPTANCE_CRITERIA_SPECIFICATION"])
    acs["criteria"][0]["evidence_required"] = []
    _assert_rejected(check.validate_acs, acs, message="evidence_required")


def test_rejects_orphan_acceptance_criterion() -> None:
    artifacts = _artifacts()
    em = copy.deepcopy(artifacts["EVIDENCE_MATRIX"])
    em["evidence"] = em["evidence"][1:]
    _assert_rejected(check.validate_em, em, artifacts["ACCEPTANCE_CRITERIA_SPECIFICATION"], message="evidence matrix incomplete")


def test_rejects_evidence_not_using_epl_1() -> None:
    erp = copy.deepcopy(_artifacts()["EPL_EVIDENCE_REGISTRATION_PLAN"])
    erp["uses_permanent_epl_1"] = False
    _assert_rejected(check.validate_erp, erp, message="EPL-1")


def test_rejects_new_evidence_system() -> None:
    erp = copy.deepcopy(_artifacts()["EPL_EVIDENCE_REGISTRATION_PLAN"])
    erp["creates_new_evidence_system"] = True
    _assert_rejected(check.validate_erp, erp, message="new evidence system")


def test_rejects_missing_failure_class() -> None:
    failure = copy.deepcopy(_artifacts()["FAILURE_CLASSIFICATION"])
    failure["failure_classes"] = [item for item in failure["failure_classes"] if item["severity"] != "Critical"]
    _assert_rejected(check.validate_failure, failure, message="failure classes")


def test_rejects_missing_sufficiency_state() -> None:
    failure = copy.deepcopy(_artifacts()["FAILURE_CLASSIFICATION"])
    failure["evidence_sufficiency_states"].remove("Untrusted")
    _assert_rejected(check.validate_failure, failure, message="sufficiency")


def test_rejects_missing_traceability_link() -> None:
    artifacts = _artifacts()
    trace = copy.deepcopy(artifacts["TRACEABILITY_VERIFICATION_MATRIX"])
    trace["links"][0].pop("decision_ledger")
    _assert_rejected(check.validate_traceability, trace, artifacts["ACCEPTANCE_CRITERIA_SPECIFICATION"], message="decision_ledger")


def test_rejects_runtime_flag() -> None:
    artifacts = copy.deepcopy(_artifacts())
    artifacts["CONSTITUTIONAL_VERIFICATION_REPORT"]["runtime_added"] = True
    with pytest.raises(SystemExit, match="runtime_added"):
        check.validate_no_prohibited_truths(artifacts)
