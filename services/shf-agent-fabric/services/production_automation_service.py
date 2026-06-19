from __future__ import annotations

import hashlib
import json
from typing import Any, Dict


TRIGGER_TYPES = [
    "manual",
    "event",
    "webhook",
    "schedule",
    "batch_complete",
    "warehouse_ready",
    "approval_ready",
    "watchtower_observation",
    "unknown",
]

REQUESTED_ACTIONS = [
    "sync",
    "notify",
    "generate_report",
    "route_event",
    "advance_workflow",
    "publish_candidate",
    "maintenance_task",
    "unknown",
]

POLICY_REQUIRED_ACTIONS = {"sync", "generate_report", "route_event", "advance_workflow", "publish_candidate"}
READINESS_REQUIRED_ACTIONS = {"sync", "generate_report", "advance_workflow", "publish_candidate"}
SECURITY_REQUIRED_ACTIONS = {"sync", "notify", "generate_report", "route_event", "publish_candidate"}
OWNERSHIP_REQUIRED_ACTIONS = {"sync", "generate_report", "publish_candidate", "client_reporting", "reuse"}
AUDIT_BLOCKING_ACTIONS = {"sync", "generate_report", "advance_workflow", "publish_candidate"}
CLEAR_STATUSES = {"clear", "passed", "approved", "ready", "present"}

BOUNDARY_WARNINGS = [
    "Production Automation Layer classifies automation readiness only.",
    "Production Automation Layer does not execute automation, call external systems, send webhooks, send notifications, write production records, verify truth, approve public data, mutate SHF Impact Data Spine, publish reports, replace Event / Webhook, replace Notification / Alert, replace Policy Engine, replace Readiness Gate, or replace Audit & Verification.",
]


def _clean_str(value: Any) -> str:
    return str(value or "").strip()


def _canonical(value: Any) -> str:
    return _clean_str(value).lower().replace("-", "_").replace(" ", "_")


def _request(payload: Dict[str, Any]) -> Dict[str, Any]:
    request = payload.get("production_automation") if isinstance(payload.get("production_automation"), dict) else payload
    return dict(request or {})


def _dict(value: Any) -> Dict[str, Any]:
    return dict(value) if isinstance(value, dict) else {}


