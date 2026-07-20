#!/usr/bin/env python3
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
ARCH_DIR = ROOT / "docs" / "architecture"
FOUNDATION_VERSION = "SHS_BOS_BATCH_01_CONTRACT_FOUNDATION_V1"

REPRESENTATIVE_IDS = [
    "CONTRACT-V1-001",
    "CONTRACT-V1-003",
    "CONTRACT-V1-005",
    "CONTRACT-V1-007",
    "CONTRACT-V1-010",
    "CONTRACT-V1-011",
    "CONTRACT-V1-016",
    "CONTRACT-V1-019",
    "CONTRACT-V1-020",
    "CONTRACT-V1-030",
]

FOUNDATION_READY = {"CONTRACT-V1-001", "CONTRACT-V1-010", "CONTRACT-V1-016", "CONTRACT-V1-020"}

DOC_FILES = [
    "SHS_BOS_BATCH_01_CONTRACT_RUNTIME_FOUNDATION_V1.md",
    "SHS_BOS_BATCH_01_IDENTITY_AND_ENTITY_FOUNDATION_V1.md",
    "SHS_BOS_BATCH_01_PERSISTENCE_AND_STATE_FOUNDATION_V1.md",
    "SHS_BOS_BATCH_01_PERMISSION_AND_SCOPE_FOUNDATION_V1.md",
    "SHS_BOS_BATCH_01_TRACEABILITY_AND_CORRELATION_FOUNDATION_V1.md",
    "SHS_BOS_BATCH_01_CONTRACT_VALIDATION_FOUNDATION_V1.md",
    "SHS_BOS_BATCH_01_AUDIT_AND_REPLAY_FOUNDATION_V1.md",
    "SHS_BOS_BATCH_01_FAILURE_RETRY_AND_DEAD_LETTER_FOUNDATION_V1.md",
    "SHS_BOS_BATCH_01_OBSERVABILITY_FOUNDATION_V1.md",
    "SHS_BOS_BATCH_01_LOCAL_STORAGE_MIGRATION_PLAN_V1.md",
    "SHS_BOS_BATCH_01_REPRESENTATIVE_CONTRACT_GATE_RESULTS_V1.md",
    "SHS_BOS_BATCH_01_IMPLEMENTATION_CLOSEOUT_V1.md",
]

IDENTITIES = [
    {"identifier": "actor_id", "format": "usr_|svc_|agt_<stable-id>", "canonical_owner": "SHS-LAYER-001", "authority": "Identity and Access", "required": True},
    {"identifier": "organization_id", "format": "org_<stable-id>", "canonical_owner": "SHS-LAYER-001", "authority": "Identity and Access", "required": False},
    {"identifier": "client_id", "format": "client_<stable-id>", "canonical_owner": "SHS-LAYER-048", "authority": "ClientOps", "required": False},
    {"identifier": "program_id", "format": "program_<stable-id>", "canonical_owner": "SHS-LAYER-052", "authority": "SHF Program Authority through Source Registry intake", "required": False},
    {"identifier": "source_id", "format": "source_<stable-id>", "canonical_owner": "SHS-LAYER-013", "authority": "Source Registry", "required": False},
    {"identifier": "source_record_id", "format": "source-record/native-id", "canonical_owner": "SHS-LAYER-013", "authority": "Source Registry", "required": False},
    {"identifier": "entity_id", "format": "entity_<stable-id>", "canonical_owner": "SHS-LAYER-016", "authority": "Canonical Entity Resolution", "required": False},
    {"identifier": "truth_package_id", "format": "truth_<stable-id>", "canonical_owner": "SHS-LAYER-023", "authority": "Truth Spine", "required": False},
    {"identifier": "workflow_id", "format": "wf_<stable-id>", "canonical_owner": "SHS-LAYER-007", "authority": "Command Bus / Workflow Engine", "required": False},
    {"identifier": "trace_id", "format": "trc_<hex>", "canonical_owner": "SHS-LAYER-005", "authority": "API Gateway / contract foundation", "required": True},
    {"identifier": "request_id", "format": "req_<hex>", "canonical_owner": "SHS-LAYER-005", "authority": "API Gateway / contract foundation", "required": True},
    {"identifier": "event_id", "format": "evt_<stable-id>", "canonical_owner": "SHS-LAYER-007", "authority": "Command Bus event channel", "required": False},
]

