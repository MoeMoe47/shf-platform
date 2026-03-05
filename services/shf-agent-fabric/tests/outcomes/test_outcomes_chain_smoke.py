from __future__ import annotations

from fastapi.testclient import TestClient
from main import app

def test_outcomes_chain_roundtrip():
    c = TestClient(app)

    payload = {
        "idempotency_key": "subm:chain:participant1:JOB_90D:2026-03-05",
        "participant_id": "participant1",
        "program_id": "program1",
        "outcome_type": "JOB_90D",
        "artifact_ids": ["x", "y"],
        "evidence_root_hash": "b"*64,
    }
    r = c.post("/api/v1/outcomes/submit", json=payload)
    assert r.status_code == 200
    submission_id = r.json()["submission_id"]

    v = c.post(f"/api/v1/outcomes/verify/{submission_id}")
    assert v.status_code == 200
    vj = v.json()
    assert vj["ok"] is True
    assert "funding_event" in vj

    ch = c.get(f"/api/v1/outcomes/chain/{submission_id}")
    assert ch.status_code == 200
    chj = ch.json()
    assert chj["ok"] is True
    assert chj["submission"]["submission_id"] == submission_id
    assert chj["replay"]["outcomes"]["match"] is True
    # funding replay may be None if journal missing, but in MVP it should exist
    assert chj["replay"]["funding_event"] is not None
    assert chj["replay"]["funding_event"]["match"] is True
