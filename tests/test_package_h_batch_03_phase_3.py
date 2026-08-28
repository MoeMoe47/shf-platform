from __future__ import annotations

import copy
import importlib.util
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check_package_h_batch_03_phase_3.py"

spec = importlib.util.spec_from_file_location("check_package_h_batch_03_phase_3", SCRIPT)
check = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(check)


def _artifacts():
    return check.validate_required_files()


def _assert_rejected(func, value, message: str) -> None:
    with pytest.raises(SystemExit, match=message):
        func(value)


def test_phase_3_artifacts_pass() -> None:
    artifacts = _artifacts()
    check.validate_blueprint(artifacts["CONSTITUTIONAL_TECHNICAL_BLUEPRINT"])
    check.validate_capabilities(artifacts["CAPABILITY_DECOMPOSITION"])
    check.validate_components(artifacts["COMPONENT_INVENTORY"])
    check.validate_lifecycle(artifacts["LIFECYCLE_MODEL"])
    check.validate_interactions(artifacts["INTERACTION_MODEL"])
    check.validate_contracts(artifacts["CONTRACT_MODEL"])
    check.validate_irs(artifacts["IMPLEMENTATION_READINESS_SPECIFICATION"])
    check.validate_bdl(artifacts["BLUEPRINT_DECISION_LEDGER"])
    check.validate_traceability(artifacts["TRACEABILITY_MATRIX"])
    check.validate_inheritance(artifacts["IMPLEMENTATION_INHERITANCE_RULES"])
    check.validate_no_prohibited_truths(artifacts)


def test_rejects_capability_without_owner() -> None:
    caps = copy.deepcopy(_artifacts()["CAPABILITY_DECOMPOSITION"])
    caps["capabilities"][0]["owner"] = ""
    _assert_rejected(check.validate_capabilities, caps, "owner")


def test_rejects_component_without_boundaries() -> None:
    components = copy.deepcopy(_artifacts()["COMPONENT_INVENTORY"])
    components["components"][0].pop("security_ownership")
    _assert_rejected(check.validate_components, components, "security_ownership")


def test_rejects_contract_without_validation() -> None:
    contracts = copy.deepcopy(_artifacts()["CONTRACT_MODEL"])
    contracts["contracts"][0]["validation"] = []
    _assert_rejected(check.validate_contracts, contracts, "validation")


def test_rejects_decision_without_constitutional_authority() -> None:
    ledger = copy.deepcopy(_artifacts()["BLUEPRINT_DECISION_LEDGER"])
    ledger["decisions"][0]["constitutional_authority"] = ""
    _assert_rejected(check.validate_bdl, ledger, "constitutional_authority")


def test_rejects_missing_implementation_prerequisite() -> None:
    irs = copy.deepcopy(_artifacts()["IMPLEMENTATION_READINESS_SPECIFICATION"])
    irs["implementation_prerequisites"] = []
    _assert_rejected(check.validate_irs, irs, "implementation_prerequisites")


def test_rejects_runtime_interaction_implementation() -> None:
    interactions = copy.deepcopy(_artifacts()["INTERACTION_MODEL"])
    interactions["runtime_implementation_included"] = True
    _assert_rejected(check.validate_interactions, interactions, "runtime implementation")


def test_rejects_missing_traceability() -> None:
    trace = copy.deepcopy(_artifacts()["TRACEABILITY_MATRIX"])
    trace["links"][0].pop("era_1")
    _assert_rejected(check.validate_traceability, trace, "era_1")


def test_rejects_inheritance_redefinition_gap() -> None:
    rules = copy.deepcopy(_artifacts()["IMPLEMENTATION_INHERITANCE_RULES"])
    rules["implementation_may_not_redefine"].remove("Decision Ledger")
    _assert_rejected(check.validate_inheritance, rules, "inheritance")


def test_rejects_implementation_artifact_flag() -> None:
    artifacts = _artifacts()
    mutated = copy.deepcopy(artifacts)
    mutated["BLUEPRINT_CERTIFICATION_REPORT"]["implementation_occurred"] = True
    with pytest.raises(SystemExit, match="implementation_occurred"):
        check.validate_no_prohibited_truths(mutated)
