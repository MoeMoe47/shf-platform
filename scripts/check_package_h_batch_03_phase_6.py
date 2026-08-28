#!/usr/bin/env python3
"""Validate Package H Batch 03 IGLS-1 Phase 6 governed implementation."""

from __future__ import annotations

import ast
import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "docs" / "releases" / "PACKAGE_H_BATCH_03_PHASE_6"
PHASE3 = ROOT / "docs" / "releases" / "PACKAGE_H_BATCH_03_PHASE_3"
PHASE4 = ROOT / "docs" / "releases" / "PACKAGE_H_BATCH_03_PHASE_4"
PHASE5 = ROOT / "docs" / "releases" / "PACKAGE_H_BATCH_03_PHASE_5"
EPL1 = ROOT / "docs" / "governance" / "EPL_1"
IMPLEMENTATION_FILE = ROOT / "services" / "shf-agent-fabric" / "services" / "extension_kernel" / "runtime_owner_closure.py"
EXPORT_FILE = ROOT / "services" / "shf-agent-fabric" / "services" / "extension_kernel" / "__init__.py"
CAPABILITY_TEST = ROOT / "services" / "shf-agent-fabric" / "tests" / "test_extension_kernel_runtime_owner_closure.py"
PHASE6_TEST = ROOT / "tests" / "test_package_h_batch_03_phase_6.py"

REQUIRED_ARTIFACTS = [
    "GOVERNED_IMPLEMENTATION_PLAN",
    "CAPABILITY_IMPLEMENTATION_REGISTER",
    "B03_CAP_001_IMPLEMENTATION_REPORT",
    "B03_CAP_002_IMPLEMENTATION_REPORT",
    "B03_CAP_003_IMPLEMENTATION_REPORT",
    "B03_CAP_004_IMPLEMENTATION_REPORT",
    "IMPLEMENTATION_TRACEABILITY_MATRIX",
    "IMPLEMENTATION_EVIDENCE_MATRIX",
    "EPL_1_PHASE_6_REGISTRATION_MAPPING",
    "IMPLEMENTATION_CONFORMANCE_REPORT",
    "PHASE_6_SCOPE_INTEGRITY_REPORT",
    "PHASE_6_CERTIFICATION_READINESS_REPORT",
    "PACKAGE_H_BATCH_03_PHASE_6_MANIFEST",
]
EXPECTED_IDS = {
    "GOVERNED_IMPLEMENTATION_PLAN": "P6GIP-1",
    "CAPABILITY_IMPLEMENTATION_REGISTER": "P6CIR-1",
    "B03_CAP_001_IMPLEMENTATION_REPORT": "P6CAP001-IR-1",
    "B03_CAP_002_IMPLEMENTATION_REPORT": "P6CAP002-IR-1",
    "B03_CAP_003_IMPLEMENTATION_REPORT": "P6CAP003-IR-1",
    "B03_CAP_004_IMPLEMENTATION_REPORT": "P6CAP004-IR-1",
    "IMPLEMENTATION_TRACEABILITY_MATRIX": "P6ITM-1",
    "IMPLEMENTATION_EVIDENCE_MATRIX": "P6IEM-1",
    "EPL_1_PHASE_6_REGISTRATION_MAPPING": "P6ERP-1",
    "IMPLEMENTATION_CONFORMANCE_REPORT": "P6ICR-1",
    "PHASE_6_SCOPE_INTEGRITY_REPORT": "P6SIR-1",
    "PHASE_6_CERTIFICATION_READINESS_REPORT": "P6CRR-1",
    "PACKAGE_H_BATCH_03_PHASE_6_MANIFEST": "P6M-1",
}
AUTHORIZED_CAPABILITIES = {"B03-CAP-001", "B03-CAP-002", "B03-CAP-003", "B03-CAP-004"}
ACS_BY_CAP = {"B03-CAP-001": "ACS-1-001", "B03-CAP-002": "ACS-1-002", "B03-CAP-003": "ACS-1-003", "B03-CAP-004": "ACS-1-004"}
EM_BY_CAP = {"B03-CAP-001": "EM-1-001", "B03-CAP-002": "EM-1-002", "B03-CAP-003": "EM-1-003", "B03-CAP-004": "EM-1-004"}
SYMBOLS_BY_CAP = {
    "B03-CAP-001": {"evaluate_owner_activation_readiness"},
    "B03-CAP-002": {"evaluate_integration_boundary", "IntegrationBoundaryRequest"},
    "B03-CAP-003": {"produce_evidence_trust_envelope", "EvidenceEnvelopeInput"},
    "B03-CAP-004": {"evaluate_runtime_minimalism", "RuntimeMinimalismRequest"},
}
PROHIBITED_TRUE_KEYS = {
    "new_constitutional_layer_created",
    "new_canonical_owner_created",
    "new_registry_created",
    "duplicate_evidence_authority_created",
    "duplicate_runtime_owner_created",
    "api_route_created",
    "ui_surface_created",
    "persistence_created",
    "deployment_configuration_created",
    "publication_performed",
    "production_release_performed",
    "prior_certified_artifacts_materially_modified",
    "unauthorized_public_contract_created",
    "architecture_redesign_occurred",
    "creates_new_evidence_system",
    "deployment_authorized",
    "publication_authorized",
    "production_release_authorized",
}


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def load_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        fail(f"missing JSON: {path.relative_to(ROOT)}")
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
        artifact = load_json(js)
        require(artifact.get("artifact") == name, f"{name} artifact field mismatch")
        require(artifact.get("artifact_id") == EXPECTED_IDS[name], f"{name} artifact_id mismatch")
        artifacts[name] = artifact
    return artifacts


