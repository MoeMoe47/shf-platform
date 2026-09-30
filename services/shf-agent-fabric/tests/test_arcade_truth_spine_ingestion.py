from __future__ import annotations

import hashlib
import hmac
import json
import os
import time
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from routers.shf_internal_ingestion_routes import router
from services import evidence_projection_service, operational_event_service, truth_history_service, truth_spine_service, truth_spine_postgres_repository
from services.internal_service_identity import ALLOWED_SERVICE_EVENTS, canonical_request_bytes
from services.operational_event_service import OperationalEventError, _validate_payload

app = FastAPI()
app.include_router(router)


def _body(**overrides):
    body = {
        "producer_id": "curriculum.arcade",
        "event_type": "arcade.resulted",
        "schema_version": "1.0",
        "subject_type": "arcade_result",
        "subject_id": "arcade_result_1",
        "organization_id": "org_arcade_1",
        "tenant_id": "tenant:org_arcade_1",
        "originating_actor_id": "learner_1",
        "originating_actor_type": "user",
        "occurred_at": "2026-09-30T12:00:00.000Z",
        "idempotency_key": "arcade.resulted:arcade_result_1",
        "correlation_id": "arcade:arcade_result_1",
        "evidence_references": ["evidence_1"],
        "payload": {
            "arcade_result_id": "arcade_result_1",
            "arcade_activity_id": "arcade_activity_1",
            "mastery_achieved": True,
            "source_event_type": "arcade.resulted",
            "source_occurred_at": "2026-09-30T12:00:00.000Z",
            "verified_evidence": [{
                "evidence_id": "evidence_1",
                "organization_id": "org_arcade_1",
                "source_type": "ARCADE_RESULT",
                "evidence_rule_id": "arcade_rule_1",
                "evidence_rule_version": 1,
                "status": "REVIEWED",
                "occurred_at": "2026-09-30T12:00:00.000Z",
                "arcade_activity_id": "arcade_activity_1",
            }],
        },
    }
    body.update(overrides)
    return body


def _headers(body: dict, signature_override: str | None = None) -> dict:
    now = int(time.time())
    raw = json.dumps(body, sort_keys=True, separators=(",", ":")).encode()
    digest = hashlib.sha256(raw).hexdigest()
    message = canonical_request_bytes("POST", "/shf/internal/ingestion/events", digest, str(now), str(now + 60), "test-k1")
    signature = signature_override or hmac.new(b"test-secret", message, hashlib.sha256).hexdigest()
    return {
        "X-SHF-Service-Id": "service:shs-api",
        "X-SHF-Service-Kid": "test-k1",
        "X-SHF-Service-Iat": str(now),
        "X-SHF-Service-Exp": str(now + 60),
        "X-SHF-Service-Signature": signature,
    }


@pytest.fixture()
def isolated_store(tmp_path, monkeypatch):
    monkeypatch.setenv("SHF_INTERNAL_SERVICE_KEYS_JSON", json.dumps({"test-k1": "test-secret"}))
    monkeypatch.delenv("SHF_TRUTH_SPINE_STORAGE", raising=False)
    monkeypatch.setenv("SHS_AUTH_ENV", "development")
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.setenv("SHF_TRUTH_PROVIDER", "jsonl")
    reporting_dir = tmp_path / "reporting"
    monkeypatch.setattr(operational_event_service, "OPERATIONAL_DB_DIR", reporting_dir)
    monkeypatch.setattr(operational_event_service, "OPERATIONAL_EVENTS_PATH", reporting_dir / "events.jsonl")
    monkeypatch.setattr(evidence_projection_service, "EVIDENCE_DB_DIR", reporting_dir)
    monkeypatch.setattr(evidence_projection_service, "EVIDENCE_PATH", reporting_dir / "evidence.jsonl")
    monkeypatch.setattr(evidence_projection_service, "PROJECTION_RESULTS_PATH", reporting_dir / "projection.jsonl")
    truth_dir = tmp_path / "truth"
    monkeypatch.setattr(truth_spine_service, "TRUTH_DB_DIR", truth_dir)
    monkeypatch.setattr(truth_spine_service, "CLAIMS_PATH", truth_dir / "claims.json")
    monkeypatch.setattr(truth_spine_service, "SOURCES_PATH", truth_dir / "sources.json")
    monkeypatch.setattr(truth_spine_service, "FEDERATION_PATH", truth_dir / "federation.json")
    monkeypatch.setattr(truth_spine_service, "AUDIT_LOG_PATH", tmp_path / "truth.log")
    monkeypatch.setattr(truth_history_service, "HISTORY_PATH", truth_dir / "history.jsonl")
    return reporting_dir, truth_dir


