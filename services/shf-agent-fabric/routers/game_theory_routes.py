from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body, HTTPException

from services.game_theory_service import (
    analyze_scenario,
    audit_feed,
    create_scenario,
    game_theory_summary,
    get_analysis,
    get_scenario,
    get_scenario_analysis,
    list_analyses,
    list_scenarios,
    strategy_playbook,
)

router = APIRouter(prefix="/game-theory", tags=["game-theory"])


@router.get("/health")
def health() -> Dict[str, Any]:
    summary = game_theory_summary()
    return {
        "ok": True,
        "service": "game-theory-layer-v1",
        "policy_status": summary["policy_status"],
        "scenarios_total": summary["scenarios_total"],
        "analyses_total": summary["analyses_total"],
    }


@router.get("/scenarios")
def scenarios() -> Dict[str, Any]:
    rows = list_scenarios()
    return {"ok": True, "count": len(rows), "scenarios": rows}


@router.post("/scenarios")
def create(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    scenario = create_scenario(payload or {})
    return {"ok": True, "scenario": scenario}


@router.get("/scenarios/{scenario_id}")
def scenario_detail(scenario_id: str) -> Dict[str, Any]:
    scenario = get_scenario(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="scenario_not_found")
    return {"ok": True, "scenario": scenario}


@router.post("/scenarios/{scenario_id}/analyze")
def analyze(scenario_id: str) -> Dict[str, Any]:
    analysis = analyze_scenario(scenario_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="scenario_not_found")
    return {"ok": True, "analysis": analysis}


@router.get("/analyses")
def analyses() -> Dict[str, Any]:
    rows = list_analyses()
    return {"ok": True, "count": len(rows), "analyses": rows}


@router.get("/analyses/{analysis_id}")
def analysis_detail(analysis_id: str) -> Dict[str, Any]:
    analysis = get_analysis(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="analysis_not_found")
    return {"ok": True, "analysis": analysis}


@router.get("/scenarios/{scenario_id}/analysis")
def scenario_analysis(scenario_id: str) -> Dict[str, Any]:
    if not get_scenario(scenario_id):
        raise HTTPException(status_code=404, detail="scenario_not_found")
    analysis = get_scenario_analysis(scenario_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="analysis_not_found")
    return {"ok": True, "analysis": analysis}


@router.get("/strategy-playbook")
def playbook() -> Dict[str, Any]:
    return strategy_playbook()


@router.get("/audit-feed")
def audit(limit: int = 100) -> Dict[str, Any]:
    return audit_feed(limit=limit)

