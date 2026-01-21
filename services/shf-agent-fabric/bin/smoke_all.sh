#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${BASE_DIR}"

PATTERN="${1:-pilot_}"
LIMIT="${2:-50}"

RUN_IDS="$(
  RUNS_PATTERN="${PATTERN}" RUNS_LIMIT="${LIMIT}" python3 - <<'PY'
import os, re, glob, sys
pat = os.environ.get("RUNS_PATTERN","")
lim = int(os.environ.get("RUNS_LIMIT","50"))
rx = re.compile(pat)

files = sorted(glob.glob("registry/runs/*.json"))
out = []
for fp in files:
    rid = os.path.splitext(os.path.basename(fp))[0]
    if rx.search(rid):
        out.append(rid)
if lim > 0:
    out = out[:lim]
sys.stdout.write("\n".join(out))
PY
)"

TOTAL=0
FAILS=0

if [ -z "${RUN_IDS}" ]; then
  echo "FAIL smoke_all total=0 (no matching local runs)"
  exit 1
fi

while IFS= read -r rid; do
  [ -z "${rid}" ] && continue
  TOTAL=$((TOTAL+1))
  if ./bin/smoke_publish_ci.sh "${rid}" >/dev/null; then
    :
  else
    FAILS=$((FAILS+1))
  fi
done <<< "${RUN_IDS}"

if [ "${FAILS}" -ne 0 ]; then
  echo "FAIL smoke_all total=${TOTAL} fails=${FAILS}"
  exit 1
fi

echo "PASS smoke_all total=${TOTAL} fails=${FAILS}"
