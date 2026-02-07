#!/usr/bin/env bash
set -euo pipefail

# Always run from repo root so `import fabric...` works
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BASE_URL="${BASE_URL:-http://127.0.0.1:8090}"
ORG_ID="${ORG_ID:-demo}"

echo "== Step 0: Sanity checks =="
command -v python3 >/dev/null
command -v curl >/dev/null

: "${ADMIN_API_KEY:?ADMIN_API_KEY is not set. Export it like: export ADMIN_API_KEY='...'}"

if [[ ! -f "scripts/rebase_registry_ledger.py" ]]; then
  echo "❌ Missing scripts/rebase_registry_ledger.py"
  exit 2
fi

echo "== Step 1: Dry-run rebase =="
python3 scripts/rebase_registry_ledger.py --dry-run --show 10

echo "== Step 2: Check ledger status (direct verify, no server needed) =="
python3 - <<'PY'
from fabric.registry_event_ledger import verify_ledger, auditor_one_liner
v = verify_ledger()
print(auditor_one_liner(v))
raise SystemExit(0 if v.get("pass") is True else 2)
PY

LEDGER_PASS=$?
if [[ "$LEDGER_PASS" -ne 0 ]]; then
  echo "== Step 3: Ledger FAIL -> applying rebase =="
  python3 scripts/rebase_registry_ledger.py --apply --show 10

  echo "== Step 3b: Re-check ledger after apply =="
  python3 - <<'PY'
from fabric.registry_event_ledger import verify_ledger, auditor_one_liner
v = verify_ledger()
print(auditor_one_liner(v))
raise SystemExit(0 if v.get("pass") is True else 2)
PY
else
  echo "== Step 3: Ledger already PASS -> no apply needed =="
fi

echo "== Step 4: Restart server =="
./bin/restart_8090.sh >/dev/null

echo "== Step 5: Hit /admin/registry/events/verify =="
RESP="$(curl -sS \
  -H "X-Admin-Key: ${ADMIN_API_KEY}" \
  -H "X-Admin-Role: registry_readonly" \
  -H "X-Org-Id: ${ORG_ID}" \
  "${BASE_URL}/admin/registry/events/verify" || true)"

python3 - <<PY
import json, sys
raw = """$RESP""".strip()

if not raw:
    print("❌ VERIFY endpoint returned empty response")
    sys.exit(3)

try:
    data = json.loads(raw)
except Exception:
    print("❌ VERIFY endpoint did not return JSON. Raw response:")
    print(raw[:8000])
    sys.exit(3)

ok = bool(data.get("ok"))
passed = bool(data.get("pass"))

print("ok =", ok, "pass =", passed)
print(data.get("auditor_one_liner", ""))

if not (ok and passed):
    print("❌ Ledger verify endpoint says FAIL")
    sys.exit(4)

print("✅ Ledger verified clean — ALL GOOD")
sys.exit(0)
PY