def _canonical_json(value: Dict[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _automation_result_id(payload: Dict[str, Any]) -> str:
    digest = hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()[:16]
    return f"production_automation_{digest}"


def _ref_clear(value: str) -> bool:
    return bool(value)


def _human_approval_clear(required: bool, status: str) -> bool:
    return not required or status == "approved"


def evaluate_production_automation(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    source = dict(payload or {})
    request = _request(source)
    automation_review_id = _clean_str(request.get("automation_review_id"))
    automation_name = _clean_str(request.get("automation_name"))
    raw_trigger_type = _clean_str(request.get("trigger_type"))
    trigger_type = _canonical(raw_trigger_type)
    raw_requested_action = _clean_str(request.get("requested_action"))
    requested_action = _canonical(raw_requested_action)
    source_layer = _clean_str(request.get("source_layer"))
    target_layer = _clean_str(request.get("target_layer"))
    subject_id = _clean_str(request.get("subject_id"))
    policy_ref = _clean_str(request.get("policy_ref"))
    readiness_gate_ref = _clean_str(request.get("readiness_gate_ref"))
    audit_ref = _clean_str(request.get("audit_ref"))
    security_privacy_ref = _clean_str(request.get("security_privacy_ref"))
    ownership_ip_ref = _clean_str(request.get("ownership_ip_ref"))
    human_approval_required = bool(request.get("human_approval_required", True))
    human_approval_status = _canonical(request.get("human_approval_status"))
    metadata = _dict(request.get("metadata"))
    warnings: list[str] = []
    blockers: list[str] = []

    if not automation_review_id:
        blockers.append("missing_automation_review_id")
    if not automation_name:
        warnings.append("missing_automation_name")
    if not raw_trigger_type:
        blockers.append("missing_trigger_type")
    elif trigger_type not in TRIGGER_TYPES or trigger_type == "unknown":
        warnings.append("unknown_trigger_type")
        trigger_type = "unknown"
    if not raw_requested_action:
        blockers.append("missing_requested_action")
    elif requested_action not in REQUESTED_ACTIONS or requested_action == "unknown":
        warnings.append("unknown_requested_action")
        requested_action = "unknown"
    if not source_layer:
        blockers.append("missing_source_layer")
    if not target_layer:
        warnings.append("missing_target_layer")
    if not subject_id:
        warnings.append("missing_subject_id")

    if requested_action in POLICY_REQUIRED_ACTIONS and not policy_ref:
        blockers.append("missing_policy_ref")
    if requested_action in READINESS_REQUIRED_ACTIONS and not readiness_gate_ref:
        blockers.append("missing_readiness_gate_ref")
    if not audit_ref:
        if requested_action in AUDIT_BLOCKING_ACTIONS:
            blockers.append("missing_audit_ref")
        else:
            warnings.append("missing_audit_ref")
    if requested_action in SECURITY_REQUIRED_ACTIONS and not security_privacy_ref:
        blockers.append("missing_security_privacy_ref")
    if requested_action in OWNERSHIP_REQUIRED_ACTIONS and not ownership_ip_ref:
        blockers.append("missing_ownership_ip_ref")
    if human_approval_required and human_approval_status != "approved":
        blockers.append("human_approval_required")
    if requested_action == "publish_candidate":
        blockers.append("publish_candidate_execution_blocked_in_v1")

    policy_clear = _ref_clear(policy_ref)
    readiness_gate_clear = _ref_clear(readiness_gate_ref)
    audit_trace_clear = _ref_clear(audit_ref)
    security_privacy_clear = _ref_clear(security_privacy_ref)
    ownership_ip_clear = _ref_clear(ownership_ip_ref)
    human_approval_clear = _human_approval_clear(human_approval_required, human_approval_status)
    action_known = requested_action in REQUESTED_ACTIONS and requested_action != "unknown"
    trigger_known = trigger_type in TRIGGER_TYPES and trigger_type != "unknown"
    ready_context = bool(
        action_known
        and trigger_known
        and source_layer
        and policy_clear
        and audit_trace_clear
        and human_approval_clear
        and (requested_action not in READINESS_REQUIRED_ACTIONS or readiness_gate_clear)
        and (requested_action not in SECURITY_REQUIRED_ACTIONS or security_privacy_clear)
        and (requested_action not in OWNERSHIP_REQUIRED_ACTIONS or ownership_ip_clear)
        and requested_action != "publish_candidate"
    )

    if blockers:
        automation_status = "blocked"
    elif warnings and not ready_context:
        automation_status = "needs_review"
    else:
        automation_status = "automation_ready"

    automation_ready = automation_status == "automation_ready"
    if blockers:
        recommended_action = "resolve_production_automation_blockers"
    elif warnings and not automation_ready:
        recommended_action = "review_production_automation_context"
    else:
        recommended_action = f"ready_for_future_{requested_action}_automation"

    result = {
        "automation_result_id": _automation_result_id(
            {
                "automation_review_id": automation_review_id,
                "trigger_type": trigger_type,
                "requested_action": requested_action,
                "source_layer": source_layer,
                "target_layer": target_layer,
                "subject_id": subject_id,
            }
        ),
        "automation_review_id": automation_review_id,
        "automation_name": automation_name,
        "trigger_type": trigger_type,
        "requested_action": requested_action,
        "source_layer": source_layer,
        "target_layer": target_layer,
        "subject_id": subject_id,
        "automation_status": automation_status,
        "policy_clear": policy_clear,
        "readiness_gate_clear": readiness_gate_clear,
        "audit_trace_clear": audit_trace_clear,
        "security_privacy_clear": security_privacy_clear,
        "ownership_ip_clear": ownership_ip_clear,
        "human_approval_clear": human_approval_clear,
        "warnings": sorted(set(warnings)),
        "blockers": sorted(set(blockers)),
        "recommended_action": recommended_action,
        "automation_ready": automation_ready,
        "automation_executed": False,
        "external_call_made": False,
        "webhook_sent": False,
        "notification_sent": False,
        "production_record_written": False,
        "truth_verified": False,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
        "policy_ref": policy_ref,
        "readiness_gate_ref": readiness_gate_ref,
        "audit_ref": audit_ref,
        "security_privacy_ref": security_privacy_ref,
        "ownership_ip_ref": ownership_ip_ref,
        "human_approval_required": human_approval_required,
        "human_approval_status": human_approval_status,
        "metadata": metadata,
    }
    return {
        "ok": True,
        "layer": "production_automation",
        "production_automation": result,
        "warnings": result["warnings"],
        "blockers": result["blockers"],
        "automation_ready": automation_ready,
        "automation_executed": False,
        "external_call_made": False,
        "webhook_sent": False,
        "notification_sent": False,
        "production_record_written": False,
        "truth_verified": False,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
    }


def batch_evaluate_production_automation(records: Any) -> Dict[str, Any]:
    items = records if isinstance(records, list) else []
    evaluations = [evaluate_production_automation(item if isinstance(item, dict) else {}) for item in items]
    automation_results = [item["production_automation"] for item in evaluations]
    trigger_type_counts: Dict[str, int] = {}
    requested_action_counts: Dict[str, int] = {}
    for item in automation_results:
        trigger_type_counts[item["trigger_type"]] = trigger_type_counts.get(item["trigger_type"], 0) + 1
        requested_action_counts[item["requested_action"]] = requested_action_counts.get(item["requested_action"], 0) + 1
    return {
        "ok": True,
        "layer": "production_automation",
        "total_reviews": len(automation_results),
        "blocked": sum(1 for item in automation_results if item["automation_status"] == "blocked"),
        "needs_review": sum(1 for item in automation_results if item["automation_status"] == "needs_review"),
        "automation_ready": sum(1 for item in automation_results if item["automation_ready"]),
        "automation_executed_count": 0,
        "external_call_made_count": 0,
        "webhook_sent_count": 0,
        "notification_sent_count": 0,
        "production_record_written_count": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "trigger_type_counts": trigger_type_counts,
        "requested_action_counts": requested_action_counts,
        "evaluations": evaluations,
    }


def production_automation_schema() -> Dict[str, Any]:
    return {
        "ok": True,
        "layer": "production_automation",
        "trigger_types": list(TRIGGER_TYPES),
        "requested_actions": list(REQUESTED_ACTIONS),
        "automation_statuses": ["blocked", "needs_review", "automation_ready"],
        "result_fields": [
            "automation_result_id",
            "automation_review_id",
            "automation_name",
            "trigger_type",
            "requested_action",
            "source_layer",
            "target_layer",
            "automation_status",
            "policy_clear",
            "readiness_gate_clear",
            "audit_trace_clear",
            "security_privacy_clear",
            "ownership_ip_clear",
            "human_approval_clear",
            "warnings",
            "blockers",
            "recommended_action",
            "automation_ready",
            "automation_executed",
            "external_call_made",
            "webhook_sent",
            "notification_sent",
            "production_record_written",
            "truth_verified",
            "public_approved",
            "mutated_public_data",
            "published_report",
        ],
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def _sample_evaluations() -> Dict[str, Any]:
    return batch_evaluate_production_automation(
        [
            {
                "production_automation": {
                    "automation_review_id": "automation_notify_001",
                    "automation_name": "Notify Reviewers",
                    "trigger_type": "event",
                    "requested_action": "notify",
                    "source_layer": "watchtower",
                    "target_layer": "notification_alert",
                    "subject_id": "watchtower-001",
                    "policy_ref": "policy-001",
                    "audit_ref": "audit-001",
                    "security_privacy_ref": "security-001",
                    "human_approval_required": False,
                }
            },
            {
                "production_automation": {
                    "automation_review_id": "automation_sync_001",
                    "automation_name": "Sync Warehouse Candidate",
                    "trigger_type": "warehouse_ready",
                    "requested_action": "sync",
                    "source_layer": "warehouse_sync",
                    "target_layer": "analytics",
                    "subject_id": "sync-001",
                    "policy_ref": "policy-002",
                    "readiness_gate_ref": "readiness-002",
                    "audit_ref": "audit-002",
                    "security_privacy_ref": "security-002",
                    "ownership_ip_ref": "ownership-002",
                    "human_approval_required": False,
                }
            },
            {
                "production_automation": {
                    "automation_review_id": "",
                    "trigger_type": "unknown",
                    "requested_action": "unknown",
                    "source_layer": "",
                    "human_approval_required": True,
                    "human_approval_status": "",
                }
            },
        ]
    )


def production_automation_summary() -> Dict[str, Any]:
    sample = _sample_evaluations()
    return {
        "policy_status": "formalized_v1",
        "total_reviews": sample["total_reviews"],
        "blocked": sample["blocked"],
        "needs_review": sample["needs_review"],
        "automation_ready": sample["automation_ready"],
        "automation_executed_count": 0,
        "external_call_made_count": 0,
        "webhook_sent_count": 0,
        "notification_sent_count": 0,
        "production_record_written_count": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "trigger_type_counts": sample["trigger_type_counts"],
        "requested_action_counts": sample["requested_action_counts"],
        "executes_automation": False,
        "calls_external_systems": False,
        "sends_webhooks": False,
        "sends_notifications": False,
        "writes_production_records": False,
        "verifies_truth": False,
        "approves_public_data": False,
        "mutates_shf_impact_data": False,
        "publishes_reports": False,
        "replaces_event_webhook": False,
        "replaces_notification_alert": False,
        "replaces_policy_engine": False,
        "replaces_readiness_gate": False,
        "replaces_audit_verification": False,
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def production_automation_readiness() -> Dict[str, Any]:
    summary = production_automation_summary()
    return {
        "ok": True,
        "layer": "production_automation",
        "blocked": summary["blocked"],
        "needs_review": summary["needs_review"],
        "automation_ready": summary["automation_ready"],
        "automation_executed_count": 0,
        "external_call_made_count": 0,
        "webhook_sent_count": 0,
        "notification_sent_count": 0,
        "production_record_written_count": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "executes_automation": False,
        "calls_external_systems": False,
    }


def production_automation_health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "production_automation",
        "status": "formalized_v1",
        "summary": production_automation_summary(),
    }
