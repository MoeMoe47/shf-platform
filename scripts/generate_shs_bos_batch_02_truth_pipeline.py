#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
ARCH_DIR = ROOT / "docs" / "architecture"
SERVICE_ROOT = ROOT / "services" / "shf-agent-fabric"
sys.path.insert(0, str(SERVICE_ROOT))

from services.truth_pipeline.models import PIPELINE_CONTRACT_IDS  # noqa: E402
from services.truth_pipeline.service import CHAIN_ID, REPRESENTATIVE_ENTITY_ID, run_representative_pipeline  # noqa: E402

DOC_NAMES = [
    "SHS_BOS_BATCH_02_UNIFIED_TRUTH_PIPELINE_RUNTIME_CLOSURE_V1.md",
    "SHS_BOS_BATCH_02_TRUTH_PIPELINE_CONTRACT_MAP_V1.md",
    "SHS_BOS_BATCH_02_TRUTH_PACKAGE_SCHEMA_V1.md",
    "SHS_BOS_BATCH_02_TRUTH_PERSISTENCE_AND_VERSIONING_V1.md",
    "SHS_BOS_BATCH_02_REPORTING_CONSUMER_INTEGRATION_V1.md",
    "SHS_BOS_BATCH_02_ACTION_RECOMPUTE_LOOP_V1.md",
    "SHS_BOS_BATCH_02_TRACE_AND_AUDIT_REPORT_V1.md",
    "SHS_BOS_BATCH_02_FAILURE_AND_RECOVERY_REPORT_V1.md",
    "SHS_BOS_BATCH_02_REPRESENTATIVE_ENTITY_EVIDENCE_V1.md",
    "SHS_BOS_BATCH_02_QA_REPORT_V1.md",
    "SHS_BOS_BATCH_02_IMPLEMENTATION_SUMMARY_V1.md",
    "SHS_BOS_BATCH_02_SHARED_UI_SHELL_ISSUE_V1.md",
]


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.write_text(text.rstrip() + "\n", encoding="utf-8")


def table(headers: list[str], rows: list[list[Any]]) -> str:
    lines = ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
    for row in rows:
        lines.append("| " + " | ".join(str(value).replace("\n", " ") for value in row) + " |")
    return "\n".join(lines)


