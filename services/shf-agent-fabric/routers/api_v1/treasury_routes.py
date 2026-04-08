from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from fabric.treasury.store import (
    create_account,
    get_account_by_code,
    post_entry,
    list_entries_by_account,
)

router = APIRouter(prefix="/api/v1/treasury", tags=["treasury"])


class CreateAccountIn(BaseModel):
    account_code: str
    name: str
    account_type: str
    currency: str = "USD"
    status: str = "ACTIVE"


class PostEntryIn(BaseModel):
    account_id: str
    direction: str
    amount_cents: int
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    memo: Optional[str] = None


@router.post("/accounts")
def create_account_route(body: CreateAccountIn) -> Dict[str, Any]:
    return create_account(**body.model_dump())


@router.get("/accounts/{account_code}")
def get_account_route(account_code: str) -> Dict[str, Any]:
    row = get_account_by_code(account_code)
    if not row:
        raise HTTPException(status_code=404, detail="treasury account not found")
    return row


@router.post("/entries")
def post_entry_route(body: PostEntryIn) -> Dict[str, Any]:
    return post_entry(**body.model_dump())


@router.get("/accounts/{account_id}/entries")
def list_entries_route(account_id: str) -> Dict[str, Any]:
    return {"items": list_entries_by_account(account_id)}
