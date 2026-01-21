#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${BASE_DIR}"

if [ -f ".env" ]; then
  set -a
  . ./.env
  set +a
fi

RUN_ID="${1:-pilot_gladden_002}"
PATTERN="${2:-pilot_}"
LIMIT="${3:-50}"

./bin/restart_8090.sh
./bin/routes_contract.sh >/dev/null
./bin/smoke_publish_ci.sh "${RUN_ID}"
./bin/smoke_all.sh "${PATTERN}" "${LIMIT}"

echo "PASS ci run_id=${RUN_ID} pattern=${PATTERN} limit=${LIMIT}"
