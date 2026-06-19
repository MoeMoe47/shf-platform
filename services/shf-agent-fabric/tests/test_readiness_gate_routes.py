from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def _complete_gate() -> dict:
    return {
        "gate": {
            "gate_id": "gate_test_truth_to_oracle",
            "from_layer": "truth_spine",
            "to_layer": "oracle",
            "subject_id": "claim_test_001",
            "subject_type": "claim",
            "readiness_inputs": {"truth_package_complete": True},
            "audit_ref": "audit/event/claim_test_001",
            "evidence_ref": "evidence/package/claim_test_001",
            "truth_ref": "truth/package/claim_test_001",
        }
    }


def test_readiness_gate_openapi_routes_exist():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/readiness-gate/health",
        "/readiness-gate/schema",
        "/readiness-gate/summary",
        "/readiness-gate/evaluate",
        "/readiness-gate/batch-evaluate",
        "/readiness-gate/readiness",
    ):
        assert route in paths


def test_readiness_gate_health_schema_summary_readiness():
    client = _client()
    health = client.get("/readiness-gate/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True
    assert health.json()["status"] == "formalized_v1"

    schema = client.get("/readiness-gate/schema").json()
    assert "source_registry->data_federation" in schema["supported_transitions"]
    assert "truth_verified" in schema["gate_result_fields"]
    assert "mutated_public_data" in schema["gate_result_fields"]

    summary = client.get("/readiness-gate/summary").json()
    assert summary["truth_verified_count"] == 0
    assert summary["public_approved_count"] == 0
    assert summary["mutated_public_data_count"] == 0
    assert summary["verifies_truth"] is False
    assert summary["approves_public_data"] is False
    assert summary["mutates_shf_impact_data"] is False

    readiness = client.get("/readiness-gate/readiness").json()
    assert readiness["truth_verified_count"] == 0
    assert readiness["public_approved_count"] == 0
    assert readiness["mutated_public_data_count"] == 0


def test_readiness_gate_complete_supported_transition_can_be_ready():
    client = _client()
    response = client.post("/readiness-gate/evaluate", json=_complete_gate())
    assert response.status_code == 200, response.text
    result = response.json()
    gate = result["gate"]
    assert gate["gate_status"] == "ready"
    assert result["can_move_forward"] is True
    assert result["truth_verified"] is False
    assert result["public_approved"] is False
    assert result["mutated_public_data"] is False
    assert gate["truth_verified"] is False
    assert gate["public_approved"] is False
    assert gate["mutated_public_data"] is False


def test_readiness_gate_missing_gate_id_blocks():
    client = _client()
    payload = _complete_gate()
    payload["gate"]["gate_id"] = ""
    response = client.post("/readiness-gate/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert "missing_gate_id" in result["blockers"]
    assert result["can_move_forward"] is False


def test_readiness_gate_missing_from_layer_blocks():
    client = _client()
    payload = _complete_gate()
    payload["gate"]["from_layer"] = ""
    response = client.post("/readiness-gate/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert "missing_from_layer" in result["blockers"]
    assert result["gate"]["gate_status"] == "blocked"


def test_readiness_gate_missing_to_layer_blocks():
    client = _client()
    payload = _complete_gate()
    payload["gate"]["to_layer"] = ""
    response = client.post("/readiness-gate/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert "missing_to_layer" in result["blockers"]
    assert result["gate"]["gate_status"] == "blocked"


def test_readiness_gate_missing_subject_id_blocks():
    client = _client()
    payload = _complete_gate()
    payload["gate"]["subject_id"] = ""
    response = client.post("/readiness-gate/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert "missing_subject_id" in result["blockers"]
    assert result["gate"]["gate_status"] == "blocked"


def test_readiness_gate_unsupported_transition_needs_review():
    client = _client()
    payload = _complete_gate()
    payload["gate"]["from_layer"] = "reports"
    payload["gate"]["to_layer"] = "oracle"
    response = client.post("/readiness-gate/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["gate"]["gate_status"] == "needs_review"
    assert "unsupported_transition" in result["warnings"]
    assert result["can_move_forward"] is False


def test_readiness_gate_required_refs_block_or_review():
    client = _client()
    payload = _complete_gate()
    payload["gate"]["truth_ref"] = ""
    response = client.post("/readiness-gate/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert "missing_truth_ref" in result["blockers"]
    assert result["gate"]["gate_status"] == "blocked"

    approval_payload = {
        "gate": {
            "gate_id": "gate_test_approval_to_gateway",
            "from_layer": "data_approval",
            "to_layer": "data_approval_gateway",
            "subject_id": "candidate_test_001",
            "audit_ref": "audit/event/candidate_test_001",
        }
    }
    review = client.post("/readiness-gate/evaluate", json=approval_payload).json()
    assert review["gate"]["gate_status"] == "needs_review"
    assert "missing_or_review_approval_ref" in review["warnings"]


def test_readiness_gate_batch_counts_and_no_replacement_authority():
    client = _client()
    missing_id = _complete_gate()
    missing_id["gate"]["gate_id"] = ""
    unsupported = _complete_gate()
    unsupported["gate"]["gate_id"] = "gate_test_unsupported"
    unsupported["gate"]["from_layer"] = "watchtower"
    unsupported["gate"]["to_layer"] = "oracle"
    response = client.post(
        "/readiness-gate/batch-evaluate",
        json={"records": [_complete_gate(), missing_id, unsupported]},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["total"] == 3
    assert result["ready"] == 1
    assert result["blocked"] == 1
    assert result["needs_review"] == 1
    assert result["truth_verified_count"] == 0
    assert result["public_approved_count"] == 0
    assert result["mutated_public_data_count"] == 0
    assert all(item["truth_verified"] is False for item in result["evaluations"])
    assert all(item["public_approved"] is False for item in result["evaluations"])
    assert all(item["mutated_public_data"] is False for item in result["evaluations"])
