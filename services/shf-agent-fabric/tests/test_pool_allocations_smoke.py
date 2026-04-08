from fabric.pools.store import create_pool
from fabric.pools.allocations_store import reserve_from_pool, get_allocations_by_pool


def test_pool_allocation_smoke():
    pool = create_pool(
        name="Allocation Test Pool",
        committed_amount=100000,
    )

    alloc = reserve_from_pool(
        pool_id=pool["pool_id"],
        credit_id="credit_test_1",
        amount_cents=20000,
    )

    assert alloc["amount_cents"] == 20000
    assert alloc["state"] == "RESERVED"

    rows = get_allocations_by_pool(pool["pool_id"])
    assert len(rows) == 1
    assert rows[0]["credit_id"] == "credit_test_1"
