from fabric.pools.store import create_pool, get_pool_by_id, list_pools


def test_pools_store_smoke():
    pool = create_pool(
        name="Workforce Pilot Pool",
        committed_amount=250000,
        funder_type="foundation",
        funder_id="funder_001",
        strategy_type="workforce_outcomes",
        currency="USD",
    )

    assert pool["name"] == "Workforce Pilot Pool"
    assert pool["committed_amount"] == 250000
    assert pool["available_amount"] == 250000
    assert pool["reserved_amount"] == 0
    assert pool["deployed_amount"] == 0

    fetched = get_pool_by_id(pool["pool_id"])
    assert fetched is not None
    assert fetched["pool_id"] == pool["pool_id"]
    assert fetched["pool_code"] == pool["pool_code"]

    pools = list_pools()
    assert isinstance(pools, list)
    assert any(x["pool_id"] == pool["pool_id"] for x in pools)
