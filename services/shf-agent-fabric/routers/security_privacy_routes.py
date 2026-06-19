from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body

from services.security_privacy_service import (
    batch_evaluate_security_privacy,
    evaluate_security_privacy,
    security_privacy_health,
    security_privacy_readiness,
    security_privacy_schema,
    security_privacy_summary,
)


router = APIRouter(prefix="/security-privacy", tags=["security-privacy"])


@router.get("/health")
def health() -> Dict[str, Any]:
    return security_privacy_health()


@router.get("/schema")
def schema() -> Dict[str, Any]:
    return security_privacy_schema()


@router.get("/summary")
def summary() -> Dict[str, Any]:
    return security_privacy_summary()


@router.post("/evaluate")
def evaluate(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    return evaluate_security_privacy(payload)


@router.post("/batch-evaluate")
def batch_evaluate(payload: Any = Body(default=[])) -> Dict[str, Any]:
    records = payload.get("records") if isinstance(payload, dict) else payload
    return batch_evaluate_security_privacy(records)


@router.get("/readiness")
def readiness() -> Dict[str, Any]:
    return security_privacy_readiness()
