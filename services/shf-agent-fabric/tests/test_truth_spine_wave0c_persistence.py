import os

from services import truth_spine_postgres_repository as repository


def test_production_truth_spine_selects_postgres_without_json_fallback(monkeypatch):
    monkeypatch.setenv("SHS_AUTH_ENV", "production")
    monkeypatch.delenv("SHF_TRUTH_SPINE_STORAGE", raising=False)
    monkeypatch.delenv("SHF_DATABASE_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)

    assert repository.is_postgres_mode() is True
    assert repository.storage_status()["production_fallback"] is False

    try:
        repository.read_records("claims.json")
    except repository.TruthSpineDatabaseUnavailable as exc:
        assert str(exc) == "truth_spine_postgres_storage_unconfigured"
    else:
        raise AssertionError("production Truth Spine unexpectedly used a file fallback")


def test_development_truth_spine_can_explicitly_use_compatibility_storage(monkeypatch):
    monkeypatch.setenv("SHS_AUTH_ENV", "development")
    monkeypatch.delenv("SHF_TRUTH_SPINE_STORAGE", raising=False)
    assert repository.is_postgres_mode() is False


def test_evidence_records_have_a_durable_postgres_identity(monkeypatch):
    monkeypatch.setenv("SHS_AUTH_ENV", "production")
    monkeypatch.setenv("SHF_DATABASE_URL", "postgres://unused-for-identity-test")
    assert repository._namespace("evidence.jsonl") == "evidence"
    # The production adapter derives identity from evidence_id before opening
    # the database; this guards the projection record contract.
    assert repository._entity_id({"evidence_id": "wave0e-evidence"}) == "wave0e-evidence"
