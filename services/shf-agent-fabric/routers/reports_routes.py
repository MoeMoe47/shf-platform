from fastapi import APIRouter
from datetime import datetime

from services.ai_guardrails_service import ai_guardrails_summary
from services.data_aggregator_service import data_aggregator_summary
from services.data_normalization_service import data_normalization_summary
from services.data_verification_service import data_verification_summary
from services.evidence_package_service import evidence_package_summary
from services.game_theory_service import game_theory_summary
from services.oracle_service import oracle_summary
from services.truth_spine_service import truth_summary

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/snapshot")
def snapshot():
    truth = truth_summary()
    oracle = oracle_summary()
    ai_guardrails = ai_guardrails_summary()
    game_theory = game_theory_summary()
    data_aggregator = data_aggregator_summary()
    data_normalization = data_normalization_summary()
    evidence_package = evidence_package_summary()
    data_verification = data_verification_summary()
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
