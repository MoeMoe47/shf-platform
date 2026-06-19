from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def _complete_candidate() -> dict:
    return {
        "candidate": {
            "candidate_id": "public_candidate_test_ready",
            "canonical_type": "impact_metric",
            "truth_spine_status": "verified",
            "oracle_supportability": "supportable",
            "data_approval_state": "gateway_ready",
            "gateway_status": "review_complete",
            "readiness_gate_status": "ready",
            "evidence_refs": [{"ref_id": "evidence_test_001", "uri": "local://evidence.json"}],
            "provenance": {"source_id": "source_test_001", "trace": "local://source.json"},
            "privacy_review_status": "clear",
            "security_review_status": "clear",
        }
    }


def test_public_approval_openapi_routes_exist():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/public-approval/health",
        "/public-approval/schema",
        "/public-approval/summary",
        "/public-approval/evaluate",
        "/public-approval/batch-evaluate",
        "/public-approval/readiness",
    ):
        assert route in paths


def test_public_approval_health_schema_summary_readiness():
    client = _client()
    health = client.get("/public-approval/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True
    assert health.json()["status"] == "formalized_v1"

    schema = client.get("/public-approval/schema").json()
    assert "public_approved" in schema["result_fields"]
    assert "mutated_public_data" in schema["result_fields"]
    assert "published_report" in schema["result_fields"]

    summary = client.get("/public-approval/summary").json()
    assert summary["public_approved_count"] == 0
    assert summary["mutated_public_data_count"] == 0
    assert summary["published_report_count"] == 0
    assert summary["approves_public_data"] is False
    assert summary["mutates_shf_impact_data"] is False
    assert summary["publishes_reports"] is False
    assert summary["requires_gateway_review"] is True
    assert summary["requires_human_review"] is True
    assert summary["requires_privacy_review"] is True
    assert summary["requires_security_review"] is True

    readiness = client.get("/public-approval/readiness").json()
    assert readiness["public_approved_count"] == 0
    assert readiness["mutated_public_data_count"] == 0
    assert readiness["published_report_count"] == 0


def test_public_approval_complete_candidate_can_be_public_ready_candidate_only():
    client = _client()
    response = client.post("/public-approval/evaluate", json=_complete_candidate())
    assert response.status_code == 200, response.text
    result = response.json()
    approval = result["public_approval"]
    assert approval["public_release_state"] == "public_ready_candidate"
    assert result["ready_for_public_release_candidate"] is True
    assert result["public_approved"] is False
    assert result["mutated_public_data"] is False
    assert result["published_report"] is False
    assert approval["public_approved"] is False
    assert approval["mutated_public_data"] is False
    assert approval["published_report"] is False


def test_public_approval_missing_candidate_id_blocks():
    client = _client()
    payload = _complete_candidate()
    payload["candidate"]["candidate_id"] = ""
    response = client.post("/public-approval/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert "missing_candidate_id" in result["blockers"]
    assert result["public_approval"]["public_release_state"] == "blocked"


def test_public_approval_missing_gateway_status_blocks():
    client = _client()
    payload = _complete_candidate()
    payload["candidate"]["gateway_status"] = ""
    response = client.post("/public-approval/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert "missing_gateway_status" in result["blockers"]
    assert result["ready_for_public_release_candidate"] is False


def test_public_approval_failed_privacy_review_blocks():
    client = _client()
    payload = _complete_candidate()
    payload["candidate"]["privacy_review_status"] = "failed"
    response = client.post("/public-approval/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert "privacy_review_not_clear" in result["blockers"]
    assert result["public_approval"]["public_release_state"] == "blocked"


def test_public_approval_failed_security_review_blocks():
    client = _client()
    payload = _complete_candidate()
    payload["candidate"]["security_review_status"] = "failed"
    response = client.post("/public-approval/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert "security_review_not_clear" in result["blockers"]
    assert result["public_approval"]["public_release_state"] == "blocked"


def test_public_approval_missing_readiness_gate_needs_review():
    client = _client()
    payload = _complete_candidate()
    payload["candidate"]["readiness_gate_status"] = ""
    response = client.post("/public-approval/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["public_approval"]["public_release_state"] == "needs_review"
    assert "missing_readiness_gate_status" in result["warnings"]
    assert result["blockers"] == []


def test_public_approval_batch_counts_and_no_publication_authority():
    client = _client()
    missing_gateway = _complete_candidate()
    missing_gateway["candidate"]["gateway_status"] = ""
    missing_readiness_gate = _complete_candidate()
    missing_readiness_gate["candidate"]["candidate_id"] = "public_candidate_needs_review"
    missing_readiness_gate["candidate"]["readiness_gate_status"] = ""
    response = client.post(
        "/public-approval/batch-evaluate",
        json={"records": [_complete_candidate(), missing_gateway, missing_readiness_gate]},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["total"] == 3
    assert result["public_ready_candidates"] == 1
    assert result["blocked"] == 1
    assert result["needs_review"] == 1
    assert result["public_approved_count"] == 0
    assert result["mutated_public_data_count"] == 0
    assert result["published_report_count"] == 0
    assert all(item["public_approved"] is False for item in result["evaluations"])
    assert all(item["mutated_public_data"] is False for item in result["evaluations"])
    assert all(item["published_report"] is False for item in result["evaluations"])
