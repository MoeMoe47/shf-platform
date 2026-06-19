from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, List


METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "UNKNOWN"]
EXPOSURES = ["public", "internal", "admin", "external", "unknown"]

GOVERNANCE_ROUTE_MARKERS = [
    "/truth",
    "/oracle",
    "/ai-guardrails",
    "/game-theory",
    "/agent",
    "/registry",
    "/layers",
    "/source-registry",
    "/data-federation",
    "/data-aggregator",
    "/data-normalization",
    "/evidence-package",
    "/data-verification",
    "/data-approval",
    "/readiness-gate",
    "/audit-verification",
    "/security-privacy",
    "/data-ownership-ip",
    "/public-approval",
    "/policy-engine",
    "/event-webhook",
]

READINESS_ROUTE_MARKERS = ["/reports", "/watchtower"]
SAFE_PUBLIC_PREFIXES = ["/health", "/status", "/docs", "/openapi.json"]

BOUNDARY_WARNINGS = [
    "API Gateway evaluates route exposure and gateway readiness only.",
    "API Gateway does not forward requests in V1, verify truth, approve public data, mutate SHF Impact Data Spine, publish reports, replace Identity, replace Policy Engine, or replace AI Guardrails.",
]


def _clean_str(value: Any) -> str:
    return str(value or "").strip()


def _canonical(value: Any) -> str:
    return _clean_str(value).lower().replace("_", "-")


def _request(payload: Dict[str, Any]) -> Dict[str, Any]:
    request = payload.get("request") if isinstance(payload.get("request"), dict) else payload
    return dict(request or {})


