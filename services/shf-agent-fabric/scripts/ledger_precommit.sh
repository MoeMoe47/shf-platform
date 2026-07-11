#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

echo "== Phase 3: ledger precommit =="
echo "Direct local verification only; no server restart or HTTP route probe."

SHRV1_LEDGER_VERIFY_TIMEOUT="${SHRV1_LEDGER_VERIFY_TIMEOUT:-30}" \
  python3 tools/precommit/check_ledger_precommit.py

echo "✅ DONE: ledger verified"
