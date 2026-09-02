from __future__ import annotations

import os
from types import SimpleNamespace

import pytest

from services import truth_spine_service
from services.truth_fact_provider import ShsCurriculumTruthProvider, provider_name


@pytest.fixture()
def postgres_fact():
    dsn = os.getenv("SHS_DATABASE_URL") or os.getenv("DATABASE_URL") or "postgres://localhost:5432/shs_dev"
    try:
        import psycopg2
        connection = psycopg2.connect(dsn, connect_timeout=3)
    except Exception as exc:
        pytest.skip(f"PostgreSQL unavailable: {exc}")
    fact_id = "phase6_provider_test_fact"
    with connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO curriculum_truth_facts
                  (truth_fact_id, organization_id, learner_user_id, fact_type,
                   source_type, source_record_id, assignment_id,
                   curriculum_release_id, evidence_rule_id, evidence_rule_version,
                   provenance_json, occurred_at)
                VALUES (%s, 'org_shf_001', 'user_assignment_technical_001',
                        'ASSESSMENT_PASSED', 'ASSESSMENT_RESULT', %s, %s, %s,
                        %s, 1, %s::jsonb, NOW())
                ON CONFLICT (truth_fact_id) DO UPDATE SET provenance_json=EXCLUDED.provenance_json
                """,
                [fact_id, "phase6_provider_source", "phase6_provider_assignment", "phase6_provider_release", "phase6_provider_rule", '{"test":"provider"}'],
            )
    yield dsn, fact_id
    with connection:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM curriculum_truth_facts WHERE truth_fact_id=%s", [fact_id])
    connection.close()


def test_provider_selection_is_explicit_and_has_no_production_jsonl_fallback():
    assert provider_name({"SHF_TRUTH_PROVIDER": "jsonl"}) == "jsonl"
    assert provider_name({"SHF_TRUTH_PROVIDER": "shs_postgres"}) == "shs_postgres"
    assert provider_name({"NODE_ENV": "production"}) == "shs_postgres"
    assert provider_name({"NODE_ENV": "production", "SHF_TRUTH_PROVIDER": "jsonl"}) == "jsonl"


def test_shs_provider_passes_durable_fact_through_existing_governed_query(postgres_fact, monkeypatch):
    dsn, fact_id = postgres_fact
    monkeypatch.setenv("SHF_TRUTH_PROVIDER", "shs_postgres")
    monkeypatch.setenv("SHS_DATABASE_URL", dsn)

    claims = truth_spine_service.list_claims_for_viewer(SimpleNamespace(organization_id="org_shf_001", role="ROLE_SHS_ADMIN"))
    claim = next(item for item in claims if item["claim_id"] == fact_id)
    assert claim["subject_id"] == "user_assignment_technical_001"
    assert claim["organization_id"] == "org_shf_001"
    assert claim["predicate"] == "ASSESSMENT_PASSED"
    assert claim["source_ids"] == ["phase6_provider_source"]
    assert claim["assignment_id"] == "phase6_provider_assignment"
    assert claim["curriculum_release_id"] == "phase6_provider_release"
    assert claim["evidence_rule_id"] == "phase6_provider_rule"
    assert claim["provenance"] == {"test": "provider"}
    assert claim["public_approved"] is False
    assert not any(item["claim_id"] == fact_id for item in truth_spine_service.list_claims_for_viewer(SimpleNamespace(organization_id="org_partner_001", role="ROLE_SHS_ADMIN")))
    assert not any(item["claim_id"] == fact_id for item in truth_spine_service.list_public_claims())
    assert len(ShsCurriculumTruthProvider(dsn).list_facts()) >= 1
