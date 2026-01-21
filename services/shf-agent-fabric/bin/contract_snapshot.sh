#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8090}"
OUT_DIR="registry/contracts"
TS="$(date -u +"%Y%m%dT%H%M%SZ")"

ROUTES_FILE="${OUT_DIR}/routes.latest.txt"
OPENAPI_FILE="${OUT_DIR}/openapi.latest.json"

# Ensure server is up (health endpoint exists in your app)
curl -sS "${BASE_URL}/health" >/dev/null

# Routes snapshot (stable sort)
./bin/routes_contract.sh > "/tmp/routes_contract.${TS}.out"
grep -q "OK" "/tmp/routes_contract.${TS}.out"

# Keep only the route lines (strip warnings/OK noise)
grep -E '^(GET|POST|PATCH|PUT|DELETE|HEAD) ' "/tmp/routes_contract.${TS}.out" \
  | sort -u > "${ROUTES_FILE}"

# OpenAPI snapshot
curl -sS "${BASE_URL}/openapi.json" | python3 -m json.tool > "${OPENAPI_FILE}"

echo "OK contract_snapshot routes=${ROUTES_FILE} openapi=${OPENAPI_FILE}"
