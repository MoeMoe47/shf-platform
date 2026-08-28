from __future__ import annotations

import hashlib
import logging
import os
import threading
from dataclasses import dataclass
from typing import Any

import psycopg2
from services.operational_telemetry import emit_operational_telemetry


LOGGER = logging.getLogger(__name__)
LIMITER_CLASS = "INTERNAL_INGESTION_LIMIT"
DEFAULT_MAX = 60
DEFAULT_WINDOW_SECONDS = 60


class InternalIngestionRateLimitError(RuntimeError):
    """The shared limiter could not make an authoritative decision."""


@dataclass(frozen=True)
class InternalIngestionRateLimitDecision:
    allowed: bool
    retry_after_seconds: int
    backend: str


_telemetry_lock = threading.Lock()
_telemetry = {"allowed": 0, "rejected": 0, "backend_failure": 0}
_memory_lock = threading.Lock()
_memory_windows: dict[str, tuple[int, int]] = {}


def _is_production() -> bool:
    return str(os.getenv("SHF_AUTH_ENV") or os.getenv("NODE_ENV") or "development").lower() == "production"


def _config() -> tuple[int, int]:
    max_raw = os.getenv("SHS_RATE_LIMIT_INTERNAL_INGESTION_MAX")
    window_raw = os.getenv("SHS_RATE_LIMIT_INTERNAL_INGESTION_WINDOW_SECONDS")
    if _is_production() and (not max_raw or not window_raw):
        raise InternalIngestionRateLimitError("internal_ingestion_rate_limit_configuration_required")
    try:
        maximum = int(max_raw or DEFAULT_MAX)
        window_seconds = int(window_raw or DEFAULT_WINDOW_SECONDS)
    except ValueError as exc:
        raise InternalIngestionRateLimitError("internal_ingestion_rate_limit_configuration_invalid") from exc
    if maximum <= 0 or window_seconds <= 0:
        raise InternalIngestionRateLimitError("internal_ingestion_rate_limit_configuration_invalid")
    return maximum, window_seconds


def _database_url() -> str:
    return str(os.getenv("SHS_DATABASE_URL") or os.getenv("DATABASE_URL") or "").strip()


def _record_telemetry(kind: str) -> None:
    with _telemetry_lock:
        _telemetry[kind] += 1


def telemetry_snapshot() -> dict[str, int]:
    from services.operational_telemetry import operational_telemetry_snapshot

    with _telemetry_lock:
        snapshot = dict(_telemetry)
    snapshot.update({f"operational:{key}": value for key, value in operational_telemetry_snapshot().items()})
    return snapshot


def _safe_producer_reference(service_id: str) -> str:
    return hashlib.sha256(service_id.encode("utf-8")).hexdigest()[:16]


def consume_internal_ingestion_limit(service_id: str) -> InternalIngestionRateLimitDecision:
    """Consume one producer-wide shared window after HMAC and binding checks."""
    trusted_service_id = str(service_id or "").strip()
    if not trusted_service_id:
        raise InternalIngestionRateLimitError("trusted_service_identity_required")
    maximum, window_seconds = _config()
    limiter_key = f"{LIMITER_CLASS}:service:{trusted_service_id}"

    if not _is_production() and not _database_url():
        import time

        now = int(time.time())
        with _memory_lock:
            count, expires_at = _memory_windows.get(limiter_key, (0, now + window_seconds))
            if expires_at <= now:
                count, expires_at = 0, now + window_seconds
            count += 1
            _memory_windows[limiter_key] = (count, expires_at)
        decision = InternalIngestionRateLimitDecision(count <= maximum, max(1, expires_at - now), "memory")
    else:
        database_url = _database_url()
        if not database_url:
            _record_telemetry("backend_failure")
            emit_operational_telemetry(event_name="internal_ingestion_rate_limit_backend_failure", severity="ERROR", component="agent_fabric", category="DATABASE", outcome="SYSTEM_FAILURE", metadata={"limiter_class": LIMITER_CLASS})
            raise InternalIngestionRateLimitError("rate_limit_backend_unavailable")
        try:
            with psycopg2.connect(database_url, connect_timeout=5) as connection:
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        WITH window_state AS (
                          SELECT to_timestamp(floor(extract(epoch FROM NOW()) / %s) * %s) AS started_at
                        ), upserted AS (
                          INSERT INTO rate_limit_windows
                            (limiter_key, window_started_at, window_seconds, request_count, expires_at)
                          SELECT %s, started_at, %s, 1,
                                 started_at + (%s * INTERVAL '1 second')
                          FROM window_state
                          ON CONFLICT (limiter_key, window_started_at) DO UPDATE
                            SET request_count = rate_limit_windows.request_count + 1,
                                updated_at = NOW()
                          RETURNING request_count,
                            GREATEST(1, CEIL(EXTRACT(EPOCH FROM (expires_at - NOW())))::int)
                            AS retry_after_seconds
                        )
                        SELECT request_count, retry_after_seconds FROM upserted
                        """,
                        (window_seconds, window_seconds, limiter_key, window_seconds, window_seconds),
                    )
                    row = cursor.fetchone()
            if not row:
                raise InternalIngestionRateLimitError("rate_limit_backend_unavailable")
            decision = InternalIngestionRateLimitDecision(int(row[0]) <= maximum, int(row[1]), "postgres")
        except InternalIngestionRateLimitError:
            _record_telemetry("backend_failure")
            emit_operational_telemetry(event_name="internal_ingestion_rate_limit_backend_failure", severity="ERROR", component="agent_fabric", category="DATABASE", outcome="SYSTEM_FAILURE", metadata={"limiter_class": LIMITER_CLASS})
            raise
        except Exception as exc:
            _record_telemetry("backend_failure")
            emit_operational_telemetry(event_name="internal_ingestion_rate_limit_backend_failure", severity="ERROR", component="agent_fabric", category="DATABASE", outcome="SYSTEM_FAILURE", metadata={"limiter_class": LIMITER_CLASS})
            raise InternalIngestionRateLimitError("rate_limit_backend_unavailable") from exc

    _record_telemetry("allowed" if decision.allowed else "rejected")
    emit_operational_telemetry(
        event_name="internal_ingestion_rate_limit_decision",
        severity="INFO" if decision.allowed else "WARNING",
        component="agent_fabric",
        category="RATE_LIMIT",
        outcome="SUCCESS" if decision.allowed else "EXPECTED_DOMAIN_REJECTION",
        metadata={"limiter_class": LIMITER_CLASS, "producer_reference": _safe_producer_reference(trusted_service_id), "backend": decision.backend},
    )
    LOGGER.info(
        "internal_ingestion_rate_limit_decision",
        extra={
            "limiter_class": LIMITER_CLASS,
            "producer_reference": _safe_producer_reference(trusted_service_id),
            "decision": "allowed" if decision.allowed else "rejected",
            "backend": decision.backend,
        },
    )
    return decision


def reset_test_state() -> None:
    """Clear development-only state and telemetry between isolated tests."""
    with _memory_lock:
        _memory_windows.clear()
    with _telemetry_lock:
        for key in _telemetry:
            _telemetry[key] = 0
