from __future__ import annotations

import hashlib
import json
from typing import Any, Dict


TRIGGER_TYPES = [
    "watchtower_observation",
    "policy_violation",
    "readiness_blocker",
    "security_privacy_warning",
    "ownership_warning",
    "public_approval_warning",
    "system_health",
    "clientops_update",
    "report_ready",
    "automation_ready",
    "unknown",
]

SEVERITIES = ["info", "low", "medium", "high", "critical", "unknown"]
RECIPIENT_SCOPES = ["internal_admin", "internal_ops", "client", "partner", "public", "unknown"]
DELIVERY_CHANNELS = ["in_app", "email", "sms", "slack", "teams", "webhook", "none", "unknown"]

EXTERNAL_RECIPIENT_SCOPES = {"client", "partner", "public"}
EXTERNAL_DELIVERY_CHANNELS = {"email", "sms", "slack", "teams", "webhook"}
AUDIT_REQUIRED_TRIGGERS = {"policy_violation", "security_privacy_warning", "ownership_warning", "public_approval_warning"}
POLICY_REQUIRED_TRIGGERS = {"policy_violation", "public_approval_warning"}
INTERNAL_READY_TRIGGERS = {"watchtower_observation", "system_health", "readiness_blocker"}

BOUNDARY_WARNINGS = [
    "Notification / Alert Layer classifies notification readiness only.",
    "Notification / Alert Layer does not send notifications, send email, send SMS, send messages, send webhooks, call external systems, write production records, verify truth, approve public data, mutate SHF Impact Data Spine, publish reports, replace Event / Webhook, replace Production Automation, replace Policy Engine, replace Watchtower, or replace Reports.",
]


def _clean_str(value: Any) -> str:
    return str(value or "").strip()


def _canonical(value: Any) -> str:
    return _clean_str(value).lower().replace("-", "_").replace(" ", "_")


def _request(payload: Dict[str, Any]) -> Dict[str, Any]:
    request = payload.get("notification_alert") if isinstance(payload.get("notification_alert"), dict) else payload
    return dict(request or {})


def _dict(value: Any) -> Dict[str, Any]:
    return dict(value) if isinstance(value, dict) else {}


