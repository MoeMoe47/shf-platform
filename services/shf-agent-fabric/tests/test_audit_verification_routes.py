from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def _complete_event() -> dict:
    return {
        "event": {
            "event_id": "audit_event_test_ready",
            "event_type": "truth_review",
            "layer": "Truth Spine",
            "actor": "truth_spine_service",
            "subject_id": "claim_test_001",
            "input_ref": "truth/package/claim_test_001",
            "output_ref": "truth/envelope/claim_test_001",
            "source_refs": [{"ref_id": "source_test_001", "uri": "local://source.json"}],
            "evidence_refs": [{"ref_id": "evidence_test_001", "uri": "local://evidence.json"}],
            "provenance": {"source_id": "source_test_001", "trace": "local://source.json"},
            "decision_before": "draft",
            "decision_after": "verified",
            "timestamp": "2026-01-01T00:00:00Z",
        }
    }


def test_audit_verification_openapi_routes_exist():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/audit-verification/health",
        "/audit-verification/schema",
        "/audit-verification/summary",
        "/audit-verification/evaluate",
        "/audit-verification/batch-evaluate",
        "/audit-verification/readiness",
    ):
        assert route in paths


def test_audit_verification_health_schema_summary_readiness():
    client = _client()
    health = client.get("/audit-verification/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True
    assert health.json()["status"] == "formalized_v1"

    schema = client.get("/audit-verification/schema").json()
    assert "truth_verified" in schema["audit_event_fields"]
    assert "public_approved" in schema["audit_result_fields"]

    summary = client.get("/audit-verification/summary").json()
    assert summary["truth_verified_count"] == 0
    assert summary["public_approved_count"] == 0
    assert summary["verifies_truth"] is False
    assert summary["approves_public_data"] is False
    assert summary["mutates_shf_impact_data"] is False
    assert isinstance(summary["coverage_by_layer"], dict)

    readiness = client.get("/audit-verification/readiness").json()
    assert readiness["truth_verified_count"] == 0
    assert readiness["public_approved_count"] == 0


def test_audit_verification_complete_event_audit_ready_trace_and_replay_ready():
    client = _client()
    response = client.post("/audit-verification/evaluate", json=_complete_event())
    assert response.status_code == 200, response.text
    result = response.json()
    audit = result["audit"]
    assert audit["audit_status"] == "audit_ready"
    assert result["trace_ready"] is True
    assert result["replay_ready"] is True
    assert result["truth_verified"] is False
    assert result["public_approved"] is False
    assert audit["truth_verified"] is False
    assert audit["public_approved"] is False


def test_audit_verification_missing_event_id_blocks():
    client = _client()
    payload = _complete_event()
    payload["event"]["event_id"] = ""
    response = client.post("/audit-verification/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert "missing_event_id" in result["blockers"]
    assert result["trace_ready"] is False


def test_audit_verification_missing_layer_blocks():
    client = _client()
    payload = _complete_event()
    payload["event"]["layer"] = ""
    response = client.post("/audit-verification/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert "missing_layer" in result["blockers"]
    assert result["truth_verified"] is False


def test_audit_verification_missing_event_type_blocks():
    client = _client()
    payload = _complete_event()
    payload["event"]["event_type"] = ""
    response = client.post("/audit-verification/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert "missing_event_type" in result["blockers"]
    assert result["public_approved"] is False


def test_audit_verification_replay_ready_requires_input_and_output_refs():
    client = _client()
    payload = _complete_event()
    payload["event"]["input_ref"] = ""
    response = client.post("/audit-verification/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["trace_ready"] is True
    assert result["replay_ready"] is False


def test_audit_verification_batch_counts_and_no_replacement_authority():
    client = _client()
    missing_event_id = _complete_event()
    missing_event_id["event"]["event_id"] = ""
    missing_actor = _complete_event()
    missing_actor["event"]["event_id"] = "audit_event_needs_review"
    missing_actor["event"]["actor"] = ""
    response = client.post(
        "/audit-verification/batch-evaluate",
        json={"records": [_complete_event(), missing_event_id, missing_actor]},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["total"] == 3
    assert result["audit_ready"] == 1
    assert result["blocked"] == 1
    assert result["needs_review"] == 1
    assert result["truth_verified_count"] == 0
    assert result["public_approved_count"] == 0
    assert all(item["truth_verified"] is False for item in result["evaluations"])
    assert all(item["public_approved"] is False for item in result["evaluations"])
