from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from services.contract_runtime.core import FOUNDATION_VERSION

ARCHITECTURE_DIR = Path("/Users/mikeslate/Desktop/shrv1/docs/architecture")
ARTIFACT_FILES = {
    "foundation": "SHS_BOS_BATCH_01_CONTRACT_RUNTIME_FOUNDATION_V1.json",
    "identity": "SHS_BOS_BATCH_01_IDENTITY_REGISTRY_V1.json",
    "persistence": "SHS_BOS_BATCH_01_PERSISTENCE_REGISTRY_V1.json",
    "failure_codes": "SHS_BOS_BATCH_01_FAILURE_CODE_REGISTRY_V1.json",
    "gate_results": "SHS_BOS_BATCH_01_RUNTIME_GATE_RESULTS_V1.json",
    "contract_registry": "SHS_BOS_LAYER_CONTRACT_REGISTRY_V1.json",
}


def _architecture_dir() -> Path:
    return Path(os.environ.get("SHS_BOS_ARCHITECTURE_DIR", str(ARCHITECTURE_DIR))).expanduser().resolve(strict=False)


def _read_artifact(name: str) -> dict[str, Any]:
    base = _architecture_dir()
    filename = ARTIFACT_FILES[name]
    path = (base / filename).resolve(strict=False)
    if not str(path).startswith(str(base)):
        return {"metadata": {"status": "blocked_path_escape", "filename": filename}}
    if not path.exists():
        return {"metadata": {"status": "missing", "filename": filename}}
    return json.loads(path.read_text(encoding="utf-8"))


def _now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def foundation_payload(force_refresh: bool = False) -> dict[str, Any]:
    _ = force_refresh
    foundation = _read_artifact("foundation")
    identity = _read_artifact("identity")
    persistence = _read_artifact("persistence")
    failure_codes = _read_artifact("failure_codes")
    gate_results = _read_artifact("gate_results")
    architecture = _read_artifact("contract_registry")
    contract_gate_map = {
        item["contract_id"]: item
        for item in gate_results.get("contract_gate_results", [])
        if item.get("contract_id")
    }
    contracts = []
    for contract in architecture.get("contracts", []):
        enriched = dict(contract)
        enriched["batch_01_gate"] = contract_gate_map.get(contract.get("contract_id"), {})
        contracts.append(enriched)
    return {
        "metadata": {
            "artifact": FOUNDATION_VERSION,
            "status": foundation.get("metadata", {}).get("status", "loaded"),
            "canonical_owner": "admin.html#/ops/executive-command",
            "api_family": "/api/v1-command-center/contract-foundation",
            "generated_at": foundation.get("metadata", {}).get("generated_at"),
            "served_at": _now(),
        },
        "overview": foundation.get("overview", {}),
        "ownership": foundation.get("ownership_decision", {}),
        "duplicate_surface_policy": foundation.get("duplicate_surface_policy", {}),
        "contracts": contracts,
        "representative_contracts": gate_results.get("representative_contracts", []),
        "identity": identity,
        "persistence": persistence,
        "failure_codes": failure_codes,
        "gate_results": gate_results,
        "migrations": persistence.get("local_storage_migration_plan", []),
        "dead_letters": gate_results.get("dead_letter_requirements", []),
        "audit_contract": foundation.get("audit_contract", {}),
        "observability": foundation.get("observability_contract", {}),
    }


def contract_foundation_record(contract_id: str) -> dict[str, Any] | None:
    for contract in foundation_payload().get("contracts", []):
        if contract.get("contract_id") == contract_id:
            return contract
    return None
