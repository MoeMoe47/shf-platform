from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from fabric.pools.store import create_pool, get_pool_by_id, list_pools
from fabric.pools.allocations_store import reserve_from_pool, get_allocations_by_pool

router = APIRouter(prefix="/api/v1/pools", tags=["pools"])


class CreatePoolIn(BaseModel):
    name: str
    committed_amount: int
    pool_code: Optional[str] = None
    status: str = "ACTIVE"
    funder_type: Optional[str] = None
    funder_id: Optional[str] = None
    strategy_type: Optional[str] = None
    currency: str = "USD"


class ReservePoolIn(BaseModel):
    credit_id: str
    amount_cents: int


@router.post("")
def create_pool_route(body: CreatePoolIn) -> Dict[str, Any]:
    return create_pool(**body.model_dump())


@router.get("")
def list_pools_route() -> Dict[str, Any]:
    return {"items": list_pools()}


@router.get("/{pool_id}")
def get_pool_route(pool_id: str) -> Dict[str, Any]:
    row = get_pool_by_id(pool_id)
    if not row:
        raise HTTPException(status_code=404, detail="pool not found")
    return row


@router.post("/{pool_id}/reserve")
def reserve_pool_route(pool_id: str, body: ReservePoolIn) -> Dict[str, Any]:
    return reserve_from_pool(
        pool_id=pool_id,
        credit_id=body.credit_id,
        amount_cents=body.amount_cents,
    )


@router.get("/{pool_id}/allocations")
def list_pool_allocations_route(pool_id: str) -> Dict[str, Any]:
    return {"items": get_allocations_by_pool(pool_id)}
