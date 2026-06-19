from fastapi import APIRouter
from datetime import datetime

from services.audit_verification_service import audit_verification_summary
from services.ai_guardrails_service import ai_guardrails_summary
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

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/snapshot")
def snapshot():
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
    return {
        "ts": datetime.utcnow().isoformat(),
        "usage": {"requests": 0, "users": 0, "apps": 0},
        "containment": {"limited": 0, "off": 0, "on": 0, "forced": 0},
        "outcomes": {"executed": 0, "failed": 0},
        "system": {"errors": 0, "p95_ms": 0},
        "truth": {
            "claim_count": truth["claim_count"],
            "source_count": truth["source_count"],
            "verified_claim_count": truth["verified_claim_count"],
            "report_ready_count": truth["report_ready_count"],
            "public_approved_count": truth["public_approved_count"],
            "coverage_percent": truth["coverage_percent"],
            "status": "ready" if truth["report_ready_count"] else "needs_truth_coverage",
        },
        "source_registry": {
            "policy_status": source_registry["policy_status"],
            "total_sources": source_registry["total_sources"],
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
            "note": "Source Registry evaluates source identity and downstream eligibility only; Truth Spine controls verification and public approval.",
        },
        "data_federation": {
            "policy_status": data_federation["policy_status"],
            "total_federation_sets": data_federation["total_federation_sets"],
            "blocked": data_federation["blocked"],
            "needs_review": data_federation["needs_review"],
            "aggregator_ready": data_federation["aggregator_ready"],
            "truth_spine_ready": data_federation["truth_spine_ready"],
            "public_approval_ready": data_federation["public_approval_ready"],
            "truth_verified_count": data_federation["truth_verified_count"],
            "public_approved_count": data_federation["public_approved_count"],
            "verifies_truth": data_federation["verifies_truth"],
            "note": "Data Federation groups sources for Data Aggregator only; it does not verify truth or approve public data.",
        },
        "data_aggregator": {
            "policy_status": data_aggregator["policy_status"],
            "total_sources": data_aggregator["total_sources"],
            "pending_intake": data_aggregator["pending_intake"],
            "missing_provenance": data_aggregator["missing_provenance"],
            "blocked_from_truth_spine": data_aggregator["blocked_from_truth_spine"],
            "ready_for_normalization": data_aggregator["ready_for_normalization"],
            "ready_for_evidence_package": data_aggregator["ready_for_evidence_package"],
            "public_approval_eligible_count": data_aggregator["public_approval_eligible_count"],
            "note": "Data Aggregator is intake context only; Truth Spine controls verification, public approval, and report readiness.",
        },
        "data_normalization": {
            "policy_status": data_normalization["policy_status"],
            "supported_canonical_types": data_normalization["supported_canonical_types"],
            "sample_readiness": data_normalization["sample_readiness"],
            "ready_for_public_approval": data_normalization["ready_for_public_approval"],
            "verifies_truth": data_normalization["verifies_truth"],
            "approves_public_data": data_normalization["approves_public_data"],
            "note": "Data Normalization is canonical preview context only; Truth Spine controls verification, public approval, and report readiness.",
        },
        "evidence_package": {
            "policy_status": evidence_package["policy_status"],
            "total_packages": evidence_package["total_packages"],
            "complete_packages": evidence_package["complete_packages"],
            "incomplete_packages": evidence_package["incomplete_packages"],
            "missing_provenance": evidence_package["missing_provenance"],
            "missing_sources": evidence_package["missing_sources"],
            "truth_spine_ready": evidence_package["truth_spine_ready"],
            "public_approval_ready": evidence_package["public_approval_ready"],
            "verifies_truth": evidence_package["verifies_truth"],
            "note": "Evidence Package is review preparation only; Truth Spine controls verification, public approval, and report readiness.",
        },
        "data_verification": {
            "policy_status": data_verification["policy_status"],
            "total_evaluations": data_verification["total_evaluations"],
            "blocked": data_verification["blocked"],
            "needs_review": data_verification["needs_review"],
            "ready_for_truth_spine": data_verification["ready_for_truth_spine"],
            "truth_verified_count": data_verification["truth_verified_count"],
            "public_approval_ready": data_verification["public_approval_ready"],
            "verifies_truth": data_verification["verifies_truth"],
            "note": "Data Verification evaluates readiness only; Truth Spine remains the verification authority.",
        },
        "data_approval": {
            "policy_status": data_approval["policy_status"],
            "total_candidates": data_approval["total_candidates"],
            "blocked": data_approval["blocked"],
            "needs_review": data_approval["needs_review"],
            "gateway_ready": data_approval["gateway_ready"],
            "public_ready_candidates": data_approval["public_ready_candidates"],
            "public_approved_count": data_approval["public_approved_count"],
            "mutated_public_data_count": data_approval["mutated_public_data_count"],
            "approves_public_data": data_approval["approves_public_data"],
            "requires_gateway_review": data_approval["requires_gateway_review"],
            "note": "Data Approval evaluates approval readiness only; Data Approval Gateway and human review remain required for public approval.",
        },
        "audit_verification": {
            "policy_status": audit_verification["policy_status"],
            "total_events": audit_verification["total_events"],
            "blocked": audit_verification["blocked"],
            "needs_review": audit_verification["needs_review"],
            "audit_ready": audit_verification["audit_ready"],
            "trace_ready": audit_verification["trace_ready"],
            "replay_ready": audit_verification["replay_ready"],
            "truth_verified_count": audit_verification["truth_verified_count"],
            "public_approved_count": audit_verification["public_approved_count"],
            "verifies_truth": audit_verification["verifies_truth"],
            "note": "Audit Verification is traceability and replay-readiness context only; Truth Spine controls truth, public approval, and report readiness.",
        },
        "readiness_gate": {
            "policy_status": readiness_gate["policy_status"],
            "total_gate_evaluations": readiness_gate["total_gate_evaluations"],
            "blocked": readiness_gate["blocked"],
            "needs_review": readiness_gate["needs_review"],
            "ready": readiness_gate["ready"],
            "can_move_forward_count": readiness_gate["can_move_forward_count"],
            "truth_verified_count": readiness_gate["truth_verified_count"],
            "public_approved_count": readiness_gate["public_approved_count"],
            "mutated_public_data_count": readiness_gate["mutated_public_data_count"],
            "verifies_truth": readiness_gate["verifies_truth"],
            "note": "Readiness Gate is transition-readiness context only; Truth Spine, Oracle, and Data Approval Gateway remain their own authorities.",
        },
        "public_approval": {
            "policy_status": public_approval["policy_status"],
            "total_candidates": public_approval["total_candidates"],
            "blocked": public_approval["blocked"],
            "needs_review": public_approval["needs_review"],
            "public_ready_candidates": public_approval["public_ready_candidates"],
            "public_approved_count": public_approval["public_approved_count"],
            "mutated_public_data_count": public_approval["mutated_public_data_count"],
            "published_report_count": public_approval["published_report_count"],
            "approves_public_data": public_approval["approves_public_data"],
            "publishes_reports": public_approval["publishes_reports"],
            "note": "Public Approval evaluates public-release readiness only; final public approval, public data writes, and report publishing remain gated outside this V1 scaffold.",
        },
        "security_privacy": {
            "policy_status": security_privacy["policy_status"],
            "total_reviews": security_privacy["total_reviews"],
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
            "note": "Security Privacy evaluates exposure risk only; Identity, Truth Spine, Public Approval, SHF Impact Data Spine, and Reports remain separate authorities.",
        },
        "data_ownership_ip": {
            "policy_status": data_ownership_ip["policy_status"],
            "total_reviews": data_ownership_ip["total_reviews"],
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
            "note": "Data Ownership IP evaluates ownership and usage-right readiness only; it does not provide legal advice, approve public data, publish reports, or mutate SHF Impact Data Spine.",
        },
        "policy_engine": {
            "policy_status": policy_engine["policy_status"],
            "total_evaluations": policy_engine["total_evaluations"],
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
            "note": "Policy Engine evaluates policy readiness only; it does not replace Truth Spine, Oracle, AI Guardrails, Identity, privacy, ownership, Public Approval, or Reports.",
        },
        "event_webhook": {
            "policy_status": event_webhook["policy_status"],
            "total_events": event_webhook["total_events"],
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
            "note": "Event Webhook evaluates event routing and webhook readiness only; it does not send external webhooks, verify truth, approve public data, mutate public data, or publish reports.",
        },
        "oracle": {
            "cases_total": oracle["cases_total"],
            "rulings_total": oracle["rulings_total"],
            "supportable": oracle["supportable"],
            "disputed": oracle["disputed"],
            "insufficient_evidence": oracle["insufficient_evidence"],
            "note": "Oracle rulings are decision-support only; reports still require Truth Spine verified/readiness-approved packages.",
        },
        "ai_guardrails": {
            "decisions_total": ai_guardrails["decisions_total"],
            "blocked": ai_guardrails["blocked"],
            "requires_truth_review": ai_guardrails["requires_truth_review"],
            "requires_oracle_review": ai_guardrails["requires_oracle_review"],
            "requires_alignment_approval": ai_guardrails["requires_alignment_approval"],
        },
        "game_theory": {
            "scenarios_total": game_theory["scenarios_total"],
            "analyses_total": game_theory["analyses_total"],
            "high_risk": game_theory["high_risk"],
            "critical_risk": game_theory["critical_risk"],
            "average_confidence": game_theory["average_confidence"],
            "top_recommendation": game_theory["top_recommendation"],
            "note": "Game Theory output is strategic analysis, not verified outcomes or report-ready facts.",
        },
    }

@router.get("/usage.csv")
def usage_csv():
    return "requests,users,apps\n0,0,0\n"

@router.get("/containment.csv")
def containment_csv():
    return "limited,off,on,forced\n0,0,0,0\n"

@router.get("/outcomes.csv")
def outcomes_csv():
    return "executed,failed\n0,0\n"

@router.get("/system.csv")
def system_csv():
    return "errors,p95_ms\n0,0\n"
