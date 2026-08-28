#!/usr/bin/env python3
"""Validate EPL-1 constitutional evidence governance artifacts."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "docs" / "governance" / "EPL_1"
STANDARD_ID = "EPL-1"
REQUIRED_ARTIFACTS = [
    "EPL-1_SPECIFICATION",
    "EVIDENCE_MODEL",
    "CHAIN_OF_CUSTODY",
    "EVIDENCE_LIFECYCLE",
    "TRACEABILITY_MODEL",
    "CERTIFICATION_MODEL",
    "PUBLICATION_MODEL",
    "EVIDENCE_REPRODUCIBILITY",
    "EVIDENCE_RETENTION_POLICY",
    "EPL-1_GOVERNANCE",
    "EPL-1_CERTIFICATION_REPORT",
]
REQUIRED_EVIDENCE_FIELDS = {
    "Evidence ID",
    "Evidence Category",
    "Evidence Type",
    "Evidence Status",
    "Evidence Owner",
    "Evidence Producer",
    "Evidence Reviewer",
    "Evidence Validator",
    "Evidence Certification Authority",
    "Mission Reference",
    "Architecture Reference",
    "Blueprint Reference",
    "Decision Ledger Reference",
    "Requirement Reference",
    "Implementation Reference",
    "Validation Reference",
    "Repository Reference",
    "Publication Reference",
    "Timestamp",
    "Version",
    "Hash",
    "Integrity Status",
    "Digital Fingerprint",
    "Supersession Status",
    "Retention Policy",
}
REQUIRED_CATEGORIES = {
    "Mission Evidence",
    "Architecture Evidence",
    "Blueprint Evidence",
    "Decision Evidence",
    "Implementation Evidence",
    "Validator Evidence",
    "Testing Evidence",
    "Repository Evidence",
    "Governance Evidence",
    "Certification Evidence",
    "Publication Evidence",
    "Audit Evidence",
    "Compliance Evidence",
    "Risk Evidence",
    "Exception Evidence",
}
REQUIRED_CHAIN_EVENTS = {
    "Origin",
    "Ownership",
    "Transfers",
    "Validation",
    "Certification",
    "Publication",
    "Archive",
    "Replacement",
    "Retirement",
}
REQUIRED_TRACE_TARGETS = {
    "Mission",
    "Architecture",
    "Blueprint",
    "Decision",
    "Requirement",
    "Validator",
    "Test",
    "Certification",
    "Publication",
}
PROHIBITED_TRUE_KEYS = {
    "implementation_authorized",
    "runtime_added",
    "api_added",
    "ui_added",
    "persistence_added",
    "duplicate_evidence_authority",
    "orphan_evidence_allowed",
    "bypass_allowed",
    "certified_evidence_mutable",
    "undocumented_evidence_allowed",
    "producer_self_certification_allowed",
    "validator_authors_evidence_allowed",
    "publication_without_evidence_allowed",
    "constitutional_evidence_deletable",
    "duplicate_evidence_authority_allowed",
    "implementation_occurred",
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
    require(BASE.exists(), f"missing directory: {BASE.relative_to(ROOT)}")
    artifacts: dict[str, dict[str, Any]] = {}
    for name in REQUIRED_ARTIFACTS:
        md = BASE / f"{name}.md"
        js = BASE / f"{name}.json"
        require(md.exists(), f"missing markdown artifact: {md.relative_to(ROOT)}")
        require(js.exists(), f"missing JSON artifact: {js.relative_to(ROOT)}")
        artifacts[name] = load_json(name)
        require(artifacts[name].get("standard_id") == STANDARD_ID, f"{name} standard_id mismatch")
    return artifacts


def validate_spec(spec: dict[str, Any]) -> None:
    require(spec.get("standard_name") == "Evidence Provenance Ledger", "standard name mismatch")
    require(spec.get("certification_requires_registered_evidence") is True, "certification must require registered evidence")
    require(len(spec.get("authoritative_inputs", [])) >= 12, "authoritative inputs incomplete")
    require(len(spec.get("must_register_evidence_for", [])) >= 9, "lifecycle evidence registration incomplete")


def validate_evidence_model(model: dict[str, Any]) -> None:
    fields = set(model.get("required_fields", []))
    categories = set(model.get("evidence_categories", []))
    require(REQUIRED_EVIDENCE_FIELDS <= fields, "evidence fields incomplete")
    require(REQUIRED_CATEGORIES <= categories, "evidence categories incomplete")
    require(model.get("evidence_id_unique") is True, "evidence IDs must be unique")
    require(model.get("orphan_evidence_allowed") is False, "orphan evidence must be prohibited")


def validate_chain(chain: dict[str, Any]) -> None:
    require(REQUIRED_CHAIN_EVENTS <= set(chain.get("required_chain_events", [])), "chain-of-custody events incomplete")
    require(chain.get("bypass_allowed") is False, "chain-of-custody bypass must be prohibited")
    require(chain.get("transfer_requires"), "transfer requirements missing")


def validate_lifecycle(lifecycle: dict[str, Any]) -> None:
    states = lifecycle.get("states", [])
    require(states == ["Created", "Registered", "Validated", "Accepted", "Certified", "Published", "Archived", "Superseded", "Retired"], "evidence lifecycle states invalid")
    reqs = lifecycle.get("transition_requirements", {})
    for key in ("entry_criteria", "exit_criteria", "approval_authority", "evidence_required"):
        require(reqs.get(key), f"transition requirement missing {key}")


def validate_traceability(trace: dict[str, Any]) -> None:
    require(REQUIRED_TRACE_TARGETS <= set(trace.get("required_trace_targets", [])), "traceability targets incomplete")
    require(trace.get("certification_must_reference_supporting_evidence") is True, "certification must reference evidence")
    require(trace.get("traceability_gaps_allowed") is False, "traceability gaps must be prohibited")


def validate_certification(cert: dict[str, Any]) -> None:
    checks = set(cert.get("certification_verifies", []))
    required = {"Evidence completeness", "Evidence integrity", "Evidence provenance", "Evidence ownership", "Evidence traceability", "Evidence reproducibility"}
    require(required <= checks, "certification checks incomplete")
    require(cert.get("undocumented_evidence_allowed") is False, "undocumented evidence must be prohibited")


def validate_publication(pub: dict[str, Any]) -> None:
    required = {"Evidence Set", "Supporting Validators", "Certification Reference", "Repository State", "Commit Reference", "Approval Authority", "Publication Timestamp", "Post-Publication Verification"}
    require(required <= set(pub.get("publication_records", [])), "publication records incomplete")
    require(pub.get("publication_without_evidence_allowed") is False, "publication without evidence must be prohibited")


def validate_reproducibility(repro: dict[str, Any]) -> None:
    required = {"Reproduction Method", "Required Inputs", "Required Repository State", "Required Validators", "Expected Output", "Verification Procedure"}
    require(required <= set(repro.get("required_fields", [])), "reproducibility fields incomplete")
    require(repro.get("reproducibility_required") is True, "reproducibility must be required")


def validate_retention(retention: dict[str, Any]) -> None:
    require(retention.get("constitutional_evidence_deletable") is False, "constitutional evidence must not be deletable")
    require(retention.get("certified_evidence_mutable") is False, "certified evidence must be immutable")
    require(retention.get("supersession_requires_governance") is True, "supersession must require governance")


def validate_governance(governance: dict[str, Any]) -> None:
    required = {"Evidence deletion", "Evidence rewriting", "Evidence ownership reassignment", "Certification without evidence", "Publication without evidence", "Validator bypass", "Traceability gaps", "Duplicate evidence authority", "Untracked evidence", "Manual certification without provenance"}
    require(required <= set(governance.get("prohibited_actions", [])), "prohibited actions incomplete")
    require(governance.get("future_governance_decisions_require_epl_1") is True, "future governance decisions must require EPL-1")


def validate_no_prohibited_truths(artifacts: dict[str, dict[str, Any]]) -> None:
    for name, artifact in artifacts.items():
        for key, value in walk_values(artifact):
            if key in PROHIBITED_TRUE_KEYS:
                require(value is False, f"{name} prohibited key is true: {key}")


def main() -> None:
    artifacts = validate_required_files()
    validate_spec(artifacts["EPL-1_SPECIFICATION"])
    validate_evidence_model(artifacts["EVIDENCE_MODEL"])
    validate_chain(artifacts["CHAIN_OF_CUSTODY"])
    validate_lifecycle(artifacts["EVIDENCE_LIFECYCLE"])
    validate_traceability(artifacts["TRACEABILITY_MODEL"])
    validate_certification(artifacts["CERTIFICATION_MODEL"])
    validate_publication(artifacts["PUBLICATION_MODEL"])
    validate_reproducibility(artifacts["EVIDENCE_REPRODUCIBILITY"])
    validate_retention(artifacts["EVIDENCE_RETENTION_POLICY"])
    validate_governance(artifacts["EPL-1_GOVERNANCE"])
    validate_no_prohibited_truths(artifacts)
    print("PASS: EPL-1 evidence provenance ledger validation OK.")


if __name__ == "__main__":
    main()
