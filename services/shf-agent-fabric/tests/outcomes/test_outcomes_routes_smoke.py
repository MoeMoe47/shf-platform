from fastapi.testclient import TestClient
from main import app

def test_outcomes_submit_and_get():
    c = TestClient(app)
    payload = {
        "idempotency_key": "subm:demo:participant1:JOB_90D:2026-03-05",
        "participant_id": "participant1",
        "program_id": "program1",
        "outcome_type": "JOB_90D",
        "artifact_ids": [],
        "evidence_root_hash": "deadbeef"*8
    }
    r = c.post("/api/v1/outcomes/submit", json=payload)
    assert r.status_code == 200
    subm = r.json()["submission_id"]

    g = c.get(f"/api/v1/outcomes/{subm}")
    assert g.status_code == 200
    assert g.json()["submission_id"] == subm