@pytest.fixture()
def postgres_truth_spine(monkeypatch, tmp_path):
    dsn = os.getenv("SHF_ARCADE_TRUTH_SPINE_TEST_DSN")
    if not dsn:
        pytest.skip("SHF_ARCADE_TRUTH_SPINE_TEST_DSN is required for PostgreSQL acceptance")
    monkeypatch.setenv("SHF_TRUTH_SPINE_STORAGE", "postgres")
    monkeypatch.setenv("SHF_DATABASE_URL", dsn)
    monkeypatch.setenv("SHS_AUTH_ENV", "development")
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.setenv("SHF_INTERNAL_SERVICE_KEYS_JSON", json.dumps({"test-k1": "test-secret"}))
    monkeypatch.setattr(truth_spine_service, "AUDIT_LOG_PATH", tmp_path / "truth.audit.log")
    monkeypatch.setattr(truth_history_service, "HISTORY_PATH", tmp_path / "truth.history.jsonl")
    assert truth_spine_postgres_repository.is_postgres_mode()
    assert truth_spine_postgres_repository.storage_status()["backend"] == "postgres_truth_spine_records"
    truth_spine_postgres_repository.read_records("claims.json")
    return TestClient(app)


def test_exact_arcade_event_is_allowlisted_and_other_arcade_events_are_not(monkeypatch):
    assert ("curriculum.arcade", "arcade.resulted") in ALLOWED_SERVICE_EVENTS
    monkeypatch.setenv("SHF_INTERNAL_SERVICE_KEYS_JSON", json.dumps({"test-k1": "test-secret"}))
    from services.internal_service_identity import authenticate_internal_request
    unsupported = {"producer_id": "curriculum.arcade", "event_type": "arcade.previewed"}
    with pytest.raises(ValueError, match="internal_service_event_not_allowed"):
        authenticate_internal_request(
            method="POST",
            path="/shf/internal/ingestion/events",
            body=unsupported,
            headers=_headers(unsupported),
        )
    with pytest.raises(OperationalEventError, match="invalid_producer_event_binding"):
        _validate_payload({**_body(), "producer_id": "untrusted.arcade"})


def test_signed_arcade_evidence_is_persisted_by_truth_spine_and_replay_is_idempotent(isolated_store):
    client = TestClient(app)
    reporting_dir, truth_dir = isolated_store
    body = _body()
    first = client.post("/shf/internal/ingestion/events", json=body, headers=_headers(body))
    replay = client.post("/shf/internal/ingestion/events", json=body, headers=_headers(body))
    assert first.status_code == 200, first.text
    assert replay.status_code == 200, replay.text
    first_data = first.json()
    replay_data = replay.json()
    assert first_data["projection"]["status"] == "projected"
    assert first_data["projection"]["verification_status"] == "draft"
    assert first_data["projection"]["public_approved"] is False
    assert first_data["projection"]["evidence_ids"] == ["evidence_1"]
    assert replay_data["idempotent_replay"] is True
    assert replay_data["projection"]["truth_claim_id"] == first_data["projection"]["truth_claim_id"]
    claim = truth_spine_service.get_claim(first_data["projection"]["truth_claim_id"])
    source = truth_spine_service.get_source(first_data["projection"]["truth_source_ids"][0])
    assert claim["predicate"] == "ARCADE_MASTERY_ACHIEVED"
    assert claim["subject_id"] == "learner_1"
    assert claim["created_by"] == "service:shs-api"
    assert claim["source_ids"] == first_data["projection"]["truth_source_ids"]
    assert claim["evidence_ids"] == ["evidence_1"]
    assert "arcade_activity_1" in claim["claim_text"]
    assert claim["verification_status"] == "draft"
    assert claim["public_approved"] is False
    assert source["verification_status"] == "unverified"
    assert source["created_by"] == "service:shs-api"
    assert source["uri"] == "verified-evidence://evidence_1"
    assert not (reporting_dir / "events.jsonl").exists()
    assert not (reporting_dir / "evidence.jsonl").exists()
    assert len(json.loads((truth_dir / "claims.json").read_text())) == 1


def test_invalid_signature_and_unreviewed_or_mismatched_evidence_fail_closed(isolated_store):
    client = TestClient(app)
    body = _body()
    assert client.post("/shf/internal/ingestion/events", json=body, headers=_headers(body, "0" * 64)).status_code == 401

    unreviewed = _body()
    unreviewed["payload"]["verified_evidence"][0]["status"] = "REVIEWABLE"
    assert client.post("/shf/internal/ingestion/events", json=unreviewed, headers=_headers(unreviewed)).status_code == 422

    wrong_activity = _body()
    wrong_activity["payload"]["verified_evidence"][0]["arcade_activity_id"] = "arcade_activity_other"
    assert client.post("/shf/internal/ingestion/events", json=wrong_activity, headers=_headers(wrong_activity)).status_code == 422
    assert truth_spine_service.list_claims() == []


