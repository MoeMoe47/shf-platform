#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
import sys
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
ARCH_DIR = ROOT / "docs" / "architecture"
AUDIT_DIR = ROOT / "docs" / "v1-layer-audit"

PACKAGE_B_FILES = [
    "SHS_BOS_V1_AUDIT_SUMMARY.md",
    "SHS_BOS_V1_MASTER_LAYER_INVENTORY.json",
    "SHS_BOS_V1_LAYER_CONNECTION_MATRIX.json",
    "SHS_BOS_V1_OPERATIONAL_CHAIN_AUDIT.json",
    "SHS_BOS_V1_RECOMMENDED_OFFICIAL_LAYER_REGISTRY.json",
    "SHS_BOS_V1_ORPHAN_AND_DEAD_END_REGISTRY.json",
    "SHS_BOS_V1_GAP_AND_DUPLICATION_AUDIT.md",
    "SHS_BOS_V1_UNRESOLVED_QUESTIONS.md",
]

PACKAGE_C_DOCS = [
    "SHS_BOS_LAYER_CONSOLIDATION_DECISIONS_V1.json",
    "SHS_BOS_LAYER_CONSOLIDATION_DECISIONS_V1.md",
    "SHS_BOS_LAYER_CONTRACT_REGISTRY_V1.json",
    "SHS_BOS_LAYER_CONTRACT_REGISTRY_V1.md",
    "SHS_BOS_LAYER_FAMILY_ARCHITECTURE_V1.md",
    "SHS_BOS_LAYER_FAMILY_IMPLEMENTATION_SUMMARY_V1.md",
    "SHS_BOS_LAYER_FAMILY_QA_REPORT_V1.md",
    "SHS_BOS_LAYER_INTEGRATION_CLOSURE_PLAN_V1.json",
    "SHS_BOS_LAYER_INTEGRATION_CLOSURE_PLAN_V1.md",
    "SHS_BOS_LAYER_OWNERSHIP_MATRIX_V1.json",
    "SHS_BOS_LAYER_OWNERSHIP_MATRIX_V1.md",
    "SHS_BOS_OFFICIAL_LAYER_FAMILY_REGISTRY_V1.json",
    "SHS_BOS_OFFICIAL_LAYER_FAMILY_REGISTRY_V1.md",
    "SHS_BOS_OPERATIONAL_CHAIN_REGISTRY_V1.json",
    "SHS_BOS_OPERATIONAL_CHAIN_REGISTRY_V1.md",
    "scripts/check_shs_bos_layer_family_architecture.py",
    "scripts/generate_shs_bos_layer_family_architecture.py",
]

PACKAGE_C_JSON = [
    "SHS_BOS_LAYER_CONSOLIDATION_DECISIONS_V1.json",
    "SHS_BOS_LAYER_CONTRACT_REGISTRY_V1.json",
    "SHS_BOS_LAYER_INTEGRATION_CLOSURE_PLAN_V1.json",
    "SHS_BOS_LAYER_OWNERSHIP_MATRIX_V1.json",
    "SHS_BOS_OFFICIAL_LAYER_FAMILY_REGISTRY_V1.json",
    "SHS_BOS_OPERATIONAL_CHAIN_REGISTRY_V1.json",
]

VALID_LAYER_CLASSIFICATIONS = {
    "official_layer",
    "subsystem",
    "shared_platform_service",
    "business_surface",
    "cross_cutting_control",
    "merge_into_existing_layer",
    "deferred_post_v1",
    "deprecated",
    "proposed_only",
    "not_a_layer",
}

VALID_CONTRACT_IMPLEMENTATION_STATES = {
    "proposed",
    "architecture_defined",
    "foundation_ready",
    "deferred",
    "blocked",
    "needs_owner_review",
    "implemented",
    "implemented_or_partially_wired",
    "specified_missing_runtime",
}

