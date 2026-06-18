from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def _source(source_id: str, canonical_type: str = "metric", eligible: bool = True) -> dict:
    return {
        "source_id": source_id,
        "source_name": f"Source {source_id}",
        "source_type": "public_record",
        "canonical_type": canonical_type,
        "trust_tier": "high",
        "eligible_for_aggregator": eligible,
    }


def _complete_federation() -> dict:
    return {
        "federation": {
            "federation_id": "fed_test_ready",
            "federation_name": "Ready source group",
            "canonical_type": "metric",
            "sources": [_source("src_test_a"), _source("src_test_b")],
            "lineage": {"parent": "source_registry", "route": "source_registry_to_data_aggregator"},
        }
    }


def test_data_federation_openapi_routes_exist():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/data-federation/health",
        "/data-federation/schema",
        "/data-federation/summary",
        "/data-federation/evaluate",
        "/data-federation/batch-evaluate",
        "/data-federation/readiness",
    ):
        assert route in paths


def test_data_federation_health_schema_summary_readiness():
    client = _client()
    health = client.get("/data-federation/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True
    assert health.json()["status"] == "formalized_v1"

    schema = client.get("/data-federation/schema").json()
    assert "ready_for_truth_spine" in schema["federation_fields"]
    assert "public_approved" in schema["federation_fields"]

    summary = client.get("/data-federation/summary").json()
    assert summary["truth_spine_ready"] == 0
    assert summary["public_approval_ready"] == 0
    assert summary["truth_verified_count"] == 0
    assert summary["public_approved_count"] == 0
    assert summary["verifies_truth"] is False
    assert summary["approves_public_data"] is False
    assert summary["mutates_shf_impact_data"] is False

    readiness = client.get("/data-federation/readiness").json()
    assert readiness["truth_spine_ready"] == 0
    assert readiness["public_approval_ready"] == 0


def test_data_federation_compatible_group_can_be_aggregator_ready_only():
    client = _client()
    response = client.post("/data-federation/evaluate", json=_complete_federation())
    assert response.status_code == 200, response.text
    result = response.json()
    federation = result["federation"]
    assert federation["federation_status"] == "aggregator_ready"
    assert result["ready_for_aggregator"] is True
    assert result["ready_for_truth_spine"] is False
    assert result["ready_for_public_approval"] is False
    assert result["truth_verified"] is False
    assert result["public_approved"] is False


def test_data_federation_missing_federation_id_blocks():
    client = _client()
    payload = _complete_federation()
    payload["federation"]["federation_id"] = ""
    response = client.post("/data-federation/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert "missing_federation_id" in result["blockers"]
    assert result["ready_for_aggregator"] is False


def test_data_federation_missing_sources_blocks():
    client = _client()
    payload = _complete_federation()
    payload["federation"]["sources"] = []
    response = client.post("/data-federation/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert "missing_sources" in result["blockers"]
    assert result["ready_for_aggregator"] is False


def test_data_federation_source_not_eligible_for_aggregator_blocks():
    client = _client()
    payload = _complete_federation()
    payload["federation"]["sources"] = [_source("src_test_a"), _source("src_test_b", eligible=False)]
    response = client.post("/data-federation/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert "source_not_eligible_for_aggregator" in result["blockers"]
    assert result["ready_for_aggregator"] is False
    assert result["truth_verified"] is False


def test_data_federation_batch_counts_and_no_direct_authority():
    client = _client()
    missing_sources = _complete_federation()
    missing_sources["federation"]["federation_id"] = "fed_test_missing_sources"
    missing_sources["federation"]["sources"] = []
    missing_lineage = _complete_federation()
    missing_lineage["federation"]["federation_id"] = "fed_test_missing_lineage"
    missing_lineage["federation"]["lineage"] = {}
    response = client.post(
        "/data-federation/batch-evaluate",
        json={"records": [_complete_federation(), missing_sources, missing_lineage]},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["total"] == 3
    assert result["aggregator_ready"] == 1
    assert result["blocked"] == 1
    assert result["needs_review"] == 1
    assert result["truth_spine_ready"] == 0
    assert result["public_approval_ready"] == 0
    assert all(item["truth_verified"] is False for item in result["evaluations"])
    assert all(item["public_approved"] is False for item in result["evaluations"])
    assert all(item["ready_for_truth_spine"] is False for item in result["evaluations"])
