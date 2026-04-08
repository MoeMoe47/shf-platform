from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from fabric.payouts.store import create_payout_intent, get_payout_intent
from fabric.payouts.settlement_engine import settle_payout_intent

router = APIRouter(prefix="/api/v1/payouts", tags=["payouts"])


class CreatePayoutIntentIn(BaseModel):
    credit_id: str
    destination: str
    amount_cents: int


class SettlePayoutIntentIn(BaseModel):
    debit_account_code: str
    credit_account_code: str


@router.post("/intent")
def create_payout_intent_route(body: CreatePayoutIntentIn) -> Dict[str, Any]:
    return create_payout_intent(
        credit_id=body.credit_id,
        destination=body.destination,
        amount_cents=body.amount_cents,
    )


@router.get("/intent/{intent_id}")
def get_payout_intent_route(intent_id: str) -> Dict[str, Any]:
    row = get_payout_intent(intent_id)
    if not row:
        raise HTTPException(status_code=404, detail="payout intent not found")
    return row


@router.post("/intent/{intent_id}/settle")
def settle_payout_intent_route(intent_id: str, body: SettlePayoutIntentIn) -> Dict[str, Any]:
    return settle_payout_intent(
        intent_id=intent_id,
        debit_account_code=body.debit_account_code,
        credit_account_code=body.credit_account_code,
    )
