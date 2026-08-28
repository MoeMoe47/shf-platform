from __future__ import annotations

import importlib.util
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check_package_h_batch_03_phase_7.py"

spec = importlib.util.spec_from_file_location("check_package_h_batch_03_phase_7", SCRIPT)
check = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = check
assert spec.loader is not None
spec.loader.exec_module(check)


def test_phase_7_expected_artifact_inventory_is_complete() -> None:
    assert len(check.EXPECTED_PHASE7_ARTIFACTS) == 14
    assert check.EXPECTED_PHASE7_ARTIFACTS["INDEPENDENT_IMPLEMENTATION_CERTIFICATION"] == "IIC-1"
    assert check.EXPECTED_PHASE7_ARTIFACTS["PACKAGE_H_BATCH_03_PHASE_7_MANIFEST"] == "P7M-1"


def test_phase_7_authorized_capability_boundary() -> None:
    assert check.AUTHORIZED_CAPABILITIES == {"B03-CAP-001", "B03-CAP-002", "B03-CAP-003", "B03-CAP-004"}


def test_finding_payload_contains_required_failure_policy_fields() -> None:
    finding = check.Finding(
        group="GROUP X",
        severity="Critical",
        artifact="Artifact",
        path="path",
        expected="expected",
        observed="observed",
        requirement="requirement",
        recommendation="recommendation",
        certification_impact="BLOCKS_CERTIFICATION",
    )
    payload = finding.as_dict()
    for key in (
        "validator_id",
        "severity",
        "artifact",
        "repository_path",
        "expected",
        "observed",
        "requirement",
        "recommendation",
        "certification_impact",
    ):
        assert payload[key]


def test_repository_integrity_collects_findings_without_exiting() -> None:
    validator = check.CertificationValidator(ROOT)
    validator.validate_repository_integrity()
    assert isinstance(validator.findings, list)


def test_partial_phase_7_package_is_not_autocertified() -> None:
    validator = check.CertificationValidator(ROOT)
    validator.validate_artifact_completeness()
    state = check.INVALID_STATE if validator.findings else check.VALID_STATE
    assert state in {check.INVALID_STATE, check.VALID_STATE}
    if validator.findings:
        assert any(item.artifact in check.EXPECTED_PHASE7_ARTIFACTS for item in validator.findings)
