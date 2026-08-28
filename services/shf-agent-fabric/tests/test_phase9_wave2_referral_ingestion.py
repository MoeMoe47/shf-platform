from __future__ import annotations

import json

import pytest
from fastapi.testclient import TestClient

from auth.audit import _EVENTS
from auth.sessions import _SESSIONS
from main import app  # type: ignore
from services import evidence_projection_service, operational_event_service, truth_history_service, truth_spine_service


ORIGIN = "http://127.0.0.1:5174"
CLIENT = ("client@demo.shs", "demo-password")


@pytest.fixture()
def isolated_wave2_storage(tmp_path, monkeypatch):
    reporting_dir = tmp_path / "reporting"
    truth_dir = tmp_path / "truth"
    monkeypatch.setattr(operational_event_service, "OPERATIONAL_DB_DIR", reporting_dir)
    monkeypatch.setattr(operational_event_service, "OPERATIONAL_EVENTS_PATH", reporting_dir / "operational_events.jsonl")
    monkeypatch.setattr(evidence_projection_service, "EVIDENCE_DB_DIR", reporting_dir)
    monkeypatch.setattr(evidence_projection_service, "EVIDENCE_PATH", reporting_dir / "evidence.jsonl")
    monkeypatch.setattr(evidence_projection_service, "PROJECTION_RESULTS_PATH", reporting_dir / "truth_projection_results.jsonl")
    monkeypatch.setattr(truth_spine_service, "TRUTH_DB_DIR", truth_dir)
    monkeypatch.setattr(truth_spine_service, "CLAIMS_PATH", truth_dir / "claims.json")
    monkeypatch.setattr(truth_spine_service, "SOURCES_PATH", truth_dir / "sources.json")
    monkeypatch.setattr(truth_spine_service, "FEDERATION_PATH", truth_dir / "federation_registry.json")
    monkeypatch.setattr(truth_spine_service, "AUDIT_LOG_PATH", tmp_path / "logs" / "truth.audit.log")
    monkeypatch.setattr(truth_history_service, "HISTORY_PATH", truth_dir / "history.jsonl")
    return reporting_dir


@pytest.fixture(autouse=True)
def clear_auth_and_audit_state():
    _SESSIONS.clear()
    _EVENTS.clear()
    yield
    _SESSIONS.clear()
    _EVENTS.clear()


def _login(client: TestClient) -> dict:
    response = client.post("/auth/login", json={"email": CLIENT[0], "password": CLIENT[1]}, headers={"Origin": ORIGIN})
    assert response.status_code == 200, response.text
    return response.json()


def _headers(identity: dict) -> dict:
    return {"x-csrf-token": identity["csrf_token"], "x-correlation-id": "corr-wave2-referral-001", "Origin": ORIGIN}


def _payload(**overrides) -> dict:
    payload = {
        "event_type": "referral.created",
        "schema_version": "1.0",
        "producer_id": "hub.referral",
        "subject_type": "referral",
        "subject_id": "case_referral_001",
        "occurred_at": "2026-08-25T12:00:00+00:00",
        "payload": {"program_id": "program-001", "status": "open", "need_category": "workforce"},
        "evidence_references": ["case://case_referral_001"],
        "idempotency_key": "hub-referral-case-001-created",
        "actor_id": "browser-actor",
        "tenant_id": "browser-tenant",
        "organization_id": "browser-org",
        "verification_status": "verified",
        "public_approved": True,
    }
    payload.update(overrides)
    return payload


