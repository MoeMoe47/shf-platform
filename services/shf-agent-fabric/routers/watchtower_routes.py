from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Body

from fabric.watchtower.aggregator import build_watchtower_summary, build_watchtower_program_rows
from fabric.watchtower.store import set_quarantine, clear_quarantine, get_quarantine_map, get_risk_history
from services.audit_verification_service import audit_verification_summary
from services.ai_guardrails_service import ai_guardrails_summary
from services.data_approval_service import data_approval_summary
from services.data_aggregator_service import data_aggregator_summary
from services.data_federation_service import data_federation_summary
from services.data_normalization_service import data_normalization_summary
from services.data_verification_service import data_verification_summary
from services.evidence_package_service import evidence_package_summary
from services.game_theory_service import game_theory_summary
from services.oracle_service import oracle_summary
from services.readiness_gate_service import readiness_gate_summary
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
