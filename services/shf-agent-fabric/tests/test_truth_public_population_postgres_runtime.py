from __future__ import annotations

import os
from concurrent.futures import ThreadPoolExecutor

import pytest

from services import truth_public_population_authority_service as authority_service
from services import truth_public_population_postgres_repository as durable_repo
from services import truth_public_population_service, truth_spine_service, truth_history_service


pytestmark = pytest.mark.skipif(os.getenv("SHF_RUNTIME_PG_PROOF") != "1", reason="explicit PostgreSQL runtime proof opt-in")


def _actor(org=None, tenant=None):
    return type("Actor", (), {"user_id": "runtime-governance-actor", "role": "shs_admin", "organization_id": org, "tenant_id": tenant if tenant is not None else (f"runtime-tenant:{org}" if org else None)})()


def test_postgres_governance_survives_recreation_and_concurrent_retries(tmp_path, monkeypatch):
    dsn = os.getenv("SHF_DATABASE_URL") or os.getenv("DATABASE_URL") or "postgres://localhost:5432/shs_dev"
    try:
        import psycopg
        with psycopg.connect(dsn) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT organization_id FROM organizations ORDER BY organization_id LIMIT 1")
                organization_id = cursor.fetchone()[0]
    except Exception as exc:
        pytest.fail(f"local PostgreSQL runtime proof unavailable: {exc}")

    monkeypatch.setenv("SHF_PUBLIC_POPULATION_STORAGE", "postgres")
    monkeypatch.setenv("SHF_DATABASE_URL", dsn)
    truth_dir = tmp_path / "truth"
    monkeypatch.setattr(truth_spine_service, "TRUTH_DB_DIR", truth_dir)
    monkeypatch.setattr(truth_spine_service, "CLAIMS_PATH", truth_dir / "claims.json")
    monkeypatch.setattr(truth_spine_service, "SOURCES_PATH", truth_dir / "sources.json")
    monkeypatch.setattr(truth_history_service, "HISTORY_PATH", truth_dir / "history.jsonl")
    monkeypatch.setattr(truth_public_population_service, "ELIGIBILITY_PATH", truth_dir / "eligibility.jsonl")
    monkeypatch.setattr(authority_service, "AUTHORITY_PATH", truth_dir / "authorities.jsonl")
    monkeypatch.setattr(authority_service, "SIGNOFF_PATH", truth_dir / "signoffs.jsonl")

    claim_id = "runtime-public-population-claim"
    claim = {
        "claim_id": claim_id, "version": 1, "claim_type": "hub_referral_created", "predicate": "referral_created",
        "claim_text": "synthetic referral created", "subject_id": "synthetic-case", "tenant_id": "runtime-tenant",
        "organization_id": organization_id, "ownership_status": "scoped", "source_ids": ["runtime-source"],
        "evidence_ids": ["runtime-evidence"], "lineage_id": "lineage.hub.referral.created.v1", "verification_status": "verified",
        "internal_approval_status": "approved", "public_approved": False, "superseded_by": None,
    }
    monkeypatch.setattr(truth_spine_service, "get_claim", lambda requested: claim if requested == claim_id else None)
    monkeypatch.setattr(truth_spine_service, "list_sources", lambda: [{"source_id": "runtime-source", "verification_status": "verified"}])
    actor = _actor(organization_id, "runtime-tenant")
    global_actor = _actor()
    authority = authority_service.create_authority(global_actor, authority_service.AUTHORITY_TYPE, organization_id, "runtime-tenant")
    signoff = authority_service.signoff_claim(claim_id, 1, authority["authority_id"], actor, "synthetic runtime sign-off")
    eligibility = truth_public_population_service.approve(claim_id, 1, actor, "synthetic runtime eligibility")

    assert durable_repo.read_authorities()
    assert durable_repo.read_signoffs()
    assert durable_repo.read_eligibility()
    assert truth_public_population_service.is_eligible(claim) is True
    assert claim["public_approved"] is False

    retries = []
    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(authority_service.signoff_claim, claim_id, 1, authority["authority_id"], actor, "retry") for _ in range(2)]
        for future in futures:
            retries.append(future.result())
    assert len([row for row in durable_repo.read_signoffs() if row["truth_claim_id"] == claim_id and row["status"] == "APPROVED"]) == 1
    assert {row["signoff_id"] for row in retries} == {signoff["signoff_id"]}

    persisted_eligibility = next(row for row in durable_repo.read_eligibility() if row["eligibility_id"] == eligibility["eligibility_id"])
    assert persisted_eligibility["truth_version"] == 1
    assert truth_public_population_service.is_eligible(claim) is True
    monkeypatch.setattr(truth_spine_service, "list_claims", lambda: [claim])
    assert truth_spine_service.list_public_claims() == []

    revoked = truth_public_population_service.revoke(claim_id, eligibility["eligibility_id"], actor, "synthetic revoke")
    assert revoked["status"] == "PUBLIC_POPULATION_REVOKED"
    assert truth_public_population_service.is_eligible(claim) is False

    with psycopg.connect(dsn) as connection:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM truth_public_population_governance_events WHERE target_id=%s OR target_id=%s OR target_id=%s", (authority["authority_id"], signoff["signoff_id"], eligibility["eligibility_id"]))
            cursor.execute("DELETE FROM truth_public_population_eligibility_events WHERE eligibility_id=%s", (eligibility["eligibility_id"],))
            cursor.execute("DELETE FROM truth_public_population_signoff_events WHERE signoff_id=%s", (signoff["signoff_id"],))
            cursor.execute("DELETE FROM truth_public_population_authority_events WHERE authority_id=%s", (authority["authority_id"],))
