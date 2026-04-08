from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from services.ai_layer.comparison import run_stable_vs_candidate_scenario_comparison

router = APIRouter(tags=["comparison"])


class CountyInput(BaseModel):
    region: str
    risk_level: str
    funding_risk: str
    time_sensitivity: str
    confidence_score: float
    verification_quality: float
    suspicious_spike: bool = False


class ComparisonRequest(BaseModel):
    county_inputs: List[CountyInput]
    total_budget: int


@router.post("/optimizer/compare/stable-vs-candidate")
def compare_stable_vs_candidate(req: ComparisonRequest):
    return run_stable_vs_candidate_scenario_comparison(
        county_inputs=[c.dict() for c in req.county_inputs],
        total_budget=req.total_budget,
    )
