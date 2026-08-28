from __future__ import annotations

from fastapi.testclient import TestClient
import pytest

from auth.sessions import _SESSIONS
from main import app  # type: ignore
from services import reporting_service, truth_spine_service

ORIGIN = "http://127.0.0.1:5174"


@pytest.fixture(autouse=True)
def clear_sessions():
    _SESSIONS.clear()
    yield
    _SESSIONS.clear()


def _login(client, email="client@demo.shs"):
    response = client.post("/auth/login", json={"email": email, "password": "demo-password"}, headers={"Origin": ORIGIN})
    assert response.status_code == 200
    return response.json()


def _headers(identity):
    return {"x-csrf-token": identity["csrf_token"], "Origin": ORIGIN}


def test_reporting_service_composes_authorized_metric_without_accepting_formula(monkeypatch):
    client = TestClient(app)
    identity = _login(client)
    captured = {}

    def fake_metric(metric_id, organization_id, period_start, period_end, actor, public=False, correlation_id=None):
        captured.update(locals())
        return {"metric_id": metric_id, "metric_version": 1, "value": 2, "unit": "students", "verification_status": "verified", "public_eligibility": public, "suppression_status": "not_suppressed", "definition_digest": "digest", "source_claim_ids": ["claim-1"], "source_evidence_ids": ["evidence-1"], "calculated_at": "2026-08-25T00:00:00+00:00", "warnings": []}

    monkeypatch.setattr(reporting_service, "calculate_metric", fake_metric)
    response = client.get("/shf/reports/curriculum.lesson-completion-count?formula=client_formula&organization_id=other", headers=_headers(identity))
    assert response.status_code == 200, response.text
    report = response.json()["report"]
    assert report["report_definition_id"] == "curriculum.lesson_completion_count"
    assert report["report_definition_version"] == 1
    assert report["metric_results"][0]["metric_id"] == "curriculum.lesson.completion_count.v1"
    assert report["lineage_reference"]["source_claim_ids"] == ["claim-1"]
    assert captured["organization_id"] == identity["organization_id"]
    assert "formula" not in report


def test_reporting_service_requires_auth_and_hides_unsupported_report():
    client = TestClient(app)
    assert client.get("/shf/reports/curriculum.lesson-completion-count").status_code == 401
    identity = _login(client)
    response = client.get("/shf/reports/unsupported", headers=_headers(identity))
    assert response.status_code == 404


def test_report_definition_registry_rejects_unknown_metric():
    registry = reporting_service.load_report_registry()
    exchange = next(item for item in registry["definitions"] if item["report_definition_id"] == "exchange.funding.commitment_count")
    assert exchange["metric_ids"] == ["exchange.funding.commitment_count.v1"]
    assert "formula" not in exchange
    invalid = {**registry, "definitions": [{**registry["definitions"][0], "metric_ids": ["unknown"]}]}
    with pytest.raises(reporting_service.ReportingRegistryError):
        reporting_service.validate_report_registry(invalid)


def test_workforce_report_definition_binds_one_metric_without_formula():
    workforce = next(
        item for item in reporting_service.load_report_registry()["definitions"]
        if item["report_definition_id"] == "workforce.employment.started_verified_count"
    )
    assert workforce["metric_ids"] == ["workforce.employment.started_verified_count.v1"]
    assert workforce["permission"] == "shf.report.read"
    assert "formula" not in workforce


def test_hub_referral_report_composes_registered_metric_and_preserves_lineage(monkeypatch):
    client = TestClient(app)
    identity = _login(client)
    captured = {}

    def fake_metric(metric_id, organization_id, period_start, period_end, actor, public=False, correlation_id=None):
        captured.update(locals())
        return {
            "metric_id": metric_id,
            "metric_version": 1,
            "value": 2,
            "unit": "referrals",
            "verification_status": "verified",
            "public_eligibility": public,
            "suppression_status": "not_suppressed",
            "definition_digest": "referral-digest",
            "source_claim_ids": ["claim-referral-1", "claim-referral-2"],
            "source_claim_versions": [1, 1],
            "source_evidence_ids": ["evidence-referral-1", "evidence-referral-2"],
            "calculated_at": "2026-08-25T00:00:00+00:00",
            "warnings": [],
        }

    monkeypatch.setattr(reporting_service, "calculate_metric", fake_metric)
    response = client.get(
        "/shf/reports/hub.referral-created-count?organization_id=other&tenant_id=other&formula=client_formula",
        headers=_headers(identity),
    )
    assert response.status_code == 200, response.text
    report = response.json()["report"]
    assert report["report_id"] == "report.hub.referral.created_count.v1"
    assert report["report_definition_id"] == "hub.referral.created_count"
    assert report["report_definition_version"] == 1
    assert report["metric_results"][0]["metric_id"] == "hub.referral.created_count.v1"
    assert report["metric_results"][0]["metric_version"] == 1
    assert report["lineage_reference"]["source_claim_ids"] == ["claim-referral-1", "claim-referral-2"]
    assert report["lineage_reference"]["source_evidence_ids"] == ["evidence-referral-1", "evidence-referral-2"]
    assert captured["organization_id"] == identity["organization_id"]
    assert "formula" not in report


