#!/usr/bin/env python3
"""Validate Package H Batch 03 IGLS-1 Phase 1 mission artifacts."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "docs" / "releases" / "PACKAGE_H_BATCH_03_PHASE_1"
MISSION_ID = "PACKAGE_H_BATCH_03_IGLS_1_PHASE_1"
REQUIRED_ARTIFACTS = [
    "MISSION_DEFINITION",
    "MISSION_ALIGNMENT_MATRIX",
    "MISSION_BOUNDARY_ANALYSIS",
    "MISSION_RISK_REGISTER",
    "MISSION_EVIDENCE_MATRIX",
    "MISSION_AUTHORIZATION",
    "MISSION_TRACEABILITY_MATRIX",
    "MISSION_CERTIFICATION_REPORT",
]
PROHIBITED_TRUE_KEYS = {
    "engineering_authorization_granted",
    "package_h_batch_03_implementation_authorized",
    "implementation_occurred",
    "runtime_added",
    "api_added",
    "ui_added",
    "persistence_added",
    "duplicate_authority_introduced",
    "duplicate_registry_introduced",
    "constitutional_conflicts_exist",
    "future_implementation_may_redefine_evidence",
}


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def load_json(name: str) -> dict[str, Any]:
    path = BASE / f"{name}.json"
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        fail(f"missing artifact: {path.relative_to(ROOT)}")
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def walk_values(value: Any):
    if isinstance(value, dict):
        for key, item in value.items():
            yield key, item
            yield from walk_values(item)
    elif isinstance(value, list):
        for item in value:
            yield from walk_values(item)


def validate_required_files() -> dict[str, dict[str, Any]]:
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


def validate_mission_definition(mission: dict[str, Any]) -> None:
    required_keys = [
        "mission_id",
        "mission_title",
        "package",
        "batch",
        "lifecycle_phase",
        "mission_status",
        "constitutional_status",
        "version",
        "owner",
        "canonical_authority",
        "mission_sponsor",
        "strategic_context",
        "business_justification",
        "engineering_justification",
        "problem_statement",
        "opportunity_statement",
        "desired_future_state",
        "mission_scope",
        "explicit_out_of_scope",
        "dependencies",
        "assumptions",
        "constraints",
        "known_risks",
        "known_unknowns",
        "external_dependencies",
        "internal_dependencies",
        "success_criteria",
        "failure_criteria",
        "mission_completion_definition",
        "exit_criteria",
        "required_deliverables",
        "acceptance_strategy",
        "evidence_strategy",
        "certification_strategy",
        "publication_strategy",
        "next_authorized_lifecycle_phase",
    ]
    for key in required_keys:
        require(mission.get(key), f"mission definition missing {key}")
    require(mission["package"] == "H", "package must be H")
    require(mission["batch"] == "03", "batch must be 03")
    require(mission["lifecycle_phase"].endswith("MISSION_DEFINITION"), "mission must remain Phase 1")
    require(mission["next_authorized_lifecycle_phase"].endswith("ARCHITECTURE_CHARTER"), "only Phase 2 may be authorized")


def validate_alignment(alignment: dict[str, Any]) -> None:
    constitutions = {item.get("constitution") for item in alignment.get("constitutional_alignment", [])}
    require({"Semantic Constitution", "AEIB-1", "IGLS-1"} <= constitutions, "constitutional alignment incomplete")
    for item in alignment.get("constitutional_alignment", []):
        for key in ("applicable_principle", "required_compliance", "potential_drift_risk", "mitigation", "evidence_required"):
            require(item.get(key), f"alignment entry missing {key}")
    airport = alignment.get("airport_principle_review", {})
    require(airport.get("neutral_infrastructure") == "PASS", "neutral infrastructure not proven")
    for key in ("marketplace_owner", "agent_platform_owner", "protocol_monopoly", "runtime_monopoly"):
        require(airport.get(key) == "NO", f"airport principle violation: {key}")


def validate_boundaries(boundary: dict[str, Any]) -> None:
    for key in ("will", "will_not", "must_never", "does_not_replace"):
        require(boundary.get(key), f"boundary analysis missing {key}")
    for authority in ("Truth Spine", "Oracle", "Master Layer Registry", "Executive Command", "Release Management", "Readiness Gate", "Contract Runtime", "Identity", "Audit", "Verification"):
        require(authority in boundary["does_not_replace"], f"boundary missing non-replacement: {authority}")
    prohibited = boundary.get("prohibited_surfaces", {})
    for key, value in prohibited.items():
        require(value is False, f"prohibited surface enabled: {key}")


def validate_evidence(evidence: dict[str, Any]) -> None:
    required = evidence.get("evidence_required_for", {})
    for stage in ("Mission Approval", "Architecture Charter", "Blueprint", "Implementation Authorization", "Independent Certification", "Publication"):
        require(required.get(stage), f"evidence missing stage: {stage}")
    require(evidence.get("future_implementation_may_redefine_evidence") is False, "future implementation may not redefine evidence")


def validate_authorization(auth: dict[str, Any]) -> None:
    require(auth.get("batch_03_should_exist") is True, "Batch 03 existence not authorized")
    require(auth.get("batch_03_should_proceed") is True, "Batch 03 proceed not authorized")
    require(auth.get("prerequisites_satisfied") is True, "prerequisites not satisfied")
    require(auth.get("constitutional_conflicts_exist") is False, "constitutional conflict exists")
    require(auth.get("engineering_authorization_granted") is False, "engineering authorization must remain false")
    require(auth.get("authorized_only") == ["Architecture Charter"], "only Architecture Charter may be authorized")
    blocked = set(auth.get("not_authorized", []))
    for item in ("Blueprint", "Implementation", "Certification", "Publication", "Runtime", "API", "UI", "Persistence"):
        require(item in blocked, f"missing not-authorized item: {item}")


def validate_no_prohibited_truths(artifacts: dict[str, dict[str, Any]]) -> None:
    for name, artifact in artifacts.items():
        for key, value in walk_values(artifact):
            if key in PROHIBITED_TRUE_KEYS:
                require(value is False, f"{name} prohibited key is true: {key}")


def main() -> None:
    artifacts = validate_required_files()
    validate_mission_definition(artifacts["MISSION_DEFINITION"])
    validate_alignment(artifacts["MISSION_ALIGNMENT_MATRIX"])
    validate_boundaries(artifacts["MISSION_BOUNDARY_ANALYSIS"])
    validate_evidence(artifacts["MISSION_EVIDENCE_MATRIX"])
    validate_authorization(artifacts["MISSION_AUTHORIZATION"])
    validate_no_prohibited_truths(artifacts)
    print("PASS: Package H Batch 03 IGLS-1 Phase 1 mission validation OK.")


if __name__ == "__main__":
    main()
