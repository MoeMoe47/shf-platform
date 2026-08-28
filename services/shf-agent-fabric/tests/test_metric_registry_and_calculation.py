from __future__ import annotations

import copy
import json

import pytest
from fastapi.testclient import TestClient

from auth.sessions import _SESSIONS
from main import app  # type: ignore
from services import evidence_projection_service, metric_registry_service, truth_history_service, truth_spine_service


ORIGIN = "http://127.0.0.1:5174"
CLIENT = ("client@demo.shs", "demo-password")
OTHER_CLIENT = ("client@other-demo.shs", "demo-password")


@pytest.fixture()
def isolated_metric_storage(tmp_path, monkeypatch):
    truth_dir = tmp_path / "truth"
    monkeypatch.setattr(truth_spine_service, "TRUTH_DB_DIR", truth_dir)
    monkeypatch.setattr(truth_spine_service, "CLAIMS_PATH", truth_dir / "claims.json")
    monkeypatch.setattr(truth_spine_service, "SOURCES_PATH", truth_dir / "sources.json")
    monkeypatch.setattr(truth_spine_service, "FEDERATION_PATH", truth_dir / "federation_registry.json")
    monkeypatch.setattr(truth_spine_service, "AUDIT_LOG_PATH", tmp_path / "logs" / "truth.audit.log")
    monkeypatch.setattr(truth_history_service, "HISTORY_PATH", truth_dir / "history.jsonl")
    evidence_dir = tmp_path / "reporting"
    monkeypatch.setattr(evidence_projection_service, "EVIDENCE_DB_DIR", evidence_dir)
    monkeypatch.setattr(evidence_projection_service, "EVIDENCE_PATH", evidence_dir / "evidence.jsonl")
    return tmp_path


@pytest.fixture(autouse=True)
def clear_sessions():
    _SESSIONS.clear()
    yield
    _SESSIONS.clear()


def _login(client, creds=CLIENT):
    response = client.post("/auth/login", json={"email": creds[0], "password": creds[1]}, headers={"Origin": ORIGIN})
    assert response.status_code == 200, response.text
    return response.json()


def _headers(identity):
    return {"x-csrf-token": identity["csrf_token"], "Origin": ORIGIN}


def _definition():
    return metric_registry_service.get_metric_definition("curriculum.lesson.completion_count.v1")


def _source_and_claim(org: str, claim_id: str, subject_id: str, *, approved=True, verification="verified", source_id=None):
    source_id = source_id or f"source-{claim_id}"
    source = {
        "source_id": source_id,
        "organization_id": org,
        "ownership_status": "scoped",
        "verification_status": verification,
        "evidence_id": f"evidence-{claim_id}",
    }
    claim = {
        "claim_id": claim_id,
        "version": 1,
        "claim_type": "curriculum_completion",
        "claim_text": "Student completed lesson",
        "predicate": "completed_lesson",
        "subject_id": subject_id,
        "organization_id": org,
        "ownership_status": "scoped",
        "source_ids": [source_id],
        "verification_status": verification,
        "public_approved": approved,
        "superseded_by": None,
        "occurred_at": "2026-08-25T12:00:00+00:00",
        "evidence_ids": [f"evidence-{claim_id}"],
    }
    return source, claim


def _referral_source_and_claim(org: str, claim_id: str, subject_id: str, *, internal_approved=True, public_approved=False, verification="verified", occurred_at="2026-08-25T12:00:00+00:00"):
    source_id = f"source-{claim_id}"
    source = {
        "source_id": source_id,
        "organization_id": org,
        "ownership_status": "scoped",
        "verification_status": verification,
    }
    claim = {
        "claim_id": claim_id,
        "version": 1,
        "claim_type": "hub_referral_created",
        "claim_text": "referral created",
        "predicate": "referral_created",
        "subject_id": subject_id,
        "tenant_id": f"tenant:{org}",
        "organization_id": org,
        "ownership_status": "scoped",
        "source_ids": [source_id],
        "evidence_ids": [f"evidence-{claim_id}"],
        "lineage_id": "lineage.hub.referral.created.v1",
        "producer_id": "hub.referral",
        "producer_event_type": "referral.created",
        "verification_status": verification,
        "internal_approval_status": "approved" if internal_approved else "not_approved",
        "public_approved": public_approved,
        "superseded_by": None,
        "occurred_at": occurred_at,
    }
    return source, claim


