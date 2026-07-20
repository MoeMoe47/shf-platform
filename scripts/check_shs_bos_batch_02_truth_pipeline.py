#!/usr/bin/env python3
from __future__ import annotations

import ast
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
ARCH_DIR = ROOT / "docs" / "architecture"
SERVICE_ROOT = ROOT / "services" / "shf-agent-fabric"
sys.path.insert(0, str(SERVICE_ROOT))

from services.truth_pipeline.models import PIPELINE_CONTRACT_IDS  # noqa: E402

DOCS = [
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

JSONS = [
    "SHS_BOS_BATCH_02_UNIFIED_TRUTH_PIPELINE_RUNTIME_CLOSURE_V1.json",
    "SHS_BOS_BATCH_02_CONTRACT_COVERAGE_MAP_V1.json",
    "SHS_BOS_BATCH_02_TRUTH_PACKAGE_SCHEMA_V1.json",
    "SHS_BOS_BATCH_02_TRANSITION_RESULTS_V1.json",
    "SHS_BOS_BATCH_02_RUNTIME_GATE_RESULTS_V1.json",
    "SHS_BOS_BATCH_02_REPRESENTATIVE_ENTITY_TRACE_V1.json",
    "SHS_BOS_BATCH_02_FAILURE_RESULTS_V1.json",
    "SHS_BOS_BATCH_02_OBSERVABILITY_RESULTS_V1.json",
]

UPSTREAM_VALIDATORS = [
    "scripts/check_shs_bos_v1_layer_audit.py",
    "scripts/check_shs_bos_layer_family_architecture.py",
    "scripts/check_shs_bos_batch_00_owner_review.py",
    "scripts/check_shs_bos_batch_01_contract_foundations.py",
]


def fail(message: str) -> None:
    raise SystemExit(f"SHS BOS Batch 02 validation FAIL: {message}")


def load_json(filename: str) -> dict[str, Any]:
    path = ARCH_DIR / filename
    if not path.exists():
        fail(f"missing JSON artifact {filename}")
    return json.loads(path.read_text(encoding="utf-8"))


def run(command: list[str], cwd: Path = ROOT) -> None:
    result = subprocess.run(command, cwd=cwd, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    print(result.stdout)
    if result.returncode:
        fail(f"command failed: {' '.join(command)}")


def router_verbs() -> set[str]:
    path = ROOT / "services" / "shf-agent-fabric" / "routers" / "truth_pipeline_runtime_routes.py"
    tree = ast.parse(path.read_text(encoding="utf-8"))
    verbs: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            for decorator in node.decorator_list:
                if isinstance(decorator, ast.Call) and isinstance(decorator.func, ast.Attribute):
                    if isinstance(decorator.func.value, ast.Name) and decorator.func.value.id == "router":
                        verbs.add(decorator.func.attr)
    return verbs


def main() -> int:
    for filename in DOCS:
        path = ARCH_DIR / filename
        if not path.exists() or not path.read_text(encoding="utf-8").strip():
            fail(f"missing or empty doc {filename}")
    artifacts = {filename: load_json(filename) for filename in JSONS}
    contracts_doc = load_json("SHS_BOS_LAYER_CONTRACT_REGISTRY_V1.json")
    package_e_foundation = load_json("SHS_BOS_BATCH_01_CONTRACT_RUNTIME_FOUNDATION_V1.json")
    package_e_gates_doc = load_json("SHS_BOS_BATCH_01_RUNTIME_GATE_RESULTS_V1.json")
    package_e_identity = load_json("SHS_BOS_BATCH_01_IDENTITY_REGISTRY_V1.json")
    package_e_persistence = load_json("SHS_BOS_BATCH_01_PERSISTENCE_REGISTRY_V1.json")
    package_e_failures = load_json("SHS_BOS_BATCH_01_FAILURE_CODE_REGISTRY_V1.json")

    contracts = contracts_doc.get("contracts", [])
    if len(contracts) != 35:
        fail(f"expected 35 architecture contracts, found {len(contracts)}")
    contract_ids = {item["contract_id"] for item in contracts}
    if set(PIPELINE_CONTRACT_IDS) - contract_ids:
        fail("Package F pipeline references contract IDs outside Package C")
    coverage = artifacts["SHS_BOS_BATCH_02_CONTRACT_COVERAGE_MAP_V1.json"]
    coverage_rows = coverage.get("coverage", [])
    if len(coverage_rows) != 35:
        fail(f"expected 35 coverage rows, found {len(coverage_rows)}")
    if {item["contract_id"] for item in coverage_rows} != contract_ids:
        fail("coverage map does not match Package C contract registry")
    wired_rows = [item for item in coverage_rows if item.get("runtime_wired")]
    blocked_rows = [item for item in coverage_rows if item.get("v1_blocker")]
    if {item["contract_id"] for item in wired_rows} != set(PIPELINE_CONTRACT_IDS):
        fail("runtime-wired claims do not match Package F pipeline evidence IDs")
    if len(blocked_rows) != 35 - len(PIPELINE_CONTRACT_IDS):
        fail("blocked contract count is not truthful")
    for item in wired_rows:
        for field in ["runtime_entry_point", "validation_path", "persistence_path", "permission_path", "audit_path", "failure_path", "observability_path", "test_evidence"]:
            if not item.get(field):
                fail(f"runtime-wired contract {item['contract_id']} lacks {field}")
    for item in blocked_rows:
        if not item.get("blocker_reason"):
            fail(f"blocked contract {item['contract_id']} lacks blocker reason")

    package_e_gate_ids = {item["contract_id"] for item in package_e_gates_doc.get("contract_gate_results", [])}
    if package_e_gate_ids != contract_ids:
        fail("Package E gate IDs do not match Package C")
    if package_e_foundation["overview"]["contracts_runtime_wired_by_batch_01"] != 0:
        fail("Package E foundation was mutated to claim runtime wiring")
    identity_ids = {item["identifier"] for item in package_e_identity.get("identities", [])}
    for required in {"actor_id", "trace_id", "request_id", "source_id", "entity_id", "workflow_id"}:
        if required not in identity_ids:
            fail(f"Package E identity registry missing {required}")
    if not package_e_persistence.get("local_storage_migration_plan"):
        fail("Package E persistence registry missing migration plan")
    failure_codes = {item["code"] for item in package_e_failures.get("failure_codes", [])}
    failure_artifact = artifacts["SHS_BOS_BATCH_02_FAILURE_RESULTS_V1.json"]
    for failure in failure_artifact.get("failures", []):
        if failure.get("failure_code") not in failure_codes:
            fail(f"Package F failure code not in Package E registry: {failure.get('failure_code')}")
        if failure.get("retryable") and not failure.get("max_attempts"):
            fail(f"retryable failure lacks max_attempts: {failure.get('failure_code')}")
        if failure.get("dead_letter"):
            disposition = failure.get("dead_letter_disposition", {})
            for field in ["original_request_id", "contract_id", "failure_code", "attempt_history", "correlation_id", "trace_id", "last_error_summary", "disposition_timestamp", "replay_eligible"]:
                if field not in disposition:
                    fail(f"dead-letter disposition missing {field}")
    runtime_gates = artifacts["SHS_BOS_BATCH_02_RUNTIME_GATE_RESULTS_V1.json"].get("runtime_gates", [])
    if {item["contract_id"] for item in runtime_gates} != set(PIPELINE_CONTRACT_IDS):
        fail("runtime gate artifact does not match Package F pipeline IDs")
    for gate in runtime_gates:
        if not gate.get("runtime_wired"):
            fail(f"Package F runtime gate not wired for {gate['contract_id']}")
        for check in ["identity_scope", "permissions", "durable_persistence", "trace", "audit", "failure_behavior", "retry_or_no_retry", "observability", "integration_test"]:
            if not gate.get("checks", {}).get(check):
                fail(f"runtime gate {gate['contract_id']} missing check {check}")
    observability = artifacts["SHS_BOS_BATCH_02_OBSERVABILITY_RESULTS_V1.json"].get("observability", {})
    for counter in ["received", "accepted", "rejected", "persisted", "retried", "dead_lettered", "replayed", "released"]:
        if counter not in observability:
            fail(f"observability missing {counter}")
    closure = artifacts["SHS_BOS_BATCH_02_UNIFIED_TRUTH_PIPELINE_RUNTIME_CLOSURE_V1.json"]
    if closure.get("runtime_wired_count") != len(PIPELINE_CONTRACT_IDS):
        fail("closure runtime-wired count is wrong")
    if closure.get("v1_blocker_count") != 35 - len(PIPELINE_CONTRACT_IDS):
        fail("closure blocker count is wrong")
    if closure.get("shared_ui_shell_issue", {}).get("package_f_disposition") != "OUT_OF_SCOPE — DOES_NOT_BLOCK_RUNTIME_CLOSURE":
        fail("shared UI-shell issue not classified as out of scope")
    if set(router_verbs()) != {"get"}:
        fail("Package F router must expose read-only GET routes only")

    for validator in UPSTREAM_VALIDATORS:
        run([sys.executable, validator])
    print("PASS: SHS BOS Batch 02 Unified Truth Pipeline Runtime Closure validation OK.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