AUTHORITY_BOUNDARIES = {
    "Master Layer Registry": "registration authority",
    "System Registry": "dependency intelligence",
    "Truth Spine": "truth authority",
    "Oracle": "advisory",
    "Executive Command Center": "aggregation",
    "System Orchestrator": "coordinate",
    "Persistence": "storage abstractions",
    "Authentication": "identity",
    "Command Bus": "command",
    "Event Bus": "event",
    "Scheduler": "scheduled",
    "Notification": "alert",
    "Tracking": "lifecycle",
    "Reports": "report",
    "Data Approval": "approval",
    "Direct Connect": "direct-source proof",
}

FALSE_COMPLETION_PHRASES = [
    "All architecture work is approved.",
    "All contracts are implemented.",
    "All runtime chains are complete.",
    "Batch 00 is complete.",
    "Batch 01 is complete.",
    "Batch 02 is complete.",
    "SHS BOS is deployable.",
]

DOWNSTREAM_REQUIRED_PHRASES = [
    "python3 /Users/mikeslate/shf-next/scripts/check_shf_v1_audit.py",
    "python3 scripts/check_shs_bos_v1_command_center.py",
    "targeted backend tests for V1 command-center routes",
    "npm run build",
    "pytest",
]


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    sys.exit(1)


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT))


def require_file(path: Path) -> None:
    if not path.exists():
        fail(f"required file missing: {rel(path)}")
    if not path.is_file():
        fail(f"required path is not a file: {rel(path)}")


def load_json(path: Path) -> Any:
    require_file(path)
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {rel(path)}: {exc}")


def require_keys(record: dict[str, Any], keys: list[str], context: str) -> None:
    for key in keys:
        if key not in record:
            fail(f"{context} missing required key: {key}")


def require_nonempty_string(value: Any, context: str) -> None:
    if not isinstance(value, str) or not value.strip():
        fail(f"{context} must be a nonempty string")


def require_nonempty_list(value: Any, context: str) -> None:
    if not isinstance(value, list) or not value:
        fail(f"{context} must be a nonempty list")


def require_unique_ids(records: list[dict[str, Any]], key: str, context: str) -> set[str]:
    ids: list[str] = []
    for index, record in enumerate(records):
        require_nonempty_string(record.get(key), f"{context}[{index}].{key}")
        ids.append(record[key])
    duplicates = sorted(item for item, count in Counter(ids).items() if count > 1)
    if duplicates:
        fail(f"{context} has duplicate {key} values: {duplicates}")
    return set(ids)


def run_package_b_validator() -> None:
    validator = ROOT / "scripts" / "check_shs_bos_v1_layer_audit.py"
    require_file(validator)
    result = subprocess.run(
        [sys.executable, str(validator)],
        cwd=ROOT,
        text=True,
        capture_output=True,
        timeout=120,
        check=False,
    )
    if result.returncode != 0:
        output = "\n".join(part.strip() for part in (result.stdout, result.stderr) if part.strip())
        fail(f"Package B validator failed: {output}")


