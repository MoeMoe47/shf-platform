from __future__ import annotations

from typing import Any, Dict, List


SUPPORTED_CANONICAL_TYPES = [
    "county",
    "program",
    "metric",
    "story",
    "organization",
    "source",
    "evidence",
    "unknown",
]

ALIAS_GROUPS: Dict[str, List[str]] = {
    "county_name": ["countyName", "county", "county_name"],
    "program_name": ["programName", "program", "program_name"],
    "metric_name": ["metricName", "metric", "metric_name"],
    "source_url": ["sourceUrl", "source_url", "url"],
    "source_name": ["sourceName", "source_name"],
    "value": ["value", "metricValue", "metric_value"],
    "status": ["status", "approvalStatus"],
    "last_updated": ["updatedAt", "lastUpdated", "last_updated"],
    "story_text": ["storyText", "story", "story_text", "narrative"],
    "organization_name": ["organizationName", "organization", "orgName", "org_name", "organization_name"],
    "evidence_type": ["evidenceType", "evidence_type"],
    "source_id": ["sourceId", "source_id"],
    "provenance": ["provenance"],
}

DOWNSTREAM_TARGETS = [
    "Evidence Package",
    "Truth Spine",
    "Oracle",
    "Reports",
    "Watchtower",
    "LOO",
    "SHF Impact Data Spine",
    "Data Approval Gateway",
]

BOUNDARY_WARNINGS = [
    "Data Normalization prepares canonical shapes only.",
    "Data Normalization does not verify truth, public-approve data, publish reports, or mutate SHF Impact Data Spine.",
]


def _clean_str(value: Any) -> str:
    return str(value or "").strip()


def _first_present(record: Dict[str, Any], aliases: List[str]) -> Any:
    for alias in aliases:
        if alias in record and record.get(alias) not in (None, ""):
            return record.get(alias)
    return None


def _normalize_value(field: str, value: Any) -> Any:
    if field == "value":
        if isinstance(value, bool):
            return value
        try:
            text = _clean_str(value).replace(",", "")
            if text == "":
                return ""
            numeric = float(text)
            return int(numeric) if numeric.is_integer() else numeric
        except (TypeError, ValueError):
            return _clean_str(value)
    return _clean_str(value)


def _canonical_record(record: Dict[str, Any]) -> Dict[str, Any]:
    normalized: Dict[str, Any] = {}
    for canonical_field, aliases in ALIAS_GROUPS.items():
        value = _first_present(record, aliases)
        if value not in (None, ""):
            normalized[canonical_field] = _normalize_value(canonical_field, value)
    return normalized


def _candidate_types(normalized: Dict[str, Any]) -> List[str]:
    candidates: List[str] = []
    if normalized.get("county_name"):
        candidates.append("county")
    if normalized.get("program_name"):
        candidates.append("program")
    if normalized.get("metric_name") or "value" in normalized:
        candidates.append("metric")
    if normalized.get("story_text"):
        candidates.append("story")
    if normalized.get("organization_name"):
        candidates.append("organization")
    if not candidates and (normalized.get("source_name") or normalized.get("source_url")):
        candidates.append("source")
    if not candidates and normalized.get("evidence_type"):
        candidates.append("evidence")
    return candidates


def _canonical_type(normalized: Dict[str, Any], input_type: str) -> tuple[str, List[str]]:
    requested = input_type.lower()
    candidates = _candidate_types(normalized)
    if requested in SUPPORTED_CANONICAL_TYPES and requested != "unknown":
        return requested, candidates
    if len(candidates) == 1:
        return candidates[0], candidates
    if not candidates:
        return "unknown", candidates
    return candidates[0], candidates


def _provenance(normalized: Dict[str, Any], record: Dict[str, Any]) -> Dict[str, Any]:
    source_name = normalized.get("source_name") or _clean_str(record.get("title"))
    source_url = normalized.get("source_url") or _clean_str(record.get("uri"))
    return {
        "source_id": normalized.get("source_id") or _clean_str(record.get("source_id")),
        "source_name": source_name,
        "source_url": source_url,
        "provenance": normalized.get("provenance") or _clean_str(record.get("provenance")),
    }