def _commitment_source_and_claim(org: str, claim_id: str, commitment_id: str, *, approved=True, verification="verified", occurred_at="2026-08-26T12:00:00+00:00"):
    source_id = f"source-{claim_id}"
    source = {
        "source_id": source_id,
        "organization_id": org,
        "ownership_status": "scoped",
        "verification_status": verification,
    }
    claim = {
        "claim_id": claim_id,
        "version": 1,
        "claim_type": "funding_commitment_committed",
        "claim_text": "funding_commitment: committed",
        "predicate": "funding_commitment_committed",
        "subject_id": commitment_id,
        "tenant_id": f"tenant:{org}",
        "organization_id": org,
        "ownership_status": "scoped",
        "source_ids": [source_id],
        "evidence_ids": [f"evidence-{claim_id}"],
        "lineage_id": "lineage.shs.exchange.funding_commitment.committed.v1",
        "producer_id": "shs.exchange",
        "producer_event_type": "funding_commitment.committed",
        "verification_status": verification,
        "internal_approval_status": "approved" if approved else "not_approved",
        "public_approved": False,
        "superseded_by": None,
        "occurred_at": occurred_at,
    }
    return source, claim


def test_registry_is_versioned_and_rejects_ambiguous_definitions():
    registry = metric_registry_service.load_metric_registry()
    assert registry["registry_id"]
    assert _definition()["version"] == 1
    for bad in (
        {"metric_id": "x", "version": 1},
        {**_definition(), "formula_type": "unknown"},
        {**_definition(), "zero_denominator_behavior": ""},
        {**_definition(), "public_eligibility": None},
        {**_definition(), "effective_from": "2027-01-01", "effective_to": "2026-01-01"},
        {**_definition(), "status": "UNRESOLVED"},
    ):
        candidate = {"registry_id": "test", "schema_version": "1.0", "definitions": [bad]}
        with pytest.raises(metric_registry_service.MetricRegistryError):
            metric_registry_service.validate_metric_registry(candidate)


def test_calculation_counts_only_approved_current_evidence_backed_claims(isolated_metric_storage, monkeypatch):
    sources = []
    claims = []
    for args in (("org-a", "claim-good", "student-1"), ("org-a", "claim-duplicate", "student-1")):
        source, claim = _source_and_claim(*args)
        sources.append(source)
        claims.append(claim)
    excluded = [
        _source_and_claim("org-a", "claim-draft", "student-2", approved=False, verification="unverified"),
        _source_and_claim("org-a", "claim-revoked", "student-3", approved=False, verification="unverified"),
        _source_and_claim("org-b", "claim-other", "student-4"),
    ]
    for source, claim in excluded:
        sources.append(source)
        claims.append(claim)
    monkeypatch.setattr(truth_spine_service, "list_sources", lambda: copy.deepcopy(sources))
    monkeypatch.setattr(truth_spine_service, "list_claims", lambda: copy.deepcopy(claims))
    result = metric_registry_service.calculate_metric("curriculum.lesson.completion_count.v1", "org-a", "2026-08-01T00:00:00+00:00", "2026-08-31T23:59:59+00:00", actor=type("Actor", (), {"organization_id": "org-a", "role": "client"})())
    assert result["value"] == 1
    assert result["numerator"] == 1
    assert result["denominator"] is None
    assert result["metric_version"] == 1
    assert result["source_claim_ids"] == ["claim-good"]
    assert result["source_evidence_ids"] == ["evidence-claim-good"]
    assert result["definition_digest"]
    assert result["excluded_claim_count"] == 4


