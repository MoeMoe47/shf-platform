set -euo pipefail

TASK="${1:?TASK required}"
CONSTRAINTS="${2:-draft only,no external submissions}"
AGENT_NAME="${AGENT_NAME:-Layer23OrchestratorAgent}"
ADMIN_API_KEY="${ADMIN_API_KEY:?ADMIN_API_KEY required}"
# AFCC-3 Phase 3: plan creation, approval and execution need an operator session
# (fabric.plan.create / fabric.plan.approve / fabric.run.execute). The admin key
# is only used for the unchanged /runs/validate and /runs/dry-run checks.
FABRIC_EMAIL="${FABRIC_EMAIL:?FABRIC_EMAIL required (operator with fabric.* permissions)}"
FABRIC_PASSWORD="${FABRIC_PASSWORD:?FABRIC_PASSWORD required}"
BASE_URL="${FABRIC_URL:-http://127.0.0.1:8090}"
COOKIES="$(mktemp)"
trap 'rm -f "$COOKIES"' EXIT

PLAN_PAYLOAD="$(TASK="$TASK" CONSTRAINTS="$CONSTRAINTS" AGENT_NAME="$AGENT_NAME" python3 - <<'PY'
import os, json
task = os.environ["TASK"]
constraints = [c.strip() for c in os.environ["CONSTRAINTS"].split(",") if c.strip()]
agent = os.environ["AGENT_NAME"]

print(json.dumps({
  "agentName": agent,
  "input": {
    "task": task,
    "constraints": constraints,
    "format": {
      "type": "loo_schema",
      "include": ["northStar","daily","weekly","monthly","schema","example_payload"]
    },
    "output": "artifact"
  }
}))
PY
)"

LOGIN_PAYLOAD="$(python3 -c 'import json,os; print(json.dumps({"email": os.environ["FABRIC_EMAIL"], "password": os.environ["FABRIC_PASSWORD"]}))')"
CSRF="$(curl -fsS -c "$COOKIES" -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_PAYLOAD" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["csrf_token"])')"

PLAN_ID="$(curl -fsS -b "$COOKIES" -X POST "${BASE_URL}/plan" \
  -H "X-CSRF-Token: ${CSRF}" \
  -H "Content-Type: application/json" \
  -d "${PLAN_PAYLOAD}" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["planId"])')"

echo "PLAN_ID=${PLAN_ID}"

# Attributable approval by the logged-in operator.
curl -fsS -b "$COOKIES" -X POST "${BASE_URL}/plan/${PLAN_ID}/approve" \
  -H "X-CSRF-Token: ${CSRF}" \
  -H "Content-Type: application/json" \
  -d '{"reason":"run_schema.sh operator approval"}' | python3 -m json.tool

curl -fsS -X POST "${BASE_URL}/runs/validate" \
  -H "X-Admin-Key: ${ADMIN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"planId\":\"${PLAN_ID}\"}" | python3 -m json.tool

curl -fsS -X POST "${BASE_URL}/runs/dry-run" \
  -H "X-Admin-Key: ${ADMIN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"planId\":\"${PLAN_ID}\"}" | python3 -m json.tool

curl -fsS -b "$COOKIES" -X POST "${BASE_URL}/runs/execute" \
  -H "X-CSRF-Token: ${CSRF}" \
  -H "Content-Type: application/json" \
  -d "{\"planId\":\"${PLAN_ID}\"}" | python3 -m json.tool

ART_PATH="$(ls -t db/artifacts/*.json 2>/dev/null | head -1)"
ART_ID="$(basename "$ART_PATH" .json)"
echo "ART_ID=${ART_ID}"

curl -fsS "${BASE_URL}/artifacts/${ART_ID}" | python3 -m json.tool
