from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def _internal_watchtower_payload() -> dict:
    return {
        "notification_alert": {
            "notification_review_id": "notification_watchtower_test",
            "alert_name": "Watchtower Finding",
            "trigger_type": "watchtower_observation",
            "severity": "medium",
            "recipient_scope": "internal_admin",
            "delivery_channel": "in_app",
            "source_layer": "watchtower",
            "subject_id": "watchtower-001",
            "audit_ref": "audit-001",
            "human_review_required": False,
        }
    }


def _client_email_payload() -> dict:
    return {
        "notification_alert": {
            "notification_review_id": "notification_client_test",
            "alert_name": "Client Readiness Notice",
            "trigger_type": "readiness_blocker",
            "severity": "high",
            "recipient_scope": "client",
            "delivery_channel": "email",
            "source_layer": "readiness_gate",
            "subject_id": "client-001",
            "policy_ref": "policy-001",
            "audit_ref": "audit-001",
            "security_privacy_ref": "security-001",
            "ownership_ip_ref": "ownership-001",
            "human_review_required": True,
            "human_review_status": "approved",
        }
    }


def _webhook_payload() -> dict:
    payload = _client_email_payload()
    payload["notification_alert"]["notification_review_id"] = "notification_webhook_test"
    payload["notification_alert"]["delivery_channel"] = "webhook"
    payload["notification_alert"]["event_webhook_ref"] = "event-webhook-001"
    return payload


def test_notification_alert_openapi_routes_exist():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/notification-alert/health",
        "/notification-alert/schema",
        "/notification-alert/summary",
        "/notification-alert/evaluate",
        "/notification-alert/batch-evaluate",
        "/notification-alert/readiness",
    ):
        assert route in paths


def test_notification_alert_health_schema_summary_readiness():
    client = _client()
    health = client.get("/notification-alert/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True
    assert health.json()["status"] == "formalized_v1"

    schema = client.get("/notification-alert/schema").json()
    assert "watchtower_observation" in schema["trigger_types"]
    assert "email" in schema["delivery_channels"]
    assert "notification_sent" in schema["result_fields"]

    summary = client.get("/notification-alert/summary").json()
    assert summary["notification_sent_count"] == 0
    assert summary["external_call_made_count"] == 0
    assert summary["webhook_sent_count"] == 0
    assert summary["email_sent_count"] == 0
    assert summary["sms_sent_count"] == 0
    assert summary["message_sent_count"] == 0
    assert summary["production_record_written_count"] == 0
    assert summary["truth_verified_count"] == 0
    assert summary["public_approved_count"] == 0
    assert summary["mutated_public_data_count"] == 0
    assert summary["published_report_count"] == 0
    assert summary["sends_notifications"] is False
    assert summary["calls_external_systems"] is False
    assert summary["sends_webhooks"] is False
    assert summary["sends_email"] is False
    assert summary["sends_sms"] is False
    assert summary["sends_messages"] is False
    assert summary["replaces_event_webhook"] is False
    assert summary["replaces_production_automation"] is False
    assert summary["replaces_policy_engine"] is False
    assert summary["replaces_watchtower"] is False
    assert summary["replaces_reports"] is False

    readiness = client.get("/notification-alert/readiness").json()
    assert readiness["notification_sent_count"] == 0
    assert readiness["sends_notifications"] is False


def test_notification_alert_missing_notification_review_id_blocks():
    client = _client()
    payload = _internal_watchtower_payload()
    payload["notification_alert"]["notification_review_id"] = ""
    result = client.post("/notification-alert/evaluate", json=payload).json()
    assert result["notification_alert"]["notification_status"] == "blocked"
    assert "missing_notification_review_id" in result["blockers"]
    assert result["notification_ready"] is False


def test_notification_alert_missing_trigger_type_blocks():
    client = _client()
    payload = _internal_watchtower_payload()
    payload["notification_alert"]["trigger_type"] = ""
    result = client.post("/notification-alert/evaluate", json=payload).json()
    assert result["notification_alert"]["notification_status"] == "blocked"
    assert "missing_trigger_type" in result["blockers"]


def test_notification_alert_missing_recipient_scope_blocks():
    client = _client()
    payload = _internal_watchtower_payload()
    payload["notification_alert"]["recipient_scope"] = ""
    result = client.post("/notification-alert/evaluate", json=payload).json()
    assert result["notification_alert"]["notification_status"] == "blocked"
    assert "missing_recipient_scope" in result["blockers"]


def test_notification_alert_safe_internal_watchtower_alert_can_be_ready():
    client = _client()
    result = client.post("/notification-alert/evaluate", json=_internal_watchtower_payload()).json()
    assert result["notification_alert"]["notification_status"] == "notification_ready"
    assert result["notification_ready"] is True
    assert result["notification_sent"] is False
    assert result["external_call_made"] is False


def test_notification_alert_client_notification_without_required_context_blocks():
    client = _client()
    payload = _client_email_payload()
    payload["notification_alert"]["policy_ref"] = ""
    payload["notification_alert"]["security_privacy_ref"] = ""
    payload["notification_alert"]["ownership_ip_ref"] = ""
    payload["notification_alert"]["human_review_status"] = ""
    result = client.post("/notification-alert/evaluate", json=payload).json()
    assert result["notification_alert"]["notification_status"] == "blocked"
    assert "missing_policy_ref" in result["blockers"]
    assert "missing_security_privacy_ref" in result["blockers"]
    assert "missing_ownership_ip_ref" in result["blockers"]
    assert "human_review_required" in result["blockers"]


def test_notification_alert_external_channels_never_send_in_v1():
    client = _client()
    email = client.post("/notification-alert/evaluate", json=_client_email_payload()).json()
    webhook = client.post("/notification-alert/evaluate", json=_webhook_payload()).json()
    assert email["notification_ready"] is True
    assert email["email_sent"] is False
    assert email["external_call_made"] is False
    assert webhook["notification_ready"] is True
    assert webhook["webhook_sent"] is False
    assert webhook["external_call_made"] is False


def test_notification_alert_batch_counts_and_no_replacement_authority():
    client = _client()
    missing = _internal_watchtower_payload()
    missing["notification_alert"]["notification_review_id"] = ""
    response = client.post(
        "/notification-alert/batch-evaluate",
        json={"records": [_internal_watchtower_payload(), _client_email_payload(), missing]},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["total_reviews"] == 3
    assert result["notification_ready"] == 2
    assert result["blocked"] == 1
    assert result["notification_sent_count"] == 0
    assert result["external_call_made_count"] == 0
    assert result["webhook_sent_count"] == 0
    assert result["email_sent_count"] == 0
    assert result["sms_sent_count"] == 0
    assert result["message_sent_count"] == 0
    assert result["production_record_written_count"] == 0
    assert result["truth_verified_count"] == 0
    assert result["public_approved_count"] == 0
    assert result["mutated_public_data_count"] == 0
    assert result["published_report_count"] == 0
    assert all(item["notification_sent"] is False for item in result["evaluations"])
    assert all(item["production_record_written"] is False for item in result["evaluations"])


def test_notification_alert_reports_and_watchtower_visibility():
    client = _client()
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        reports = client.get("/reports/snapshot").json()
        watchtower = client.get("/watchtower/summary").json()
    assert "notification_alert" in reports
    assert "notification_alert" in watchtower
    assert reports["notification_alert"]["notification_sent_count"] == 0
    assert watchtower["notification_alert"]["sends_notifications"] is False
