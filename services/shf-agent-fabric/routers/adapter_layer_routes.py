from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body

from services.adapter_layer_service import (
    adapter_layer_health,
    adapter_layer_readiness,
    adapter_layer_schema,
    adapter_layer_summary,
    batch_evaluate_adapters,
    evaluate_adapter,
)


router = APIRouter(prefix="/adapter-layer", tags=["adapter-layer"])


@router.get("/health")
def health() -> Dict[str, Any]:
    return adapter_layer_health()


@router.get("/schema")
def schema() -> Dict[str, Any]:
    return adapter_layer_schema()


@router.get("/summary")
def summary() -> Dict[str, Any]:
    return adapter_layer_summary()


@router.post("/evaluate")
def evaluate(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    return evaluate_adapter(payload)


@router.post("/batch-evaluate")
def batch_evaluate(payload: Any = Body(default=[])) -> Dict[str, Any]:
    records = payload.get("records") if isinstance(payload, dict) else payload
    return batch_evaluate_adapters(records)


@router.get("/readiness")
def readiness() -> Dict[str, Any]:
    return adapter_layer_readiness()
