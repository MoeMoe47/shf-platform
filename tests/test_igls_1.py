from __future__ import annotations

import copy
import importlib.util
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check_igls_1.py"

spec = importlib.util.spec_from_file_location("check_igls_1", SCRIPT)
check_igls_1 = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(check_igls_1)


def _fixtures():
    contract = check_igls_1.load_json(ROOT / "docs/governance/IGLS_1_IMPLEMENTATION_GOVERNANCE_LIFECYCLE_STANDARD.json")
    manifest = check_igls_1.load_json(ROOT / "docs/governance/IGLS_1_ARTIFACT_MANIFEST.json")
    lock = check_igls_1.load_json(ROOT / "docs/governance/IGLS_1_GOVERNANCE_LOCK.json")
    return contract, manifest, lock


def _assert_rejected(contract, manifest, lock, message: str) -> None:
    with pytest.raises(SystemExit, match=message):
        check_igls_1.validate_contract(contract, manifest, lock)


def test_canonical_igls_1_artifacts_pass_contract_validation() -> None:
    contract, manifest, lock = _fixtures()
    check_igls_1.validate_contract(contract, manifest, lock)


def test_rejects_missing_lifecycle_phase() -> None:
    contract, manifest, lock = _fixtures()
    contract = copy.deepcopy(contract)
    contract["lifecycle_phases"] = contract["lifecycle_phases"][:-1]
    _assert_rejected(contract, manifest, lock, "exactly ten lifecycle phases")


def test_rejects_incorrect_phase_ordering() -> None:
    contract, manifest, lock = _fixtures()
    contract = copy.deepcopy(contract)
    contract["lifecycle_phases"][0], contract["lifecycle_phases"][1] = contract["lifecycle_phases"][1], contract["lifecycle_phases"][0]
    _assert_rejected(contract, manifest, lock, "phase ordering")


def test_rejects_missing_governance_lock() -> None:
    contract, manifest, lock = _fixtures()
    lock = copy.deepcopy(lock)
    lock["standard_id"] = "WRONG"
    _assert_rejected(contract, manifest, lock, "lock standard id mismatch")


def test_rejects_missing_separation_of_duty_rule() -> None:
    contract, manifest, lock = _fixtures()
    contract = copy.deepcopy(contract)
    contract["separation_of_duties"] = contract["separation_of_duties"][:2]
    _assert_rejected(contract, manifest, lock, "separation-of-duty")


def test_rejects_missing_evidence_traceability() -> None:
    contract, manifest, lock = _fixtures()
    contract = copy.deepcopy(contract)
    contract["traceability_chain"].remove("Evidence")
    _assert_rejected(contract, manifest, lock, "traceability chain")


def test_rejects_unknown_acceptance_classification() -> None:
    contract, manifest, lock = _fixtures()
    contract = copy.deepcopy(contract)
    contract["acceptance_classifications"]["OPTIONAL"] = {}
    _assert_rejected(contract, manifest, lock, "acceptance classifications")


def test_rejects_missing_publication_verification() -> None:
    contract, manifest, lock = _fixtures()
    contract = copy.deepcopy(contract)
    contract["lifecycle_phases"] = [phase for phase in contract["lifecycle_phases"] if phase["phase_id"] != "POST_PUBLICATION_VERIFICATION"]
    _assert_rejected(contract, manifest, lock, "exactly ten lifecycle phases")


def test_rejects_missing_next_package_authorization() -> None:
    contract, manifest, lock = _fixtures()
    contract = copy.deepcopy(contract)
    contract["phase_order"] = contract["phase_order"][:-1]
    contract["lifecycle_phases"] = contract["lifecycle_phases"][:-1]
    _assert_rejected(contract, manifest, lock, "exactly ten lifecycle phases")


def test_rejects_markdown_json_version_mismatch() -> None:
    contract, manifest, lock = _fixtures()
    lock = copy.deepcopy(lock)
    lock["version"] = "2.0"
    _assert_rejected(contract, manifest, lock, "lock version mismatch")


def test_rejects_duplicate_phase_identifier() -> None:
    contract, manifest, lock = _fixtures()
    contract = copy.deepcopy(contract)
    contract["lifecycle_phases"][-1] = copy.deepcopy(contract["lifecycle_phases"][0])
    _assert_rejected(contract, manifest, lock, "phase ordering")


def test_rejects_missing_template() -> None:
    contract, manifest, lock = _fixtures()
    manifest = copy.deepcopy(manifest)
    manifest["templates"] = manifest["templates"][:-1]
    _assert_rejected(contract, manifest, lock, "template list incomplete")


def test_rejects_unauthorized_authority_declaration() -> None:
    contract, manifest, lock = _fixtures()
    contract = copy.deepcopy(contract)
    contract["authority_registration"]["runtime_layer"] = True
    _assert_rejected(contract, manifest, lock, "runtime layer")
