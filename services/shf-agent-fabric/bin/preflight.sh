#!/usr/bin/env bash
set -euo pipefail

RUN_ID="${1:-pilot_gladden_002}"
PATTERN="${2:-pilot_}"
LIMIT="${3:-50}"

set -a
source .env
set +a

./bin/restart_8090.sh

./bin/routes_contract.sh >/tmp/routes_contract.out

./bin/contract_snapshot.sh
tail -n 5 /tmp/routes_contract.out | grep -q "OK" || { echo "FAIL preflight routes_contract"; exit 1; }

./bin/smoke_publish_ci.sh "${RUN_ID}"

./bin/smoke_all.sh "${PATTERN}" "${LIMIT}"

echo "PASS preflight run_id=${RUN_ID} pattern=${PATTERN} limit=${LIMIT}"
