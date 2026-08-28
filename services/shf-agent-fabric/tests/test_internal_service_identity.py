from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time

from fastapi.testclient import TestClient

from main import app
from services import evidence_projection_service, operational_event_service, truth_history_service, truth_spine_service

from services.internal_service_identity import (
    authenticate_internal_request,
    canonical_request_bytes,
)


def _keyring(monkeypatch):
    monkeypatch.setenv("SHF_INTERNAL_SERVICE_KEYS_JSON", json.dumps({"test-k1": "test-secret"}))
    monkeypatch.setenv("SHF_INTERNAL_SERVICE_ACTIVE_KID", "test-k1")
    monkeypatch.setenv("SHF_INTERNAL_SERVICE_ENV", "test")


def _signed_headers(body: dict, *, secret="test-secret", kid="test-k1", expires=None):
    now = int(time.time())
    expires = expires or now + 60
    raw = json.dumps(body, sort_keys=True, separators=(",", ":")).encode()
    digest = hashlib.sha256(raw).hexdigest()
    message = canonical_request_bytes("POST", "/shf/internal/ingestion/events", digest, str(now), str(expires), kid)
    signature = hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()
    return {
        "X-SHF-Service-Id": "service:shs-api",
        "X-SHF-Service-Kid": kid,
        "X-SHF-Service-Iat": str(now),
        "X-SHF-Service-Exp": str(expires),
        "X-SHF-Service-Signature": signature,
    }


def test_valid_service_signature_authenticates(monkeypatch):
    _keyring(monkeypatch)
    body = {"producer_id": "hub.referral", "event_type": "referral.created"}
    principal = authenticate_internal_request(
        method="POST",
        path="/shf/internal/ingestion/events",
        body=body,
        headers=_signed_headers(body),
    )
    assert principal.service_id == "service:shs-api"
    assert principal.permission == "shf.event.create"


def test_missing_invalid_expired_and_wrong_audience_style_identity_fail_closed(monkeypatch):
    _keyring(monkeypatch)
    body = {"producer_id": "hub.referral", "event_type": "referral.created"}
    headers = _signed_headers(body)
    for name in ("X-SHF-Service-Signature", "X-SHF-Service-Id"):
        invalid = dict(headers)
        invalid.pop(name)
        try:
            authenticate_internal_request(method="POST", path="/shf/internal/ingestion/events", body=body, headers=invalid)
        except ValueError:
            pass
        else:
            raise AssertionError(f"{name} was accepted")

    expired = _signed_headers(body, expires=int(time.time()) - 1)
    try:
        authenticate_internal_request(method="POST", path="/shf/internal/ingestion/events", body=body, headers=expired)
    except ValueError:
        pass
    else:
        raise AssertionError("expired service request was accepted")


def test_service_binding_rejects_other_producers_and_events(monkeypatch):
    _keyring(monkeypatch)
    accepted = {"producer_id": "curriculum.lesson", "event_type": "lesson.completed"}
    principal = authenticate_internal_request(
        method="POST",
        path="/shf/internal/ingestion/events",
        body=accepted,
        headers=_signed_headers(accepted),
    )
    assert principal.service_id == "service:shs-api"
    for body in ({"producer_id": "curriculum.lesson", "event_type": "truth.approved"}, {"producer_id": "hub.referral", "event_type": "truth.approved"}):
        try:
            authenticate_internal_request(
                method="POST",
                path="/shf/internal/ingestion/events",
                body=body,
                headers=_signed_headers(body),
            )
        except ValueError:
            pass
        else:
            raise AssertionError("unbound producer/event was accepted")


def test_service_binding_accepts_only_report_created_for_shs_reporting(monkeypatch):
    _keyring(monkeypatch)
    body = {"producer_id": "shs.reporting", "event_type": "report.created"}
    principal = authenticate_internal_request(
        method="POST",
        path="/shf/internal/ingestion/events",
        body=body,
        headers=_signed_headers(body),
    )
    assert principal.service_id == "service:shs-api"
    for invalid in (
        {"producer_id": "shs.reporting", "event_type": "referral.created"},
        {"producer_id": "hub.referral", "event_type": "report.created"},
    ):
        try:
            authenticate_internal_request(
                method="POST",
                path="/shf/internal/ingestion/events",
                body=invalid,
                headers=_signed_headers(invalid),
            )
        except ValueError as exc:
            assert str(exc) == "internal_service_event_not_allowed"
        else:
            raise AssertionError("invalid producer/event binding was accepted")


