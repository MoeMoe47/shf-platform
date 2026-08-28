from __future__ import annotations

"""Tests the Truth Spine legacy-data migration against FIXTURE data only.
Never touches services/shf-agent-fabric/db/truth/*.json - see
apply_migration_to_files()'s refusal to write to its own input path, which
test_migration_refuses_to_overwrite_its_own_input asserts directly."""

import json

import pytest

from services import truth_migration
from services.truth_spine_service import is_publicly_visible

LEGACY_CLAIM = {
    "claim_id": "claim_legacy_example",
    "app_id": "shs",
    "claim_text": "A pre-migration claim.",
    "source_ids": ["src_legacy_example"],
    "trace_coverage": 95,
    "verification_status": "verified",
    "public_approved": True,  # pre-existing legacy flag - must NOT be trusted
    "trust_level": "public_approved",
    "report_ready": True,
    "created_at": "2026-01-01T00:00:00+00:00",
    "updated_at": "2026-01-01T00:00:00+00:00",
}

LEGACY_SOURCE = {
    "source_id": "src_legacy_example",
    "source_type": "report",
    "title": "Legacy source",
    "verification_status": "verified",
    "created_at": "2026-01-01T00:00:00+00:00",
    "updated_at": "2026-01-01T00:00:00+00:00",
}


def test_migration_plan_is_read_only_and_does_not_expose_full_records():
    plan = truth_migration.compute_migration_plan([LEGACY_CLAIM], [LEGACY_SOURCE])
    assert plan["claims_to_migrate"] == 1
    assert plan["claim_ids_to_migrate"] == ["claim_legacy_example"]
    assert plan["claims_previously_public_approved"] == ["claim_legacy_example"]
    assert "claim_text" not in json.dumps(plan)  # never leaks claim content


def test_migrated_claim_is_forced_unapproved_and_legacy_unscoped():
    migrated_claims, migrated_sources = truth_migration.migrate([LEGACY_CLAIM], [LEGACY_SOURCE])
    claim = migrated_claims[0]
    assert claim["public_approved"] is False
    assert claim["ownership_status"] == "legacy_unscoped"
    assert claim["organization_id"] is None
    assert claim["legacy_public_approved_flag"] is True  # original value preserved for reference
    assert claim["approved_by"] is None


def test_migrated_legacy_claim_can_never_be_publicly_visible_even_if_flagged_approved():
    migrated_claims, _ = truth_migration.migrate([LEGACY_CLAIM], [LEGACY_SOURCE])
    claim = migrated_claims[0]
    # Even though the ORIGINAL record claimed public_approved=True and
    # verification_status=verified, the migrated record must never satisfy
    # is_publicly_visible() - this is the core safety property of the
    # migration.
    assert is_publicly_visible(claim) is False


def test_migration_is_idempotent():
    once, _ = truth_migration.migrate([LEGACY_CLAIM], [LEGACY_SOURCE])
    twice, _ = truth_migration.migrate(once, [LEGACY_SOURCE])
    assert once[0] == twice[0]


def test_migration_is_deterministic():
    first, _ = truth_migration.migrate([LEGACY_CLAIM], [LEGACY_SOURCE])
    second, _ = truth_migration.migrate([LEGACY_CLAIM], [LEGACY_SOURCE])
    # migrated_at timestamps will differ by real time, so compare all other
    # fields deterministically.
    a = {k: v for k, v in first[0].items() if k != "migrated_at"}
    b = {k: v for k, v in second[0].items() if k != "migrated_at"}
    assert a == b


def test_already_migrated_record_is_left_unchanged():
    once, _ = truth_migration.migrate([LEGACY_CLAIM], [LEGACY_SOURCE])
    assert truth_migration._needs_migration(once[0]) is False
    twice = truth_migration.migrate_claim_record(once[0])
    assert twice is once[0]  # returned unchanged (same object), not re-processed


def test_migration_preserves_record_identifiers():
    migrated_claims, migrated_sources = truth_migration.migrate([LEGACY_CLAIM], [LEGACY_SOURCE])
    assert migrated_claims[0]["claim_id"] == "claim_legacy_example"
    assert migrated_sources[0]["source_id"] == "src_legacy_example"


def test_apply_migration_to_files_refuses_to_overwrite_its_own_input(tmp_path):
    claims_path = tmp_path / "claims.json"
    sources_path = tmp_path / "sources.json"
    claims_path.write_text(json.dumps([LEGACY_CLAIM]), encoding="utf-8")
    sources_path.write_text(json.dumps([LEGACY_SOURCE]), encoding="utf-8")

    with pytest.raises(ValueError):
        truth_migration.apply_migration_to_files(
            claims_path, sources_path, claims_path, sources_path, dry_run=False
        )


def test_apply_migration_to_files_dry_run_does_not_write(tmp_path):
    claims_path = tmp_path / "claims.json"
    sources_path = tmp_path / "sources.json"
    claims_path.write_text(json.dumps([LEGACY_CLAIM]), encoding="utf-8")
    sources_path.write_text(json.dumps([LEGACY_SOURCE]), encoding="utf-8")
    out_claims = tmp_path / "out" / "claims.json"
    out_sources = tmp_path / "out" / "sources.json"

    report = truth_migration.apply_migration_to_files(
        claims_path, sources_path, out_claims, out_sources, dry_run=True
    )
    assert report["dry_run"] is True
    assert report["written"] is False
    assert not out_claims.exists()


def test_apply_migration_to_files_execute_writes_to_new_path_only(tmp_path):
    claims_path = tmp_path / "claims.json"
    sources_path = tmp_path / "sources.json"
    claims_path.write_text(json.dumps([LEGACY_CLAIM]), encoding="utf-8")
    sources_path.write_text(json.dumps([LEGACY_SOURCE]), encoding="utf-8")
    out_claims = tmp_path / "out" / "claims.json"
    out_sources = tmp_path / "out" / "sources.json"

    report = truth_migration.apply_migration_to_files(
        claims_path, sources_path, out_claims, out_sources, dry_run=False
    )
    assert report["written"] is True
    assert out_claims.exists()
    # Original input files are untouched.
    original = json.loads(claims_path.read_text(encoding="utf-8"))
    assert original == [LEGACY_CLAIM]
    migrated = json.loads(out_claims.read_text(encoding="utf-8"))
    assert migrated[0]["ownership_status"] == "legacy_unscoped"
