#!/usr/bin/env bash
set -euo pipefail

SVC="services/shf-agent-fabric"
SCHEMA="$SVC/contracts/storage/watchtower_schema_pg.sql"

if ! command -v docker >/dev/null 2>&1; then
  echo "❌ docker not found"
  exit 1
fi

if [ ! -f "$SCHEMA" ]; then
  echo "❌ schema missing: $SCHEMA"
  exit 1
fi

echo "== Starting Postgres (dev) =="
docker compose -f "$SVC/ops/postgres/docker-compose.postgres.yml" up -d

echo "== Waiting for Postgres =="
for i in $(seq 1 30); do
  if docker exec shf_postgres pg_isready -U shf -d shf >/dev/null 2>&1; then
    echo "✅ Postgres ready"
    break
  fi
  sleep 1
done

echo "== Applying schema =="
docker exec -i shf_postgres psql -U shf -d shf < "$SCHEMA"

echo "✅ Schema applied"
