from __future__ import annotations

import json

import pytest
from fastapi.testclient import TestClient

from auth.audit import _EVENTS
from auth.sessions import _SESSIONS
from services import evidence_projection_service, operational_event_service, truth_history_service, truth_spine_service
from main import app  # type: ignore


ORIGIN = "http://127.0.0.1:5174"
CLIENT = ("client@demo.shs", "demo-password")
OTHER_CLIENT = ("client@other-demo.shs", "demo-password")


@pytest.fixture()
def isolated_phase6_storage(tmp_path, monkeypatch):
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
    return {"reporting": reporting_dir, "truth": truth_dir}


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


def _headers(identity: dict, correlation_id: str = "corr-phase6-001") -> dict:
    return {"x-csrf-token": identity["csrf_token"], "x-correlation-id": correlation_id, "Origin": ORIGIN}


def _lesson_payload(**overrides):
    payload = {
        "event_type": "lesson.completed",
        "schema_version": "1.0",
        "producer_id": "curriculum.lesson",
        "subject_type": "lesson",
        "subject_id": "lesson-001",
        "occurred_at": "2026-08-25T12:00:00+00:00",
        "payload": {"curriculum": "asl", "lesson_slug": "asl-01", "secret_note": "do not copy into evidence"},
        "evidence_references": ["browser://legacy/lesson-001"],
        "idempotency_key": "idem-phase6-lesson-001",
        "actor_id": "browser_actor",
        "tenant_id": "browser_tenant",
        "organization_id": "browser_org",
        "verification_status": "verified",
        "public_approved": True,
    }
    payload.update(overrides)
    return payload


def _ingest_lesson(client: TestClient, identity: dict, **overrides) -> dict:
    response = client.post(
        "/shf/ingestion/events",
        json=_lesson_payload(**overrides),
        headers=_headers(identity),
    )
    assert response.status_code == 200, response.text
    return response.json()["event"]


def _project(client: TestClient, identity: dict, event_id: str):
    return client.post(f"/shf/ingestion/events/{event_id}/truth-projection", json={}, headers=_headers(identity))


def _read_jsonl(path):
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def _stored_event(identity: dict, **overrides) -> dict:
    event = {
        "event_id": "op_evt_manual_001",
        "event_type": "lesson.completed",
        "schema_version": "1.0",
        "producer_id": "curriculum.lesson",
        "subject_type": "lesson",
        "subject_id": "lesson-manual",
        "tenant_id": f"tenant:{identity['organization_id']}",
        "organization_id": identity["organization_id"],
        "actor_id": identity["user_id"],
        "actor_type": identity["role"],
        "occurred_at": "2026-08-25T12:00:00+00:00",
        "received_at": "2026-08-25T12:00:01+00:00",
        "payload": {"curriculum": "asl", "secret_note": "must not leak"},
        "evidence_references": [],
        "idempotency_key": "manual-idem-001",
        "correlation_id": "corr-manual",
        "data_classification": "internal",
        "processing_status": "accepted",
    }
    event.update(overrides)
    operational_event_service._append_event(event)
    return event


