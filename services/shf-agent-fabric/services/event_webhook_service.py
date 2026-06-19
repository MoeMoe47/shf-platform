from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict, List


EVENT_TYPES = [
    "layer_status",
    "data_ready",
    "approval_ready",
    "public_ready_candidate",
    "watchtower_observation",
    "report_snapshot",
    "policy_violation",
    "security_privacy_warning",
    "ownership_warning",
    "agent_action",
    "integration_request",
    "unknown",
]

KNOWN_SOURCE_LAYERS = {
    "source_registry",
    "data_federation",
    "data_aggregator",
    "data_normalization",
    "evidence_package",
    "data_verification",
    "truth_spine",
    "oracle",
    "data_approval",
    "readiness_gate",
    "security_privacy",
    "data_ownership_ip",
    "public_approval",
    "data_approval_gateway",
    "shf_impact_data_spine",
    "reports",
    "watchtower",
    "loo",
    "audit_verification",
    "policy_engine",
    "production_automation",
}

INTERNAL_TARGETS = {
    "reports",
    "watchtower",
    "audit_verification",
    "readiness_gate",
    "policy_engine",
    "notification_alert",
    "production_automation",
    "client_reporting",
}

EXTERNAL_TARGETS = {
    "webhook",
    "partner_system",
    "client_callback",
    "public_status_feed",
}

DELIVERY_SCOPES = {"internal", "external", "both", "unknown"}

BOUNDARY_WARNINGS = [
    "Event Webhook evaluates event routing, queue readiness, and webhook readiness only.",
    "Event Webhook does not send external webhooks in V1, verify truth, approve public data, mutate SHF Impact Data Spine, publish reports, replace Watchtower, or replace Policy Engine.",
]


def _clean_str(value: Any) -> str:
    return str(value or "").strip()


def _canonical(value: Any) -> str:
    return _clean_str(value).lower().replace("-", "_").replace(" ", "_")


def _request(payload: Dict[str, Any]) -> Dict[str, Any]:
    request = payload.get("event") if isinstance(payload.get("event"), dict) else payload
    return dict(request or {})


