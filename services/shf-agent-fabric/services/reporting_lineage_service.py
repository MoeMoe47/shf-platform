from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Iterable, List


SERVICE_ROOT = Path(__file__).resolve().parents[1]
LINEAGE_REGISTRY_PATH = SERVICE_ROOT / "contracts" / "reporting" / "producer_lineage_registry.v1.json"

REQUIRED_ENTRY_FIELDS = (
    "lineage_id",
    "producer_id",
    "producer_domain",
    "producer_event_type",
    "producer_application",
    "producer_file",
    "operational_store",
    "evidence_type",
    "truth_eligibility",
    "truth_claim_type",
    "truth_subject_mapping",
    "truth_predicate",
    "verification_policy",
    "approval_policy",
    "metric_ids",
    "report_ids",
    "tenant_scope",
    "organization_scope",
    "sensitivity",
    "public_eligibility",
    "retention_policy",
    "current_runtime_status",
    "evidence",
)

ALLOWED_TRUTH_ELIGIBILITY = {
    "TRUTH_ELIGIBLE",
    "EVIDENCE_ONLY",
    "OPERATIONAL_ONLY",
    "SENSITIVE_RESTRICTED",
    "AGGREGATE_ONLY",
    "PUBLICATION_ELIGIBLE",
    "NOT_APPLICABLE",
}


class LineageRegistryError(ValueError):
    pass


def load_lineage_registry(path: Path = LINEAGE_REGISTRY_PATH) -> Dict[str, Any]:
    try:
        registry = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise LineageRegistryError(f"lineage registry not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise LineageRegistryError(f"lineage registry is not valid JSON: {exc}") from exc
    validate_lineage_registry(registry)
    return registry


def lineage_entries(path: Path = LINEAGE_REGISTRY_PATH) -> List[Dict[str, Any]]:
    return list(load_lineage_registry(path).get("entries", []))


def find_lineage_entry(lineage_id: str, path: Path = LINEAGE_REGISTRY_PATH) -> Dict[str, Any] | None:
    for entry in lineage_entries(path):
        if entry["lineage_id"] == lineage_id:
            return entry
    return None


def find_lineage_for_event(producer_id: str, producer_event_type: str, path: Path = LINEAGE_REGISTRY_PATH) -> Dict[str, Any] | None:
    producer_id = str(producer_id or "").strip()
    producer_event_type = str(producer_event_type or "").strip()
    for entry in lineage_entries(path):
        if entry["producer_id"] == producer_id and entry["producer_event_type"] == producer_event_type:
            return entry
    return None


def validate_lineage_registry(registry: Dict[str, Any]) -> None:
    if not isinstance(registry, dict):
        raise LineageRegistryError("lineage registry must be an object")
    if registry.get("canonical_truth_authority") != "services/shf-agent-fabric/services/truth_spine_service.py":
        raise LineageRegistryError("registry must name the canonical Truth Spine service")
    entries = registry.get("entries")
    if not isinstance(entries, list) or not entries:
        raise LineageRegistryError("registry must contain at least one lineage entry")

    lineage_ids = _unique_values(entries, "lineage_id")
    producer_events = set()
    for entry in entries:
        _validate_entry(entry)
        producer_event_key = (entry["producer_id"], entry["producer_event_type"])
        if producer_event_key in producer_events:
            raise LineageRegistryError(f"duplicate producer event mapping: {producer_event_key}")
        producer_events.add(producer_event_key)

    if len(lineage_ids) != len(entries):
        raise LineageRegistryError("lineage_id values must be unique")


def _validate_entry(entry: Any) -> None:
    if not isinstance(entry, dict):
        raise LineageRegistryError("lineage entries must be objects")
    missing = [field for field in REQUIRED_ENTRY_FIELDS if field not in entry]
    if missing:
        raise LineageRegistryError(f"{entry.get('lineage_id', '<unknown>')} missing fields: {', '.join(missing)}")
    for field in REQUIRED_ENTRY_FIELDS:
        value = entry[field]
        if field in {"truth_claim_type", "truth_subject_mapping", "truth_predicate"}:
            if value is not None and not str(value).strip():
                raise LineageRegistryError(f"{entry['lineage_id']} has blank {field}")
        elif field in {"metric_ids", "report_ids", "evidence"}:
            if not isinstance(value, list):
                raise LineageRegistryError(f"{entry['lineage_id']} {field} must be a list")
        elif not str(value).strip():
            raise LineageRegistryError(f"{entry['lineage_id']} has blank {field}")

    truth_eligibility = entry["truth_eligibility"]
    if truth_eligibility not in ALLOWED_TRUTH_ELIGIBILITY:
        raise LineageRegistryError(f"{entry['lineage_id']} has invalid truth_eligibility: {truth_eligibility}")
    if truth_eligibility == "UNRESOLVED":
        raise LineageRegistryError(f"{entry['lineage_id']} must not use UNRESOLVED")
    if truth_eligibility == "TRUTH_ELIGIBLE":
        for field in ("truth_claim_type", "truth_subject_mapping", "truth_predicate"):
            if not entry.get(field):
                raise LineageRegistryError(f"{entry['lineage_id']} TRUTH_ELIGIBLE entry requires {field}")
    if "browser" in str(entry["operational_store"]).lower() and entry["current_runtime_status"] == "production_ready":
        raise LineageRegistryError(f"{entry['lineage_id']} cannot mark browser storage as production ready")


def _unique_values(entries: Iterable[Dict[str, Any]], field: str) -> set[str]:
    seen: set[str] = set()
    for entry in entries:
        value = str(entry.get(field) or "")
        if value in seen:
            raise LineageRegistryError(f"duplicate {field}: {value}")
        seen.add(value)
    return seen
