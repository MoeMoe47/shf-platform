#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8090}"
HOST="${HOST:-127.0.0.1}"
APP="${APP:-main:app}"

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${BASE_DIR}/logs"
LOG_FILE="${LOG_DIR}/uvicorn_${PORT}.log"

mkdir -p "${LOG_DIR}"

echo "🔁 Restarting SHF Agent Fabric on ${HOST}:${PORT} ..."
echo "   base: ${BASE_DIR}"
echo "   log:  ${LOG_FILE}"
echo ""

# --- Helper: kill anything bound to the port (LISTEN)
kill_port_listeners() {
  local pids
  pids="$(lsof -nP -iTCP:${PORT} -sTCP:LISTEN -t 2>/dev/null || true)"
  if [[ -n "${pids}" ]]; then
    echo "🧨 Killing processes listening on :${PORT}: ${pids}"
    # Try graceful first
    kill ${pids} 2>/dev/null || true
    sleep 0.6
    # Force if still there
    pids="$(lsof -nP -iTCP:${PORT} -sTCP:LISTEN -t 2>/dev/null || true)"
    if [[ -n "${pids}" ]]; then
      echo "🧨 Force killing remaining listeners: ${pids}"
      kill -9 ${pids} 2>/dev/null || true
    fi
  else
    echo "✅ No listeners on :${PORT}"
  fi
}

# --- Helper: health check with retry
wait_for_health() {
  local tries="${1:-30}"
  local delay="${2:-0.4}"

  for i in $(seq 1 "${tries}"); do
    if curl -fsS "http://${HOST}:${PORT}/loo/health" >/dev/null 2>&1; then
      echo "OK: server up on :${PORT}"
      return 0
    fi
    sleep "${delay}"
  done

  echo "❌ Server did not become healthy on :${PORT} (see log below)"
  echo "---- tail ${LOG_FILE} ----"
  tail -n 120 "${LOG_FILE}" || true
  echo "--------------------------"
  return 1
}

# 1) Stop anything on the port
kill_port_listeners

# 2) Start uvicorn in background (nohup)
echo "🚀 Starting uvicorn..."
(
  cd "${BASE_DIR}"
  nohup python3 -m uvicorn "${APP}" --host "${HOST}" --port "${PORT}" --log-level info \
    >> "${LOG_FILE}" 2>&1 &
)

# 3) Wait for health
wait_for_health 35 0.35
