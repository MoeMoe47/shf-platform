from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body

from services.policy_engine_service import (
    batch_evaluate_policies,
    evaluate_policy,
    policy_engine_health,
    policy_engine_readiness,
    policy_engine_schema,
    policy_engine_summary,
)


router = APIRouter(prefix="/policy-engine", tags=["policy-engine"])


@router.get("/health")
def health() -> Dict[str, Any]:
    return policy_engine_health()


@router.get("/schema")
def schema() -> Dict[str, Any]:
    return policy_engine_schema()


@router.get("/summary")
def summary() -> Dict[str, Any]:
    return policy_engine_summary()


@router.post("/evaluate")
def evaluate(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    return evaluate_policy(payload)


@router.post("/batch-evaluate")
def batch_evaluate(payload: Any = Body(default=[])) -> Dict[str, Any]:
    records = payload.get("records") if isinstance(payload, dict) else payload
    return batch_evaluate_policies(records)


@router.get("/readiness")
def readiness() -> Dict[str, Any]:
    return policy_engine_readiness()