def validate_package_b_evidence() -> dict[str, Any]:
    for name in PACKAGE_B_FILES:
        require_file(AUDIT_DIR / name)
    run_package_b_validator()

    inventory = load_json(AUDIT_DIR / "SHS_BOS_V1_MASTER_LAYER_INVENTORY.json")
    connections = load_json(AUDIT_DIR / "SHS_BOS_V1_LAYER_CONNECTION_MATRIX.json")
    chains = load_json(AUDIT_DIR / "SHS_BOS_V1_OPERATIONAL_CHAIN_AUDIT.json")
    registry = load_json(AUDIT_DIR / "SHS_BOS_V1_RECOMMENDED_OFFICIAL_LAYER_REGISTRY.json")
    orphans = load_json(AUDIT_DIR / "SHS_BOS_V1_ORPHAN_AND_DEAD_END_REGISTRY.json")

    require_nonempty_list(inventory.get("layers"), "Package B master inventory layers")
    require_nonempty_list(connections.get("connections"), "Package B connection matrix")
    require_nonempty_list(chains.get("chains"), "Package B operational chains")
    require_nonempty_list(registry.get("official_registry"), "Package B recommended registry")

    layer_ids = require_unique_ids(inventory["layers"], "layer_id", "Package B master inventory")
    registry_ids = require_unique_ids(registry["official_registry"], "layer_id", "Package B recommended registry")
    if layer_ids != registry_ids:
        fail("Package B inventory and recommended official registry layer IDs differ")

    if connections.get("connection_count") != len(connections["connections"]):
        fail("Package B connection_count does not match connection records")
    if chains.get("chain_count") != len(chains["chains"]):
        fail("Package B chain_count does not match chain records")
    if orphans.get("orphan_count") != len(orphans.get("orphans", [])):
        fail("Package B orphan_count does not match orphan records")

    return {
        "layer_ids": layer_ids,
        "connection_ids": require_unique_ids(connections["connections"], "connection_id", "Package B connections"),
        "chain_ids": require_unique_ids(chains["chains"], "chain_id", "Package B chains"),
        "orphan_ids": require_unique_ids(orphans.get("orphans", []), "orphan_id", "Package B orphan registry"),
    }


def validate_markdown_documents() -> None:
    for name in PACKAGE_C_DOCS:
        path = ROOT / name if name.startswith("scripts/") else ARCH_DIR / name
        require_file(path)
        if path.suffix != ".md":
            continue
        text = path.read_text(encoding="utf-8")
        if not text.lstrip().startswith("# "):
            fail(f"{rel(path)} missing top-level Markdown title")
        if "SHS BOS" not in text:
            fail(f"{rel(path)} missing SHS BOS package identity")
        for phrase in FALSE_COMPLETION_PHRASES:
            if phrase in text:
                fail(f"{rel(path)} contains forbidden false-completion phrase: {phrase}")
        for phrase in DOWNSTREAM_REQUIRED_PHRASES:
            if phrase in text:
                fail(f"{rel(path)} requires downstream validation: {phrase}")


def validate_family_registry(family_doc: dict[str, Any], package_b: dict[str, Any]) -> tuple[set[str], set[str]]:
    families = family_doc.get("families")
    layers = family_doc.get("layers")
    require_nonempty_list(families, "family registry families")
    require_nonempty_list(layers, "family registry layers")

    family_ids = require_unique_ids(families, "family_id", "family registry")
    layer_ids = require_unique_ids(layers, "layer_id", "family registry layers")
    if layer_ids != package_b["layer_ids"]:
        fail("Package C layer mapping does not match Package B master inventory layer IDs")

    for family in families:
        context = f"family {family['family_id']}"
        require_keys(family, ["official_name", "purpose", "canonical_owner"], context)
        require_nonempty_string(family["official_name"], f"{context}.official_name")
        require_nonempty_string(family["purpose"], f"{context}.purpose")
        require_nonempty_string(family["canonical_owner"], f"{context}.canonical_owner")
        member_ids: list[str] = []
        for key in ("layer_ids", "subsystem_ids", "shared_service_ids", "business_surface_ids", "cross_cutting_control_ids"):
            value = family.get(key, [])
            if not isinstance(value, list):
                fail(f"{context}.{key} must be a list")
            member_ids.extend(value)
        duplicates = sorted(item for item, count in Counter(member_ids).items() if count > 1)
        if duplicates:
            fail(f"{context} has duplicate member entries: {duplicates}")
        for layer_id in member_ids:
            if layer_id not in layer_ids:
                fail(f"{context} references unknown member layer {layer_id}")

    for layer in layers:
        context = f"layer {layer['layer_id']}"
        require_keys(layer, ["official_name", "primary_family_id", "classification", "purpose"], context)
        if layer["primary_family_id"] not in family_ids:
            fail(f"{context} references unknown family {layer['primary_family_id']}")
        if layer["classification"] not in VALID_LAYER_CLASSIFICATIONS:
            fail(f"{context} has invalid classification {layer['classification']}")
        if layer["classification"] == "official_layer":
            require_nonempty_string(layer.get("exclusive_responsibility"), f"{context}.exclusive_responsibility")
        if layer["classification"] == "subsystem" and layer.get("owning_official_layer_id") not in layer_ids:
            fail(f"{context} subsystem has invalid owning official layer")
        if layer["classification"] == "shared_platform_service":
            require_nonempty_list(layer.get("consumer_layer_ids"), f"{context}.consumer_layer_ids")
        if layer["classification"] == "business_surface":
            require_nonempty_list(layer.get("exposes_layer_ids"), f"{context}.exposes_layer_ids")
        if layer["classification"] == "cross_cutting_control":
            require_nonempty_list(layer.get("governed_family_ids"), f"{context}.governed_family_ids")
        if layer["classification"] == "merge_into_existing_layer":
            require_nonempty_list(layer.get("merged_into_layer_ids"), f"{context}.merged_into_layer_ids")

    metadata = family_doc.get("metadata", {})
    if metadata.get("family_count") != len(families):
        fail("family registry metadata family_count does not match records")
    if metadata.get("official_layer_count") != sum(1 for layer in layers if layer["classification"] == "official_layer"):
        fail("family registry metadata official_layer_count does not match records")
    if metadata.get("decision_required_count") not in (0, None):
        fail("family registry leaves unresolved decision_required records")

    return family_ids, layer_ids


