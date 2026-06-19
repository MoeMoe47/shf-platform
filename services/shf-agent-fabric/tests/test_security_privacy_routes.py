from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def _safe_payload() -> dict:
    return {
        "candidate": {
            "candidate_id": "security_privacy_safe_test",
            "canonical_type": "impact_metric",
            "title": "County program reached 120 learners.",
            "summary": "Aggregate public-safe impact metric.",
        }
    }


def test_security_privacy_openapi_routes_exist():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/security-privacy/health",
        "/security-privacy/schema",
        "/security-privacy/summary",
        "/security-privacy/evaluate",
        "/security-privacy/batch-evaluate",
        "/security-privacy/readiness",
    ):
        assert route in paths


def test_security_privacy_health_schema_summary_readiness():
    client = _client()
    health = client.get("/security-privacy/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True
    assert health.json()["status"] == "formalized_v1"

    schema = client.get("/security-privacy/schema").json()
    assert "email" in schema["pii_indicators"]
    assert "health" in schema["sensitive_indicators"]
    assert "api_key" in schema["secret_indicators"]
    assert "public_approved" in schema["result_fields"]
    assert "published_report" in schema["result_fields"]

    summary = client.get("/security-privacy/summary").json()
    assert summary["public_approved_count"] == 0
    assert summary["mutated_public_data_count"] == 0
    assert summary["published_report_count"] == 0
    assert summary["approves_public_data"] is False
    assert summary["mutates_shf_impact_data"] is False
    assert summary["publishes_reports"] is False
    assert summary["replaces_identity"] is False
    assert summary["replaces_role_permission"] is False

    readiness = client.get("/security-privacy/readiness").json()
    assert readiness["public_approved_count"] == 0
    assert readiness["replaces_identity"] is False


def test_security_privacy_safe_payload_can_be_public_safe_candidate():
    client = _client()
    response = client.post("/security-privacy/evaluate", json=_safe_payload())
    assert response.status_code == 200, response.text
    result = response.json()
    review = result["security_privacy"]
    assert result["public_safe_candidate"] is True
    assert review["privacy_risk"] == "none"
    assert review["security_risk"] == "none"
    assert result["public_approved"] is False
    assert result["mutated_public_data"] is False
    assert result["published_report"] is False


def test_security_privacy_email_phone_address_flags_pii():
    client = _client()
    payload = {
        "candidate": {
            "candidate_id": "security_privacy_pii_test",
            "canonical_type": "contact_record",
            "email": "person@example.org",
            "phone": "555-222-1212",
            "address": "123 Main Street",
        }
    }
    result = client.post("/security-privacy/evaluate", json=payload).json()
    review = result["security_privacy"]
    assert review["pii_detected"] is True
    assert "email" in review["pii_matches"]
    assert "phone" in review["pii_matches"]
    assert "address" in review["pii_matches"]
    assert review["redaction_required"] is True
    assert review["public_safe_candidate"] is False


def test_security_privacy_health_minor_student_flags_sensitive_data():
    client = _client()
    payload = {
        "candidate": {
            "candidate_id": "security_privacy_sensitive_test",
            "canonical_type": "participant_story",
            "summary": "Student youth participant with health context and minor program note.",
        }
    }
    result = client.post("/security-privacy/evaluate", json=payload).json()
    review = result["security_privacy"]
    assert review["sensitive_data_detected"] is True
    assert "health" in review["sensitive_matches"]
    assert "minor" in review["sensitive_matches"]
    assert "student" in review["sensitive_matches"]
    assert review["privacy_review_required"] is True


def test_security_privacy_secret_payload_is_blocked():
    client = _client()
    payload = {
        "candidate": {
            "candidate_id": "security_privacy_secret_test",
            "canonical_type": "ops_config",
            "api_key": "sample-key",
            "token": "sample-token",
            "password": "sample-password",
        }
    }
    result = client.post("/security-privacy/evaluate", json=payload).json()
    review = result["security_privacy"]
    assert review["secret_detected"] is True
    assert review["security_risk"] == "blocked"
    assert "secret_detected" in result["blockers"]
    assert review["public_safe_candidate"] is False


def test_security_privacy_batch_counts_and_no_replacement_authority():
    client = _client()
    pii_payload = {
        "candidate": {
            "candidate_id": "security_privacy_pii_batch",
            "canonical_type": "contact_record",
            "email": "person@example.org",
        }
    }
    secret_payload = {
        "candidate": {
            "candidate_id": "security_privacy_secret_batch",
            "canonical_type": "ops_config",
            "admin_api_key": "sample-key",
        }
    }
    response = client.post(
        "/security-privacy/batch-evaluate",
        json={"records": [_safe_payload(), pii_payload, secret_payload]},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["total"] == 3
    assert result["public_safe_candidates"] == 1
    assert result["needs_review"] == 1
    assert result["blocked"] == 1
    assert result["public_approved_count"] == 0
    assert result["mutated_public_data_count"] == 0
    assert result["published_report_count"] == 0
    assert all(item["public_approved"] is False for item in result["evaluations"])
    assert all(item["mutated_public_data"] is False for item in result["evaluations"])
    assert all(item["published_report"] is False for item in result["evaluations"])
