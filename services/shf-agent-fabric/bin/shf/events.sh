#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8090}"
LIMIT="${1:-20}"

: "${ADMIN_KEY:?ERR: ADMIN_KEY not set. Run: shfkey}"

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

curl -fsS \
  -H "X-Admin-Key: ${ADMIN_KEY}" \
  "${BASE_URL}/admin/registry/events?limit=${LIMIT}" > "$TMP"

python3 -c '
import json,sys
p=sys.argv[1]
raw=open(p,"r",encoding="utf-8",errors="replace").read().strip()
if not raw:
    raise SystemExit("ERR: empty response")
d=json.loads(raw)
for e in d.get("items",[]):
    print(f"{e.get(\"ts\")} {e.get(\"kind\")} {e.get(\"action\")} {e.get(\"entityId\")}")
' "$TMP"
