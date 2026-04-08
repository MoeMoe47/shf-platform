from fastapi import APIRouter
from services.ai_layer.lifecycle import run_full_lifecycle
from services.ai_layer.rules_promotion import load_promotion_state

router = APIRouter(tags=["lifecycle"])


@router.post("/lifecycle/run")
def run_lifecycle():
    return run_full_lifecycle(limit=50)


@router.get("/lifecycle/state")
def get_lifecycle_state():
    return load_promotion_state()
