from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Dict

from fabric.outcomes.store import get_conn
from fabric.treasury.posting_engine import post_balanced_transaction
from fabric.treasury.store import get_account_by_code
from fabric.payouts.store import get_payout_intent


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_tx() -> str:
    return f"tx_{uuid.uuid4().hex[:16]}"


def settle_payout_intent(
    *,
    intent_id: str,
    debit_account_code: str,
    credit_account_code: str,
) -> Dict[str, object]:

    conn = get_conn()

    payout = get_payout_intent(intent_id)

    if not payout:
        raise ValueError("payout intent not found")

    amount_cents = int(payout["amount_cents"])

    debit_account = get_account_by_code(debit_account_code)
    credit_account = get_account_by_code(credit_account_code)

    if not debit_account:
        raise ValueError("debit account not found")

    if not credit_account:
        raise ValueError("credit account not found")

    tx_id = _new_tx()
    ts = _now()

    result = post_balanced_transaction(
        transaction_id=tx_id,
        reference_type="PAYOUT_INTENT",
        reference_id=intent_id,
        memo="Payout settlement",
        created_at=ts,
        entries=[
            {
                "entry_id": f"tent_{uuid.uuid4().hex[:16]}",
                "account_id": debit_account["account_id"],
                "direction": "DEBIT",
                "amount_cents": amount_cents,
            },
            {
                "entry_id": f"tent_{uuid.uuid4().hex[:16]}",
                "account_id": credit_account["account_id"],
                "direction": "CREDIT",
                "amount_cents": amount_cents,
            },
        ],
    )

    conn.execute(
        """
        UPDATE payout_intents
        SET state = 'SETTLED'
        WHERE intent_id = ?
        """,
        (intent_id,),
    )

    conn.commit()

    return {
        "ok": True,
        "intent_id": intent_id,
        "transaction_id": tx_id,
        "amount_cents": amount_cents,
        "state": "SETTLED",
        "treasury": result,
    }
