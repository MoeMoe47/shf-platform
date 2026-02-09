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


# --- Gate G Runtime Compliance (hard-fail boot) ---
from pathlib import Path
from fabric.compliance.runtime_enforce import enforce_gate_g_on_startup
from fabric.compliance.registry_loaders import load_business_registry, load_app_registry


def verify_compliance_gate_g_or_die() -> None:
    # file: services/shf-agent-fabric/fabric/startup_verify.py
    # parents[0]=fabric, [1]=shf-agent-fabric, [2]=services, [3]=repo root
    repo_root = Path(__file__).resolve().parents[3]

    businesses = load_business_registry()
    apps = load_app_registry()

    enforce_gate_g_on_startup(repo_root=repo_root, businesses=businesses, apps=apps)
    print("[COMPLIANCE] Gate G verified (startup hard-pass).")
