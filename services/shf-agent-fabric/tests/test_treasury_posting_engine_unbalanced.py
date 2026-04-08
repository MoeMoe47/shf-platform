import uuid
from datetime import datetime, timezone

import pytest

from fabric.treasury.store import create_account
from fabric.treasury.posting_engine import post_balanced_transaction


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def test_treasury_posting_engine_rejects_unbalanced():
    debit_acct = create_account(
        account_code=f"TREASURY_UNBAL_DEBIT_{uuid.uuid4().hex[:6].upper()}",
        name="Treasury Unbalanced Debit Account",
        account_type="OPERATING_CASH",
        currency="USD",
    )

    credit_acct = create_account(
        account_code=f"TREASURY_UNBAL_CREDIT_{uuid.uuid4().hex[:6].upper()}",
        name="Treasury Unbalanced Credit Account",
        account_type="POOL_LIABILITY",
        currency="USD",
    )

    with pytest.raises(ValueError, match="unbalanced transaction"):
        post_balanced_transaction(
            transaction_id=f"tx_{uuid.uuid4().hex[:16]}",
            reference_type="PAYOUT_INTENT",
            reference_id="pi_test_bad_001",
            memo="Unbalanced treasury smoke test",
            created_at=_now(),
            entries=[
                {
                    "entry_id": f"tent_{uuid.uuid4().hex[:16]}",
                    "account_id": debit_acct["account_id"],
                    "direction": "DEBIT",
                    "amount_cents": 25000,
                },
                {
                    "entry_id": f"tent_{uuid.uuid4().hex[:16]}",
                    "account_id": credit_acct["account_id"],
                    "direction": "CREDIT",
                    "amount_cents": 20000,
                },
            ],
        )