def test_public_metric_requires_canonical_public_visibility_and_authz(isolated_metric_storage, monkeypatch):
    client = TestClient(app)
    identity = _login(client)
    source, claim = _source_and_claim(identity["organization_id"], "claim-public", "student-1")
    monkeypatch.setattr(truth_spine_service, "list_sources", lambda: [source])
    monkeypatch.setattr(truth_spine_service, "list_claims", lambda: [claim])
    response = client.get("/shf/metrics/curriculum.lesson.completion_count.v1?public=true", headers=_headers(identity))
    assert response.status_code == 200, response.text
    assert response.json()["metric"]["value"] == 1
    assert "claim_text" not in json.dumps(response.json())
    anonymous = TestClient(app).get("/shf/metrics/curriculum.lesson.completion_count.v1")
    assert anonymous.status_code == 401


def test_metric_endpoint_rejects_cross_tenant_and_client_formula(isolated_metric_storage):
    client = TestClient(app)
    identity = _login(client, OTHER_CLIENT)
    response = client.get("/shf/metrics/curriculum.lesson.completion_count.v1?formula=1", headers=_headers(identity))
    assert response.status_code == 200
    assert response.json()["metric"]["value"] == 0


def test_referral_count_uses_internal_approval_and_distinct_subjects(isolated_metric_storage, monkeypatch):
    source_a, claim_a = _referral_source_and_claim("org-a", "referral-1", "case-1")
    source_b, claim_b = _referral_source_and_claim("org-a", "referral-2", "case-2")
    duplicate_source, duplicate_claim = _referral_source_and_claim("org-a", "referral-replay", "case-1")
    monkeypatch.setattr(truth_spine_service, "list_sources", lambda: [source_a, source_b, duplicate_source])
    monkeypatch.setattr(truth_spine_service, "list_claims", lambda: [claim_a, claim_b, duplicate_claim])
    actor = type("Actor", (), {"organization_id": "org-a", "role": "client"})()
    result = metric_registry_service.calculate_metric(
        "hub.referral.created_count.v1", "org-a", "2026-08-01T00:00:00+00:00", "2026-08-31T23:59:59+00:00", actor=actor,
    )
    assert result["value"] == 2
    assert result["denominator"] is None
    assert result["source_claim_ids"] == ["referral-1", "referral-2"]
    assert result["metric_version"] == 1
    assert result["exclusion_reasons"]["duplicate_subject"] == 1


def test_referral_count_excludes_unapproved_unverified_superseded_and_wrong_scope(isolated_metric_storage, monkeypatch):
    good_source, good = _referral_source_and_claim("org-a", "good", "case-good")
    unapproved_source, unapproved = _referral_source_and_claim("org-a", "unapproved", "case-unapproved", internal_approved=False)
    unverified_source, unverified = _referral_source_and_claim("org-a", "unverified", "case-unverified", verification="unverified")
    wrong_source, wrong = _referral_source_and_claim("org-b", "wrong-org", "case-wrong")
    superseded_source, superseded = _referral_source_and_claim("org-a", "superseded", "case-old")
    superseded["superseded_by"] = "superseded@v2"
    claims = [good, unapproved, unverified, wrong, superseded]
    monkeypatch.setattr(truth_spine_service, "list_sources", lambda: [good_source, unapproved_source, unverified_source, wrong_source, superseded_source])
    monkeypatch.setattr(truth_spine_service, "list_claims", lambda: claims)
    actor = type("Actor", (), {"organization_id": "org-a", "role": "client"})()
    result = metric_registry_service.calculate_metric(
        "hub.referral.created_count.v1", "org-a", "2026-08-01T00:00:00+00:00", "2026-08-31T23:59:59+00:00", actor=actor,
    )
    assert result["value"] == 1
    assert result["excluded_claim_count"] == 4
    assert {"unapproved_claim", "unverified_source", "scope", "superseded"}.issubset(result["exclusion_reasons"])


