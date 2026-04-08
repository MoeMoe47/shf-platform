from .cover import render_cover_page
from .decision_summary import render_decision_summary_page
from .table_of_contents import render_table_of_contents_page
from .executive_summary import render_executive_summary_page
from .pages_5_16 import (
    render_program_profile_page,
    render_population_context_page,
    render_kpi_dashboard_page,
    render_outcome_performance_page,
    render_trend_analysis_page,
    render_evidence_scorecard_page,
    render_operational_integrity_page,
    render_risk_analysis_page,
    render_funding_recommendation_page,
    render_funding_conditions_page,
    render_improvement_plan_page,
    render_glossary_and_notes_page,
)

PAGE_RENDERERS = {
    "cover": render_cover_page,
    "decision_summary": render_decision_summary_page,
    "table_of_contents": render_table_of_contents_page,
    "executive_summary": render_executive_summary_page,
    "program_profile": render_program_profile_page,
    "population_context": render_population_context_page,
    "kpi_dashboard": render_kpi_dashboard_page,
    "outcome_performance": render_outcome_performance_page,
    "trend_analysis": render_trend_analysis_page,
    "evidence_scorecard": render_evidence_scorecard_page,
    "operational_integrity": render_operational_integrity_page,
    "risk_analysis": render_risk_analysis_page,
    "funding_recommendation": render_funding_recommendation_page,
    "funding_conditions": render_funding_conditions_page,
    "improvement_plan": render_improvement_plan_page,
    "glossary_and_notes": render_glossary_and_notes_page,
}
