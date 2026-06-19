from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body

from services.production_automation_service import (
    batch_evaluate_production_automation,
    evaluate_production_automation,
    production_automation_health,
    production_automation_readiness,
    production_automation_schema,
    production_automation_summary,
)


router = APIRouter(prefix="/production-automation", tags=["production-automation"])


@router.get("/health")
def health() -> Dict[str, Any]:
    return production_automation_health()


@router.get("/schema")
def schema() -> Dict[str, Any]:
    return production_automation_schema()


@router.get("/summary")
def summary() -> Dict[str, Any]:
    return production_automation_summary()


@router.post("/evaluate")
def evaluate(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    return evaluate_production_automation(payload)


@router.post("/batch-evaluate")
def batch_evaluate(payload: Any = Body(default=[])) -> Dict[str, Any]:
    records = payload.get("records") if isinstance(payload, dict) else payload
    return batch_evaluate_production_automation(records)


@router.get("/readiness")
def readiness() -> Dict[str, Any]:
    return production_automation_readiness()