def validate_phase5_authorization() -> None:
    isa = load_json(PHASE5 / "IMPLEMENTATION_SCOPE_AUTHORIZATION.json")
    p5ad = load_json(PHASE5 / "PHASE_5_AUTHORIZATION_DECISION.json")
    iag = load_json(PHASE5 / "IMPLEMENTATION_AUTHORIZATION_GATE.json")
    require(isa.get("authorization_result") == "AUTHORIZED", "Phase 5 ISA-1 not authorized")
    require(iag.get("authorization_result") == "AUTHORIZED", "Phase 5 IAG-1 not authorized")
    require(p5ad.get("decision") == "AUTHORIZED", "Phase 5 decision not authorized")
    require({item.get("capability_id") for item in isa.get("authorized_capabilities", [])} == AUTHORIZED_CAPABILITIES, "Phase 5 authorized capabilities mismatch")
    require(set(p5ad.get("authorized_capabilities", [])) == AUTHORIZED_CAPABILITIES, "Phase 5 decision capability mismatch")


def validate_authoritative_sources() -> None:
    for path in (
        PHASE3 / "CAPABILITY_DECOMPOSITION.json",
        PHASE3 / "COMPONENT_INVENTORY.json",
        PHASE3 / "CONTRACT_MODEL.json",
        PHASE3 / "BLUEPRINT_DECISION_LEDGER.json",
        PHASE3 / "IMPLEMENTATION_READINESS_SPECIFICATION.json",
        PHASE4 / "ACCEPTANCE_CRITERIA_SPECIFICATION.json",
        PHASE4 / "EVIDENCE_MATRIX.json",
        PHASE4 / "EPL_EVIDENCE_REGISTRATION_PLAN.json",
        EPL1 / "EPL-1_SPECIFICATION.json",
    ):
        require(path.exists(), f"missing authority: {path.relative_to(ROOT)}")
        load_json(path)


def validate_implementation_symbols() -> None:
    require(IMPLEMENTATION_FILE.exists(), "Phase 6 implementation file missing")
    tree = ast.parse(IMPLEMENTATION_FILE.read_text(encoding="utf-8"))
    names = {node.name for node in ast.walk(tree) if isinstance(node, (ast.FunctionDef, ast.ClassDef))}
    required_symbols = set().union(*SYMBOLS_BY_CAP.values())
    require(required_symbols <= names, "implementation symbols incomplete")
    for node in ast.walk(tree):
        modules: list[str]
        if isinstance(node, ast.Import):
            modules = [alias.name for alias in node.names]
        elif isinstance(node, ast.ImportFrom):
            modules = [node.module or ""]
        else:
            continue
        for module in modules:
            require(not module.startswith(("fastapi", "requests", "httpx", "sqlalchemy")), f"prohibited runtime import: {module}")
    export_text = EXPORT_FILE.read_text(encoding="utf-8")
    for symbol in required_symbols:
        require(symbol in export_text, f"missing export: {symbol}")


