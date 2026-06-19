from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def _public_get() -> dict:
    return {
        "request": {
            "request_id": "req_public_test",
            "path": "/health",
            "method": "GET",
            "route_owner": "health",
            "exposure": "public",
            "metadata": {},
        }
    }


def _internal_truth() -> dict:
    return {
        "request": {
            "request_id": "req_truth_test",
            "path": "/truth/claims",
            "method": "GET",
            "route_owner": "truth_spine",
            "exposure": "internal",
            "actor": "admin",
            "role": "admin",
            "has_identity_context": True,
            "has_policy_context": True,
            "metadata": {"has_audit_context": True},
        }
    }


def test_api_gateway_openapi_routes_exist():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/api-gateway/health",
        "/api-gateway/schema",
        "/api-gateway/summary",
        "/api-gateway/evaluate",
        "/api-gateway/batch-evaluate",
        "/api-gateway/readiness",
    ):
        assert route in paths


def test_api_gateway_health_schema_summary_readiness():
    client = _client()
    health = client.get("/api-gateway/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True
    assert health.json()["status"] == "formalized_v1"

    schema = client.get("/api-gateway/schema").json()
    assert "GET" in schema["methods"]
    assert "public" in schema["exposures"]
    assert "/truth" in schema["governance_route_markers"]
    assert "request_forwarded" in schema["result_fields"]

    summary = client.get("/api-gateway/summary").json()
    assert summary["request_forwarded_count"] == 0
    assert summary["truth_verified_count"] == 0
    assert summary["public_approved_count"] == 0
    assert summary["mutated_public_data_count"] == 0
    assert summary["published_report_count"] == 0
    assert summary["forwards_requests"] is False
    assert summary["verifies_truth"] is False
    assert summary["replaces_identity"] is False
    assert summary["replaces_policy_engine"] is False
    assert summary["replaces_ai_guardrails"] is False

    readiness = client.get("/api-gateway/readiness").json()
    assert readiness["request_forwarded_count"] == 0
    assert readiness["forwards_requests"] is False


def test_api_gateway_missing_request_id_blocks():
    client = _client()
    payload = _public_get()
    payload["request"]["request_id"] = ""
    result = client.post("/api-gateway/evaluate", json=payload).json()
    assert result["api_gateway"]["gateway_status"] == "blocked"
    assert "missing_request_id" in result["blockers"]
    assert result["gateway_ready"] is False


def test_api_gateway_missing_path_blocks():
    client = _client()
    payload = _public_get()
    payload["request"]["path"] = ""
    result = client.post("/api-gateway/evaluate", json=payload).json()
    assert result["api_gateway"]["gateway_status"] == "blocked"
    assert "missing_path" in result["blockers"]


def test_api_gateway_admin_route_without_admin_key_blocks():
    client = _client()
    payload = {
        "request": {
            "request_id": "req_admin_missing_key",
            "path": "/admin/layers",
            "method": "GET",
            "route_owner": "admin",
            "exposure": "admin",
            "metadata": {"has_audit_context": True},
        }
    }
    result = client.post("/api-gateway/evaluate", json=payload).json()
    assert result["api_gateway"]["gateway_status"] == "blocked"
    assert "admin_route_missing_admin_key" in result["blockers"]
    assert result["request_forwarded"] is False


def test_api_gateway_public_get_route_can_be_ready():
    client = _client()
    result = client.post("/api-gateway/evaluate", json=_public_get()).json()
    assert result["api_gateway"]["gateway_status"] == "gateway_ready"
    assert result["gateway_ready"] is True
    assert result["api_gateway"]["public_exposure_allowed"] is True
    assert result["request_forwarded"] is False
    assert result["truth_verified"] is False
    assert result["public_approved"] is False
    assert result["mutated_public_data"] is False
    assert result["published_report"] is False


def test_api_gateway_internal_governance_route_needs_context():
    client = _client()
    payload = _internal_truth()
    payload["request"]["has_identity_context"] = False
    payload["request"]["has_policy_context"] = False
    payload["request"]["actor"] = ""
    payload["request"]["role"] = ""
    payload["request"]["metadata"] = {}
    result = client.post("/api-gateway/evaluate", json=payload).json()
    assert result["api_gateway"]["gateway_status"] == "needs_review"
    assert result["api_gateway"]["identity_required"] is True
    assert result["api_gateway"]["policy_required"] is True
    assert result["api_gateway"]["audit_required"] is True
    assert "missing_identity_or_role_context" in result["warnings"]
    assert "missing_policy_context" in result["warnings"]
    assert "missing_audit_context" in result["warnings"]


def test_api_gateway_internal_governance_route_ready_with_context():
    client = _client()
    result = client.post("/api-gateway/evaluate", json=_internal_truth()).json()
    assert result["api_gateway"]["gateway_status"] == "gateway_ready"
    assert result["gateway_ready"] is True
    assert result["request_forwarded"] is False


def test_api_gateway_external_route_without_context_needs_review():
    client = _client()
    payload = {
        "request": {
            "request_id": "req_external_review",
            "path": "/partner/callback",
            "method": "POST",
            "route_owner": "partner",
            "exposure": "external",
            "metadata": {},
        }
    }
    result = client.post("/api-gateway/evaluate", json=payload).json()
    assert result["api_gateway"]["gateway_status"] == "needs_review"
    assert "external_exposure_missing_identity_context" in result["warnings"]
    assert "external_exposure_missing_policy_context" in result["warnings"]
    assert "external_exposure_missing_audit_context" in result["warnings"]
    assert result["request_forwarded"] is False


def test_api_gateway_batch_counts_and_no_authority():
    client = _client()
    missing = _public_get()
    missing["request"]["request_id"] = ""
    response = client.post(
        "/api-gateway/batch-evaluate",
        json={"records": [_public_get(), _internal_truth(), missing]},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["total_reviews"] == 3
    assert result["gateway_ready"] == 2
    assert result["blocked"] == 1
    assert result["request_forwarded_count"] == 0
    assert result["truth_verified_count"] == 0
    assert result["public_approved_count"] == 0
    assert result["mutated_public_data_count"] == 0
    assert result["published_report_count"] == 0
    assert all(item["request_forwarded"] is False for item in result["evaluations"])


def test_api_gateway_reports_and_watchtower_visibility():
    client = _client()
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        reports = client.get("/reports/snapshot").json()
        watchtower = client.get("/watchtower/summary").json()
    assert "api_gateway" in reports
    assert "api_gateway" in watchtower
    assert reports["api_gateway"]["request_forwarded_count"] == 0
    assert watchtower["api_gateway"]["forwards_requests"] is False
