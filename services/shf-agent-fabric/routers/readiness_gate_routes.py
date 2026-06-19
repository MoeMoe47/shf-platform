from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body

from services.readiness_gate_service import (
    batch_evaluate_gates,
    evaluate_gate,
    readiness_gate_health,
    readiness_gate_readiness,
    readiness_gate_schema,
    readiness_gate_summary,
)


router = APIRouter(prefix="/readiness-gate", tags=["readiness-gate"])


@router.get("/health")
def health() -> Dict[str, Any]:
    return readiness_gate_health()


@router.get("/schema")
def schema() -> Dict[str, Any]:
    return readiness_gate_schema()


@router.get("/summary")
def summary() -> Dict[str, Any]:
    return readiness_gate_summary()


@router.post("/evaluate")
def evaluate(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    return evaluate_gate(payload)


@router.post("/batch-evaluate")
def batch_evaluate(payload: Any = Body(default=[])) -> Dict[str, Any]:
    records = payload.get("records") if isinstance(payload, dict) else payload
    return batch_evaluate_gates(records)


@router.get("/readiness")
def readiness() -> Dict[str, Any]:
    return readiness_gate_readiness()