def validate_register(register: dict[str, Any]) -> None:
    capabilities = register.get("capabilities", [])
    require({item.get("capability_id") for item in capabilities} == AUTHORIZED_CAPABILITIES, "register capability coverage mismatch")
    for item in capabilities:
        cap = item["capability_id"]
        require(item.get("acceptance_result") == "PASS", f"{cap} acceptance not PASS")
        require(item.get("certification_readiness_state") == "READY_FOR_PHASE_7_REVIEW", f"{cap} readiness mismatch")
        require(not item.get("blockers"), f"{cap} blockers present")
        require(set(item.get("implementation_symbols", [])) & SYMBOLS_BY_CAP[cap], f"{cap} symbols missing")
        require(IMPLEMENTATION_FILE.as_posix().replace(ROOT.as_posix() + "/", "") in item.get("files_changed", []), f"{cap} implementation file missing")
    require(register.get("all_authorized_capabilities_implemented") is True, "authorized capability flag false")
    require(not register.get("unauthorized_capabilities_implemented"), "unauthorized capabilities implemented")


def validate_capability_reports(artifacts: dict[str, dict[str, Any]]) -> None:
    for cap, acs in ACS_BY_CAP.items():
        suffix = cap.replace("B03-CAP-", "")
        report = artifacts[f"B03_CAP_{suffix}_IMPLEMENTATION_REPORT"]
        require(report.get("capability_id") == cap, f"{cap} report capability mismatch")
        require(report.get("acs_1_acceptance_criteria") == [acs], f"{cap} ACS mismatch")
        require(report.get("em_1_evidence_requirements") == [EM_BY_CAP[cap]], f"{cap} EM mismatch")
        require(report.get("acceptance_result") == "PASS", f"{cap} acceptance result mismatch")
        require(not report.get("blockers"), f"{cap} blockers present")


def validate_traceability(trace: dict[str, Any]) -> None:
    rows = trace.get("rows", [])
    require({row.get("ctb_1_capability") for row in rows} == AUTHORIZED_CAPABILITIES, "trace capability coverage mismatch")
    for row in rows:
        cap = row["ctb_1_capability"]
        require(row.get("acs_1_acceptance_criterion") == ACS_BY_CAP[cap], f"{cap} trace ACS mismatch")
        require(row.get("em_1_evidence_requirement") == EM_BY_CAP[cap], f"{cap} trace EM mismatch")
        require(row.get("implementation_symbol") in SYMBOLS_BY_CAP[cap], f"{cap} trace symbol mismatch")
        require(row.get("test"), f"{cap} trace test missing")
        require(row.get("validator") == "scripts/check_package_h_batch_03_phase_6.py", f"{cap} trace validator mismatch")
        require(row.get("result") == "PASS", f"{cap} trace result mismatch")
    require(not trace.get("untraceable_symbols"), "untraceable symbols present")
    require(not trace.get("unmapped_acceptance_criteria"), "unmapped acceptance criteria present")
    require(not trace.get("orphan_evidence_requirements"), "orphan evidence present")


def validate_evidence(evidence: dict[str, Any], epl_mapping: dict[str, Any]) -> None:
    records = evidence.get("evidence_records", [])
    require({item.get("capability_id") for item in records} == AUTHORIZED_CAPABILITIES, "evidence capability coverage mismatch")
    require(len(records) == 4, "Phase 6 evidence record count mismatch")
    evidence_ids = {item.get("evidence_id") for item in records}
    require(evidence_ids == {f"P6-EV-00{number}" for number in range(1, 5)}, "Phase 6 evidence ids mismatch")
    for item in records:
        cap = item["capability_id"]
        require(item.get("acceptance_criterion_id") == ACS_BY_CAP[cap], f"{cap} evidence ACS mismatch")
        require(item.get("evidence_requirement_id") == EM_BY_CAP[cap], f"{cap} evidence EM mismatch")
        require(item.get("actual_result") == "PASS", f"{cap} evidence result mismatch")
        require(item.get("chain_of_custody_state") == "READY_FOR_EPL_1_REGISTRATION", f"{cap} chain-of-custody mismatch")
    require(epl_mapping.get("uses_permanent_epl_1") is True, "EPL-1 mapping must use permanent EPL-1")
    require(epl_mapping.get("creates_new_evidence_system") is False, "EPL-1 mapping must not create evidence system")
    mapped_ids = {item.get("evidence_id") for item in epl_mapping.get("evidence_records", [])}
    require(mapped_ids == evidence_ids, "EPL-1 mapping evidence coverage mismatch")


