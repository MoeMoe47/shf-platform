#!/usr/bin/env bash
set -euo pipefail

: "${BASE_URL:?BASE_URL required}"
: "${ADMIN_KEY:?ADMIN_KEY required}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

curl -fsS -H "X-Admin-Key: ${ADMIN_KEY}" "${BASE_URL}/admin/registry/events?limit=20" > "$TMP/events.json"

python3 - "$TMP/events.json" <<'PY'
import json, sys
p = sys.argv[1]
with open(p, "r", encoding="utf-8") as f:
    data = json.load(f)
items = data.get("items") or []
if not items:
    print("ERR no events")
    raise SystemExit(2)
print("OK events", len(items))
first = items[0]
for k in ("ts","kind","action"):
    if k not in first:
        print("ERR missing", k)
        raise SystemExit(3)
print("OK schema")
PY

curl -fsS -H "X-Admin-Key: ${ADMIN_KEY}" "${BASE_URL}/admin/registry?kind=app" >/dev/null
curl -fsS -H "X-Admin-Key: ${ADMIN_KEY}" "${BASE_URL}/admin/registry?kind=agent" >/dev/null
curl -fsS -H "X-Admin-Key: ${ADMIN_KEY}" "${BASE_URL}/admin/registry?kind=business" >/dev/null

echo "OK registry_verify"
