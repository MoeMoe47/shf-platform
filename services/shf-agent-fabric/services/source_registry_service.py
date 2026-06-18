from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, List


SOURCE_TYPES = [
    "manual_entry",
    "document",
    "dataset",
    "api",
    "partner_feed",
    "public_record",
    "user_submission",
    "unknown",
]

TRUST_TIERS = ["unknown", "low", "standard", "high", "official"]

HIGH_TRUST_TYPES = {"official", "public_record", "partner_feed"}

DOWNSTREAM_TARGETS = [
    "Data Aggregator",
    "Data Normalization",
    "Evidence Package",
    "Data Verification",
    "Truth Spine",
    "Oracle",
    "Data Approval",
    "Reports",
    "Watchtower",
    "LOO",
    "SHF Impact Data Spine",
]

BOUNDARY_WARNINGS = [
    "Source Registry evaluates source identity, provenance completeness, and downstream eligibility only.",
    "Source Registry does not verify truth, create Truth Spine claims, public-approve data, override Truth Spine, override Oracle, publish reports, or mutate SHF Impact Data Spine.",
]


def _clean_str(value: Any) -> str:
    return str(value or "").strip()


def _canonical_json(value: Dict[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _deterministic_source_id(payload: Dict[str, Any]) -> str:
    digest = hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()[:16]
    return f"source_registry_{digest}"


def _source_record(payload: Dict[str, Any]) -> Dict[str, Any]:
    source = payload.get("source") if isinstance(payload.get("source"), dict) else payload
    return dict(source or {})


def _source_type(source: Dict[str, Any]) -> str:
    value = _clean_str(source.get("source_type")).lower()
    return value if value in SOURCE_TYPES else "unknown"


def _trust_tier(source: Dict[str, Any], source_type: str, has_provenance: bool, has_owner_or_submitter: bool) -> str:
    declared = _clean_str(source.get("trust_tier")).lower()
    if declared in TRUST_TIERS:
        return declared
    if source_type in {"public_record", "partner_feed"} and has_provenance and has_owner_or_submitter:
        return "high"
    if source_type in {"document", "dataset", "api"} and has_provenance:
        return "standard"
    if source_type == "unknown":
        return "unknown"
    return "low"


def _provenance(source: Dict[str, Any]) -> Dict[str, Any]:
    provenance = source.get("provenance")
    if isinstance(provenance, dict):
        return dict(provenance)
    if _clean_str(provenance):
        return {"provenance": _clean_str(provenance)}
    return {}


def evaluate_source(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    raw = dict(payload or {})
    candidate = _source_record(raw)
    source_id = _clean_str(candidate.get("source_id"))
    source_name = _clean_str(candidate.get("source_name") or candidate.get("title") or candidate.get("name"))
    source_type = _source_type(candidate)
    owner = _clean_str(candidate.get("owner"))
    submitted_by = _clean_str(candidate.get("submitted_by") or candidate.get("submittedBy"))
    source_url = _clean_str(candidate.get("source_url") or candidate.get("uri") or candidate.get("url"))
    provenance = _provenance(candidate)
    has_provenance = bool(provenance)
    has_owner_or_submitter = bool(owner or submitted_by)
    warnings: List[str] = []
    blockers: List[str] = []

    if not source_id:
        warnings.append("missing_source_id")
        blockers.append("missing_source_id")
        source_id = _deterministic_source_id({"source_name": source_name, "source_type": source_type, "source_url": source_url})
    if not source_name:
        warnings.append("missing_source_name")
        blockers.append("missing_source_name")
    if not _clean_str(candidate.get("source_type")):
        warnings.append("missing_source_type")
    if source_type == "unknown":
        warnings.append("unknown_source_type")
    if not has_provenance:
        warnings.append("missing_provenance")
    if not has_owner_or_submitter:
        if source_type in {"partner_feed", "public_record", "api"}:
            blockers.append("missing_owner_or_submitter")
        warnings.append("missing_owner_or_submitter")
    if source_type in {"document", "dataset", "api", "partner_feed", "public_record"} and not source_url:
        warnings.append("missing_source_url")

    eligible_for_aggregator = bool(source_name) and not ("missing_owner_or_submitter" in blockers)
    if source_type == "unknown":
        eligible_for_aggregator = bool(source_id and source_name)
    eligible_for_evidence_package = (
        eligible_for_aggregator
        and source_type != "unknown"
        and has_provenance
        and bool(source_url or source_type in {"manual_entry", "user_submission"})
    )
    eligible_for_truth_spine = eligible_for_evidence_package and not blockers
    eligible_for_public_approval_consideration = (
        eligible_for_truth_spine
        and source_type in {"official", "public_record", "partner_feed"}
        and has_owner_or_submitter
        and bool(source_url)
    )

    allowed_downstream_targets = ["Data Aggregator"] if eligible_for_aggregator else []
    if eligible_for_evidence_package:
        allowed_downstream_targets.extend(["Data Normalization", "Evidence Package", "Data Verification"])
    if eligible_for_truth_spine:
        allowed_downstream_targets.extend(["Truth Spine", "Oracle", "Reports", "Watchtower", "LOO"])
    if eligible_for_public_approval_consideration:
        allowed_downstream_targets.extend(["Data Approval", "Data Approval Gateway"])

    trust_tier = _trust_tier(candidate, source_type, has_provenance, has_owner_or_submitter)
    source = {
        "source_id": source_id,
        "source_name": source_name,
        "source_type": source_type,
        "owner": owner,
        "submitted_by": submitted_by,
        "source_url": source_url,
        "provenance": provenance,
        "trust_tier": trust_tier,
        "allowed_downstream_targets": allowed_downstream_targets,
        "warnings": warnings,
        "blockers": blockers,
        "eligible_for_aggregator": eligible_for_aggregator,
        "eligible_for_evidence_package": eligible_for_evidence_package,
        "eligible_for_truth_spine": eligible_for_truth_spine,
        "eligible_for_public_approval_consideration": eligible_for_public_approval_consideration,
        "truth_verified": False,
        "public_approved": False,
    }
    return {
        "ok": True,
        "layer": "source_registry",
        "source": source,
        "warnings": warnings,
        "blockers": blockers,
        "eligible_for_aggregator": eligible_for_aggregator,
        "eligible_for_evidence_package": eligible_for_evidence_package,
        "eligible_for_truth_spine": eligible_for_truth_spine,
        "eligible_for_public_approval_consideration": eligible_for_public_approval_consideration,
        "truth_verified": False,
        "public_approved": False,
    }


def batch_evaluate_sources(records: Any) -> Dict[str, Any]:
    items = records if isinstance(records, list) else []
    evaluations = [evaluate_source(item if isinstance(item, dict) else {}) for item in items]
    sources = [item["source"] for item in evaluations]
    return {
        "ok": True,
        "layer": "source_registry",
        "total": len(sources),
        "known_sources": sum(1 for item in sources if item["source_type"] != "unknown"),
        "unknown_sources": sum(1 for item in sources if item["source_type"] == "unknown"),
        "blocked_sources": sum(1 for item in sources if item["blockers"]),
        "eligible_for_aggregator": sum(1 for item in sources if item["eligible_for_aggregator"]),
        "eligible_for_evidence_package": sum(1 for item in sources if item["eligible_for_evidence_package"]),
        "eligible_for_truth_spine": sum(1 for item in sources if item["eligible_for_truth_spine"]),
        "eligible_for_public_approval_consideration": sum(
            1 for item in sources if item["eligible_for_public_approval_consideration"]
        ),
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "evaluations": evaluations,
    }


def source_registry_sources() -> Dict[str, Any]:
    return {
        "ok": True,
        "layer": "source_registry",
        "sources": [item["source"] for item in _sample_evaluations()["evaluations"]],
    }


def source_registry_schema() -> Dict[str, Any]:
    return {
        "ok": True,
        "layer": "source_registry",
        "source_types": list(SOURCE_TYPES),
        "trust_tiers": list(TRUST_TIERS),
        "source_fields": [
            "source_id",
            "source_name",
            "source_type",
            "owner",
            "submitted_by",
            "source_url",
            "provenance",
            "trust_tier",
            "allowed_downstream_targets",
            "warnings",
            "blockers",
            "eligible_for_aggregator",
            "eligible_for_evidence_package",
            "eligible_for_truth_spine",
            "eligible_for_public_approval_consideration",
            "truth_verified",
            "public_approved",
        ],
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def _sample_evaluations() -> Dict[str, Any]:
    return batch_evaluate_sources(
        [
            {
                "source": {
                    "source_id": "src_official_public_record",
                    "source_name": "Official workforce public record",
                    "source_type": "public_record",
                    "owner": "State Public Records",
                    "submitted_by": "Data Ops",
                    "source_url": "https://example.invalid/public-record",
                    "provenance": {"publisher": "State Public Records", "retrieved_at": "2026-01-01"},
                }
            },
            {
                "source": {
                    "source_id": "src_unknown_quarantine",
                    "source_name": "Unclassified intake",
                    "source_type": "unknown",
                    "submitted_by": "Data Ops",
                }
            },
            {
                "source": {
                    "source_name": "Missing source id and provenance",
                    "source_type": "dataset",
                    "owner": "Data Ops",
                    "source_url": "local://missing-provenance.csv",
                }
            },
        ]
    )


def source_registry_summary() -> Dict[str, Any]:
    sample = _sample_evaluations()
    return {
        "policy_status": "formalized_v1",
        "total_sources": sample["total"],
        "known_sources": sample["known_sources"],
        "unknown_sources": sample["unknown_sources"],
        "blocked_sources": sample["blocked_sources"],
        "eligible_for_aggregator": sample["eligible_for_aggregator"],
        "eligible_for_evidence_package": sample["eligible_for_evidence_package"],
        "eligible_for_truth_spine": sample["eligible_for_truth_spine"],
        "eligible_for_public_approval_consideration": sample["eligible_for_public_approval_consideration"],
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "verifies_truth": False,
        "approves_public_data": False,
        "mutates_shf_impact_data": False,
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def source_registry_readiness() -> Dict[str, Any]:
    summary = source_registry_summary()
    return {
        "ok": True,
        "layer": "source_registry",
        "blocked_sources": summary["blocked_sources"],
        "eligible_for_aggregator": summary["eligible_for_aggregator"],
        "eligible_for_evidence_package": summary["eligible_for_evidence_package"],
        "eligible_for_truth_spine": summary["eligible_for_truth_spine"],
        "eligible_for_public_approval_consideration": summary["eligible_for_public_approval_consideration"],
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "verifies_truth": False,
    }


def source_registry_health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "source_registry",
        "status": "formalized_v1",
        "summary": source_registry_summary(),
    }