def test_service_binding_accepts_only_exchange_funding_commitment_commit(monkeypatch):
    _keyring(monkeypatch)
    body = {"producer_id": "shs.exchange", "event_type": "funding_commitment.committed"}
    principal = authenticate_internal_request(
        method="POST",
        path="/shf/internal/ingestion/events",
        body=body,
        headers=_signed_headers(body),
    )
    assert principal.service_id == "service:shs-api"
    for invalid in (
        {"producer_id": "shs.exchange", "event_type": "referral.created"},
        {"producer_id": "shs.exchange", "event_type": "report.created"},
        {"producer_id": "shs.exchange", "event_type": "grant_binder.created"},
        {"producer_id": "hub.referral", "event_type": "funding_commitment.committed"},
        {"producer_id": "shs.reporting", "event_type": "funding_commitment.committed"},
        {"producer_id": "shs.grant_binder", "event_type": "funding_commitment.committed"},
    ):
        try:
            authenticate_internal_request(
                method="POST",
                path="/shf/internal/ingestion/events",
                body=invalid,
                headers=_signed_headers(invalid),
            )
        except ValueError as exc:
            assert str(exc) == "internal_service_event_not_allowed"
        else:
            raise AssertionError("invalid Exchange producer/event binding was accepted")


def test_production_requires_secret_provider_reference(monkeypatch):
    _keyring(monkeypatch)
    monkeypatch.setenv("NODE_ENV", "production")
    monkeypatch.delenv("SHF_INTERNAL_SERVICE_KEYS_REF", raising=False)
    body = {"producer_id": "hub.referral", "event_type": "referral.created"}
    try:
        authenticate_internal_request(
            method="POST",
            path="/shf/internal/ingestion/events",
            body=body,
            headers=_signed_headers(body),
        )
    except ValueError as exc:
        assert str(exc) == "production_internal_service_key_provider_required"
    else:
        raise AssertionError("production accepted local keyring without provider reference")


def test_internal_ingestion_route_reuses_operational_event_boundary(tmp_path, monkeypatch):
    _keyring(monkeypatch)
    monkeypatch.setattr(operational_event_service, "OPERATIONAL_DB_DIR", tmp_path / "reporting")
    monkeypatch.setattr(operational_event_service, "OPERATIONAL_EVENTS_PATH", tmp_path / "reporting" / "events.jsonl")
    monkeypatch.setattr(evidence_projection_service, "EVIDENCE_DB_DIR", tmp_path / "reporting")
    monkeypatch.setattr(evidence_projection_service, "EVIDENCE_PATH", tmp_path / "reporting" / "evidence.jsonl")
    monkeypatch.setattr(evidence_projection_service, "PROJECTION_RESULTS_PATH", tmp_path / "reporting" / "projection.jsonl")
    monkeypatch.setattr(truth_spine_service, "TRUTH_DB_DIR", tmp_path / "truth")
    monkeypatch.setattr(truth_spine_service, "CLAIMS_PATH", tmp_path / "truth" / "claims.json")
    monkeypatch.setattr(truth_spine_service, "SOURCES_PATH", tmp_path / "truth" / "sources.json")
    monkeypatch.setattr(truth_spine_service, "FEDERATION_PATH", tmp_path / "truth" / "federation.json")
    monkeypatch.setattr(truth_spine_service, "AUDIT_LOG_PATH", tmp_path / "logs" / "truth.log")
    monkeypatch.setattr(truth_history_service, "HISTORY_PATH", tmp_path / "truth" / "history.jsonl")
    body = {
        "producer_id": "hub.referral",
        "event_type": "referral.created",
        "subject_type": "referral",
        "subject_id": "case_internal_1",
        "organization_id": "org_internal_1",
        "tenant_id": "tenant:org_internal_1",
        "originating_actor_id": "user_internal_1",
        "originating_actor_type": "user",
        "occurred_at": "2026-08-25T12:00:00+00:00",
        "idempotency_key": "referral:case_internal_1:created",
        "correlation_id": "corr_internal_1",
        "payload": {"referral_id": "case_internal_1"},
    }
    response = TestClient(app).post(
        "/shf/internal/ingestion/events",
        json=body,
        headers=_signed_headers(body),
    )
    assert response.status_code == 200
    assert response.json()["principal_type"] == "service"
    assert response.json()["event"]["actor_id"] == "user_internal_1"
    assert response.json()["event"]["organization_id"] == "org_internal_1"
    assert response.json()["projection"]["status"] == "projected"
    assert response.json()["projection"]["truth_claim_id"]
    replay = TestClient(app).post(
        "/shf/internal/ingestion/events",
        json=body,
        headers=_signed_headers(body),
    )
    assert replay.status_code == 200
    assert replay.json()["event_idempotent_replay"] is True
    assert replay.json()["projection_idempotent_replay"] is True
    assert replay.json()["idempotent_replay"] is True


