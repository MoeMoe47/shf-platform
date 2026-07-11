#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

echo "== Step 0: Sanity checks =="
command -v python3 >/dev/null

echo "== Step 1: Direct ledger verification =="
SHRV1_LEDGER_VERIFY_TIMEOUT="${SHRV1_LEDGER_VERIFY_TIMEOUT:-30}" \
  python3 tools/precommit/check_ledger_precommit.py

echo "== Step 2: Registry guard =="
SHRV1_REGISTRY_GUARD_TIMEOUT="${SHRV1_REGISTRY_GUARD_TIMEOUT:-60}" \
  python3 tools/precommit/check_registry_guard.py

echo "✅ Ledger and registry guard verified clean — ALL GOOD"
