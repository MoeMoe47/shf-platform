#!/usr/bin/env bash
set -euo pipefail

: "${BASE_URL:=http://127.0.0.1:8090}"
FILE_PATH="${FILE_PATH:-db/registry_events.jsonl}"
API_LIMIT="${API_LIMIT:-5000}"

# If ADMIN_KEY not set, try to load from .env (ADMIN_API_KEY=...)
if [[ -z "${ADMIN_KEY:-}" ]]; then
  if [[ -f ".env" ]]; then
    ADMIN_KEY="$(rg -m 1 -No '^ADMIN_API_KEY=.*' .env | sed 's/^ADMIN_API_KEY=//')"
    ADMIN_KEY="$(printf "%s" "$ADMIN_KEY" | tr -d '\r\n')"
    export ADMIN_KEY
  fi
fi

: "${ADMIN_KEY:?ERR: ADMIN_KEY not set. Set ADMIN_KEY or put ADMIN_API_KEY=... in .env}"

python3 - <<'PY'
import os, json, urllib.request
from collections import defaultdict

base = os.environ["BASE_URL"].rstrip("/")
key  = os.environ["ADMIN_KEY"].strip()
file_path = os.environ.get("FILE_PATH", "db/registry_events.jsonl")
api_limit = int(os.environ.get("API_LIMIT", "5000"))

def fetch_api_events(limit: int):
    url = f"{base}/admin/registry/events?limit={limit}"
    req = urllib.request.Request(url, headers={"X-Admin-Key": key})
    with urllib.request.urlopen(req, timeout=15) as r:
        data = json.loads(r.read().decode("utf-8"))
    return data.get("items", []) or []

def read_file_events(path: str):
    out = []
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                out.append(json.loads(line))
    except FileNotFoundError:
        return []
    return out

def chain_check(events, label):
    by = defaultdict(list)
    for e in events:
        by[(e.get("kind"), e.get("entityId"))].append(e)

    bad = 0
    for _, evs in by.items():
        evs.sort(key=lambda x: (x.get("tsMs", 0) or 0, x.get("eventId","")))
        for i in range(1, len(evs)):
            before = evs[i].get("beforeHash")
            if before is not None and evs[i-1].get("afterHash") != before:
                bad += 1
    print(f"OK {label} chain_check bad_links={bad}")
    return bad

def global_nonmonotonic(events, label):
    # Many "same second" events can make this look non-monotonic if ordering differs.
    # We still report it as WARN so you know what you're seeing.
    ts = [e.get("tsMs", 0) or 0 for e in events]
    non = sum(1 for i in range(1, len(ts)) if ts[i] < ts[i-1])
    level = "WARN" if non else "OK"
    print(f"{level} {label} global_tsMs_nonmonotonic count={non}")
    return non

api_events  = fetch_api_events(api_limit)
file_events = read_file_events(file_path)

print(f"OK api_events count={len(api_events)}")
print(f"OK file_events count={len(file_events)} path={file_path}")

bad_api  = chain_check(api_events,  "API")
bad_file = chain_check(file_events, "FILE")

global_nonmonotonic(api_events, "API")
global_nonmonotonic(file_events, "FILE")

# Cross-check: ensure all API eventIds appear in file (within retention window)
file_ids = {e.get("eventId") for e in file_events if e.get("eventId")}
api_ids  = {e.get("eventId") for e in api_events  if e.get("eventId")}

missing_in_file = sorted([x for x in api_ids if x not in file_ids])
if missing_in_file:
    print(f"ERR cross_check api_events_missing_in_file count={len(missing_in_file)}")
else:
    print("OK cross_check api_events_present_in_file=all")

extra_in_file = sorted([x for x in file_ids if x not in api_ids])
print(f"OK cross_check file_extra_vs_api_window count={len(extra_in_file)} (expected if file has more history)")

if bad_api or bad_file or missing_in_file:
    raise SystemExit(2)

print("OK chain_check_all PASS")
PY
