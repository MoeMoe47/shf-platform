from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body

from services.public_approval_service import (
    batch_evaluate_public_approval,
    evaluate_public_approval,
    public_approval_health,
    public_approval_readiness,
    public_approval_schema,
    public_approval_summary,
)


router = APIRouter(prefix="/public-approval", tags=["public-approval"])


@router.get("/health")
def health() -> Dict[str, Any]:
    return public_approval_health()


@router.get("/schema")
def schema() -> Dict[str, Any]:
    return public_approval_schema()


@router.get("/summary")
def summary() -> Dict[str, Any]:
    return public_approval_summary()


@router.post("/evaluate")
def evaluate(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    return evaluate_public_approval(payload)


@router.post("/batch-evaluate")
def batch_evaluate(payload: Any = Body(default=[])) -> Dict[str, Any]:
    records = payload.get("records") if isinstance(payload, dict) else payload
    return batch_evaluate_public_approval(records)


@router.get("/readiness")
def readiness() -> Dict[str, Any]:
    return public_approval_readiness()
