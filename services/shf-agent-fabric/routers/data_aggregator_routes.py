from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body

from services.data_aggregator_service import (
    classify_intake,
    data_aggregator_health,
    data_aggregator_summary,
    intake_queue,
    list_sources,
)


router = APIRouter(prefix="/data-aggregator", tags=["data-aggregator"])


@router.get("/health")
def health() -> Dict[str, Any]:
    return data_aggregator_health()


@router.get("/sources")
def sources() -> Dict[str, Any]:
    items = list_sources()
    return {"ok": True, "count": len(items), "sources": items}


@router.get("/intake-queue")
def queue() -> Dict[str, Any]:
    items = intake_queue()
    return {"ok": True, "count": len(items), "intake_queue": items}


@router.get("/summary")
def summary() -> Dict[str, Any]:
    return data_aggregator_summary()


@router.post("/classify")
def classify(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    return classify_intake(payload)
