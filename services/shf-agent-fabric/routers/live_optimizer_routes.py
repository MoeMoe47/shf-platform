from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any

from services.ai_layer.live_optimizer import (
    run_live_cross_county_priority,
    run_live_multi_county_allocation,
    run_live_scenario_comparison,
)

router = APIRouter(tags=["live_optimizer"])


class CountyInput(BaseModel):
    region: str
    risk_level: str
    funding_risk: str
    time_sensitivity: str
    confidence_score: float
    verification_quality: float
    suspicious_spike: bool = False


class ScenarioRequest(BaseModel):
    county_inputs: List[CountyInput]
    total_budget: int
    evaluation_mode: str = "candidate_if_available"


@router.post("/optimizer/scenario")
def scenario_comparison(req: ScenarioRequest):
    return run_live_scenario_comparison(
        county_inputs=[c.dict() for c in req.county_inputs],
        total_budget=req.total_budget,
        evaluation_mode=req.evaluation_mode,
    )


@router.post("/optimizer/allocation")
def allocation(req: ScenarioRequest):
    return run_live_multi_county_allocation(
        county_inputs=[c.dict() for c in req.county_inputs],
        total_budget=req.total_budget,
        evaluation_mode=req.evaluation_mode,
    )


@router.post("/optimizer/priority")
def priority(req: ScenarioRequest):
    return run_live_cross_county_priority(
        county_inputs=[c.dict() for c in req.county_inputs],
        evaluation_mode=req.evaluation_mode,
    )