def test_referral_count_public_mode_requires_population_eligibility_in_addition_to_internal_approval(isolated_metric_storage, monkeypatch):
    source, claim = _referral_source_and_claim("org-a", "internal-only", "case-1", internal_approved=True, public_approved=False)
    public_only_source, public_only_claim = _referral_source_and_claim("org-a", "public-only", "case-2", internal_approved=False, public_approved=True)
    monkeypatch.setattr(truth_spine_service, "list_sources", lambda: [source, public_only_source])
    monkeypatch.setattr(truth_spine_service, "list_claims", lambda: [claim, public_only_claim])
    actor = type("Actor", (), {"organization_id": "org-a", "role": "client"})()
    internal = metric_registry_service.calculate_metric("hub.referral.created_count.v1", "org-a", "2026-08-01T00:00:00+00:00", "2026-08-31T23:59:59+00:00", actor=actor)
    public = metric_registry_service.calculate_metric("hub.referral.created_count.v1", "org-a", "2026-08-01T00:00:00+00:00", "2026-08-31T23:59:59+00:00", actor=actor, public=True)
    assert internal["value"] == 1
    assert public["value"] == 0
    assert public["exclusion_reasons"]["public_population_ineligible"] == 1
    assert public["exclusion_reasons"]["unapproved_claim"] == 1


def test_referral_count_fails_closed_for_missing_metadata_or_source(isolated_metric_storage, monkeypatch):
    source, claim = _referral_source_and_claim("org-a", "missing-metadata", "case-1")
    claim.pop("lineage_id")
    monkeypatch.setattr(truth_spine_service, "list_sources", lambda: [source])
    monkeypatch.setattr(truth_spine_service, "list_claims", lambda: [claim])
    actor = type("Actor", (), {"organization_id": "org-a", "role": "client"})()
    with pytest.raises(metric_registry_service.MetricCalculationError, match="missing_required_metadata"):
        metric_registry_service.calculate_metric("hub.referral.created_count.v1", "org-a", "2026-08-01T00:00:00+00:00", "2026-08-31T23:59:59+00:00", actor=actor)

    claim["lineage_id"] = "lineage.hub.referral.created.v1"
    claim["source_ids"] = ["missing-source"]
    with pytest.raises(metric_registry_service.MetricCalculationError, match="source_unavailable"):
        metric_registry_service.calculate_metric("hub.referral.created_count.v1", "org-a", "2026-08-01T00:00:00+00:00", "2026-08-31T23:59:59+00:00", actor=actor)


def test_referral_count_window_and_zero_are_deterministic(isolated_metric_storage, monkeypatch):
    source, claim = _referral_source_and_claim("org-a", "boundary", "case-boundary", occurred_at="2026-08-01T00:00:00+00:00")
    monkeypatch.setattr(truth_spine_service, "list_sources", lambda: [source])
    monkeypatch.setattr(truth_spine_service, "list_claims", lambda: [claim])
    actor = type("Actor", (), {"organization_id": "org-a", "role": "client"})()
    included = metric_registry_service.calculate_metric("hub.referral.created_count.v1", "org-a", "2026-08-01T00:00:00+00:00", "2026-08-01T00:00:00+00:00", actor=actor)
    excluded = metric_registry_service.calculate_metric("hub.referral.created_count.v1", "org-a", "2026-08-02T00:00:00+00:00", "2026-08-02T00:00:00+00:00", actor=actor)
    assert included["value"] == 1
    assert excluded["value"] == 0
    assert included["denominator"] is None
    assert included["definition_digest"] == excluded["definition_digest"]


