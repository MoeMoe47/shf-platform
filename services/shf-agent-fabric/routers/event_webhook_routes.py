from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body

from services.event_webhook_service import (
    batch_evaluate_event_webhooks,
    evaluate_event_webhook,
    event_webhook_health,
    event_webhook_readiness,
    event_webhook_schema,
    event_webhook_summary,
)


router = APIRouter(prefix="/event-webhook", tags=["event-webhook"])


@router.get("/health")
def health() -> Dict[str, Any]:
    return event_webhook_health()


@router.get("/schema")
def schema() -> Dict[str, Any]:
    return event_webhook_schema()


@router.get("/summary")
def summary() -> Dict[str, Any]:
    return event_webhook_summary()


@router.post("/evaluate")
def evaluate(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    return evaluate_event_webhook(payload)


@router.post("/batch-evaluate")
def batch_evaluate(payload: Any = Body(default=[])) -> Dict[str, Any]:
    records = payload.get("records") if isinstance(payload, dict) else payload
    return batch_evaluate_event_webhooks(records)


@router.get("/readiness")
def readiness() -> Dict[str, Any]:
    return event_webhook_readiness()
