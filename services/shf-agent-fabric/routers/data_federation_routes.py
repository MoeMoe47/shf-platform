from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body

from services.data_federation_service import (
    batch_evaluate_federations,
    data_federation_health,
    data_federation_readiness,
    data_federation_schema,
    data_federation_summary,
    evaluate_federation,
)


router = APIRouter(prefix="/data-federation", tags=["data-federation"])


@router.get("/health")
def health() -> Dict[str, Any]:
    return data_federation_health()


@router.get("/schema")
def schema() -> Dict[str, Any]:
    return data_federation_schema()


@router.get("/summary")
def summary() -> Dict[str, Any]:
    return data_federation_summary()


@router.post("/evaluate")
def evaluate(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    return evaluate_federation(payload)


@router.post("/batch-evaluate")
def batch_evaluate(payload: Any = Body(default=[])) -> Dict[str, Any]:
    records = payload.get("records") if isinstance(payload, dict) else payload
    return batch_evaluate_federations(records)


@router.get("/readiness")
def readiness() -> Dict[str, Any]:
    return data_federation_readiness()
