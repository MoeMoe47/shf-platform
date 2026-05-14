from fastapi.testclient import TestClient
from main import app

def test_proof_signature_verification():
    c = TestClient(app)

    body = {
        "idempotency_key": "verify-signature-1",
        "participant_id": "p1",
        "program_id": "program1",
        "outcome_type": "JOB_90D",
        "artifact_ids": [],
        "evidence_root_hash": "a"*64
    }

    r = c.post("/api/v1/outcomes/submit", json=body)
    assert r.status_code == 200
    sid = r.json()["submission_id"]

    c.post(f"/api/v1/outcomes/verify/{sid}")

    s = c.post(f"/api/v1/outcomes/proof/{sid}/sign")
    assert s.status_code == 200

    v = c.post(f"/api/v1/outcomes/proof/{sid}/verify-signature")
    assert v.status_code == 200
    assert v.json()["match"] is True
