from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from services.operator_allocations_service import (
    create_allocation,
    list_allocations,
    get_allocation,
)

router = APIRouter(prefix="/api/v1/operator/allocations", tags=["operator-allocations"])

class CreateAllocationRequest(BaseModel):
    pool_id: str
    contract_id: str
    contract_code: str | None = None
    max_contracts: int
    payout_amount: float
    allocated_capital: float | None = None
    notes: str | None = None
    created_by: str

@router.post("")
def create_allocation_route(body: CreateAllocationRequest):
    result = create_allocation(body.model_dump())
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("error", "create allocation failed"))
    return result

@router.get("")
def list_allocations_route(
    pool_id: str | None = Query(default=None),
    contract_id: str | None = Query(default=None),
    status: str | None = Query(default=None),
):
    return {
        "ok": True,
        "allocations": list_allocations(pool_id=pool_id, contract_id=contract_id, status=status),
    }

@router.get("/{allocation_id}")
def get_allocation_route(allocation_id: str):
    result = get_allocation(allocation_id)
    if not result.get("ok"):
        raise HTTPException(status_code=404, detail=result.get("error", "allocation not found"))
    return result