def test_hub_referral_report_preserves_zero_and_rejects_unavailable_population(monkeypatch):
    client = TestClient(app)
    identity = _login(client)

    monkeypatch.setattr(reporting_service, "calculate_metric", lambda *args, **kwargs: {
        "metric_id": "hub.referral.created_count.v1", "metric_version": 1, "value": 0, "unit": "referrals",
        "verification_status": "verified", "public_eligibility": False, "suppression_status": "not_suppressed",
        "definition_digest": "digest", "source_claim_ids": [], "source_evidence_ids": [],
        "calculated_at": "2026-08-25T00:00:00+00:00", "warnings": [],
    })
    zero = client.get("/shf/reports/hub.referral-created-count", headers=_headers(identity))
    assert zero.status_code == 200
    assert zero.json()["report"]["metric_results"][0]["value"] == 0

    def unavailable(*args, **kwargs):
        raise reporting_service.MetricCalculationError("source_unavailable")

    monkeypatch.setattr(reporting_service, "calculate_metric", unavailable)
    failed = client.get("/shf/reports/hub.referral-created-count", headers=_headers(identity))
    assert failed.status_code == 422


def test_hub_referral_public_report_requires_metric_public_eligibility(monkeypatch):
    client = TestClient(app)
    identity = _login(client)
    captured = {}

    def fake_metric(*args, **kwargs):
        captured.update(kwargs)
        return {
            "metric_id": "hub.referral.created_count.v1", "metric_version": 1, "value": 0, "unit": "referrals",
            "verification_status": "verified", "public_eligibility": False, "suppression_status": "not_suppressed",
            "definition_digest": "digest", "source_claim_ids": [], "source_evidence_ids": [],
            "calculated_at": "2026-08-25T00:00:00+00:00", "warnings": [],
        }

    monkeypatch.setattr(reporting_service, "calculate_metric", fake_metric)
    response = client.get("/shf/reports/hub.referral-created-count?public=true", headers=_headers(identity))
    assert response.status_code == 422
    assert captured["public"] is True


def test_exchange_commitment_report_binds_only_registered_historical_metric(monkeypatch):
    client = TestClient(app)
    identity = _login(client)
    captured = {}

    def fake_metric(metric_id, organization_id, period_start, period_end, actor, public=False, correlation_id=None):
        captured.update(locals())
        return {
            "metric_id": metric_id, "metric_version": 1, "value": 3, "unit": "funding_commitments",
            "verification_status": "verified", "public_eligibility": False, "suppression_status": "not_suppressed",
            "definition_digest": "commitment-digest", "source_claim_ids": ["claim-commitment-1"],
            "source_evidence_ids": ["evidence-commitment-1"], "calculated_at": "2026-08-26T00:00:00+00:00", "warnings": [],
        }

    monkeypatch.setattr(reporting_service, "calculate_metric", fake_metric)
    response = client.get("/shf/reports/exchange.funding-commitment-count?organization_id=other&tenant_id=other", headers=_headers(identity))
    assert response.status_code == 200, response.text
    report = response.json()["report"]
    assert report["report_id"] == "report.exchange.funding.commitment_count.v1"
    assert report["report_definition_id"] == "exchange.funding.commitment_count"
    assert report["metric_results"][0]["metric_id"] == "exchange.funding.commitment_count.v1"
    assert report["metric_results"][0]["unit"] == "funding_commitments"
    assert captured["organization_id"] == identity["organization_id"]
    assert captured["public"] is False
    assert "amount" not in report


def test_exchange_commitment_report_preserves_zero_and_rejects_unavailable(monkeypatch):
    client = TestClient(app)
    identity = _login(client)
    zero_metric = {
        "metric_id": "exchange.funding.commitment_count.v1", "metric_version": 1, "value": 0, "unit": "funding_commitments",
        "verification_status": "verified", "public_eligibility": False, "suppression_status": "not_suppressed",
        "definition_digest": "digest", "source_claim_ids": [], "source_evidence_ids": [],
        "calculated_at": "2026-08-26T00:00:00+00:00", "warnings": [],
    }
    monkeypatch.setattr(reporting_service, "calculate_metric", lambda *args, **kwargs: zero_metric)
    response = client.get("/shf/reports/exchange.funding-commitment-count", headers=_headers(identity))
    assert response.status_code == 200
    assert response.json()["report"]["metric_results"][0]["value"] == 0

    monkeypatch.setattr(reporting_service, "calculate_metric", lambda *args, **kwargs: (_ for _ in ()).throw(reporting_service.MetricCalculationError("ineligible_population")))
    unavailable = client.get("/shf/reports/exchange.funding-commitment-count", headers=_headers(identity))
    assert unavailable.status_code == 422