def validate_ownership_matrix(ownership_doc: dict[str, Any], family_doc: dict[str, Any], layer_ids: set[str]) -> None:
    ownership = ownership_doc.get("ownership")
    require_nonempty_list(ownership, "ownership matrix")
    require_unique_ids(ownership, "responsibility_id", "ownership matrix")

    state_names = [item.get("state_name") for item in ownership]
    duplicates = sorted(item for item, count in Counter(state_names).items() if item and count > 1)
    if duplicates:
        fail(f"ownership matrix has duplicate state names: {duplicates}")

    for item in ownership:
        context = f"ownership {item['responsibility_id']}"
        require_keys(item, ["responsibility", "canonical_owner_layer_id", "canonical_owner_name", "conflict_status"], context)
        if item["canonical_owner_layer_id"] not in layer_ids:
            fail(f"{context} references unknown canonical owner {item['canonical_owner_layer_id']}")
        if item.get("recommended_canonical_owner") and item["recommended_canonical_owner"] != item["canonical_owner_layer_id"]:
            fail(f"{context} recommends a conflicting canonical owner")
        if item.get("frontend_only_authority") and "display" not in str(item.get("notes", "")).lower():
            fail(f"{context} frontend-only authority must be display-only")

    text = json.dumps(family_doc, sort_keys=True)
    if "SHS" not in text or "SHF" not in text:
        fail("family registry does not preserve SHS/SHF separation language")
    if "direct-source proof" not in text.lower():
        fail("Direct Connect direct-source proof posture is missing")


def validate_contract_registry(contract_doc: dict[str, Any], family_ids: set[str], layer_ids: set[str]) -> set[str]:
    contracts = contract_doc.get("contracts")
    require_nonempty_list(contracts, "contract registry")
    contract_ids = require_unique_ids(contracts, "contract_id", "contract registry")

    for contract in contracts:
        context = f"contract {contract['contract_id']}"
        require_keys(
            contract,
            [
                "upstream_layer_id",
                "downstream_layer_id",
                "producer_behavior",
                "consumer_behavior",
                "purpose",
                "security_requirements",
                "audit_requirements",
                "validation_rules",
                "failure_codes",
                "version",
                "status",
            ],
            context,
        )
        if contract["upstream_layer_id"] not in layer_ids:
            fail(f"{context} references unknown producer layer {contract['upstream_layer_id']}")
        if contract["downstream_layer_id"] not in layer_ids:
            fail(f"{context} references unknown consumer layer {contract['downstream_layer_id']}")
        for key in ("security_requirements", "audit_requirements", "validation_rules", "failure_codes", "trace_fields"):
            require_nonempty_list(contract.get(key), f"{context}.{key}")
        status = str(contract.get("status", ""))
        runtime_status = str(contract.get("runtime_status", "architecture_defined"))
        if status not in VALID_CONTRACT_IMPLEMENTATION_STATES and runtime_status not in VALID_CONTRACT_IMPLEMENTATION_STATES:
            if "blocked" not in status and "partial" not in status:
                fail(f"{context} has unsupported implementation posture {status!r}")
        if "v1" not in str(contract["version"]).lower():
            fail(f"{context} does not declare v1 version posture")
        for forbidden in ("all contracts are implemented", "batch 01 is complete"):
            if forbidden in json.dumps(contract).lower():
                fail(f"{context} contains false downstream completion claim")

    standard = contract_doc.get("traceability_standard", {})
    require_nonempty_list(standard.get("required_for_all_contracts"), "traceability standard required fields")
    return contract_ids


