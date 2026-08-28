from __future__ import annotations

import pytest

from services import metric_registry_service, truth_history_service, truth_public_population_authority_service, truth_public_population_service, truth_spine_service


@pytest.fixture()
def isolated_population_storage(tmp_path, monkeypatch):
    truth_dir = tmp_path / "truth"
    monkeypatch.setattr(truth_spine_service, "TRUTH_DB_DIR", truth_dir)
    monkeypatch.setattr(truth_spine_service, "CLAIMS_PATH", truth_dir / "claims.json")
    monkeypatch.setattr(truth_spine_service, "SOURCES_PATH", truth_dir / "sources.json")
    monkeypatch.setattr(truth_spine_service, "FEDERATION_PATH", truth_dir / "federation_registry.json")
    monkeypatch.setattr(truth_spine_service, "AUDIT_LOG_PATH", tmp_path / "logs" / "truth.audit.log")
    monkeypatch.setattr(truth_history_service, "HISTORY_PATH", truth_dir / "history.jsonl")
    monkeypatch.setattr(truth_public_population_service, "ELIGIBILITY_PATH", truth_dir / "public_population_eligibility.jsonl")
    monkeypatch.setattr(truth_public_population_authority_service, "AUTHORITY_PATH", truth_dir / "public_population_authorities.jsonl")
    monkeypatch.setattr(truth_public_population_authority_service, "SIGNOFF_PATH", truth_dir / "public_population_signoffs.jsonl")


def _actor(org="org-hub", role="shs_admin"):
    return type("Actor", (), {"user_id": "governed-reviewer", "role": role, "organization_id": org, "tenant_id": f"tenant:{org}" if org else None})()


def _claim(claim_id="hub-claim-1", version=1, org="org-hub"):
    return {
        "claim_id": claim_id,
        "version": version,
        "claim_type": "hub_referral_created",
        "predicate": "referral_created",
        "claim_text": "referral created",
        "subject_id": "case-1",
        "tenant_id": f"tenant:{org}",
        "organization_id": org,
        "ownership_status": "scoped",
        "source_ids": ["source-1"],
        "evidence_ids": ["evidence-1"],
        "lineage_id": "lineage.hub.referral.created.v1",
        "producer_id": "hub.referral",
        "producer_event_type": "referral.created",
        "verification_status": "verified",
        "internal_approval_status": "approved",
        "public_approved": False,
        "superseded_by": None,
        "occurred_at": "2026-08-25T12:00:00+00:00",
    }


def _source():
    return [{"source_id": "source-1", "verification_status": "verified", "organization_id": "org-hub", "ownership_status": "scoped"}]


def _institutional_signoff(claim, actor):
    authority = truth_public_population_authority_service.create_authority(
        _actor(org=None),
        truth_public_population_authority_service.AUTHORITY_TYPE,
        "org-hub",
        "tenant:org-hub",
    )
    return truth_public_population_authority_service.signoff_claim(
        claim["claim_id"], claim["version"], authority["authority_id"], actor,
        "privacy/data-governance approval for aggregate population",
    )


def test_hub_claim_can_join_aggregate_population_without_raw_public_visibility(isolated_population_storage, monkeypatch):
    claim = _claim()
    monkeypatch.setattr(truth_spine_service, "get_claim", lambda claim_id: claim if claim_id == claim["claim_id"] else None)
    monkeypatch.setattr(truth_spine_service, "list_sources", _source)
    actor = _actor()
    _institutional_signoff(claim, actor)

    eligibility = truth_public_population_service.approve(claim["claim_id"], 1, actor, "approved for governed Hub aggregate population")

    assert eligibility["status"] == "PUBLIC_POPULATION_ELIGIBLE"
    assert claim["public_approved"] is False
    assert truth_public_population_service.is_eligible(claim) is True
    assert truth_spine_service.is_publicly_visible(claim) is False
    assert truth_spine_service.list_public_claims() == []


def test_hub_public_metric_uses_population_eligibility_and_not_raw_public_flag(isolated_population_storage, monkeypatch):
    claim = _claim()
    monkeypatch.setattr(truth_spine_service, "list_claims", lambda: [claim])
    monkeypatch.setattr(truth_spine_service, "list_sources", _source)
    monkeypatch.setattr(truth_spine_service, "get_claim", lambda claim_id: claim)
    actor = _actor()
    _institutional_signoff(claim, actor)

    before = metric_registry_service.calculate_metric("hub.referral.created_count.v1", "org-hub", "2026-08-01T00:00:00+00:00", "2026-08-31T23:59:59+00:00", actor=actor, public=True)
    assert before["value"] == 0
    assert before["exclusion_reasons"]["public_population_ineligible"] == 1

    truth_public_population_service.approve(claim["claim_id"], 1, actor, "approved for aggregate population")
    after = metric_registry_service.calculate_metric("hub.referral.created_count.v1", "org-hub", "2026-08-01T00:00:00+00:00", "2026-08-31T23:59:59+00:00", actor=actor, public=True)
    assert after["value"] == 1
    assert claim["public_approved"] is False


