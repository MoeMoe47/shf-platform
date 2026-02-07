#!/usr/bin/env bash
set -euo pipefail

: "${BASE_URL:=http://127.0.0.1:8090}"
: "${ADMIN_KEY:?ADMIN_KEY required}"

curl -sS "$BASE_URL/health" | python3 -m json.tool >/dev/null

for k in business agent app; do
  curl -sS -H "X-Admin-Key: $ADMIN_KEY" "$BASE_URL/admin/registry?kind=$k" | python3 -m json.tool >/dev/null
done

curl -sS -H "X-Admin-Key: $ADMIN_KEY" "$BASE_URL/admin/registry/events?limit=10" | python3 -m json.tool >/dev/null

echo "OK registry smoke"
