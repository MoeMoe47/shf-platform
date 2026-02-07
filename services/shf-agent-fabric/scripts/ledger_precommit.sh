#!/usr/bin/env bash
set -euo pipefail

# ---- Config ----
: "${BASE_URL:=http://127.0.0.1:8090}"
: "${ORG_ID:=demo}"
: "${ROLE:=registry_readonly}"

if [[ -z "${ADMIN_API_KEY:-}" ]]; then
  echo "ERROR: ADMIN_API_KEY is not set in your shell."
  echo "Fix: export ADMIN_API_KEY='...'"
  exit 2
fi

cd "$(dirname "$0")/.."

PYTHON="python3"
PYENV="PYTHONPATH=."

echo "== Phase 3: ledger precommit =="
echo "BASE_URL=$BASE_URL ORG_ID=$ORG_ID ROLE=$ROLE"

# ---- Helper: verify ledger locally (reads db/registry_events.jsonl) ----
verify_local() {
  $PYENV $PYTHON - <<'PY'
from fabric.registry_event_ledger import verify_ledger, auditor_one_liner
v = verify_ledger(entity_id=None)
print(auditor_one_liner(v))
raise SystemExit(0 if v.get("pass") else 1)
PY
}

# ---- Helper: verify ledger via API ----
verify_api() {
  curl -sS \
    -H "X-Admin-Key: ${ADMIN_API_KEY}" \
    -H "X-Admin-Role: ${ROLE}" \
    -H "X-Org-Id: ${ORG_ID}" \
    "${BASE_URL}/admin/registry/events/verify" \
  | $PYTHON - <<'PY'
import json,sys
data=json.load(sys.stdin)
ok=bool(data.get("pass"))
print(data.get("auditor_one_liner") or data)
raise SystemExit(0 if ok else 1)
PY
}

echo
echo "1) Local verify (before)"
if verify_local; then
  echo "Local ledger OK (no rebase needed)."
else
  echo "Local ledger FAIL -> will attempt rebase."
  echo
  echo "2) Dry-run rebase (preview)"
  $PYENV $PYTHON scripts/rebase_registry_ledger.py --dry-run --show 10

  echo
  echo "3) Apply rebase"
  $PYENV $PYTHON scripts/rebase_registry_ledger.py --apply --show 10

  echo
  echo "4) Local verify (after)"
  verify_local
fi

echo
echo "5) Restart server"
./bin/restart_8090.sh >/dev/null

echo
echo "6) API verify"
verify_api

echo
echo "✅ DONE: ledger verified + server verified"
