#!/usr/bin/env python3
"""Validate Package H Batch 03 IGLS-1 Phase 2 architecture artifacts."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "docs" / "releases" / "PACKAGE_H_BATCH_03_PHASE_2"
PHASE1 = ROOT / "docs" / "releases" / "PACKAGE_H_BATCH_03_PHASE_1"
MISSION_ID = "PACKAGE_H_BATCH_03_IGLS_1_PHASE_2"
REQUIRED_ARTIFACTS = [
    "ARCHITECTURE_CHARTER",
    "ARCHITECTURE_PRINCIPLES",
    "ARCHITECTURE_BOUNDARIES",
    "OWNER_BOUNDARY_DECLARATIONS",
    "LAYER_INTERACTION_MODEL",
    "ARCHITECTURAL_CONTRACTS",
    "CONSTITUTIONAL_COMPATIBILITY_MATRIX",
    "ARCHITECTURAL_DRIFT_PREVENTION",
    "ARCHITECTURE_TRACEABILITY_MATRIX",
    "ARCHITECTURE_AUTHORIZATION",
    "ARCHITECTURE_CERTIFICATION_REPORT",
    "NON_FUNCTIONAL_ARCHITECTURE",
    "FUTURE_BLUEPRINT_CONTRACT",
]
MANDATORY_PRINCIPLES = {
    "Neutral Infrastructure",
    "Airport Principle",
    "Provider Neutrality",
    "Replaceable Integrations",
    "Stable Contracts",
    "Canonical Ownership",
    "Registration Before Reach-In",
    "Evidence Before Trust",
    "Governance Before Runtime",
    "Runtime Minimalism",
    "Layer Independence",
    "Loose Coupling",
    "Constitutional Traceability",
    "Deterministic Validation",
    "Independent Certification",
}
MANDATORY_AUTHORITIES = {
    "Semantic Constitution",
    "AEIB-1",
    "ERA-1",
    "IGLS-1",
    "Master Layer Registry",
    "Truth Spine",
    "Oracle",
    "Executive Command",
}
MANDATORY_NON_FUNCTIONAL = {
    "Security",
    "Reliability",
    "Scalability",
    "Availability",
    "Maintainability",
    "Auditability",
    "Observability",
    "Performance",
    "Extensibility",
    "Interoperability",
    "Replaceability",
    "Version Evolution",
}
PROHIBITED_TRUE_KEYS = {
    "implementation_authorized",
    "blueprint_started",
    "runtime_added",
    "api_added",
    "ui_added",
    "persistence_added",
    "duplicate_authority_introduced",
    "duplicate_registry_introduced",
    "api_definitions_included",
    "runtime_schemas_included",
    "blueprint_authorized",
    "implementation_occurred",
    "duplicate_ownership",
    "runtime_authorized",
    "api_authorized",
    "persistence_authorized",
    "frontend_authorized",
    "publication_authorized",
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
    require(PHASE1.exists(), "Phase 1 mission artifacts must exist before Phase 2")
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


def validate_architecture_charter(charter: dict[str, Any]) -> None:
    require(charter.get("lifecycle_phase") == "IGLS-1 Phase 2 - ARCHITECTURE_CHARTER", "charter must remain Phase 2")
    require(charter.get("authorized_next_phase") == "IGLS-1 Phase 3 - BLUEPRINT", "charter may authorize only Phase 3 Blueprint")
    require(len(charter.get("architectural_purpose", [])) >= 6, "architectural purpose incomplete")
    for item in charter.get("architectural_purpose", []):
        for key in ("question", "answer", "phase_1_trace"):
            require(item.get(key), f"architectural purpose missing {key}")
    require(len(charter.get("component_names", [])) >= 5, "component list incomplete")


def validate_principles(principles: dict[str, Any]) -> None:
    found = set(principles.get("principles", []))
    missing = MANDATORY_PRINCIPLES - found
    require(not missing, f"missing principles: {sorted(missing)}")
    require(principles.get("principles_are_architectural_law") is True, "principles must be architectural law")


def validate_owner_boundaries(owner: dict[str, Any]) -> None:
    components = owner.get("components", [])
    require(len(components) >= 5, "owner declarations incomplete")
    required = {
        "canonical_owner",
        "purpose",
        "responsibilities",
        "explicit_non_responsibilities",
        "layer_membership",
        "runtime_boundary",
        "data_boundary",
        "governance_boundary",
        "security_boundary",
        "contract_boundary",
        "evidence_boundary",
        "adjacent_components",
        "permitted_dependencies",
        "forbidden_dependencies",
        "justification",
    }
    owners = []
    for component in components:
        missing = [key for key in required if not component.get(key)]
        require(not missing, f"{component.get('name', 'component')} missing {missing}")
        owners.append((component["name"], component["canonical_owner"]))
    require(len(owners) == len(set(name for name, _ in owners)), "duplicate component declaration")


def validate_interactions(model: dict[str, Any]) -> None:
    interactions = model.get("interactions", [])
    require(len(interactions) >= 7, "layer interactions incomplete")
    for interaction in interactions:
        for key in ("source_layer", "target_layer", "direction", "contract", "ownership", "read_write_permissions", "runtime_authority", "evidence_produced", "validation_required"):
            require(interaction.get(key), f"interaction missing {key}")
        require("bypass" not in interaction["validation_required"].lower(), "interaction may not bypass ownership")


def validate_contracts(contracts: dict[str, Any]) -> None:
    require(contracts.get("contracts_are_conceptual") is True, "contracts must be conceptual")
    require(contracts.get("api_definitions_included") is False, "API definitions are prohibited")
    require(contracts.get("runtime_schemas_included") is False, "runtime schemas are prohibited")
    require(len(contracts.get("contracts", [])) >= 3, "architectural contracts incomplete")
    for contract in contracts.get("contracts", []):
        for key in ("responsibilities", "inputs", "outputs", "ownership", "lifecycle", "validation", "failure_behavior", "governance_rules", "evidence_produced", "contract_stability_expectations"):
            require(contract.get(key), f"{contract.get('name', 'contract')} missing {key}")


def validate_compatibility(matrix: dict[str, Any]) -> None:
    found = {item.get("supporting_authority") for item in matrix.get("authorities", [])}
    missing = MANDATORY_AUTHORITIES - found
    require(not missing, f"missing constitutional authorities: {sorted(missing)}")
    for item in matrix.get("authorities", []):
        require(item.get("compliance_status") == "PASS", f"authority not passing: {item.get('supporting_authority')}")
        require(item.get("evidence_required"), f"authority missing evidence: {item.get('supporting_authority')}")


def validate_drift(drift: dict[str, Any]) -> None:
    require(drift.get("drift_detection_required") is True, "drift detection must be required")
    require(len(drift.get("decisions", [])) >= 4, "drift decisions incomplete")
    for decision in drift.get("decisions", []):
        for key in ("potential_drift_risk", "likelihood", "impact", "detection_method", "mitigation_strategy", "recovery_strategy", "approval_authority"):
            require(decision.get(key), f"drift decision missing {key}")


def validate_non_functional(nfr: dict[str, Any]) -> None:
    found = set(nfr.get("requirements", {}).keys())
    missing = MANDATORY_NON_FUNCTIONAL - found
    require(not missing, f"missing non-functional requirements: {sorted(missing)}")


def validate_blueprint_contract(contract: dict[str, Any]) -> None:
    inherited = set(contract.get("blueprint_must_inherit", []))
    forbidden = set(contract.get("blueprint_may_not_redefine", []))
    required = {"Ownership", "Principles", "Mission", "Boundaries", "Architectural contracts", "Governance rules", "Evidence strategy", "Validation strategy"}
    require(required <= inherited, "Blueprint inheritance incomplete")
    require(required <= forbidden, "Blueprint non-redefinition rule incomplete")
    require(contract.get("blueprint_authorized") is False, "Blueprint must not be started by Phase 2")


def validate_authorization(auth: dict[str, Any]) -> None:
    require(auth.get("authorized_only") == ["Technical Blueprint"], "only Technical Blueprint may be authorized")
    blocked = set(auth.get("not_authorized", []))
    for item in ("Implementation", "Runtime", "API", "Persistence", "Frontend", "Publication"):
        require(item in blocked, f"missing not-authorized item: {item}")


def validate_no_prohibited_truths(artifacts: dict[str, dict[str, Any]]) -> None:
    for name, artifact in artifacts.items():
        for key, value in walk_values(artifact):
            if key in PROHIBITED_TRUE_KEYS:
                require(value is False, f"{name} prohibited key is true: {key}")


def main() -> None:
    artifacts = validate_required_files()
    validate_architecture_charter(artifacts["ARCHITECTURE_CHARTER"])
    validate_principles(artifacts["ARCHITECTURE_PRINCIPLES"])
    validate_owner_boundaries(artifacts["OWNER_BOUNDARY_DECLARATIONS"])
    validate_interactions(artifacts["LAYER_INTERACTION_MODEL"])
    validate_contracts(artifacts["ARCHITECTURAL_CONTRACTS"])
    validate_compatibility(artifacts["CONSTITUTIONAL_COMPATIBILITY_MATRIX"])
    validate_drift(artifacts["ARCHITECTURAL_DRIFT_PREVENTION"])
    validate_non_functional(artifacts["NON_FUNCTIONAL_ARCHITECTURE"])
    validate_blueprint_contract(artifacts["FUTURE_BLUEPRINT_CONTRACT"])
    validate_authorization(artifacts["ARCHITECTURE_AUTHORIZATION"])
    validate_no_prohibited_truths(artifacts)
    print("PASS: Package H Batch 03 IGLS-1 Phase 2 architecture validation OK.")


if __name__ == "__main__":
    main()
