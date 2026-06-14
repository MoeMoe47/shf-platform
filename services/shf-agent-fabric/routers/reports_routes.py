from fastapi import APIRouter
from datetime import datetime

from services.ai_guardrails_service import ai_guardrails_summary
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
