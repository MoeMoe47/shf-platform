from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Body

from fabric.watchtower.aggregator import build_watchtower_summary, build_watchtower_program_rows
from fabric.watchtower.store import set_quarantine, clear_quarantine, get_quarantine_map, get_risk_history
from services.adapter_layer_service import adapter_layer_summary
from services.api_gateway_service import api_gateway_summary
from services.audit_verification_service import audit_verification_summary
from services.ai_guardrails_service import ai_guardrails_summary
from services.batch_import_service import batch_import_summary
from services.data_approval_service import data_approval_summary
from services.data_aggregator_service import data_aggregator_summary
from services.data_federation_service import data_federation_summary
from services.data_normalization_service import data_normalization_summary
from services.data_ownership_ip_service import data_ownership_ip_summary
from services.data_verification_service import data_verification_summary
from services.evidence_package_service import evidence_package_summary
from services.event_webhook_service import event_webhook_summary
from services.game_theory_service import game_theory_summary
from services.oracle_service import oracle_summary
from services.policy_engine_service import policy_engine_summary
from services.public_approval_service import public_approval_summary
from services.readiness_gate_service import readiness_gate_summary
from services.security_privacy_service import security_privacy_summary
from services.source_registry_service import source_registry_summary
from services.truth_spine_service import truth_summary


router = APIRouter(prefix="/watchtower", tags=["watchtower"])

