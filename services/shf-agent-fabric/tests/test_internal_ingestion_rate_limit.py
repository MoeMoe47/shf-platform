from __future__ import annotations

import os
from concurrent.futures import ThreadPoolExecutor
from types import SimpleNamespace

import psycopg2
import pytest
from fastapi.testclient import TestClient

from main import app
from routers import shf_internal_ingestion_routes as route_module
from services.internal_ingestion_rate_limit_service import (
    InternalIngestionRateLimitError,
    consume_internal_ingestion_limit,
    reset_test_state,
    telemetry_snapshot,
)


def test_development_limiter_is_service_aware_and_shared_within_process(monkeypatch):
    monkeypatch.delenv("SHF_AUTH_ENV", raising=False)
    monkeypatch.delenv("NODE_ENV", raising=False)
    monkeypatch.delenv("SHS_DATABASE_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("SHS_RATE_LIMIT_INTERNAL_INGESTION_MAX", "1")
    monkeypatch.setenv("SHS_RATE_LIMIT_INTERNAL_INGESTION_WINDOW_SECONDS", "60")
    reset_test_state()

    assert consume_internal_ingestion_limit("service:producer-a").allowed
    assert not consume_internal_ingestion_limit("service:producer-a").allowed
    assert consume_internal_ingestion_limit("service:producer-b").allowed
    assert telemetry_snapshot()["allowed"] == 2
    assert telemetry_snapshot()["rejected"] == 1


def test_production_backend_failure_fails_closed_without_memory_fallback(monkeypatch):
    monkeypatch.setenv("SHF_AUTH_ENV", "production")
    monkeypatch.setenv("SHS_RATE_LIMIT_INTERNAL_INGESTION_MAX", "10")
    monkeypatch.setenv("SHS_RATE_LIMIT_INTERNAL_INGESTION_WINDOW_SECONDS", "60")
    monkeypatch.delenv("SHS_DATABASE_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    reset_test_state()

    try:
        consume_internal_ingestion_limit("service:producer-a")
    except InternalIngestionRateLimitError as exc:
        assert str(exc) == "rate_limit_backend_unavailable"
    else:
        raise AssertionError("production accepted an unavailable limiter backend")


def test_rate_limited_request_ends_before_operational_event_mutation(monkeypatch):
    principal = SimpleNamespace(service_id="service:shs-api", principal_type="service", permission="shf.event.create")
    monkeypatch.setattr(route_module, "authenticate_internal_request", lambda **_: principal)
    monkeypatch.setattr(route_module, "validate_operational_event", lambda *_: None)
    monkeypatch.setattr(
        route_module,
        "consume_internal_ingestion_limit",
        lambda service_id: (SimpleNamespace(allowed=False, retry_after_seconds=17) if service_id == principal.service_id else (_ for _ in ()).throw(AssertionError("untrusted limiter identity"))),
    )

    def fail_if_called(*_args, **_kwargs):
        raise AssertionError("rate-limited request reached operational-event persistence")

    monkeypatch.setattr(route_module, "ingest_operational_event", fail_if_called)
    response = TestClient(app).post(
        "/shf/internal/ingestion/events",
        json={
            "organization_id": "org-test",
            "tenant_id": "tenant:org-test",
            "originating_actor_id": "actor-test",
        },
    )

    assert response.status_code == 429
    assert response.headers["retry-after"] == "17"
    assert response.json()["detail"]["error"] == "rate_limited"


@pytest.mark.skipif(
    os.getenv("SHF_RUN_LOCAL_POSTGRES_PROOF") != "1",
    reason="explicit disposable local PostgreSQL proof only",
)
def test_local_postgres_shared_counter_is_concurrency_safe(monkeypatch):
    dsn = "host=localhost port=5432 dbname=postgres"
    database_name = "shf_agent_rate_limit_runtime_test"
    connection = psycopg2.connect(dsn)
    try:
        connection.autocommit = True
        with connection.cursor() as cursor:
            cursor.execute(f'DROP DATABASE IF EXISTS "{database_name}"')
            cursor.execute(f'CREATE DATABASE "{database_name}"')
    finally:
        connection.close()

    try:
        test_dsn = f"host=localhost port=5432 dbname={database_name}"
        migration = (
            __import__("pathlib").Path(__file__).resolve().parents[3]
            / "apps"
            / "shs-api"
            / "migrations"
            / "030_rate_limit_windows.sql"
        ).read_text(encoding="utf-8")
        with psycopg2.connect(test_dsn) as connection:
            with connection.cursor() as cursor:
                cursor.execute(migration)

        monkeypatch.setenv("SHF_AUTH_ENV", "production")
        monkeypatch.setenv("SHS_DATABASE_URL", test_dsn)
        monkeypatch.setenv("SHS_RATE_LIMIT_INTERNAL_INGESTION_MAX", "2")
        monkeypatch.setenv("SHS_RATE_LIMIT_INTERNAL_INGESTION_WINDOW_SECONDS", "60")
        with ThreadPoolExecutor(max_workers=4) as pool:
            decisions = list(pool.map(lambda _: consume_internal_ingestion_limit("service:shs-api"), range(4)))

        assert sum(decision.allowed for decision in decisions) == 2
        assert all(decision.backend == "postgres" for decision in decisions)
        with psycopg2.connect(test_dsn) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT request_count FROM rate_limit_windows WHERE limiter_key = %s",
                    ("INTERNAL_INGESTION_LIMIT:service:service:shs-api",),
                )
                assert cursor.fetchone()[0] == 4
    finally:
        connection = psycopg2.connect(dsn)
        try:
            connection.autocommit = True
            with connection.cursor() as cursor:
                cursor.execute(f'DROP DATABASE IF EXISTS "{database_name}"')
        finally:
            connection.close()
