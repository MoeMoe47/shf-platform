from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def _complete_batch_payload() -> dict:
    return {
        "batch_import": {
            "batch_id": "batch_test_csv",
            "batch_name": "Partner CSV",
            "source_system": "Partner Dataset",
            "source_system_type": "partner_feed",
            "import_type": "csv",
            "input_format": "csv",
            "record_count": 25,
            "mapping_profile": "partner_feed_record",
            "source_metadata": {"source_name": "Partner"},
            "provenance": {"submitted_by": "partner"},
        }
    }


def _clientops_batch_payload() -> dict:
    return {
        "batch_import": {
            "batch_id": "batch_clientops_test",
            "batch_name": "ClientOps Export",
            "source_system": "SHS ClientOps",
            "source_system_type": "clientops",
            "import_type": "json",
            "input_format": "inline_records",
            "records": [{"source_id": "clientops-1", "canonical_type": "client_record"}],
            "mapping_profile": "shs_clientops_record",
            "source_metadata": {"source_name": "ClientOps"},
            "provenance": {"exported_by": "shs_clientops"},
        }
    }


def test_batch_import_openapi_routes_exist():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/batch-import/health",
        "/batch-import/schema",
        "/batch-import/summary",
        "/batch-import/evaluate",
        "/batch-import/batch-evaluate",
        "/batch-import/readiness",
    ):
        assert route in paths


def test_batch_import_health_schema_summary_readiness():
    client = _client()
    health = client.get("/batch-import/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True
    assert health.json()["status"] == "formalized_v1"

    schema = client.get("/batch-import/schema").json()
    assert "clientops" in schema["source_system_types"]
    assert "csv" in schema["import_types"]
    assert "inline_records" in schema["input_formats"]
    assert "records_written" in schema["result_fields"]

    summary = client.get("/batch-import/summary").json()
    assert summary["records_written_count"] == 0
    assert summary["external_call_made_count"] == 0
    assert summary["normalized_final_count"] == 0
    assert summary["truth_verified_count"] == 0
    assert summary["public_approved_count"] == 0
    assert summary["mutated_public_data_count"] == 0
    assert summary["published_report_count"] == 0
    assert summary["writes_records"] is False
    assert summary["calls_external_systems"] is False
    assert summary["replaces_adapter_layer"] is False
    assert summary["replaces_source_registry"] is False
    assert summary["replaces_data_aggregator"] is False
    assert summary["replaces_data_normalization"] is False

    readiness = client.get("/batch-import/readiness").json()
    assert readiness["records_written_count"] == 0
    assert readiness["writes_records"] is False


def test_batch_import_missing_batch_id_blocks():
    client = _client()
    payload = _complete_batch_payload()
    payload["batch_import"]["batch_id"] = ""
    result = client.post("/batch-import/evaluate", json=payload).json()
    assert result["batch_import"]["batch_status"] == "blocked"
    assert "missing_batch_id" in result["blockers"]
    assert result["import_ready"] is False


def test_batch_import_missing_source_system_blocks():
    client = _client()
    payload = _complete_batch_payload()
    payload["batch_import"]["source_system"] = ""
    result = client.post("/batch-import/evaluate", json=payload).json()
    assert result["batch_import"]["batch_status"] == "blocked"
    assert "missing_source_system" in result["blockers"]


def test_batch_import_missing_import_type_blocks():
    client = _client()
    payload = _complete_batch_payload()
    payload["batch_import"]["import_type"] = ""
    result = client.post("/batch-import/evaluate", json=payload).json()
    assert result["batch_import"]["batch_status"] == "blocked"
    assert "missing_import_type" in result["blockers"]


def test_batch_import_zero_record_count_without_records_blocks():
    client = _client()
    payload = _complete_batch_payload()
    payload["batch_import"]["record_count"] = 0
    result = client.post("/batch-import/evaluate", json=payload).json()
    assert result["batch_import"]["batch_status"] == "blocked"
    assert "missing_records" in result["blockers"]


def test_batch_import_complete_csv_batch_can_be_ready():
    client = _client()
    result = client.post("/batch-import/evaluate", json=_complete_batch_payload()).json()
    assert result["batch_import"]["batch_status"] == "import_ready"
    assert result["import_ready"] is True
    assert result["records_written"] is False
    assert result["external_call_made"] is False
    assert result["normalized_final"] is False
    assert result["truth_verified"] is False
    assert result["public_approved"] is False
    assert result["mutated_public_data"] is False
    assert result["published_report"] is False


def test_batch_import_inline_bad_rows_can_be_quarantined():
    client = _client()
    payload = _clientops_batch_payload()
    payload["batch_import"]["records"] = [
        {"source_id": "clientops-1", "canonical_type": "client_record"},
        {"display_name": "Missing source identity"},
        {"source_name": "Sensitive row", "ssn": "000-00-0000"},
    ]
    result = client.post("/batch-import/evaluate", json=payload).json()
    assert result["batch_import"]["batch_status"] == "blocked"
    assert result["batch_import"]["record_count"] == 3
    assert result["batch_import"]["accepted_record_count"] == 2
    assert result["batch_import"]["quarantined_record_count"] == 1
    assert result["batch_import"]["row_warning_count"] == 1
    assert result["batch_import"]["row_blocker_count"] == 1
    assert "quarantine_required" in result["warnings"]


def test_batch_import_shs_clientops_treated_operational_private():
    client = _client()
    result = client.post("/batch-import/evaluate", json=_clientops_batch_payload()).json()
    assert result["batch_import"]["source_system_type"] == "clientops"
    assert result["batch_import"]["target_layer"] == "adapter_layer"
    assert "shs_operational_private_by_default" in result["warnings"]
    assert "requires_downstream_shs_to_shf_governance" in result["warnings"]
    assert result["records_written"] is False


def test_batch_import_batch_counts_and_no_replacement_authority():
    client = _client()
    missing = _complete_batch_payload()
    missing["batch_import"]["batch_id"] = ""
    response = client.post(
        "/batch-import/batch-evaluate",
        json={"records": [_complete_batch_payload(), _clientops_batch_payload(), missing]},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["total_batches"] == 3
    assert result["import_ready"] == 2
    assert result["blocked"] == 1
    assert result["records_written_count"] == 0
    assert result["external_call_made_count"] == 0
    assert result["normalized_final_count"] == 0
    assert result["truth_verified_count"] == 0
    assert result["public_approved_count"] == 0
    assert result["mutated_public_data_count"] == 0
    assert result["published_report_count"] == 0
    assert all(item["records_written"] is False for item in result["evaluations"])
    assert all(item["normalized_final"] is False for item in result["evaluations"])


def test_batch_import_reports_and_watchtower_visibility():
    client = _client()
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        reports = client.get("/reports/snapshot").json()
        watchtower = client.get("/watchtower/summary").json()
    assert "batch_import" in reports
    assert "batch_import" in watchtower
    assert reports["batch_import"]["records_written_count"] == 0
    assert watchtower["batch_import"]["writes_records"] is False
