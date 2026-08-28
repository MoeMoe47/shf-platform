#!/usr/bin/env python3
"""Validate the SHF reporting surface census structure."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SURFACE_PATH = ROOT / "docs" / "SHF_REPORTING_SURFACE_REGISTRY.v1.json"
METRIC_PATH = ROOT / "services" / "shf-agent-fabric" / "contracts" / "reporting" / "metric_registry.v1.json"
REPORT_PATH = ROOT / "services" / "shf-agent-fabric" / "contracts" / "reporting" / "report_registry.v1.json"
CLASSIFICATIONS = {"CANONICAL", "PARTIAL_CANONICAL", "MIGRATE", "PRODUCER_REQUIRED", "INGESTION_REQUIRED", "TRUTH_PROJECTION_REQUIRED", "METRIC_REQUIRED", "REPORTING_SERVICE_REQUIRED", "FRONTEND_MIGRATION_REQUIRED", "PROVENANCE_INSUFFICIENT", "DEMO_ONLY", "REMOVE", "BLOCKED", "NOT_APPLICABLE"}
SAFETY_STATUSES = {"SAFE", "SAFE_DEMO", "SUPPRESSED", "DISABLED"}
REQUIRED_FIELDS = {"surface_id", "surface", "route", "component_file", "kpi_displayed", "current_formula", "current_source", "current_storage", "producer", "producer_status", "ingestion_route", "evidence_path", "source_verification", "truth_claim_type", "truth_predicate", "metric_id", "metric_version", "reporting_service", "scope", "provenance_status", "browser_storage", "data_classification", "migration_status", "required_action", "blocker", "code_evidence"}

def _load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def validate() -> dict:
    surfaces = _load(SURFACE_PATH).get("surfaces")
    if not isinstance(surfaces, list) or not surfaces:
        raise ValueError("surface registry must contain surfaces")
    ids = [surface.get("surface_id") for surface in surfaces]
    if any(not item for item in ids) or len(ids) != len(set(ids)):
        raise ValueError("surface IDs must be unique and non-empty")
    metrics = {item["metric_id"] for item in _load(METRIC_PATH)["definitions"]}
    safety_status = _load(SURFACE_PATH).get("wave1_safety_status", {})
    if not isinstance(safety_status, dict) or any(item not in ids for item in safety_status):
        raise ValueError("wave1 safety status keys must reference registered surfaces")
    if any(status not in SAFETY_STATUSES for status in safety_status.values()):
        raise ValueError("wave1 safety status must be explicit and safe")
    for surface in surfaces:
        missing = REQUIRED_FIELDS - surface.keys()
        if missing:
            raise ValueError(f"{surface.get('surface_id', '<unknown>')} missing {sorted(missing)}")
        classification = surface["migration_status"]
        if classification not in CLASSIFICATIONS:
            raise ValueError(f"{surface['surface_id']} has unresolved classification")
        if not surface["code_evidence"]:
            raise ValueError(f"{surface['surface_id']} has no code evidence")
        if classification == "CANONICAL" and (not surface["metric_id"] or not surface["reporting_service"]):
            raise ValueError(f"{surface['surface_id']} canonical row lacks metric/report mapping")
        if surface["metric_id"] and surface["metric_id"] not in metrics:
            raise ValueError(f"{surface['surface_id']} references unknown metric")
    return {"surface_count": len(surfaces), "classification_counts": {name: sum(s["migration_status"] == name for s in surfaces) for name in sorted(CLASSIFICATIONS)}}

if __name__ == "__main__":
    print(json.dumps(validate(), sort_keys=True))
