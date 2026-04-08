from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.operator_actions_service import (
    resolve_dispute,
    settle_payout,
    create_pool,
    allocate_capital,
)

from services.operator_events_service import list_operator_events

router = APIRouter(prefix="/api/v1/operator", tags=["operator-actions"])


class ResolveDisputeRequest(BaseModel):
    resolution: str
    actor_id: str


class SettlePayoutRequest(BaseModel):
    actor_id: str


class CreatePoolRequest(BaseModel):
    name: str
    program_id: str
    committed_amount: float
    currency: str = "USD"
    actor_id: str


class AllocateCapitalRequest(BaseModel):
    amount: float
    allocation_type: str
    actor_id: str


@router.post("/disputes/{dispute_id}/resolve")
def resolve_dispute_route(dispute_id: str, body: ResolveDisputeRequest):

    result = resolve_dispute(dispute_id, body.model_dump())

    if not result["ok"]:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@router.post("/payouts/{payout_id}/settle")
def settle_payout_route(payout_id: str, body: SettlePayoutRequest):

    result = settle_payout(payout_id, body.model_dump())

    if not result["ok"]:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@router.post("/pools/create")
def create_pool_route(body: CreatePoolRequest):

    result = create_pool(body.model_dump())

    if not result["ok"]:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@router.post("/pools/{pool_id}/allocate")
def allocate_capital_route(pool_id: str, body: AllocateCapitalRequest):

    result = allocate_capital(pool_id, body.model_dump())

    if not result["ok"]:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@router.get("/events")
def events(limit: int = 50):

    return {
        "ok": True,
        "events": list_operator_events(limit)
    }
