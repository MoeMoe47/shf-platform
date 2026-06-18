from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body

from services.data_verification_service import (
    batch_evaluate_verification,
    data_verification_health,
    data_verification_readiness,
    data_verification_schema,
    data_verification_summary,
    evaluate_verification,
)


router = APIRouter(prefix="/data-verification", tags=["data-verification"])


@router.get("/health")
def health() -> Dict[str, Any]:
    return data_verification_health()


@router.get("/schema")
def schema() -> Dict[str, Any]:
    return data_verification_schema()


@router.get("/summary")
def summary() -> Dict[str, Any]:
    return data_verification_summary()


@router.post("/evaluate")
def evaluate(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    return evaluate_verification(payload)


@router.post("/batch-evaluate")
def batch_evaluate(payload: Any = Body(default=[])) -> Dict[str, Any]:
    records = payload.get("records") if isinstance(payload, dict) else payload
    return batch_evaluate_verification(records)


@router.get("/readiness")
def readiness() -> Dict[str, Any]:
    return data_verification_readiness()
