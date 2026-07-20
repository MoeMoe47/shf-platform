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

DOCS = [
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

JSONS = [
    "SHS_BOS_BATCH_01_CONTRACT_RUNTIME_FOUNDATION_V1.json",
    "SHS_BOS_BATCH_01_IDENTITY_REGISTRY_V1.json",
    "SHS_BOS_BATCH_01_PERSISTENCE_REGISTRY_V1.json",
    "SHS_BOS_BATCH_01_FAILURE_CODE_REGISTRY_V1.json",
    "SHS_BOS_BATCH_01_RUNTIME_GATE_RESULTS_V1.json",
]

UPSTREAM_VALIDATORS = [
    "scripts/check_shs_bos_v1_layer_audit.py",
    "scripts/check_shs_bos_layer_family_architecture.py",
    "scripts/check_shs_bos_batch_00_owner_review.py",
]


def fail(message: str) -> None:
    raise SystemExit(f"SHS BOS Batch 01 validation FAIL: {message}")


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


def router_get_paths() -> list[str]:
    path = ROOT / "services" / "shf-agent-fabric" / "routers" / "contract_runtime_routes.py"
    tree = ast.parse(path.read_text(encoding="utf-8"))
    verbs: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            for decorator in node.decorator_list:
                if isinstance(decorator, ast.Call) and isinstance(decorator.func, ast.Attribute):
                    if isinstance(decorator.func.value, ast.Name) and decorator.func.value.id == "router":
                        verbs.append(decorator.func.attr)
    return verbs


def main() -> int:
    for filename in DOCS:
        path = ARCH_DIR / filename
        if not path.exists() or not path.read_text(encoding="utf-8").strip():
            fail(f"missing or empty doc {filename}")
    artifacts = {filename: load_json(filename) for filename in JSONS}
    foundation = artifacts["SHS_BOS_BATCH_01_CONTRACT_RUNTIME_FOUNDATION_V1.json"]
    identity = artifacts["SHS_BOS_BATCH_01_IDENTITY_REGISTRY_V1.json"]
    persistence = artifacts["SHS_BOS_BATCH_01_PERSISTENCE_REGISTRY_V1.json"]
    failures = artifacts["SHS_BOS_BATCH_01_FAILURE_CODE_REGISTRY_V1.json"]
    gates = artifacts["SHS_BOS_BATCH_01_RUNTIME_GATE_RESULTS_V1.json"]
    contracts_doc = load_json("SHS_BOS_LAYER_CONTRACT_REGISTRY_V1.json")
    contracts = contracts_doc.get("contracts", [])
    if len(contracts) != 35:
        fail(f"expected 35 contracts, found {len(contracts)}")
    contract_ids = [contract.get("contract_id") for contract in contracts]
    if len(contract_ids) != len(set(contract_ids)):
        fail("contract registry contains duplicate contract IDs")
    gate_results = gates.get("contract_gate_results", [])
    gate_ids = [result.get("contract_id") for result in gate_results]
    if len(gate_results) != 35:
        fail(f"expected 35 Batch 01 gate results, found {len(gate_results)}")
    if set(gate_ids) != set(contract_ids):
        fail("Batch 01 gate results do not match the Package C contract registry")
    if any(contract.get("runtime_wired") is True for contract in contracts):
        fail("Package C contract registry marks a contract runtime-wired before Batch 02")
    if any(contract.get("runtime_status") == "runtime_wired" for contract in contracts):
        fail("Package C contract registry uses runtime_wired status before Batch 02")
    if any(not contract.get("v1_blocker") for contract in contracts):
        fail("Package C contract registry cleared a V1 blocker before Batch 02")
    if foundation["overview"]["contracts_with_foundation_metadata"] != 35:
        fail("foundation overview does not account for all 35 contracts")
    if foundation["overview"]["contracts_runtime_wired_by_batch_01"] != 0:
        fail("Batch 01 foundation overview claims runtime-wired contracts")
    if foundation["overview"]["contracts_v1_blocked"] != 35:
        fail("Batch 01 foundation overview must keep all 35 contracts blocked for runtime closure")
    if foundation["overview"]["canonical_route"] != "admin.html#/ops/executive-command":
        fail("canonical route drifted")
    if "/ops/v1-command-center" not in foundation["duplicate_surface_policy"]["do_not_create"]:
        fail("duplicate command-center route is not blocked by policy")
    identifiers = [item["identifier"] for item in identity.get("identities", [])]
    if len(identifiers) != len(set(identifiers)):
        fail("identity registry contains duplicate identifiers")
    required_identifiers = {"actor_id", "trace_id", "request_id", "source_id", "entity_id", "workflow_id"}
    if not required_identifiers.issubset(set(identifiers)):
        fail("identity registry missing required identifiers")
    migration_plan = persistence.get("local_storage_migration_plan", [])
    business_critical = [item for item in migration_plan if item.get("classification", "").startswith("business_critical")]
    if len(business_critical) < 6:
        fail("business-critical browser state migration plan is incomplete")
    if any(item.get("migration_priority") == "none" for item in business_critical):
        fail("business-critical browser state cannot have migration priority none")
    codes = failures.get("failure_codes", [])
    code_values = [item["code"] for item in codes]
    if len(code_values) != len(set(code_values)):
        fail("failure codes are not unique")
    for item in codes:
        if item.get("retryable") and not item.get("max_attempts"):
            fail(f"retryable failure code {item['code']} lacks max_attempts")
        if not item.get("retryable") and item.get("max_attempts"):
            fail(f"nonretryable failure code {item['code']} has max_attempts")
    representative = gates.get("representative_contracts", [])
    if len(representative) < 10:
        fail("fewer than 10 representative contracts were evaluated")
    types = {item["contract_type"] for item in representative if item.get("foundation_gate_status") == "passed"}
    for required in {"synchronous", "event_or_command", "oracle_downstream", "operational_handoff"}:
        if required not in types:
            fail(f"no passing representative for {required}")
    if any(item.get("runtime_wired") for item in gate_results):
        fail("Batch 01 runtime gate result marked a contract runtime-wired")
    if any(not item.get("v1_blocker") for item in gate_results):
        fail("Batch 01 runtime gate result cleared a V1 blocker")
    blocked = [item for item in gate_results if item.get("v1_blocker")]
    if len(blocked) != 35:
        fail(f"expected 35 Batch 01 blockers, found {len(blocked)}")
    verbs = router_get_paths()
    if set(verbs) != {"get"}:
        fail(f"contract foundation API must be read-only GET routes, found {sorted(set(verbs))}")

    for validator in UPSTREAM_VALIDATORS:
        run([sys.executable, validator])
    print("PASS: SHS BOS Batch 01 Contract Foundations validation OK.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