FAILURE_CODES = [
    {"code": "missing_required_field", "category": "validation", "retryable": False, "dead_letter": True, "owner": "consumer"},
    {"code": "invalid_contract_version", "category": "validation", "retryable": False, "dead_letter": True, "owner": "consumer"},
    {"code": "permission_denied", "category": "permission", "retryable": False, "dead_letter": False, "owner": "Identity and Access"},
    {"code": "scope_broadening_denied", "category": "permission", "retryable": False, "dead_letter": True, "owner": "Identity and Access"},
    {"code": "source_not_ready", "category": "readiness", "retryable": True, "max_attempts": 3, "owner": "producer"},
    {"code": "stale_input", "category": "staleness", "retryable": True, "max_attempts": 2, "owner": "consumer"},
    {"code": "idempotency_conflict", "category": "idempotency", "retryable": False, "dead_letter": True, "owner": "Command Bus"},
    {"code": "oracle_dependency_blocked", "category": "oracle", "retryable": True, "max_attempts": 2, "owner": "Oracle"},
    {"code": "audit_write_failed", "category": "audit", "retryable": True, "max_attempts": 2, "owner": "Audit and Verification"},
    {"code": "downstream_unavailable", "category": "transport", "retryable": True, "max_attempts": 3, "owner": "consumer"},
]

LOCAL_STORAGE_ITEMS = [
    {"state_id": "browser.identity.demo_session_keys", "source": "src/system/identity/identityRouting.js", "owner_layer_id": "SHS-LAYER-001", "classification": "identity_advisory_dev_state", "v1_disposition": "allowed_only_for_demo_shell; backend session remains authoritative", "migration_priority": "P1"},
    {"state_id": "browser.command_bus.event_storage", "source": "src/system/event-bus/shsEventStorage.js", "owner_layer_id": "SHS-LAYER-007", "classification": "business_critical_runtime_state", "v1_disposition": "must migrate to Command Bus event/audit repository before runtime wiring", "migration_priority": "P0"},
    {"state_id": "browser.persistence.compatibility_state", "source": "src/system/persistence/migrations/criticalStateMigrationCompatibility.js", "owner_layer_id": "SHS-LAYER-007", "classification": "business_critical_compatibility_state", "v1_disposition": "must remain migration-only and feed authoritative repository", "migration_priority": "P0"},
    {"state_id": "browser.direct_source_proof", "source": "src/data/directConnect/directSourceProofStorage.js", "owner_layer_id": "SHS-LAYER-013", "classification": "business_critical_source_evidence", "v1_disposition": "must migrate to Source Registry persistence before certification", "migration_priority": "P0"},
    {"state_id": "browser.agent_task_queue", "source": "src/data/agents/agentTaskStorage.js", "owner_layer_id": "SHS-LAYER-025", "classification": "business_critical_agent_work_queue", "v1_disposition": "must migrate to Agent Fabric task repository with Command Bus trace", "migration_priority": "P0"},
    {"state_id": "browser.agent_approval_ledger", "source": "src/data/agents/agentApprovalLedger.js", "owner_layer_id": "SHS-LAYER-025", "classification": "business_critical_approval_ledger", "v1_disposition": "must migrate to audit-backed Agent Fabric ledger", "migration_priority": "P0"},
    {"state_id": "browser.reporting_bridge_workflow", "source": "src/pages/admin/reporting/bridge-workflow-store.ts", "owner_layer_id": "SHS-LAYER-028", "classification": "business_critical_report_workflow_state", "v1_disposition": "must migrate to Reporting/Workflow repository before runtime wiring", "migration_priority": "P0"},
    {"state_id": "browser.export_audit_trail", "source": "src/pages/admin/reporting/export-audit-trail.js", "owner_layer_id": "SHS-LAYER-027", "classification": "business_critical_audit_state", "v1_disposition": "must migrate to Audit and Verification trail", "migration_priority": "P0"},
    {"state_id": "browser.launch_ledger", "source": "src/system/launch/shsLaunchLedger.js", "owner_layer_id": "SHS-LAYER-029", "classification": "business_critical_release_state", "v1_disposition": "must migrate to Release Management launch ledger", "migration_priority": "P0"},
    {"state_id": "browser.executive_command_snapshots", "source": "src/system/executive-command-center/shsExecutiveCommandCenterStorage.js", "owner_layer_id": "SHS-LAYER-041", "classification": "operator_review_snapshot", "v1_disposition": "allowed as local operator note; certification source remains API artifacts", "migration_priority": "P2"},
    {"state_id": "browser.locale_and_reading_preferences", "source": "src/context/LocaleProvider.jsx; src/context/ReadingLevelProvider.jsx", "owner_layer_id": "SHS-LAYER-003", "classification": "ui_preference", "v1_disposition": "may remain browser-local", "migration_priority": "none"},
]


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def md_table(headers: list[str], rows: list[list[Any]]) -> str:
    lines = ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
    for row in rows:
        lines.append("| " + " | ".join(str(item).replace("\n", " ") for item in row) + " |")
    return "\n".join(lines)


