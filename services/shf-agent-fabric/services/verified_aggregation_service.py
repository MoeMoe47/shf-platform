from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, Iterable, List


AGGREGATION_PURPOSES = [
    "internal_summary",
    "report_summary",
    "watchtower_summary",
    "loo_summary",
    "public_impact_candidate",
    "unknown",
]

TRUTH_READY = {"verified", "trusted", "supported", "public_approved", "report_ready"}
ORACLE_READY = {"supported", "supportable", "supports", "approved_support"}
DATA_APPROVAL_READY = {"gateway_ready", "public_ready_candidate", "approved"}
PUBLIC_APPROVAL_READY = {"public_ready_candidate", "ready", "approved"}
SECURITY_PRIVACY_READY = {"clear", "approved", "pass", "passed", "public_safe_candidate", "no_pii"}
OWNERSHIP_READY = {"clear", "approved", "pass", "passed", "ownership_clear_candidate", "rights_clear"}
POLICY_READY = {"allowed", "pass", "passed", "approved", "compliant"}
AUDIT_READY = {"audit_ready", "trace_ready", "ready", "approved", "pass", "passed"}
READINESS_READY = {"ready", "approved", "passed", "can_move_forward"}
BLOCKING_STATUSES = {"blocked", "failed", "fail", "rejected", "unsafe", "unsupported", "not_supportable"}


def _clean_str(value: Any) -> str:
    return str(value or "").strip()


