#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

step() {
  printf '\n== %s ==\n' "$1"
}

step "Governance"
npm run check:governance

step "Master Layer Registry"
python3 scripts/check_master_layer_registry.py

step "Truth Spine Freeze"
python3 scripts/check_truth_spine_freeze.py

step "Duplicate Layer Cleanup"
python3 scripts/check_duplicate_layer_cleanup.py

step "Runtime Log Hygiene Strict"
python3 scripts/check_runtime_log_hygiene.py --strict

step "Build"
npm run build

step "Git Status"
git status --short

step "Paid-launch checks complete"