def validate_operational_chains(chain_doc: dict[str, Any], family_ids: set[str], layer_ids: set[str], contract_ids: set[str], package_b: dict[str, Any]) -> set[str]:
    chains = chain_doc.get("chains")
    require_nonempty_list(chains, "operational chain registry")
    chain_ids = require_unique_ids(chains, "chain_id", "operational chain registry")

    for chain in chains:
        context = f"chain {chain['chain_id']}"
        require_keys(chain, ["official_name", "mandatory_steps", "terminal_outcome", "current_status", "family_ids"], context)
        require_nonempty_list(chain["mandatory_steps"], f"{context}.mandatory_steps")
        if len(chain["mandatory_steps"]) != len(set(chain["mandatory_steps"])):
            fail(f"{context} contains an impossible self-reference duplicate step")
        for layer_id in chain["mandatory_steps"]:
            if layer_id not in layer_ids:
                fail(f"{context} references unknown layer {layer_id}")
        for family_id in chain.get("family_ids", []):
            if family_id not in family_ids:
                fail(f"{context} references unknown family {family_id}")
        for contract_id in chain.get("contract_ids", []):
            if contract_id not in contract_ids:
                fail(f"{context} references unknown contract {contract_id}")
        if chain.get("contracts_missing", 0) or chain.get("v1_blockers"):
            if "blocked" not in str(chain.get("current_status", "")).lower():
                fail(f"{context} has missing links but is not marked blocked")
        if not chain.get("broken_transitions") and chain.get("contracts_missing", 0):
            fail(f"{context} has missing contract count without explicit missing links")

    if len(chain_ids) > len(package_b["chain_ids"]):
        fail("Package C operational chain count exceeds Package B chain evidence without explanation")
    return chain_ids


def validate_consolidation_decisions(consolidation_doc: dict[str, Any], layer_ids: set[str], package_b: dict[str, Any]) -> None:
    decisions = consolidation_doc.get("consolidation_decisions")
    require_nonempty_list(decisions, "consolidation decision registry")
    require_unique_ids(decisions, "decision_id", "consolidation decisions")

    dispositions = {"retain_with_classification", "consolidate", "archive", "defer", "decision_required", "retain"}
    for decision in decisions:
        context = f"consolidation {decision['decision_id']}"
        require_keys(decision, ["affected_ids", "canonical_owner", "v1_disposition", "code_changes_needed_now"], context)
        require_nonempty_list(decision["affected_ids"], f"{context}.affected_ids")
        for layer_id in decision["affected_ids"]:
            if layer_id not in layer_ids:
                fail(f"{context} references unknown affected layer {layer_id}")
        if decision["v1_disposition"] not in dispositions:
            fail(f"{context} has unsupported disposition {decision['v1_disposition']}")
        if decision.get("code_changes_needed_now") is not False:
            fail(f"{context} implies physical implementation changes inside Package C")
        if "approved" in json.dumps(decision).lower() and "owner" not in json.dumps(decision).lower():
            fail(f"{context} implies approval without explicit owner-review posture")

    duplicate_candidates = [
        layer_id
        for layer_id in package_b["layer_ids"]
        if any(layer_id in decision.get("affected_ids", []) for decision in decisions)
    ]
    if not duplicate_candidates:
        fail("consolidation decisions do not address any Package B layer candidates")


