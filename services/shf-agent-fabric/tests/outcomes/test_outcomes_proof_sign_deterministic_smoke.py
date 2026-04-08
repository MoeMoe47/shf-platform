from fastapi.testclient import TestClient
from main import app

def test_outcomes_proof_sign_is_deterministic():
    c = TestClient(app)

    # Submit
    body = {
        "idempotency_key": "det-sign-1",
        "participant_id": "p1",
        "program_id": "program1",
        "outcome_type": "JOB_90D",
        "artifact_ids": [],
        "evidence_root_hash": "a" * 64,
    }
    r = c.post("/api/v1/outcomes/submit", json=body, headers={"Idempotency-Key": "det-sign-1"})
    assert r.status_code == 200
    sub_id = r.json()["submission_id"]

    # Verify
    rv = c.post(f"/api/v1/outcomes/verify/{sub_id}")
    assert rv.status_code == 200

    # Sign twice
    s1 = c.post(f"/api/v1/outcomes/proof/{sub_id}/sign")
    s2 = c.post(f"/api/v1/outcomes/proof/{sub_id}/sign")
    assert s1.status_code == 200
    assert s2.status_code == 200

    j1 = s1.json()
    j2 = s2.json()

    assert j1["signature"] == j2["signature"]
    assert j1["proof_sha256"] == j2["proof_sha256"]
