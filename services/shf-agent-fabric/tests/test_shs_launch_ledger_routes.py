from __future__ import annotations

import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest


SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from routers.shs_launch_ledger_routes import router  # noqa: E402
from services import shs_launch_ledger_service as service  # noqa: E402


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setattr(service, "DB_DIR", tmp_path / "shs_launch_ledger")
    monkeypatch.setattr(service, "RECORDS_PATH", tmp_path / "shs_launch_ledger" / "launch_records.json")
    monkeypatch.setattr(service, "AUDIT_PATH", tmp_path / "shs_launch_ledger" / "launch_audit.jsonl")
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


def _ready_payload() -> dict:
    return {
        "ledger_id": "ledger_private_beta",
        "project_id": "project_private_beta",
        "client_name": "Private Beta Client",
        "project_name": "Private Beta Launch",
        "package_name": "Launch",
        "qa_signoff": {"type": "qa", "status": "approved", "owner": "QA"},
        "operator_signoff": {"type": "operator", "status": "approved", "owner": "Operator"},
        "delivery_signoff": {"type": "delivery", "status": "approved", "owner": "Delivery"},
    }


def _paid_ready_payload() -> dict:
    payload = _ready_payload()
    payload.update(
        {
            "ledger_id": "ledger_paid_ready",
            "support_tier": "Priority",
            "private_beta_only": False,
            "client_signoff": {"type": "client", "status": "approved", "owner": "Client"},
            "version_record": {"version_id": "v1", "version_label": "V1"},
            "rollback_plan": {"owner": "Release Owner", "last_known_good_version": "v1"},
            "clientops_activation": {"owner": "ClientOps Owner", "status": "pending"},
        }
    )
    return payload


def test_shs_launch_ledger_openapi_routes_exist(client: TestClient):
    paths = client.app.openapi().get("paths", {})
    for route in (
        "/shs-launch-ledger/health",
        "/shs-launch-ledger/records",
        "/shs-launch-ledger/records/{ledger_id}",
        "/shs-launch-ledger/records/{ledger_id}/signoff",
        "/shs-launch-ledger/records/{ledger_id}/version",
        "/shs-launch-ledger/records/{ledger_id}/recalculate",
        "/shs-launch-ledger/audit",
        "/shs-launch-ledger/readiness",
    ):
        assert route in paths


def test_health_readiness_and_empty_records(client: TestClient):
    health = client.get("/shs-launch-ledger/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True
    assert health.json()["public_approved"] is False

    readiness = client.get("/shs-launch-ledger/readiness")
    assert readiness.status_code == 200, readiness.text
    assert readiness.json()["total_records"] == 0

    records = client.get("/shs-launch-ledger/records")
    assert records.status_code == 200, records.text
    assert records.json()["records"] == []


def test_create_and_get_record(client: TestClient):
    response = client.post("/shs-launch-ledger/records", json=_ready_payload())
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["record"]["ledger_id"] == "ledger_private_beta"
    assert result["public_approved"] is False
    assert result["mutated_shf_impact_data"] is False
    assert result["published_report"] is False

    fetched = client.get("/shs-launch-ledger/records/ledger_private_beta")
    assert fetched.status_code == 200, fetched.text
    assert fetched.json()["record"]["project_id"] == "project_private_beta"


def test_missing_project_id_blocks(client: TestClient):
    payload = _ready_payload()
    payload.pop("project_id")
    response = client.post("/shs-launch-ledger/records", json=payload)
    assert response.status_code == 200, response.text
    gate = response.json()["validation"]["gate"]
    assert gate["status"] == "blocked"
    assert any("project_id" in blocker for blocker in gate["blockers"])


def test_private_beta_ready_can_be_computed(client: TestClient):
    response = client.post("/shs-launch-ledger/records", json=_ready_payload())
    assert response.status_code == 200, response.text
    gate = response.json()["validation"]["gate"]
    assert gate["status"] == "private_beta_ready"
    assert any("client signoff" in blocker.lower() for blocker in gate["paid_launch_blockers"])


def test_paid_launch_ready_requires_hard_fields(client: TestClient):
    partial = client.post("/shs-launch-ledger/records", json=_ready_payload()).json()
    assert partial["validation"]["gate"]["status"] == "private_beta_ready"

    paid = client.post("/shs-launch-ledger/records", json=_paid_ready_payload())
    assert paid.status_code == 200, paid.text
    gate = paid.json()["validation"]["gate"]
    assert gate["status"] == "paid_launch_ready"
    assert gate["paid_launch_blockers"] == []
    assert gate["clientops_activation_allowed"] is True


def test_signoff_endpoint_appends_audit_event(client: TestClient):
    client.post("/shs-launch-ledger/records", json=_ready_payload())
    response = client.post(
        "/shs-launch-ledger/records/ledger_private_beta/signoff",
        json={"type": "client", "status": "approved", "owner": "Client"},
    )
    assert response.status_code == 200, response.text
    assert response.json()["record"]["client_signoff"]["owner"] == "Client"

    audit = client.get("/shs-launch-ledger/audit")
    event_types = [event["event_type"] for event in audit.json()["events"]]
    assert "launch_signoff_added" in event_types


def test_version_endpoint_appends_audit_event(client: TestClient):
    client.post("/shs-launch-ledger/records", json=_ready_payload())
    response = client.post(
        "/shs-launch-ledger/records/ledger_private_beta/version",
        json={"version_label": "V1", "owner": "Launch Operator"},
    )
    assert response.status_code == 200, response.text
    assert response.json()["record"]["version_record"]["version_label"] == "V1"

    audit = client.get("/shs-launch-ledger/audit")
    event_types = [event["event_type"] for event in audit.json()["events"]]
    assert "launch_version_recorded" in event_types


def test_recalculate_endpoint_appends_audit_event(client: TestClient):
    client.post("/shs-launch-ledger/records", json=_ready_payload())
    response = client.post("/shs-launch-ledger/records/ledger_private_beta/recalculate")
    assert response.status_code == 200, response.text
    assert response.json()["gate"]["status"] == "private_beta_ready"

    audit = client.get("/shs-launch-ledger/audit")
    event_types = [event["event_type"] for event in audit.json()["events"]]
    assert "launch_gate_recalculated" in event_types


def test_audit_endpoint_returns_events_with_safety_flags_false(client: TestClient):
    client.post("/shs-launch-ledger/records", json=_ready_payload())
    audit = client.get("/shs-launch-ledger/audit")
    assert audit.status_code == 200, audit.text
    assert audit.json()["count"] >= 1
    assert all(event["public_approved"] is False for event in audit.json()["events"])
    assert all(event["mutated_shf_impact_data"] is False for event in audit.json()["events"])
    assert all(event["published_report"] is False for event in audit.json()["events"])


def test_no_shf_impact_mutation_authority_exists(client: TestClient):
    response = client.post(
        "/shs-launch-ledger/records",
        json={**_paid_ready_payload(), "mutated_shf_impact_data": True, "public_approved": True, "published_report": True},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["record"]["mutated_shf_impact_data"] is False
    assert result["record"]["public_approved"] is False
    assert result["record"]["published_report"] is False
    assert result["validation"]["gate"]["status"] == "blocked"
