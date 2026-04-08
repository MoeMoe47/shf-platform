import uuid
from fastapi.testclient import TestClient

from main import app


def test_api_v1_capital_routes_smoke():
    c = TestClient(app)

    pool = c.post(
        "/api/v1/pools",
        json={
            "name": "API Pool",
            "committed_amount": 100000,
            "currency": "USD",
        },
    )
    assert pool.status_code == 200
    pool_id = pool.json()["pool_id"]

    listed = c.get("/api/v1/pools")
    assert listed.status_code == 200
    assert any(x["pool_id"] == pool_id for x in listed.json()["items"])

    acct_code = f"API_TREASURY_{uuid.uuid4().hex[:8].upper()}"

    acct = c.post(
        "/api/v1/treasury/accounts",
        json={
            "account_code": acct_code,
            "name": "API Treasury",
            "account_type": "OPERATING_CASH",
            "currency": "USD",
        },
    )
    assert acct.status_code == 200
    assert acct.json()["account_code"] == acct_code

    dispute = c.post(
        "/api/v1/governance/disputes",
        json={
            "reference_type": "PAYOUT_INTENT",
            "reference_id": "pi_api_test_001",
            "reason": "API smoke dispute",
            "opened_by": "api_user",
        },
    )
    assert dispute.status_code == 200
    assert dispute.json()["state"] == "OPEN"
