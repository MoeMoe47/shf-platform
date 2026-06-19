from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body

from services.api_gateway_service import (
    api_gateway_health,
    api_gateway_readiness,
    api_gateway_schema,
    api_gateway_summary,
    batch_evaluate_api_gateway,
    evaluate_api_gateway,
)


router = APIRouter(prefix="/api-gateway", tags=["api-gateway"])


@router.get("/health")
def health() -> Dict[str, Any]:
    return api_gateway_health()


@router.get("/schema")
def schema() -> Dict[str, Any]:
    return api_gateway_schema()


@router.get("/summary")
def summary() -> Dict[str, Any]:
    return api_gateway_summary()


@router.post("/evaluate")
def evaluate(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    return evaluate_api_gateway(payload)


@router.post("/batch-evaluate")
def batch_evaluate(payload: Any = Body(default=[])) -> Dict[str, Any]:
    records = payload.get("records") if isinstance(payload, dict) else payload
    return batch_evaluate_api_gateway(records)


@router.get("/readiness")
def readiness() -> Dict[str, Any]:
    return api_gateway_readiness()
