from __future__ import annotations

import copy

import pytest

from services import metric_registry_service, truth_spine_service


def _actor(organization_id: str = "org-workforce"):
    return type("Actor", (), {"organization_id": organization_id, "role": "client"})()


def _source_and_claim(
    claim_id: str,
    outcome_id: str,
    *,
    source_status: str = "verified",
    approval: str = "approved",
    occurred_at: str = "2026-08-26T12:00:00+00:00",
    organization_id: str = "org-workforce",
):
    source_id = f"source-{claim_id}"
    source = {
        "source_id": source_id,
        "organization_id": organization_id,
        "ownership_status": "scoped",
        "verification_status": source_status,
    }
    claim = {
        "claim_id": claim_id,
        "version": 1,
        "claim_type": "employment_started_verified",
        "claim_text": "verified employment start",
        "predicate": "employment_started_verified",
        "subject_id": outcome_id,
        "participant_ref": "participant-shared",
        "organization_id": organization_id,
        "tenant_id": f"tenant:{organization_id}",
        "ownership_status": "scoped",
        "source_ids": [source_id],
        "evidence_ids": [f"evidence-{claim_id}"],
        "lineage_id": "lineage.shf.workforce.employment_started.verified.v1",
        "producer_id": "shf.workforce",
        "producer_event_type": "employment_started.verified",
        "verification_status": "verified",
        "internal_approval_status": approval,
        "public_approved": False,
        "superseded_by": None,
        "occurred_at": occurred_at,
        "verified_at": "2026-08-27T12:00:00+00:00",
    }
    return source, claim


@pytest.fixture()
def isolated_truth(monkeypatch, tmp_path):
    monkeypatch.setattr(truth_spine_service, "list_sources", lambda: [])
    monkeypatch.setattr(truth_spine_service, "list_claims", lambda: [])
    return tmp_path


def _calculate(actor=None, start="2026-08-01T00:00:00+00:00", end="2026-08-31T23:59:59+00:00"):
    return metric_registry_service.calculate_metric(
        "workforce.employment.started_verified_count.v1",
        "org-workforce",
        start,
        end,
        actor=actor or _actor(),
    )


def test_workforce_metric_is_registered_once_with_historical_outcome_semantics():
    definition = metric_registry_service.get_metric_definition("workforce.employment.started_verified_count.v1")
    assert definition["formula_type"] == "distinct_subject_count"
    assert definition["formula"] == "count(distinct subject_id)"
    assert definition["source_claim_types"] == ["employment_started_verified"]
    assert definition["source_predicates"] == ["employment_started_verified"]
    assert definition["time_window"] == "occurred_at inclusive period_start and period_end"
    assert definition["time_zone"] == "UTC"
    assert definition["denominator_definition"] is None
    assert "employment_retained_90d" not in definition["description"]


def test_workforce_metric_counts_distinct_outcomes_not_participants_or_projection_rows(isolated_truth, monkeypatch):
    rows = [
        _source_and_claim("start-1", "outcome-1"),
        _source_and_claim("replay-1", "outcome-1"),
        _source_and_claim("start-2", "outcome-2"),
    ]
    sources = [source for source, _ in rows]
    claims = [claim for _, claim in rows]
    monkeypatch.setattr(truth_spine_service, "list_sources", lambda: copy.deepcopy(sources))
    monkeypatch.setattr(truth_spine_service, "list_claims", lambda: copy.deepcopy(claims))

    result = _calculate()

    assert result["value"] == 2
    assert result["population_count"] == 2
    assert result["source_claim_ids"] == ["start-1", "start-2"]
    assert result["denominator"] is None
    assert result["exclusion_reasons"]["duplicate_subject"] == 1


def test_workforce_metric_uses_employment_start_occurred_at_not_verification_time(isolated_truth, monkeypatch):
    in_window = _source_and_claim(
        "start-in-window",
        "outcome-in-window",
        occurred_at="2026-08-01T00:00:00+00:00",
    )
    outside = _source_and_claim(
        "start-outside",
        "outcome-outside",
        occurred_at="2026-07-31T23:59:59+00:00",
    )
    monkeypatch.setattr(truth_spine_service, "list_sources", lambda: [in_window[0], outside[0]])
    monkeypatch.setattr(truth_spine_service, "list_claims", lambda: [in_window[1], outside[1]])

    result = _calculate(start="2026-08-01T00:00:00+00:00", end="2026-08-01T00:00:00+00:00")

    assert result["value"] == 1
    assert result["source_claim_ids"] == ["start-in-window"]


@pytest.mark.parametrize("source_status,approval", [("unverified", "approved"), ("verified", "not_approved")])
def test_workforce_metric_fails_closed_until_source_and_truth_are_eligible(isolated_truth, monkeypatch, source_status, approval):
    source, claim = _source_and_claim("ineligible", "outcome-ineligible", source_status=source_status, approval=approval)
    monkeypatch.setattr(truth_spine_service, "list_sources", lambda: [source])
    monkeypatch.setattr(truth_spine_service, "list_claims", lambda: [claim])

    with pytest.raises(metric_registry_service.MetricCalculationError, match="ineligible_population"):
        _calculate()


def test_workforce_metric_returns_zero_for_successfully_evaluated_empty_population(isolated_truth, monkeypatch):
    monkeypatch.setattr(truth_spine_service, "list_sources", lambda: [])
    monkeypatch.setattr(truth_spine_service, "list_claims", lambda: [])

    result = _calculate()

    assert result["value"] == 0
    assert result["population_count"] == 0


def test_workforce_metric_requires_server_scoped_organization(isolated_truth):
    with pytest.raises(metric_registry_service.MetricCalculationError, match="scope_required"):
        _calculate(actor=_actor("org-other"))


def test_other_workforce_candidates_are_not_registered():
    registry = metric_registry_service.load_metric_registry()
    metric_ids = {definition["metric_id"] for definition in registry["definitions"]}
    assert "workforce.employment.started_verified_count.v1" in metric_ids
    assert not any("placement" in metric_id for metric_id in metric_ids if metric_id.startswith("workforce."))
    assert not any("retention" in metric_id for metric_id in metric_ids if metric_id.startswith("workforce."))
    assert not any("wage" in metric_id for metric_id in metric_ids if metric_id.startswith("workforce."))
    assert not any("current" in metric_id for metric_id in metric_ids if metric_id.startswith("workforce."))
