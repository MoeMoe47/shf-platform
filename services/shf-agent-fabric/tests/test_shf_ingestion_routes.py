from __future__ import annotations

import json

import pytest
from fastapi.testclient import TestClient

from auth.audit import _EVENTS
from auth.sessions import _SESSIONS
from services import operational_event_service
from main import app  # type: ignore


ORIGIN = "http://127.0.0.1:5174"
CLIENT = ("client@demo.shs", "demo-password")
OTHER_CLIENT = ("client@other-demo.shs", "demo-password")
SHS_ADMIN = ("shs@demo.shs", "demo-password")


@pytest.fixture()
def isolated_operational_store(tmp_path, monkeypatch):
    store_dir = tmp_path / "reporting"
    monkeypatch.setattr(operational_event_service, "OPERATIONAL_DB_DIR", store_dir)
    monkeypatch.setattr(operational_event_service, "OPERATIONAL_EVENTS_PATH", store_dir / "operational_events.jsonl")
    return store_dir


@pytest.fixture(autouse=True)
def clear_auth_and_audit_state():
    _SESSIONS.clear()
    _EVENTS.clear()
    yield
    _SESSIONS.clear()
    _EVENTS.clear()


def _client() -> TestClient:
    return TestClient(app)


def _login(client: TestClient, creds=CLIENT) -> dict:
    response = client.post("/auth/login", json={"email": creds[0], "password": creds[1]}, headers={"Origin": ORIGIN})
    assert response.status_code == 200, response.text
    return response.json()


def _headers(identity: dict) -> dict:
    return {"x-csrf-token": identity["csrf_token"], "x-correlation-id": "corr-test-001"}


def _payload(**overrides):
    payload = {
        "event_type": "lesson.completed",
        "schema_version": "1.0",
        "producer_id": "curriculum.lesson",
        "subject_type": "lesson",
        "subject_id": "lesson-001",
        "occurred_at": "2026-08-25T12:00:00+00:00",
        "payload": {"score": 100, "secret_note": "store but do not audit"},
        "evidence_references": ["browser://legacy/lesson-001"],
        "idempotency_key": "idem-lesson-001",
        "correlation_id": "client-supplied-corr",
        "tenant_id": "attacker-tenant",
        "organization_id": "attacker-org",
        "actor_id": "attacker-user",
        "approval_status": "public_approved",
    }
    payload.update(overrides)
    return payload


def test_anonymous_ingestion_denied(isolated_operational_store):
    client = _client()

    response = client.post("/shf/ingestion/events", json=_payload(), headers={"Origin": ORIGIN})

    assert response.status_code == 401
    assert not (isolated_operational_store / "operational_events.jsonl").exists()


def test_valid_identity_ingests_with_server_derived_actor_scope_and_timestamp(isolated_operational_store):
    client = _client()
    identity = _login(client)

    response = client.post("/shf/ingestion/events", json=_payload(), headers=_headers(identity) | {"Origin": ORIGIN})

    assert response.status_code == 200, response.text
    event = response.json()["event"]
    assert event["actor_id"] == identity["user_id"]
    assert event["organization_id"] == identity["organization_id"]
    assert event["tenant_id"] == f"tenant:{identity['organization_id']}"
    assert event["actor_id"] != "attacker-user"
    assert event["organization_id"] != "attacker-org"
    assert event["tenant_id"] != "attacker-tenant"
    assert event["received_at"]
    assert event["processing_status"] == "accepted"
    assert event["correlation_id"] == "corr-test-001"
    assert event["storage_backend"] == "jsonl_repository_abstraction"
    assert event["storage_durability_class"] == "development_only"
    assert event["production_durability_approved"] is False

    stored_lines = (isolated_operational_store / "operational_events.jsonl").read_text(encoding="utf-8").splitlines()
    assert len(stored_lines) == 1
    assert json.loads(stored_lines[0])["event_id"] == event["event_id"]


def test_missing_csrf_denied_for_authenticated_ingestion(isolated_operational_store):
    client = _client()
    _login(client)

    response = client.post("/shf/ingestion/events", json=_payload(), headers={"Origin": ORIGIN})

    assert response.status_code == 403


def test_duplicate_idempotency_key_safely_replays_existing_event(isolated_operational_store):
    client = _client()
    identity = _login(client)
    headers = _headers(identity) | {"Origin": ORIGIN}

    first = client.post("/shf/ingestion/events", json=_payload(), headers=headers)
    second = client.post("/shf/ingestion/events", json=_payload(payload={"score": 0}), headers=headers)

    assert first.status_code == 200, first.text
    assert second.status_code == 200, second.text
    assert second.json()["idempotent_replay"] is True
    assert second.json()["event"]["event_id"] == first.json()["event"]["event_id"]
    stored_lines = (isolated_operational_store / "operational_events.jsonl").read_text(encoding="utf-8").splitlines()
    assert len(stored_lines) == 1


def test_invalid_schema_rejected(isolated_operational_store):
    client = _client()
    identity = _login(client)

    response = client.post(
        "/shf/ingestion/events",
        json=_payload(event_type="unsupported.event"),
        headers=_headers(identity) | {"Origin": ORIGIN},
    )

    assert response.status_code == 422
    assert "unsupported_event_type" in response.text


def test_tenant_isolation_on_event_reads(isolated_operational_store):
    client = _client()
    identity = _login(client)
    create = client.post("/shf/ingestion/events", json=_payload(), headers=_headers(identity) | {"Origin": ORIGIN})
    assert create.status_code == 200, create.text

    own_read = client.get("/shf/ingestion/events", headers=_headers(identity))
    other_client = _client()
    other_identity = _login(other_client, OTHER_CLIENT)
    other_read = other_client.get("/shf/ingestion/events", headers=_headers(other_identity))

    assert own_read.status_code == 200
    assert own_read.json()["count"] == 1
    assert other_read.status_code == 200
    assert other_read.json()["count"] == 0


def test_missing_scope_fails_closed_for_global_admin_ingestion(isolated_operational_store):
    client = _client()
    identity = _login(client, SHS_ADMIN)

    response = client.post("/shf/ingestion/events", json=_payload(), headers=_headers(identity) | {"Origin": ORIGIN})

    assert response.status_code == 403
    assert "no organization scope" in response.text


def test_sensitive_payload_not_copied_to_audit_metadata(isolated_operational_store):
    client = _client()
    identity = _login(client)

    response = client.post("/shf/ingestion/events", json=_payload(), headers=_headers(identity) | {"Origin": ORIGIN})

    assert response.status_code == 200, response.text
    audit_json = json.dumps(_EVENTS)
    assert "secret_note" not in audit_json
    assert "store but do not audit" not in audit_json
    assert "shf_operational_event_created" in audit_json


def test_missing_ingestion_permission_denied(isolated_operational_store):
    client = _client()
    identity = _login(client)
    for session in _SESSIONS.values():
        if session.user_id == identity["user_id"]:
            session.role = "role_without_permissions"

    response = client.post("/shf/ingestion/events", json=_payload(), headers=_headers(identity) | {"Origin": ORIGIN})

    assert response.status_code == 403


def test_storage_status_explicitly_denies_production_durability_claim(isolated_operational_store):
    client = _client()
    identity = _login(client)

    response = client.get("/shf/ingestion/storage", headers=_headers(identity))

    assert response.status_code == 200, response.text
    status = response.json()["storage"]
    assert status["backend"] == "jsonl_repository_abstraction"
    assert status["durability_class"] == "development_only"
    assert status["production_ready"] is False
    assert status["approved_production_persistence_boundary"] is False
    assert "not approved production persistence" in status["deployment_requirement"]