def _canonical_json(value: Dict[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _event_review_id(payload: Dict[str, Any]) -> str:
    digest = hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()[:16]
    return f"event_webhook_{digest}"


def _targets(value: Any) -> List[str]:
    if not isinstance(value, list):
        return []
    return [_canonical(item) for item in value if _clean_str(item)]


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def evaluate_event_webhook(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    source = dict(payload or {})
    request = _request(source)
    event_id = _clean_str(request.get("event_id"))
    raw_event_type = _clean_str(request.get("event_type"))
    event_type = _canonical(raw_event_type)
    source_layer = _canonical(request.get("source_layer"))
    subject_id = _clean_str(request.get("subject_id"))
    subject_type = _clean_str(request.get("subject_type"))
    actor = _clean_str(request.get("actor"))
    payload_ref = _clean_str(request.get("payload_ref"))
    audit_ref = _clean_str(request.get("audit_ref"))
    policy_ref = _clean_str(request.get("policy_ref"))
    security_privacy_ref = _clean_str(request.get("security_privacy_ref"))
    ownership_ref = _clean_str(request.get("ownership_ref"))
    delivery_scope = _canonical(request.get("delivery_scope")) or "unknown"
    requested_targets = _targets(request.get("requested_targets"))
    timestamp = _clean_str(request.get("timestamp"))
    metadata = request.get("metadata") if isinstance(request.get("metadata"), dict) else {}
    warnings: List[str] = []
    blockers: List[str] = []

    if not event_id:
        blockers.append("missing_event_id")
    if not raw_event_type:
        blockers.append("missing_event_type")
    elif event_type not in EVENT_TYPES or event_type == "unknown":
        warnings.append("unknown_event_type")
        event_type = "unknown"
    if not source_layer:
        blockers.append("missing_source_layer")
    elif source_layer not in KNOWN_SOURCE_LAYERS:
        warnings.append("unknown_source_layer")
    if not subject_id:
        warnings.append("missing_subject_id")
    if not timestamp:
        warnings.append("missing_timestamp")
    if delivery_scope not in DELIVERY_SCOPES:
        warnings.append("unknown_delivery_scope")
        delivery_scope = "unknown"
    if not requested_targets:
        warnings.append("missing_requested_targets")

    internal_targets = [target for target in requested_targets if target in INTERNAL_TARGETS]
    external_targets = [target for target in requested_targets if target in EXTERNAL_TARGETS]
    blocked_targets = [target for target in requested_targets if target not in INTERNAL_TARGETS and target not in EXTERNAL_TARGETS]

    if blocked_targets:
        warnings.append("unknown_requested_targets")

    requires_external_context = delivery_scope in {"external", "both"} or bool(external_targets)
    if requires_external_context:
        if not policy_ref:
            blockers.append("external_delivery_missing_policy_ref")
        if not security_privacy_ref:
            blockers.append("external_delivery_missing_security_privacy_ref")
        if not ownership_ref:
            blockers.append("external_delivery_missing_ownership_ref")

    if delivery_scope == "internal" and external_targets:
        warnings.append("external_targets_requested_for_internal_scope")
    if delivery_scope == "external" and internal_targets:
        warnings.append("internal_targets_requested_for_external_scope")

    if blockers:
        routing_status = "blocked"
    elif warnings:
        routing_status = "needs_review"
    else:
        routing_status = "queue_ready"

    external_delivery_allowed = requires_external_context and not blockers and bool(policy_ref and security_privacy_ref and ownership_ref)
    queue_ready = routing_status == "queue_ready" or (
        routing_status == "needs_review"
        and delivery_scope == "internal"
        and bool(internal_targets)
        and not blockers
        and "unknown_source_layer" not in warnings
        and "unknown_event_type" not in warnings
    )

    if queue_ready and routing_status != "queue_ready" and not blockers:
        routing_status = "queue_ready"

    if blockers:
        recommended_action = "resolve_event_webhook_blockers"
    elif warnings:
        recommended_action = "review_event_webhook_context"
    elif external_delivery_allowed:
        recommended_action = "queue_for_future_external_delivery_without_sending"
    else:
        recommended_action = "queue_for_internal_consumers"

    review = {
        "event_review_id": _event_review_id(
            {
                "event_id": event_id,
                "event_type": event_type,
                "source_layer": source_layer,
                "subject_id": subject_id,
                "delivery_scope": delivery_scope,
                "requested_targets": requested_targets,
            }
        ),
        "event_id": event_id,
        "event_type": event_type,
        "source_layer": source_layer,
        "subject_id": subject_id,
        "subject_type": subject_type,
        "actor": actor,
        "payload_ref": payload_ref,
        "audit_ref": audit_ref,
        "policy_ref": policy_ref,
        "security_privacy_ref": security_privacy_ref,
        "ownership_ref": ownership_ref,
        "routing_status": routing_status,
        "delivery_scope": delivery_scope,
        "internal_targets": internal_targets,
        "external_targets": external_targets,
        "blocked_targets": blocked_targets,
        "warnings": sorted(set(warnings)),
        "blockers": sorted(set(blockers)),
        "recommended_action": recommended_action,
        "queue_ready": queue_ready,
        "external_delivery_allowed": external_delivery_allowed,
        "webhook_sent": False,
        "truth_verified": False,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
        "timestamp": timestamp,
        "metadata": metadata,
    }
    return {
        "ok": True,
        "layer": "event_webhook",
        "event_webhook": review,
        "warnings": review["warnings"],
        "blockers": review["blockers"],
        "queue_ready": queue_ready,
        "external_delivery_allowed": external_delivery_allowed,
        "webhook_sent": False,
        "truth_verified": False,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
    }


def batch_evaluate_event_webhooks(records: Any) -> Dict[str, Any]:
    items = records if isinstance(records, list) else []
    evaluations = [evaluate_event_webhook(item if isinstance(item, dict) else {}) for item in items]
    reviews = [item["event_webhook"] for item in evaluations]
    return {
        "ok": True,
        "layer": "event_webhook",
        "total_events": len(reviews),
        "blocked": sum(1 for item in reviews if item["routing_status"] == "blocked"),
        "needs_review": sum(1 for item in reviews if item["routing_status"] == "needs_review"),
        "queue_ready": sum(1 for item in reviews if item["queue_ready"]),
        "external_delivery_allowed_count": sum(1 for item in reviews if item["external_delivery_allowed"]),
        "webhook_sent_count": 0,
        "internal_targets_count": sum(len(item["internal_targets"]) for item in reviews),
        "external_targets_count": sum(len(item["external_targets"]) for item in reviews),
        "blocked_targets_count": sum(len(item["blocked_targets"]) for item in reviews),
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "evaluations": evaluations,
    }


def event_webhook_schema() -> Dict[str, Any]:
    return {
        "ok": True,
        "layer": "event_webhook",
        "event_types": list(EVENT_TYPES),
        "known_source_layers": sorted(KNOWN_SOURCE_LAYERS),
        "delivery_scopes": sorted(DELIVERY_SCOPES),
        "recognized_internal_targets": sorted(INTERNAL_TARGETS),
        "recognized_external_targets": sorted(EXTERNAL_TARGETS),
        "routing_statuses": ["blocked", "needs_review", "queue_ready"],
        "result_fields": [
            "event_review_id",
            "event_id",
            "event_type",
            "source_layer",
            "routing_status",
            "delivery_scope",
            "internal_targets",
            "external_targets",
            "blocked_targets",
            "warnings",
            "blockers",
            "recommended_action",
            "queue_ready",
            "external_delivery_allowed",
            "webhook_sent",
            "truth_verified",
            "public_approved",
            "mutated_public_data",
            "published_report",
        ],
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def _sample_evaluations() -> Dict[str, Any]:
    return batch_evaluate_event_webhooks(
        [
            {
                "event": {
                    "event_id": "evt_internal_report_ready",
                    "event_type": "report_snapshot",
                    "source_layer": "reports",
                    "subject_id": "report_snapshot_001",
                    "subject_type": "report",
                    "actor": "reports_service",
                    "payload_ref": "reports/snapshot",
                    "audit_ref": "audit_ready_001",
                    "delivery_scope": "internal",
                    "requested_targets": ["reports", "watchtower"],
                    "timestamp": _timestamp(),
                }
            },
            {
                "event": {
                    "event_id": "evt_partner_callback_ready",
                    "event_type": "integration_request",
                    "source_layer": "data_approval_gateway",
                    "subject_id": "gateway_candidate_001",
                    "subject_type": "candidate",
                    "actor": "gateway",
                    "payload_ref": "candidate/gateway_candidate_001",
                    "audit_ref": "audit_ready_002",
                    "policy_ref": "policy_allowed_001",
                    "security_privacy_ref": "security_clear_001",
                    "ownership_ref": "ownership_clear_001",
                    "delivery_scope": "external",
                    "requested_targets": ["webhook"],
                    "timestamp": _timestamp(),
                }
            },
            {
                "event": {
                    "event_id": "evt_public_blocked",
                    "event_type": "public_ready_candidate",
                    "source_layer": "public_approval",
                    "subject_id": "public_candidate_001",
                    "subject_type": "candidate",
                    "actor": "public_approval",
                    "delivery_scope": "both",
                    "requested_targets": ["watchtower", "public_status_feed"],
                    "timestamp": _timestamp(),
                }
            },
        ]
    )


def event_webhook_summary() -> Dict[str, Any]:
    sample = _sample_evaluations()
    return {
        "policy_status": "formalized_v1",
        "total_events": sample["total_events"],
        "blocked": sample["blocked"],
        "needs_review": sample["needs_review"],
        "queue_ready": sample["queue_ready"],
        "external_delivery_allowed_count": sample["external_delivery_allowed_count"],
        "webhook_sent_count": 0,
        "internal_targets_count": sample["internal_targets_count"],
        "external_targets_count": sample["external_targets_count"],
        "blocked_targets_count": sample["blocked_targets_count"],
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "sends_external_webhooks": False,
        "verifies_truth": False,
        "approves_public_data": False,
        "mutates_shf_impact_data": False,
        "publishes_reports": False,
        "replaces_audit_verification": False,
        "replaces_watchtower": False,
        "replaces_notification_alert": False,
        "replaces_policy_engine": False,
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def event_webhook_readiness() -> Dict[str, Any]:
    summary = event_webhook_summary()
    return {
        "ok": True,
        "layer": "event_webhook",
        "blocked": summary["blocked"],
        "needs_review": summary["needs_review"],
        "queue_ready": summary["queue_ready"],
        "external_delivery_allowed_count": summary["external_delivery_allowed_count"],
        "webhook_sent_count": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "sends_external_webhooks": False,
        "replaces_watchtower": False,
        "replaces_notification_alert": False,
    }


def event_webhook_health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "event_webhook",
        "status": "formalized_v1",
        "summary": event_webhook_summary(),
    }
