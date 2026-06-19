from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body

from services.batch_import_service import (
    batch_evaluate_imports,
    batch_import_health,
    batch_import_readiness,
    batch_import_schema,
    batch_import_summary,
    evaluate_batch_import,
)


router = APIRouter(prefix="/batch-import", tags=["batch-import"])


@router.get("/health")
def health() -> Dict[str, Any]:
    return batch_import_health()


@router.get("/schema")
def schema() -> Dict[str, Any]:
    return batch_import_schema()


@router.get("/summary")
def summary() -> Dict[str, Any]:
    return batch_import_summary()


@router.post("/evaluate")
def evaluate(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    return evaluate_batch_import(payload)


@router.post("/batch-evaluate")
def batch_evaluate(payload: Any = Body(default=[])) -> Dict[str, Any]:
    records = payload.get("records") if isinstance(payload, dict) else payload
    return batch_evaluate_imports(records)


@router.get("/readiness")
def readiness() -> Dict[str, Any]:
    return batch_import_readiness()
