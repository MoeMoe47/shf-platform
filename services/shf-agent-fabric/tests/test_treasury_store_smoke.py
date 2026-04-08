from fabric.treasury.store import create_account, get_account_by_code, post_entry, list_entries_by_account


def test_treasury_store_smoke():
    acct = create_account(
        account_code="TREASURY_OPS_001",
        name="Treasury Operating Cash",
        account_type="OPERATING_CASH",
        currency="USD",
    )

    assert acct["account_code"] == "TREASURY_OPS_001"

    fetched = get_account_by_code("TREASURY_OPS_001")
    assert fetched is not None
    assert fetched["account_id"] == acct["account_id"]

    entry = post_entry(
        account_id=acct["account_id"],
        direction="DEBIT",
        amount_cents=50000,
        reference_type="POOL",
        reference_id="pool_test_1",
        memo="Initial treasury posting",
    )

    assert entry["direction"] == "DEBIT"
    assert entry["amount_cents"] == 50000

    rows = list_entries_by_account(acct["account_id"])
    assert len(rows) >= 1
    assert rows[0]["account_id"] == acct["account_id"]
