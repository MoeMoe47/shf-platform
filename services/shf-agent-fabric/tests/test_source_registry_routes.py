from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def _official_source() -> dict:
    return {
        "source": {
            "source_id": "src_test_public_record",
            "source_name": "Official public record",
            "source_type": "public_record",
            "owner": "Public Records Office",
            "submitted_by": "Data Ops",
            "source_url": "https://example.invalid/public-record",
            "provenance": {"publisher": "Public Records Office", "retrieved_at": "2026-01-01"},
        }
    }


def test_source_registry_openapi_routes_exist():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/source-registry/health",
        "/source-registry/schema",
        "/source-registry/summary",
        "/source-registry/sources",
        "/source-registry/evaluate",
        "/source-registry/batch-evaluate",
        "/source-registry/readiness",
    ):
        assert route in paths


def test_source_registry_health_schema_summary_sources_readiness():
    client = _client()
    health = client.get("/source-registry/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True
    assert health.json()["status"] == "formalized_v1"

    schema = client.get("/source-registry/schema").json()
    assert "truth_verified" in schema["source_fields"]
    assert "public_approved" in schema["source_fields"]

    summary = client.get("/source-registry/summary").json()
    assert summary["truth_verified_count"] == 0
    assert summary["public_approved_count"] == 0
    assert summary["verifies_truth"] is False
    assert summary["approves_public_data"] is False
    assert summary["mutates_shf_impact_data"] is False

    sources = client.get("/source-registry/sources").json()
    assert len(sources["sources"]) >= 1

    readiness = client.get("/source-registry/readiness").json()
    assert readiness["truth_verified_count"] == 0
    assert readiness["public_approved_count"] == 0


def test_source_registry_official_source_can_be_eligible_without_truth_or_public_approval():
    client = _client()
    response = client.post("/source-registry/evaluate", json=_official_source())
    assert response.status_code == 200, response.text
    result = response.json()
    source = result["source"]
    assert source["eligible_for_aggregator"] is True
    assert source["eligible_for_evidence_package"] is True
    assert source["eligible_for_truth_spine"] is True
    assert source["eligible_for_public_approval_consideration"] is True
    assert result["truth_verified"] is False
    assert result["public_approved"] is False
    assert source["truth_verified"] is False
    assert source["public_approved"] is False


def test_source_registry_missing_source_id_blocks():
    client = _client()
    payload = _official_source()
    payload["source"]["source_id"] = ""
    response = client.post("/source-registry/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert "missing_source_id" in result["blockers"]
    assert result["public_approved"] is False


def test_source_registry_missing_provenance_blocks_evidence_and_truth_eligibility():
    client = _client()
    payload = _official_source()
    payload["source"]["provenance"] = {}
    response = client.post("/source-registry/evaluate", json=payload)
    assert response.status_code == 200, response.text
    source = response.json()["source"]
    assert "missing_provenance" in source["warnings"]
    assert source["eligible_for_aggregator"] is True
    assert source["eligible_for_evidence_package"] is False
    assert source["eligible_for_truth_spine"] is False
    assert source["eligible_for_public_approval_consideration"] is False


def test_source_registry_unknown_source_type_is_intake_quarantine_only():
    client = _client()
    response = client.post(
        "/source-registry/evaluate",
        json={
            "source": {
                "source_id": "src_unknown_test",
                "source_name": "Unclassified source",
                "source_type": "mystery",
                "submitted_by": "Data Ops",
            }
        },
    )
    assert response.status_code == 200, response.text
    source = response.json()["source"]
    assert source["source_type"] == "unknown"
    assert source["eligible_for_aggregator"] is True
    assert source["eligible_for_evidence_package"] is False
    assert source["eligible_for_truth_spine"] is False
    assert source["eligible_for_public_approval_consideration"] is False


def test_source_registry_batch_counts_and_no_direct_authority():
    client = _client()
    missing_provenance = _official_source()
    missing_provenance["source"]["source_id"] = "src_missing_provenance"
    missing_provenance["source"]["provenance"] = {}
    unknown = {
        "source": {
            "source_id": "src_unknown_batch",
            "source_name": "Unknown batch source",
            "source_type": "unknown",
            "submitted_by": "Data Ops",
        }
    }
    response = client.post(
        "/source-registry/batch-evaluate",
        json={"records": [_official_source(), missing_provenance, unknown]},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["total"] == 3
    assert result["known_sources"] == 2
    assert result["unknown_sources"] == 1
    assert result["eligible_for_truth_spine"] == 1
    assert result["truth_verified_count"] == 0
    assert result["public_approved_count"] == 0
    assert all(item["truth_verified"] is False for item in result["evaluations"])
    assert all(item["public_approved"] is False for item in result["evaluations"])