@router.get("/summary")
def watchtower_summary(days: int = 30, baseline_weeks: int = 8, top_n: int = 10) -> Dict[str, Any]:
    summary = build_watchtower_summary(days=int(days), baseline_weeks=int(baseline_weeks), top_n=int(top_n))
    truth = truth_summary()
    oracle = oracle_summary()
    source_registry = source_registry_summary()
    data_federation = data_federation_summary()
    ai_guardrails = ai_guardrails_summary()
    game_theory = game_theory_summary()
    data_aggregator = data_aggregator_summary()
    data_normalization = data_normalization_summary()
    evidence_package = evidence_package_summary()
    data_verification = data_verification_summary()
    data_approval = data_approval_summary()
    audit_verification = audit_verification_summary()
    readiness_gate = readiness_gate_summary()
    public_approval = public_approval_summary()
    security_privacy = security_privacy_summary()
    data_ownership_ip = data_ownership_ip_summary()
    policy_engine = policy_engine_summary()
    event_webhook = event_webhook_summary()
    api_gateway = api_gateway_summary()
    adapter_layer = adapter_layer_summary()
    batch_import = batch_import_summary()
    if isinstance(summary, dict):
        summary["truth_coverage"] = {
            "coverage_percent": truth["coverage_percent"],
            "claim_count": truth["claim_count"],
            "report_ready_count": truth["report_ready_count"],
            "missing_source_count": truth["missing_source_count"],
            "low_trace_coverage_count": truth["low_trace_coverage_count"],
            "flag": truth["coverage_percent"] < 80,
            "status": "watch" if truth["coverage_percent"] < 80 else "covered",
        }
        summary["source_registry"] = {
            "policy_status": source_registry["policy_status"],
            "known_sources": source_registry["known_sources"],
            "unknown_sources": source_registry["unknown_sources"],
            "blocked_sources": source_registry["blocked_sources"],
            "eligible_for_aggregator": source_registry["eligible_for_aggregator"],
            "eligible_for_evidence_package": source_registry["eligible_for_evidence_package"],
            "eligible_for_truth_spine": source_registry["eligible_for_truth_spine"],
            "eligible_for_public_approval_consideration": source_registry["eligible_for_public_approval_consideration"],
            "truth_verified_count": source_registry["truth_verified_count"],
            "public_approved_count": source_registry["public_approved_count"],
            "verifies_truth": source_registry["verifies_truth"],
            "flag": source_registry["blocked_sources"] > 0 or source_registry["unknown_sources"] > 0,
            "status": "watch"
            if source_registry["blocked_sources"] > 0 or source_registry["unknown_sources"] > 0
            else "ready",
        }
        summary["data_federation"] = {
            "policy_status": data_federation["policy_status"],
            "blocked": data_federation["blocked"],
            "needs_review": data_federation["needs_review"],
            "aggregator_ready": data_federation["aggregator_ready"],
            "truth_spine_ready": data_federation["truth_spine_ready"],
            "public_approval_ready": data_federation["public_approval_ready"],
            "truth_verified_count": data_federation["truth_verified_count"],
            "public_approved_count": data_federation["public_approved_count"],
            "verifies_truth": data_federation["verifies_truth"],
            "flag": data_federation["blocked"] > 0 or data_federation["needs_review"] > 0,
            "status": "watch" if data_federation["blocked"] > 0 or data_federation["needs_review"] > 0 else "ready",
        }
        summary["data_aggregator"] = {
            "policy_status": data_aggregator["policy_status"],
            "pending_intake": data_aggregator["pending_intake"],
            "missing_provenance": data_aggregator["missing_provenance"],
            "blocked_from_truth_spine": data_aggregator["blocked_from_truth_spine"],
            "ready_for_normalization": data_aggregator["ready_for_normalization"],
            "ready_for_evidence_package": data_aggregator["ready_for_evidence_package"],
            "flag": data_aggregator["missing_provenance"] > 0 or data_aggregator["blocked_from_truth_spine"] > 0,
            "status": "watch" if data_aggregator["missing_provenance"] > 0 or data_aggregator["blocked_from_truth_spine"] > 0 else "ready",
        }
        summary["data_normalization"] = {
            "policy_status": data_normalization["policy_status"],
            "sample_readiness": data_normalization["sample_readiness"],
            "ready_for_public_approval": data_normalization["ready_for_public_approval"],
            "verifies_truth": data_normalization["verifies_truth"],
            "approves_public_data": data_normalization["approves_public_data"],
            "flag": data_normalization["sample_readiness"]["blocked"] > 0,
            "status": "watch" if data_normalization["sample_readiness"]["blocked"] > 0 else "ready",
        }
        summary["evidence_package"] = {
            "policy_status": evidence_package["policy_status"],
            "complete_packages": evidence_package["complete_packages"],
            "incomplete_packages": evidence_package["incomplete_packages"],
            "missing_provenance": evidence_package["missing_provenance"],
            "missing_sources": evidence_package["missing_sources"],
            "truth_spine_ready": evidence_package["truth_spine_ready"],
            "public_approval_ready": evidence_package["public_approval_ready"],
            "verifies_truth": evidence_package["verifies_truth"],
            "flag": evidence_package["incomplete_packages"] > 0,
            "status": "watch" if evidence_package["incomplete_packages"] > 0 else "ready",
        }
        summary["data_verification"] = {
            "policy_status": data_verification["policy_status"],
            "blocked": data_verification["blocked"],
            "needs_review": data_verification["needs_review"],
            "ready_for_truth_spine": data_verification["ready_for_truth_spine"],
            "truth_verified_count": data_verification["truth_verified_count"],
            "public_approval_ready": data_verification["public_approval_ready"],
            "verifies_truth": data_verification["verifies_truth"],
            "flag": data_verification["blocked"] > 0 or data_verification["needs_review"] > 0,
            "status": "watch" if data_verification["blocked"] > 0 or data_verification["needs_review"] > 0 else "ready",
        }
        summary["data_approval"] = {
            "policy_status": data_approval["policy_status"],
            "blocked": data_approval["blocked"],
            "needs_review": data_approval["needs_review"],
            "gateway_ready": data_approval["gateway_ready"],
            "public_ready_candidates": data_approval["public_ready_candidates"],
            "public_approved_count": data_approval["public_approved_count"],
            "mutated_public_data_count": data_approval["mutated_public_data_count"],
            "approves_public_data": data_approval["approves_public_data"],
            "requires_gateway_review": data_approval["requires_gateway_review"],
            "flag": data_approval["blocked"] > 0 or data_approval["needs_review"] > 0,
            "status": "watch" if data_approval["blocked"] > 0 or data_approval["needs_review"] > 0 else "ready",
        }
        summary["audit_verification"] = {
            "policy_status": audit_verification["policy_status"],
            "blocked": audit_verification["blocked"],
            "needs_review": audit_verification["needs_review"],
            "audit_ready": audit_verification["audit_ready"],
            "trace_ready": audit_verification["trace_ready"],
            "replay_ready": audit_verification["replay_ready"],
            "truth_verified_count": audit_verification["truth_verified_count"],
            "public_approved_count": audit_verification["public_approved_count"],
            "verifies_truth": audit_verification["verifies_truth"],
            "flag": audit_verification["blocked"] > 0 or audit_verification["needs_review"] > 0,
            "status": "watch"
            if audit_verification["blocked"] > 0 or audit_verification["needs_review"] > 0
            else "ready",
        }
        summary["readiness_gate"] = {
            "policy_status": readiness_gate["policy_status"],
            "blocked": readiness_gate["blocked"],
            "needs_review": readiness_gate["needs_review"],
            "ready": readiness_gate["ready"],
            "can_move_forward_count": readiness_gate["can_move_forward_count"],
            "truth_verified_count": readiness_gate["truth_verified_count"],
            "public_approved_count": readiness_gate["public_approved_count"],
            "mutated_public_data_count": readiness_gate["mutated_public_data_count"],
            "verifies_truth": readiness_gate["verifies_truth"],
            "flag": readiness_gate["blocked"] > 0 or readiness_gate["needs_review"] > 0,
            "status": "watch"
            if readiness_gate["blocked"] > 0 or readiness_gate["needs_review"] > 0
            else "ready",
        }
        summary["public_approval"] = {
            "policy_status": public_approval["policy_status"],
            "blocked": public_approval["blocked"],
            "needs_review": public_approval["needs_review"],
            "public_ready_candidates": public_approval["public_ready_candidates"],
            "public_approved_count": public_approval["public_approved_count"],
            "mutated_public_data_count": public_approval["mutated_public_data_count"],
            "published_report_count": public_approval["published_report_count"],
            "approves_public_data": public_approval["approves_public_data"],
            "publishes_reports": public_approval["publishes_reports"],
            "flag": public_approval["blocked"] > 0 or public_approval["needs_review"] > 0,
            "status": "watch"
            if public_approval["blocked"] > 0 or public_approval["needs_review"] > 0
            else "ready",
        }
        summary["security_privacy"] = {
            "policy_status": security_privacy["policy_status"],
            "blocked": security_privacy["blocked"],
            "needs_review": security_privacy["needs_review"],
            "public_safe_candidates": security_privacy["public_safe_candidates"],
            "pii_detected_count": security_privacy["pii_detected_count"],
            "sensitive_data_detected_count": security_privacy["sensitive_data_detected_count"],
            "secret_detected_count": security_privacy["secret_detected_count"],
            "public_approved_count": security_privacy["public_approved_count"],
            "mutated_public_data_count": security_privacy["mutated_public_data_count"],
            "published_report_count": security_privacy["published_report_count"],
            "approves_public_data": security_privacy["approves_public_data"],
            "publishes_reports": security_privacy["publishes_reports"],
            "flag": security_privacy["blocked"] > 0 or security_privacy["needs_review"] > 0,
            "status": "watch"
            if security_privacy["blocked"] > 0 or security_privacy["needs_review"] > 0
            else "ready",
        }
        summary["data_ownership_ip"] = {
            "policy_status": data_ownership_ip["policy_status"],
            "blocked": data_ownership_ip["blocked"],
            "needs_review": data_ownership_ip["needs_review"],
            "ownership_clear_candidates": data_ownership_ip["ownership_clear_candidates"],
            "third_party_ip_detected_count": data_ownership_ip["third_party_ip_detected_count"],
            "consent_missing_count": data_ownership_ip["consent_missing_count"],
            "public_release_rights_count": data_ownership_ip["public_release_rights_count"],
            "public_approved_count": data_ownership_ip["public_approved_count"],
            "mutated_public_data_count": data_ownership_ip["mutated_public_data_count"],
            "published_report_count": data_ownership_ip["published_report_count"],
            "approves_public_data": data_ownership_ip["approves_public_data"],
            "publishes_reports": data_ownership_ip["publishes_reports"],
            "provides_legal_advice": data_ownership_ip["provides_legal_advice"],
            "flag": data_ownership_ip["blocked"] > 0 or data_ownership_ip["needs_review"] > 0,
            "status": "watch"
            if data_ownership_ip["blocked"] > 0 or data_ownership_ip["needs_review"] > 0
            else "ready",
        }
        summary["policy_engine"] = {
            "policy_status": policy_engine["policy_status"],
            "blocked": policy_engine["blocked"],
            "needs_review": policy_engine["needs_review"],
            "allowed": policy_engine["allowed"],
            "escalation_required_count": policy_engine["escalation_required_count"],
            "violations_count": policy_engine["violations_count"],
            "can_proceed_count": policy_engine["can_proceed_count"],
            "public_approved_count": policy_engine["public_approved_count"],
            "mutated_public_data_count": policy_engine["mutated_public_data_count"],
            "published_report_count": policy_engine["published_report_count"],
            "verifies_truth": policy_engine["verifies_truth"],
            "replaces_ai_guardrails": policy_engine["replaces_ai_guardrails"],
            "replaces_identity": policy_engine["replaces_identity"],
            "flag": policy_engine["blocked"] > 0 or policy_engine["needs_review"] > 0,
            "status": "watch" if policy_engine["blocked"] > 0 or policy_engine["needs_review"] > 0 else "ready",
        }
        summary["event_webhook"] = {
            "policy_status": event_webhook["policy_status"],
            "blocked": event_webhook["blocked"],
            "needs_review": event_webhook["needs_review"],
            "queue_ready": event_webhook["queue_ready"],
            "external_delivery_allowed_count": event_webhook["external_delivery_allowed_count"],
            "webhook_sent_count": event_webhook["webhook_sent_count"],
            "internal_targets_count": event_webhook["internal_targets_count"],
            "external_targets_count": event_webhook["external_targets_count"],
            "blocked_targets_count": event_webhook["blocked_targets_count"],
            "truth_verified_count": event_webhook["truth_verified_count"],
            "public_approved_count": event_webhook["public_approved_count"],
            "mutated_public_data_count": event_webhook["mutated_public_data_count"],
            "published_report_count": event_webhook["published_report_count"],
            "sends_external_webhooks": event_webhook["sends_external_webhooks"],
            "verifies_truth": event_webhook["verifies_truth"],
            "replaces_watchtower": event_webhook["replaces_watchtower"],
            "replaces_policy_engine": event_webhook["replaces_policy_engine"],
            "flag": event_webhook["blocked"] > 0 or event_webhook["needs_review"] > 0,
            "status": "watch" if event_webhook["blocked"] > 0 or event_webhook["needs_review"] > 0 else "ready",
        }
        summary["api_gateway"] = {
            "policy_status": api_gateway["policy_status"],
            "blocked": api_gateway["blocked"],
            "needs_review": api_gateway["needs_review"],
            "gateway_ready": api_gateway["gateway_ready"],
            "admin_protection_required_count": api_gateway["admin_protection_required_count"],
            "identity_required_count": api_gateway["identity_required_count"],
            "policy_required_count": api_gateway["policy_required_count"],
            "audit_required_count": api_gateway["audit_required_count"],
            "rate_limit_recommended_count": api_gateway["rate_limit_recommended_count"],
            "public_exposure_allowed_count": api_gateway["public_exposure_allowed_count"],
            "request_forwarded_count": api_gateway["request_forwarded_count"],
            "truth_verified_count": api_gateway["truth_verified_count"],
            "public_approved_count": api_gateway["public_approved_count"],
            "mutated_public_data_count": api_gateway["mutated_public_data_count"],
            "published_report_count": api_gateway["published_report_count"],
            "forwards_requests": api_gateway["forwards_requests"],
            "verifies_truth": api_gateway["verifies_truth"],
            "replaces_identity": api_gateway["replaces_identity"],
            "replaces_policy_engine": api_gateway["replaces_policy_engine"],
            "replaces_ai_guardrails": api_gateway["replaces_ai_guardrails"],
            "flag": api_gateway["blocked"] > 0 or api_gateway["needs_review"] > 0,
            "status": "watch" if api_gateway["blocked"] > 0 or api_gateway["needs_review"] > 0 else "ready",
        }
        summary["adapter_layer"] = {
            "policy_status": adapter_layer["policy_status"],
            "blocked": adapter_layer["blocked"],
            "needs_review": adapter_layer["needs_review"],
            "adapter_ready": adapter_layer["adapter_ready"],
            "external_call_made_count": adapter_layer["external_call_made_count"],
            "normalized_final_count": adapter_layer["normalized_final_count"],
            "truth_verified_count": adapter_layer["truth_verified_count"],
            "public_approved_count": adapter_layer["public_approved_count"],
            "mutated_public_data_count": adapter_layer["mutated_public_data_count"],
            "published_report_count": adapter_layer["published_report_count"],
            "target_layer_counts": adapter_layer["target_layer_counts"],
            "adapter_profile_counts": adapter_layer["adapter_profile_counts"],
            "calls_external_systems": adapter_layer["calls_external_systems"],
            "normalizes_final_data": adapter_layer["normalizes_final_data"],
            "replaces_source_registry": adapter_layer["replaces_source_registry"],
            "replaces_data_aggregator": adapter_layer["replaces_data_aggregator"],
            "replaces_data_normalization": adapter_layer["replaces_data_normalization"],
            "flag": adapter_layer["blocked"] > 0 or adapter_layer["needs_review"] > 0,
            "status": "watch" if adapter_layer["blocked"] > 0 or adapter_layer["needs_review"] > 0 else "ready",
        }
        summary["batch_import"] = {
            "policy_status": batch_import["policy_status"],
            "blocked": batch_import["blocked"],
            "needs_review": batch_import["needs_review"],
            "import_ready": batch_import["import_ready"],
            "total_records_seen": batch_import["total_records_seen"],
            "accepted_record_count": batch_import["accepted_record_count"],
            "quarantined_record_count": batch_import["quarantined_record_count"],
            "row_warning_count": batch_import["row_warning_count"],
            "row_blocker_count": batch_import["row_blocker_count"],
            "records_written_count": batch_import["records_written_count"],
            "external_call_made_count": batch_import["external_call_made_count"],
            "normalized_final_count": batch_import["normalized_final_count"],
            "truth_verified_count": batch_import["truth_verified_count"],
            "public_approved_count": batch_import["public_approved_count"],
            "mutated_public_data_count": batch_import["mutated_public_data_count"],
            "published_report_count": batch_import["published_report_count"],
            "target_layer_counts": batch_import["target_layer_counts"],
            "import_type_counts": batch_import["import_type_counts"],
            "writes_records": batch_import["writes_records"],
            "calls_external_systems": batch_import["calls_external_systems"],
            "normalizes_final_data": batch_import["normalizes_final_data"],
            "replaces_adapter_layer": batch_import["replaces_adapter_layer"],
            "replaces_source_registry": batch_import["replaces_source_registry"],
            "replaces_data_aggregator": batch_import["replaces_data_aggregator"],
            "replaces_data_normalization": batch_import["replaces_data_normalization"],
            "flag": batch_import["blocked"] > 0 or batch_import["needs_review"] > 0 or batch_import["quarantined_record_count"] > 0,
            "status": "watch" if batch_import["blocked"] > 0 or batch_import["needs_review"] > 0 or batch_import["quarantined_record_count"] > 0 else "ready",
        }
        summary["oracle"] = {
            "cases_total": oracle["cases_total"],
            "rulings_total": oracle["rulings_total"],
            "open_cases": oracle["open_cases"],
            "insufficient_evidence_count": oracle["insufficient_evidence_count"],
        }
        summary["ai_guardrails"] = {
            "policy_status": ai_guardrails["policy_status"],
            "blocked_count": ai_guardrails["blocked_count"],
            "review_required_count": ai_guardrails["review_required_count"],
        }
        summary["game_theory"] = {
            "policy_status": game_theory["policy_status"],
            "scenarios_total": game_theory["scenarios_total"],
            "high_risk_count": game_theory["high_risk_count"],
            "critical_risk_count": game_theory["critical_risk_count"],
            "average_confidence": game_theory["average_confidence"],
        }
    return summary

