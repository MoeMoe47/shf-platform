from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, List


POLICY_DOMAINS = [
    "ai_governance",
    "identity",
    "role_permission",
    "security_privacy",
    "data_ownership_ip",
    "public_approval",
    "reporting",
    "watchtower",
    "integration",
    "unknown",
]

DOMAIN_OWNER_LAYER = {
    "ai_governance": "AI Guardrails",
    "identity": "Identity / Access Control",
    "role_permission": "Role / Permission Layer",
    "security_privacy": "Security / Privacy",
    "data_ownership_ip": "Data Ownership / IP",
    "public_approval": "Public Approval",
    "reporting": "Reports",
    "watchtower": "Watchtower",
    "integration": "Readiness Gate",
    "unknown": "Governance Layer",
}

BOUNDARY_WARNINGS = [
    "Policy Engine evaluates policy readiness, violations, warnings, escalation, and proceed/block status only.",
    "Policy Engine does not verify truth, approve public data, mark public_approved records, publish reports, replace AI Guardrails, replace Identity, or mutate SHF Impact Data Spine.",
]


def _clean_str(value: Any) -> str:
    return str(value or "").strip()


def _canonical_json(value: Dict[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _policy_evaluation_id(payload: Dict[str, Any]) -> str:
    digest = hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()[:16]
    return f"policy_engine_{digest}"


def _request(payload: Dict[str, Any]) -> Dict[str, Any]:
    request = payload.get("policy") if isinstance(payload.get("policy"), dict) else payload
    return dict(request or {})


def _domain(value: Any) -> str:
    domain = _clean_str(value).lower().replace("-", "_").replace(" ", "_")
    return domain if domain in POLICY_DOMAINS else "unknown"


def _context(request: Dict[str, Any]) -> Dict[str, Any]:
    value = request.get("context")
    return dict(value) if isinstance(value, dict) else {}


def _is_clear(value: Any) -> bool:
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "clear", "allowed", "approved", "ready", "passed", "pass"}
    return bool(value)


def _has_status(context: Dict[str, Any], *names: str) -> bool:
    return any(_clean_str(context.get(name)) for name in names)


def _contains(action: str, *needles: str) -> bool:
    return any(needle in action for needle in needles)


def evaluate_policy(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    source = dict(payload or {})
    request = _request(source)
    raw_domain = _clean_str(request.get("policy_domain"))
    policy_domain = _domain(raw_domain)
    requested_action = _clean_str(request.get("requested_action")).lower()
    subject_id = _clean_str(request.get("subject_id"))
    actor = _clean_str(request.get("actor"))
    resource = _clean_str(request.get("resource"))
    context = _context(request)
    violations: List[str] = []
    warnings: List[str] = []

    if not raw_domain:
        violations.append("missing_policy_domain")
    elif policy_domain == "unknown":
        warnings.append("unknown_policy_domain")

    if not requested_action:
        violations.append("missing_requested_action")

    if _contains(requested_action, "publish", "public_approve"):
        if not _is_clear(context.get("public_approval")) and not _is_clear(context.get("public_approval_ready")):
            violations.append("public_action_missing_public_approval_context")
        if not _is_clear(context.get("security_privacy_clear")):
            violations.append("public_action_missing_security_privacy_clear")
        if not _is_clear(context.get("data_ownership_ip_clear")):
            violations.append("public_action_missing_data_ownership_ip_clear")

    if _contains(requested_action, "agent_execute", "ai_generate"):
        if not _has_status(context, "ai_guardrails_status", "ai_governance_status"):
            warnings.append("missing_ai_guardrails_context")

    if _contains(requested_action, "admin", "protected"):
        if not actor or not _clean_str(context.get("role")):
            warnings.append("missing_actor_or_role_context")

    if "report" in requested_action:
        if not _has_status(context, "audit_status", "readiness_status", "readiness_gate_status"):
            warnings.append("missing_audit_or_readiness_context")

    if "shf_impact_data_spine_write" in requested_action:
        if not (
            _clean_str(context.get("gateway_status")).lower() in {"gateway_ready", "public_ready_candidate", "review_complete", "approved"}
            and _clean_str(context.get("public_release_state")).lower() in {"public_ready_candidate", "ready"}
        ):
            violations.append("shf_impact_data_spine_write_blocked_without_gateway_public_ready_context")
        warnings.append("shf_impact_data_spine_write_never_mutates_in_v1")

    if _is_clear(context.get("secret_detected")) or _clean_str(context.get("security_risk")).lower() == "blocked":
        violations.append("security_or_secret_violation")
    if _is_clear(context.get("privacy_blocker")) or _clean_str(context.get("privacy_risk")).lower() == "blocked":
        violations.append("privacy_blocker")
    if _is_clear(context.get("ownership_blocker")) or _clean_str(context.get("ownership_risk")).lower() == "blocked":
        violations.append("ownership_blocker")

    if violations:
        policy_status = "blocked"
    elif warnings:
        policy_status = "needs_review"
    else:
        policy_status = "allowed"

    can_proceed = policy_status == "allowed"
    escalation_required = bool(violations) or any("unknown" in warning or "missing" in warning for warning in warnings)
    owner_layer = DOMAIN_OWNER_LAYER.get(policy_domain, "Governance Layer")
    if violations:
        recommended_action = f"resolve_policy_violations_with_{owner_layer.lower().replace(' / ', '_').replace(' ', '_')}"
    elif warnings:
        recommended_action = f"review_policy_context_with_{owner_layer.lower().replace(' / ', '_').replace(' ', '_')}"
    else:
        recommended_action = "allow_policy_controlled_action"

    base_score = 100
    policy_score = max(0, base_score - len(violations) * 30 - len(warnings) * 12)
    policy = {
        "policy_evaluation_id": _policy_evaluation_id(
            {
                "policy_domain": policy_domain,
                "requested_action": requested_action,
                "subject_id": subject_id,
                "actor": actor,
                "resource": resource,
            }
        ),
        "policy_domain": policy_domain,
        "requested_action": requested_action,
        "subject_id": subject_id,
        "actor": actor,
        "resource": resource,
        "policy_status": policy_status,
        "policy_score": policy_score,
        "violations": sorted(set(violations)),
        "warnings": sorted(set(warnings)),
        "owner_layer": owner_layer,
        "recommended_action": recommended_action,
        "can_proceed": can_proceed,
        "escalation_required": escalation_required,
        "truth_verified": False,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
    }
    return {
        "ok": True,
        "layer": "policy_engine",
        "policy": policy,
        "violations": policy["violations"],
        "warnings": policy["warnings"],
        "can_proceed": can_proceed,
        "escalation_required": escalation_required,
        "truth_verified": False,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
    }


def batch_evaluate_policies(records: Any) -> Dict[str, Any]:
    items = records if isinstance(records, list) else []
    evaluations = [evaluate_policy(item if isinstance(item, dict) else {}) for item in items]
    policies = [item["policy"] for item in evaluations]
    return {
        "ok": True,
        "layer": "policy_engine",
        "total": len(evaluations),
        "blocked": sum(1 for item in policies if item["policy_status"] == "blocked"),
        "needs_review": sum(1 for item in policies if item["policy_status"] == "needs_review"),
        "allowed": sum(1 for item in policies if item["policy_status"] == "allowed"),
        "escalation_required_count": sum(1 for item in policies if item["escalation_required"]),
        "violations_count": sum(len(item["violations"]) for item in policies),
        "can_proceed_count": sum(1 for item in policies if item["can_proceed"]),
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "evaluations": evaluations,
    }


def policy_engine_schema() -> Dict[str, Any]:
    return {
        "ok": True,
        "layer": "policy_engine",
        "policy_domains": list(POLICY_DOMAINS),
        "policy_statuses": ["blocked", "needs_review", "allowed"],
        "result_fields": [
            "policy_evaluation_id",
            "policy_domain",
            "requested_action",
            "subject_id",
            "actor",
            "resource",
            "policy_status",
            "policy_score",
            "violations",
            "warnings",
            "owner_layer",
            "recommended_action",
            "can_proceed",
            "escalation_required",
            "truth_verified",
            "public_approved",
            "mutated_public_data",
            "published_report",
        ],
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def _sample_evaluations() -> Dict[str, Any]:
    return batch_evaluate_policies(
        [
            {
                "policy": {
                    "policy_domain": "reporting",
                    "requested_action": "report_snapshot",
                    "subject_id": "report_ready_sample",
                    "actor": "reports_service",
                    "resource": "reports",
                    "context": {"audit_status": "ready", "readiness_gate_status": "ready"},
                }
            },
            {
                "policy": {
                    "policy_domain": "public_approval",
                    "requested_action": "publish_public_report",
                    "subject_id": "public_report_review",
                    "actor": "reports_service",
                    "resource": "public_report",
                    "context": {"public_approval": "ready"},
                }
            },
            {
                "policy": {
                    "policy_domain": "security_privacy",
                    "requested_action": "publish_public_report",
                    "subject_id": "public_report_blocked",
                    "actor": "reports_service",
                    "resource": "public_report",
                    "context": {"secret_detected": True},
                }
            },
        ]
    )


def policy_engine_summary() -> Dict[str, Any]:
    sample = _sample_evaluations()
    return {
        "policy_status": "formalized_v1",
        "total_evaluations": sample["total"],
        "blocked": sample["blocked"],
        "needs_review": sample["needs_review"],
        "allowed": sample["allowed"],
        "escalation_required_count": sample["escalation_required_count"],
        "violations_count": sample["violations_count"],
        "can_proceed_count": sample["can_proceed_count"],
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "verifies_truth": False,
        "approves_public_data": False,
        "mutates_shf_impact_data": False,
        "publishes_reports": False,
        "replaces_ai_guardrails": False,
        "replaces_identity": False,
        "replaces_security_privacy": False,
        "replaces_data_ownership_ip": False,
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def policy_engine_readiness() -> Dict[str, Any]:
    summary = policy_engine_summary()
    return {
        "ok": True,
        "layer": "policy_engine",
        "blocked": summary["blocked"],
        "needs_review": summary["needs_review"],
        "allowed": summary["allowed"],
        "can_proceed_count": summary["can_proceed_count"],
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "replaces_ai_guardrails": False,
        "replaces_identity": False,
    }


def policy_engine_health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "policy_engine",
        "status": "formalized_v1",
        "summary": policy_engine_summary(),
    }
