from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body

from services.data_approval_service import (
    batch_evaluate_approval,
    data_approval_health,
    data_approval_readiness,
    data_approval_schema,
    data_approval_summary,
    evaluate_approval,
)


router = APIRouter(prefix="/data-approval", tags=["data-approval"])


@router.get("/health")
def health() -> Dict[str, Any]:
    return data_approval_health()


@router.get("/schema")
def schema() -> Dict[str, Any]:
    return data_approval_schema()


@router.get("/summary")
def summary() -> Dict[str, Any]:
    return data_approval_summary()


@router.post("/evaluate")
def evaluate(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    return evaluate_approval(payload)


@router.post("/batch-evaluate")
def batch_evaluate(payload: Any = Body(default=[])) -> Dict[str, Any]:
    records = payload.get("records") if isinstance(payload, dict) else payload
    return batch_evaluate_approval(records)


@router.get("/readiness")
def readiness() -> Dict[str, Any]:
    return data_approval_readiness()
