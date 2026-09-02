from __future__ import annotations

from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from auth.sessions import _SESSIONS
from main import app  # type: ignore
from services import metric_registry_service, reporting_service, truth_spine_service


ORG = "org-phase7"
ACTOR = SimpleNamespace(organization_id=ORG, role="client_admin")


def _fact(claim_id: str, fact_type: str, subject_id: str, *, organization_id: str = ORG, public=False, occurred_at="2026-08-25T12:00:00+00:00"):
    return {
        "claim_id": claim_id,
        "version": 1,
        "claim_type": "fact",
        "predicate": fact_type,
        "curriculum_fact_type": fact_type,
        "claim_text": fact_type,
        "subject_id": subject_id,
        "organization_id": organization_id,
        "tenant_id": f"tenant:{organization_id}",
        "ownership_status": "scoped",
        "verification_status": "verified",
        "public_approved": public,
        "superseded_by": None,
        "occurred_at": occurred_at,
        "source_type": "assessment_result",
        "source_record_id": f"source-{claim_id}",
        "source_ids": [f"source-{claim_id}"],
        "evidence_ids": [],
        "assignment_id": "assignment-release-1",
        "curriculum_release_id": "release-1",
        "lineage_id": "assignment-release-1|release-1",
        "producer_id": "shs.curriculum",
        "producer_event_type": "assessment.completed",
        "provenance": {"rule_version": 1},
    }


@pytest.fixture(autouse=True)
def clear_sessions():
    _SESSIONS.clear()
    yield
    _SESSIONS.clear()


def test_curriculum_fact_metrics_consume_governed_truth_and_preserve_lineage(monkeypatch):
    claims = [
        _fact("fact-1", "ASSESSMENT_PASSED", "learner-1"),
        _fact("fact-2", "ASSESSMENT_PASSED", "learner-2"),
        _fact("fact-replay", "ASSESSMENT_PASSED", "learner-1"),
        _fact("fact-other", "ASSESSMENT_PASSED", "learner-b", organization_id="org-other"),
        _fact("fact-wrong", "LESSON_COMPLETED", "learner-3"),
    ]
    monkeypatch.setattr(truth_spine_service, "list_sources", lambda: [])
    monkeypatch.setattr(truth_spine_service, "list_claims", lambda: claims)

    result = metric_registry_service.calculate_metric(
        "curriculum.assessment.pass_count.v1", ORG,
        "2026-08-01T00:00:00+00:00", "2026-08-31T23:59:59+00:00", ACTOR,
    )

    assert result["value"] == 2
    assert result["status"] == "OK"
    assert result["source_claim_ids"] == ["fact-1", "fact-2"]
    assert result["assignment_ids"] == ["assignment-release-1"]
    assert result["curriculum_release_ids"] == ["release-1"]
    assert result["source_watermark"]
    assert result["lineage_scope"] == {"organization_id": ORG}


def test_curriculum_fact_metric_distinguishes_no_data_from_zero(monkeypatch):
    monkeypatch.setattr(truth_spine_service, "list_sources", lambda: [])
    monkeypatch.setattr(truth_spine_service, "list_claims", lambda: [])
    result = metric_registry_service.calculate_metric(
        "curriculum.lesson.completion_count.v1", ORG,
        "2026-08-01T00:00:00+00:00", "2026-08-31T23:59:59+00:00", ACTOR,
    )
    assert result["value"] == 0
    assert result["status"] == "NO_DATA"
    assert result["denominator"] is None


def test_learning_report_composes_all_registered_metrics(monkeypatch):
    calls = []

    def fake_metric(metric_id, organization_id, period_start, period_end, actor, public=False, correlation_id=None):
        calls.append(metric_id)
        return {
            "metric_id": metric_id,
            "metric_version": 1,
            "value": 2,
            "unit": "students",
            "status": "OK",
            "verification_status": "verified",
            "public_eligibility": False,
            "suppression_status": "not_suppressed",
            "definition_digest": "digest",
            "source_claim_ids": [f"claim-{metric_id}"],
            "source_claim_versions": [1],
            "source_evidence_ids": [],
            "assignment_ids": ["assignment-1"],
            "curriculum_release_ids": ["release-1"],
            "calculated_at": "2026-08-25T00:00:00+00:00",
            "source_watermark": "watermark",
            "warnings": [],
        }

    monkeypatch.setattr(reporting_service, "calculate_metric", fake_metric)
    report = reporting_service.generate_curriculum_learning_progress_report(
        ACTOR, "2026-08-01T00:00:00+00:00", "2026-08-31T23:59:59+00:00"
    )
    assert len(calls) >= 3
    assert len(report["metric_results"]) == len(calls)
    assert set(report["lineage_reference"]["source_claim_ids"]) == {f"claim-{metric_id}" for metric_id in calls}
    assert report["freshness"]["calculated_at"]


def test_learning_report_route_is_authorized_and_server_calculated(monkeypatch):
    client = TestClient(app)
    identity = client.post(
        "/auth/login",
        json={"email": "client@demo.shs", "password": "demo-password"},
        headers={"Origin": "http://127.0.0.1:5174"},
    ).json()
    monkeypatch.setattr(truth_spine_service, "list_sources", lambda: [])
    monkeypatch.setattr(truth_spine_service, "list_claims", lambda: [])
    response = client.get(
        "/shf/reports/curriculum.learning-progress?formula=client_formula&organization_id=other",
        headers={"x-csrf-token": identity["csrf_token"], "Origin": "http://127.0.0.1:5174"},
    )
    assert response.status_code == 200, response.text
    report = response.json()["report"]
    assert report["organization_id"] == identity["organization_id"]
    assert len(report["metric_results"]) == 5
    assert all(item["status"] == "NO_DATA" for item in report["metric_results"])
    assert "formula" not in report


def test_metric_endpoint_ignores_client_formula_and_denies_cross_org_actor(monkeypatch):
    client = TestClient(app)
    response = client.get("/shf/metrics/curriculum.assessment.pass_count.v1?formula=1", headers={"Origin": "http://127.0.0.1:5174"})
    assert response.status_code == 401

    monkeypatch.setattr(truth_spine_service, "list_sources", lambda: [])
    monkeypatch.setattr(truth_spine_service, "list_claims", lambda: [_fact("fact-1", "ASSESSMENT_PASSED", "learner-1", organization_id="org-other")])
    result = metric_registry_service.calculate_metric(
        "curriculum.assessment.pass_count.v1", ORG,
        "2026-08-01T00:00:00+00:00", "2026-08-31T23:59:59+00:00", ACTOR,
    )
    assert result["value"] == 0
    assert result["status"] == "NO_DATA"


def test_public_curriculum_metric_excludes_private_truth(monkeypatch):
    monkeypatch.setattr(truth_spine_service, "list_sources", lambda: [])
    monkeypatch.setattr(truth_spine_service, "list_claims", lambda: [_fact("fact-private", "ASSESSMENT_PASSED", "learner-1")])
    result = metric_registry_service.calculate_metric(
        "curriculum.assessment.pass_count.v1", ORG,
        "2026-08-01T00:00:00+00:00", "2026-08-31T23:59:59+00:00", ACTOR, public=True,
    )
    assert result["value"] == 0
    assert result["status"] == "NO_DATA"
    assert result["exclusion_reasons"]["not_public"] == 1
