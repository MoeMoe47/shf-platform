from __future__ import annotations

import os
import sys
from typing import Any, Dict

from fabric.watchtower.attestation import (
    load_keyring_or_die,
    sign_attestation_payload,
    verify_attestation_signature,
)

def main() -> int:
    # Must match attestation.py contract:
    #   SHF_ATTEST_KEYRING_JSON='{"kid1":"secret1",...}'
    #   SHF_ATTEST_ACTIVE_KID='kid2'
    try:
        active_kid, keyring = load_keyring_or_die()
    except Exception as e:
        print(f"ATTESTATION_SIGN_FAIL: {e}", file=sys.stderr)
        return 2

    # Minimal payload to prove signing works (deterministic-friendly)
    payload: Dict[str, Any] = {
        "kind": "watchtower_attestation_verify",
        "ts": 0,
        "root": "TEST_ROOT",
        "tips": [{"program_id": "__infra__", "chain_hash": "x"*64}],
    }

    secret = keyring[active_kid]
    sig = sign_attestation_payload(payload, kid=active_kid, secret=secret)

    ok, msg = verify_attestation_signature(payload, kid=active_kid, sig=sig, keyring=keyring)
    if not ok:
        print(f"ATTESTATION_VERIFY_FAIL: {msg}", file=sys.stderr)
        return 1

    print("✅ watchtower attestation OK (sign + verify)")
    print(f"   active_kid: {active_kid}")
    print(f"   kids: {sorted(list(keyring.keys()))}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
