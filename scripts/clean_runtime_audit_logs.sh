#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RUNTIME_FILES=(
  "services/shf-agent-fabric/var/watchtower_audit.jsonl"
)

echo "Runtime audit/log cleanup helper"
echo "Repo: $ROOT_DIR"
echo "This helper restores only known tracked runtime audit files when modified."
echo "It does not delete files, touch untracked logs, touch archives, or disable audit logging."

for path in "${RUNTIME_FILES[@]}"; do
  if ! git ls-files --error-unmatch "$path" >/dev/null 2>&1; then
    echo "SKIP untracked: $path"
    continue
  fi

  if git diff --quiet -- "$path"; then
    echo "OK clean: $path"
    continue
  fi

  echo "RESTORE tracked runtime file: $path"
  git restore -- "$path"
done

echo "Runtime audit/log cleanup complete."
