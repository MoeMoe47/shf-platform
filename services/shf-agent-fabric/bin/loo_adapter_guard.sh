#!/usr/bin/env bash
set -euo pipefail

echo "== LOO Adapter Guard =="
python3 - <<'PY'
from fabric.loo.adapter_contract import validate_program_adapters
from fabric.loo.adapter_registry import PROGRAM_ADAPTERS

# Fail fast: adapter signatures + metrics contract must hold.
validate_program_adapters(PROGRAM_ADAPTERS, days=30, baseline_weeks=8)

print("OK: adapter registry passed contract validation")
print("  adapters:", ", ".join(sorted(PROGRAM_ADAPTERS.keys())))
PY