def normalize_record(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    record = dict(payload or {})
    input_type = _clean_str(record.get("input_type") or record.get("source_type") or record.get("entity_type") or "unknown").lower()
    normalized = _canonical_record(record)
    canonical_type, candidates = _canonical_type(normalized, input_type)
    provenance = _provenance(normalized, record)
    warnings: List[str] = []
    blockers: List[str] = []

    if canonical_type == "unknown":
        warnings.append("unknown_canonical_type")
        blockers.append("missing_canonical_entity_signal")
    if len(set(candidates)) > 1 and input_type not in SUPPORTED_CANONICAL_TYPES:
        warnings.append("ambiguous_entity_match")
        blockers.append("ambiguous_entity_match")
    if not provenance["source_name"]:
        warnings.append("missing_source_name")
        blockers.append("missing_source_name")
    if not provenance["source_url"]:
        warnings.append("missing_source_url")
        blockers.append("missing_source_url")
    if not provenance["provenance"]:
        warnings.append("missing_provenance")

    ready = not blockers and canonical_type != "unknown"

    return {
        "ok": True,
        "layer": "data_normalization",
        "input_type": input_type,
        "canonical_type": canonical_type,
        "normalized_record": normalized,
        "provenance": provenance,
        "warnings": warnings,
        "blockers": blockers,
        "ready_for_evidence_package": ready,
        "ready_for_truth_spine": ready,
        "ready_for_public_approval": False,
        "downstream_targets": list(DOWNSTREAM_TARGETS),
        "verifies_truth": False,
        "approves_public_data": False,
    }


def batch_normalize(records: Any) -> Dict[str, Any]:
    items = records if isinstance(records, list) else []
    normalized_items = [normalize_record(item if isinstance(item, dict) else {}) for item in items]
    return {
        "ok": True,
        "layer": "data_normalization",
        "total": len(normalized_items),
        "normalized": len([item for item in normalized_items if item["canonical_type"] != "unknown"]),
        "blocked": len([item for item in normalized_items if item["blockers"]]),
        "ready_for_evidence_package": len([item for item in normalized_items if item["ready_for_evidence_package"]]),
        "ready_for_truth_spine": len([item for item in normalized_items if item["ready_for_truth_spine"]]),
        "ready_for_public_approval": 0,
        "records": normalized_items,
    }


def data_normalization_schema() -> Dict[str, Any]:
    return {
        "ok": True,
        "layer": "data_normalization",
        "supported_canonical_types": list(SUPPORTED_CANONICAL_TYPES),
        "alias_groups": dict(ALIAS_GROUPS),
        "downstream_targets": list(DOWNSTREAM_TARGETS),
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def data_normalization_summary() -> Dict[str, Any]:
    sample_batch = batch_normalize(
        [
            {
                "countyName": "Licking",
                "metricName": "students_served",
                "metricValue": "2810",
                "sourceName": "Foundation sample CSV",
                "sourceUrl": "local://foundation-sample.csv",
                "provenance": "local://foundation-sample",
            },
            {
                "programName": "Digital Access",
                "sourceName": "Program intake",
            },
        ]
    )
    return {
        "policy_status": "formalized_v1",
        "supported_canonical_types": list(SUPPORTED_CANONICAL_TYPES),
        "alias_groups": dict(ALIAS_GROUPS),
        "sample_readiness": {
            "total": sample_batch["total"],
            "blocked": sample_batch["blocked"],
            "ready_for_evidence_package": sample_batch["ready_for_evidence_package"],
            "ready_for_truth_spine": sample_batch["ready_for_truth_spine"],
        },
        "downstream_targets": list(DOWNSTREAM_TARGETS),
        "boundary_warnings": list(BOUNDARY_WARNINGS),
        "ready_for_public_approval": 0,
        "verifies_truth": False,
        "approves_public_data": False,
    }


def data_normalization_health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "data_normalization",
        "status": "formalized_v1",
        "summary": data_normalization_summary(),
    }