@router.get("/programs")
def watchtower_programs(days: int = 30, baseline_weeks: int = 8) -> Dict[str, Any]:
    rows, integrity = build_watchtower_program_rows(days=int(days), baseline_weeks=int(baseline_weeks))
    return {
        "ok": True,
        "days": int(days),
        "baseline_weeks": int(baseline_weeks),
        "count": len(rows),
        "integrity": integrity,
        "programs": rows,
    }

@router.get("/quarantine")
def watchtower_quarantine() -> Dict[str, Any]:
    q = get_quarantine_map()
    return {"ok": True, "count": len(q), "quarantine": q}


@router.post("/quarantine/{program_id}")
def watchtower_set_quarantine(
    program_id: str,
    payload: Dict[str, Any] = Body(default={}),
) -> Dict[str, Any]:
    reason = str((payload or {}).get("reason") or "manual_quarantine")
    expires_at = (payload or {}).get("expires_at")
    created_by = str((payload or {}).get("created_by") or "")
    exp = int(expires_at) if expires_at is not None and str(expires_at).strip() else None
    set_quarantine(program_id, reason=reason, expires_at=exp, created_by=(created_by or None))
    return {"ok": True, "program_id": program_id, "status": "quarantined"}


@router.delete("/quarantine/{program_id}")
def watchtower_clear_quarantine(program_id: str) -> Dict[str, Any]:
    clear_quarantine(program_id)
    return {"ok": True, "program_id": program_id, "status": "cleared"}


@router.get("/risk/history")
def watchtower_risk_history(program_id: str, limit: int = 50) -> Dict[str, Any]:
    hist = get_risk_history(program_id, limit=int(limit))
    return {"ok": True, "program_id": program_id, "count": len(hist), "history": hist}
