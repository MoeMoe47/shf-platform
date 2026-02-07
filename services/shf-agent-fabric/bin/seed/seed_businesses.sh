#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8090}"

# Load ADMIN_KEY from .env if not already set
if [ -z "${ADMIN_KEY:-}" ]; then
  if [ -f .env ]; then
    ADMIN_KEY="$(rg -m 1 -No '^ADMIN_API_KEY=.*' .env | sed 's/^ADMIN_API_KEY=//')"
    export ADMIN_KEY
  fi
fi

if [ -z "${ADMIN_KEY:-}" ]; then
  echo "ERR: ADMIN_KEY not set and .env missing ADMIN_API_KEY" >&2
  exit 1
fi

JSONL="${1:-bin/seed/seed_businesses.jsonl}"
if [ ! -f "$JSONL" ]; then
  echo "ERR: seed file not found: $JSONL" >&2
  exit 1
fi

i=0
while IFS= read -r line; do
  [ -z "$line" ] && continue
  i=$((i+1))

  code="$(curl -sS -o /tmp/seed_businesses_last.json -w "%{http_code}" \
    -H "X-Admin-Key: $ADMIN_KEY" -H "Content-Type: application/json" \
    -X POST "$BASE_URL/admin/registry/upsert" \
    --data-binary "$line")"

  if [ "$code" != "200" ]; then
    echo "seed[$i] http=$code"
    echo "seed[$i] FAILED body:"
    cat /tmp/seed_businesses_last.json
    exit 1
  fi
done < "$JSONL"

echo "seeded_ok"
