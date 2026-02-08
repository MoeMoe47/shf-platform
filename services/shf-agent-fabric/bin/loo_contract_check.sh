#!/usr/bin/env bash
set -euo pipefail
python3 -m py_compile fabric/loo/adapter_contract.py fabric/loo/program_adapters.py tests/test_program_adapters_contract.py
python3 -m unittest -v tests.test_program_adapters_contract
echo "OK: LOO adapter contract checks passed."
