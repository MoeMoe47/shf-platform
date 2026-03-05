from __future__ import annotations

from fastapi.testclient import TestClient
from main import app

def test_outcomes_verify_and_replay():
    c = TestClient(app)

    # submit
    payload = {
        "idempotency_key": "subm:demo:participant1:JOB_90D:2026-03-05",
        "participant_id": "participant1",
        "program_id": "program1",
        "outcome_type": "JOB_90D",
        "artifact_ids": ["b", "a"],
        "evidence_root_hash": "a"*64,
    }
    r = c.post("/api/v1/outcomes/submit", json=payload)
    assert r.status_code == 200
    submission_id = r.json()["submission_id"]

    # verify (idempotent-safe)
    v1 = c.post(f"/api/v1/outcomes/verify/{submission_id}")
    assert v1.status_code == 200
    data1 = v1.json()
    assert data1["ok"] is True
    assert data1["decision"]["submission_id"] == submission_id

    # verify again -> idempotent True
    v2 = c.post(f"/api/v1/outcomes/verify/{submission_id}")
    assert v2.status_code == 200
    data2 = v2.json()
    assert data2["ok"] is True
    assert data2["decision"]["decision_hash"] == data1["decision"]["decision_hash"]

    # replay should match
    rp = c.get(f"/api/v1/outcomes/replay/{submission_id}")
    assert rp.status_code == 200
    rpj = rp.json()
    assert rpj["ok"] is True
    assert rpj["replay"]["match"] is True