def test_report_created_ingestion_is_operational_only_and_idempotent(tmp_path, monkeypatch):
    _keyring(monkeypatch)
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
    body = {
        "producer_id": "shs.reporting",
        "event_type": "report.created",
        "schema_version": "v1",
        "subject_type": "report",
        "subject_id": "report_synthetic_001",
        "organization_id": "org_internal_1",
        "tenant_id": "tenant:org_internal_1",
        "originating_actor_id": "user_internal_1",
        "originating_actor_type": "user",
        "occurred_at": "2026-08-25T12:00:00+00:00",
        "idempotency_key": "report:report_synthetic_001:created",
        "correlation_id": "corr_report_created_001",
        "payload": {
            "report_id": "report_synthetic_001",
            "revision_id": "revision_synthetic_001",
            "report_version": 1,
            "lifecycle_status": "draft",
        },
    }
    client = TestClient(app)
    first = client.post("/shf/internal/ingestion/events", json=body, headers=_signed_headers(body))
    assert first.status_code == 200, first.text
    result = first.json()
    assert result["event"]["producer_id"] == "shs.reporting"
    assert result["event"]["event_type"] == "report.created"
    assert result["event"]["schema_version"] == "v1"
    assert result["event"]["subject_type"] == "report"
    assert result["event"]["subject_id"] == "report_synthetic_001"
    assert result["event"]["tenant_id"] == "tenant:org_internal_1"
    assert result["event"]["organization_id"] == "org_internal_1"
    assert result["projection"] is None
    assert result["projection_status"] == "not_configured"
    assert not (reporting_dir / "evidence.jsonl").exists()
    assert not (truth_dir / "claims.json").exists()
    assert not (truth_dir / "sources.json").exists()

    replay = client.post("/shf/internal/ingestion/events", json=body, headers=_signed_headers(body))
    assert replay.status_code == 200, replay.text
    assert replay.json()["event_idempotent_replay"] is True
    assert replay.json()["projection"] is None
    assert len((reporting_dir / "events.jsonl").read_text().splitlines()) == 1


def test_report_created_payload_rejects_content_expansion_and_scope_forgery(tmp_path, monkeypatch):
    _keyring(monkeypatch)
    body = {
        "producer_id": "shs.reporting",
        "event_type": "report.created",
        "schema_version": "v1",
        "subject_type": "report",
        "subject_id": "report_synthetic_002",
        "organization_id": "org_internal_1",
        "tenant_id": "tenant:attacker",
        "originating_actor_id": "user_internal_1",
        "originating_actor_type": "user",
        "occurred_at": "2026-08-25T12:00:00+00:00",
        "idempotency_key": "report:report_synthetic_002:created",
        "correlation_id": "corr_report_created_002",
        "payload": {
            "report_id": "report_synthetic_002",
            "revision_id": "revision_synthetic_002",
            "report_version": 1,
            "lifecycle_status": "draft",
            "report_body": "must be rejected",
        },
    }
    response = TestClient(app).post(
        "/shf/internal/ingestion/events",
        json=body,
        headers=_signed_headers(body),
    )
    assert response.status_code == 403


