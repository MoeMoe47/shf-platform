from __future__ import annotations

import copy

import pytest

from services.reporting_lineage_service import (
    ALLOWED_TRUTH_ELIGIBILITY,
    REQUIRED_ENTRY_FIELDS,
    LineageRegistryError,
    find_lineage_entry,
    lineage_entries,
    load_lineage_registry,
    validate_lineage_registry,
)
from routers.shf_internal_ingestion_routes import NON_PROJECTED_EVENTS


def test_lineage_registry_loads_and_names_canonical_truth_spine():
    registry = load_lineage_registry()

    assert registry["canonical_truth_authority"] == "services/shf-agent-fabric/services/truth_spine_service.py"
    assert registry["canonical_truth_router"] == "services/shf-agent-fabric/routers/truth_routes.py"
    assert len(registry["entries"]) >= 10


def test_every_lineage_entry_has_required_fields_and_allowed_classification():
    entries = lineage_entries()

    for entry in entries:
        assert set(REQUIRED_ENTRY_FIELDS).issubset(entry)
        assert entry["truth_eligibility"] in ALLOWED_TRUTH_ELIGIBILITY
        assert entry["truth_eligibility"] != "UNRESOLVED"
        assert isinstance(entry["metric_ids"], list)
        assert isinstance(entry["report_ids"], list)
        assert isinstance(entry["evidence"], list)


def test_known_census_dead_ends_are_classified_without_truth_certification():
    expected = {
        "lineage.curriculum.ledger.events.v1": "SENSITIVE_RESTRICTED",
        "lineage.shs.reports.records.v1": "NOT_APPLICABLE",
        "lineage.shs.reports.seed.records.v1": "NOT_APPLICABLE",
        "lineage.shs.report.created.v1": "OPERATIONAL_ONLY",
        "lineage.exchange.workspace.reports.v1": "OPERATIONAL_ONLY",
        "lineage.grant.binder.logs.v1": "OPERATIONAL_ONLY",
        "lineage.placement.kpi.browser.metrics.v1": "AGGREGATE_ONLY",
        "lineage.impact.ohio.map.static.v1": "PUBLICATION_ELIGIBLE",
        "lineage.loo.impact.mock.outcomes.v1": "NOT_APPLICABLE",
        "lineage.reporting.fabricated.csv.export.v1": "NOT_APPLICABLE",
        "lineage.oracle.advisory.outputs.v1": "EVIDENCE_ONLY",
    }

    for lineage_id, truth_eligibility in expected.items():
        entry = find_lineage_entry(lineage_id)
        assert entry is not None
        assert entry["truth_eligibility"] == truth_eligibility
        assert "UNRESOLVED" not in entry.values()

    report_created = find_lineage_entry("lineage.shs.report.created.v1")
    assert report_created["metric_ids"] == []
    assert report_created["report_ids"] == []
    assert report_created["truth_claim_type"] is None
    assert report_created["payload_policy"].endswith("no_draft_content")
    assert ("shs.reporting", "report.created") in NON_PROJECTED_EVENTS


def test_truth_eligible_entries_define_claim_mapping_and_approval_policy():
    truth_entries = [entry for entry in lineage_entries() if entry["truth_eligibility"] == "TRUTH_ELIGIBLE"]

    assert truth_entries
    for entry in truth_entries:
        assert entry["truth_claim_type"]
        assert entry["truth_subject_mapping"]
        assert entry["truth_predicate"]
        assert entry["verification_policy"] == "source_verification_required"
        assert entry["approval_policy"] == "truth_claim_approval_required"
        if entry["lineage_id"] == "lineage.hub.referral.created.v1":
            assert entry["internal_approval_policy"] == "internal_claim_approval_required_separate_from_public_approval"


def test_registry_rejects_unresolved_duplicate_or_browser_authoritative_entries():
    registry = load_lineage_registry()

    unresolved = copy.deepcopy(registry)
    unresolved["entries"][0]["truth_eligibility"] = "UNRESOLVED"
    with pytest.raises(LineageRegistryError):
        validate_lineage_registry(unresolved)

    duplicate = copy.deepcopy(registry)
    duplicate["entries"][1]["lineage_id"] = duplicate["entries"][0]["lineage_id"]
    with pytest.raises(LineageRegistryError):
        validate_lineage_registry(duplicate)

    browser_authoritative = copy.deepcopy(registry)
    browser_authoritative["entries"][0]["operational_store"] = "browser_local_storage"
    browser_authoritative["entries"][0]["current_runtime_status"] = "production_ready"
    with pytest.raises(LineageRegistryError):
        validate_lineage_registry(browser_authoritative)
