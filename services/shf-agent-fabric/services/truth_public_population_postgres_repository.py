from __future__ import annotations

"""PostgreSQL persistence for Truth aggregate-population governance only."""

import json
import os
import uuid
from contextlib import contextmanager
from typing import Any, Dict, Iterator, List


class PublicPopulationDatabaseUnavailable(RuntimeError):
    pass


def is_postgres_mode() -> bool:
    configured = os.getenv("SHF_PUBLIC_POPULATION_STORAGE", "").strip().lower()
    environment = os.getenv("SHS_AUTH_ENV", os.getenv("ENVIRONMENT", "development")).strip().lower()
    return configured == "postgres" or environment == "production"


def _dsn() -> str:
    return (os.getenv("SHF_DATABASE_URL") or os.getenv("DATABASE_URL") or "").strip()


@contextmanager
def transaction() -> Iterator[Any]:
    if not is_postgres_mode():
        raise PublicPopulationDatabaseUnavailable("postgres_population_storage_not_enabled")
    dsn = _dsn()
    if not dsn:
        raise PublicPopulationDatabaseUnavailable("postgres_population_storage_unconfigured")
    try:
        import psycopg  # type: ignore
    except ImportError as exc:
        raise PublicPopulationDatabaseUnavailable("postgres_driver_unavailable") from exc
    try:
        with psycopg.connect(dsn) as connection:
            with connection.transaction():
                yield connection
    except Exception as exc:
        if isinstance(exc, PublicPopulationDatabaseUnavailable):
            raise
        raise PublicPopulationDatabaseUnavailable("postgres_population_storage_unavailable") from exc


def _rows(sql: str, params: tuple[Any, ...]) -> List[Dict[str, Any]]:
    with transaction() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            columns = [item.name for item in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]


def read_authorities() -> List[Dict[str, Any]]:
    return _rows("SELECT * FROM truth_public_population_authority_events ORDER BY created_at, authority_event_id", ())


def read_signoffs() -> List[Dict[str, Any]]:
    return _rows("SELECT * FROM truth_public_population_signoff_events ORDER BY created_at, signoff_event_id", ())


def read_eligibility() -> List[Dict[str, Any]]:
    return _rows("SELECT * FROM truth_public_population_eligibility_events ORDER BY created_at, eligibility_event_id", ())


def append_authority(row: Dict[str, Any]) -> Dict[str, Any]:
    with transaction() as connection:
        with connection.cursor() as cursor:
            cursor.execute("""INSERT INTO truth_public_population_authority_events
              (authority_event_id, authority_id, authority_type, authority_reference, tenant_id, organization_id,
               parent_authority_id, status, effective_from, effective_to, revoked_at, actor_user_id, reason, version)
              VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *""", (
                f"paevt_{uuid.uuid4().hex[:16]}", row["authority_id"], row["authority_type"], row["authority_reference"],
                row["tenant_id"], row["organization_id"], row.get("parent_authority_id"), row["status"],
                row["effective_from"], row.get("effective_to"), row.get("revoked_at"), row.get("created_by", row.get("revoked_by", "")), row.get("reason"), row["version"],
            ))
            result = dict(zip([item.name for item in cursor.description], cursor.fetchone()))
            audit(cursor, row.get("event_type", "public_population_authority.created"), row["authority_id"], row, row["tenant_id"], row["organization_id"], row["created_by"])
            return result


def append_signoff(row: Dict[str, Any]) -> Dict[str, Any]:
    claim_id, truth_version = row["truth_claim_id"], row["truth_version"]
    with transaction() as connection:
        with connection.cursor() as cursor:
            cursor.execute("""INSERT INTO truth_public_population_signoff_events
              (signoff_event_id, signoff_id, truth_claim_id, truth_version, predicate, tenant_id, organization_id,
               authority_id, signoff_type, institutional_authority_reference, status, actor_user_id, reason, signed_at, revoked_at, version)
              VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
              ON CONFLICT DO NOTHING RETURNING *""", (
                f"psevt_{uuid.uuid4().hex[:16]}", row["signoff_id"], row["truth_claim_id"], row["truth_version"], row["predicate"],
                row["tenant_id"], row["organization_id"], row["authority_id"], row["signoff_type"], row["institutional_authority_reference"],
                row["status"], row.get("revoked_by", row["signed_by"]), row.get("reason"), row.get("signed_at"), row.get("revoked_at"), row["version"],
            ))
            inserted = cursor.fetchone()
            if inserted is None:
                cursor.execute("SELECT * FROM truth_public_population_signoff_events WHERE truth_claim_id=%s AND truth_version=%s AND status='APPROVED' ORDER BY created_at DESC LIMIT 1", (claim_id, truth_version))
                inserted = cursor.fetchone()
            result = dict(zip([item.name for item in cursor.description], inserted))
            audit(cursor, row.get("event_type", "public_population_signoff.approved"), row["signoff_id"], row, row["tenant_id"], row["organization_id"], row["signed_by"])
            return result


def append_eligibility(row: Dict[str, Any]) -> Dict[str, Any]:
    claim_id, truth_version = row["truth_claim_id"], row["truth_version"]
    with transaction() as connection:
        with connection.cursor() as cursor:
            cursor.execute("""INSERT INTO truth_public_population_eligibility_events
              (eligibility_event_id, eligibility_id, truth_claim_id, truth_version, predicate, tenant_id, organization_id,
               authority_id, signoff_id, status, actor_user_id, reason, revoked_at, version)
              VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
              ON CONFLICT DO NOTHING RETURNING *""", (
                f"peevt_{uuid.uuid4().hex[:16]}", row["eligibility_id"], row["truth_claim_id"], row["truth_version"], row["predicate"],
                row["tenant_id"], row["organization_id"], row["authority_id"], row["signoff_id"], row["status"],
                row.get("revoked_by", row.get("approved_by", "")), row.get("reason"), row.get("revoked_at"), row["version"],
            ))
            inserted = cursor.fetchone()
            if inserted is None:
                cursor.execute("SELECT * FROM truth_public_population_eligibility_events WHERE truth_claim_id=%s AND truth_version=%s AND status='PUBLIC_POPULATION_ELIGIBLE' ORDER BY created_at DESC LIMIT 1", (claim_id, truth_version))
                inserted = cursor.fetchone()
            result = dict(zip([item.name for item in cursor.description], inserted))
            audit(cursor, row.get("event_type", "truth.public_population_approved"), row["eligibility_id"], row, row["tenant_id"], row["organization_id"], row.get("revoked_by", row.get("approved_by", "")))
            return result


def audit(cursor: Any, event_type: str, target_id: str, metadata: Dict[str, Any], tenant_id: str, organization_id: str, actor_id: str) -> None:
    safe = {key: value for key, value in metadata.items() if key not in {"claim_text", "subject_id", "evidence_ids", "source_ids"}}
    cursor.execute("""INSERT INTO truth_public_population_governance_events
      (governance_event_id, event_type, target_id, tenant_id, organization_id, actor_user_id, event_metadata)
      VALUES (%s,%s,%s,%s,%s,%s,%s::jsonb)""", (f"pgevt_{uuid.uuid4().hex[:16]}", event_type, target_id, tenant_id, organization_id, actor_id, json.dumps(safe, default=str)))
