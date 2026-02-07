#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/env.sh"

cd "$(cd "$DIR/.." && pwd)/.."  # back to services/shf-agent-fabric

./bin/restart_8090.sh >/dev/null

curl -fsS "${BASE_URL}/health" | python3 - <<'PY'
import sys, json
d=json.load(sys.stdin)
print("health_ok", d.get("service"), d.get("git"), d.get("codeFingerprint"))
PY

curl -fsS "${BASE_URL}/openapi.json" | python3 - <<'PY'
import sys, json
d=json.load(sys.stdin)
print("openapi_ok", d.get("info",{}).get("title"), d.get("info",{}).get("version"))
PY

curl -fsS -H "X-Admin-Key: ${ADMIN_KEY}" "${BASE_URL}/admin/registry?kind=agent" >/dev/null && echo "admin_auth_ok agents"
curl -fsS -H "X-Admin-Key: ${ADMIN_KEY}" "${BASE_URL}/admin/registry?kind=app"   >/dev/null && echo "admin_auth_ok apps"
curl -fsS -H "X-Admin-Key: ${ADMIN_KEY}" "${BASE_URL}/admin/registry?kind=business" >/dev/null && echo "admin_auth_ok business"

echo "smoke_ok"