def validate_closure_plan(closure_doc: dict[str, Any], family_ids: set[str], layer_ids: set[str], contract_ids: set[str], chain_ids: set[str], package_b: dict[str, Any]) -> None:
    batches = closure_doc.get("closure_batches")
    require_nonempty_list(batches, "integration closure plan")
    require_unique_ids(batches, "batch_id", "integration closure plan")
    allowed_status_keys = {"status", "parallelization_eligible"}

    for batch in batches:
        context = f"closure item {batch['batch_id']}"
        require_keys(batch, ["priority", "title", "chain_ids", "family_ids", "layer_ids", "contract_ids", "blocker_ids", "acceptance_criteria"], context)
        require_nonempty_string(batch["priority"], f"{context}.priority")
        require_nonempty_string(batch["title"], f"{context}.title")
        require_nonempty_list(batch["acceptance_criteria"], f"{context}.acceptance_criteria")
        if not allowed_status_keys.intersection(batch):
            fail(f"{context} missing status or implementation posture")
        for family_id in batch.get("family_ids", []):
            if family_id not in family_ids:
                fail(f"{context} references unknown family {family_id}")
        for layer_id in batch.get("layer_ids", []):
            if layer_id not in layer_ids:
                fail(f"{context} references unknown layer {layer_id}")
        for contract_id in batch.get("contract_ids", []):
            if contract_id not in contract_ids:
                fail(f"{context} references unknown contract {contract_id}")
        for chain_id in batch.get("chain_ids", []):
            if chain_id not in chain_ids:
                fail(f"{context} references unknown chain {chain_id}")
        if "blocked" in str(batch.get("title", "")).lower() and not batch.get("blocker_ids"):
            fail(f"{context} is blocked but does not list explicit blockers")


def validate_cross_artifact_consistency(
    family_doc: dict[str, Any],
    ownership_doc: dict[str, Any],
    contract_doc: dict[str, Any],
    chain_doc: dict[str, Any],
    consolidation_doc: dict[str, Any],
    closure_doc: dict[str, Any],
) -> dict[str, int]:
    families = family_doc["families"]
    layers = family_doc["layers"]
    ownership = ownership_doc["ownership"]
    contracts = contract_doc["contracts"]
    chains = chain_doc["chains"]
    decisions = consolidation_doc["consolidation_decisions"]
    closure_items = closure_doc["closure_batches"]

    metadata_docs = [family_doc, ownership_doc, contract_doc, chain_doc, consolidation_doc, closure_doc]
    expected = {
        "family_count": len(families),
        "official_layer_count": sum(1 for layer in layers if layer["classification"] == "official_layer"),
        "contract_count": len(contracts),
        "chain_count": len(chains),
    }
    for doc in metadata_docs:
        metadata = doc.get("metadata", {})
        for key, value in expected.items():
            if key in metadata and metadata[key] != value:
                fail(f"metadata {key} mismatch: expected {value}, found {metadata[key]}")

    family_layer_refs = {
        layer_id
        for family in families
        for key in ("layer_ids", "subsystem_ids", "shared_service_ids", "business_surface_ids", "cross_cutting_control_ids")
        for layer_id in family.get(key, [])
    }
    inactive_classifications = {"merge_into_existing_layer", "deferred_post_v1", "deprecated", "proposed_only", "not_a_layer"}
    mapped_layer_refs = {layer["layer_id"] for layer in layers if layer["classification"] not in inactive_classifications}
    missing_from_families = sorted(mapped_layer_refs - family_layer_refs)
    if missing_from_families:
        fail(f"mapped layers missing from family member lists: {missing_from_families}")

    ownership_owner_ids = {item["canonical_owner_layer_id"] for item in ownership}
    official_ids = {layer["layer_id"] for layer in layers if layer["classification"] == "official_layer"}
    if not ownership_owner_ids.intersection(official_ids):
        fail("ownership matrix does not map responsibilities to official layers")

    chain_contracts = {contract_id for chain in chains for contract_id in chain.get("contract_ids", [])}
    known_contracts = {contract["contract_id"] for contract in contracts}
    if not chain_contracts.issubset(known_contracts):
        fail(f"operational chains reference unknown contracts: {sorted(chain_contracts - known_contracts)}")

    decision_layers = {layer_id for decision in decisions for layer_id in decision.get("affected_ids", [])}
    non_official_layers = {layer["layer_id"] for layer in layers if layer["classification"] != "official_layer"}
    if not decision_layers.intersection(non_official_layers):
        fail("consolidation decisions do not cover any non-official layer posture")

    closure_contracts = {contract_id for item in closure_items for contract_id in item.get("contract_ids", [])}
    if not closure_contracts.issubset(known_contracts):
        fail(f"closure plan references unknown contracts: {sorted(closure_contracts - known_contracts)}")

    return {
        "family_count": len(families),
        "mapped_layer_count": len(layers),
        "contract_count": len(contracts),
        "operational_chain_count": len(chains),
        "consolidation_decision_count": len(decisions),
        "closure_item_count": len(closure_items),
    }


