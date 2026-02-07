#!/usr/bin/env bash
set -euo pipefail

: "${BASE_URL:=http://127.0.0.1:8090}"

# If ADMIN_KEY isn't set, load it from .env (ADMIN_API_KEY=...)
if [ -z "${ADMIN_KEY:-}" ]; then
  if [ -f ".env" ]; then
    ADMIN_KEY="$(sed -n 's/^ADMIN_API_KEY=//p' .env | head -n 1 | tr -d '\r\n')"
    export ADMIN_KEY
  fi
fi

: "${ADMIN_KEY:?ERR: ADMIN_KEY not set and .env missing ADMIN_API_KEY}"

python3 - <<'PY'
import os, json, urllib.request
from collections import defaultdict

base = os.environ["BASE_URL"].rstrip("/")
key  = os.environ["ADMIN_KEY"].strip()

url = f"{base}/admin/registry/events?limit=500"
req = urllib.request.Request(url, headers={"X-Admin-Key": key})
with urllib.request.urlopen(req, timeout=10) as r:
    data = json.loads(r.read().decode("utf-8"))

items = data.get("items", [])
by = defaultdict(list)
for e in items:
    by[(e.get("kind"), e.get("entityId"))].append(e)

bad = 0
for _, evs in by.items():
    evs.sort(key=lambda x: (x.get("tsMs", 0) or 0, x.get("eventId","")))
    for i in range(1, len(evs)):
        before = evs[i].get("beforeHash")
        if before is not None and evs[i-1].get("afterHash") != before:
            bad += 1

print("OK chain_check bad_links=" + str(bad))
PY
