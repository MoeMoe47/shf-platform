set -euo pipefail

TASK="${1:?TASK required}"
CONSTRAINTS="${2:-draft only,no external submissions}"
AGENT="${AGENT_NAME:-Layer23OrchestratorAgent}"
ADMIN_API_KEY="${ADMIN_API_KEY:?ADMIN_API_KEY required}"

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

PLAN_ID="$(curl -fsS -X POST http://127.0.0.1:8090/plan \
  -H "Content-Type: application/json" \
  -d "$PLAN_PAYLOAD" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["planId"])')"

echo "PLAN_ID=${PLAN_ID}"

curl -fsS -X POST http://127.0.0.1:8090/runs/validate \
  -H "X-Admin-Key: ${ADMIN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"planId\":\"${PLAN_ID}\"}" | python3 -m json.tool

curl -fsS -X POST http://127.0.0.1:8090/runs/dry-run \
  -H "X-Admin-Key: ${ADMIN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"planId\":\"${PLAN_ID}\"}" | python3 -m json.tool

curl -fsS -X POST http://127.0.0.1:8090/runs/execute \
  -H "X-Admin-Key: ${ADMIN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"planId\":\"${PLAN_ID}\",\"approved\":true}" | python3 -m json.tool

ART_PATH="$(ls -t db/artifacts/*.json 2>/dev/null | head -1)"
if [ -z "$ART_PATH" ]; then
  echo "ERROR: no artifact files found in db/artifacts/"
  exit 1
fi

ART_ID="$(basename "$ART_PATH" .json)"
echo "ART_ID=${ART_ID}"

curl -fsS "http://127.0.0.1:8090/artifacts/${ART_ID}" | python3 -m json.tool
