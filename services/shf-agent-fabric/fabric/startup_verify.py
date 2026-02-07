from __future__ import annotations

import sys
from fabric.registry_event_ledger import verify_ledger, auditor_one_liner

def verify_registry_on_startup() -> None:
    result = verify_ledger()

    line = auditor_one_liner(result)
    print("[REGISTRY LEDGER]", line)

    if not result.get("pass"):
        print("[REGISTRY LEDGER] FATAL: ledger verification failed, refusing to start.")
        sys.exit(1)

    if result.get("legacy_unverified_genesis"):
        print("[REGISTRY LEDGER] WARN: legacy genesis tolerated (expected for early data).")