def test_grant_binder_created_ingests_one_operational_event_without_projection(tmp_path, monkeypatch):
    _keyring(monkeypatch)
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
    body = {
        "producer_id": "shs.grant_binder",
        "event_type": "grant_binder.created",
        "schema_version": "v1",
        "subject_type": "grant_binder",
        "subject_id": "binder_synthetic_001",
        "organization_id": "org_internal_1",
        "tenant_id": "tenant:org_internal_1",
        "originating_actor_id": "user_internal_1",
        "originating_actor_type": "user",
        "occurred_at": "2026-08-25T12:00:00+00:00",
        "idempotency_key": "grant-binder:binder_synthetic_001:created",
        "correlation_id": "corr_grant_binder_001",
        "payload": {
            "binder_id": "binder_synthetic_001",
            "lifecycle_status": "draft",
            "version": 1,
        },
    }
    client = TestClient(app)
    first = client.post("/shf/internal/ingestion/events", json=body, headers=_signed_headers(body))
    assert first.status_code == 200, first.text
    result = first.json()
    assert result["event"]["producer_id"] == "shs.grant_binder"
    assert result["event"]["event_type"] == "grant_binder.created"
    assert result["event"]["schema_version"] == "v1"
    assert result["event"]["subject_type"] == "grant_binder"
    assert result["event"]["subject_id"] == "binder_synthetic_001"
    assert result["event"]["tenant_id"] == "tenant:org_internal_1"
    assert result["event"]["organization_id"] == "org_internal_1"
    assert result["event"]["occurred_at"] == body["occurred_at"]
    assert result["projection"] is None
    assert result["projection_status"] == "not_configured"
    assert not (reporting_dir / "evidence.jsonl").exists()
    assert not (truth_dir / "claims.json").exists()
    assert not (truth_dir / "sources.json").exists()

    replay = client.post("/shf/internal/ingestion/events", json=body, headers=_signed_headers(body))
    assert replay.status_code == 200, replay.text
    assert replay.json()["event_idempotent_replay"] is True
    assert len((reporting_dir / "events.jsonl").read_text().splitlines()) == 1


def test_exchange_commitment_ingests_one_minimized_operational_event_without_projection(tmp_path, monkeypatch):
    _keyring(monkeypatch)
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
    body = {
        "producer_id": "shs.exchange",
        "event_type": "funding_commitment.committed",
        "schema_version": "v1",
        "subject_type": "funding_commitment",
        "subject_id": "commitment_synthetic_001",
        "organization_id": "org_internal_1",
        "tenant_id": "tenant:org_internal_1",
        "originating_actor_id": "user_internal_1",
        "originating_actor_type": "user",
        "occurred_at": "2026-08-26T12:00:00+00:00",
        "idempotency_key": "exchange-funding-commitment:commitment_synthetic_001:committed",
        "correlation_id": "corr_exchange_commitment_001",
        "payload": {
            "commitment_id": "commitment_synthetic_001",
            "recipient_organization_id": "org_recipient_1",
            "amount_minor": 125050,
            "currency": "USD",
            "lifecycle_status": "committed",
            "version": 2,
        },
    }
    client = TestClient(app)
    first = client.post("/shf/internal/ingestion/events", json=body, headers=_signed_headers(body))
    assert first.status_code == 200, first.text
    event = first.json()["event"]
    assert event["producer_id"] == "shs.exchange"
    assert event["event_type"] == "funding_commitment.committed"
    assert event["schema_version"] == "v1"
    assert event["subject_type"] == "funding_commitment"
    assert event["subject_id"] == body["subject_id"]
    assert event["tenant_id"] == body["tenant_id"]
    assert event["organization_id"] == body["organization_id"]
    assert event["actor_id"] == body["originating_actor_id"]
    assert event["occurred_at"] == body["occurred_at"]
    assert event["payload"] == body["payload"]
    assert first.json()["projection"] is None
    assert first.json()["projection_status"] == "not_configured"
    assert not (reporting_dir / "evidence.jsonl").exists()
    assert not (truth_dir / "claims.json").exists()
    assert not (truth_dir / "sources.json").exists()

    replay = client.post("/shf/internal/ingestion/events", json=body, headers=_signed_headers(body))
    assert replay.status_code == 200, replay.text
    assert replay.json()["event_idempotent_replay"] is True
    assert replay.json()["event"]["event_id"] == event["event_id"]
    assert len((reporting_dir / "events.jsonl").read_text().splitlines()) == 1


