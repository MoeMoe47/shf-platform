from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def _traceable_record(record_id: str = "record_ready_001") -> dict:
    return {
        "record_id": record_id,
        "county": "Franklin",
        "participants": 10,
        "source_ref": "source:program:001",
        "audit_ref": "audit:trace:001",
        "truth_spine_status": "verified",
        "oracle_status": "supported",
        "data_approval_status": "gateway_ready",
        "public_approval_status": "public_ready_candidate",
        "security_privacy_status": "public_safe_candidate",
        "data_ownership_ip_status": "ownership_clear_candidate",
        "policy_engine_status": "allowed",
        "audit_verification_status": "audit_ready",
        "readiness_gate_status": "ready",
    }


def _internal_payload() -> dict:
    return {
        "aggregation_id": "agg_internal_test",
        "aggregation_name": "Internal governed summary",
        "aggregation_purpose": "internal_summary",
        "canonical_type": "impact_metric",
        "records": [_traceable_record()],
        "group_by": ["county"],
        "metric_fields": ["participants"],
    }


def _public_payload() -> dict:
    return {
        "aggregation_id": "agg_public_test",
        "aggregation_name": "Public impact candidate summary",
        "aggregation_purpose": "public_impact_candidate",
        "canonical_type": "impact_metric",
        "records": [_traceable_record()],
        "required_status": {
            "truth_spine": "verified",
            "oracle": "supported",
            "data_approval": "gateway_ready",
            "public_approval": "public_ready_candidate",
            "security_privacy": "public_safe_candidate",
            "data_ownership_ip": "ownership_clear_candidate",
            "policy_engine": "allowed",
            "audit_verification": "audit_ready",
        },
        "group_by": ["county"],
        "metric_fields": ["participants"],
    }


def test_verified_aggregation_openapi_routes_exist():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/verified-aggregation/health",
        "/verified-aggregation/schema",
        "/verified-aggregation/summary",
        "/verified-aggregation/evaluate",
        "/verified-aggregation/batch-evaluate",
        "/verified-aggregation/readiness",
    ):
        assert route in paths


