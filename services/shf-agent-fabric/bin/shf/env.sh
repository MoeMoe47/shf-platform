#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8090}"

if [[ -z "${ADMIN_KEY:-}" ]]; then
  if command -v shfkey >/dev/null 2>&1; then
    shfkey >/dev/null 2>&1 || true
  fi
fi

if [[ -z "${ADMIN_KEY:-}" ]]; then
  echo "ERR: ADMIN_KEY not set. Run: shfkey" >&2
  exit 1
fi
