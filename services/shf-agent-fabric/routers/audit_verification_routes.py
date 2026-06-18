from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body

from services.audit_verification_service import (
    audit_verification_health,
    audit_verification_readiness,
    audit_verification_schema,
    audit_verification_summary,
    batch_evaluate_audit_events,
    evaluate_audit_event,
)


router = APIRouter(prefix="/audit-verification", tags=["audit-verification"])


@router.get("/health")
def health() -> Dict[str, Any]:
    return audit_verification_health()


@router.get("/schema")
def schema() -> Dict[str, Any]:
    return audit_verification_schema()


@router.get("/summary")
def summary() -> Dict[str, Any]:
    return audit_verification_summary()


@router.post("/evaluate")
def evaluate(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    return evaluate_audit_event(payload)


@router.post("/batch-evaluate")
def batch_evaluate(payload: Any = Body(default=[])) -> Dict[str, Any]:
    records = payload.get("records") if isinstance(payload, dict) else payload
    return batch_evaluate_audit_events(records)


@router.get("/readiness")
def readiness() -> Dict[str, Any]:
    return audit_verification_readiness()