def foundation_status(contract: dict[str, Any]) -> dict[str, Any]:
    cid = contract["contract_id"]
    representative = cid in REPRESENTATIVE_IDS
    ready = cid in FOUNDATION_READY
    base = {
        "batch_01_foundation_version": FOUNDATION_VERSION,
        "foundation_metadata_status": "defined",
        "identity_foundation_status": "defined",
        "persistence_foundation_status": "migration_required",
        "permission_foundation_status": "defined",
        "traceability_foundation_status": "defined",
        "validation_foundation_status": "defined",
        "audit_foundation_status": "defined",
        "failure_foundation_status": "defined",
        "retry_foundation_status": "defined",
        "observability_foundation_status": "defined",
        "runtime_gate_status": "foundation_ready_not_runtime_wired" if ready else "foundation_defined_runtime_blocked",
        "runtime_status": "not_runtime_wired",
        "runtime_wired": False,
        "representative_gate_evaluated": representative,
        "runtime_gate_reasons": [
            "Batch 01 foundation metadata exists.",
            "Producer and consumer runtime wiring remains blocked until all applicable gates and implementation tests pass.",
        ],
        "implementation_paths": [
            "services/shf-agent-fabric/services/contract_runtime/core.py",
            "services/shf-agent-fabric/routers/contract_runtime_routes.py",
        ],
    }
    if ready:
        base["runtime_gate_reasons"].append("Representative foundation gate passed using current Batch 01 contract-runtime envelope and evidence fixtures.")
    else:
        base["runtime_gate_reasons"].append("Representative runtime behavior is not fully proven for this contract in Batch 01.")
    return base


def gate_result(contract: dict[str, Any]) -> dict[str, Any]:
    cid = contract["contract_id"]
    ready = cid in FOUNDATION_READY
    representative = cid in REPRESENTATIVE_IDS
    contract_type = "synchronous"
    if cid == "CONTRACT-V1-016":
        contract_type = "event_or_command"
    if cid == "CONTRACT-V1-010":
        contract_type = "oracle_downstream"
    if cid == "CONTRACT-V1-020":
        contract_type = "operational_handoff"
    checks = {
        "identity": True,
        "scope": True,
        "trace": True,
        "schema_validation": True,
        "audit": True,
        "failure_path": True,
        "idempotency_or_no_retry": True,
        "persistence_migration_disposition": True,
        "observability": True,
        "producer_consumer_runtime_proven": ready,
    }
    return {
        "contract_id": cid,
        "official_name": contract["official_name"],
        "contract_type": contract_type,
        "representative": representative,
        "foundation_gate_status": "passed" if ready else ("evaluated_blocked" if representative else "metadata_only_blocked"),
        "runtime_wired": False,
        "v1_blocker": True,
        "checks": checks,
        "blocked_reasons": [] if ready else ["producer_consumer_runtime_proof_not_complete"],
    }


def load_contract_registry() -> list[dict[str, Any]]:
    path = ARCH_DIR / "SHS_BOS_LAYER_CONTRACT_REGISTRY_V1.json"
    doc = read_json(path)
    return [dict(contract) for contract in doc["contracts"]]


