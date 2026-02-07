#!/usr/bin/env bash
set -euo pipefail

BASE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BASE"

python3 - <<'PY'
from fabric.registry_canon import upsert_entity

# ---- Apps (first-class) ----
apps = [
  {"id":"foundation","kind":"app","name":"foundation","title":"Foundation","entry":"/foundation.html"},
  {"id":"curriculum","kind":"app","name":"curriculum","title":"Curriculum","entry":"/curriculum.html"},
  {"id":"career","kind":"app","name":"career","title":"Career","entry":"/career.html"},
  {"id":"arcade","kind":"app","name":"arcade","title":"Arcade","entry":"/arcade.html"},
  {"id":"treasury","kind":"app","name":"treasury","title":"Treasury","entry":"/treasury.html"},
  {"id":"admin","kind":"app","name":"admin","title":"Admin","entry":"/admin.html"},
]

for a in apps:
    a["lifecycle"] = {"status": "active"}
    a["policy"] = {"humanApproval": True, "maxSteps": 1, "notes": "UI surface. No agent actions."}
    a["legal"] = {"classification":"public","dataCategory":["none"]}
    upsert_entity(a, reason="seed_apps")

# ---- Agents (first-class) ----
agents = [
  {
    "id":"Layer09CaseSupportAgent",
    "kind":"agent",
    "name":"Layer09CaseSupportAgent",
    "title":"Layer09 Case Support Agent",
    "agentId":"L09-CASE-001",
    "layer":"L09",
    "policy":{"humanApproval":False,"maxSteps":6,"notes":"Draft plans only. No consequences. No eligibility calls."},
    "legal":{"classification":"internal","dataCategory":["none"]},
    "lifecycle":{"status":"active"},
  },
  {
    "id":"Layer14GrantsDrafterAgent",
    "kind":"agent",
    "name":"Layer14GrantsDrafterAgent",
    "title":"Layer14 Grants Drafter Agent",
    "agentId":"L14-GRANT-001",
    "layer":"L14",
    "policy":{"humanApproval":True,"maxSteps":8,"notes":"Draft-only. Never submits externally. Human must review."},
    "legal":{"classification":"internal","dataCategory":["none"]},
    "lifecycle":{"status":"active"},
  },
  {
    "id":"Layer23OrchestratorAgent",
    "kind":"agent",
    "name":"Layer23OrchestratorAgent",
    "title":"Layer23 Orchestrator Agent",
    "agentId":"L23-ORCH-001",
    "layer":"L23",
    "policy":{"humanApproval":True,"maxSteps":6,"notes":"Draft-only orchestrator. Requires approval before any action beyond drafting."},
    "legal":{"classification":"internal","dataCategory":["none"]},
    "lifecycle":{"status":"active"},
  },
]

for ag in agents:
    upsert_entity(ag, reason="seed_agents")

print("OK: registry seeded")
PY