def _canonical_json(value: Dict[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _review_id(payload: Dict[str, Any]) -> str:
    digest = hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()[:16]
    return f"verified_aggregation_{digest}"


def _status_from(record: Dict[str, Any], section: str, *fields: str) -> str:
    nested = record.get(section) if isinstance(record.get(section), dict) else {}
    required = record.get("required_status") if isinstance(record.get("required_status"), dict) else {}
    for field in fields:
        if _clean_str(record.get(field)):
            return _clean_str(record.get(field)).lower()
        if _clean_str(nested.get(field)):
            return _clean_str(nested.get(field)).lower()
        if _clean_str(required.get(field)):
            return _clean_str(required.get(field)).lower()
    return ""


def _request_status(payload: Dict[str, Any], key: str) -> str:
    required = payload.get("required_status") if isinstance(payload.get("required_status"), dict) else {}
    return _clean_str(required.get(key)).lower()


def _record_id(record: Dict[str, Any], index: int) -> str:
    return _clean_str(record.get("record_id") or record.get("candidate_id") or record.get("id") or f"record_{index + 1}")


def _traceable(record: Dict[str, Any]) -> bool:
    provenance = record.get("provenance")
    if isinstance(provenance, dict) and any(_clean_str(value) for value in provenance.values()):
        return True
    source_ref = record.get("source_ref") or record.get("source_id")
    audit_ref = record.get("audit_ref")
    evidence_ref = record.get("evidence_ref") or record.get("evidence_refs")
    return bool(_clean_str(source_ref) and (_clean_str(audit_ref) or evidence_ref))


def _is_blocking(status: str) -> bool:
    return status in BLOCKING_STATUSES


def _record_statuses(record: Dict[str, Any]) -> Dict[str, str]:
    return {
        "truth_spine": _status_from(record, "truth_spine", "truth_spine_status", "truth_status", "verification_status", "trust_level", "status"),
        "oracle": _status_from(record, "oracle", "oracle_status", "oracle_supportability", "supportability", "ruling", "status"),
        "data_approval": _status_from(record, "data_approval", "data_approval_status", "data_approval_state", "approval_state", "status"),
        "public_approval": _status_from(record, "public_approval", "public_approval_status", "public_release_state", "status"),
        "security_privacy": _status_from(record, "security_privacy", "security_privacy_status", "privacy_status", "security_status", "privacy_review_status", "security_review_status", "status"),
        "data_ownership_ip": _status_from(record, "data_ownership_ip", "data_ownership_ip_status", "ownership_status", "ownership_ip_status", "rights_status", "status"),
        "policy_engine": _status_from(record, "policy_engine", "policy_engine_status", "policy_status", "decision", "status"),
        "audit_verification": _status_from(record, "audit_verification", "audit_verification_status", "audit_status", "trace_status", "status"),
        "readiness_gate": _status_from(record, "readiness_gate", "readiness_gate_status", "gate_status", "status"),
    }


def _status_ready(status: str, allowed: set[str]) -> bool:
    return bool(status and status in allowed)


def _record_review(record: Dict[str, Any], index: int, purpose: str) -> Dict[str, Any]:
    record_id = _record_id(record, index)
    statuses = _record_statuses(record)
    warnings: List[str] = []
    blockers: List[str] = []

    if not _clean_str(record.get("record_id") or record.get("candidate_id") or record.get("id")):
        warnings.append("missing_record_id")
        blockers.append("missing_record_id")
    if not _traceable(record):
        warnings.append("missing_traceability")
        blockers.append("missing_traceability")

    if any(_is_blocking(status) for status in statuses.values()):
        blockers.append("blocked_status_present")

    if purpose == "report_summary":
        if not statuses["audit_verification"]:
            warnings.append("missing_audit_verification_context")
        if not statuses["policy_engine"]:
            warnings.append("missing_policy_engine_context")
    elif purpose == "watchtower_summary":
        if not _clean_str(record.get("risk_status") or record.get("status") or statuses["readiness_gate"]):
            warnings.append("missing_watchtower_status_context")
    elif purpose == "loo_summary":
        if not _clean_str(record.get("readiness_status") or record.get("outcome_status") or statuses["readiness_gate"]):
            warnings.append("missing_loo_readiness_context")
    elif purpose == "public_impact_candidate":
        requirements = [
            ("truth_spine", TRUTH_READY, "truth_spine_not_verified_or_supported"),
            ("oracle", ORACLE_READY, "oracle_not_supported"),
            ("data_approval", DATA_APPROVAL_READY, "data_approval_not_ready"),
            ("public_approval", PUBLIC_APPROVAL_READY, "public_approval_not_ready"),
            ("security_privacy", SECURITY_PRIVACY_READY, "security_privacy_not_clear"),
            ("data_ownership_ip", OWNERSHIP_READY, "data_ownership_ip_not_clear"),
            ("policy_engine", POLICY_READY, "policy_engine_not_allowed"),
            ("audit_verification", AUDIT_READY, "audit_verification_not_ready"),
        ]
        for key, allowed, warning in requirements:
            if not statuses[key]:
                warnings.append(f"missing_{key}_context")
                blockers.append(f"missing_{key}_context")
            elif not _status_ready(statuses[key], allowed):
                warnings.append(warning)
                blockers.append(warning)

    included = not blockers
    return {
        "record_id": record_id,
        "included": included,
        "warnings": warnings,
        "blockers": blockers,
        "statuses": statuses,
    }


def _numeric(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        if _clean_str(value):
            return float(value)
    except ValueError:
        return None
    return None


def _aggregate_preview(records: List[Dict[str, Any]], reviews: List[Dict[str, Any]], group_by: List[str], metric_fields: List[str]) -> Dict[str, Any]:
    included_pairs = [(record, review) for record, review in zip(records, reviews) if review["included"]]
    preview: Dict[str, Any] = {
        "total_records": len(records),
        "included_records": len(included_pairs),
        "excluded_records": len(records) - len(included_pairs),
        "groups": {},
        "metrics": {},
    }

    for field in group_by:
        counts: Dict[str, int] = {}
        for record, _review in included_pairs:
            value = _clean_str(record.get(field) or "unknown")
            counts[value] = counts.get(value, 0) + 1
        preview["groups"][field] = dict(sorted(counts.items()))

    for field in metric_fields:
        values = [_numeric(record.get(field)) for record, _review in included_pairs]
        numeric_values = [value for value in values if value is not None]
        preview["metrics"][field] = {
            "count": len(numeric_values),
            "sum": sum(numeric_values),
        }

    return preview


def evaluate_verified_aggregation(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    source = dict(payload or {})
    aggregation_id = _clean_str(source.get("aggregation_id"))
    aggregation_name = _clean_str(source.get("aggregation_name"))
    purpose = _clean_str(source.get("aggregation_purpose")).lower()
    records = source.get("records") if isinstance(source.get("records"), list) else []
    group_by = source.get("group_by") if isinstance(source.get("group_by"), list) else []
    metric_fields = source.get("metric_fields") if isinstance(source.get("metric_fields"), list) else []
    group_by = [_clean_str(field) for field in group_by if _clean_str(field)]
    metric_fields = [_clean_str(field) for field in metric_fields if _clean_str(field)]

    warnings: List[str] = []
    blockers: List[str] = []

    if not aggregation_id:
        blockers.append("missing_aggregation_id")
    if not aggregation_name:
        warnings.append("missing_aggregation_name")
    if not purpose:
        blockers.append("missing_aggregation_purpose")
    elif purpose not in AGGREGATION_PURPOSES:
        warnings.append("unknown_aggregation_purpose")
    if not isinstance(source.get("records"), list):
        blockers.append("missing_records")
    elif not records:
        blockers.append("empty_records")

    if purpose == "public_impact_candidate":
        for key in ("public_approval", "security_privacy", "data_ownership_ip"):
            if not _request_status(source, key):
                warnings.append(f"missing_required_{key}_status")

    reviews = [_record_review(record if isinstance(record, dict) else {}, index, purpose) for index, record in enumerate(records)]
    excluded_records = [
        {
            "record_id": review["record_id"],
            "warnings": review["warnings"],
            "blockers": review["blockers"],
        }
        for review in reviews
        if not review["included"]
    ]

    included_count = sum(1 for review in reviews if review["included"])
    if records and included_count == 0:
        warnings.append("no_records_included")

    aggregate_preview = _aggregate_preview([record if isinstance(record, dict) else {} for record in records], reviews, group_by, metric_fields)
    status = "blocked" if blockers else "needs_review" if warnings or excluded_records else "aggregation_ready"
    aggregation_ready = status == "aggregation_ready"
    reports_ready_candidate = aggregation_ready and purpose == "report_summary"
    watchtower_ready_candidate = aggregation_ready and purpose == "watchtower_summary"
    loo_ready_candidate = aggregation_ready and purpose == "loo_summary"
    public_impact_ready_candidate = aggregation_ready and purpose == "public_impact_candidate"

    result = {
        "aggregation_review_id": _review_id(source),
        "aggregation_id": aggregation_id,
        "aggregation_name": aggregation_name,
        "aggregation_purpose": purpose,
        "aggregation_status": status,
        "record_count": len(records),
        "included_record_count": included_count,
        "excluded_record_count": len(records) - included_count,
        "aggregate_preview": aggregate_preview,
        "excluded_records": excluded_records,
        "warnings": warnings,
        "blockers": blockers,
        "recommended_action": "block_aggregation" if status == "blocked" else "review_before_use" if status == "needs_review" else "prepare_summary_for_downstream_review",
        "aggregation_ready": aggregation_ready,
        "reports_ready_candidate": reports_ready_candidate,
        "watchtower_ready_candidate": watchtower_ready_candidate,
        "loo_ready_candidate": loo_ready_candidate,
        "public_impact_ready_candidate": public_impact_ready_candidate,
        "records_written": False,
        "truth_verified": False,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
        "writes_records": False,
        "verifies_truth": False,
        "approves_public_data": False,
        "mutates_shf_impact_data": False,
        "publishes_reports": False,
        "replaces_reports": False,
        "replaces_data_aggregator": False,
        "replaces_data_approval_gateway": False,
    }
    return {
        "ok": True,
        "layer": "verified_aggregation",
        "verified_aggregation": result,
        "warnings": warnings,
        "blockers": blockers,
        "aggregation_ready": aggregation_ready,
        "reports_ready_candidate": reports_ready_candidate,
        "watchtower_ready_candidate": watchtower_ready_candidate,
        "loo_ready_candidate": loo_ready_candidate,
        "public_impact_ready_candidate": public_impact_ready_candidate,
        "records_written": False,
        "truth_verified": False,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
    }


def batch_evaluate_verified_aggregation(items: Iterable[Dict[str, Any]] | None) -> Dict[str, Any]:
    evaluations = [evaluate_verified_aggregation(item)["verified_aggregation"] for item in list(items or [])]
    return {
        "ok": True,
        "layer": "verified_aggregation",
        "total": len(evaluations),
        "blocked": sum(1 for item in evaluations if item["aggregation_status"] == "blocked"),
        "needs_review": sum(1 for item in evaluations if item["aggregation_status"] == "needs_review"),
        "aggregation_ready": sum(1 for item in evaluations if item["aggregation_status"] == "aggregation_ready"),
        "records_seen_count": sum(item["record_count"] for item in evaluations),
        "included_record_count": sum(item["included_record_count"] for item in evaluations),
        "excluded_record_count": sum(item["excluded_record_count"] for item in evaluations),
        "reports_ready_candidate_count": sum(1 for item in evaluations if item["reports_ready_candidate"]),
        "watchtower_ready_candidate_count": sum(1 for item in evaluations if item["watchtower_ready_candidate"]),
        "loo_ready_candidate_count": sum(1 for item in evaluations if item["loo_ready_candidate"]),
        "public_impact_ready_candidate_count": sum(1 for item in evaluations if item["public_impact_ready_candidate"]),
        "records_written_count": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "evaluations": evaluations,
    }


def _seed_payloads() -> List[Dict[str, Any]]:
    base_record = {
        "record_id": "impact_record_001",
        "county": "Franklin",
        "participants": 12,
        "source_ref": "source:program:001",
        "audit_ref": "audit:trace:001",
        "truth_spine_status": "verified",
        "oracle_status": "supported",
        "data_approval_status": "gateway_ready",
        "public_approval_status": "public_ready_candidate",
        "security_privacy_status": "public_safe_candidate",
        "data_ownership_ip_status": "ownership_clear_candidate",
        "policy_engine_status": "allowed",
        "audit_verification_status": "audit_ready",
        "readiness_gate_status": "ready",
    }
    return [
        {
            "aggregation_id": "agg_internal_seed",
            "aggregation_name": "Internal traceable summary",
            "aggregation_purpose": "internal_summary",
            "canonical_type": "impact_metric",
            "records": [base_record],
            "group_by": ["county"],
            "metric_fields": ["participants"],
        },
        {
            "aggregation_id": "agg_public_seed",
            "aggregation_name": "Public impact candidate summary",
            "aggregation_purpose": "public_impact_candidate",
            "canonical_type": "impact_metric",
            "records": [base_record],
            "required_status": {
                "public_approval": "public_ready_candidate",
                "security_privacy": "public_safe_candidate",
                "data_ownership_ip": "ownership_clear_candidate",
            },
            "group_by": ["county"],
            "metric_fields": ["participants"],
        },
        {
            "aggregation_id": "agg_blocked_seed",
            "aggregation_name": "Missing traceability summary",
            "aggregation_purpose": "report_summary",
            "canonical_type": "impact_metric",
            "records": [{"record_id": "impact_record_missing_trace", "participants": 3}],
            "group_by": ["county"],
            "metric_fields": ["participants"],
        },
    ]


def verified_aggregation_summary() -> Dict[str, Any]:
    batch = batch_evaluate_verified_aggregation(_seed_payloads())
    return {
        "policy_status": "formalized_v1",
        "total_aggregation_reviews": batch["total"],
        "blocked": batch["blocked"],
        "needs_review": batch["needs_review"],
        "aggregation_ready": batch["aggregation_ready"],
        "records_seen_count": batch["records_seen_count"],
        "included_record_count": batch["included_record_count"],
        "excluded_record_count": batch["excluded_record_count"],
        "reports_ready_candidate_count": batch["reports_ready_candidate_count"],
        "watchtower_ready_candidate_count": batch["watchtower_ready_candidate_count"],
        "loo_ready_candidate_count": batch["loo_ready_candidate_count"],
        "public_impact_ready_candidate_count": batch["public_impact_ready_candidate_count"],
        "records_written_count": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "writes_records": False,
        "verifies_truth": False,
        "approves_public_data": False,
        "mutates_shf_impact_data": False,
        "publishes_reports": False,
        "replaces_reports": False,
        "replaces_data_aggregator": False,
        "replaces_data_approval_gateway": False,
    }


def verified_aggregation_health() -> Dict[str, Any]:
    return {"ok": True, "layer": "verified_aggregation", "status": "formalized_v1"}


def verified_aggregation_schema() -> Dict[str, Any]:
    return {
        "ok": True,
        "layer": "verified_aggregation",
        "aggregation_purposes": AGGREGATION_PURPOSES,
        "request_fields": [
            "aggregation_id",
            "aggregation_name",
            "aggregation_purpose",
            "canonical_type",
            "records",
            "required_status",
            "group_by",
            "metric_fields",
            "metadata",
        ],
        "result_fields": [
            "aggregation_review_id",
            "aggregation_status",
            "record_count",
            "included_record_count",
            "excluded_record_count",
            "aggregate_preview",
            "excluded_records",
            "aggregation_ready",
            "reports_ready_candidate",
            "watchtower_ready_candidate",
            "loo_ready_candidate",
            "public_impact_ready_candidate",
            "records_written",
            "truth_verified",
            "public_approved",
            "mutated_public_data",
            "published_report",
        ],
    }


def verified_aggregation_readiness() -> Dict[str, Any]:
    summary = verified_aggregation_summary()
    return {
        "ok": True,
        "layer": "verified_aggregation",
        "status": "ready" if summary["blocked"] == 0 else "watch",
        **summary,
    }