def test_exchange_commitment_scope_and_payload_fail_closed(tmp_path, monkeypatch):
    _keyring(monkeypatch)
    monkeypatch.setattr(operational_event_service, "OPERATIONAL_DB_DIR", tmp_path / "reporting")
    monkeypatch.setattr(operational_event_service, "OPERATIONAL_EVENTS_PATH", tmp_path / "reporting" / "events.jsonl")
    body = {
        "producer_id": "shs.exchange",
        "event_type": "funding_commitment.committed",
        "schema_version": "v1",
        "subject_type": "funding_commitment",
        "subject_id": "commitment_synthetic_002",
        "organization_id": "org_internal_1",
        "tenant_id": "tenant:attacker",
        "originating_actor_id": "user_internal_1",
        "originating_actor_type": "user",
        "occurred_at": "2026-08-26T12:00:00+00:00",
        "idempotency_key": "exchange-funding-commitment:commitment_synthetic_002:committed",
        "payload": {
            "commitment_id": "commitment_synthetic_002",
            "recipient_organization_id": "org_recipient_1",
            "amount_minor": 1,
            "currency": "USD",
            "lifecycle_status": "committed",
            "version": 2,
            "settlement_status": "settled",
        },
    }
    response = TestClient(app).post("/shf/internal/ingestion/events", json=body, headers=_signed_headers(body))
    assert response.status_code == 403


def test_grant_binder_binding_scope_and_payload_fail_closed(tmp_path, monkeypatch):
    _keyring(monkeypatch)
    monkeypatch.setattr(operational_event_service, "OPERATIONAL_DB_DIR", tmp_path / "reporting")
    monkeypatch.setattr(operational_event_service, "OPERATIONAL_EVENTS_PATH", tmp_path / "reporting" / "events.jsonl")
    body = {
        "producer_id": "shs.grant_binder",
        "event_type": "grant_binder.created",
        "schema_version": "v1",
        "subject_type": "grant_binder",
        "subject_id": "binder_synthetic_002",
        "organization_id": "org_internal_1",
        "tenant_id": "tenant:attacker",
        "originating_actor_id": "user_internal_1",
        "originating_actor_type": "user",
        "occurred_at": "2026-08-25T12:00:00+00:00",
        "idempotency_key": "grant-binder:binder_synthetic_002:created",
        "payload": {"binder_id": "binder_synthetic_002", "lifecycle_status": "draft", "version": 1},
    }
    response = TestClient(app).post(
        "/shf/internal/ingestion/events",
        json=body,
        headers=_signed_headers(body),
    )
    assert response.status_code == 403

    invalid_payload = dict(body)
    invalid_payload["tenant_id"] = "tenant:org_internal_1"
    invalid_payload["payload"] = {
        "binder_id": "binder_synthetic_002",
        "lifecycle_status": "draft",
        "version": 1,
        "activity_logs": [],
    }
    response = TestClient(app).post(
        "/shf/internal/ingestion/events",
        json=invalid_payload,
        headers=_signed_headers(invalid_payload),
    )
    assert response.status_code == 422


def test_grant_binder_service_binding_rejects_other_pairs(monkeypatch):
    _keyring(monkeypatch)
    for body in (
        {"producer_id": "shs.grant_binder", "event_type": "referral.created"},
        {"producer_id": "hub.referral", "event_type": "grant_binder.created"},
        {"producer_id": "shs.reporting", "event_type": "grant_binder.created"},
    ):
        try:
            authenticate_internal_request(
                method="POST",
                path="/shf/internal/ingestion/events",
                body=body,
                headers=_signed_headers(body),
            )
        except ValueError as exc:
            assert str(exc) == "internal_service_event_not_allowed"
        else:
            raise AssertionError("invalid Grant Binder producer/event binding was accepted")