def test_population_eligibility_is_exact_version_scoped_and_revocable(isolated_population_storage, monkeypatch):
    claim = _claim()
    monkeypatch.setattr(truth_spine_service, "get_claim", lambda claim_id: claim)
    monkeypatch.setattr(truth_spine_service, "list_sources", _source)
    actor = _actor()
    _institutional_signoff(claim, actor)
    eligibility = truth_public_population_service.approve(claim["claim_id"], 1, actor, "version-bound review")

    with pytest.raises(truth_public_population_service.PublicPopulationEligibilityError, match="claim_version_mismatch"):
        truth_public_population_service.approve(claim["claim_id"], 2, actor, "wrong version")
    revoked = truth_public_population_service.revoke(claim["claim_id"], eligibility["eligibility_id"], actor, "review revoked")
    assert revoked["status"] == "PUBLIC_POPULATION_REVOKED"
    assert truth_public_population_service.is_eligible(claim) is False
    events = truth_history_service.list_history_for_entity(claim["claim_id"])
    assert [event["event_type"] for event in events] == ["claim.public_population_approved", "claim.public_population_revoked"]


def test_current_claim_verification_and_internal_approval_are_rechecked(isolated_population_storage, monkeypatch):
    claim = _claim()
    monkeypatch.setattr(truth_spine_service, "get_claim", lambda claim_id: claim)
    monkeypatch.setattr(truth_spine_service, "list_sources", _source)
    actor = _actor()
    _institutional_signoff(claim, actor)
    truth_public_population_service.approve(claim["claim_id"], 1, actor, "version-bound review")
    assert truth_public_population_service.is_eligible(claim) is True

    claim["verification_status"] = "draft"
    assert truth_public_population_service.is_eligible(claim) is False
    claim["verification_status"] = "verified"
    claim["internal_approval_status"] = "revoked"
    assert truth_public_population_service.is_eligible(claim) is False


def test_population_eligibility_fails_closed_for_permission_scope_and_authority(isolated_population_storage, monkeypatch):
    claim = _claim()
    monkeypatch.setattr(truth_spine_service, "get_claim", lambda claim_id: claim)
    monkeypatch.setattr(truth_spine_service, "list_sources", _source)

    with pytest.raises(truth_public_population_service.PublicPopulationEligibilityError, match="permission_required"):
        truth_public_population_service.approve(claim["claim_id"], 1, _actor(role="client"), "attempt")
    with pytest.raises(truth_public_population_service.PublicPopulationEligibilityError, match="organization_scope_mismatch"):
        truth_public_population_service.approve(claim["claim_id"], 1, _actor(org="other-org"), "attempt")

    with pytest.raises(truth_public_population_service.PublicPopulationEligibilityError, match="institutional_signoff_required"):
        truth_public_population_service.approve(claim["claim_id"], 1, _actor(), "attempt")


def test_governed_signoff_is_exact_scoped_and_revocable(isolated_population_storage, monkeypatch):
    claim = _claim()
    monkeypatch.setattr(truth_spine_service, "get_claim", lambda claim_id: claim)
    monkeypatch.setattr(truth_spine_service, "list_sources", _source)
    actor = _actor()
    authority = truth_public_population_authority_service.create_authority(_actor(org=None), truth_public_population_authority_service.AUTHORITY_TYPE, "org-hub", "tenant:org-hub")
    signoff = truth_public_population_authority_service.signoff_claim(claim["claim_id"], 1, authority["authority_id"], actor, "governed sign-off")
    assert signoff["signoff_type"] == "PUBLIC_AGGREGATE_POPULATION_APPROVAL"
    assert truth_public_population_authority_service.resolve_signoff(claim)["signoff_id"] == signoff["signoff_id"]
    revoked = truth_public_population_authority_service.revoke_signoff(signoff["signoff_id"], actor, "authority review withdrawn")
    assert revoked["status"] == "REVOKED"
    assert truth_public_population_authority_service.resolve_signoff(claim) is None
    history = truth_history_service.list_history_for_entity(signoff["signoff_id"])
    assert [event["event_type"] for event in history] == ["public_population_signoff.approved", "public_population_signoff.revoked"]


def test_authority_delegation_requires_active_parent_and_scope(isolated_population_storage):
    actor = _actor(org=None)
    with pytest.raises(truth_public_population_authority_service.PublicPopulationAuthorityError, match="active_delegating_authority_required"):
        truth_public_population_authority_service.create_authority(actor, truth_public_population_authority_service.DELEGATED_AUTHORITY_TYPE, "org-hub", "tenant:org-hub", "missing")
    parent = truth_public_population_authority_service.create_authority(actor, truth_public_population_authority_service.AUTHORITY_TYPE, "org-hub", "tenant:org-hub")
    delegated = truth_public_population_authority_service.create_authority(actor, truth_public_population_authority_service.DELEGATED_AUTHORITY_TYPE, "org-hub", "tenant:org-hub", parent["authority_id"])
    assert delegated["parent_authority_id"] == parent["authority_id"]
    truth_public_population_authority_service.revoke_authority(parent["authority_id"], actor, "authority retired")
    assert truth_public_population_authority_service._active_authority(delegated["authority_id"], "org-hub", "tenant:org-hub") is None