def test_signed_arcade_handoff_persists_reads_back_and_replays_idempotently_in_postgres(postgres_truth_spine):
    client = postgres_truth_spine
    run = uuid4().hex
    body = _body()
    result_id = f"arcade_result_pg_{run}"
    evidence_id = f"evidence_pg_{run}"
    body["subject_id"] = result_id
    body["idempotency_key"] = f"arcade.resulted:{result_id}"
    body["correlation_id"] = f"arcade:{result_id}"
    body["payload"]["arcade_result_id"] = result_id
    body["evidence_references"] = [evidence_id]
    body["payload"]["verified_evidence"][0]["evidence_id"] = evidence_id

    before_claims = {row["claim_id"] for row in truth_spine_service.list_claims()}
    before_sources = {row["source_id"] for row in truth_spine_service.list_sources()}
    first = client.post("/shf/internal/ingestion/events", json=body, headers=_headers(body))
    replay = client.post("/shf/internal/ingestion/events", json=body, headers=_headers(body))
    assert first.status_code == replay.status_code == 200
    first_data, replay_data = first.json(), replay.json()
    assert replay_data["idempotent_replay"] is True
    claim_id = first_data["projection"]["truth_claim_id"]
    source_ids = first_data["projection"]["truth_source_ids"]
    assert replay_data["projection"]["truth_claim_id"] == claim_id
    assert replay_data["projection"]["truth_source_ids"] == source_ids
    assert first_data["projection"]["truth_spine_record_id"]

    claim = truth_spine_service.get_claim(claim_id)
    source = truth_spine_service.get_source(source_ids[0])
    viewer_claims = truth_spine_service.list_claims_for_viewer(SimpleNamespace(organization_id="org_arcade_1", role="ROLE_SHS_ADMIN"))
    assert claim in viewer_claims
    assert claim["organization_id"] == "org_arcade_1"
    assert claim["tenant_id"] == "tenant:org_arcade_1"
    assert claim["subject_id"] == "learner_1"
    assert claim["created_by"] == "service:shs-api"
    assert claim["producer_id"] == "curriculum.arcade"
    assert claim["producer_event_type"] == "arcade.resulted"
    assert claim["evidence_ids"] == [evidence_id]
    assert result_id in claim["claim_text"] and "arcade_activity_1" in claim["claim_text"]
    assert claim["verification_status"] == "draft"
    assert claim["public_approved"] is False
    assert source["created_by"] == "service:shs-api"
    assert source["organization_id"] == "org_arcade_1"
    assert source["uri"] == f"verified-evidence://{evidence_id}"
    assert source["verification_status"] == "unverified"
    identity = truth_spine_postgres_repository.find_record_identity("claims.json", claim_id, "tenant:org_arcade_1", "org_arcade_1")
    assert identity["record_id"] == first_data["projection"]["truth_spine_record_id"]
    after_claims = {row["claim_id"] for row in truth_spine_service.list_claims()}
    after_sources = {row["source_id"] for row in truth_spine_service.list_sources()}
    assert after_claims - before_claims == {claim_id}
    assert after_sources - before_sources == set(source_ids)

    def reject_without_write(candidate, expected_status, *, invalid_signature=False):
        claims_before = {row["claim_id"] for row in truth_spine_service.list_claims()}
        sources_before = {row["source_id"] for row in truth_spine_service.list_sources()}
        headers = _headers(candidate, "0" * 64) if invalid_signature else _headers(candidate)
        response = client.post("/shf/internal/ingestion/events", json=candidate, headers=headers)
        assert response.status_code == expected_status, response.text
        assert {row["claim_id"] for row in truth_spine_service.list_claims()} == claims_before
        assert {row["source_id"] for row in truth_spine_service.list_sources()} == sources_before

    reject_without_write(_body(), 401, invalid_signature=True)
    reject_without_write(_body(event_type="arcade.previewed"), 403)
    bad_schema = _body()
    bad_schema["schema_version"] = "2.0"
    reject_without_write(bad_schema, 422)
    bad_subject = _body()
    bad_subject["subject_type"] = "game"
    reject_without_write(bad_subject, 422)
    bad_idempotency = _body()
    bad_idempotency["idempotency_key"] = "arcade.resulted:other_result"
    reject_without_write(bad_idempotency, 422)
    bad_source_event = _body()
    bad_source_event["payload"]["source_event_type"] = "arcade.previewed"
    reject_without_write(bad_source_event, 422)
    bad_source_timestamp = _body()
    bad_source_timestamp["payload"]["source_occurred_at"] = "2026-09-29T12:00:00.000Z"
    reject_without_write(bad_source_timestamp, 422)
    producer_mismatch = _body(producer_id="untrusted.arcade")
    reject_without_write(producer_mismatch, 403)
    unreviewed = _body()
    unreviewed["payload"]["verified_evidence"][0]["status"] = "REVIEWABLE"
    reject_without_write(unreviewed, 422)
    wrong_org = _body(organization_id="org_other", tenant_id="tenant:org_other")
    reject_without_write(wrong_org, 422)
    malformed = _body()
    malformed["payload"]["arcade_result_id"] = "different_result"
    reject_without_write(malformed, 422)
