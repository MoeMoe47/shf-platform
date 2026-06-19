from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, List


LICENSE_TYPES = [
    "unknown",
    "internal_use",
    "reporting_allowed",
    "public_release_allowed",
    "restricted",
    "third_party",
]

BOUNDARY_WARNINGS = [
    "Data Ownership IP evaluates ownership, usage rights, consent, attribution, and license readiness only.",
    "Data Ownership IP does not verify truth, approve public data, mark public_approved records, publish reports, provide legal conclusions, or mutate SHF Impact Data Spine.",
]


def _clean_str(value: Any) -> str:
    return str(value or "").strip()


def _canonical_json(value: Dict[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _review_id(payload: Dict[str, Any]) -> str:
    digest = hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()[:16]
    return f"data_ownership_ip_{digest}"


def _candidate(payload: Dict[str, Any]) -> Dict[str, Any]:
    candidate = payload.get("candidate") if isinstance(payload.get("candidate"), dict) else payload
    return dict(candidate or {})


def _usage_rights(candidate: Dict[str, Any]) -> List[str]:
    value = candidate.get("usage_rights")
    if isinstance(value, list):
        return sorted({_clean_str(item).lower() for item in value if _clean_str(item)})
    if _clean_str(value):
        return sorted({_clean_str(part).lower() for part in str(value).replace(";", ",").split(",") if _clean_str(part)})
    return []


def _bool_value(value: Any) -> bool:
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "y", "approved", "confirmed", "clear"}
    return bool(value)


def evaluate_data_ownership_ip(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    source = dict(payload or {})
    candidate = _candidate(source)
    candidate_id = _clean_str(candidate.get("candidate_id") or candidate.get("id"))
    canonical_type = _clean_str(candidate.get("canonical_type") or "unknown")
    owner = _clean_str(candidate.get("owner") or candidate.get("source_owner") or candidate.get("data_owner"))
    submitted_by = _clean_str(candidate.get("submitted_by") or candidate.get("submitter"))
    license_type = _clean_str(candidate.get("license_type") or candidate.get("license") or "unknown").lower()
    if license_type not in LICENSE_TYPES:
        license_type = "unknown"
    usage_rights = _usage_rights(candidate)
    attribution_required = _bool_value(candidate.get("attribution_required"))
    attribution_text = _clean_str(candidate.get("attribution_text") or candidate.get("attribution_source"))
    consent_required = _bool_value(candidate.get("consent_required"))
    consent_confirmed = _bool_value(candidate.get("consent_confirmed"))
    third_party_ip_detected = _bool_value(candidate.get("third_party_ip_detected")) or license_type == "third_party"
    reuse_allowed = "reuse" in usage_rights
    reporting_allowed = "reporting" in usage_rights or license_type in {"reporting_allowed", "public_release_allowed"}
    public_release_rights = "public_release" in usage_rights or license_type == "public_release_allowed"
    warnings: List[str] = []
    blockers: List[str] = []

    if not candidate_id:
        warnings.append("missing_candidate_id")
        blockers.append("missing_candidate_id")
    if not owner:
        warnings.append("missing_owner")
        blockers.append("missing_owner")
    if not submitted_by:
        warnings.append("missing_submitted_by")
    if license_type == "unknown":
        warnings.append("missing_or_unknown_license_type")
    elif license_type == "restricted":
        warnings.append("restricted_license")
        blockers.append("restricted_license")
    elif license_type == "third_party":
        warnings.append("third_party_license_needs_review")
        if not usage_rights:
            blockers.append("third_party_license_without_explicit_rights")

    if attribution_required and not attribution_text:
        warnings.append("missing_attribution_text_or_source")
    if consent_required and not consent_confirmed:
        warnings.append("missing_required_consent")
        blockers.append("missing_required_consent")
    if not usage_rights:
        warnings.append("missing_usage_rights")
    if not public_release_rights:
        warnings.append("missing_public_release_rights")
    if third_party_ip_detected:
        warnings.append("third_party_ip_detected")

    if blockers:
        ownership_risk = "blocked"
        license_risk = "blocked" if "restricted_license" in blockers or "third_party_license_without_explicit_rights" in blockers else "high"
    elif third_party_ip_detected or license_type == "unknown":
        ownership_risk = "medium"
        license_risk = "medium"
    elif warnings:
        ownership_risk = "medium"
        license_risk = "low"
    else:
        ownership_risk = "low"
        license_risk = "low"

    ownership_clear_candidate = (
        not blockers
        and bool(candidate_id)
        and bool(owner)
        and bool(submitted_by)
        and bool(usage_rights)
        and license_type in {"internal_use", "reporting_allowed", "public_release_allowed"}
        and (not consent_required or consent_confirmed)
        and (not attribution_required or bool(attribution_text))
        and not (third_party_ip_detected and not public_release_rights)
        and public_release_rights
    )

    if ownership_clear_candidate:
        recommended_action = "eligible_for_public_release_rights_review"
    elif blockers:
        recommended_action = "resolve_ownership_or_license_blockers"
    elif not public_release_rights:
        recommended_action = "confirm_public_release_rights_before_public_use"
    else:
        recommended_action = "review_ownership_ip_before_public_use"

    result = {
        "ownership_review_id": _review_id({"candidate_id": candidate_id, "owner": owner, "license_type": license_type, "usage_rights": usage_rights}),
        "candidate_id": candidate_id,
        "canonical_type": canonical_type,
        "owner": owner,
        "submitted_by": submitted_by,
        "license_type": license_type,
        "usage_rights": usage_rights,
        "attribution_required": attribution_required,
        "consent_required": consent_required,
        "consent_confirmed": consent_confirmed,
        "third_party_ip_detected": third_party_ip_detected,
        "reuse_allowed": reuse_allowed,
        "reporting_allowed": reporting_allowed,
        "public_release_rights": public_release_rights,
        "ownership_risk": ownership_risk,
        "license_risk": license_risk,
        "warnings": sorted(set(warnings)),
        "blockers": sorted(set(blockers)),
        "recommended_action": recommended_action,
        "ownership_clear_candidate": ownership_clear_candidate,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
    }
    return {
        "ok": True,
        "layer": "data_ownership_ip",
        "data_ownership_ip": result,
        "warnings": result["warnings"],
        "blockers": result["blockers"],
        "ownership_clear_candidate": ownership_clear_candidate,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
    }


def batch_evaluate_data_ownership_ip(records: Any) -> Dict[str, Any]:
    items = records if isinstance(records, list) else []
    evaluations = [evaluate_data_ownership_ip(item if isinstance(item, dict) else {}) for item in items]
    reviews = [item["data_ownership_ip"] for item in evaluations]
    return {
        "ok": True,
        "layer": "data_ownership_ip",
        "total": len(evaluations),
        "blocked": sum(1 for item in reviews if item["blockers"]),
        "needs_review": sum(1 for item in reviews if item["warnings"] and not item["blockers"]),
        "ownership_clear_candidates": sum(1 for item in reviews if item["ownership_clear_candidate"]),
        "third_party_ip_detected_count": sum(1 for item in reviews if item["third_party_ip_detected"]),
        "consent_required_count": sum(1 for item in reviews if item["consent_required"]),
        "consent_missing_count": sum(1 for item in reviews if item["consent_required"] and not item["consent_confirmed"]),
        "attribution_required_count": sum(1 for item in reviews if item["attribution_required"]),
        "reuse_allowed_count": sum(1 for item in reviews if item["reuse_allowed"]),
        "reporting_allowed_count": sum(1 for item in reviews if item["reporting_allowed"]),
        "public_release_rights_count": sum(1 for item in reviews if item["public_release_rights"]),
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "evaluations": evaluations,
    }


def data_ownership_ip_schema() -> Dict[str, Any]:
    return {
        "ok": True,
        "layer": "data_ownership_ip",
        "license_types": list(LICENSE_TYPES),
        "risk_values": ["unknown", "low", "medium", "high", "blocked"],
        "result_fields": [
            "ownership_review_id",
            "candidate_id",
            "canonical_type",
            "owner",
            "submitted_by",
            "license_type",
            "usage_rights",
            "attribution_required",
            "consent_required",
            "consent_confirmed",
            "third_party_ip_detected",
            "reuse_allowed",
            "reporting_allowed",
            "public_release_rights",
            "ownership_risk",
            "license_risk",
            "warnings",
            "blockers",
            "recommended_action",
            "ownership_clear_candidate",
            "public_approved",
            "mutated_public_data",
            "published_report",
        ],
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def _sample_evaluations() -> Dict[str, Any]:
    return batch_evaluate_data_ownership_ip(
        [
            {
                "candidate": {
                    "candidate_id": "ownership_ip_clear",
                    "canonical_type": "impact_metric",
                    "owner": "SHF",
                    "submitted_by": "program_ops",
                    "license_type": "public_release_allowed",
                    "usage_rights": ["reporting", "reuse", "public_release"],
                    "attribution_required": False,
                    "consent_required": False,
                }
            },
            {
                "candidate": {
                    "candidate_id": "ownership_ip_review",
                    "canonical_type": "partner_story",
                    "owner": "Partner Org",
                    "submitted_by": "partner_contact",
                    "license_type": "third_party",
                    "usage_rights": ["reporting"],
                    "attribution_required": True,
                }
            },
            {
                "candidate": {
                    "candidate_id": "ownership_ip_blocked",
                    "canonical_type": "client_record",
                    "submitted_by": "client_ops",
                    "license_type": "restricted",
                    "usage_rights": [],
                    "consent_required": True,
                    "consent_confirmed": False,
                }
            },
        ]
    )


def data_ownership_ip_summary() -> Dict[str, Any]:
    sample = _sample_evaluations()
    return {
        "policy_status": "formalized_v1",
        "total_reviews": sample["total"],
        "blocked": sample["blocked"],
        "needs_review": sample["needs_review"],
        "ownership_clear_candidates": sample["ownership_clear_candidates"],
        "third_party_ip_detected_count": sample["third_party_ip_detected_count"],
        "consent_required_count": sample["consent_required_count"],
        "consent_missing_count": sample["consent_missing_count"],
        "attribution_required_count": sample["attribution_required_count"],
        "reuse_allowed_count": sample["reuse_allowed_count"],
        "reporting_allowed_count": sample["reporting_allowed_count"],
        "public_release_rights_count": sample["public_release_rights_count"],
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "approves_public_data": False,
        "mutates_shf_impact_data": False,
        "publishes_reports": False,
        "provides_legal_advice": False,
        "replaces_security_privacy": False,
        "replaces_role_permission": False,
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def data_ownership_ip_readiness() -> Dict[str, Any]:
    summary = data_ownership_ip_summary()
    return {
        "ok": True,
        "layer": "data_ownership_ip",
        "blocked": summary["blocked"],
        "needs_review": summary["needs_review"],
        "ownership_clear_candidates": summary["ownership_clear_candidates"],
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "provides_legal_advice": False,
    }


def data_ownership_ip_health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "data_ownership_ip",
        "status": "formalized_v1",
        "summary": data_ownership_ip_summary(),
    }
