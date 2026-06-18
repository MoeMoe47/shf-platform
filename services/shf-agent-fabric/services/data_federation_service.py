from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, List


FEDERATION_STATUSES = ["blocked", "needs_review", "aggregator_ready"]

BOUNDARY_WARNINGS = [
    "Data Federation groups and routes source sets toward Data Aggregator only.",
    "Data Federation does not verify truth, create Truth Spine claims, public-approve data, override Truth Spine, override Oracle, publish reports, or mutate SHF Impact Data Spine.",
]


def _clean_str(value: Any) -> str:
    return str(value or "").strip()


def _canonical_json(value: Dict[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _federation_id(payload: Dict[str, Any]) -> str:
    digest = hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()[:16]
    return f"data_federation_{digest}"


def _federation_record(payload: Dict[str, Any]) -> Dict[str, Any]:
    federation = payload.get("federation") if isinstance(payload.get("federation"), dict) else payload
    return dict(federation or {})


def _sources(record: Dict[str, Any]) -> List[Dict[str, Any]]:
    raw_sources = record.get("sources")
    if not isinstance(raw_sources, list):
        return []
    return [dict(item) for item in raw_sources if isinstance(item, dict)]


def _source_id(source: Dict[str, Any]) -> str:
    return _clean_str(source.get("source_id") or source.get("id"))


def _source_type(source: Dict[str, Any]) -> str:
    return _clean_str(source.get("source_type") or "unknown").lower() or "unknown"


def _trust_tier(source: Dict[str, Any]) -> str:
    return _clean_str(source.get("trust_tier") or "unknown").lower() or "unknown"


def _canonical_type(source: Dict[str, Any], fallback: str) -> str:
    return _clean_str(source.get("canonical_type") or fallback or "unknown").lower() or "unknown"


def _has_lineage(record: Dict[str, Any]) -> bool:
    lineage = record.get("lineage")
    if isinstance(lineage, dict):
        return any(_clean_str(value) for value in lineage.values())
    return bool(_clean_str(lineage))


def _ready_for_aggregator_source(source: Dict[str, Any]) -> bool:
    return source.get("eligible_for_aggregator") is True


def evaluate_federation(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    source = dict(payload or {})
    record = _federation_record(source)
    federation_id = _clean_str(record.get("federation_id"))
    federation_name = _clean_str(record.get("federation_name") or record.get("name"))
    canonical_type = _clean_str(record.get("canonical_type") or "unknown").lower() or "unknown"
    sources = _sources(record)
    source_count = len(sources)
    source_types = sorted({_source_type(item) for item in sources})
    trust_tiers = sorted({_trust_tier(item) for item in sources})
    lineage = record.get("lineage") if isinstance(record.get("lineage"), dict) else {}
    conflicts: List[str] = []
    warnings: List[str] = []
    blockers: List[str] = []

    if not federation_id:
        warnings.append("missing_federation_id")
        blockers.append("missing_federation_id")
        federation_id = _federation_id({"name": federation_name, "canonical_type": canonical_type, "source_count": source_count})
    if not sources:
        warnings.append("missing_sources")
        blockers.append("missing_sources")
    if source_count == 1 and record.get("single_source_candidate") is not True:
        warnings.append("single_source_needs_review")
    if any(not _source_id(item) for item in sources):
        warnings.append("source_missing_source_id")
        blockers.append("source_missing_source_id")
    if any(not _ready_for_aggregator_source(item) for item in sources):
        warnings.append("source_not_eligible_for_aggregator")
        blockers.append("source_not_eligible_for_aggregator")
    if not _has_lineage(record):
        warnings.append("missing_lineage")

    canonical_types = sorted({_canonical_type(item, canonical_type) for item in sources})
    if len([item for item in canonical_types if item != "unknown"]) > 1:
        conflicts.append("conflicting_canonical_type")
        warnings.append("conflicting_canonical_type")

    if len(trust_tiers) > 1 and "unknown" in trust_tiers:
        warnings.append("source_trust_tier_mismatch")

    if blockers:
        federation_status = "blocked"
        recommended_action = "resolve_source_federation_blockers_before_aggregator"
    elif conflicts:
        federation_status = "needs_review"
        recommended_action = "review_source_conflicts_before_aggregator"
    elif warnings:
        federation_status = "needs_review"
        recommended_action = "complete_lineage_or_source_review_before_aggregator"
    else:
        federation_status = "aggregator_ready"
        recommended_action = "route_federation_set_to_data_aggregator"

    ready_for_aggregator = federation_status == "aggregator_ready"
    federation = {
        "federation_id": federation_id,
        "federation_name": federation_name,
        "canonical_type": canonical_type,
        "sources": sources,
        "source_count": source_count,
        "source_types": source_types,
        "trust_tiers": trust_tiers,
        "lineage": lineage,
        "conflicts": conflicts,
        "warnings": warnings,
        "blockers": blockers,
        "federation_status": federation_status,
        "recommended_action": recommended_action,
        "ready_for_aggregator": ready_for_aggregator,
        "ready_for_truth_spine": False,
        "ready_for_public_approval": False,
        "truth_verified": False,
        "public_approved": False,
    }
    return {
        "ok": True,
        "layer": "data_federation",
        "federation": federation,
        "warnings": warnings,
        "blockers": blockers,
        "ready_for_aggregator": ready_for_aggregator,
        "ready_for_truth_spine": False,
        "ready_for_public_approval": False,
        "truth_verified": False,
        "public_approved": False,
    }


def batch_evaluate_federations(records: Any) -> Dict[str, Any]:
    items = records if isinstance(records, list) else []
    evaluations = [evaluate_federation(item if isinstance(item, dict) else {}) for item in items]
    statuses = [item["federation"]["federation_status"] for item in evaluations]
    return {
        "ok": True,
        "layer": "data_federation",
        "total": len(evaluations),
        "blocked": statuses.count("blocked"),
        "needs_review": statuses.count("needs_review"),
        "aggregator_ready": statuses.count("aggregator_ready"),
        "truth_spine_ready": 0,
        "public_approval_ready": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "evaluations": evaluations,
    }


def data_federation_schema() -> Dict[str, Any]:
    return {
        "ok": True,
        "layer": "data_federation",
        "federation_statuses": list(FEDERATION_STATUSES),
        "federation_fields": [
            "federation_id",
            "federation_name",
            "canonical_type",
            "sources",
            "source_count",
            "source_types",
            "trust_tiers",
            "lineage",
            "conflicts",
            "warnings",
            "blockers",
            "federation_status",
            "ready_for_aggregator",
            "ready_for_truth_spine",
            "ready_for_public_approval",
            "truth_verified",
            "public_approved",
        ],
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def _sample_evaluations() -> Dict[str, Any]:
    ready_source_a = {
        "source_id": "src_federation_public_record",
        "source_name": "Public record",
        "source_type": "public_record",
        "canonical_type": "metric",
        "trust_tier": "high",
        "eligible_for_aggregator": True,
    }
    ready_source_b = {
        "source_id": "src_federation_partner_feed",
        "source_name": "Partner feed",
        "source_type": "partner_feed",
        "canonical_type": "metric",
        "trust_tier": "high",
        "eligible_for_aggregator": True,
    }
    return batch_evaluate_federations(
        [
            {
                "federation": {
                    "federation_id": "fed_sample_ready",
                    "federation_name": "Sample compatible metric sources",
                    "canonical_type": "metric",
                    "sources": [ready_source_a, ready_source_b],
                    "lineage": {"parent": "source_registry", "route": "source_registry_to_data_aggregator"},
                }
            },
            {
                "federation": {
                    "federation_id": "fed_sample_review",
                    "federation_name": "Sample missing lineage",
                    "canonical_type": "metric",
                    "sources": [ready_source_a, ready_source_b],
                    "lineage": {},
                }
            },
            {
                "federation": {
                    "canonical_type": "story",
                    "sources": [{"source_name": "Missing id source", "eligible_for_aggregator": False}],
                    "lineage": {},
                }
            },
        ]
    )


def data_federation_summary() -> Dict[str, Any]:
    sample = _sample_evaluations()
    return {
        "policy_status": "formalized_v1",
        "total_federation_sets": sample["total"],
        "blocked": sample["blocked"],
        "needs_review": sample["needs_review"],
        "aggregator_ready": sample["aggregator_ready"],
        "truth_spine_ready": 0,
        "public_approval_ready": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "verifies_truth": False,
        "approves_public_data": False,
        "mutates_shf_impact_data": False,
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def data_federation_readiness() -> Dict[str, Any]:
    summary = data_federation_summary()
    return {
        "ok": True,
        "layer": "data_federation",
        "blocked": summary["blocked"],
        "needs_review": summary["needs_review"],
        "aggregator_ready": summary["aggregator_ready"],
        "truth_spine_ready": 0,
        "public_approval_ready": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "verifies_truth": False,
    }


def data_federation_health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "data_federation",
        "status": "formalized_v1",
        "summary": data_federation_summary(),
    }
