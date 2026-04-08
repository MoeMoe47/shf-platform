from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from services.operator_contracts_service import (
    create_contract,
    list_contracts,
    get_contract,
    activate_contract,
    pause_contract,
    close_contract,
)

router = APIRouter(prefix="/api/v1/operator/contracts", tags=["operator-contracts"])

class CreateContractRequest(BaseModel):
    contract_code: str
    name: str
    outcome_type: str
    verification_method: str
    payout_amount: float
    currency: str = "USD"
    pool_id: str | None = None
    max_supply: int | None = None
    risk_score: str | None = None
    notes: str | None = None
    created_by: str

class ActorRequest(BaseModel):
    actor_id: str

@router.post("")
def create_contract_route(body: CreateContractRequest):
    result = create_contract(body.model_dump())
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("error", "create contract failed"))
    return result

@router.get("")
def list_contracts_route(
    status: str | None = Query(default=None),
    pool_id: str | None = Query(default=None),
    outcome_type: str | None = Query(default=None),
):
    return {
        "ok": True,
        "contracts": list_contracts(status=status, pool_id=pool_id, outcome_type=outcome_type),
    }

@router.get("/{contract_id}")
def get_contract_route(contract_id: str):
    result = get_contract(contract_id)
    if not result.get("ok"):
        raise HTTPException(status_code=404, detail=result.get("error", "contract not found"))
    return result

@router.post("/{contract_id}/activate")
def activate_contract_route(contract_id: str, body: ActorRequest):
    result = activate_contract(contract_id, body.actor_id)
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("error", "activate failed"))
    return result

@router.post("/{contract_id}/pause")
def pause_contract_route(contract_id: str, body: ActorRequest):
    result = pause_contract(contract_id, body.actor_id)
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("error", "pause failed"))
    return result

@router.post("/{contract_id}/close")
def close_contract_route(contract_id: str, body: ActorRequest):
    result = close_contract(contract_id, body.actor_id)
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("error", "close failed"))
    return result
