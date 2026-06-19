from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body

from services.warehouse_sync_service import (
    batch_evaluate_warehouse_sync,
    evaluate_warehouse_sync,
    warehouse_sync_health,
    warehouse_sync_readiness,
    warehouse_sync_schema,
    warehouse_sync_summary,
)


router = APIRouter(prefix="/warehouse-sync", tags=["warehouse-sync"])


@router.get("/health")
def health() -> Dict[str, Any]:
    return warehouse_sync_health()


@router.get("/schema")
def schema() -> Dict[str, Any]:
    return warehouse_sync_schema()


@router.get("/summary")
def summary() -> Dict[str, Any]:
    return warehouse_sync_summary()


@router.post("/evaluate")
def evaluate(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    return evaluate_warehouse_sync(payload)


@router.post("/batch-evaluate")
def batch_evaluate(payload: Any = Body(default=[])) -> Dict[str, Any]:
    records = payload.get("records") if isinstance(payload, dict) else payload
    return batch_evaluate_warehouse_sync(records)


@router.get("/readiness")
def readiness() -> Dict[str, Any]:
    return warehouse_sync_readiness()
