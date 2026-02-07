#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8090}"
KIND="${1:-}"

if [[ -z "$KIND" ]]; then
  echo "Usage: bin/shfcli reg:list <app|agent|business>" >&2
  exit 2
fi

: "${ADMIN_KEY:?ERR: ADMIN_KEY not set. Run: shfkey}"

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

curl -fsS \
  -H "X-Admin-Key: ${ADMIN_KEY}" \
  "${BASE_URL}/admin/registry?kind=${KIND}" > "$TMP"

python3 -c '
import json,sys
p=sys.argv[1]
raw=open(p,"r",encoding="utf-8",errors="replace").read().strip()
if not raw:
    raise SystemExit("ERR: empty response")
d=json.loads(raw)
for x in d.get("items",[]):
    print(x.get("id"))
' "$TMP"