def test_referral_event_projects_to_scoped_unapproved_truth(isolated_wave2_storage):
    client = TestClient(app)
    identity = _login(client)

    ingested = client.post("/shf/ingestion/events", json=_payload(), headers=_headers(identity))
    assert ingested.status_code == 200, ingested.text
    event = ingested.json()["event"]
    assert event["actor_id"] == identity["user_id"]
    assert event["organization_id"] == identity["organization_id"]
    assert event["tenant_id"] == f"tenant:{identity['organization_id']}"

    projected = client.post(f"/shf/ingestion/events/{event['event_id']}/truth-projection", json={}, headers=_headers(identity))
    assert projected.status_code == 200, projected.text
    result = projected.json()["projection"]
    assert result["status"] == "projected"
    assert result["lineage_id"] == "lineage.hub.referral.created.v1"
    assert result["evidence_id"]
    assert result["truth_source_id"]
    assert result["truth_claim_id"]

    evidence = json.loads((isolated_wave2_storage / "evidence.jsonl").read_text().splitlines()[0])
    assert evidence["operational_event_id"] == event["event_id"]
    assert evidence["organization_id"] == identity["organization_id"]
    assert evidence["verification_status"] == "unverified"
    assert "need_category" not in json.dumps(evidence)

    claim = truth_spine_service.get_claim(result["truth_claim_id"])
    source = truth_spine_service.get_source(result["truth_source_id"])
    assert claim["claim_type"] == "hub_referral_created"
    assert claim["subject_id"] == event["subject_id"]
    assert claim["predicate"] == "referral_created"
    assert claim["occurred_at"] == event["occurred_at"]
    assert claim["evidence_ids"] == [result["evidence_id"]]
    assert claim["source_ids"] == [result["truth_source_id"]]
    assert claim["lineage_id"] == "lineage.hub.referral.created.v1"
    assert claim["producer_id"] == "hub.referral"
    assert claim["producer_event_type"] == "referral.created"
    assert claim["tenant_id"] == event["tenant_id"]
    assert claim["verification_status"] == "draft"
    assert claim["internal_approval_status"] == "not_approved"
    assert truth_spine_service.is_internal_institutionally_eligible(claim) is False
    assert claim["public_approved"] is False
    assert source["verification_status"] == "unverified"


def test_referral_retry_is_idempotent_and_does_not_duplicate_evidence(isolated_wave2_storage):
    client = TestClient(app)
    identity = _login(client)
    first = client.post("/shf/ingestion/events", json=_payload(), headers=_headers(identity))
    second = client.post("/shf/ingestion/events", json=_payload(payload={"status": "closed"}), headers=_headers(identity))
    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["idempotent_replay"] is True
    assert second.json()["event"]["event_id"] == first.json()["event"]["event_id"]

    event_id = first.json()["event"]["event_id"]
    assert client.post(f"/shf/ingestion/events/{event_id}/truth-projection", json={}, headers=_headers(identity)).status_code == 200
    replay = client.post(f"/shf/ingestion/events/{event_id}/truth-projection", json={}, headers=_headers(identity))
    assert replay.status_code == 200
    assert replay.json()["idempotent_replay"] is True
    assert len((isolated_wave2_storage / "evidence.jsonl").read_text().splitlines()) == 1
    assert len(truth_spine_service.list_claims()) == 1


def test_referral_claim_internal_approval_contract_is_separate(isolated_wave2_storage):
    client = TestClient(app)
    identity = _login(client)
    ingested = client.post("/shf/ingestion/events", json=_payload(), headers=_headers(identity))
    event_id = ingested.json()["event"]["event_id"]
    projected = client.post(f"/shf/ingestion/events/{event_id}/truth-projection", json={}, headers=_headers(identity))
    claim_id = projected.json()["projection"]["truth_claim_id"]

    # Approval cannot collapse source verification into claim approval.
    blocked = client.post(
        f"/truth/claims/{claim_id}/approve-internal",
        json={"reason": "reviewed referral"},
        headers=_headers(identity),
    )
    assert blocked.status_code == 403


def test_unknown_referral_payload_is_rejected_without_projection(isolated_wave2_storage):
    client = TestClient(app)
    identity = _login(client)
    response = client.post(
        "/shf/ingestion/events",
        json=_payload(event_type="referral.deleted"),
        headers=_headers(identity),
    )
    assert response.status_code == 422
    assert truth_spine_service.list_claims() == []
