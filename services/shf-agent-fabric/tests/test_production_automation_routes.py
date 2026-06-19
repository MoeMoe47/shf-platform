from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def _complete_sync_payload() -> dict:
    return {
        "production_automation": {
            "automation_review_id": "automation_sync_test",
            "automation_name": "Sync Ready Candidate",
            "trigger_type": "warehouse_ready",
            "requested_action": "sync",
            "source_layer": "warehouse_sync",
            "target_layer": "analytics",
            "subject_id": "sync-001",
            "policy_ref": "policy-001",
            "readiness_gate_ref": "readiness-001",
            "audit_ref": "audit-001",
            "security_privacy_ref": "security-001",
            "ownership_ip_ref": "ownership-001",
            "human_approval_required": False,
        }
    }


def _notify_payload() -> dict:
    payload = _complete_sync_payload()
    payload["production_automation"].update(
        {
            "automation_review_id": "automation_notify_test",
            "automation_name": "Notify Ops",
            "trigger_type": "event",
            "requested_action": "notify",
            "source_layer": "watchtower",
            "target_layer": "notification_alert",
            "subject_id": "watchtower-001",
            "readiness_gate_ref": "",
            "ownership_ip_ref": "",
        }
    )
    return payload


def _route_event_payload() -> dict:
    payload = _notify_payload()
    payload["production_automation"].update(
        {
            "automation_review_id": "automation_route_event_test",
            "automation_name": "Route Event",
            "requested_action": "route_event",
            "target_layer": "event_webhook",
        }
    )
    return payload


def test_production_automation_openapi_routes_exist():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/production-automation/health",
        "/production-automation/schema",
        "/production-automation/summary",
        "/production-automation/evaluate",
        "/production-automation/batch-evaluate",
        "/production-automation/readiness",
    ):
        assert route in paths


def test_production_automation_health_schema_summary_readiness():
    client = _client()
    health = client.get("/production-automation/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True
    assert health.json()["status"] == "formalized_v1"

    schema = client.get("/production-automation/schema").json()
    assert "warehouse_ready" in schema["trigger_types"]
    assert "sync" in schema["requested_actions"]
    assert "automation_executed" in schema["result_fields"]

    summary = client.get("/production-automation/summary").json()
    assert summary["automation_executed_count"] == 0
    assert summary["external_call_made_count"] == 0
    assert summary["webhook_sent_count"] == 0
    assert summary["notification_sent_count"] == 0
    assert summary["production_record_written_count"] == 0
    assert summary["truth_verified_count"] == 0
    assert summary["public_approved_count"] == 0
    assert summary["mutated_public_data_count"] == 0
    assert summary["published_report_count"] == 0
    assert summary["executes_automation"] is False
    assert summary["calls_external_systems"] is False
    assert summary["sends_webhooks"] is False
    assert summary["sends_notifications"] is False
    assert summary["writes_production_records"] is False
    assert summary["replaces_event_webhook"] is False
    assert summary["replaces_notification_alert"] is False
    assert summary["replaces_policy_engine"] is False
    assert summary["replaces_readiness_gate"] is False
    assert summary["replaces_audit_verification"] is False

    readiness = client.get("/production-automation/readiness").json()
    assert readiness["automation_executed_count"] == 0
    assert readiness["executes_automation"] is False


def test_production_automation_missing_automation_review_id_blocks():
    client = _client()
    payload = _complete_sync_payload()
    payload["production_automation"]["automation_review_id"] = ""
    result = client.post("/production-automation/evaluate", json=payload).json()
    assert result["production_automation"]["automation_status"] == "blocked"
    assert "missing_automation_review_id" in result["blockers"]
    assert result["automation_ready"] is False


def test_production_automation_missing_trigger_type_blocks():
    client = _client()
    payload = _complete_sync_payload()
    payload["production_automation"]["trigger_type"] = ""
    result = client.post("/production-automation/evaluate", json=payload).json()
    assert result["production_automation"]["automation_status"] == "blocked"
    assert "missing_trigger_type" in result["blockers"]


def test_production_automation_missing_requested_action_blocks():
    client = _client()
    payload = _complete_sync_payload()
    payload["production_automation"]["requested_action"] = ""
    result = client.post("/production-automation/evaluate", json=payload).json()
    assert result["production_automation"]["automation_status"] == "blocked"
    assert "missing_requested_action" in result["blockers"]


def test_production_automation_publish_candidate_does_not_public_approve():
    client = _client()
    payload = _complete_sync_payload()
    payload["production_automation"]["requested_action"] = "publish_candidate"
    payload["production_automation"]["human_approval_required"] = False
    result = client.post("/production-automation/evaluate", json=payload).json()
    assert result["production_automation"]["automation_status"] == "blocked"
    assert "publish_candidate_execution_blocked_in_v1" in result["blockers"]
    assert result["public_approved"] is False
    assert result["published_report"] is False


def test_production_automation_notify_can_be_ready_but_notification_not_sent():
    client = _client()
    result = client.post("/production-automation/evaluate", json=_notify_payload()).json()
    assert result["production_automation"]["automation_status"] == "automation_ready"
    assert result["automation_ready"] is True
    assert result["notification_sent"] is False
    assert result["automation_executed"] is False


def test_production_automation_route_event_can_be_ready_but_webhook_not_sent():
    client = _client()
    result = client.post("/production-automation/evaluate", json=_route_event_payload()).json()
    assert result["production_automation"]["automation_status"] == "automation_ready"
    assert result["automation_ready"] is True
    assert result["webhook_sent"] is False
    assert result["external_call_made"] is False


def test_production_automation_sync_can_be_ready_without_writes_or_external_calls():
    client = _client()
    result = client.post("/production-automation/evaluate", json=_complete_sync_payload()).json()
    assert result["production_automation"]["automation_status"] == "automation_ready"
    assert result["automation_ready"] is True
    assert result["external_call_made"] is False
    assert result["production_record_written"] is False
    assert result["truth_verified"] is False
    assert result["public_approved"] is False
    assert result["mutated_public_data"] is False
    assert result["published_report"] is False


def test_production_automation_batch_counts_and_no_replacement_authority():
    client = _client()
    missing = _complete_sync_payload()
    missing["production_automation"]["automation_review_id"] = ""
    response = client.post(
        "/production-automation/batch-evaluate",
        json={"records": [_complete_sync_payload(), _notify_payload(), missing]},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["total_reviews"] == 3
    assert result["automation_ready"] == 2
    assert result["blocked"] == 1
    assert result["automation_executed_count"] == 0
    assert result["external_call_made_count"] == 0
    assert result["webhook_sent_count"] == 0
    assert result["notification_sent_count"] == 0
    assert result["production_record_written_count"] == 0
    assert result["truth_verified_count"] == 0
    assert result["public_approved_count"] == 0
    assert result["mutated_public_data_count"] == 0
    assert result["published_report_count"] == 0
    assert all(item["automation_executed"] is False for item in result["evaluations"])
    assert all(item["production_record_written"] is False for item in result["evaluations"])


def test_production_automation_reports_and_watchtower_visibility():
    client = _client()
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        reports = client.get("/reports/snapshot").json()
        watchtower = client.get("/watchtower/summary").json()
    assert "production_automation" in reports
    assert "production_automation" in watchtower
    assert reports["production_automation"]["automation_executed_count"] == 0
    assert watchtower["production_automation"]["executes_automation"] is False
