from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def _complete_package() -> dict:
    return {
        "package": {
            "package_id": "evidence_pkg_test_ready",
            "canonical_type": "metric",
            "normalized_record": {"metric_name": "students_served", "value": 2810},
            "source_metadata": {
                "source_id": "source_metric",
                "source_name": "Foundation sample CSV",
                "source_url": "local://foundation-sample.csv",
                "source_type": "csv",
            },
            "provenance": {
                "source_id": "source_metric",
                "source_name": "Foundation sample CSV",
                "source_url": "local://foundation-sample.csv",
                "provenance": "local://foundation-sample",
            },
            "evidence_refs": [
                {"ref_id": "row_1", "title": "CSV row 1", "uri": "local://foundation-sample.csv"},
                {"ref_id": "manifest", "title": "Manifest", "uri": "local://manifest.json"},
            ],
        }
    }


def test_data_verification_openapi_routes_exist():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/data-verification/health",
        "/data-verification/schema",
        "/data-verification/summary",
        "/data-verification/evaluate",
        "/data-verification/batch-evaluate",
        "/data-verification/readiness",
    ):
        assert route in paths


def test_data_verification_health_schema_summary_readiness():
    client = _client()
    health = client.get("/data-verification/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True
    assert health.json()["status"] == "formalized_v1"

    schema = client.get("/data-verification/schema").json()
    assert "ready_for_truth_spine" in schema["verification_fields"]
    assert "truth_verified" in schema["verification_fields"]

    summary = client.get("/data-verification/summary").json()
    assert summary["truth_verified_count"] == 0
    assert summary["public_approval_ready"] == 0
    assert summary["verifies_truth"] is False

    readiness = client.get("/data-verification/readiness").json()
    assert readiness["truth_verified_count"] == 0
    assert readiness["public_approval_ready"] == 0


def test_data_verification_complete_package_ready_for_truth_spine_not_verified():
    client = _client()
    response = client.post("/data-verification/evaluate", json=_complete_package())
    assert response.status_code == 200, response.text
    result = response.json()
    verification = result["verification"]
    assert verification["verification_status"] == "ready_for_truth_spine"
    assert result["ready_for_truth_spine"] is True
    assert result["truth_verified"] is False
    assert result["ready_for_public_approval"] is False
    assert verification["truth_verified"] is False
    assert verification["ready_for_public_approval"] is False


def test_data_verification_missing_provenance_blocks_readiness():
    client = _client()
    payload = _complete_package()
    payload["package"]["provenance"] = {}
    response = client.post("/data-verification/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["ready_for_truth_spine"] is False
    assert "missing_provenance" in result["blockers"]
    assert result["truth_verified"] is False


def test_data_verification_missing_source_metadata_blocks_readiness():
    client = _client()
    payload = _complete_package()
    payload["package"]["source_metadata"] = {}
    response = client.post("/data-verification/evaluate", json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["ready_for_truth_spine"] is False
    assert "missing_source_metadata" in result["blockers"]
    assert result["ready_for_public_approval"] is False


def test_data_verification_missing_evidence_refs_needs_review():
    client = _client()
    payload = _complete_package()
    payload["package"]["evidence_refs"] = []
    response = client.post("/data-verification/evaluate", json=payload)
    assert response.status_code == 200, response.text
    verification = response.json()["verification"]
    assert verification["verification_status"] == "needs_review"
    assert verification["ready_for_truth_spine"] is False
    assert "missing_evidence_refs" in verification["warnings"]
    assert verification["truth_verified"] is False


def test_data_verification_batch_evaluate_counts_and_no_public_authority():
    client = _client()
    missing_source = _complete_package()
    missing_source["package"]["source_metadata"] = {}
    needs_review = _complete_package()
    needs_review["package"]["package_id"] = "evidence_pkg_needs_review"
    needs_review["package"]["evidence_refs"] = []
    response = client.post(
        "/data-verification/batch-evaluate",
        json={"records": [_complete_package(), missing_source, needs_review]},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["total"] == 3
    assert result["ready_for_truth_spine"] == 1
    assert result["blocked"] == 1
    assert result["needs_review"] == 1
    assert result["truth_verified_count"] == 0
    assert result["public_approval_ready"] == 0
    assert all(item["truth_verified"] is False for item in result["evaluations"])
    assert all(item["ready_for_public_approval"] is False for item in result["evaluations"])