def validate_no_duplicate_authorities() -> None:
    duplicates = [path for path in ARCH_DIR.glob("*MASTER_LAYER_REGISTRY*")]
    if duplicates:
        fail(f"architecture directory contains duplicate Master Layer Registry files: {[rel(path) for path in duplicates]}")


def main() -> None:
    package_b = validate_package_b_evidence()
    validate_markdown_documents()
    validate_no_duplicate_authorities()

    docs = {name: load_json(ARCH_DIR / name) for name in PACKAGE_C_JSON}
    family_doc = docs["SHS_BOS_OFFICIAL_LAYER_FAMILY_REGISTRY_V1.json"]
    ownership_doc = docs["SHS_BOS_LAYER_OWNERSHIP_MATRIX_V1.json"]
    contract_doc = docs["SHS_BOS_LAYER_CONTRACT_REGISTRY_V1.json"]
    chain_doc = docs["SHS_BOS_OPERATIONAL_CHAIN_REGISTRY_V1.json"]
    consolidation_doc = docs["SHS_BOS_LAYER_CONSOLIDATION_DECISIONS_V1.json"]
    closure_doc = docs["SHS_BOS_LAYER_INTEGRATION_CLOSURE_PLAN_V1.json"]

    family_ids, layer_ids = validate_family_registry(family_doc, package_b)
    validate_ownership_matrix(ownership_doc, family_doc, layer_ids)
    contract_ids = validate_contract_registry(contract_doc, family_ids, layer_ids)
    chain_ids = validate_operational_chains(chain_doc, family_ids, layer_ids, contract_ids, package_b)
    validate_consolidation_decisions(consolidation_doc, layer_ids, package_b)
    validate_closure_plan(closure_doc, family_ids, layer_ids, contract_ids, chain_ids, package_b)
    counts = validate_cross_artifact_consistency(
        family_doc,
        ownership_doc,
        contract_doc,
        chain_doc,
        consolidation_doc,
        closure_doc,
    )

    print("PASS: SHS BOS Layer Family Architecture V1 validation OK.")
    print(f"family count: {counts['family_count']}")
    print(f"official-layer mapping count: {counts['mapped_layer_count']}")
    print(f"contract count: {counts['contract_count']}")
    print(f"operational-chain count: {counts['operational_chain_count']}")
    print(f"consolidation-decision count: {counts['consolidation_decision_count']}")
    print(f"closure-item count: {counts['closure_item_count']}")


if __name__ == "__main__":
    main()