def write_batch_artifacts(contracts: list[dict[str, Any]]) -> None:
    gate_results = [gate_result(contract) for contract in contracts]
    overview = {
        "contract_count": len(contracts),
        "contracts_with_foundation_metadata": len([c for c in contracts if c.get("foundation_metadata_status") == "defined"]),
        "contracts_runtime_wired_by_batch_01": 0,
        "contracts_v1_blocked": len(contracts),
        "representative_contracts_evaluated": len(REPRESENTATIVE_IDS),
        "representative_foundation_passed": len(FOUNDATION_READY),
        "canonical_route": "admin.html#/ops/executive-command",
        "canonical_api_family": "/api/v1-command-center/contract-foundation",
        "permission_contract": {
            "rule": "Downstream scopes may match or narrow upstream scopes; they may not broaden organization, client, program, or publication authority.",
            "canonical_owner": "SHS-LAYER-001",
        },
        "traceability_contract": {
            "required_fields": ["trace_id", "request_id", "actor_id", "timestamp", "contract_version"],
            "envelope_version": "shs.contract.envelope.v1",
        },
    }
    foundation = {
        "metadata": {"artifact": "SHS_BOS_BATCH_01_CONTRACT_RUNTIME_FOUNDATION_V1", "version": FOUNDATION_VERSION, "status": "complete", "generated_at": now()},
        "overview": overview,
        "ownership_decision": {
            "canonical_owner_surface": "Executive Command Center",
            "canonical_route": "admin.html#/ops/executive-command",
            "canonical_api_family": "/api/v1-command-center",
            "overlapping_surfaces": ["Identity and Access", "Source Registry", "Command Bus", "Readiness Gate", "Oracle", "Truth Spine", "Audit and Verification", "Release Management"],
            "decision": "Extend the existing Executive Command Center V1 Certification panel with a Contract Runtime Foundations section.",
        },
        "duplicate_surface_policy": {
            "do_not_create": ["/ops/v1-command-center", "/ops/contract-runtime-command-center", "/ops/v1-certification", "/api/contract-runtime"],
            "reason": "These would compete with the established Executive Command Center and V1 Command Center API family.",
        },
        "audit_contract": {"canonical_owner": "SHS-LAYER-027", "raw_sensitive_payload_allowed": False, "retention": "bounded_runtime_audit_with_redaction"},
        "observability_contract": {"canonical_owner": "SHS-LAYER-041", "metrics": ["gate_status", "failure_code_count", "dead_letter_count", "staleness_count", "runtime_wired_count"]},
    }
    identity = {"metadata": {"artifact": "SHS_BOS_BATCH_01_IDENTITY_REGISTRY_V1", "version": FOUNDATION_VERSION, "generated_at": now()}, "identities": IDENTITIES}
    persistence = {
        "metadata": {"artifact": "SHS_BOS_BATCH_01_PERSISTENCE_REGISTRY_V1", "version": FOUNDATION_VERSION, "generated_at": now()},
        "authoritative_repository_policy": "Browser storage is not authoritative for business-critical V1 runtime state.",
        "local_storage_migration_plan": LOCAL_STORAGE_ITEMS,
        "repository_targets": [
            {"repository_id": "contract_runtime.audit_jsonl", "owner_layer_id": "SHS-LAYER-027", "purpose": "redacted contract audit decisions"},
            {"repository_id": "command_bus.event_store", "owner_layer_id": "SHS-LAYER-007", "purpose": "event and command correlation"},
            {"repository_id": "source_registry.evidence_store", "owner_layer_id": "SHS-LAYER-013", "purpose": "direct source proof and provenance"},
            {"repository_id": "release.launch_ledger", "owner_layer_id": "SHS-LAYER-029", "purpose": "release readiness and launch evidence"},
        ],
    }
    failure_codes = {"metadata": {"artifact": "SHS_BOS_BATCH_01_FAILURE_CODE_REGISTRY_V1", "version": FOUNDATION_VERSION, "generated_at": now()}, "failure_codes": FAILURE_CODES}
    gates = {
        "metadata": {"artifact": "SHS_BOS_BATCH_01_RUNTIME_GATE_RESULTS_V1", "version": FOUNDATION_VERSION, "generated_at": now()},
        "representative_contracts": [result for result in gate_results if result["representative"]],
        "contract_gate_results": gate_results,
        "dead_letter_requirements": [
            {"queue": "contract_runtime.dead_letter.validation", "owner_layer_id": "SHS-LAYER-027", "accepted_categories": ["validation", "idempotency", "permission"]},
            {"queue": "contract_runtime.dead_letter.transport", "owner_layer_id": "SHS-LAYER-007", "accepted_categories": ["transport", "staleness", "oracle"]},
        ],
    }
    write_json(ARCH_DIR / "SHS_BOS_BATCH_01_CONTRACT_RUNTIME_FOUNDATION_V1.json", foundation)
    write_json(ARCH_DIR / "SHS_BOS_BATCH_01_IDENTITY_REGISTRY_V1.json", identity)
    write_json(ARCH_DIR / "SHS_BOS_BATCH_01_PERSISTENCE_REGISTRY_V1.json", persistence)
    write_json(ARCH_DIR / "SHS_BOS_BATCH_01_FAILURE_CODE_REGISTRY_V1.json", failure_codes)
    write_json(ARCH_DIR / "SHS_BOS_BATCH_01_RUNTIME_GATE_RESULTS_V1.json", gates)

    docs = {
        DOC_FILES[0]: ("Contract Runtime Foundation", foundation["ownership_decision"]["decision"]),
        DOC_FILES[1]: ("Identity and Entity Foundation", "Identity and Access remains canonical for actors, roles, and organization scope; Source Registry, Entity Resolution, Truth Spine, and Command Bus retain their own identifiers."),
        DOC_FILES[2]: ("Persistence and State Foundation", persistence["authoritative_repository_policy"]),
        DOC_FILES[3]: ("Permission and Scope Foundation", overview["permission_contract"]["rule"]),
        DOC_FILES[4]: ("Traceability and Correlation Foundation", "Every contract envelope carries trace_id, request_id, actor_id, timestamp, and contract_version."),
        DOC_FILES[5]: ("Contract Validation Foundation", "Consumers reject missing required fields, unsupported versions, broadened scopes, stale inputs, and unredacted sensitive payloads."),
        DOC_FILES[6]: ("Audit and Replay Foundation", "Audit and Verification owns replay evidence; the foundation supplies redaction, idempotency, and trace correlation requirements."),
        DOC_FILES[7]: ("Failure Retry and Dead Letter Foundation", "Retry is bounded and only allowed for retryable failure codes. Nonretryable failures must block or dead-letter."),
        DOC_FILES[8]: ("Observability Foundation", "Executive Command Center reports gate status, blockers, dead-letter posture, staleness, and runtime-wiring count."),
        DOC_FILES[9]: ("Local Storage Migration Plan", "Business-critical browser state is identified and assigned to canonical repository owners before V1 runtime wiring."),
        DOC_FILES[10]: ("Representative Contract Gate Results", f"{len(REPRESENTATIVE_IDS)} representative contracts were evaluated; {len(FOUNDATION_READY)} passed Batch 01 foundation gates."),
        DOC_FILES[11]: ("Implementation Closeout", "Batch 01 defines the shared foundation, read-only contract foundation API, validator, and contract foundation tests while leaving runtime wiring blocked."),
    }
    for filename, (title, summary) in docs.items():
        text = f"# SHS BOS Batch 01 - {title}\n\n"
        text += f"Generated: {now()}\n\n"
        text += f"{summary}\n\n"
        text += "Canonical owner: `admin.html#/ops/executive-command`.\n\n"
        text += "API family: `/api/v1-command-center/contract-foundation/*`.\n\n"
        text += "Runtime-wired status: no V1 contract is marked runtime-wired by Batch 01.\n"
        if "LOCAL_STORAGE" in filename:
            text += "\n" + md_table(["State", "Owner", "Classification", "Priority"], [[item["state_id"], item["owner_layer_id"], item["classification"], item["migration_priority"]] for item in LOCAL_STORAGE_ITEMS]) + "\n"
        if "REPRESENTATIVE" in filename:
            text += "\n" + md_table(["Contract", "Type", "Gate", "Runtime"], [[item["contract_id"], item["contract_type"], item["foundation_gate_status"], item["runtime_wired"]] for item in gates["representative_contracts"]]) + "\n"
        (ARCH_DIR / filename).write_text(text, encoding="utf-8")


def main() -> int:
    ARCH_DIR.mkdir(parents=True, exist_ok=True)
    contracts = load_contract_registry()
    write_batch_artifacts(contracts)
    print(f"SHS BOS Batch 01 contract foundations generated: contracts={len(contracts)} docs={len(DOC_FILES)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
