import uuid
from fastapi.testclient import TestClient

from main import app


def test_operator_contract_routes_smoke():
    c = TestClient(app)

    pool = c.post(
        "/api/v1/pools",
        json={
            "name": "Operator Pool",
            "committed_amount": 120000,
            "currency": "USD",
        },
    )
    assert pool.status_code == 200
    pool_id = pool.json()["pool_id"]

    acct_code = f"OP_TREASURY_{uuid.uuid4().hex[:8].upper()}"

    acct = c.post(
        "/api/v1/treasury/accounts",
        json={
            "account_code": acct_code,
            "name": "Operator Treasury",
            "account_type": "OPERATING_CASH",
            "currency": "USD",
        },
    )
    assert acct.status_code == 200

    dispute = c.post(
        "/api/v1/governance/disputes",
        json={
            "reference_type": "PAYOUT_INTENT",
            "reference_id": "pi_operator_test_001",
            "reason": "Operator smoke dispute",
            "opened_by": "operator_user",
        },
    )
    assert dispute.status_code == 200

    summary = c.get("/api/v1/operator/summary")
    assert summary.status_code == 200
    assert summary.json()["ok"] is True

    pools = c.get("/api/v1/operator/pools")
    assert pools.status_code == 200
    assert any(x["pool_id"] == pool_id for x in pools.json()["items"])

    pool_detail = c.get(f"/api/v1/operator/pools/{pool_id}")
    assert pool_detail.status_code == 200
    assert pool_detail.json()["pool"]["pool_id"] == pool_id

    disputes = c.get("/api/v1/operator/disputes")
    assert disputes.status_code == 200
    assert disputes.json()["ok"] is True

    treasury = c.get(f"/api/v1/operator/treasury/accounts/{acct_code}")
    assert treasury.status_code == 200
    assert treasury.json()["ok"] is True
    assert treasury.json()["account"]["account_code"] == acct_code
