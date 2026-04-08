from __future__ import annotations

from fastapi.testclient import TestClient

from main import app


def test_outcomes_proof_smoke():
    c = TestClient(app)

    # 1) submit
    payload = {
        "idempotency_key": "proof-demo-1",
        "participant_id": "participant1",
        "program_id": "program1",
        "outcome_type": "JOB_90D",
        "artifact_ids": [],
        "evidence_root_hash": "a" * 64,
    }
    r = c.post("/api/v1/outcomes/submit", json=payload)
    assert r.status_code == 200, r.text
    submission_id = r.json()["submission_id"]

    # 2) verify (creates decision + credit + payout intent + funding bridge)
    r = c.post(f"/api/v1/outcomes/verify/{submission_id}")
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["ok"] is True
    assert j["decision"]["submission_id"] == submission_id

    # 3) proof
    r = c.get(f"/api/v1/outcomes/proof/{submission_id}")
    assert r.status_code == 200, r.text
    proof = r.json()

    assert proof["ok"] is True
    assert proof["schema_version"] == "OUTCOMES_PROOF_V1"
    assert proof["submission_id"] == submission_id

    # Must contain the chain elements
    assert proof["submission"]["submission_id"] == submission_id
    assert proof["decision"]["submission_id"] == submission_id
    assert "policy" in proof
    assert "ruleset_sha256" in proof["policy"]
    assert "manifest_fingerprint" in proof["policy"]

    # Replay checks should be present
    assert "replay" in proof
    assert proof["replay"]["outcomes"]["submission_id"] == submission_id
