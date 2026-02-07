#!/usr/bin/env bash
set -euo pipefail

echo "== PY Sanity =="

# 1) Compile all python
python3 -m py_compile $(git ls-files '*.py' 2>/dev/null || find . -name '*.py' -not -path './.venv/*')

# 2) Detect obvious pasted shell lines inside .py
bad="$(grep -RIn --include='*.py' -E '^\s*(curl|python3\s+-m|pip3?\s+install|code\s+-g|export\s+|BASE_URL=|chmod\s\+x)\b' . || true)"
if [[ -n "$bad" ]]; then
  echo "❌ Found shell-like lines inside .py files:"
  echo "$bad"
  exit 1
fi

echo "✅ OK"
