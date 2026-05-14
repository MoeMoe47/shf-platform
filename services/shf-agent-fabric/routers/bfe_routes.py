from fastapi import APIRouter, Body
from services.ai_layer.bfe_engine import (
    record_decision,
    record_outcome,
    summary,
    health
)

router = APIRouter(prefix="/bfe", tags=["bfe"])

@router.get("/health")
def bfe_health():
    return health()

@router.post("/decision")
def bfe_decision(payload: dict = Body(...)):
    return record_decision(payload)

@router.post("/outcome")
def bfe_outcome(payload: dict = Body(...)):
    return record_outcome(payload)

@router.get("/summary")
def bfe_summary():
    return summary()

from services.ai_layer.bfe_engine import build_intelligence

@router.get("/bfe/intelligence")
def bfe_intelligence():
    summary = summary_stats()  # existing function
    return build_intelligence(summary)

