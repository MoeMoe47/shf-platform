#!/usr/bin/env python3
"""Validate Package H Batch 03 IGLS-1 Phase 5 governance-lock artifacts."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "docs" / "releases" / "PACKAGE_H_BATCH_03_PHASE_5"
REQUIRED_ARTIFACTS = [
    "GOVERNANCE_LOCK_SPECIFICATION",
    "IMPLEMENTATION_AUTHORIZATION_GATE",
    "CONSTITUTIONAL_READINESS_INDEX",
    "GOVERNANCE_FREEZE_MANIFEST",
    "PHASE_5_PREREQUISITE_MATRIX",
    "IMPLEMENTATION_SCOPE_AUTHORIZATION",
    "PHASE_5_AUTHORIZATION_DECISION",
    "PACKAGE_H_BATCH_03_PHASE_5_CERTIFICATION_REPORT",
    "EPL_1_PHASE_5_REGISTRATION_MAPPING",
]
REQUIRED_LOCK_IDS = {"IGLS-1", "EPL-1", "PHASE-1", "PHASE-2", "CTB-1", "BDL-1", "IRS-1", "CVF-1", "ACS-1", "EM-1", "ERP-1"}
REQUIRED_CAPABILITIES = {"B03-CAP-001", "B03-CAP-002", "B03-CAP-003", "B03-CAP-004"}
REQUIRED_TRACE = {"CTB-1", "BDL-1", "IRS-1", "ACS-1", "EM-1", "EPL-1", "GLS-1", "IAG-1", "GFM-1"}
PROHIBITED_TRUE_KEYS = {
    "implementation_performed",
    "runtime_added",
    "api_added",
    "ui_added",
    "persistence_added",
    "deployment_performed",
    "deployment_added",
    "publication_performed",
    "publication_added",
    "production_code_added",
    "production_release_performed",
    "registry_mutation_performed",
    "creates_new_evidence_system",
    "duplicate_governance_authority_created",
    "duplicate_evidence_authority_created",
    "duplicate_registry_created",
    "duplicate_runtime_owner_created",
}


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def load_json(name: str) -> dict[str, Any]:
    path = BASE / f"{name}.json"
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        fail(f"missing JSON artifact: {path.relative_to(ROOT)}")
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def walk_values(value: Any):
    if isinstance(value, dict):
        for key, item in value.items():
            yield key, item
            yield from walk_values(item)
    elif isinstance(value, list):
        for item in value:
            yield from walk_values(item)


def validate_required_files() -> dict[str, dict[str, Any]]:
    artifacts: dict[str, dict[str, Any]] = {}
    for name in REQUIRED_ARTIFACTS:
        md = BASE / f"{name}.md"
        js = BASE / f"{name}.json"
        require(md.exists(), f"missing markdown artifact: {md.relative_to(ROOT)}")
        require(js.exists(), f"missing JSON artifact: {js.relative_to(ROOT)}")
        artifacts[name] = load_json(name)
    return artifacts


def evaluate_authorization(
    gates: list[dict[str, Any]],
    conflicts: list[Any],
    blockers: list[Any],
    evidence_complete: bool,
    freeze_complete: bool,
    scope_bounded: bool,
    prohibitions_explicit: bool,
) -> str:
    if conflicts:
        return "REQUIRES_CONSTITUTIONAL_REVIEW"
    gate_results = [gate.get("result") for gate in gates]
    if any(result in {"FAIL", "BLOCKED"} for result in gate_results) or blockers:
        return "NOT_AUTHORIZED"
    if any(result != "PASS" for result in gate_results):
        return "REQUIRES_CONSTITUTIONAL_REVIEW"
    if not all((evidence_complete, freeze_complete, scope_bounded, prohibitions_explicit)):
        return "NOT_AUTHORIZED"
    return "AUTHORIZED"


def validate_gls(gls: dict[str, Any]) -> None:
    require(gls.get("artifact_id") == "GLS-1", "GLS-1 artifact_id mismatch")
    require(gls.get("status") == "LOCKED", "GLS-1 must be locked")
    records = gls.get("locked_artifacts", [])
    lock_ids = {item.get("artifact_id") for item in records}
    require(REQUIRED_LOCK_IDS <= lock_ids, "GLS-1 missing locked artifacts")
    for item in records:
        path = ROOT / item.get("canonical_path", "")
        require(path.exists(), f"locked artifact missing: {item.get('artifact_id')}")
        if path.suffix == ".json":
            json.loads(path.read_text(encoding="utf-8"))
        require(item.get("lock_state") == "LOCKED", f"{item.get('artifact_id')} not locked")
        require(item.get("validator_reference"), f"{item.get('artifact_id')} missing validator reference")
    for section in ("change_control", "inherited_prohibitions", "permitted_future_implementation_scope", "prohibited_future_implementation_scope", "unlock_conditions", "relock_conditions"):
        require(gls.get(section), f"GLS-1 missing {section}")


def validate_iag(iag: dict[str, Any]) -> None:
    gates = iag.get("gates", [])
    require(iag.get("artifact_id") == "IAG-1", "IAG-1 artifact_id mismatch")
    require(len(gates) == 20, "IAG-1 must define exactly 20 gates")
    expected_ids = {f"IAG-GATE-{number:02d}" for number in range(1, 21)}
    require({gate.get("gate_id") for gate in gates} == expected_ids, "IAG-1 gate id coverage mismatch")
    evidence_ids = set()
    for gate in gates:
        require(gate.get("result") == "PASS", f"{gate.get('gate_id')} must PASS")
        require(gate.get("blocking_classification") == "Critical", f"{gate.get('gate_id')} must be mandatory critical")
        require(gate.get("waiver_eligibility") is False, f"{gate.get('gate_id')} waiver must be disabled")
        require(gate.get("epl_1_mapping"), f"{gate.get('gate_id')} missing EPL-1 mapping")
        require(gate.get("required_evidence"), f"{gate.get('gate_id')} missing evidence")
        evidence_ids.add(gate["epl_1_mapping"])
    require(evidence_ids == {f"P5-EV-{number:02d}" for number in range(1, 21)}, "IAG-1 evidence mapping incomplete")
    result = evaluate_authorization(
        gates,
        iag.get("unresolved_constitutional_conflicts", []),
        iag.get("blockers", []),
        evidence_complete=True,
        freeze_complete=True,
        scope_bounded=True,
        prohibitions_explicit=iag.get("remaining_prohibitions_explicit") is True,
    )
    require(result == iag.get("authorization_result") == "AUTHORIZED", "IAG-1 authorization algorithm mismatch")
    require(iag.get("next_authorized_phase") == "IGLS-1 Phase 6 - GOVERNED_IMPLEMENTATION", "IAG-1 next phase mismatch")


def validate_cri(cri: dict[str, Any], iag: dict[str, Any]) -> None:
    require(cri.get("artifact_id") == "CRI-1", "CRI-1 artifact_id mismatch")
    require(cri.get("advisory_only") is True, "CRI-1 must be advisory only")
    require(cri.get("cannot_override_iag_1") is True, "CRI-1 must not override IAG-1")
    require(cri.get("readiness_state") == "READY", "CRI-1 must be ready")
    require(cri.get("score") == 100, "CRI-1 score must be 100")
    domains = cri.get("domains", [])
    require(len(domains) >= 10, "CRI-1 domains incomplete")
    require(all(domain.get("readiness_state") == "READY" for domain in domains), "CRI-1 domain not ready")
    require(iag.get("authorization_result") == "AUTHORIZED", "CRI-1 cannot compensate for non-authorized IAG-1")


def validate_gfm(gfm: dict[str, Any]) -> None:
    require(gfm.get("manifest_id") == "GFM-1", "GFM-1 manifest_id mismatch")
    require(gfm.get("manifest_status") == "COMPLETE", "GFM-1 must be complete")
    records = gfm.get("locked_artifact_records", [])
    record_ids = {item.get("artifact_id") for item in records}
    require(REQUIRED_LOCK_IDS <= record_ids, "GFM-1 missing lock record")
    for item in records:
        path = ROOT / item.get("canonical_path", "")
        require(path.exists(), f"GFM-1 path missing: {item.get('artifact_id')}")
        if path.suffix == ".json":
            json.loads(path.read_text(encoding="utf-8"))
        require(item.get("file_existence") == "PRESENT", f"{item.get('artifact_id')} file state invalid")
        require(item.get("json_parse_state") == "PASS", f"{item.get('artifact_id')} JSON state invalid")
        require(item.get("lock_state") == "LOCKED", f"{item.get('artifact_id')} lock state invalid")
    require(set(gfm.get("authorized_phase_6_scope", [])) == REQUIRED_CAPABILITIES, "GFM-1 authorized scope mismatch")
    require(gfm.get("final_authorization_decision") == "AUTHORIZED", "GFM-1 decision mismatch")


def validate_prerequisites(matrix: dict[str, Any]) -> None:
    require(matrix.get("artifact_id") == "P5PM-1", "P5PM-1 artifact_id mismatch")
    require(matrix.get("all_prerequisites_pass") is True, "P5PM-1 prerequisites must pass")
    prerequisites = matrix.get("prerequisites", [])
    source_ids = {item.get("source_id") for item in prerequisites}
    require(REQUIRED_LOCK_IDS <= source_ids, "P5PM-1 missing prerequisite")
    for item in prerequisites:
        path = ROOT / item.get("source_path", "")
        require(path.exists(), f"P5PM-1 missing source path: {item.get('source_id')}")
        require(item.get("result") == "PASS", f"P5PM-1 prerequisite not passing: {item.get('source_id')}")
        require(item.get("gate", "").startswith("IAG-GATE-"), f"P5PM-1 missing gate: {item.get('source_id')}")
        require(item.get("evidence", "").startswith("P5-EV-"), f"P5PM-1 missing evidence: {item.get('source_id')}")


def validate_scope(scope: dict[str, Any]) -> None:
    require(scope.get("artifact_id") == "ISA-1", "ISA-1 artifact_id mismatch")
    require(scope.get("authorization_result") == "AUTHORIZED", "ISA-1 must authorize bounded scope")
    require(scope.get("authorized_next_phase") == "IGLS-1 Phase 6 - GOVERNED_IMPLEMENTATION", "ISA-1 next phase mismatch")
    capabilities = scope.get("authorized_capabilities", [])
    require({item.get("capability_id") for item in capabilities} == REQUIRED_CAPABILITIES, "ISA-1 capability coverage mismatch")
    for item in capabilities:
        require(REQUIRED_TRACE <= set(item.get("trace", [])), f"{item.get('capability_id')} trace incomplete")
    require(scope.get("no_phase_beyond_6_authorized") is True, "ISA-1 must not authorize beyond Phase 6")
    require(scope.get("continuing_prohibitions"), "ISA-1 continuing prohibitions missing")


def validate_decision(decision: dict[str, Any], iag: dict[str, Any], scope: dict[str, Any], gfm: dict[str, Any]) -> None:
    require(decision.get("artifact_id") == "P5AD-1", "P5AD-1 artifact_id mismatch")
    require(decision.get("decision") == iag.get("authorization_result") == gfm.get("final_authorization_decision") == "AUTHORIZED", "decision mismatch")
    require(set(decision.get("authorized_capabilities", [])) == {item.get("capability_id") for item in scope.get("authorized_capabilities", [])}, "decision scope mismatch")
    require(decision.get("requires_constitutional_review") is False, "decision must not require constitutional review")
    require(not decision.get("blockers"), "decision blockers present")
    require(not decision.get("constitutional_conflicts"), "decision conflicts present")


def validate_report(report: dict[str, Any], decision: dict[str, Any]) -> None:
    require(report.get("artifact_id") == "P5CR-1", "P5CR-1 artifact_id mismatch")
    require(report.get("certification_state") == "PACKAGE_H_BATCH_03_PHASE_5_CERTIFIED", "Phase 5 certification state mismatch")
    require(report.get("decision") == decision.get("decision") == "AUTHORIZED", "report decision mismatch")
    require(report.get("runtime_or_production_changes_introduced") is False, "report must not introduce runtime or production changes")
    require(not report.get("blockers"), "report blockers present")
    require(not report.get("constitutional_conflicts"), "report conflicts present")


def validate_epl_mapping(mapping: dict[str, Any], iag: dict[str, Any]) -> None:
    require(mapping.get("artifact_id") == "P5ERP-1", "P5ERP-1 artifact_id mismatch")
    require(mapping.get("uses_permanent_epl_1") is True, "P5ERP-1 must use EPL-1")
    require(mapping.get("creates_new_evidence_system") is False, "P5ERP-1 must not create evidence system")
    records = mapping.get("phase_5_evidence_records", [])
    require(len(records) == 20, "P5ERP-1 must map 20 evidence records")
    evidence_ids = {item.get("evidence_id") for item in records}
    gate_ids = {item.get("gate") for item in records}
    require(evidence_ids == {f"P5-EV-{number:02d}" for number in range(1, 21)}, "P5ERP-1 evidence coverage mismatch")
    require(gate_ids == {gate.get("gate_id") for gate in iag.get("gates", [])}, "P5ERP-1 gate coverage mismatch")
    require(mapping.get("all_iag_gates_mapped") is True, "P5ERP-1 gate mapping flag false")
    require(mapping.get("all_phase_5_artifacts_mapped") is True, "P5ERP-1 artifact mapping flag false")


def validate_no_prohibited_truths(artifacts: dict[str, dict[str, Any]]) -> None:
    for name, artifact in artifacts.items():
        for key, value in walk_values(artifact):
            if key in PROHIBITED_TRUE_KEYS:
                require(value is False, f"{name} prohibited key is true: {key}")


def validate_file_scope() -> None:
    allowed_suffixes = {".md", ".json"}
    for path in BASE.iterdir():
        require(path.is_file(), f"unexpected Phase 5 directory entry: {path.relative_to(ROOT)}")
        require(path.suffix in allowed_suffixes, f"unexpected Phase 5 file type: {path.relative_to(ROOT)}")
    require((ROOT / "scripts" / "check_package_h_batch_03_phase_5.py").exists(), "Phase 5 validator missing")
    require((ROOT / "tests" / "test_package_h_batch_03_phase_5.py").exists(), "Phase 5 tests missing")


def main() -> None:
    artifacts = validate_required_files()
    validate_gls(artifacts["GOVERNANCE_LOCK_SPECIFICATION"])
    validate_iag(artifacts["IMPLEMENTATION_AUTHORIZATION_GATE"])
    validate_cri(artifacts["CONSTITUTIONAL_READINESS_INDEX"], artifacts["IMPLEMENTATION_AUTHORIZATION_GATE"])
    validate_gfm(artifacts["GOVERNANCE_FREEZE_MANIFEST"])
    validate_prerequisites(artifacts["PHASE_5_PREREQUISITE_MATRIX"])
    validate_scope(artifacts["IMPLEMENTATION_SCOPE_AUTHORIZATION"])
    validate_decision(
        artifacts["PHASE_5_AUTHORIZATION_DECISION"],
        artifacts["IMPLEMENTATION_AUTHORIZATION_GATE"],
        artifacts["IMPLEMENTATION_SCOPE_AUTHORIZATION"],
        artifacts["GOVERNANCE_FREEZE_MANIFEST"],
    )
    validate_report(artifacts["PACKAGE_H_BATCH_03_PHASE_5_CERTIFICATION_REPORT"], artifacts["PHASE_5_AUTHORIZATION_DECISION"])
    validate_epl_mapping(artifacts["EPL_1_PHASE_5_REGISTRATION_MAPPING"], artifacts["IMPLEMENTATION_AUTHORIZATION_GATE"])
    validate_no_prohibited_truths(artifacts)
    validate_file_scope()
    print("PACKAGE_H_BATCH_03_PHASE_5_VALID")


if __name__ == "__main__":
    main()
