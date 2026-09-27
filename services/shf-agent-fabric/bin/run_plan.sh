set -euo pipefail

TASK="${1:?TASK required}"
CONSTRAINTS="${2:-draft only,no external submissions}"
AGENT="${AGENT_NAME:-Layer23OrchestratorAgent}"
# AFCC-3 Phase 3/4/4.1: every step needs an operator session; no admin key.
# Policy B: the plan creator cannot approve their own plan, so creation and
# approval use different operators. The executor defaults to the approver
# (allowed when they hold fabric.run.execute).
#   creator  (fabric.plan.create):  FABRIC_EMAIL / FABRIC_PASSWORD
#   approver (fabric.plan.approve): APPROVER_EMAIL / APPROVER_PASSWORD
#   executor (fabric.run.execute):  EXECUTOR_EMAIL / EXECUTOR_PASSWORD (default: approver)
FABRIC_EMAIL="${FABRIC_EMAIL:?FABRIC_EMAIL required (plan creator)}"
FABRIC_PASSWORD="${FABRIC_PASSWORD:?FABRIC_PASSWORD required}"
APPROVER_EMAIL="${APPROVER_EMAIL:?APPROVER_EMAIL required (a different operator than the creator)}"
APPROVER_PASSWORD="${APPROVER_PASSWORD:?APPROVER_PASSWORD required}"
EXECUTOR_EMAIL="${EXECUTOR_EMAIL:-$APPROVER_EMAIL}"
EXECUTOR_PASSWORD="${EXECUTOR_PASSWORD:-$APPROVER_PASSWORD}"
if [ "$FABRIC_EMAIL" = "$APPROVER_EMAIL" ]; then
  echo "ERROR: APPROVER_EMAIL must differ from FABRIC_EMAIL (creator cannot approve own plan)" >&2
  exit 2
fi
BASE_URL="${FABRIC_URL:-http://127.0.0.1:8090}"
CREATOR_COOKIES="$(mktemp)"
APPROVER_COOKIES="$(mktemp)"
EXECUTOR_COOKIES="$(mktemp)"
trap 'rm -f "$CREATOR_COOKIES" "$APPROVER_COOKIES" "$EXECUTOR_COOKIES"' EXIT

# login EMAIL PASSWORD COOKIE_JAR -> prints the session CSRF token
login() {
  local payload
  payload="$(LOGIN_EMAIL="$1" LOGIN_PASSWORD="$2" python3 -c 'import json,os; print(json.dumps({"email": os.environ["LOGIN_EMAIL"], "password": os.environ["LOGIN_PASSWORD"]}))')"
  curl -fsS -c "$3" -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    | python3 -c 'import sys,json; print(json.load(sys.stdin)["csrf_token"])'
}

CONSTRAINTS_JSON="$(python3 - "$CONSTRAINTS" <<'PY'
import json,sys
s=sys.argv[1]
items=[x.strip() for x in s.split(",") if x.strip()]
print(json.dumps(items))
PY
)"

PLAN_PAYLOAD="$(python3 - "$AGENT" "$TASK" "$CONSTRAINTS_JSON" <<'PY'
import json,sys
agent=sys.argv[1]
task=sys.argv[2]
constraints=json.loads(sys.argv[3])
payload={
  "agentName": agent,
  "input": {
    "task": task,
    "constraints": constraints,
    "format": {
      "type": "6_steps",
      "include": ["sites","staffing","schedule","budget_ranges","compliance","metrics"]
    },
    "output": "artifact"
  }
}
print(json.dumps(payload))
PY
)"

CREATOR_CSRF="$(login "$FABRIC_EMAIL" "$FABRIC_PASSWORD" "$CREATOR_COOKIES")"
APPROVER_CSRF="$(login "$APPROVER_EMAIL" "$APPROVER_PASSWORD" "$APPROVER_COOKIES")"
EXECUTOR_CSRF="$(login "$EXECUTOR_EMAIL" "$EXECUTOR_PASSWORD" "$EXECUTOR_COOKIES")"

PLAN_ID="$(curl -fsS -b "$CREATOR_COOKIES" -X POST "${BASE_URL}/plan" \
  -H "X-CSRF-Token: ${CREATOR_CSRF}" \
  -H "Content-Type: application/json" \
  -d "$PLAN_PAYLOAD" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["planId"])')"

echo "PLAN_ID=${PLAN_ID}"

# Attributable approval by a different operator than the creator (Policy B).
curl -fsS -b "$APPROVER_COOKIES" -X POST "${BASE_URL}/plan/${PLAN_ID}/approve" \
  -H "X-CSRF-Token: ${APPROVER_CSRF}" \
  -H "Content-Type: application/json" \
  -d '{"reason":"run_plan.sh operator approval"}' | python3 -m json.tool

curl -fsS -b "$EXECUTOR_COOKIES" -X POST "${BASE_URL}/runs/validate" \
  -H "X-CSRF-Token: ${EXECUTOR_CSRF}" \
  -H "Content-Type: application/json" \
  -d "{\"planId\":\"${PLAN_ID}\"}" | python3 -m json.tool

curl -fsS -b "$EXECUTOR_COOKIES" -X POST "${BASE_URL}/runs/dry-run" \
  -H "X-CSRF-Token: ${EXECUTOR_CSRF}" \
  -H "Content-Type: application/json" \
  -d "{\"planId\":\"${PLAN_ID}\"}" | python3 -m json.tool

curl -fsS -b "$EXECUTOR_COOKIES" -X POST "${BASE_URL}/runs/execute" \
  -H "X-CSRF-Token: ${EXECUTOR_CSRF}" \
  -H "Content-Type: application/json" \
  -d "{\"planId\":\"${PLAN_ID}\"}" | python3 -m json.tool

ART_PATH="$(ls -t db/artifacts/*.json 2>/dev/null | head -1)"
if [ -z "$ART_PATH" ]; then
  echo "ERROR: no artifact files found in db/artifacts/"
  exit 1
fi

ART_ID="$(basename "$ART_PATH" .json)"
echo "ART_ID=${ART_ID}"

curl -fsS "${BASE_URL}/artifacts/${ART_ID}" | python3 -m json.tool