def _canonical_json(value: Dict[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _notification_result_id(payload: Dict[str, Any]) -> str:
    digest = hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()[:16]
    return f"notification_alert_{digest}"


def _ref_clear(value: str) -> bool:
    return bool(value)


def _human_review_clear(required: bool, status: str) -> bool:
    return not required or status == "approved"


def evaluate_notification_alert(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    source = dict(payload or {})
    request = _request(source)
    notification_review_id = _clean_str(request.get("notification_review_id"))
    alert_name = _clean_str(request.get("alert_name"))
    raw_trigger_type = _clean_str(request.get("trigger_type"))
    trigger_type = _canonical(raw_trigger_type)
    raw_severity = _clean_str(request.get("severity"))
    severity = _canonical(raw_severity)
    raw_recipient_scope = _clean_str(request.get("recipient_scope"))
    recipient_scope = _canonical(raw_recipient_scope)
    raw_delivery_channel = _clean_str(request.get("delivery_channel"))
    delivery_channel = _canonical(raw_delivery_channel)
    source_layer = _clean_str(request.get("source_layer"))
    subject_id = _clean_str(request.get("subject_id"))
    policy_ref = _clean_str(request.get("policy_ref"))
    audit_ref = _clean_str(request.get("audit_ref"))
    security_privacy_ref = _clean_str(request.get("security_privacy_ref"))
    ownership_ip_ref = _clean_str(request.get("ownership_ip_ref"))
    event_webhook_ref = _clean_str(request.get("event_webhook_ref"))
    human_review_required = bool(request.get("human_review_required", True))
    human_review_status = _canonical(request.get("human_review_status"))
    metadata = _dict(request.get("metadata"))
    warnings: list[str] = []
    blockers: list[str] = []

    if not notification_review_id:
        blockers.append("missing_notification_review_id")
    if not raw_trigger_type:
        blockers.append("missing_trigger_type")
    elif trigger_type not in TRIGGER_TYPES or trigger_type == "unknown":
        warnings.append("unknown_trigger_type")
        trigger_type = "unknown"
    if not raw_severity:
        warnings.append("missing_severity")
    elif severity not in SEVERITIES or severity == "unknown":
        warnings.append("unknown_severity")
        severity = "unknown"
    if not raw_recipient_scope:
        blockers.append("missing_recipient_scope")
    elif recipient_scope not in RECIPIENT_SCOPES or recipient_scope == "unknown":
        warnings.append("unknown_recipient_scope")
        recipient_scope = "unknown"
    if not raw_delivery_channel:
        warnings.append("missing_delivery_channel")
    elif delivery_channel not in DELIVERY_CHANNELS or delivery_channel == "unknown":
        warnings.append("unknown_delivery_channel")
        delivery_channel = "unknown"
    if not alert_name:
        warnings.append("missing_alert_name")
    if not source_layer:
        warnings.append("missing_source_layer")
    if not subject_id:
        warnings.append("missing_subject_id")

    external_scope = recipient_scope in EXTERNAL_RECIPIENT_SCOPES
    external_channel = delivery_channel in EXTERNAL_DELIVERY_CHANNELS
    if recipient_scope == "public" and not metadata.get("public_approval_context"):
        blockers.append("public_recipient_requires_public_approval_context")
    if external_scope:
        if not policy_ref:
            blockers.append("missing_policy_ref")
        if not security_privacy_ref:
            blockers.append("missing_security_privacy_ref")
        if not ownership_ip_ref:
            blockers.append("missing_ownership_ip_ref")
        if human_review_status != "approved":
            blockers.append("human_review_required")
    if trigger_type in AUDIT_REQUIRED_TRIGGERS and not audit_ref:
        blockers.append("missing_audit_ref")
    if trigger_type in POLICY_REQUIRED_TRIGGERS and not policy_ref:
        blockers.append("missing_policy_ref")
    if delivery_channel == "webhook" and not event_webhook_ref:
        blockers.append("missing_event_webhook_ref")
    if human_review_required and external_scope and human_review_status != "approved":
        blockers.append("human_review_required")
    if external_channel:
        warnings.append("external_delivery_channel_not_sent_in_v1")

    policy_clear = _ref_clear(policy_ref)
    audit_trace_clear = _ref_clear(audit_ref)
    security_privacy_clear = _ref_clear(security_privacy_ref)
    ownership_ip_clear = _ref_clear(ownership_ip_ref)
    event_webhook_clear = _ref_clear(event_webhook_ref)
    human_review_clear = _human_review_clear(human_review_required and external_scope, human_review_status)
    trigger_known = trigger_type in TRIGGER_TYPES and trigger_type != "unknown"
    severity_known = severity in SEVERITIES and severity != "unknown"
    recipient_known = recipient_scope in RECIPIENT_SCOPES and recipient_scope != "unknown"
    delivery_known = delivery_channel in DELIVERY_CHANNELS and delivery_channel != "unknown"
    internal_ready_context = bool(
        trigger_type in INTERNAL_READY_TRIGGERS
        and recipient_scope in {"internal_admin", "internal_ops"}
        and audit_trace_clear
        and source_layer
    )
    external_ready_context = bool(
        external_scope
        and policy_clear
        and audit_trace_clear
        and security_privacy_clear
        and ownership_ip_clear
        and human_review_status == "approved"
        and (recipient_scope != "public" or bool(metadata.get("public_approval_context")))
    )
    ready_context = bool(
        trigger_known
        and severity_known
        and recipient_known
        and delivery_known
        and (internal_ready_context or external_ready_context or (not external_scope and audit_trace_clear and source_layer))
        and (delivery_channel != "webhook" or event_webhook_clear)
    )

    if blockers:
        notification_status = "blocked"
    elif warnings and not ready_context:
        notification_status = "needs_review"
    else:
        notification_status = "notification_ready"

    notification_ready = notification_status == "notification_ready"
    if blockers:
        recommended_action = "resolve_notification_alert_blockers"
    elif warnings and not notification_ready:
        recommended_action = "review_notification_alert_context"
    else:
        recommended_action = "prepare_notification_candidate_without_sending"

    result = {
        "notification_result_id": _notification_result_id(
            {
                "notification_review_id": notification_review_id,
                "trigger_type": trigger_type,
                "severity": severity,
                "recipient_scope": recipient_scope,
                "delivery_channel": delivery_channel,
                "subject_id": subject_id,
            }
        ),
        "notification_review_id": notification_review_id,
        "alert_name": alert_name,
        "trigger_type": trigger_type,
        "severity": severity,
        "recipient_scope": recipient_scope,
        "delivery_channel": delivery_channel,
        "source_layer": source_layer,
        "subject_id": subject_id,
        "notification_status": notification_status,
        "policy_clear": policy_clear,
        "audit_trace_clear": audit_trace_clear,
        "security_privacy_clear": security_privacy_clear,
        "ownership_ip_clear": ownership_ip_clear,
        "event_webhook_clear": event_webhook_clear,
        "human_review_clear": human_review_clear,
        "warnings": sorted(set(warnings)),
        "blockers": sorted(set(blockers)),
        "recommended_action": recommended_action,
        "notification_ready": notification_ready,
        "notification_sent": False,
        "external_call_made": False,
        "webhook_sent": False,
        "email_sent": False,
        "sms_sent": False,
        "message_sent": False,
        "production_record_written": False,
        "truth_verified": False,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
        "policy_ref": policy_ref,
        "audit_ref": audit_ref,
        "security_privacy_ref": security_privacy_ref,
        "ownership_ip_ref": ownership_ip_ref,
        "event_webhook_ref": event_webhook_ref,
        "human_review_required": human_review_required,
        "human_review_status": human_review_status,
        "metadata": metadata,
    }
    return {
        "ok": True,
        "layer": "notification_alert",
        "notification_alert": result,
        "warnings": result["warnings"],
        "blockers": result["blockers"],
        "notification_ready": notification_ready,
        "notification_sent": False,
        "external_call_made": False,
        "webhook_sent": False,
        "email_sent": False,
        "sms_sent": False,
        "message_sent": False,
        "production_record_written": False,
        "truth_verified": False,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
    }


def batch_evaluate_notification_alert(records: Any) -> Dict[str, Any]:
    items = records if isinstance(records, list) else []
    evaluations = [evaluate_notification_alert(item if isinstance(item, dict) else {}) for item in items]
    notifications = [item["notification_alert"] for item in evaluations]
    trigger_type_counts: Dict[str, int] = {}
    severity_counts: Dict[str, int] = {}
    recipient_scope_counts: Dict[str, int] = {}
    delivery_channel_counts: Dict[str, int] = {}
    for item in notifications:
        trigger_type_counts[item["trigger_type"]] = trigger_type_counts.get(item["trigger_type"], 0) + 1
        severity_counts[item["severity"]] = severity_counts.get(item["severity"], 0) + 1
        recipient_scope_counts[item["recipient_scope"]] = recipient_scope_counts.get(item["recipient_scope"], 0) + 1
        delivery_channel_counts[item["delivery_channel"]] = delivery_channel_counts.get(item["delivery_channel"], 0) + 1
    return {
        "ok": True,
        "layer": "notification_alert",
        "total_reviews": len(notifications),
        "blocked": sum(1 for item in notifications if item["notification_status"] == "blocked"),
        "needs_review": sum(1 for item in notifications if item["notification_status"] == "needs_review"),
        "notification_ready": sum(1 for item in notifications if item["notification_ready"]),
        "notification_sent_count": 0,
        "external_call_made_count": 0,
        "webhook_sent_count": 0,
        "email_sent_count": 0,
        "sms_sent_count": 0,
        "message_sent_count": 0,
        "production_record_written_count": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "trigger_type_counts": trigger_type_counts,
        "severity_counts": severity_counts,
        "recipient_scope_counts": recipient_scope_counts,
        "delivery_channel_counts": delivery_channel_counts,
        "evaluations": evaluations,
    }


def notification_alert_schema() -> Dict[str, Any]:
    return {
        "ok": True,
        "layer": "notification_alert",
        "trigger_types": list(TRIGGER_TYPES),
        "severities": list(SEVERITIES),
        "recipient_scopes": list(RECIPIENT_SCOPES),
        "delivery_channels": list(DELIVERY_CHANNELS),
        "notification_statuses": ["blocked", "needs_review", "notification_ready"],
        "result_fields": [
            "notification_result_id",
            "notification_review_id",
            "alert_name",
            "trigger_type",
            "severity",
            "recipient_scope",
            "delivery_channel",
            "notification_status",
            "policy_clear",
            "audit_trace_clear",
            "security_privacy_clear",
            "ownership_ip_clear",
            "event_webhook_clear",
            "human_review_clear",
            "warnings",
            "blockers",
            "recommended_action",
            "notification_ready",
            "notification_sent",
            "external_call_made",
            "webhook_sent",
            "email_sent",
            "sms_sent",
            "message_sent",
            "production_record_written",
            "truth_verified",
            "public_approved",
            "mutated_public_data",
            "published_report",
        ],
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def _sample_evaluations() -> Dict[str, Any]:
    return batch_evaluate_notification_alert(
        [
            {
                "notification_alert": {
                    "notification_review_id": "notification_watchtower_001",
                    "alert_name": "Watchtower Observation",
                    "trigger_type": "watchtower_observation",
                    "severity": "medium",
                    "recipient_scope": "internal_admin",
                    "delivery_channel": "in_app",
                    "source_layer": "watchtower",
                    "subject_id": "watchtower-001",
                    "audit_ref": "audit-001",
                    "human_review_required": False,
                }
            },
            {
                "notification_alert": {
                    "notification_review_id": "notification_client_001",
                    "alert_name": "Client Readiness Notice",
                    "trigger_type": "readiness_blocker",
                    "severity": "high",
                    "recipient_scope": "client",
                    "delivery_channel": "email",
                    "source_layer": "readiness_gate",
                    "subject_id": "client-001",
                    "policy_ref": "policy-001",
                    "audit_ref": "audit-002",
                    "security_privacy_ref": "security-001",
                    "ownership_ip_ref": "ownership-001",
                    "human_review_required": True,
                    "human_review_status": "approved",
                }
            },
            {
                "notification_alert": {
                    "notification_review_id": "",
                    "trigger_type": "",
                    "severity": "unknown",
                    "recipient_scope": "",
                    "delivery_channel": "unknown",
                }
            },
        ]
    )


def notification_alert_summary() -> Dict[str, Any]:
    sample = _sample_evaluations()
    return {
        "policy_status": "formalized_v1",
        "total_reviews": sample["total_reviews"],
        "blocked": sample["blocked"],
        "needs_review": sample["needs_review"],
        "notification_ready": sample["notification_ready"],
        "notification_sent_count": 0,
        "external_call_made_count": 0,
        "webhook_sent_count": 0,
        "email_sent_count": 0,
        "sms_sent_count": 0,
        "message_sent_count": 0,
        "production_record_written_count": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "trigger_type_counts": sample["trigger_type_counts"],
        "severity_counts": sample["severity_counts"],
        "recipient_scope_counts": sample["recipient_scope_counts"],
        "delivery_channel_counts": sample["delivery_channel_counts"],
        "sends_notifications": False,
        "calls_external_systems": False,
        "sends_webhooks": False,
        "sends_email": False,
        "sends_sms": False,
        "sends_messages": False,
        "writes_production_records": False,
        "verifies_truth": False,
        "approves_public_data": False,
        "mutates_shf_impact_data": False,
        "publishes_reports": False,
        "replaces_event_webhook": False,
        "replaces_production_automation": False,
        "replaces_policy_engine": False,
        "replaces_watchtower": False,
        "replaces_reports": False,
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def notification_alert_readiness() -> Dict[str, Any]:
    summary = notification_alert_summary()
    return {
        "ok": True,
        "layer": "notification_alert",
        "blocked": summary["blocked"],
        "needs_review": summary["needs_review"],
        "notification_ready": summary["notification_ready"],
        "notification_sent_count": 0,
        "external_call_made_count": 0,
        "webhook_sent_count": 0,
        "email_sent_count": 0,
        "sms_sent_count": 0,
        "message_sent_count": 0,
        "production_record_written_count": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "sends_notifications": False,
        "calls_external_systems": False,
    }


def notification_alert_health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "notification_alert",
        "status": "formalized_v1",
        "summary": notification_alert_summary(),
    }
