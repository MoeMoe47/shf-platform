from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_replay_engine_roundtrip():
    r = client.post(
        "/api/funding/decisions",
        json={
            "request": {"amount": 100},
            "response": {"approved": True},
            "ruleset_sha256": "abc",
            "manifest_sha256": "xyz",
        },
    )
    assert r.status_code == 200
    decision_id = r.json()["decision_id"]

    r2 = client.get(f"/api/funding/replay/{decision_id}")
    assert r2.status_code == 200
    doc = r2.json()

    assert doc["deterministic_match"] is True
    assert doc["ruleset_sha256"] == "abc"
    assert doc["manifest_sha256"] == "xyz"
