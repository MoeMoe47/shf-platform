from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body

from services.source_registry_service import (
    batch_evaluate_sources,
    evaluate_source,
    source_registry_health,
    source_registry_readiness,
    source_registry_schema,
    source_registry_sources,
    source_registry_summary,
)


router = APIRouter(prefix="/source-registry", tags=["source-registry"])


@router.get("/health")
def health() -> Dict[str, Any]:
    return source_registry_health()


@router.get("/schema")
def schema() -> Dict[str, Any]:
    return source_registry_schema()


@router.get("/summary")
def summary() -> Dict[str, Any]:
    return source_registry_summary()


@router.get("/sources")
def sources() -> Dict[str, Any]:
    return source_registry_sources()


@router.post("/evaluate")
def evaluate(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    return evaluate_source(payload)


@router.post("/batch-evaluate")
def batch_evaluate(payload: Any = Body(default=[])) -> Dict[str, Any]:
    records = payload.get("records") if isinstance(payload, dict) else payload
    return batch_evaluate_sources(records)


@router.get("/readiness")
def readiness() -> Dict[str, Any]:
    return source_registry_readiness()
