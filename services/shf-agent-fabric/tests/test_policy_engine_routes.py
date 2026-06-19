from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def _safe_reporting_policy() -> dict:
    return {
        "policy": {
            "policy_domain": "reporting",
            "requested_action": "report_snapshot",
            "subject_id": "report_test_001",
            "actor": "reports_service",
            "resource": "reports",
            "context": {
                "audit_status": "ready",
                "readiness_gate_status": "ready",
            },
        }
    }


def test_policy_engine_openapi_routes_exist():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/policy-engine/health",
        "/policy-engine/schema",
        "/policy-engine/summary",
        "/policy-engine/evaluate",
        "/policy-engine/batch-evaluate",
        "/policy-engine/readiness",
    ):
        assert route in paths


def test_policy_engine_health_schema_summary_readiness():
    client = _client()
    health = client.get("/policy-engine/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True
    assert health.json()["status"] == "formalized_v1"

    schema = client.get("/policy-engine/schema").json()
    assert "ai_governance" in schema["policy_domains"]
    assert "public_approved" in schema["result_fields"]
    assert "published_report" in schema["result_fields"]

    summary = client.get("/policy-engine/summary").json()
    assert summary["truth_verified_count"] == 0
    assert summary["public_approved_count"] == 0
    assert summary["mutated_public_data_count"] == 0
    assert summary["published_report_count"] == 0
    assert summary["verifies_truth"] is False
    assert summary["approves_public_data"] is False
    assert summary["mutates_shf_impact_data"] is False
    assert summary["publishes_reports"] is False
    assert summary["replaces_ai_guardrails"] is False
    assert summary["replaces_identity"] is False

    readiness = client.get("/policy-engine/readiness").json()
    assert readiness["public_approved_count"] == 0
    assert readiness["replaces_ai_guardrails"] is False


def test_policy_engine_missing_policy_domain_blocks():
    client = _client()
    payload = _safe_reporting_policy()
    payload["policy"]["policy_domain"] = ""
    result = client.post("/policy-engine/evaluate", json=payload).json()
    assert result["policy"]["policy_status"] == "blocked"
    assert "missing_policy_domain" in result["violations"]
    assert result["can_proceed"] is False


def test_policy_engine_missing_requested_action_blocks():
    client = _client()
    payload = _safe_reporting_policy()
    payload["policy"]["requested_action"] = ""
    result = client.post("/policy-engine/evaluate", json=payload).json()
    assert result["policy"]["policy_status"] == "blocked"
    assert "missing_requested_action" in result["violations"]


def test_policy_engine_unknown_domain_needs_review():
    client = _client()
    payload = _safe_reporting_policy()
    payload["policy"]["policy_domain"] = "new_policy_domain"
    result = client.post("/policy-engine/evaluate", json=payload).json()
    assert result["policy"]["policy_status"] == "needs_review"
    assert "unknown_policy_domain" in result["warnings"]


def test_policy_engine_public_publish_without_required_context_blocks():
    client = _client()
    payload = {
        "policy": {
            "policy_domain": "public_approval",
            "requested_action": "publish_public_report",
            "subject_id": "report_public_test",
            "actor": "reports_service",
            "resource": "public_report",
            "context": {},
        }
    }
    result = client.post("/policy-engine/evaluate", json=payload).json()
    assert result["policy"]["policy_status"] == "blocked"
    assert "public_action_missing_public_approval_context" in result["violations"]
    assert "public_action_missing_security_privacy_clear" in result["violations"]
    assert "public_action_missing_data_ownership_ip_clear" in result["violations"]


def test_policy_engine_safe_reporting_action_with_context_allowed():
    client = _client()
    result = client.post("/policy-engine/evaluate", json=_safe_reporting_policy()).json()
    assert result["policy"]["policy_status"] == "allowed"
    assert result["can_proceed"] is True
    assert result["truth_verified"] is False
    assert result["public_approved"] is False
    assert result["mutated_public_data"] is False
    assert result["published_report"] is False


def test_policy_engine_ai_generate_missing_guardrails_needs_review():
    client = _client()
    payload = {
        "policy": {
            "policy_domain": "ai_governance",
            "requested_action": "ai_generate_summary",
            "subject_id": "ai_test",
            "actor": "agent",
            "resource": "draft",
            "context": {},
        }
    }
    result = client.post("/policy-engine/evaluate", json=payload).json()
    assert result["policy"]["policy_status"] == "needs_review"
    assert "missing_ai_guardrails_context" in result["warnings"]
    assert result["policy"]["owner_layer"] == "AI Guardrails"


def test_policy_engine_batch_counts_and_no_replacement_authority():
    client = _client()
    missing_action = _safe_reporting_policy()
    missing_action["policy"]["requested_action"] = ""
    unknown = _safe_reporting_policy()
    unknown["policy"]["policy_domain"] = "unknown_new_domain"
    response = client.post(
        "/policy-engine/batch-evaluate",
        json={"records": [_safe_reporting_policy(), missing_action, unknown]},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["total"] == 3
    assert result["allowed"] == 1
    assert result["blocked"] == 1
    assert result["needs_review"] == 1
    assert result["truth_verified_count"] == 0
    assert result["public_approved_count"] == 0
    assert result["mutated_public_data_count"] == 0
    assert result["published_report_count"] == 0
    assert all(item["truth_verified"] is False for item in result["evaluations"])
    assert all(item["public_approved"] is False for item in result["evaluations"])
    assert all(item["mutated_public_data"] is False for item in result["evaluations"])
    assert all(item["published_report"] is False for item in result["evaluations"])
