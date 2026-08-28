from __future__ import annotations

import copy
import importlib.util
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check_package_h_batch_03_phase_2.py"

spec = importlib.util.spec_from_file_location("check_package_h_batch_03_phase_2", SCRIPT)
check = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(check)


def _artifacts():
    return check.validate_required_files()


def _assert_rejected(func, value, message: str) -> None:
    with pytest.raises(SystemExit, match=message):
        func(value)


def test_phase_2_artifacts_pass() -> None:
    artifacts = _artifacts()
    check.validate_architecture_charter(artifacts["ARCHITECTURE_CHARTER"])
    check.validate_principles(artifacts["ARCHITECTURE_PRINCIPLES"])
    check.validate_owner_boundaries(artifacts["OWNER_BOUNDARY_DECLARATIONS"])
    check.validate_interactions(artifacts["LAYER_INTERACTION_MODEL"])
    check.validate_contracts(artifacts["ARCHITECTURAL_CONTRACTS"])
    check.validate_compatibility(artifacts["CONSTITUTIONAL_COMPATIBILITY_MATRIX"])
    check.validate_drift(artifacts["ARCHITECTURAL_DRIFT_PREVENTION"])
    check.validate_non_functional(artifacts["NON_FUNCTIONAL_ARCHITECTURE"])
    check.validate_blueprint_contract(artifacts["FUTURE_BLUEPRINT_CONTRACT"])
    check.validate_authorization(artifacts["ARCHITECTURE_AUTHORIZATION"])
    check.validate_no_prohibited_truths(artifacts)


def test_rejects_missing_architectural_principle() -> None:
    principles = copy.deepcopy(_artifacts()["ARCHITECTURE_PRINCIPLES"])
    principles["principles"].remove("Airport Principle")
    _assert_rejected(check.validate_principles, principles, "Airport Principle")


def test_rejects_incomplete_owner_boundary() -> None:
    owner = copy.deepcopy(_artifacts()["OWNER_BOUNDARY_DECLARATIONS"])
    owner["components"][0].pop("forbidden_dependencies")
    _assert_rejected(check.validate_owner_boundaries, owner, "forbidden_dependencies")


def test_rejects_api_contract_definition() -> None:
    contracts = copy.deepcopy(_artifacts()["ARCHITECTURAL_CONTRACTS"])
    contracts["api_definitions_included"] = True
    _assert_rejected(check.validate_contracts, contracts, "API definitions")


def test_rejects_missing_constitutional_authority() -> None:
    matrix = copy.deepcopy(_artifacts()["CONSTITUTIONAL_COMPATIBILITY_MATRIX"])
    matrix["authorities"] = [item for item in matrix["authorities"] if item["supporting_authority"] != "ERA-1"]
    _assert_rejected(check.validate_compatibility, matrix, "ERA-1")


def test_rejects_missing_drift_detection() -> None:
    drift = copy.deepcopy(_artifacts()["ARCHITECTURAL_DRIFT_PREVENTION"])
    drift["decisions"][0].pop("detection_method")
    _assert_rejected(check.validate_drift, drift, "detection_method")


def test_rejects_missing_non_functional_requirement() -> None:
    nfr = copy.deepcopy(_artifacts()["NON_FUNCTIONAL_ARCHITECTURE"])
    nfr["requirements"].pop("Auditability")
    _assert_rejected(check.validate_non_functional, nfr, "Auditability")


def test_rejects_blueprint_redefinition() -> None:
    contract = copy.deepcopy(_artifacts()["FUTURE_BLUEPRINT_CONTRACT"])
    contract["blueprint_may_not_redefine"].remove("Ownership")
    _assert_rejected(check.validate_blueprint_contract, contract, "non-redefinition")


def test_rejects_runtime_authorization() -> None:
    auth = copy.deepcopy(_artifacts()["ARCHITECTURE_AUTHORIZATION"])
    auth["runtime_authorized"] = True
    artifacts = _artifacts()
    artifacts["ARCHITECTURE_AUTHORIZATION"] = auth
    with pytest.raises(SystemExit, match="runtime_authorized"):
        check.validate_no_prohibited_truths(artifacts)