def _canonical_json(value: Dict[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _gateway_review_id(payload: Dict[str, Any]) -> str:
    digest = hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()[:16]
    return f"api_gateway_{digest}"


def _metadata(request: Dict[str, Any]) -> Dict[str, Any]:
    value = request.get("metadata")
    return dict(value) if isinstance(value, dict) else {}


def _bool(value: Any) -> bool:
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "y", "on", "ready", "present", "allowed"}
    return bool(value)


def _has_audit_context(request: Dict[str, Any], metadata: Dict[str, Any]) -> bool:
    return _bool(metadata.get("has_audit_context")) or _bool(metadata.get("audit_context")) or bool(_clean_str(metadata.get("audit_ref")))


def _path_has(path: str, markers: List[str]) -> bool:
    return any(marker in path for marker in markers)


def _infer_exposure(path: str, provided: str) -> str:
    if path.startswith("/admin"):
        return "admin"
    if _path_has(path, GOVERNANCE_ROUTE_MARKERS) or _path_has(path, READINESS_ROUTE_MARKERS):
        return "internal" if provided in {"", "unknown"} else provided
    if provided in EXPOSURES and provided != "unknown":
        return provided
    if any(path == prefix or path.startswith(f"{prefix}/") for prefix in SAFE_PUBLIC_PREFIXES):
        return "public"
    return "unknown"


def evaluate_api_gateway(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    source = dict(payload or {})
    request = _request(source)
    request_id = _clean_str(request.get("request_id"))
    path = _clean_str(request.get("path"))
    method = _clean_str(request.get("method")).upper() or "UNKNOWN"
    route_owner = _clean_str(request.get("route_owner"))
    provided_exposure = _canonical(request.get("exposure")) or "unknown"
    actor = _clean_str(request.get("actor"))
    role = _clean_str(request.get("role"))
    has_admin_key = _bool(request.get("has_admin_key"))
    has_identity_context = _bool(request.get("has_identity_context")) or bool(actor or role)
    has_policy_context = _bool(request.get("has_policy_context"))
    payload_ref = _clean_str(request.get("payload_ref"))
    metadata = _metadata(request)
    has_audit_context = _has_audit_context(request, metadata)
    normalized_path = path.lower()
    exposure = _infer_exposure(normalized_path, provided_exposure)
    warnings: List[str] = []
    blockers: List[str] = []

    if not request_id:
        blockers.append("missing_request_id")
    if not path:
        blockers.append("missing_path")
    if not _clean_str(request.get("method")):
        blockers.append("missing_method")
    elif method not in METHODS or method == "UNKNOWN":
        warnings.append("unknown_method")
        method = "UNKNOWN"

    is_admin_route = normalized_path.startswith("/admin") or exposure == "admin"
    is_governance_route = _path_has(normalized_path, GOVERNANCE_ROUTE_MARKERS)
    is_readiness_route = _path_has(normalized_path, READINESS_ROUTE_MARKERS)
    is_write_method = method in {"POST", "PUT", "PATCH", "DELETE"}
    is_destructive_method = method in {"PUT", "PATCH", "DELETE"}
    is_public_safe_get = method == "GET" and exposure == "public" and not (is_admin_route or is_governance_route or is_readiness_route)

    admin_protection_required = is_admin_route
    identity_required = is_admin_route or is_governance_route or exposure in {"internal", "admin", "external"}
    policy_required = is_governance_route or is_readiness_route or exposure in {"external", "admin"}
    audit_required = is_admin_route or is_governance_route or is_readiness_route or exposure in {"internal", "admin", "external"} or is_write_method
    rate_limit_recommended = exposure in {"public", "external"} or is_write_method

    if is_admin_route and not has_admin_key:
        blockers.append("admin_route_missing_admin_key")

    if is_destructive_method and not ((exposure in {"internal", "admin"}) and (has_admin_key or has_identity_context)):
        warnings.append("destructive_method_requires_internal_or_admin_protection")

    if identity_required and not has_identity_context and not has_admin_key:
        warnings.append("missing_identity_or_role_context")

    if policy_required and not has_policy_context:
        warnings.append("missing_policy_context")

    if audit_required and not has_audit_context:
        warnings.append("missing_audit_context")

    if exposure == "external":
        if not has_identity_context:
            warnings.append("external_exposure_missing_identity_context")
        if not has_policy_context:
            warnings.append("external_exposure_missing_policy_context")
        if not has_audit_context:
            warnings.append("external_exposure_missing_audit_context")

    if exposure == "public" and (is_admin_route or is_governance_route):
        blockers.append("protected_route_cannot_be_public")

    method_allowed = method in {"GET", "POST"} or (
        is_destructive_method and exposure in {"internal", "admin"} and (has_admin_key or has_identity_context)
    )

    if not method_allowed and method != "UNKNOWN":
        warnings.append("method_not_gateway_ready")

    public_exposure_allowed = is_public_safe_get and not blockers
    if blockers:
        gateway_status = "blocked"
    elif warnings:
        gateway_status = "needs_review"
    else:
        gateway_status = "gateway_ready"

    if is_public_safe_get and not blockers:
        gateway_status = "gateway_ready"
    elif exposure in {"internal", "admin"} and not blockers:
        required_context_present = (not identity_required or has_identity_context or has_admin_key) and (
            not policy_required or has_policy_context
        ) and (not audit_required or has_audit_context)
        if required_context_present and method_allowed:
            gateway_status = "gateway_ready"
    elif exposure == "external" and not blockers:
        if has_identity_context and has_policy_context and has_audit_context and method_allowed:
            gateway_status = "gateway_ready"
        else:
            gateway_status = "needs_review"

    gateway_ready = gateway_status == "gateway_ready"
    if blockers:
        recommended_action = "resolve_api_gateway_blockers"
    elif warnings and not gateway_ready:
        recommended_action = "review_api_gateway_context"
    else:
        recommended_action = "gateway_ready_without_forwarding"

    review = {
        "gateway_review_id": _gateway_review_id(
            {
                "request_id": request_id,
                "path": path,
                "method": method,
                "route_owner": route_owner,
                "exposure": exposure,
            }
        ),
        "request_id": request_id,
        "path": path,
        "method": method,
        "route_owner": route_owner,
        "exposure": exposure,
        "gateway_status": gateway_status,
        "method_allowed": method_allowed,
        "admin_protection_required": admin_protection_required,
        "identity_required": identity_required,
        "policy_required": policy_required,
        "audit_required": audit_required,
        "rate_limit_recommended": rate_limit_recommended,
        "public_exposure_allowed": public_exposure_allowed,
        "warnings": sorted(set(warnings)),
        "blockers": sorted(set(blockers)),
        "recommended_action": recommended_action,
        "gateway_ready": gateway_ready,
        "request_forwarded": False,
        "truth_verified": False,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
        "actor": actor,
        "role": role,
        "has_admin_key": has_admin_key,
        "has_identity_context": has_identity_context,
        "has_policy_context": has_policy_context,
        "has_audit_context": has_audit_context,
        "payload_ref": payload_ref,
        "metadata": metadata,
    }
    return {
        "ok": True,
        "layer": "api_gateway",
        "api_gateway": review,
        "warnings": review["warnings"],
        "blockers": review["blockers"],
        "gateway_ready": gateway_ready,
        "request_forwarded": False,
        "truth_verified": False,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
    }


def batch_evaluate_api_gateway(records: Any) -> Dict[str, Any]:
    items = records if isinstance(records, list) else []
    evaluations = [evaluate_api_gateway(item if isinstance(item, dict) else {}) for item in items]
    reviews = [item["api_gateway"] for item in evaluations]
    return {
        "ok": True,
        "layer": "api_gateway",
        "total_reviews": len(reviews),
        "blocked": sum(1 for item in reviews if item["gateway_status"] == "blocked"),
        "needs_review": sum(1 for item in reviews if item["gateway_status"] == "needs_review"),
        "gateway_ready": sum(1 for item in reviews if item["gateway_ready"]),
        "admin_protection_required_count": sum(1 for item in reviews if item["admin_protection_required"]),
        "identity_required_count": sum(1 for item in reviews if item["identity_required"]),
        "policy_required_count": sum(1 for item in reviews if item["policy_required"]),
        "audit_required_count": sum(1 for item in reviews if item["audit_required"]),
        "rate_limit_recommended_count": sum(1 for item in reviews if item["rate_limit_recommended"]),
        "public_exposure_allowed_count": sum(1 for item in reviews if item["public_exposure_allowed"]),
        "request_forwarded_count": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "evaluations": evaluations,
    }


def api_gateway_schema() -> Dict[str, Any]:
    return {
        "ok": True,
        "layer": "api_gateway",
        "methods": list(METHODS),
        "exposures": list(EXPOSURES),
        "gateway_statuses": ["blocked", "needs_review", "gateway_ready"],
        "governance_route_markers": list(GOVERNANCE_ROUTE_MARKERS),
        "readiness_route_markers": list(READINESS_ROUTE_MARKERS),
        "result_fields": [
            "gateway_review_id",
            "request_id",
            "path",
            "method",
            "route_owner",
            "exposure",
            "gateway_status",
            "method_allowed",
            "admin_protection_required",
            "identity_required",
            "policy_required",
            "audit_required",
            "rate_limit_recommended",
            "public_exposure_allowed",
            "warnings",
            "blockers",
            "recommended_action",
            "gateway_ready",
            "request_forwarded",
            "truth_verified",
            "public_approved",
            "mutated_public_data",
            "published_report",
        ],
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def _sample_evaluations() -> Dict[str, Any]:
    return batch_evaluate_api_gateway(
        [
            {
                "request": {
                    "request_id": "req_public_health",
                    "path": "/health",
                    "method": "GET",
                    "route_owner": "health",
                    "exposure": "public",
                    "metadata": {},
                }
            },
            {
                "request": {
                    "request_id": "req_truth_ready",
                    "path": "/truth/health",
                    "method": "GET",
                    "route_owner": "truth_spine",
                    "exposure": "internal",
                    "actor": "admin",
                    "role": "admin",
                    "has_identity_context": True,
                    "has_policy_context": True,
                    "metadata": {"has_audit_context": True},
                }
            },
            {
                "request": {
                    "request_id": "req_admin_blocked",
                    "path": "/admin/layers",
                    "method": "POST",
                    "route_owner": "admin",
                    "exposure": "admin",
                    "has_admin_key": False,
                    "metadata": {},
                }
            },
        ]
    )


def api_gateway_summary() -> Dict[str, Any]:
    sample = _sample_evaluations()
    return {
        "policy_status": "formalized_v1",
        "total_reviews": sample["total_reviews"],
        "blocked": sample["blocked"],
        "needs_review": sample["needs_review"],
        "gateway_ready": sample["gateway_ready"],
        "admin_protection_required_count": sample["admin_protection_required_count"],
        "identity_required_count": sample["identity_required_count"],
        "policy_required_count": sample["policy_required_count"],
        "audit_required_count": sample["audit_required_count"],
        "rate_limit_recommended_count": sample["rate_limit_recommended_count"],
        "public_exposure_allowed_count": sample["public_exposure_allowed_count"],
        "request_forwarded_count": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "forwards_requests": False,
        "verifies_truth": False,
        "approves_public_data": False,
        "mutates_shf_impact_data": False,
        "publishes_reports": False,
        "replaces_identity": False,
        "replaces_policy_engine": False,
        "replaces_ai_guardrails": False,
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def api_gateway_readiness() -> Dict[str, Any]:
    summary = api_gateway_summary()
    return {
        "ok": True,
        "layer": "api_gateway",
        "blocked": summary["blocked"],
        "needs_review": summary["needs_review"],
        "gateway_ready": summary["gateway_ready"],
        "request_forwarded_count": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "forwards_requests": False,
        "replaces_identity": False,
        "replaces_policy_engine": False,
    }


def api_gateway_health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "api_gateway",
        "status": "formalized_v1",
        "summary": api_gateway_summary(),
    }
