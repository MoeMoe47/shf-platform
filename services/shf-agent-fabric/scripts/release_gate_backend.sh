#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

echo "== SHF Backend Release Gate =="
echo "repo: $ROOT"
echo

# --- ENV ---
export PYTHONPATH="services/shf-agent-fabric"

# Optional: strict mode for attestations
# If RELEASE_STRICT_ATTEST=1, we fail if attestation env is missing
RELEASE_STRICT_ATTEST="${RELEASE_STRICT_ATTEST:-0}"

echo "== 1) Python import sanity =="
python3 -c "import sys; print('python:', sys.version.split()[0])"

echo
echo "== 2) Gate G (import-time hard-pass already happens; re-run for proof) =="
python3 - <<'PY'
from fabric.startup_verify import verify_compliance_gate_g_or_die
verify_compliance_gate_g_or_die()
print("OK: Gate G")
PY

echo
echo "== 3) Runtime enforcement lock verifier =="
python3 services/shf-agent-fabric/scripts/verify_runtime_enforcement_lock.py

echo
echo "== 4) Registry contract verifier =="
python3 services/shf-agent-fabric/scripts/verify_registry_contract.py

echo
echo "== 5) Watchtower schema + snapshot store usability (write/read/hash) =="
python3 - <<'PY'
from fabric.watchtower.store import ensure_schema
ensure_schema()
print("OK: watchtower ensure_schema")
PY

# If you created this script earlier, run it; otherwise we just proceed.
if [ -f "services/shf-agent-fabric/scripts/verify_watchtower_snapshot_store.py" ]; then
  python3 services/shf-agent-fabric/scripts/verify_watchtower_snapshot_store.py
else
  echo "WARN: verify_watchtower_snapshot_store.py not found (skipping)."
fi

echo
echo "== 6) Attestation checks (optional unless strict) =="

# If attestation verifier exists, run it with graceful behavior.
if [ -f "services/shf-agent-fabric/scripts/verify_watchtower_attestation.py" ]; then
  if [ -n "${SHF_ATTEST_KEYRING_JSON:-}" ] || [ "$RELEASE_STRICT_ATTEST" = "1" ]; then
    if [ -z "${SHF_ATTEST_KEYRING_JSON:-}" ]; then
      echo "FAIL: SHF_ATTEST_KEYRING_JSON missing but RELEASE_STRICT_ATTEST=1"
      exit 2
    fi
    # active kid is optional; attestation.py can default
    python3 services/shf-agent-fabric/scripts/verify_watchtower_attestation.py
  else
    echo "WARN: SHF_ATTEST_KEYRING_JSON not set; skipping attestation verifier."
    echo "      To enforce: export RELEASE_STRICT_ATTEST=1"
  fi
else
  echo "WARN: verify_watchtower_attestation.py not found (skipping)."
fi

echo
echo "== 7) Pytest =="
pytest -q

echo
echo "✅ RELEASE GATE PASS"
