from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body

from services.notification_alert_service import (
    batch_evaluate_notification_alert,
    evaluate_notification_alert,
    notification_alert_health,
    notification_alert_readiness,
    notification_alert_schema,
    notification_alert_summary,
)


router = APIRouter(prefix="/notification-alert", tags=["notification-alert"])


@router.get("/health")
def health() -> Dict[str, Any]:
    return notification_alert_health()


@router.get("/schema")
def schema() -> Dict[str, Any]:
    return notification_alert_schema()


@router.get("/summary")
def summary() -> Dict[str, Any]:
    return notification_alert_summary()


@router.post("/evaluate")
def evaluate(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    return evaluate_notification_alert(payload)


@router.post("/batch-evaluate")
def batch_evaluate(payload: Any = Body(default=[])) -> Dict[str, Any]:
    records = payload.get("records") if isinstance(payload, dict) else payload
    return batch_evaluate_notification_alert(records)


@router.get("/readiness")
def readiness() -> Dict[str, Any]:
    return notification_alert_readiness()
