import uuid
from datetime import datetime, timezone

from fabric.treasury.store import create_account, list_entries_by_account
from fabric.treasury.posting_engine import post_balanced_transaction


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def test_treasury_posting_engine_smoke():
    debit_acct = create_account(
        account_code=f"TREASURY_DEBIT_{uuid.uuid4().hex[:6].upper()}",
        name="Treasury Debit Account",
        account_type="OPERATING_CASH",
        currency="USD",
    )

    credit_acct = create_account(
        account_code=f"TREASURY_CREDIT_{uuid.uuid4().hex[:6].upper()}",
        name="Treasury Credit Account",
        account_type="POOL_LIABILITY",
        currency="USD",
    )

    tx_id = f"tx_{uuid.uuid4().hex[:16]}"
    ts = _now()

    result = post_balanced_transaction(
        transaction_id=tx_id,
        reference_type="PAYOUT_INTENT",
        reference_id="pi_test_001",
        memo="Balanced treasury smoke test",
        created_at=ts,
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
                "amount_cents": 25000,
            },
        ],
    )

    assert result["ok"] is True
    assert result["debit_total"] == 25000
    assert result["credit_total"] == 25000
    assert result["entry_count"] == 2

    debit_rows = list_entries_by_account(debit_acct["account_id"])
    credit_rows = list_entries_by_account(credit_acct["account_id"])

    assert len(debit_rows) >= 1
    assert len(credit_rows) >= 1
    assert debit_rows[0]["direction"] == "DEBIT"
    assert credit_rows[0]["direction"] == "CREDIT"