def test_lesson_completion_projects_to_evidence_backed_unapproved_truth_claim(isolated_phase6_storage):
    client = _client()
    identity = _login(client)
    event = _ingest_lesson(client, identity)

    response = _project(client, identity, event["event_id"])

    assert response.status_code == 200, response.text
    result = response.json()["projection"]
    assert result["status"] == "projected"
    assert result["operational_event_id"] == event["event_id"]
    assert result["truth_claim_version"] == 1
    assert result["lineage_id"] == "lineage.curriculum.lesson.completed.v1"
    assert result["trace"] == {
        "operational_event_id": event["event_id"],
        "evidence_id": result["evidence_id"],
        "truth_source_id": result["truth_source_id"],
        "truth_claim_id": result["truth_claim_id"],
        "truth_claim_version": 1,
    }

    evidence_records = _read_jsonl(isolated_phase6_storage["reporting"] / "evidence.jsonl")
    assert len(evidence_records) == 1
    evidence = evidence_records[0]
    assert evidence["evidence_id"] == result["evidence_id"]
    assert evidence["operational_event_id"] == event["event_id"]
    assert evidence["actor_id"] == identity["user_id"]
    assert evidence["tenant_id"] == f"tenant:{identity['organization_id']}"
    assert evidence["organization_id"] == identity["organization_id"]
    assert evidence["verification_status"] == "unverified"
    assert evidence["storage_classification"] == "repository_abstraction_development_only"
    assert "payload_digest" in evidence
    assert "secret_note" not in json.dumps(evidence)

    source = truth_spine_service.get_source(result["truth_source_id"])
    claim = truth_spine_service.get_claim(result["truth_claim_id"])
    assert source is not None
    assert source["verification_status"] == "unverified"
    assert source["organization_id"] == identity["organization_id"]
    assert source["uri"] == f"evidence://{result['evidence_id']}"
    assert claim is not None
    assert claim["version"] == 1
    assert claim["source_ids"] == [result["truth_source_id"]]
    assert claim["organization_id"] == identity["organization_id"]
    assert claim["created_by"] == identity["user_id"]
    assert claim["public_approved"] is False
    assert claim["verification_status"] == "draft"
    assert claim["trust_level"] == "draft"

    public = client.get("/truth/public/claims")
    assert public.status_code == 200, public.text
    assert all(item["claim_id"] != result["truth_claim_id"] for item in public.json()["claims"])

    second = _project(client, identity, event["event_id"])
    assert second.status_code == 200, second.text
    assert second.json()["idempotent_replay"] is True
    assert second.json()["projection"]["truth_claim_id"] == result["truth_claim_id"]
    assert len(_read_jsonl(isolated_phase6_storage["reporting"] / "evidence.jsonl")) == 1
    assert len(truth_spine_service.list_sources()) == 1
    assert len(truth_spine_service.list_claims()) == 1


def test_anonymous_projection_denied(isolated_phase6_storage):
    client = _client()
    response = client.post("/shf/ingestion/events/op_evt_missing/truth-projection", json={})
    assert response.status_code == 401


def test_missing_projection_permission_denied(isolated_phase6_storage):
    client = _client()
    identity = _login(client)
    event = _ingest_lesson(client, identity)
    for session in _SESSIONS.values():
        if session.user_id == identity["user_id"]:
            session.role = "role_without_permissions"

    response = _project(client, identity, event["event_id"])

    assert response.status_code == 403


def test_wrong_tenant_projection_is_concealed(isolated_phase6_storage):
    client = _client()
    identity = _login(client)
    event = _ingest_lesson(client, identity)
    other_client = _client()
    other_identity = _login(other_client, OTHER_CLIENT)

    response = _project(other_client, other_identity, event["event_id"])

    assert response.status_code == 404
    assert truth_spine_service.list_claims() == []


@pytest.mark.parametrize(
    ("producer_id", "event_type"),
    [
        ("unknown.producer", "lesson.completed"),
        ("curriculum.lesson", "unknown.event"),
    ],
)
def test_missing_or_unknown_lineage_fails_closed(isolated_phase6_storage, producer_id, event_type):
    client = _client()
    identity = _login(client)
    event = _stored_event(identity, producer_id=producer_id, event_type=event_type)

    response = _project(client, identity, event["event_id"])

    assert response.status_code == 409
    assert "lineage_not_found" in response.text
    assert truth_spine_service.list_claims() == []
    assert _read_jsonl(isolated_phase6_storage["reporting"] / "evidence.jsonl") == []


def test_malformed_event_rejected_without_truth_claim(isolated_phase6_storage):
    client = _client()
    identity = _login(client)
    event = _stored_event(identity, subject_id="")

    response = _project(client, identity, event["event_id"])

    assert response.status_code == 422
    assert "malformed_event" in response.text
    assert truth_spine_service.list_claims() == []


