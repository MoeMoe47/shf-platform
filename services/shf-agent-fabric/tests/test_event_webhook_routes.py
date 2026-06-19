from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def _internal_event() -> dict:
    return {
        "event": {
            "event_id": "evt_test_internal",
            "event_type": "report_snapshot",
            "source_layer": "reports",
            "subject_id": "report_test_001",
            "subject_type": "report",
            "actor": "reports_service",
            "payload_ref": "reports/snapshot",
            "audit_ref": "audit_ready_001",
            "delivery_scope": "internal",
            "requested_targets": ["reports", "watchtower"],
            "timestamp": "2026-06-18T00:00:00Z",
        }
    }


def _external_event() -> dict:
    payload = _internal_event()
    payload["event"].update(
        {
            "event_id": "evt_test_external",
            "event_type": "integration_request",
            "source_layer": "data_approval_gateway",
            "policy_ref": "policy_allowed_001",
            "security_privacy_ref": "security_clear_001",
            "ownership_ref": "ownership_clear_001",
            "delivery_scope": "external",
            "requested_targets": ["webhook"],
        }
    )
    return payload


def test_event_webhook_openapi_routes_exist():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/event-webhook/health",
        "/event-webhook/schema",
        "/event-webhook/summary",
        "/event-webhook/evaluate",
        "/event-webhook/batch-evaluate",
        "/event-webhook/readiness",
    ):
        assert route in paths


def test_event_webhook_health_schema_summary_readiness():
    client = _client()
    health = client.get("/event-webhook/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True
    assert health.json()["status"] == "formalized_v1"

    schema = client.get("/event-webhook/schema").json()
    assert "report_snapshot" in schema["event_types"]
    assert "webhook" in schema["recognized_external_targets"]
    assert "watchtower" in schema["recognized_internal_targets"]

    summary = client.get("/event-webhook/summary").json()
    assert summary["webhook_sent_count"] == 0
    assert summary["truth_verified_count"] == 0
    assert summary["public_approved_count"] == 0
    assert summary["mutated_public_data_count"] == 0
    assert summary["published_report_count"] == 0
    assert summary["sends_external_webhooks"] is False
    assert summary["verifies_truth"] is False
    assert summary["replaces_watchtower"] is False
    assert summary["replaces_notification_alert"] is False

    readiness = client.get("/event-webhook/readiness").json()
    assert readiness["webhook_sent_count"] == 0
    assert readiness["sends_external_webhooks"] is False


def test_event_webhook_missing_event_id_blocks():
    client = _client()
    payload = _internal_event()
    payload["event"]["event_id"] = ""
    result = client.post("/event-webhook/evaluate", json=payload).json()
    assert result["event_webhook"]["routing_status"] == "blocked"
    assert "missing_event_id" in result["blockers"]
    assert result["queue_ready"] is False


def test_event_webhook_missing_type_and_source_block():
    client = _client()
    payload = _internal_event()
    payload["event"]["event_type"] = ""
    payload["event"]["source_layer"] = ""
    result = client.post("/event-webhook/evaluate", json=payload).json()
    assert result["event_webhook"]["routing_status"] == "blocked"
    assert "missing_event_type" in result["blockers"]
    assert "missing_source_layer" in result["blockers"]


def test_event_webhook_unknown_type_needs_review():
    client = _client()
    payload = _internal_event()
    payload["event"]["event_type"] = "new_event_family"
    result = client.post("/event-webhook/evaluate", json=payload).json()
    assert result["event_webhook"]["routing_status"] == "needs_review"
    assert "unknown_event_type" in result["warnings"]


def test_event_webhook_external_delivery_without_refs_blocks():
    client = _client()
    payload = _external_event()
    payload["event"]["policy_ref"] = ""
    payload["event"]["security_privacy_ref"] = ""
    payload["event"]["ownership_ref"] = ""
    result = client.post("/event-webhook/evaluate", json=payload).json()
    assert result["event_webhook"]["routing_status"] == "blocked"
    assert "external_delivery_missing_policy_ref" in result["blockers"]
    assert "external_delivery_missing_security_privacy_ref" in result["blockers"]
    assert "external_delivery_missing_ownership_ref" in result["blockers"]
    assert result["external_delivery_allowed"] is False
    assert result["webhook_sent"] is False


def test_event_webhook_internal_event_queue_ready():
    client = _client()
    result = client.post("/event-webhook/evaluate", json=_internal_event()).json()
    assert result["event_webhook"]["routing_status"] == "queue_ready"
    assert result["queue_ready"] is True
    assert result["event_webhook"]["internal_targets"] == ["reports", "watchtower"]
    assert result["webhook_sent"] is False
    assert result["truth_verified"] is False
    assert result["public_approved"] is False
    assert result["mutated_public_data"] is False
    assert result["published_report"] is False


def test_event_webhook_external_event_allowed_but_not_sent():
    client = _client()
    result = client.post("/event-webhook/evaluate", json=_external_event()).json()
    assert result["event_webhook"]["routing_status"] == "queue_ready"
    assert result["external_delivery_allowed"] is True
    assert result["event_webhook"]["external_targets"] == ["webhook"]
    assert result["webhook_sent"] is False
    assert result["truth_verified"] is False
    assert result["public_approved"] is False
    assert result["mutated_public_data"] is False
    assert result["published_report"] is False


def test_event_webhook_batch_counts_and_no_authority():
    client = _client()
    missing = _internal_event()
    missing["event"]["event_id"] = ""
    response = client.post(
        "/event-webhook/batch-evaluate",
        json={"records": [_internal_event(), _external_event(), missing]},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["total_events"] == 3
    assert result["queue_ready"] == 2
    assert result["blocked"] == 1
    assert result["external_delivery_allowed_count"] == 1
    assert result["webhook_sent_count"] == 0
    assert result["truth_verified_count"] == 0
    assert result["public_approved_count"] == 0
    assert result["mutated_public_data_count"] == 0
    assert result["published_report_count"] == 0
    assert all(item["webhook_sent"] is False for item in result["evaluations"])


def test_event_webhook_reports_and_watchtower_visibility():
    client = _client()
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        reports = client.get("/reports/snapshot").json()
        watchtower = client.get("/watchtower/summary").json()
    assert "event_webhook" in reports
    assert "event_webhook" in watchtower
    assert reports["event_webhook"]["webhook_sent_count"] == 0
    assert watchtower["event_webhook"]["sends_external_webhooks"] is False