def test_verified_aggregation_health_schema_summary_readiness():
    client = _client()
    health = client.get("/verified-aggregation/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True
    assert health.json()["status"] == "formalized_v1"

    schema = client.get("/verified-aggregation/schema").json()
    assert "aggregation_purpose" in schema["request_fields"]
    assert "aggregate_preview" in schema["result_fields"]
    assert "records_written" in schema["result_fields"]

    summary = client.get("/verified-aggregation/summary").json()
    assert summary["records_written_count"] == 0
    assert summary["truth_verified_count"] == 0
    assert summary["public_approved_count"] == 0
    assert summary["mutated_public_data_count"] == 0
    assert summary["published_report_count"] == 0
    assert summary["writes_records"] is False
    assert summary["verifies_truth"] is False
    assert summary["approves_public_data"] is False
    assert summary["mutates_shf_impact_data"] is False
    assert summary["publishes_reports"] is False
    assert summary["replaces_reports"] is False
    assert summary["replaces_data_aggregator"] is False
    assert summary["replaces_data_approval_gateway"] is False

    readiness = client.get("/verified-aggregation/readiness").json()
    assert readiness["records_written_count"] == 0
    assert readiness["public_approved_count"] == 0


def test_verified_aggregation_missing_aggregation_id_blocks():
    client = _client()
    payload = _internal_payload()
    payload["aggregation_id"] = ""
    result = client.post("/verified-aggregation/evaluate", json=payload).json()
    assert "missing_aggregation_id" in result["blockers"]
    assert result["verified_aggregation"]["aggregation_status"] == "blocked"


def test_verified_aggregation_missing_purpose_blocks():
    client = _client()
    payload = _internal_payload()
    payload["aggregation_purpose"] = ""
    result = client.post("/verified-aggregation/evaluate", json=payload).json()
    assert "missing_aggregation_purpose" in result["blockers"]
    assert result["verified_aggregation"]["aggregation_status"] == "blocked"


def test_verified_aggregation_empty_records_blocks():
    client = _client()
    payload = _internal_payload()
    payload["records"] = []
    result = client.post("/verified-aggregation/evaluate", json=payload).json()
    assert "empty_records" in result["blockers"]
    assert result["verified_aggregation"]["aggregation_status"] == "blocked"


def test_internal_traceable_records_can_be_aggregation_ready_and_deterministic():
    client = _client()
    response = client.post("/verified-aggregation/evaluate", json=_internal_payload())
    assert response.status_code == 200, response.text
    result = response.json()
    aggregation = result["verified_aggregation"]
    assert aggregation["aggregation_status"] == "aggregation_ready"
    assert aggregation["aggregation_ready"] is True
    assert aggregation["included_record_count"] == 1
    assert aggregation["excluded_record_count"] == 0
    assert aggregation["aggregate_preview"]["groups"]["county"] == {"Franklin": 1}
    assert aggregation["aggregate_preview"]["metrics"]["participants"] == {"count": 1, "sum": 10.0}
    assert result["records_written"] is False
    assert result["truth_verified"] is False
    assert result["public_approved"] is False
    assert result["mutated_public_data"] is False
    assert result["published_report"] is False


def test_public_impact_missing_public_safety_context_excludes_record():
    client = _client()
    payload = _public_payload()
    payload["records"][0]["public_approval_status"] = ""
    payload["records"][0]["security_privacy_status"] = ""
    payload["records"][0]["data_ownership_ip_status"] = ""
    result = client.post("/verified-aggregation/evaluate", json=payload).json()
    aggregation = result["verified_aggregation"]
    assert aggregation["aggregation_status"] == "needs_review"
    assert aggregation["public_impact_ready_candidate"] is False
    assert aggregation["included_record_count"] == 0
    assert aggregation["excluded_record_count"] == 1
    blockers = aggregation["excluded_records"][0]["blockers"]
    assert "missing_public_approval_context" in blockers
    assert "missing_security_privacy_context" in blockers
    assert "missing_data_ownership_ip_context" in blockers


def test_complete_public_impact_candidate_is_candidate_only_not_public_approved():
    client = _client()
    response = client.post("/verified-aggregation/evaluate", json=_public_payload())
    assert response.status_code == 200, response.text
    result = response.json()
    aggregation = result["verified_aggregation"]
    assert aggregation["aggregation_status"] == "aggregation_ready"
    assert aggregation["public_impact_ready_candidate"] is True
    assert aggregation["public_approved"] is False
    assert aggregation["records_written"] is False
    assert aggregation["mutated_public_data"] is False
    assert aggregation["published_report"] is False


def test_verified_aggregation_batch_counts_and_authority_boundaries():
    client = _client()
    missing_trace = _internal_payload()
    missing_trace["aggregation_id"] = "agg_missing_trace"
    missing_trace["records"] = [{"record_id": "missing_trace", "participants": 2}]
    response = client.post(
        "/verified-aggregation/batch-evaluate",
        json={"records": [_internal_payload(), _public_payload(), missing_trace]},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["total"] == 3
    assert result["aggregation_ready"] == 2
    assert result["needs_review"] == 1
    assert result["records_written_count"] == 0
    assert result["truth_verified_count"] == 0
    assert result["public_approved_count"] == 0
    assert result["mutated_public_data_count"] == 0
    assert result["published_report_count"] == 0
    assert all(item["records_written"] is False for item in result["evaluations"])
    assert all(item["truth_verified"] is False for item in result["evaluations"])
    assert all(item["public_approved"] is False for item in result["evaluations"])


def test_reports_and_watchtower_expose_verified_aggregation_summary():
    client = _client()
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        reports = client.get("/reports/snapshot")
    assert reports.status_code == 200, reports.text
    assert "verified_aggregation" in reports.json()
    assert reports.json()["verified_aggregation"]["records_written_count"] == 0
    assert reports.json()["verified_aggregation"]["replaces_reports"] is False
    assert reports.json()["verified_aggregation"]["replaces_data_aggregator"] is False
    assert reports.json()["verified_aggregation"]["replaces_data_approval_gateway"] is False

    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        watchtower = client.get("/watchtower/summary")
    assert watchtower.status_code == 200, watchtower.text
    assert "verified_aggregation" in watchtower.json()
    assert watchtower.json()["verified_aggregation"]["records_written_count"] == 0
    assert watchtower.json()["verified_aggregation"]["mutates_shf_impact_data"] is False
