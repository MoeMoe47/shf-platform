from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body

from services.verified_aggregation_service import (
    batch_evaluate_verified_aggregation,
    evaluate_verified_aggregation,
    verified_aggregation_health,
    verified_aggregation_readiness,
    verified_aggregation_schema,
    verified_aggregation_summary,
)


router = APIRouter(prefix="/verified-aggregation", tags=["verified-aggregation"])


@router.get("/health")
def health() -> Dict[str, Any]:
    return verified_aggregation_health()


@router.get("/schema")
def schema() -> Dict[str, Any]:
    return verified_aggregation_schema()


@router.get("/summary")
def summary() -> Dict[str, Any]:
    return verified_aggregation_summary()


@router.post("/evaluate")
def evaluate(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    return evaluate_verified_aggregation(payload)


@router.post("/batch-evaluate")
def batch_evaluate(payload: Any = Body(default=[])) -> Dict[str, Any]:
    records = payload.get("records") if isinstance(payload, dict) else payload
    return batch_evaluate_verified_aggregation(records)


@router.get("/readiness")
def readiness() -> Dict[str, Any]:
    return verified_aggregation_readiness()