def build_coverage_map(payload: dict[str, Any], contracts: list[dict[str, Any]], package_e_gates: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    transition_by_contract: dict[str, list[dict[str, Any]]] = {}
    for transition in payload["transitions"]:
        transition_by_contract.setdefault(transition["contract_id"], []).append(transition)
    wired_ids = set(PIPELINE_CONTRACT_IDS)
    coverage = []
    for contract in contracts:
        contract_id = contract["contract_id"]
        transitions = transition_by_contract.get(contract_id, [])
        wired = contract_id in wired_ids
        coverage.append({
            "contract_id": contract_id,
            "official_name": contract["official_name"],
            "canonical_owner": {
                "upstream_layer_id": contract["upstream_layer_id"],
                "downstream_layer_id": contract["downstream_layer_id"],
            },
            "package_e_foundation_status": package_e_gates.get(contract_id, {}).get("foundation_gate_status", "missing"),
            "package_f_runtime_component": "services.truth_pipeline.service" if wired else "",
            "runtime_entry_point": "run_representative_pipeline" if wired else "",
            "validation_path": "ContractEnvelope + validate_envelope + test_truth_pipeline_runtime.py" if wired else "",
            "persistence_path": "services/shf-agent-fabric/services/truth_pipeline/runtime_state/state.json" if wired else "",
            "permission_path": "deny_by_default_shs_admin_scope" if wired else "",
            "audit_path": "audit_records + trace_for" if wired else "",
            "failure_path": "Package E failure codes + deterministic retry/dead-letter fixtures" if wired else "",
            "observability_path": "truth_pipeline_payload.observability" if wired else "",
            "test_evidence": "services/shf-agent-fabric/tests/test_truth_pipeline_runtime.py" if wired else "",
            "runtime_wired": wired,
            "v1_blocker": not wired,
            "blocker_reason": "" if wired else "Batch 02 representative runtime does not prove this contract end to end.",
        })
    return coverage


def build_artifacts(payload: dict[str, Any]) -> dict[str, Any]:
    contracts_doc = read_json(ARCH_DIR / "SHS_BOS_LAYER_CONTRACT_REGISTRY_V1.json")
    contracts = contracts_doc["contracts"]
    package_e_doc = read_json(ARCH_DIR / "SHS_BOS_BATCH_01_RUNTIME_GATE_RESULTS_V1.json")
    package_e_gates = {item["contract_id"]: item for item in package_e_doc["contract_gate_results"]}
    coverage = build_coverage_map(payload, contracts, package_e_gates)
    runtime_wired_count = len([item for item in coverage if item["runtime_wired"]])
    blocked_count = len([item for item in coverage if item["v1_blocker"]])
    metadata = {
        "batch_id": "BATCH-02",
        "package": "Package F",
        "generated_at": utc_now(),
        "chain_id": CHAIN_ID,
        "representative_entity_id": REPRESENTATIVE_ENTITY_ID,
        "canonical_api_family": "/api/v1-command-center/truth-pipeline",
        "canonical_owner_surface": "Executive Command Center",
        "runtime_completion_claim": "representative_truth_pipeline_runtime_only",
        "production_readiness_claim": False,
    }
    return {
        "closure": {
            "metadata": metadata,
            "status": "closed_with_runtime_blockers",
            "runtime_wired_count": runtime_wired_count,
            "v1_blocker_count": blocked_count,
            "partially_implemented_count": 0,
            "unmapped_count": 0,
            "implemented_stages": [item["stage"] for item in payload["transitions"]],
            "remaining_blockers": sorted(item["contract_id"] for item in coverage if item["v1_blocker"]),
            "shared_ui_shell_issue": {
                "issue": "SHARED_UI_SHELL_ISSUE — HORIZONTAL_OVERFLOW_AT_390PX",
                "owner": "shared admin shell / frontend platform owner",
                "package_f_disposition": "OUT_OF_SCOPE — DOES_NOT_BLOCK_RUNTIME_CLOSURE",
            },
        },
        "coverage": {
            "metadata": metadata,
            "total_contracts": len(coverage),
            "runtime_wired_contracts": runtime_wired_count,
            "blocked_contracts": blocked_count,
            "partially_implemented_contracts": 0,
            "unmapped_contracts": 0,
            "coverage": coverage,
        },
        "schema": {
            "metadata": metadata,
            "truth_package_schema_version": payload["truth_package"]["schema_version"],
            "required_fields": sorted(payload["truth_package"].keys()),
            "current_truth_package_id": payload["truth_package"]["truth_package_id"],
            "prior_truth_package_id": payload["truth_package"]["prior_truth_package_id"],
            "history_count": len(payload["truth_package_history"]),
        },
        "transition": {
            "metadata": metadata,
            "transition_results": payload["transitions"],
            "runtime_wired_contract_ids": PIPELINE_CONTRACT_IDS,
            "contracts_remaining_blocked": sorted(item["contract_id"] for item in coverage if item["v1_blocker"]),
        },
        "runtime_gates": {
            "metadata": metadata,
            "runtime_gates": payload["runtime_gates"],
        },
        "trace": {
            "metadata": metadata,
            "trace": payload["trace"],
            "audit_records": payload["audit_records"],
            "tracking_events": payload["tracking_events"],
        },
        "failures": {
            "metadata": metadata,
            "failure_count": len(payload["failures"]),
            "dead_letter_count": len([item for item in payload["failures"] if item.get("dead_letter")]),
            "retryable_count": len([item for item in payload["failures"] if item.get("retryable")]),
            "failures": payload["failures"],
        },
        "observability": {
            "metadata": metadata,
            "observability": payload["observability"],
        },
    }


def write_docs(payload: dict[str, Any], artifacts: dict[str, Any]) -> None:
    coverage_rows = [
        [item["contract_id"], item["package_e_foundation_status"], item["runtime_wired"], item["v1_blocker"]]
        for item in artifacts["coverage"]["coverage"]
    ]
    transition_rows = [
        [item["stage"], item["owner_layer_id"], item["contract_id"], item["status"]]
        for item in payload["transitions"]
    ]
    failure_rows = [
        [item["failure_code"], item["transition"], item["retryable"], item.get("dead_letter", False)]
        for item in payload["failures"]
    ]
    docs = {
        DOC_NAMES[0]: f"""# SHS BOS Batch 02 Unified Truth Pipeline Runtime Closure V1

Status: `closed_with_runtime_blockers`.

Canonical owner surface: `Executive Command Center`.

API family: `/api/v1-command-center/truth-pipeline/*`.

Batch 02 proves one deterministic representative Unified Truth runtime path. It does not claim all 35 contracts are runtime-wired, and it does not claim production readiness.

Runtime-wired contracts: `{artifacts["coverage"]["runtime_wired_contracts"]}`.
V1 blockers remaining: `{artifacts["coverage"]["blocked_contracts"]}`.

{table(["Stage", "Owner", "Contract", "Status"], transition_rows)}
""",
        DOC_NAMES[1]: f"""# SHS BOS Batch 02 Truth Pipeline Contract Map V1

Unified Truth chain: `{CHAIN_ID}`.

{table(["Contract", "Package E Foundation", "Runtime Wired", "V1 Blocker"], coverage_rows)}
""",
        DOC_NAMES[2]: f"""# SHS BOS Batch 02 Truth Package Schema V1

Schema version: `{payload["truth_package"]["schema_version"]}`.

Current package: `{payload["truth_package"]["truth_package_id"]}`.

Prior package: `{payload["truth_package"]["prior_truth_package_id"]}`.
""",
        DOC_NAMES[3]: """# SHS BOS Batch 02 Truth Persistence and Versioning V1

Persistence path: `services/shf-agent-fabric/services/truth_pipeline/runtime_state/state.json`.

The frontend is not an authority for Batch 02 truth state. Browser storage remains out of the runtime closure path.
""",
        DOC_NAMES[4]: f"""# SHS BOS Batch 02 Reporting Consumer Integration V1

Reporting consumes Truth Package `{payload["truth_package"]["truth_package_id"]}` through the Package F service payload and read-only truth-pipeline route surface.

Allowed: `{payload["report_readiness"]["allowed"]}`.
Readiness: `{payload["report_readiness"]["readiness_status"]}`.
""",
        DOC_NAMES[5]: f"""# SHS BOS Batch 02 Action Recompute Loop V1

Action event: `{payload["action_events"][0]["action_event_id"]}`.

Recompute status: `{payload["recompute_results"][0]["recompute_status"]}`.

Previous package: `{payload["recompute_results"][0]["previous_truth_package_id"]}`.
New package: `{payload["recompute_results"][0]["new_truth_package_id"]}`.
""",
        DOC_NAMES[6]: f"""# SHS BOS Batch 02 Trace and Audit Report V1

Trace ID: `{payload["trace"]["trace_id"]}`.

Trace records: `{payload["trace"]["record_count"]}`.
Audit records: `{len(payload["audit_records"])}`.
Tracking records: `{len(payload["tracking_events"])}`.
""",
        DOC_NAMES[7]: f"""# SHS BOS Batch 02 Failure and Recovery Report V1

Failure codes align to the Package E failure registry. Retry is bounded by `max_attempts`; exhausted retryable failures and selected nonretryable failures receive a dead-letter disposition.

{table(["Failure", "Transition", "Retryable", "Dead Letter"], failure_rows)}
""",
        DOC_NAMES[8]: f"""# SHS BOS Batch 02 Representative Entity Evidence V1

Representative entity: `{REPRESENTATIVE_ENTITY_ID}`.

Source claims: `{len(payload["representative_fixture"]["source_claims"])}`.
Truth package: `{payload["truth_package"]["truth_package_id"]}`.
Trace ID: `{payload["trace"]["trace_id"]}`.
""",
        DOC_NAMES[9]: """# SHS BOS Batch 02 QA Report V1

Validation is limited to Package F-owned runtime tests, Package F validator checks, and the approved upstream validator chain. No npm build, browser smoke, Vite startup, FastAPI long-running startup, Package A validator, or broad repository pytest is part of this package.
""",
        DOC_NAMES[10]: f"""# SHS BOS Batch 02 Implementation Summary V1

Implemented one bounded representative runtime path for `{CHAIN_ID}` using existing canonical authorities.

Runtime-wired contracts: `{", ".join(PIPELINE_CONTRACT_IDS)}`.

Remaining blocked contracts: `{artifacts["coverage"]["blocked_contracts"]}`.
""",
        DOC_NAMES[11]: """# SHS BOS Batch 02 Shared UI Shell Issue V1

SHARED_UI_SHELL_ISSUE — HORIZONTAL_OVERFLOW_AT_390PX

Owner: shared admin shell / frontend platform owner

Package F disposition: OUT_OF_SCOPE — DOES_NOT_BLOCK_RUNTIME_CLOSURE
""",
    }
    for filename, text in docs.items():
        write_text(ARCH_DIR / filename, text)


def main() -> int:
    ARCH_DIR.mkdir(parents=True, exist_ok=True)
    payload = run_representative_pipeline({"user_id": "usr_batch02_generator", "role": "shs_admin"})
    artifacts = build_artifacts(payload)
    write_json(ARCH_DIR / "SHS_BOS_BATCH_02_UNIFIED_TRUTH_PIPELINE_RUNTIME_CLOSURE_V1.json", artifacts["closure"])
    write_json(ARCH_DIR / "SHS_BOS_BATCH_02_CONTRACT_COVERAGE_MAP_V1.json", artifacts["coverage"])
    write_json(ARCH_DIR / "SHS_BOS_BATCH_02_TRUTH_PACKAGE_SCHEMA_V1.json", artifacts["schema"])
    write_json(ARCH_DIR / "SHS_BOS_BATCH_02_TRANSITION_RESULTS_V1.json", artifacts["transition"])
    write_json(ARCH_DIR / "SHS_BOS_BATCH_02_RUNTIME_GATE_RESULTS_V1.json", artifacts["runtime_gates"])
    write_json(ARCH_DIR / "SHS_BOS_BATCH_02_REPRESENTATIVE_ENTITY_TRACE_V1.json", artifacts["trace"])
    write_json(ARCH_DIR / "SHS_BOS_BATCH_02_FAILURE_RESULTS_V1.json", artifacts["failures"])
    write_json(ARCH_DIR / "SHS_BOS_BATCH_02_OBSERVABILITY_RESULTS_V1.json", artifacts["observability"])
    write_docs(payload, artifacts)
    print("SHS BOS Batch 02 truth pipeline artifacts generated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
