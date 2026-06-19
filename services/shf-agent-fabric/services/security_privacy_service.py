from __future__ import annotations

import hashlib
import json
import re
from typing import Any, Dict, Iterable, List, Set


PII_TERMS = {
    "email",
    "phone",
    "address",
    "ssn",
    "date_of_birth",
    "dob",
    "student_name",
    "minor_name",
    "client_name",
    "patient_name",
}

HIGH_RISK_PII_TERMS = {"ssn", "date_of_birth", "dob", "minor_name", "patient_name"}

SENSITIVE_TERMS = {
    "health",
    "diagnosis",
    "disability",
    "minor",
    "youth",
    "student",
    "criminal",
    "legal",
    "financial_account",
    "bank",
    "religion",
    "race",
    "ethnicity",
    "immigration",
}

SECRET_TERMS = {
    "api_key",
    "admin_api_key",
    "token",
    "secret",
    "password",
    "private_key",
    "bearer",
    "session",
}

BOUNDARY_WARNINGS = [
    "Security Privacy evaluates privacy and security exposure risk only.",
    "Security Privacy does not verify truth, approve public data, mark public_approved records, publish reports, replace Identity, replace role permissions, or mutate SHF Impact Data Spine.",
]


def _clean_str(value: Any) -> str:
    return str(value or "").strip()