def test_referral_count_fails_closed_for_unknown_approval_state(isolated_metric_storage, monkeypatch):
    source, claim = _referral_source_and_claim("org-a", "unknown-approval", "case-1")
    claim["internal_approval_status"] = "pending-review"
    monkeypatch.setattr(truth_spine_service, "list_sources", lambda: [source])
    monkeypatch.setattr(truth_spine_service, "list_claims", lambda: [claim])
    actor = type("Actor", (), {"organization_id": "org-a", "role": "client"})()
    with pytest.raises(metric_registry_service.MetricCalculationError, match="unknown_approval_state"):
        metric_registry_service.calculate_metric("hub.referral.created_count.v1", "org-a", "2026-08-01T00:00:00+00:00", "2026-08-31T23:59:59+00:00", actor=actor)


def test_exchange_commitment_count_is_distinct_historical_and_scoped(isolated_metric_storage, monkeypatch):
    source_a, claim_a = _commitment_source_and_claim("org-a", "commitment-claim-a", "commitment-1")
    source_b, claim_b = _commitment_source_and_claim("org-a", "commitment-claim-b", "commitment-2")
    duplicate_source, duplicate = _commitment_source_and_claim("org-a", "commitment-replay", "commitment-1")
    old_source, old_claim = _commitment_source_and_claim("org-a", "commitment-old", "commitment-3")
    old_claim["superseded_by"] = "commitment-new@v2"
    other_source, other_claim = _commitment_source_and_claim("org-b", "commitment-other", "commitment-4")
    monkeypatch.setattr(truth_spine_service, "list_sources", lambda: [source_a, source_b, duplicate_source, old_source, other_source])
    monkeypatch.setattr(truth_spine_service, "list_claims", lambda: [claim_a, claim_b, duplicate, old_claim, other_claim])
    actor = type("Actor", (), {"organization_id": "org-a", "role": "client"})()
    result = metric_registry_service.calculate_metric(
        "exchange.funding.commitment_count.v1", "org-a", "2026-08-26T00:00:00+00:00", "2026-08-26T23:59:59+00:00", actor=actor,
    )
    assert result["value"] == 2
    assert result["unit"] == "funding_commitments"
    assert result["denominator"] is None
    assert result["exclusion_reasons"]["duplicate_subject"] == 1
    assert result["exclusion_reasons"]["superseded"] == 1
    assert result["exclusion_reasons"]["scope"] == 1


def test_exchange_commitment_count_preserves_boundary_and_fail_closed_eligibility(isolated_metric_storage, monkeypatch):
    source, claim = _commitment_source_and_claim("org-a", "commitment-boundary", "commitment-boundary", occurred_at="2026-08-26T00:00:00+00:00")
    monkeypatch.setattr(truth_spine_service, "list_sources", lambda: [source])
    monkeypatch.setattr(truth_spine_service, "list_claims", lambda: [claim])
    actor = type("Actor", (), {"organization_id": "org-a", "role": "client"})()
    included = metric_registry_service.calculate_metric("exchange.funding.commitment_count.v1", "org-a", "2026-08-26T00:00:00+00:00", "2026-08-26T00:00:00+00:00", actor=actor)
    excluded = metric_registry_service.calculate_metric("exchange.funding.commitment_count.v1", "org-a", "2026-08-27T00:00:00+00:00", "2026-08-27T00:00:00+00:00", actor=actor)
    assert included["value"] == 1
    assert excluded["value"] == 0
    assert included["definition_digest"] == excluded["definition_digest"]

    claim["internal_approval_status"] = "not_approved"
    with pytest.raises(metric_registry_service.MetricCalculationError, match="ineligible_population"):
        metric_registry_service.calculate_metric("exchange.funding.commitment_count.v1", "org-a", "2026-08-26T00:00:00+00:00", "2026-08-26T23:59:59+00:00", actor=actor)


def test_exchange_amount_metric_is_not_registered_without_currency_policy():
    with pytest.raises(metric_registry_service.MetricRegistryError, match="metric not authorized"):
        metric_registry_service.get_metric_definition("exchange.funding.committed_amount.v1")
