from fastapi.testclient import TestClient
from main import app

def test_outcomes_proof_sign_smoke():
    c = TestClient(app)

    # Create submission
    sub = c.post("/api/v1/outcomes/submit", json={
        "idempotency_key": "proof-sign-smoke-1",
        "participant_id": "p1",
        "program_id": "program1",
        "outcome_type": "JOB_90D",
        "artifact_ids": [],
        "evidence_root_hash": "a"*64
    }).json()

    sid = sub["submission_id"]

    # Verify (required to build chain)
    vr = c.post(f"/api/v1/outcomes/verify/{sid}")
    assert vr.status_code == 200, vr.text

    # Proof should exist
    pr = c.get(f"/api/v1/outcomes/proof/{sid}")
    assert pr.status_code == 200, pr.text

    # Signed proof should exist
    sr = c.post(f"/api/v1/outcomes/proof/{sid}/sign")
    assert sr.status_code == 200, sr.text
    body = sr.json()
    assert body["ok"] is True
    assert body["schema_version"] == "OUTCOMES_PROOF_SIGNATURE_V1"
    assert body["algorithm"] == "HMAC-SHA256"
    assert isinstance(body["signature"], str) and len(body["signature"]) >= 32
    assert body["submission_id"] == sid
    assert "proof" in body
