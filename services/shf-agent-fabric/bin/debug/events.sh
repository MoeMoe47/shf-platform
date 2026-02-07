#!/usr/bin/env bash
set -euo pipefail

LIMIT="${1:-20}"
BASE_URL="${BASE_URL:-http://127.0.0.1:8090}"

# Fail fast if ADMIN_KEY is missing
: "${ADMIN_KEY:?ADMIN_KEY is not set. Run: shfkey}"

# Curl: -f = fail on HTTP errors, -sS = silent but show errors
# python: parse JSON and print event lines
curl -fsS -H "X-Admin-Key: ${ADMIN_KEY}" \
  "${BASE_URL}/admin/registry/events?limit=${LIMIT}" \
| python3 - <<'PY'
import sys, json
d = json.load(sys.stdin)
for e in d.get("items", []):
    print(f"{e.get('ts')} {e.get('kind')} {e.get('action')} {e.get('entityId')}")
PY
