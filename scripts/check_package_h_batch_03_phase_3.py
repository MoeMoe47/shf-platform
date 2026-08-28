#!/usr/bin/env python3
"""Validate Package H Batch 03 IGLS-1 Phase 3 blueprint artifacts."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "docs" / "releases" / "PACKAGE_H_BATCH_03_PHASE_3"
PHASE1 = ROOT / "docs" / "releases" / "PACKAGE_H_BATCH_03_PHASE_1"
PHASE2 = ROOT / "docs" / "releases" / "PACKAGE_H_BATCH_03_PHASE_2"
MISSION_ID = "PACKAGE_H_BATCH_03_IGLS_1_PHASE_3"
REQUIRED_ARTIFACTS = [
    "CONSTITUTIONAL_TECHNICAL_BLUEPRINT",
    "CAPABILITY_DECOMPOSITION",
    "COMPONENT_INVENTORY",
    "LIFECYCLE_MODEL",
    "INTERACTION_MODEL",
    "CONTRACT_MODEL",
    "IMPLEMENTATION_READINESS_SPECIFICATION",
    "BLUEPRINT_DECISION_LEDGER",
    "TRACEABILITY_MATRIX",
    "IMPLEMENTATION_INHERITANCE_RULES",
    "BLUEPRINT_CERTIFICATION_REPORT",
]
PROHIBITED_TRUE_KEYS = {
    "implementation_authorized",
    "runtime_added",
    "api_added",
    "ui_added",
    "persistence_added",
    "deployment_authorized",
    "deployment_added",
    "publication_authorized",
    "registry_mutation_authorized",
    "duplicate_authority_introduced",
    "duplicate_registry_introduced",
    "api_implementation_included",
    "runtime_implementation_included",
    "implementation_occurred",
}
IMPLEMENTATION_PROHIBITIONS = {
    "Programming",
    "Runtime",
    "API",
    "Frontend",
    "Persistence",
    "Database schemas",
    "Deployment",
    "Infrastructure",
    "Production code",
    "Repository publication",
    "Registry mutation",
    "New runtime owners",
    "Duplicate authorities",
    "Duplicate registries",
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
        fail(f"missing artifact: {path.relative_to(ROOT)}")
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
    require(PHASE1.exists(), "Phase 1 mission artifacts must exist before Phase 3")
    require(PHASE2.exists(), "Phase 2 architecture artifacts must exist before Phase 3")
    require(BASE.exists(), f"missing directory: {BASE.relative_to(ROOT)}")
    artifacts: dict[str, dict[str, Any]] = {}
    for name in REQUIRED_ARTIFACTS:
        md = BASE / f"{name}.md"
        js = BASE / f"{name}.json"
        require(md.exists(), f"missing markdown artifact: {md.relative_to(ROOT)}")
        require(js.exists(), f"missing JSON artifact: {js.relative_to(ROOT)}")
        artifacts[name] = load_json(name)
        require(artifacts[name].get("mission_id") == MISSION_ID, f"{name} mission_id mismatch")
    return artifacts


def validate_blueprint(bp: dict[str, Any]) -> None:
    require(bp.get("blueprint_id") == "CTB-1", "blueprint_id must be CTB-1")
    require(bp.get("lifecycle_phase") == "IGLS-1 Phase 3 - BLUEPRINT", "blueprint must remain Phase 3")
    require(bp.get("authorized_next_phase") == "IGLS-1 Phase 4 - ACCEPTANCE_AND_EVIDENCE", "only Phase 4 may be authorized")
    scope = bp.get("engineering_scope", {})
    for key in ("must_be_engineered", "responsibility_division", "component_cooperation", "future_validation"):
        require(scope.get(key), f"blueprint engineering_scope missing {key}")
    require(len(bp.get("governing_authorities", [])) >= 10, "governing authorities incomplete")


def validate_capabilities(caps: dict[str, Any]) -> None:
    items = caps.get("capabilities", [])
    require(len(items) >= 4, "capability decomposition incomplete")
    required = {"capability_id", "purpose", "owner", "inputs", "outputs", "dependencies", "consumers", "lifecycle", "validation_requirements", "evidence_produced", "failure_modes", "recovery_strategy", "future_evolution_rules"}
    for item in items:
        missing = [key for key in required if not item.get(key)]
        require(not missing, f"{item.get('capability_id', 'capability')} missing {missing}")


def validate_components(components: dict[str, Any]) -> None:
    items = components.get("components", [])
    require(len(items) >= 4, "component inventory incomplete")
    required = {"component_identifier", "canonical_owner", "responsibility", "explicit_non_responsibilities", "interfaces", "contracts", "dependencies", "data_ownership", "security_ownership", "governance_ownership", "runtime_ownership", "validation_owner", "certification_owner", "publication_owner"}
    for item in items:
        missing = [key for key in required if not item.get(key)]
        require(not missing, f"{item.get('component_identifier', 'component')} missing {missing}")
        require(item["runtime_ownership"] == "none", f"{item['component_identifier']} must not own runtime")


def validate_lifecycle(model: dict[str, Any]) -> None:
    states = model.get("states", [])
    require(len(states) >= 3, "lifecycle states incomplete")
    for state in states:
        for key in ("entry_criteria", "exit_criteria", "transitions", "rollback_conditions", "validation_requirements", "evidence_produced", "approval_authority", "failure_behavior"):
            require(state.get(key), f"{state.get('state', 'state')} missing {key}")


def validate_interactions(model: dict[str, Any]) -> None:
    require(model.get("api_implementation_included") is False, "API implementation is prohibited")
    require(model.get("runtime_implementation_included") is False, "runtime implementation is prohibited")
    interactions = model.get("interactions", [])
    require(len(interactions) >= 4, "interaction model incomplete")
    for item in interactions:
        for key in ("producer", "consumer", "contract", "ownership", "direction", "validation", "security", "evidence", "failure_handling"):
            require(item.get(key), f"interaction missing {key}")


def validate_contracts(model: dict[str, Any]) -> None:
    contracts = model.get("contracts", [])
    require(len(contracts) >= 4, "contract model incomplete")
    for item in contracts:
        for key in ("contract_id", "purpose", "inputs", "outputs", "owner", "lifecycle", "validation", "evidence", "compatibility", "version_evolution", "failure_rules"):
            require(item.get(key), f"{item.get('contract_id', 'contract')} missing {key}")


def validate_irs(irs: dict[str, Any]) -> None:
    require(irs.get("irs_id") == "IRS-1", "irs_id must be IRS-1")
    require(irs.get("implementation_may_begin_before_irs_passes") is False, "implementation cannot begin before IRS-1")
    for key in ("implementation_prerequisites", "required_validators", "required_governance_gates", "required_evidence", "required_acceptance_criteria", "required_certification", "required_repository_state", "required_architectural_inheritance", "required_traceability"):
        require(irs.get(key), f"IRS missing {key}")


def validate_bdl(ledger: dict[str, Any]) -> None:
    require(ledger.get("ledger_id") == "BDL-1", "ledger_id must be BDL-1")
    require(ledger.get("implementation_requires_associated_decision") is True, "implementation must require BDL decision")
    decisions = ledger.get("decisions", [])
    require(len(decisions) >= 4, "decision ledger incomplete")
    required = {"blueprint_decision_id", "decision_title", "requirement_source", "mission_reference", "architecture_reference", "constitutional_authority", "alternatives_considered", "decision", "justification", "trade_offs", "dependencies", "constraints", "validation_required", "evidence_required", "implementation_impact", "certification_impact", "future_evolution_guidance", "supersession_rules"}
    for item in decisions:
        missing = [key for key in required if not item.get(key)]
        require(not missing, f"{item.get('blueprint_decision_id', 'decision')} missing {missing}")


def validate_traceability(trace: dict[str, Any]) -> None:
    require(trace.get("future_implementation_trace_required") is True, "future implementation trace must be required")
    links = trace.get("links", [])
    require(len(links) >= 4, "traceability links incomplete")
    for link in links:
        for key in ("blueprint_item", "mission_definition", "architecture_charter", "aeib_1", "era_1", "igls_1"):
            require(link.get(key), f"trace link missing {key}")


def validate_inheritance(rules: dict[str, Any]) -> None:
    require(rules.get("implementation_may_only_realize_blueprint") is True, "implementation may only realize blueprint")
    required = {"Mission", "Architecture", "Ownership", "Boundaries", "Contracts", "Validation", "Evidence", "Security", "Decision Ledger"}
    found = set(rules.get("implementation_may_not_redefine", []))
    require(required <= found, "implementation inheritance rules incomplete")
    require(rules.get("future_phase_authorized") == "IGLS-1 Phase 4 - ACCEPTANCE_AND_EVIDENCE", "only Phase 4 may be authorized")


def validate_no_prohibited_truths(artifacts: dict[str, dict[str, Any]]) -> None:
    for name, artifact in artifacts.items():
        for key, value in walk_values(artifact):
            if key in PROHIBITED_TRUE_KEYS:
                require(value is False, f"{name} prohibited key is true: {key}")


def main() -> None:
    artifacts = validate_required_files()
    validate_blueprint(artifacts["CONSTITUTIONAL_TECHNICAL_BLUEPRINT"])
    validate_capabilities(artifacts["CAPABILITY_DECOMPOSITION"])
    validate_components(artifacts["COMPONENT_INVENTORY"])
    validate_lifecycle(artifacts["LIFECYCLE_MODEL"])
    validate_interactions(artifacts["INTERACTION_MODEL"])
    validate_contracts(artifacts["CONTRACT_MODEL"])
    validate_irs(artifacts["IMPLEMENTATION_READINESS_SPECIFICATION"])
    validate_bdl(artifacts["BLUEPRINT_DECISION_LEDGER"])
    validate_traceability(artifacts["TRACEABILITY_MATRIX"])
    validate_inheritance(artifacts["IMPLEMENTATION_INHERITANCE_RULES"])
    validate_no_prohibited_truths(artifacts)
    print("PASS: Package H Batch 03 IGLS-1 Phase 3 blueprint validation OK.")


if __name__ == "__main__":
    main()
