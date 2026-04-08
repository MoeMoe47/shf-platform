from fastapi import APIRouter
from services.ai_layer.decision_journal import (
    list_decisions,
    query_by_decision_type,
)

router = APIRouter(tags=["decisions"])


@router.get("/decisions")
def get_decisions(limit: int = 20):
    return list_decisions(limit=limit)


@router.get("/decisions/type/{decision_type}")
def get_decisions_by_type(decision_type: str, limit: int = 20):
    return query_by_decision_type(decision_type, limit=limit)
