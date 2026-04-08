import uuid

from fabric.payouts.store import create_payout_intent
from fabric.payouts.settlement_engine import settle_payout_intent
from fabric.treasury.store import create_account


def test_payout_settlement_engine_smoke():

    debit_acct = create_account(
        account_code=f"TREASURY_DEBIT_{uuid.uuid4().hex[:6]}",
        name="Treasury Cash",
        account_type="OPERATING_CASH",
    )

    credit_acct = create_account(
        account_code=f"TREASURY_CREDIT_{uuid.uuid4().hex[:6]}",
        name="Program Liability",
        account_type="POOL_LIABILITY",
    )

    payout = create_payout_intent(
        credit_id="credit_test_1",
        destination="bank_account_test",
        amount_cents=15000,
    )

    result = settle_payout_intent(
        intent_id=payout["intent_id"],
        debit_account_code=debit_acct["account_code"],
        credit_account_code=credit_acct["account_code"],
    )

    assert result["ok"] is True
    assert result["amount_cents"] == 15000
    assert result["state"] == "SETTLED"
