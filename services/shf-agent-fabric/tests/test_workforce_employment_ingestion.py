from __future__ import annotations

import hashlib
import hmac
import json
import time
import pytest
from fastapi.testclient import TestClient

from main import app  # type: ignore
from services import evidence_projection_service, operational_event_service, truth_spine_service, truth_history_service
from services.reporting_lineage_service import find_lineage_entry
from services.internal_service_identity import ALLOWED_SERVICE_EVENTS, canonical_request_bytes
from services.operational_event_service import OperationalEventError, _validate_payload


def _body(**overrides):
    body = {
        "producer_id": "shf.workforce",
        "event_type": "employment_started.verified",
        "schema_version": "v1",
        "subject_type": "workforce_employment_outcome",
        "subject_id": "outcome_synthetic_1",
        "organization_id": "org_internal_1",
        "tenant_id": "tenant:org_internal_1",
        "originating_actor_id": "reviewer_1",
        "originating_actor_type": "user",
        "occurred_at": "2026-08-01T00:00:00.000Z",
        "idempotency_key": "workforce-employment-outcome:outcome_synthetic_1:verified",
        "correlation_id": "corr-workforce-1",
        "payload": {
            "outcome_id": "outcome_synthetic_1",
            "participant_ref": "participant:synthetic",
            "program_id": "program:synthetic",
            "outcome_type": "EMPLOYMENT_STARTED",
            "employment_started_at": "2026-08-01T00:00:00.000Z",
            "verification_source_type": "EMPLOYER_CONFIRMATION",
            "lifecycle_status": "verified",
            "version": 2,
        },
    }
    body.update(overrides)
    return body


def _headers(body: dict) -> dict:
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
def isolated_store(tmp_path, monkeypatch):
    monkeypatch.setenv("SHF_INTERNAL_SERVICE_KEYS_JSON", json.dumps({"test-k1": "test-secret"}))
    reporting_dir = tmp_path / "reporting"
    monkeypatch.setattr(operational_event_service, "OPERATIONAL_DB_DIR", reporting_dir)
    monkeypatch.setattr(operational_event_service, "OPERATIONAL_EVENTS_PATH", reporting_dir / "events.jsonl")
    truth_dir = tmp_path / "truth"
    monkeypatch.setattr(evidence_projection_service, "EVIDENCE_DB_DIR", reporting_dir)
    monkeypatch.setattr(evidence_projection_service, "EVIDENCE_PATH", reporting_dir / "evidence.jsonl")
    monkeypatch.setattr(evidence_projection_service, "PROJECTION_RESULTS_PATH", reporting_dir / "projection.jsonl")
    monkeypatch.setattr(truth_spine_service, "TRUTH_DB_DIR", truth_dir)
    monkeypatch.setattr(truth_spine_service, "CLAIMS_PATH", truth_dir / "claims.json")
    monkeypatch.setattr(truth_spine_service, "SOURCES_PATH", truth_dir / "sources.json")
    monkeypatch.setattr(truth_spine_service, "FEDERATION_PATH", truth_dir / "federation.json")
    monkeypatch.setattr(truth_spine_service, "AUDIT_LOG_PATH", tmp_path / "truth.log")
    monkeypatch.setattr(truth_history_service, "HISTORY_PATH", truth_dir / "history.jsonl")
    return reporting_dir, truth_dir


def test_exact_workforce_binding_is_allowlisted_and_invalid_pairs_fail_closed():
    assert ("shf.workforce", "employment_started.verified") in ALLOWED_SERVICE_EVENTS
    for producer, event_type in (
        ("shf.workforce", "referral.created"),
        ("shf.workforce", "funding_commitment.committed"),
        ("shs.exchange", "employment_started.verified"),
        ("hub.referral", "employment_started.verified"),
    ):
        with pytest.raises(OperationalEventError, match="invalid_producer_event_binding"):
            _validate_payload({**_body(), "producer_id": producer, "event_type": event_type})


def test_valid_workforce_ingestion_is_one_operational_event_and_replay_is_idempotent(isolated_store):
    client = TestClient(app)
    reporting_dir, truth_dir = isolated_store
    body = _body()
    first = client.post("/shf/internal/ingestion/events", json=body, headers=_headers(body))
    replay = client.post("/shf/internal/ingestion/events", json=body, headers=_headers(body))
    assert first.status_code == 200, first.text
    assert replay.status_code == 200, replay.text
    assert first.json()["projection"]["status"] == "projected"
    assert replay.json()["event"]["event_id"] == first.json()["event"]["event_id"]
    assert replay.json()["event_idempotent_replay"] is True
    events = [json.loads(line) for line in (reporting_dir / "events.jsonl").read_text().splitlines()]
    assert len(events) == 1
    event = events[0]
    assert event["producer_id"] == "shf.workforce"
    assert event["event_type"] == "employment_started.verified"
    assert event["subject_type"] == "workforce_employment_outcome"
    assert event["subject_id"] == "outcome_synthetic_1"
    assert event["occurred_at"] == "2026-08-01T00:00:00.000Z"
    assert event["payload"]["employment_started_at"] == event["occurred_at"]
    assert event["payload"]["verification_source_type"] == "EMPLOYER_CONFIRMATION"
    evidence = json.loads((reporting_dir / "evidence.jsonl").read_text().splitlines()[0])
    assert evidence["metadata"]["outcome_fact_scope"] == "employment_started_only_not_retention_wage_or_impact"
    assert evidence["verification_status"] == "unverified"
    projection = first.json()["projection"]
    claim = truth_spine_service.get_claim(projection["truth_claim_id"])
    source = truth_spine_service.get_source(projection["truth_source_id"])
    assert claim["predicate"] == "employment_started_verified"
    assert claim["occurred_at"] == event["occurred_at"]
    assert claim["internal_approval_status"] == "not_approved"
    assert claim["public_approved"] is False
    assert source["verification_status"] == "unverified"
    serialized = json.dumps(event["payload"])
    for forbidden in ("participant_name", "email", "phone", "wage", "job_90d", "oracle", "retention", "impact"):
        assert forbidden not in serialized.lower()
    assert not (truth_dir / "metric-results.jsonl").exists()


def test_auth_scope_and_pending_verification_fail_closed(isolated_store):
    client = TestClient(app)
    body = _body()
    forged = {**body, "tenant_id": "tenant:other_org"}
    assert client.post("/shf/internal/ingestion/events", json=forged, headers=_headers(forged)).status_code == 403
    pending = _body(payload={**body["payload"], "verification_source_type": "PARTICIPANT_ATTESTATION"})
    assert client.post("/shf/internal/ingestion/events", json=pending, headers=_headers(pending)).status_code == 422
    missing_auth = client.post("/shf/internal/ingestion/events", json=body)
    assert missing_auth.status_code == 401
    invalid_headers = _headers(body)
    invalid_headers["X-SHF-Service-Signature"] = "0" * 64
    assert client.post("/shf/internal/ingestion/events", json=body, headers=invalid_headers).status_code == 401
