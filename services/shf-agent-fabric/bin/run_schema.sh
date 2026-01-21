set -euo pipefail

TASK="${1:?TASK required}"
CONSTRAINTS="${2:-draft only,no external submissions}"
AGENT_NAME="${AGENT_NAME:-Layer23OrchestratorAgent}"
ADMIN_API_KEY="${ADMIN_API_KEY:?ADMIN_API_KEY required}"

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

PLAN_ID="$(curl -fsS -X POST http://127.0.0.1:8090/plan \
  -H "Content-Type: application/json" \
  -d "${PLAN_PAYLOAD}" \
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
ART_ID="$(basename "$ART_PATH" .json)"
echo "ART_ID=${ART_ID}"

curl -fsS "http://127.0.0.1:8090/artifacts/${ART_ID}" | python3 -m json.tool
