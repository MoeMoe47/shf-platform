#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# load signing keys
if [ -f .env.local ]; then
  source .env.local
fi

: "${AUDIT_DATABASE_URL:=postgresql://localhost:5432/shf_audit}"
export AUDIT_DATABASE_URL

exec python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 --log-level info