def _canonical_json(value: Dict[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _review_id(payload: Dict[str, Any]) -> str:
    digest = hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()[:16]
    return f"security_privacy_{digest}"


def _candidate(payload: Dict[str, Any]) -> Dict[str, Any]:
    candidate = payload.get("candidate") if isinstance(payload.get("candidate"), dict) else payload
    return dict(candidate or {})


def _flatten(value: Any) -> Iterable[str]:
    if isinstance(value, dict):
        for key, item in value.items():
            yield _clean_str(key)
            yield from _flatten(item)
    elif isinstance(value, list):
        for item in value:
            yield from _flatten(item)
    elif value is not None:
        yield _clean_str(value)


def _tokens(candidate: Dict[str, Any]) -> Set[str]:
    text = " ".join(_flatten(candidate)).lower()
    pieces = set(re.findall(r"[a-z0-9_@.+-]+", text))
    compact = text.replace("-", "_").replace(" ", "_")
    for term in PII_TERMS | SENSITIVE_TERMS | SECRET_TERMS:
        if term in compact or term.replace("_", " ") in text:
            pieces.add(term)
    if re.search(r"[\w.+-]+@[\w.-]+\.[a-z]{2,}", text):
        pieces.add("email")
    if re.search(r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b", text):
        pieces.add("phone")
    return pieces


def _risk(has_secret: bool, pii_matches: Set[str], sensitive_matches: Set[str]) -> tuple[str, str]:
    if has_secret:
        return "blocked", "blocked"
    if pii_matches & HIGH_RISK_PII_TERMS:
        return "high", "low"
    if pii_matches and sensitive_matches:
        return "high", "low"
    if pii_matches:
        return "medium", "none"
    if sensitive_matches:
        return "medium", "none"
    return "none", "none"


def evaluate_security_privacy(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    source = dict(payload or {})
    candidate = _candidate(source)
    candidate_id = _clean_str(candidate.get("candidate_id") or candidate.get("id"))
    canonical_type = _clean_str(candidate.get("canonical_type") or "unknown")
    tokens = _tokens(candidate)
    pii_matches = sorted(tokens & PII_TERMS)
    sensitive_matches = sorted(tokens & SENSITIVE_TERMS)
    secret_matches = sorted(tokens & SECRET_TERMS)
    pii_detected = bool(pii_matches)
    sensitive_data_detected = bool(sensitive_matches)
    secret_detected = bool(secret_matches)
    privacy_risk, security_risk = _risk(secret_detected, set(pii_matches), set(sensitive_matches))
    warnings: List[str] = []
    blockers: List[str] = []

    if not candidate_id:
        warnings.append("missing_candidate_id")
    if pii_detected:
        warnings.append("pii_detected")
    if sensitive_data_detected:
        warnings.append("sensitive_data_detected")
    if secret_detected:
        warnings.append("secret_detected")
        blockers.append("secret_detected")
    if privacy_risk == "high":
        warnings.append("high_privacy_risk")
    if security_risk in {"high", "blocked"}:
        warnings.append("security_exposure_risk")
    if not candidate_id:
        blockers.append("missing_candidate_id")

    redaction_required = pii_detected or sensitive_data_detected or secret_detected
    access_restriction_required = pii_detected or sensitive_data_detected or secret_detected
    privacy_review_required = pii_detected or sensitive_data_detected or privacy_risk in {"medium", "high", "blocked"}
    security_review_required = secret_detected or security_risk in {"medium", "high", "blocked"}
    public_safe_candidate = (
        not secret_detected
        and not blockers
        and privacy_risk not in {"high", "blocked"}
        and security_risk not in {"high", "blocked"}
        and redaction_required is False
        and privacy_review_required is False
        and security_review_required is False
    )

    if public_safe_candidate:
        recommended_action = "eligible_for_public_approval_review"
    elif blockers:
        recommended_action = "block_and_remove_security_privacy_exposure"
    elif redaction_required:
        recommended_action = "redact_and_restrict_before_public_review"
    else:
        recommended_action = "review_security_privacy_before_public_review"

    result = {
        "review_id": _review_id({"candidate_id": candidate_id, "canonical_type": canonical_type, "tokens": sorted(tokens)}),
        "candidate_id": candidate_id,
        "canonical_type": canonical_type,
        "privacy_risk": privacy_risk,
        "security_risk": security_risk,
        "pii_detected": pii_detected,
        "sensitive_data_detected": sensitive_data_detected,
        "secret_detected": secret_detected,
        "pii_matches": pii_matches,
        "sensitive_matches": sensitive_matches,
        "secret_matches": secret_matches,
        "redaction_required": redaction_required,
        "access_restriction_required": access_restriction_required,
        "privacy_review_required": privacy_review_required,
        "security_review_required": security_review_required,
        "public_safe_candidate": public_safe_candidate,
        "warnings": sorted(set(warnings)),
        "blockers": sorted(set(blockers)),
        "recommended_action": recommended_action,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
    }
    return {
        "ok": True,
        "layer": "security_privacy",
        "security_privacy": result,
        "warnings": result["warnings"],
        "blockers": result["blockers"],
        "public_safe_candidate": public_safe_candidate,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
    }


def batch_evaluate_security_privacy(records: Any) -> Dict[str, Any]:
    items = records if isinstance(records, list) else []
    evaluations = [evaluate_security_privacy(item if isinstance(item, dict) else {}) for item in items]
    reviews = [item["security_privacy"] for item in evaluations]
    return {
        "ok": True,
        "layer": "security_privacy",
        "total": len(evaluations),
        "blocked": sum(1 for item in reviews if item["blockers"]),
        "needs_review": sum(1 for item in reviews if item["warnings"] and not item["blockers"]),
        "public_safe_candidates": sum(1 for item in reviews if item["public_safe_candidate"]),
        "pii_detected_count": sum(1 for item in reviews if item["pii_detected"]),
        "sensitive_data_detected_count": sum(1 for item in reviews if item["sensitive_data_detected"]),
        "secret_detected_count": sum(1 for item in reviews if item["secret_detected"]),
        "redaction_required_count": sum(1 for item in reviews if item["redaction_required"]),
        "access_restriction_required_count": sum(1 for item in reviews if item["access_restriction_required"]),
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "evaluations": evaluations,
    }


def security_privacy_schema() -> Dict[str, Any]:
    return {
        "ok": True,
        "layer": "security_privacy",
        "privacy_risk_values": ["none", "low", "medium", "high", "blocked"],
        "security_risk_values": ["none", "low", "medium", "high", "blocked"],
        "pii_indicators": sorted(PII_TERMS),
        "sensitive_indicators": sorted(SENSITIVE_TERMS),
        "secret_indicators": sorted(SECRET_TERMS),
        "result_fields": [
            "review_id",
            "candidate_id",
            "canonical_type",
            "privacy_risk",
            "security_risk",
            "pii_detected",
            "sensitive_data_detected",
            "secret_detected",
            "redaction_required",
            "access_restriction_required",
            "privacy_review_required",
            "security_review_required",
            "public_safe_candidate",
            "warnings",
            "blockers",
            "recommended_action",
            "public_approved",
            "mutated_public_data",
            "published_report",
        ],
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def _sample_evaluations() -> Dict[str, Any]:
    return batch_evaluate_security_privacy(
        [
            {
                "candidate": {
                    "candidate_id": "security_privacy_safe",
                    "canonical_type": "impact_metric",
                    "title": "County program reached 120 learners.",
                    "summary": "Aggregate public-safe impact metric.",
                }
            },
            {
                "candidate": {
                    "candidate_id": "security_privacy_review",
                    "canonical_type": "participant_story",
                    "student_name": "Sample Student",
                    "summary": "Youth participant story with school context.",
                }
            },
            {
                "candidate": {
                    "candidate_id": "security_privacy_blocked",
                    "canonical_type": "ops_config",
                    "api_key": "sample-key",
                    "token": "sample-token",
                }
            },
        ]
    )


def security_privacy_summary() -> Dict[str, Any]:
    sample = _sample_evaluations()
    return {
        "policy_status": "formalized_v1",
        "total_reviews": sample["total"],
        "blocked": sample["blocked"],
        "needs_review": sample["needs_review"],
        "public_safe_candidates": sample["public_safe_candidates"],
        "pii_detected_count": sample["pii_detected_count"],
        "sensitive_data_detected_count": sample["sensitive_data_detected_count"],
        "secret_detected_count": sample["secret_detected_count"],
        "redaction_required_count": sample["redaction_required_count"],
        "access_restriction_required_count": sample["access_restriction_required_count"],
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "approves_public_data": False,
        "mutates_shf_impact_data": False,
        "publishes_reports": False,
        "replaces_identity": False,
        "replaces_role_permission": False,
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def security_privacy_readiness() -> Dict[str, Any]:
    summary = security_privacy_summary()
    return {
        "ok": True,
        "layer": "security_privacy",
        "blocked": summary["blocked"],
        "needs_review": summary["needs_review"],
        "public_safe_candidates": summary["public_safe_candidates"],
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "approves_public_data": False,
        "replaces_identity": False,
        "replaces_role_permission": False,
    }


def security_privacy_health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "security_privacy",
        "status": "formalized_v1",
        "summary": security_privacy_summary(),
    }