@pytest.mark.parametrize(
    ("producer_id", "event_type", "expected_lineage"),
    [
        ("exchange.workspace.reports", "exchange.report.workspace_state", "lineage.exchange.workspace.reports.v1"),
        ("curriculum.browser.ledger", "ledger:events:v1", "lineage.curriculum.ledger.events.v1"),
        ("shs.reports.seed.records", "seed.report.record", "lineage.shs.reports.seed.records.v1"),
        ("loo.impact.mock.outcomes", "mock_outcome_projection", "lineage.loo.impact.mock.outcomes.v1"),
        ("iep.fabricated.student.data", "fabricated_student_report_input", "lineage.iep.fabricated.student.data.v1"),
        ("reporting.fabricated.csv.export", "fabricated_csv_export", "lineage.reporting.fabricated.csv.export.v1"),
        ("shs.reporting", "report.created", "lineage.shs.report.created.v1"),
    ],
)
def test_non_truth_eligible_sources_create_no_claim(isolated_phase6_storage, producer_id, event_type, expected_lineage):
    client = _client()
    identity = _login(client)
    event = _stored_event(identity, producer_id=producer_id, event_type=event_type, subject_type="student")

    response = _project(client, identity, event["event_id"])

    assert response.status_code == 200, response.text
    projection = response.json()["projection"]
    assert projection["status"] == "not_truth_eligible"
    assert projection["lineage_id"] == expected_lineage
    assert projection["truth_claim_id"] is None
    assert projection["evidence_id"] is None
    assert truth_spine_service.list_claims() == []


def test_missing_tenant_or_organization_fails_closed(isolated_phase6_storage):
    client = _client()
    identity = _login(client)
    event = _stored_event(identity, tenant_id="", organization_id="")

    response = _project(client, identity, event["event_id"])

    assert response.status_code in {404, 422}
    assert truth_spine_service.list_claims() == []


def test_evidence_write_failure_creates_no_orphan_claim(isolated_phase6_storage, monkeypatch):
    client = _client()
    identity = _login(client)
    event = _ingest_lesson(client, identity)

    def fail_append(_record):
        raise OSError("disk unavailable with sensitive score 100")

    monkeypatch.setattr(evidence_projection_service, "_append_evidence", fail_append)

    response = _project(client, identity, event["event_id"])

    assert response.status_code == 503
    assert "sensitive score" not in response.text
    assert truth_spine_service.list_sources() == []
    assert truth_spine_service.list_claims() == []


def test_truth_write_failure_records_retryable_projection_failure(isolated_phase6_storage, monkeypatch):
    client = _client()
    identity = _login(client)
    event = _ingest_lesson(client, identity)

    def fail_create_claim(_payload, _actor):
        raise RuntimeError("truth write failed with secret_note")

    monkeypatch.setattr(truth_spine_service, "create_claim", fail_create_claim)

    response = _project(client, identity, event["event_id"])

    assert response.status_code == 503
    assert "secret_note" not in response.text
    failures = _read_jsonl(isolated_phase6_storage["reporting"] / "truth_projection_results.jsonl")
    assert failures[-1]["status"] == "failed"
    assert failures[-1]["retryable"] is True
    assert failures[-1]["error_code"] == "truth_write_failed"
    assert truth_spine_service.list_claims() == []


def test_phase6_tests_use_isolated_storage(isolated_phase6_storage):
    assert str(truth_spine_service.CLAIMS_PATH).startswith(str(isolated_phase6_storage["truth"]))
    assert str(evidence_projection_service.EVIDENCE_PATH).startswith(str(isolated_phase6_storage["reporting"]))
    assert str(operational_event_service.OPERATIONAL_EVENTS_PATH).startswith(str(isolated_phase6_storage["reporting"]))
