#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

step() {
  printf '\n== %s ==\n' "$1"
}

step "Daily Governance Validation"
npm run check:governance

step "Master Layer Registry"
python3 scripts/check_master_layer_registry.py

step "Truth Spine Freeze"
python3 scripts/check_truth_spine_freeze.py

step "Duplicate Layer Cleanup"
python3 scripts/check_duplicate_layer_cleanup.py

step "Runtime Log Hygiene Strict"
if ! python3 scripts/check_runtime_log_hygiene.py --strict; then
  printf '\nFAIL: tracked runtime audit/log files are dirty.\n'
  printf 'Run this documented cleanup command after reviewing the runtime diff:\n'
  printf '  bash scripts/clean_runtime_audit_logs.sh\n'
  exit 1
fi

step "Build"
npm run build

step "Git Status"
git status --short

step "Daily Governance Audit Checks Complete"
printf 'Manual checks still required: reports/watchtower visibility, SHS-SHF boundary, public-approved guard, security/privacy, ownership/IP, and route/identity boundary.\n'