def validate_scope(scope: dict[str, Any]) -> None:
    for key, value in walk_values(scope):
        if key in PROHIBITED_TRUE_KEYS:
            require(value is False, f"scope prohibited key true: {key}")
    require(set(scope.get("changed_implementation_files", [])) == {
        "services/shf-agent-fabric/services/extension_kernel/runtime_owner_closure.py",
        "services/shf-agent-fabric/services/extension_kernel/__init__.py",
    }, "changed implementation file list mismatch")


def validate_manifest(manifest: dict[str, Any]) -> None:
    require(set(manifest.get("required_artifacts", [])) == set(REQUIRED_ARTIFACTS), "manifest artifact coverage mismatch")
    require(set(manifest.get("implemented_capabilities", [])) == AUTHORIZED_CAPABILITIES, "manifest implemented capabilities mismatch")
    require(not manifest.get("unauthorized_capabilities"), "manifest unauthorized capabilities present")
    require(manifest.get("next_authorized_phase") == "IGLS-1 Phase 7 - INDEPENDENT_IMPLEMENTATION_CERTIFICATION", "manifest next phase mismatch")
    for key in ("deployment_performed", "publication_performed", "production_release_performed"):
        require(manifest.get(key) is False, f"manifest prohibited action true: {key}")


def validate_decision(artifacts: dict[str, dict[str, Any]]) -> None:
    crr = artifacts["PHASE_6_CERTIFICATION_READINESS_REPORT"]
    conformance = artifacts["IMPLEMENTATION_CONFORMANCE_REPORT"]
    require(crr.get("certification_readiness_decision") == "PACKAGE_H_BATCH_03_PHASE_6_CERTIFICATION_READY", "certification readiness mismatch")
    require(crr.get("next_authorized_phase") == "IGLS-1 Phase 7 - INDEPENDENT_IMPLEMENTATION_CERTIFICATION", "readiness next phase mismatch")
    require(crr.get("does_not_replace_phase_7") is True, "Phase 6 must not replace Phase 7")
    require(conformance.get("status") == "CONFORMANT", "conformance status mismatch")
    require(not conformance.get("blockers"), "conformance blockers present")
    require(not conformance.get("constitutional_conflicts"), "conformance conflicts present")


def validate_test_files() -> None:
    require(CAPABILITY_TEST.exists(), "capability test file missing")
    require(PHASE6_TEST.exists(), "Phase 6 governance test file missing")
    test_text = CAPABILITY_TEST.read_text(encoding="utf-8")
    for cap in AUTHORIZED_CAPABILITIES:
        require(cap in test_text or cap.replace("-", "_").lower()[:7] in test_text.lower(), f"{cap} not represented in capability tests")


def main() -> None:
    artifacts = validate_required_files()
    validate_phase5_authorization()
    validate_authoritative_sources()
    validate_implementation_symbols()
    validate_register(artifacts["CAPABILITY_IMPLEMENTATION_REGISTER"])
    validate_capability_reports(artifacts)
    validate_traceability(artifacts["IMPLEMENTATION_TRACEABILITY_MATRIX"])
    validate_evidence(artifacts["IMPLEMENTATION_EVIDENCE_MATRIX"], artifacts["EPL_1_PHASE_6_REGISTRATION_MAPPING"])
    validate_scope(artifacts["PHASE_6_SCOPE_INTEGRITY_REPORT"])
    validate_manifest(artifacts["PACKAGE_H_BATCH_03_PHASE_6_MANIFEST"])
    validate_decision(artifacts)
    validate_test_files()
    print("PACKAGE_H_BATCH_03_PHASE_6_VALID")


if __name__ == "__main__":
    sys.path.insert(0, str(ROOT / "services" / "shf-agent-fabric"))
    main()
