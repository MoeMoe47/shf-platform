from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def test_evidence_package_openapi_routes_exist():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/evidence-package/health",
        "/evidence-package/schema",
        "/evidence-package/summary",
        "/evidence-package/build",
        "/evidence-package/batch-build",
        "/evidence-package/readiness",
    ):
        assert route in paths


def test_evidence_package_health_schema_and_readiness():
    client = _client()
    health_response = client.get("/evidence-package/health")
    assert health_response.status_code == 200, health_response.text
    assert health_response.json()["ok"] is True
    assert health_response.json()["status"] == "formalized_v1"

    schema_response = client.get("/evidence-package/schema")
    assert schema_response.status_code == 200, schema_response.text
    schema = schema_response.json()
    assert "normalized_record" in schema["required_components"]
    assert "ready_for_public_approval" in schema["package_fields"]

    readiness_response = client.get("/evidence-package/readiness")
    assert readiness_response.status_code == 200, readiness_response.text
    readiness = readiness_response.json()
    assert readiness["public_approval_ready"] == 0
    assert readiness["verifies_truth"] is False


def test_evidence_package_build_complete_package_ready_for_truth_spine_only():
    client = _client()
    response = client.post(
        "/evidence-package/build",
        json={
            "canonical_type": "metric",
            "normalized_record": {"county_name": "Licking", "metric_name": "students_served", "value": 2810},
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
            "evidence_refs": [{"ref_id": "row_1", "title": "CSV row 1", "uri": "local://foundation-sample.csv"}],
        },
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["ready_for_truth_spine"] is True
    assert result["ready_for_public_approval"] is False
    assert result["verifies_truth"] is False
    assert result["completeness_score"] == 100
    assert result["package"]["package_id"].startswith("evidence_pkg_")


def test_evidence_package_missing_provenance_blocks_readiness():
    client = _client()
    response = client.post(
        "/evidence-package/build",
        json={
            "canonical_type": "program",
            "normalized_record": {"program_name": "Digital Access"},
            "source_metadata": {"source_name": "Program intake"},
            "evidence_refs": [{"title": "Draft note"}],
        },
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["ready_for_truth_spine"] is False
    assert result["ready_for_public_approval"] is False
    assert "missing_provenance" in result["warnings"]
    assert "missing_provenance" in result["blockers"]


def test_evidence_package_missing_evidence_refs_warns_but_does_not_public_approve():
    client = _client()
    response = client.post(
        "/evidence-package/build",
        json={
            "canonical_type": "county",
            "normalized_record": {"county_name": "Coshocton"},
            "source_metadata": {"source_name": "County source", "source_url": "local://county"},
            "provenance": {"source_name": "County source", "source_url": "local://county", "provenance": "local://county"},
        },
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["ready_for_truth_spine"] is True
    assert result["ready_for_public_approval"] is False
    assert "missing_evidence_refs" in result["warnings"]
    assert "missing_evidence_refs" not in result["blockers"]


def test_evidence_package_batch_build_counts():
    client = _client()
    response = client.post(
        "/evidence-package/batch-build",
        json={
            "records": [
                {
                    "canonical_type": "metric",
                    "normalized_record": {"metric_name": "participants", "value": 25},
                    "source_metadata": {"source_name": "Metric source", "source_url": "local://metric"},
                    "provenance": {"source_name": "Metric source", "source_url": "local://metric", "provenance": "local://metric"},
                    "evidence_refs": [{"title": "Metric export"}],
                },
                {
                    "canonical_type": "story",
                    "normalized_record": {"story_text": "Missing provenance story"},
                    "evidence_refs": [],
                },
            ]
        },
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["total"] == 2
    assert result["complete_packages"] == 1
    assert result["incomplete_packages"] == 1
    assert result["truth_spine_ready"] == 1
    assert result["public_approval_ready"] == 0
