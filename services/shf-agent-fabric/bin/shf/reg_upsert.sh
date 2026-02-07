#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/env.sh"

FILE="${1:-}"
REASON="${2:-cli_upsert}"

if [[ -z "$FILE" || ! -f "$FILE" ]]; then
  echo "ERR: JSON file missing. Use: bin/shf/reg_upsert.sh path/to/entity.json [reason]" >&2
  exit 1
fi

python3 - <<'PY' "$FILE" || true
import sys, json, pathlib
p = pathlib.Path(sys.argv[1])
try:
    json.loads(p.read_text("utf-8"))
    print("local_json_ok")
except Exception as e:
    print("ERR: invalid JSON:", e, file=sys.stderr)
    raise
PY

curl -fsS -H "X-Admin-Key: ${ADMIN_KEY}" \
  -H "Content-Type: application/json" \
  -X POST "${BASE_URL}/admin/registry/upsert" \
  --data-binary @"${FILE}" \
  -H "X-Reason: ${REASON}" \
| python3 - <<'PY'
import sys, json
d = json.load(sys.stdin)
print(json.dumps(d, indent=2, sort_keys=False))
PY