def test_exchange_commitment_report_requires_auth_and_is_not_public(monkeypatch):
    client = TestClient(app)
    assert client.get("/shf/reports/exchange.funding-commitment-count").status_code == 401
    identity = _login(client)
    response = client.get("/shf/reports/exchange.funding-commitment-count?public=true", headers=_headers(identity))
    assert response.status_code == 422


def test_exchange_commitment_report_requires_read_permission():
    client = TestClient(app)
    identity = _login(client)
    _SESSIONS[next(iter(_SESSIONS))].role = "role_without_report_permission"
    response = client.get("/shf/reports/exchange.funding-commitment-count", headers=_headers(identity))
    assert response.status_code == 403


def test_workforce_report_binds_only_historical_verified_employment_metric(monkeypatch):
    client = TestClient(app)
    identity = _login(client)
    captured = {}

    def fake_metric(metric_id, organization_id, period_start, period_end, actor, public=False, correlation_id=None):
        captured.update(locals())
        return {
            "metric_id": metric_id, "metric_version": 1, "value": 1, "unit": "employment_starts",
            "verification_status": "verified", "public_eligibility": False, "suppression_status": "not_suppressed",
            "definition_digest": "workforce-digest", "source_claim_ids": ["claim-employment-1"],
            "source_evidence_ids": ["evidence-employment-1"], "calculated_at": "2026-08-26T00:00:00+00:00", "warnings": [],
        }

    monkeypatch.setattr(reporting_service, "calculate_metric", fake_metric)
    response = client.get(
        "/shf/reports/workforce.employment-started-verified-count?organization_id=other&tenant_id=other&public=false",
        headers=_headers(identity),
    )
    assert response.status_code == 200, response.text
    report = response.json()["report"]
    assert report["report_id"] == "report.workforce.employment.started_verified_count.v1"
    assert report["report_definition_id"] == "workforce.employment.started_verified_count"
    assert report["metric_results"][0]["metric_id"] == "workforce.employment.started_verified_count.v1"
    assert captured["organization_id"] == identity["organization_id"]
    assert captured["public"] is False
    assert "formula" not in report
    assert "placement" not in report["report_definition_id"]
    assert "retention" not in report["report_definition_id"]
    assert "wage" not in report["report_definition_id"]


def test_workforce_report_preserves_zero_and_rejects_unavailable_or_public(monkeypatch):
    client = TestClient(app)
    identity = _login(client)
    zero_metric = {
        "metric_id": "workforce.employment.started_verified_count.v1", "metric_version": 1, "value": 0, "unit": "employment_starts",
        "verification_status": "verified", "public_eligibility": False, "suppression_status": "not_suppressed",
        "definition_digest": "digest", "source_claim_ids": [], "source_evidence_ids": [],
        "calculated_at": "2026-08-26T00:00:00+00:00", "warnings": [],
    }
    monkeypatch.setattr(reporting_service, "calculate_metric", lambda *args, **kwargs: zero_metric)
    zero = client.get("/shf/reports/workforce.employment-started-verified-count", headers=_headers(identity))
    assert zero.status_code == 200
    assert zero.json()["report"]["metric_results"][0]["value"] == 0

    monkeypatch.setattr(reporting_service, "calculate_metric", lambda *args, **kwargs: (_ for _ in ()).throw(reporting_service.MetricCalculationError("ineligible_population")))
    unavailable = client.get("/shf/reports/workforce.employment-started-verified-count", headers=_headers(identity))
    assert unavailable.status_code == 422

    public = client.get("/shf/reports/workforce.employment-started-verified-count?public=true", headers=_headers(identity))
    assert public.status_code == 422


def test_workforce_report_requires_auth_and_permission():
    client = TestClient(app)
    assert client.get("/shf/reports/workforce.employment-started-verified-count").status_code == 401
    identity = _login(client)
    _SESSIONS[next(iter(_SESSIONS))].role = "role_without_report_permission"
    response = client.get("/shf/reports/workforce.employment-started-verified-count", headers=_headers(identity))
    assert response.status_code == 403
