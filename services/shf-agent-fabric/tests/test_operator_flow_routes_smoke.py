from fastapi.testclient import TestClient

from main import app


def test_operator_flow_routes_smoke():
    c = TestClient(app)

    body = {
        "idempotency_key": "operator-flow-verify-1",
        "participant_id": "p_flow_1",
        "program_id": "program_flow_1",
        "outcome_type": "JOB_90D",
        "artifact_ids": [],
        "evidence_root_hash": "b" * 64,
    }

    r = c.post("/api/v1/outcomes/submit", json=body)
    assert r.status_code == 200
    sid = r.json()["submission_id"]

    v = c.post(f"/api/v1/outcomes/verify/{sid}")
    assert v.status_code == 200

    flow = c.get("/api/v1/operator/flow")
    assert flow.status_code == 200
    data = flow.json()

    assert data["ok"] is True
    assert "flow" in data
    assert "stages" in data["flow"]
    assert isinstance(data["flow"]["stages"], list)
    assert len(data["flow"]["stages"]) >= 5
