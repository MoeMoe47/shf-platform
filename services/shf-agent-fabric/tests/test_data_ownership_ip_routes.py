from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def _safe_payload() -> dict:
    return {
        "candidate": {
            "candidate_id": "ownership_ip_safe_test",
            "canonical_type": "impact_metric",
            "owner": "SHF",
            "submitted_by": "program_ops",
            "license_type": "public_release_allowed",
            "usage_rights": ["reporting", "reuse", "public_release"],
            "attribution_required": False,
            "consent_required": False,
        }
    }


def test_data_ownership_ip_openapi_routes_exist():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/data-ownership-ip/health",
        "/data-ownership-ip/schema",
        "/data-ownership-ip/summary",
        "/data-ownership-ip/evaluate",
        "/data-ownership-ip/batch-evaluate",
        "/data-ownership-ip/readiness",
    ):
        assert route in paths


def test_data_ownership_ip_health_schema_summary_readiness():
    client = _client()
    health = client.get("/data-ownership-ip/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True
    assert health.json()["status"] == "formalized_v1"

    schema = client.get("/data-ownership-ip/schema").json()
    assert "public_release_allowed" in schema["license_types"]
    assert "ownership_clear_candidate" in schema["result_fields"]
    assert "public_approved" in schema["result_fields"]

    summary = client.get("/data-ownership-ip/summary").json()
    assert summary["public_approved_count"] == 0
    assert summary["mutated_public_data_count"] == 0
    assert summary["published_report_count"] == 0
    assert summary["approves_public_data"] is False
    assert summary["mutates_shf_impact_data"] is False
    assert summary["publishes_reports"] is False
    assert summary["provides_legal_advice"] is False
    assert summary["replaces_security_privacy"] is False
    assert summary["replaces_role_permission"] is False

    readiness = client.get("/data-ownership-ip/readiness").json()
    assert readiness["public_approved_count"] == 0
    assert readiness["provides_legal_advice"] is False


def test_data_ownership_ip_safe_payload_can_be_ownership_clear_candidate():
    client = _client()
    result = client.post("/data-ownership-ip/evaluate", json=_safe_payload()).json()
    review = result["data_ownership_ip"]
    assert result["ownership_clear_candidate"] is True
    assert review["ownership_risk"] == "low"
    assert review["license_risk"] == "low"
    assert review["reuse_allowed"] is True
    assert review["reporting_allowed"] is True
    assert review["public_release_rights"] is True
    assert result["public_approved"] is False
    assert result["mutated_public_data"] is False
    assert result["published_report"] is False


def test_data_ownership_ip_missing_owner_blocks():
    client = _client()
    payload = _safe_payload()
    payload["candidate"]["owner"] = ""
    result = client.post("/data-ownership-ip/evaluate", json=payload).json()
    assert "missing_owner" in result["blockers"]
    assert result["ownership_clear_candidate"] is False


def test_data_ownership_ip_restricted_license_blocks():
    client = _client()
    payload = _safe_payload()
    payload["candidate"]["license_type"] = "restricted"
    result = client.post("/data-ownership-ip/evaluate", json=payload).json()
    assert "restricted_license" in result["blockers"]
    assert result["data_ownership_ip"]["license_risk"] == "blocked"


def test_data_ownership_ip_third_party_license_needs_review_or_blocks():
    client = _client()
    payload = _safe_payload()
    payload["candidate"]["license_type"] = "third_party"
    result = client.post("/data-ownership-ip/evaluate", json=payload).json()
    assert "third_party_license_needs_review" in result["warnings"]
    assert result["data_ownership_ip"]["third_party_ip_detected"] is True
    assert result["ownership_clear_candidate"] is False

    no_rights = _safe_payload()
    no_rights["candidate"]["license_type"] = "third_party"
    no_rights["candidate"]["usage_rights"] = []
    blocked = client.post("/data-ownership-ip/evaluate", json=no_rights).json()
    assert "third_party_license_without_explicit_rights" in blocked["blockers"]


def test_data_ownership_ip_missing_required_consent_blocks():
    client = _client()
    payload = _safe_payload()
    payload["candidate"]["consent_required"] = True
    payload["candidate"]["consent_confirmed"] = False
    result = client.post("/data-ownership-ip/evaluate", json=payload).json()
    assert "missing_required_consent" in result["blockers"]
    assert result["ownership_clear_candidate"] is False


def test_data_ownership_ip_batch_counts_and_no_publication_authority():
    client = _client()
    restricted = _safe_payload()
    restricted["candidate"]["candidate_id"] = "ownership_ip_restricted_batch"
    restricted["candidate"]["license_type"] = "restricted"
    review = _safe_payload()
    review["candidate"]["candidate_id"] = "ownership_ip_review_batch"
    review["candidate"]["license_type"] = "unknown"
    response = client.post(
        "/data-ownership-ip/batch-evaluate",
        json={"records": [_safe_payload(), restricted, review]},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["total"] == 3
    assert result["ownership_clear_candidates"] == 1
    assert result["blocked"] == 1
    assert result["needs_review"] == 1
    assert result["public_approved_count"] == 0
    assert result["mutated_public_data_count"] == 0
    assert result["published_report_count"] == 0
    assert all(item["public_approved"] is False for item in result["evaluations"])
    assert all(item["mutated_public_data"] is False for item in result["evaluations"])
    assert all(item["published_report"] is False for item in result["evaluations"])
