from __future__ import annotations

import json
import hashlib
import hmac
import time

import pytest
from fastapi.testclient import TestClient

from auth.audit import _EVENTS
from auth.sessions import _SESSIONS
from main import app  # type: ignore
from services import evidence_projection_service, operational_event_service, truth_history_service, truth_spine_service
from services.reporting_lineage_service import find_lineage_entry
from services.internal_service_identity import canonical_request_bytes


ORIGIN = "http://127.0.0.1:5174"
CLIENT = ("client@demo.shs", "demo-password")


def _service_headers(body: dict) -> dict:
    now = int(time.time())
    raw = json.dumps(body, sort_keys=True, separators=(",", ":")).encode()
    digest = hashlib.sha256(raw).hexdigest()
    message = canonical_request_bytes("POST", "/shf/internal/ingestion/events", digest, str(now), str(now + 60), "test-k1")
    signature = hmac.new(b"test-secret", message, hashlib.sha256).hexdigest()
    return {
        "X-SHF-Service-Id": "service:shs-api",
        "X-SHF-Service-Kid": "test-k1",
        "X-SHF-Service-Iat": str(now),
        "X-SHF-Service-Exp": str(now + 60),
        "X-SHF-Service-Signature": signature,
    }


@pytest.fixture()
def isolated_projection_store(tmp_path, monkeypatch):
    reporting_dir = tmp_path / "reporting"
    truth_dir = tmp_path / "truth"
    monkeypatch.setattr(operational_event_service, "OPERATIONAL_DB_DIR", reporting_dir)
    monkeypatch.setattr(operational_event_service, "OPERATIONAL_EVENTS_PATH", reporting_dir / "events.jsonl")
    monkeypatch.setattr(evidence_projection_service, "EVIDENCE_DB_DIR", reporting_dir)
    monkeypatch.setattr(evidence_projection_service, "EVIDENCE_PATH", reporting_dir / "evidence.jsonl")
    monkeypatch.setattr(evidence_projection_service, "PROJECTION_RESULTS_PATH", reporting_dir / "projection.jsonl")
    monkeypatch.setattr(truth_spine_service, "TRUTH_DB_DIR", truth_dir)
    monkeypatch.setattr(truth_spine_service, "CLAIMS_PATH", truth_dir / "claims.json")
    monkeypatch.setattr(truth_spine_service, "SOURCES_PATH", truth_dir / "sources.json")
    monkeypatch.setattr(truth_spine_service, "FEDERATION_PATH", truth_dir / "federation.json")
    monkeypatch.setattr(truth_spine_service, "AUDIT_LOG_PATH", tmp_path / "logs" / "truth.log")
    monkeypatch.setattr(truth_history_service, "HISTORY_PATH", truth_dir / "history.jsonl")
    return reporting_dir, truth_dir


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
    return {"x-csrf-token": identity["csrf_token"], "x-correlation-id": "corr-exchange-projection-001", "Origin": ORIGIN}


def _body(**overrides) -> dict:
    body = {
        "producer_id": "shs.exchange",
        "event_type": "funding_commitment.committed",
        "schema_version": "v1",
        "subject_type": "funding_commitment",
        "subject_id": "commitment_projection_001",
        "organization_id": "org_internal_1",
        "tenant_id": "tenant:org_internal_1",
        "originating_actor_id": "user_internal_1",
        "originating_actor_type": "user",
        "occurred_at": "2026-08-26T12:00:00+00:00",
        "idempotency_key": "exchange-funding-commitment:commitment_projection_001:committed",
        "correlation_id": "corr-exchange-projection-001",
        "payload": {
            "commitment_id": "commitment_projection_001",
            "recipient_organization_id": "org_recipient_1",
            "amount_minor": 125050,
            "currency": "USD",
            "lifecycle_status": "committed",
            "version": 2,
        },
    }
    body.update(overrides)
    return body


def test_lineage_defines_narrow_historical_commitment_claim():
    lineage = find_lineage_entry("lineage.shs.exchange.funding_commitment.committed.v1")
    assert lineage is not None
    assert lineage["truth_eligibility"] == "TRUTH_ELIGIBLE"
    assert lineage["evidence_type"] == "exchange_funding_commitment_committed"
    assert lineage["truth_claim_type"] == "funding_commitment_committed"
    assert lineage["truth_predicate"] == "funding_commitment_committed"
    assert lineage["source_classification"] == "FIRST_PARTY_CANONICAL_RECORD"
    assert lineage["metric_ids"] == ["exchange.funding.commitment_count.v1"]
    assert lineage["report_ids"] == ["report.exchange.funding.commitment_count.v1"]
    assert "settlement" in lineage["source_verification_scope"]


def test_commitment_projection_is_minimized_unverified_draft_non_public_and_idempotent(isolated_projection_store, monkeypatch):
    reporting_dir, truth_dir = isolated_projection_store
    monkeypatch.setenv("SHF_INTERNAL_SERVICE_KEYS_JSON", json.dumps({"test-k1": "test-secret"}))
    client = TestClient(app)
    body = _body()
    ingested = client.post("/shf/internal/ingestion/events", json=body, headers=_service_headers(body))
    assert ingested.status_code == 200, ingested.text
    event_id = ingested.json()["event"]["event_id"]
    from types import SimpleNamespace

    actor = SimpleNamespace(
        user_id="user_internal_1",
        role="user",
        organization_id="org_internal_1",
        tenant_id="tenant:org_internal_1",
        service_id="service:shs-api",
        principal_type="service",
        permission="shf.event.create",
    )
    projected = evidence_projection_service.project_operational_event_to_truth(event_id, actor)
    result = projected["projection"]
    assert result["status"] == "projected"
    assert result["lineage_id"] == "lineage.shs.exchange.funding_commitment.committed.v1"

    evidence = json.loads((reporting_dir / "evidence.jsonl").read_text().splitlines()[0])
    assert evidence["subject_id"] == body["subject_id"]
    assert evidence["verification_status"] == "unverified"
    assert evidence["metadata"]["amount_minor"] == 125050
    assert evidence["metadata"]["currency"] == "USD"
    assert evidence["metadata"]["recipient_organization_id"] == "org_recipient_1"
    assert evidence["metadata"]["financial_fact_scope"] == "commitment_only_not_transfer_or_settlement"
    assert "narrative" not in json.dumps(evidence)
    assert "settlement" in json.dumps(evidence)

    source = truth_spine_service.get_source(result["truth_source_id"])
    claim = truth_spine_service.get_claim(result["truth_claim_id"])
    assert source["verification_status"] == "unverified"
    assert source.get("public_approved", False) is False
    assert claim["claim_type"] == "funding_commitment_committed"
    assert claim["predicate"] == "funding_commitment_committed"
    assert claim["subject_id"] == body["subject_id"]
    assert claim["occurred_at"] == body["occurred_at"]
    assert claim["evidence_ids"] == [result["evidence_id"]]
    assert claim["source_ids"] == [result["truth_source_id"]]
    assert claim["verification_status"] == "draft"
    assert claim["internal_approval_status"] == "not_approved"
    assert claim["public_approved"] is False
    assert "transfer" not in claim["predicate"]
    assert "settlement" not in claim["predicate"]
    assert "impact" not in claim["claim_text"]

    replay = evidence_projection_service.project_operational_event_to_truth(event_id, actor)
    assert replay["idempotent_replay"] is True
    assert len((reporting_dir / "evidence.jsonl").read_text().splitlines()) == 1
    assert len(truth_spine_service.list_claims()) == 1
    assert len(truth_spine_service.list_sources()) == 1
    assert not (truth_dir / "metric-results.jsonl").exists()
