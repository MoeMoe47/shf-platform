from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def test_data_aggregator_openapi_routes_exist():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/data-aggregator/health",
        "/data-aggregator/sources",
        "/data-aggregator/intake-queue",
        "/data-aggregator/summary",
        "/data-aggregator/classify",
    ):
        assert route in paths


def test_data_aggregator_health_and_summary_are_formalized_v1():
    client = _client()
    health_response = client.get("/data-aggregator/health")
    assert health_response.status_code == 200, health_response.text
    health = health_response.json()
    assert health["ok"] is True
    assert health["status"] == "formalized_v1"

    summary_response = client.get("/data-aggregator/summary")
    assert summary_response.status_code == 200, summary_response.text
    summary = summary_response.json()
    assert summary["policy_status"] == "formalized_v1"
    assert summary["total_sources"] >= 1
    assert summary["public_approval_eligible_count"] == 0
    assert "Truth Spine" in summary["downstream_targets"]


def test_data_aggregator_classify_blocks_missing_provenance_and_public_approval():
    client = _client()
    response = client.post(
        "/data-aggregator/classify",
        json={
            "source_id": "draft_source",
            "source_type": "report",
            "title": "Draft source without provenance",
            "owner": "Tests",
            "uri": "local://draft",
            "evidence_type": "report",
            "public_approved": True,
        },
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["eligible_for_truth_spine"] is False
    assert result["eligible_for_public_approval"] is False
    assert "missing_provenance" in result["warnings"]
    assert "public_approval_requires_truth_spine" in result["warnings"]


def test_data_aggregator_classify_ready_csv_for_normalization_only():
    client = _client()
    response = client.post(
        "/data-aggregator/classify",
        json={
            "source_id": "csv_ready",
            "source_type": "csv",
            "title": "Ready CSV",
            "owner": "Tests",
            "provenance": "local://ready-csv",
            "uri": "local://ready.csv",
            "schema_hint": "county,participants",
        },
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["eligible_for_truth_spine"] is True
    assert result["ready_for_normalization"] is True
    assert result["eligible_for_public_approval"] is False
    assert result["truth_spine_boundary"].startswith("Data Aggregator gathers")
