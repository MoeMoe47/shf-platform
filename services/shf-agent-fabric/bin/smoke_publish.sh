#!/usr/bin/env bash
set -euo pipefail

RUN_ID="${1:-}"
if [ -z "${RUN_ID}" ]; then
  echo "usage: $0 <run_id>" >&2
  exit 2
fi

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${BASE_DIR}"

if [ -f ".env" ]; then
  set -a
  . ./.env
  set +a
fi

: "${ADMIN_API_KEY:?ADMIN_API_KEY not set}"

PUB="$(curl -sS -X POST "http://127.0.0.1:8090/runs/reports/${RUN_ID}/publish" -H "x-admin-key: ${ADMIN_API_KEY}" || true)"
echo "${PUB}" | python3 -m json.tool >/dev/null 2>&1 || true

PROOF="$(curl -sS "http://127.0.0.1:8090/runs/published/${RUN_ID}/proof")"
echo "${PROOF}" | python3 -m json.tool >/dev/null

FORCED="$(python3 - <<PY
import json
p=json.loads('''${PROOF}''')
print("1" if p.get("forced") else "0")
print((p.get("force") or {}).get("force_reason") or "")
PY
)"

F1="$(echo "${FORCED}" | head -n 1 | tr -d '\r')"
F2="$(echo "${FORCED}" | tail -n 1 | tr -d '\r')"

if [ "${F1}" = "1" ] && [ -z "${F2}" ]; then
  echo "FAIL: forced publish without reason" >&2
  exit 3
fi

curl -sS -o "/tmp/${RUN_ID}.pdf" "http://127.0.0.1:8090/runs/published/${RUN_ID}/pdf"
file "/tmp/${RUN_ID}.pdf" | grep -q "PDF document"

ls -la "registry/published/${RUN_ID}" >/dev/null
test -f "registry/published/${RUN_ID}/proof.json"
test -f "registry/published/${RUN_ID}/report.json"
test -f "registry/published/${RUN_ID}/report.pdf"

echo "OK"
