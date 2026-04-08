from .context_builder import build_context
from .agents import risk_agent, intervention_agent, funding_agent
from .game_theory import run_game_theory


def run_orchestrator(input_data):
    context = build_context(input_data or {})

    risk_result = risk_agent.run(context)
    intervention_result = intervention_agent.run(context)
    funding_result = funding_agent.run(context)
    game_theory_result = run_game_theory(
        context,
        risk_result,
        intervention_result,
        funding_result,
    )

    region = context.get("region") or "Unknown region"

    summary = (
        f"{region} shows {risk_result['risk_level']} risk with "
        f"{funding_result['funding_risk']} funding sensitivity."
    )

    why_it_matters = (
        f"{risk_result['risk_summary']} "
        f"{intervention_result['intervention_rationale']} "
        f"{funding_result['funding_rationale']}"
    )

    return {
        "summary": summary,
        "why_it_matters": why_it_matters,
        "recommended_action": intervention_result["recommended_action"],
        "confidence": risk_result["confidence"],
        "risk_level": risk_result["risk_level"],
        "time_sensitivity": intervention_result["time_sensitivity"],
        "funding_risk": funding_result["funding_risk"],
        "estimated_exposure": funding_result["estimated_exposure"],
        "funding_recommendation": funding_result["funding_recommendation"],
        "game_theory": game_theory_result,
        "agents": {
            "risk_agent": risk_result,
            "intervention_agent": intervention_result,
            "funding_agent": funding_result,
        },
    }
