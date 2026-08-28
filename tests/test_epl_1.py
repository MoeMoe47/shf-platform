from __future__ import annotations

import copy
import importlib.util
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check_epl_1.py"

spec = importlib.util.spec_from_file_location("check_epl_1", SCRIPT)
check = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(check)


def _artifacts():
    return check.validate_required_files()


def _assert_rejected(func, value, message: str) -> None:
    with pytest.raises(SystemExit, match=message):
        func(value)


def test_epl_1_artifacts_pass() -> None:
    artifacts = _artifacts()
    check.validate_spec(artifacts["EPL-1_SPECIFICATION"])
    check.validate_evidence_model(artifacts["EVIDENCE_MODEL"])
    check.validate_chain(artifacts["CHAIN_OF_CUSTODY"])
    check.validate_lifecycle(artifacts["EVIDENCE_LIFECYCLE"])
    check.validate_traceability(artifacts["TRACEABILITY_MODEL"])
    check.validate_certification(artifacts["CERTIFICATION_MODEL"])
    check.validate_publication(artifacts["PUBLICATION_MODEL"])
    check.validate_reproducibility(artifacts["EVIDENCE_REPRODUCIBILITY"])
    check.validate_retention(artifacts["EVIDENCE_RETENTION_POLICY"])
    check.validate_governance(artifacts["EPL-1_GOVERNANCE"])
    check.validate_no_prohibited_truths(artifacts)


def test_rejects_missing_evidence_registration() -> None:
    spec = copy.deepcopy(_artifacts()["EPL-1_SPECIFICATION"])
    spec["certification_requires_registered_evidence"] = False
    _assert_rejected(check.validate_spec, spec, "registered evidence")


def test_rejects_missing_traceability_field() -> None:
    model = copy.deepcopy(_artifacts()["EVIDENCE_MODEL"])
    model["required_fields"].remove("Mission Reference")
    _assert_rejected(check.validate_evidence_model, model, "evidence fields")


def test_rejects_duplicate_id_permission() -> None:
    model = copy.deepcopy(_artifacts()["EVIDENCE_MODEL"])
    model["evidence_id_unique"] = False
    _assert_rejected(check.validate_evidence_model, model, "unique")


def test_rejects_chain_bypass() -> None:
    chain = copy.deepcopy(_artifacts()["CHAIN_OF_CUSTODY"])
    chain["bypass_allowed"] = True
    _assert_rejected(check.validate_chain, chain, "bypass")


def test_rejects_bad_lifecycle_order() -> None:
    lifecycle = copy.deepcopy(_artifacts()["EVIDENCE_LIFECYCLE"])
    lifecycle["states"].remove("Superseded")
    _assert_rejected(check.validate_lifecycle, lifecycle, "lifecycle")


def test_rejects_certification_without_supporting_evidence() -> None:
    trace = copy.deepcopy(_artifacts()["TRACEABILITY_MODEL"])
    trace["certification_must_reference_supporting_evidence"] = False
    _assert_rejected(check.validate_traceability, trace, "certification")


def test_rejects_undocumented_certification_evidence() -> None:
    cert = copy.deepcopy(_artifacts()["CERTIFICATION_MODEL"])
    cert["undocumented_evidence_allowed"] = True
    _assert_rejected(check.validate_certification, cert, "undocumented")


def test_rejects_publication_without_evidence() -> None:
    pub = copy.deepcopy(_artifacts()["PUBLICATION_MODEL"])
    pub["publication_without_evidence_allowed"] = True
    _assert_rejected(check.validate_publication, pub, "publication without evidence")


def test_rejects_missing_reproducibility() -> None:
    repro = copy.deepcopy(_artifacts()["EVIDENCE_REPRODUCIBILITY"])
    repro["required_fields"].remove("Expected Output")
    _assert_rejected(check.validate_reproducibility, repro, "reproducibility")


def test_rejects_mutable_certified_evidence() -> None:
    retention = copy.deepcopy(_artifacts()["EVIDENCE_RETENTION_POLICY"])
    retention["certified_evidence_mutable"] = True
    _assert_rejected(check.validate_retention, retention, "immutable")


def test_rejects_missing_governance_prohibition() -> None:
    governance = copy.deepcopy(_artifacts()["EPL-1_GOVERNANCE"])
    governance["prohibited_actions"].remove("Validator bypass")
    _assert_rejected(check.validate_governance, governance, "prohibited actions")


def test_rejects_runtime_flag() -> None:
    artifacts = copy.deepcopy(_artifacts())
    artifacts["EPL-1_CERTIFICATION_REPORT"]["runtime_added"] = True
    with pytest.raises(SystemExit, match="runtime_added"):
        check.validate_no_prohibited_truths(artifacts)
