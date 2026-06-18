from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def _complete_candidate() -> dict:
    return {
        "candidate": {
            "candidate_id": "approval_candidate_test_ready",
            "canonical_type": "metric",
            "truth_spine_status": "verified",
            "oracle_supportability": "supportable",
            "data_verification_status": "ready_for_truth_spine",
            "evidence_refs": [{"ref_id": "row_1", "title": "CSV row", "uri": "local://source.csv"}],
            "provenance": {"source_id": "source_metric", "source_url": "local://source.csv"},
        }
    }


def test_data_approval_openapi_routes_exist():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/data-approval/health",
        "/data-approval/schema",
        "/data-approval/summary",
        "/data-approval/evaluate",
        "/data-approval/batch-evaluate",
        "/data-approval/readiness",
    ):
        assert route in paths


def test_data_approval_health_schema_summary_readiness():
    client = _client()
    health = client.get("/data-approval/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True
    assert health.json()["status"] == "formalized_v1"

    schema = client.get("/data-approval/schema").json()
    assert "public_approved" in schema["approval_fields"]
    assert "mutated_public_data" in schema["approval_fields"]

    summary = client.get("/data-approval/summary").json()
    assert summary["public_approved_count"] == 0
    assert summary["mutated_public_data_count"] == 0
    assert summary["approves_public_data"] is False
    assert summary["mutates_shf_impact_data"] is False
    assert summary["requires_gateway_review"] is True

    readiness = client.get("/data-approval/readiness").json()
    assert readiness["public_approved_count"] == 0
    assert readiness["mutated_public_data_count"] == 0


def test_data_approval_complete_candidate_gateway_ready_not_public_approved():
    client = _client()
    response = client.post("/data-approval/evaluate", json=_complete_candidate())
    assert response.status_code == 200, response.text
    result = response.json()
    approval = result["approval"]
    assert approval["approval_state"] == "gateway_ready"
    assert result["ready_for_data_approval_gateway"] is True
    assert result["public_approved"] is False
    assert result["mutated_public_data"] is False
    assert approval["public_approved"] is False
    assert approval["mutated_public_data"] is False


def test_data_approval_missing_truth_spine_status_blocks():
    client = _client()
    payload = _complete_candidate()
    payload["candidate"]["truth_spine_status"] = ""
    response = client.post("/data-approval/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["ready_for_data_approval_gateway"] is False
    assert "missing_truth_spine_status" in result["blockers"]
    assert result["public_approved"] is False


def test_data_approval_oracle_unsupported_blocks():
    client = _client()
    payload = _complete_candidate()
    payload["candidate"]["oracle_supportability"] = "unsupported"
    response = client.post("/data-approval/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["ready_for_data_approval_gateway"] is False
    assert "oracle_unsupported" in result["blockers"]
    assert result["mutated_public_data"] is False


def test_data_approval_missing_data_verification_needs_review():
    client = _client()
    payload = _complete_candidate()
    payload["candidate"]["data_verification_status"] = ""
    response = client.post("/data-approval/evaluate", json=payload)
    assert response.status_code == 200, response.text
    approval = response.json()["approval"]
    assert approval["approval_state"] == "needs_review"
    assert approval["ready_for_data_approval_gateway"] is False
    assert "missing_data_verification_status" in approval["warnings"]


def test_data_approval_batch_counts_and_no_direct_authority():
    client = _client()
    missing_truth = _complete_candidate()
    missing_truth["candidate"]["truth_spine_status"] = ""
    missing_verification = _complete_candidate()
    missing_verification["candidate"]["candidate_id"] = "approval_candidate_review"
    missing_verification["candidate"]["data_verification_status"] = ""
    response = client.post(
        "/data-approval/batch-evaluate",
        json={"records": [_complete_candidate(), missing_truth, missing_verification]},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["total"] == 3
    assert result["gateway_ready"] == 1
    assert result["blocked"] == 1
    assert result["needs_review"] == 1
    assert result["public_approved_count"] == 0
    assert result["mutated_public_data_count"] == 0
    assert all(item["public_approved"] is False for item in result["evaluations"])
    assert all(item["mutated_public_data"] is False for item in result["evaluations"])
