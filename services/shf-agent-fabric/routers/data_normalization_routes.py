from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body

from services.data_normalization_service import (
    batch_normalize,
    data_normalization_health,
    data_normalization_schema,
    data_normalization_summary,
    normalize_record,
)


router = APIRouter(prefix="/data-normalization", tags=["data-normalization"])


@router.get("/health")
def health() -> Dict[str, Any]:
    return data_normalization_health()


@router.get("/schema")
def schema() -> Dict[str, Any]:
    return data_normalization_schema()


@router.get("/summary")
def summary() -> Dict[str, Any]:
    return data_normalization_summary()


@router.post("/normalize")
def normalize(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    return normalize_record(payload)


@router.post("/batch-normalize")
def normalize_batch(payload: Any = Body(default=[])) -> Dict[str, Any]:
    records = payload.get("records") if isinstance(payload, dict) else payload
    return batch_normalize(records)
