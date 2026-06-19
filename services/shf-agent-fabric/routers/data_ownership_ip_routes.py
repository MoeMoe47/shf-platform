from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body

from services.data_ownership_ip_service import (
    batch_evaluate_data_ownership_ip,
    data_ownership_ip_health,
    data_ownership_ip_readiness,
    data_ownership_ip_schema,
    data_ownership_ip_summary,
    evaluate_data_ownership_ip,
)


router = APIRouter(prefix="/data-ownership-ip", tags=["data-ownership-ip"])


@router.get("/health")
def health() -> Dict[str, Any]:
    return data_ownership_ip_health()


@router.get("/schema")
def schema() -> Dict[str, Any]:
    return data_ownership_ip_schema()


@router.get("/summary")
def summary() -> Dict[str, Any]:
    return data_ownership_ip_summary()


@router.post("/evaluate")
def evaluate(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    return evaluate_data_ownership_ip(payload)


@router.post("/batch-evaluate")
def batch_evaluate(payload: Any = Body(default=[])) -> Dict[str, Any]:
    records = payload.get("records") if isinstance(payload, dict) else payload
    return batch_evaluate_data_ownership_ip(records)


@router.get("/readiness")
def readiness() -> Dict[str, Any]:
    return data_ownership_ip_readiness()
