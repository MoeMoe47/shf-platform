from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict, List


SUPPORTED_SOURCE_TYPES = {
    "report",
    "csv",
    "manual",
    "operator_record",
    "document",
    "api_export",
}

BASE_REQUIRED_METADATA = ["source_id", "title", "owner", "provenance"]

REQUIRED_METADATA_BY_SOURCE_TYPE = {
    "report": BASE_REQUIRED_METADATA + ["uri", "evidence_type"],
    "csv": BASE_REQUIRED_METADATA + ["uri", "schema_hint"],
    "manual": BASE_REQUIRED_METADATA + ["entered_by"],
    "operator_record": BASE_REQUIRED_METADATA + ["record_id"],
    "document": BASE_REQUIRED_METADATA + ["uri", "evidence_type"],
    "api_export": BASE_REQUIRED_METADATA + ["uri", "exported_at"],
    "unknown": BASE_REQUIRED_METADATA,
}

DOWNSTREAM_TARGETS = [
    "Data Normalization",
    "Evidence Package",
    "Truth Spine",
    "Reports",
    "Watchtower",
    "SHF Impact Data Spine",
]

_SAMPLE_SOURCES: List[Dict[str, Any]] = [
    {
        "source_id": "agg_src_shf_sample_report",
        "source_type": "report",
        "title": "SHF sample impact report intake",
        "owner": "SHF Impact",
        "provenance": "local://shf-impact-sample",
        "uri": "local://reports/shf-sample-impact",
        "evidence_type": "report",
        "status": "collected",
        "public_approved": False,
    },
    {
        "source_id": "agg_src_clientops_missing_provenance",
        "source_type": "operator_record",
        "title": "ClientOps operator intake missing provenance",
        "owner": "ClientOps",
        "record_id": "operator-record-draft",
        "status": "blocked",
        "public_approved": False,
    },
    {
        "source_id": "agg_src_foundation_csv_draft",
        "source_type": "csv",
        "title": "Foundation CSV draft intake",
        "owner": "Foundation Ops",
        "provenance": "local://foundation-draft-csv",
        "uri": "local://imports/foundation-draft.csv",
        "schema_hint": "county,program_lane,participant_count",
        "status": "ready_for_normalization",
        "public_approved": False,
    },
]


def _clean_str(value: Any) -> str:
    return str(value or "").strip()


def _source_type(payload: Dict[str, Any]) -> str:
    value = _clean_str(payload.get("source_type")).lower()
    return value if value in SUPPORTED_SOURCE_TYPES else "unknown"


def required_metadata_for(source_type: str) -> List[str]:
    return list(REQUIRED_METADATA_BY_SOURCE_TYPE.get(source_type, REQUIRED_METADATA_BY_SOURCE_TYPE["unknown"]))


def classify_intake(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    record = dict(payload or {})
    source_type = _source_type(record)
    required_metadata = required_metadata_for(source_type)
    missing_metadata = [field for field in required_metadata if not _clean_str(record.get(field))]
    warnings: List[str] = []

    if source_type == "unknown":
        warnings.append("unknown_source_type")
    if "source_id" in missing_metadata:
        warnings.append("missing_source_id")
    if "provenance" in missing_metadata:
        warnings.append("missing_provenance")
    if missing_metadata:
        warnings.append("missing_required_metadata")

    attempted_public_approval = record.get("public_approved") is True
    already_verified_public = (
        _clean_str(record.get("truth_status")).lower() == "verified"
        and record.get("public_approved") is True
        and bool(_clean_str(record.get("truth_package_id")))
    )
    if attempted_public_approval and not already_verified_public:
        warnings.append("public_approval_requires_truth_spine")

    eligible_for_truth_spine = not missing_metadata and source_type != "unknown"
    eligible_for_public_approval = already_verified_public
    ready_for_normalization = eligible_for_truth_spine and source_type in {
        "csv",
        "api_export",
        "operator_record",
        "manual",
    }
    ready_for_evidence_package = eligible_for_truth_spine and source_type in {
        "report",
        "document",
        "csv",
        "api_export",
    }

    status = "ready_for_truth_spine" if eligible_for_truth_spine else "blocked"
    if ready_for_normalization:
        status = "ready_for_normalization"
    if ready_for_evidence_package and source_type in {"report", "document"}:
        status = "ready_for_evidence_package"

    return {
        "ok": True,
        "source_type": source_type,
        "status": status,
        "required_metadata": required_metadata,
        "missing_metadata": missing_metadata,
        "warnings": warnings,
        "downstream_targets": list(DOWNSTREAM_TARGETS),
        "ready_for_normalization": ready_for_normalization,
        "ready_for_evidence_package": ready_for_evidence_package,
        "eligible_for_truth_spine": eligible_for_truth_spine,
        "eligible_for_public_approval": eligible_for_public_approval,
        "truth_spine_boundary": "Data Aggregator gathers and prepares only; Truth Spine verifies and controls public approval/report readiness.",
    }


def list_sources() -> List[Dict[str, Any]]:
    sources = []
    for source in _SAMPLE_SOURCES:
        item = deepcopy(source)
        item["classification"] = classify_intake(item)
        sources.append(item)
    return sources


def intake_queue() -> List[Dict[str, Any]]:
    queue = []
    for source in list_sources():
        classification = source["classification"]
        queue.append(
            {
                "source_id": source["source_id"],
                "title": source["title"],
                "source_type": source["source_type"],
                "status": classification["status"],
                "warnings": classification["warnings"],
                "eligible_for_truth_spine": classification["eligible_for_truth_spine"],
                "ready_for_normalization": classification["ready_for_normalization"],
                "ready_for_evidence_package": classification["ready_for_evidence_package"],
                "eligible_for_public_approval": classification["eligible_for_public_approval"],
            }
        )
    return queue


def data_aggregator_summary() -> Dict[str, Any]:
    sources = list_sources()
    queue = intake_queue()
    missing_provenance = sum(1 for item in queue if "missing_provenance" in item["warnings"])
    blocked_from_truth_spine = sum(1 for item in queue if not item["eligible_for_truth_spine"])
    ready_for_normalization = sum(1 for item in queue if item["ready_for_normalization"])
    ready_for_evidence_package = sum(1 for item in queue if item["ready_for_evidence_package"])
    public_approval_eligible_count = sum(1 for item in queue if item["eligible_for_public_approval"])

    return {
        "policy_status": "formalized_v1",
        "total_sources": len(sources),
        "pending_intake": len(queue),
        "missing_provenance": missing_provenance,
        "blocked_from_truth_spine": blocked_from_truth_spine,
        "ready_for_normalization": ready_for_normalization,
        "ready_for_evidence_package": ready_for_evidence_package,
        "public_approval_eligible_count": public_approval_eligible_count,
        "downstream_targets": list(DOWNSTREAM_TARGETS),
        "boundary": "intake_and_preparation_only",
        "truth_spine_requirement": "Claim-like inputs must be sent to Truth Spine with source/provenance metadata; Data Aggregator cannot verify, public-approve, or mark report-ready.",
    }


def data_aggregator_health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "data_aggregator",
        "status": "formalized_v1",
        "summary": data_aggregator_summary(),
    }
