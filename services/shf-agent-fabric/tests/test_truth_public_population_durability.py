from __future__ import annotations

from pathlib import Path

import pytest

from services import truth_public_population_authority_service as authority_service
from services import truth_public_population_service
from services import truth_public_population_postgres_repository as postgres_repository


def test_production_mode_selects_postgres_and_never_jsonl_fallback(monkeypatch):
    monkeypatch.setenv("SHS_AUTH_ENV", "production")
    monkeypatch.delenv("SHF_DATABASE_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    assert postgres_repository.is_postgres_mode() is True
    with pytest.raises(truth_public_population_service.PublicPopulationEligibilityError, match="postgres_population_storage_unconfigured"):
        truth_public_population_service._read_events()
    with pytest.raises(authority_service.PublicPopulationAuthorityError, match="postgres_population_storage_unconfigured"):
        authority_service.list_authorities()


def test_durable_migration_contains_scoped_append_only_governance_tables():
    migration = Path(__file__).resolve().parents[3] / "apps" / "shs-api" / "migrations" / "027_truth_public_population_governance.sql"
    text = migration.read_text(encoding="utf-8")
    for table in (
        "truth_public_population_authority_events",
        "truth_public_population_signoff_events",
        "truth_public_population_eligibility_events",
        "truth_public_population_governance_events",
    ):
        assert f"CREATE TABLE IF NOT EXISTS {table}" in text
    assert "WHERE status = 'PUBLIC_POPULATION_ELIGIBLE'" in text
    assert "organization_id" in text and "truth_version" in text
