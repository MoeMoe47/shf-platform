from __future__ import annotations

"""Durable Truth Spine persistence.

This repository is owned by the Truth Spine boundary.  It stores append-only
JSON payloads with tenant and organization scope so the existing Truth Spine
service can retain its compatibility API without promoting GPA tables to an
institutional Truth ledger.
"""

import json
import hashlib
import os
from contextlib import contextmanager
from typing import Any, Dict, Iterator, List


class TruthSpineDatabaseUnavailable(RuntimeError):
    pass


def is_postgres_mode() -> bool:
    configured = os.getenv("SHF_TRUTH_SPINE_STORAGE", "").strip().lower()
    environment = os.getenv("SHS_AUTH_ENV", os.getenv("ENVIRONMENT", "development")).strip().lower()
    return configured == "postgres" or environment == "production"


def _dsn() -> str:
    return (os.getenv("SHF_DATABASE_URL") or os.getenv("DATABASE_URL") or "").strip()


@contextmanager
def transaction() -> Iterator[Any]:
    if not is_postgres_mode():
        raise TruthSpineDatabaseUnavailable("truth_spine_postgres_storage_not_enabled")
    dsn = _dsn()
    if not dsn:
        raise TruthSpineDatabaseUnavailable("truth_spine_postgres_storage_unconfigured")
    try:
        import psycopg  # type: ignore
    except ImportError as exc:
        raise TruthSpineDatabaseUnavailable("truth_spine_postgres_driver_unavailable") from exc
    try:
        with psycopg.connect(dsn) as connection:
            with connection.transaction():
                yield connection
    except TruthSpineDatabaseUnavailable:
        raise
    except Exception as exc:
        raise TruthSpineDatabaseUnavailable("truth_spine_postgres_storage_unavailable") from exc


def _namespace(path_name: str) -> str:
    return path_name.rsplit("/", 1)[-1].rsplit(".", 1)[0]


def _scope(record: Dict[str, Any]) -> tuple[str | None, str | None]:
    return record.get("tenant_id"), record.get("organization_id")


def _entity_id(record: Dict[str, Any]) -> str:
    return str(record.get("claim_id") or record.get("source_id") or record.get("evidence_id") or record.get("event_id") or record.get("projection_id") or record.get("id") or "")


def read_records(path_name: str) -> List[Dict[str, Any]]:
    namespace = _namespace(path_name)
    with transaction() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """SELECT payload FROM truth_spine_records
                   WHERE namespace = %s
                   ORDER BY created_at ASC, record_id ASC""",
                (namespace,),
            )
            return [row[0] if isinstance(row[0], dict) else json.loads(row[0]) for row in cursor.fetchall()]


def append_record(path_name: str, record: Dict[str, Any], *, record_id: str | None = None) -> Dict[str, Any]:
    namespace = _namespace(path_name)
    entity_id = _entity_id(record)
    if not entity_id:
        raise TruthSpineDatabaseUnavailable("truth_spine_record_identity_missing")
    tenant_id, organization_id = _scope(record)
    payload_json = json.dumps(record, sort_keys=True, separators=(",", ":"))
    payload_digest = hashlib.sha256(payload_json.encode("utf-8")).hexdigest()
    with transaction() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """INSERT INTO truth_spine_records
                   (record_id, namespace, entity_id, tenant_id, organization_id, payload, payload_digest)
                   VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s)
                   ON CONFLICT (namespace, entity_id, payload_digest) DO NOTHING
                   RETURNING payload""",
                (record_id or f"truth_record_{__import__('uuid').uuid4().hex}", namespace, entity_id, tenant_id, organization_id, payload_json, payload_digest),
            )
            row = cursor.fetchone()
            if row is None:
                cursor.execute(
                    """SELECT payload FROM truth_spine_records
                       WHERE namespace = %s AND entity_id = %s
                       ORDER BY created_at DESC, record_id DESC LIMIT 1""",
                    (namespace, entity_id),
                )
                row = cursor.fetchone()
            return row[0] if isinstance(row[0], dict) else json.loads(row[0])


def find_record_identity(path_name: str, entity_id: str, tenant_id: str | None, organization_id: str | None) -> Dict[str, Any] | None:
    """Return the durable Truth Spine row identity for an existing payload.

    Payloads remain the Truth Spine record contents; this lookup exposes the
    database identity so upstream compatibility records can retain a pointer
    without becoming a second Truth authority.
    """
    namespace = _namespace(path_name)
    with transaction() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """SELECT record_id, namespace, entity_id, tenant_id,
                          organization_id, payload_digest
                   FROM truth_spine_records
                   WHERE namespace = %s AND entity_id = %s
                     AND tenant_id IS NOT DISTINCT FROM %s
                     AND organization_id IS NOT DISTINCT FROM %s
                   ORDER BY created_at DESC, record_id DESC LIMIT 1""",
                (namespace, entity_id, tenant_id, organization_id),
            )
            row = cursor.fetchone()
            if not row:
                return None
            return {
                "record_id": row[0],
                "namespace": row[1],
                "entity_id": row[2],
                "tenant_id": row[3],
                "organization_id": row[4],
                "payload_digest": row[5],
            }


def replace_records(path_name: str, records: List[Dict[str, Any]]) -> None:
    """Compatibility write: append new payload revisions, never delete history."""
    existing = read_records(path_name)
    seen = {json.dumps(item, sort_keys=True, separators=(",", ":")) for item in existing}
    for record in records:
        encoded = json.dumps(record, sort_keys=True, separators=(",", ":"))
        if encoded not in seen:
            append_record(path_name, record)
            seen.add(encoded)


def storage_status() -> Dict[str, Any]:
    return {
        "backend": "postgres_truth_spine_records",
        "durability_class": "durable_append_only",
        "production_ready": True,
        "configured": bool(_dsn()),
        "production_fallback": False,
    }
