from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def _complete_json_payload() -> dict:
    return {
        "adapter": {
            "adapter_review_id": "adapter_test_json",
            "source_system": "SHF Next Foundation",
            "source_system_type": "shf_next",
            "input_format": "json",
            "payload_domain": "impact",
            "payload_ref": "foundation/impact",
            "source_metadata": {"source_name": "SHF Next"},
            "provenance": {"submitted_by": "foundation_gateway"},
            "mapping_profile": "shf_next_foundation_record",
        }
    }


def _clientops_payload() -> dict:
    return {
        "adapter": {
            "adapter_review_id": "adapter_clientops_test",
            "source_system": "SHS ClientOps",
            "source_system_type": "clientops",
            "input_format": "json",
            "payload_domain": "client_private",
            "payload_ref": "ops/clientops",
            "source_metadata": {"source_name": "ClientOps"},
            "provenance": {"captured_by": "shs_clientops"},
            "mapping_profile": "shs_clientops_record",
        }
    }


def test_adapter_layer_openapi_routes_exist():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/adapter-layer/health",
        "/adapter-layer/schema",
        "/adapter-layer/summary",
        "/adapter-layer/evaluate",
        "/adapter-layer/batch-evaluate",
        "/adapter-layer/readiness",
    ):
        assert route in paths


def test_adapter_layer_health_schema_summary_readiness():
    client = _client()
    health = client.get("/adapter-layer/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True
    assert health.json()["status"] == "formalized_v1"

    schema = client.get("/adapter-layer/schema").json()
    assert "clientops" in schema["source_system_types"]
    assert "json" in schema["input_formats"]
    assert "shs_clientops_record" in schema["adapter_profiles"]
    assert "external_call_made" in schema["result_fields"]

    summary = client.get("/adapter-layer/summary").json()
    assert summary["external_call_made_count"] == 0
    assert summary["normalized_final_count"] == 0
    assert summary["truth_verified_count"] == 0
    assert summary["public_approved_count"] == 0
    assert summary["mutated_public_data_count"] == 0
    assert summary["published_report_count"] == 0
    assert summary["calls_external_systems"] is False
    assert summary["normalizes_final_data"] is False
    assert summary["replaces_source_registry"] is False
    assert summary["replaces_data_aggregator"] is False
    assert summary["replaces_data_normalization"] is False

    readiness = client.get("/adapter-layer/readiness").json()
    assert readiness["external_call_made_count"] == 0
    assert readiness["normalizes_final_data"] is False


def test_adapter_layer_missing_source_system_blocks():
    client = _client()
    payload = _complete_json_payload()
    payload["adapter"]["source_system"] = ""
    result = client.post("/adapter-layer/evaluate", json=payload).json()
    assert result["adapter"]["adapter_status"] == "blocked"
    assert "missing_source_system" in result["blockers"]
    assert result["adapter_ready"] is False


def test_adapter_layer_missing_source_system_type_blocks():
    client = _client()
    payload = _complete_json_payload()
    payload["adapter"]["source_system_type"] = ""
    result = client.post("/adapter-layer/evaluate", json=payload).json()
    assert result["adapter"]["adapter_status"] == "blocked"
    assert "missing_source_system_type" in result["blockers"]


def test_adapter_layer_missing_input_format_blocks():
    client = _client()
    payload = _complete_json_payload()
    payload["adapter"]["input_format"] = ""
    result = client.post("/adapter-layer/evaluate", json=payload).json()
    assert result["adapter"]["adapter_status"] == "blocked"
    assert "missing_input_format" in result["blockers"]


def test_adapter_layer_shs_clientops_treated_operational_private():
    client = _client()
    result = client.post("/adapter-layer/evaluate", json=_clientops_payload()).json()
    assert result["adapter"]["adapter_profile"] == "shs_clientops_record"
    assert result["adapter"]["payload_domain"] == "client_private"
    assert result["adapter"]["target_layer"] == "security_privacy"
    assert "shs_private_data_rules_apply" in result["warnings"]
    assert "shs_operational_private_by_default" in result["warnings"]
    assert result["external_call_made"] is False
    assert result["normalized_final"] is False


def test_adapter_layer_partner_feed_requires_source_registry():
    client = _client()
    payload = _complete_json_payload()
    payload["adapter"]["source_system"] = "Partner Feed"
    payload["adapter"]["source_system_type"] = "partner_feed"
    payload["adapter"]["input_format"] = "csv"
    payload["adapter"]["mapping_profile"] = "partner_feed_record"
    result = client.post("/adapter-layer/evaluate", json=payload).json()
    assert result["adapter"]["target_layer"] == "source_registry"
    assert "requires_source_registry_evaluation" in result["warnings"]
    assert result["public_approved"] is False


def test_adapter_layer_complete_mapped_json_payload_can_be_ready():
    client = _client()
    result = client.post("/adapter-layer/evaluate", json=_complete_json_payload()).json()
    assert result["adapter"]["adapter_status"] == "adapter_ready"
    assert result["adapter_ready"] is True
    assert result["external_call_made"] is False
    assert result["normalized_final"] is False
    assert result["truth_verified"] is False
    assert result["public_approved"] is False
    assert result["mutated_public_data"] is False
    assert result["published_report"] is False


def test_adapter_layer_batch_counts_and_no_replacement_authority():
    client = _client()
    missing = _complete_json_payload()
    missing["adapter"]["source_system"] = ""
    response = client.post(
        "/adapter-layer/batch-evaluate",
        json={"records": [_complete_json_payload(), _clientops_payload(), missing]},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["total_reviews"] == 3
    assert result["adapter_ready"] == 2
    assert result["blocked"] == 1
    assert result["external_call_made_count"] == 0
    assert result["normalized_final_count"] == 0
    assert result["truth_verified_count"] == 0
    assert result["public_approved_count"] == 0
    assert result["mutated_public_data_count"] == 0
    assert result["published_report_count"] == 0
    assert all(item["external_call_made"] is False for item in result["evaluations"])
    assert all(item["normalized_final"] is False for item in result["evaluations"])


def test_adapter_layer_reports_and_watchtower_visibility():
    client = _client()
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        reports = client.get("/reports/snapshot").json()
        watchtower = client.get("/watchtower/summary").json()
    assert "adapter_layer" in reports
    assert "adapter_layer" in watchtower
    assert reports["adapter_layer"]["external_call_made_count"] == 0
    assert watchtower["adapter_layer"]["calls_external_systems"] is False
