from __future__ import annotations

import copy
import importlib.util
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check_package_h_batch_03_phase_1.py"

spec = importlib.util.spec_from_file_location("check_package_h_batch_03_phase_1", SCRIPT)
check = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(check)


def _artifacts():
    return check.validate_required_files()


def _assert_rejected(func, value, message: str) -> None:
    with pytest.raises(SystemExit, match=message):
        func(value)


def test_phase_1_artifacts_pass() -> None:
    artifacts = _artifacts()
    check.validate_mission_definition(artifacts["MISSION_DEFINITION"])
    check.validate_alignment(artifacts["MISSION_ALIGNMENT_MATRIX"])
    check.validate_boundaries(artifacts["MISSION_BOUNDARY_ANALYSIS"])
    check.validate_evidence(artifacts["MISSION_EVIDENCE_MATRIX"])
    check.validate_authorization(artifacts["MISSION_AUTHORIZATION"])
    check.validate_no_prohibited_truths(artifacts)


def test_rejects_missing_mission_completeness() -> None:
    mission = copy.deepcopy(_artifacts()["MISSION_DEFINITION"])
    mission.pop("success_criteria")
    _assert_rejected(check.validate_mission_definition, mission, "success_criteria")


def test_rejects_missing_constitutional_alignment() -> None:
    alignment = copy.deepcopy(_artifacts()["MISSION_ALIGNMENT_MATRIX"])
    alignment["constitutional_alignment"] = alignment["constitutional_alignment"][:1]
    _assert_rejected(check.validate_alignment, alignment, "constitutional alignment incomplete")


def test_rejects_runtime_monopoly_drift() -> None:
    alignment = copy.deepcopy(_artifacts()["MISSION_ALIGNMENT_MATRIX"])
    alignment["airport_principle_review"]["runtime_monopoly"] = "YES"
    _assert_rejected(check.validate_alignment, alignment, "runtime_monopoly")


def test_rejects_missing_boundary_authority() -> None:
    boundary = copy.deepcopy(_artifacts()["MISSION_BOUNDARY_ANALYSIS"])
    boundary["does_not_replace"].pop("Truth Spine")
    _assert_rejected(check.validate_boundaries, boundary, "Truth Spine")


def test_rejects_implementation_authorization() -> None:
    auth = copy.deepcopy(_artifacts()["MISSION_AUTHORIZATION"])
    auth["engineering_authorization_granted"] = True
    _assert_rejected(check.validate_authorization, auth, "engineering authorization")


def test_rejects_evidence_redefinition() -> None:
    evidence = copy.deepcopy(_artifacts()["MISSION_EVIDENCE_MATRIX"])
    evidence["future_implementation_may_redefine_evidence"] = True
    _assert_rejected(check.validate_evidence, evidence, "redefine evidence")


def test_rejects_prohibited_runtime_flag() -> None:
    artifacts = copy.deepcopy(_artifacts())
    artifacts["MISSION_CERTIFICATION_REPORT"]["runtime_added"] = True
    with pytest.raises(SystemExit, match="runtime_added"):
        check.validate_no_prohibited_truths(artifacts)
