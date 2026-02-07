#!/usr/bin/env bash
set -euo pipefail

echo "== Arena Smoke =="

: "${BASE_URL:=http://127.0.0.1:8090}"
: "${ARENA_ID:=obs_deck_v1}"
: "${ROUND_ID:=dev_live}"

echo "BASE_URL=$BASE_URL"
echo "ARENA_ID=$ARENA_ID"
echo "ROUND_ID=$ROUND_ID"
echo

echo "== Step 0: Compile check =="
python3 -m py_compile \
  routers/arena_routes.py \
  fabric/arena/store.py \
  fabric/arena/engine.py \
  fabric/arena/scoring.py \
  fabric/arena/explain.py \
  fabric/arena/think_tank.py
echo "OK: py_compile"
echo

echo "== Step 1: Create draft agent =="
resp="$(curl -sS -X POST "$BASE_URL/arena/agents/draft" \
  -H "Content-Type: application/json" \
  -d '{"ownerStudentId":"stu_demo","name":"Agent Atlas","avatarId":"robot_07","persona":"ANALYST"}')"
echo "$resp" | python3 -m json.tool

agentId="$(printf '%s' "$resp" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("agentId",""))')"
if [[ -z "$agentId" ]]; then
  echo "ERROR: could not parse agentId from response"
  exit 1
fi
echo "agentId=$agentId"
echo

echo "== Step 2: Release agent =="
curl -sS -X POST "$BASE_URL/arena/agents/$agentId/release" | python3 -m json.tool
echo

echo "== Step 3: Cast signals (spectator-only) =="
curl -sS -X POST "$BASE_URL/arena/$ARENA_ID/round/$ROUND_ID/signal" \
  -H "Content-Type: application/json" \
  -d "{\"agentId\":\"$agentId\",\"signals\":{\"CLEAR\":80,\"STRUCTURE\":60,\"ENGAGE\":40,\"CREATIVE\":20,\"HUMOR\":5}}" \
| python3 -m json.tool
echo

echo "== Step 4: Finalize dev round =="
resp2="$(curl -sS -X POST "$BASE_URL/arena/$ARENA_ID/round/finalize_dev" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Explain how to build a safe AI agent arena in 5 steps.","agentIds":[],"strategies":{}}')"
echo "$resp2" | python3 -m json.tool

finalRoundId="$(printf '%s' "$resp2" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("roundId",""))')"
if [[ -z "$finalRoundId" ]]; then
  echo "ERROR: could not parse roundId from finalize_dev response"
  exit 1
fi
echo "finalRoundId=$finalRoundId"
echo

echo "== Step 5: Watch Tower (public scoreboard) =="
curl -sS "$BASE_URL/arena/$ARENA_ID/round/$finalRoundId/watch-tower" | python3 -m json.tool
echo

echo "== Step 6: Results Hall =="
curl -sS "$BASE_URL/arena/$ARENA_ID/round/$finalRoundId/results-hall" | python3 -m json.tool
echo

echo "== Step 7: Agent Breakdown =="
curl -sS "$BASE_URL/arena/agent/$agentId/round/$finalRoundId/breakdown" | python3 -m json.tool
echo

echo "== Step 8: Think Tank Summary =="
curl -sS "$BASE_URL/arena/$ARENA_ID/think-tank/summary?window=5" | python3 -m json.tool
echo

echo "✅ Arena smoke test complete."
echo "DB files written under: db/arena/"
