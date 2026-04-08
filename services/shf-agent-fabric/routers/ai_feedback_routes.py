from fastapi import APIRouter
from services.ai_layer.outcome_feedback import list_feedback

router = APIRouter(tags=["ai_feedback"])


@router.get("/feedback")
def get_feedback(limit: int = 20):
    return list_feedback(limit=limit)
