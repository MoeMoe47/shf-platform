from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def _complete_sync_payload() -> dict:
    return {
        "warehouse_sync": {
            "sync_review_id": "warehouse_sync_test",
            "record_id": "record-001",
            "source_layer": "data_approval",
            "source_system": "SHF Impact",
            "target_domain": "analytics",
            "data_classification": "internal",
            "schema_profile": "analytics_v1",
            "mapping_profile": "analytics_mapping_v1",
            "audit_ref": "audit-001",
            "security_privacy_status": "clear",
            "ownership_ip_status": "clear",
            "approval_status": "approved",
        }
    }


def _foundation_payload() -> dict:
    payload = _complete_sync_payload()
    payload["warehouse_sync"]["target_domain"] = "foundation_impact"
    payload["warehouse_sync"]["data_classification"] = "public"
    payload["warehouse_sync"]["public_approval_status"] = "public_ready_candidate"
    return payload


def _private_ops_payload() -> dict:
    payload = _complete_sync_payload()
    payload["warehouse_sync"]["target_domain"] = "ops"
    payload["warehouse_sync"]["data_classification"] = "private"
    payload["warehouse_sync"]["source_system"] = "SHS ClientOps"
    return payload


def test_warehouse_sync_openapi_routes_exist():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/warehouse-sync/health",
        "/warehouse-sync/schema",
        "/warehouse-sync/summary",
        "/warehouse-sync/evaluate",
        "/warehouse-sync/batch-evaluate",
        "/warehouse-sync/readiness",
    ):
        assert route in paths


def test_warehouse_sync_health_schema_summary_readiness():
    client = _client()
    health = client.get("/warehouse-sync/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True
    assert health.json()["status"] == "formalized_v1"

    schema = client.get("/warehouse-sync/schema").json()
    assert "analytics" in schema["target_domains"]
    assert "private" in schema["data_classifications"]
    assert "warehouse_write_performed" in schema["result_fields"]

    summary = client.get("/warehouse-sync/summary").json()
    assert summary["warehouse_write_performed_count"] == 0
    assert summary["external_call_made_count"] == 0
    assert summary["export_created_count"] == 0
    assert summary["truth_verified_count"] == 0
    assert summary["public_approved_count"] == 0
    assert summary["mutated_public_data_count"] == 0
    assert summary["published_report_count"] == 0
    assert summary["writes_warehouse"] is False
    assert summary["calls_external_systems"] is False
    assert summary["creates_exports"] is False
    assert summary["replaces_reports"] is False
    assert summary["replaces_watchtower"] is False
    assert summary["replaces_batch_import"] is False
    assert summary["replaces_adapter_layer"] is False
    assert summary["replaces_data_approval_gateway"] is False

    readiness = client.get("/warehouse-sync/readiness").json()
    assert readiness["warehouse_write_performed_count"] == 0
    assert readiness["writes_warehouse"] is False


def test_warehouse_sync_missing_sync_review_id_blocks():
    client = _client()
    payload = _complete_sync_payload()
    payload["warehouse_sync"]["sync_review_id"] = ""
    result = client.post("/warehouse-sync/evaluate", json=payload).json()
    assert result["warehouse_sync"]["sync_status"] == "blocked"
    assert "missing_sync_review_id" in result["blockers"]
    assert result["sync_ready"] is False


def test_warehouse_sync_missing_record_id_blocks():
    client = _client()
    payload = _complete_sync_payload()
    payload["warehouse_sync"]["record_id"] = ""
    result = client.post("/warehouse-sync/evaluate", json=payload).json()
    assert result["warehouse_sync"]["sync_status"] == "blocked"
    assert "missing_record_id" in result["blockers"]


def test_warehouse_sync_restricted_data_classification_blocks():
    client = _client()
    payload = _complete_sync_payload()
    payload["warehouse_sync"]["data_classification"] = "restricted"
    result = client.post("/warehouse-sync/evaluate", json=payload).json()
    assert result["warehouse_sync"]["sync_status"] == "blocked"
    assert "restricted_data_classification" in result["blockers"]


def test_warehouse_sync_complete_safe_candidate_can_be_ready():
    client = _client()
    result = client.post("/warehouse-sync/evaluate", json=_complete_sync_payload()).json()
    assert result["warehouse_sync"]["sync_status"] == "sync_ready"
    assert result["sync_ready"] is True
    assert result["warehouse_write_performed"] is False
    assert result["external_call_made"] is False
    assert result["export_created"] is False
    assert result["truth_verified"] is False
    assert result["public_approved"] is False
    assert result["mutated_public_data"] is False
    assert result["published_report"] is False


def test_warehouse_sync_foundation_impact_requires_public_approval_candidate_context():
    client = _client()
    payload = _foundation_payload()
    payload["warehouse_sync"]["public_approval_status"] = ""
    result = client.post("/warehouse-sync/evaluate", json=payload).json()
    assert result["warehouse_sync"]["sync_status"] == "needs_review"
    assert "public_target_requires_public_approval_candidate_context" in result["warnings"]
    assert result["public_approved"] is False


def test_warehouse_sync_private_data_does_not_become_public():
    client = _client()
    private_ready = client.post("/warehouse-sync/evaluate", json=_private_ops_payload()).json()
    assert private_ready["warehouse_sync"]["target_domain"] == "ops"
    assert private_ready["warehouse_sync"]["data_classification"] == "private"
    assert private_ready["sync_ready"] is True
    assert private_ready["public_approved"] is False

    public_private = _private_ops_payload()
    public_private["warehouse_sync"]["target_domain"] = "foundation_impact"
    result = client.post("/warehouse-sync/evaluate", json=public_private).json()
    assert result["warehouse_sync"]["sync_status"] == "needs_review"
    assert "private_data_target_requires_review" in result["warnings"]
    assert result["public_approved"] is False


def test_warehouse_sync_batch_counts_and_no_replacement_authority():
    client = _client()
    missing = _complete_sync_payload()
    missing["warehouse_sync"]["sync_review_id"] = ""
    response = client.post(
        "/warehouse-sync/batch-evaluate",
        json={"records": [_complete_sync_payload(), _foundation_payload(), missing]},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["total_sync_reviews"] == 3
    assert result["sync_ready"] == 2
    assert result["blocked"] == 1
    assert result["warehouse_write_performed_count"] == 0
    assert result["external_call_made_count"] == 0
    assert result["export_created_count"] == 0
    assert result["truth_verified_count"] == 0
    assert result["public_approved_count"] == 0
    assert result["mutated_public_data_count"] == 0
    assert result["published_report_count"] == 0
    assert all(item["warehouse_write_performed"] is False for item in result["evaluations"])
    assert all(item["export_created"] is False for item in result["evaluations"])


def test_warehouse_sync_reports_and_watchtower_visibility():
    client = _client()
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        reports = client.get("/reports/snapshot").json()
        watchtower = client.get("/watchtower/summary").json()
    assert "warehouse_sync" in reports
    assert "warehouse_sync" in watchtower
    assert reports["warehouse_sync"]["warehouse_write_performed_count"] == 0
    assert watchtower["warehouse_sync"]["writes_warehouse"] is False
