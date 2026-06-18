from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def test_data_normalization_openapi_routes_exist():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/data-normalization/health",
        "/data-normalization/schema",
        "/data-normalization/summary",
        "/data-normalization/normalize",
        "/data-normalization/batch-normalize",
    ):
        assert route in paths


def test_data_normalization_health_and_schema():
    client = _client()
    health_response = client.get("/data-normalization/health")
    assert health_response.status_code == 200, health_response.text
    assert health_response.json()["ok"] is True
    assert health_response.json()["status"] == "formalized_v1"

    schema_response = client.get("/data-normalization/schema")
    assert schema_response.status_code == 200, schema_response.text
    schema = schema_response.json()
    assert "county" in schema["supported_canonical_types"]
    assert "county_name" in schema["alias_groups"]
    assert "source_url" in schema["alias_groups"]


def test_data_normalization_full_provenance_ready_for_review_not_public():
    client = _client()
    response = client.post(
        "/data-normalization/normalize",
        json={
            "countyName": "Licking",
            "metricName": "students_served",
            "metricValue": "2,810",
            "sourceName": "Foundation sample CSV",
            "sourceUrl": "local://foundation-sample.csv",
            "provenance": "local://foundation-sample",
            "input_type": "metric",
        },
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["canonical_type"] == "metric"
    assert result["normalized_record"]["county_name"] == "Licking"
    assert result["normalized_record"]["value"] == 2810
    assert result["ready_for_evidence_package"] is True
    assert result["ready_for_truth_spine"] is True
    assert result["ready_for_public_approval"] is False
    assert result["verifies_truth"] is False
    assert result["approves_public_data"] is False


def test_data_normalization_missing_provenance_blocks_readiness():
    client = _client()
    response = client.post(
        "/data-normalization/normalize",
        json={
            "programName": "Digital Access",
            "metricName": "participants",
            "metricValue": 25,
        },
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["ready_for_evidence_package"] is False
    assert result["ready_for_truth_spine"] is False
    assert result["ready_for_public_approval"] is False
    assert "missing_source_name" in result["warnings"]
    assert "missing_source_url" in result["blockers"]


def test_data_normalization_batch_counts_and_no_public_authority():
    client = _client()
    response = client.post(
        "/data-normalization/batch-normalize",
        json={
            "records": [
                {
                    "county": "Coshocton",
                    "sourceName": "County source",
                    "sourceUrl": "local://county-source",
                    "provenance": "local://county-source",
                },
                {
                    "story": "Missing source story",
                },
            ]
        },
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["total"] == 2
    assert result["normalized"] == 2
    assert result["blocked"] == 1
    assert result["ready_for_evidence_package"] == 1
    assert result["ready_for_truth_spine"] == 1
    assert result["ready_for_public_approval"] == 0
    assert all(item["ready_for_public_approval"] is False for item in result["records"])


def test_data_normalization_summary_no_truth_or_public_approval_authority():
    client = _client()
    response = client.get("/data-normalization/summary")
    assert response.status_code == 200, response.text
    summary = response.json()
    assert summary["ready_for_public_approval"] == 0
    assert summary["verifies_truth"] is False
    assert summary["approves_public_data"] is False
