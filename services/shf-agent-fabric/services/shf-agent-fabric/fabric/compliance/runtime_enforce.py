from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List

from .gate_g import detect_downgrade
from .manifest_loader import load_compliance_manifest


def enforce_gate_g_on_startup(
    repo_root: Path,
    businesses: List[Dict[str, Any]],
    apps: List[Dict[str, Any]],
) -> None:
    cm = load_compliance_manifest(repo_root)
    policy_by_id = cm.policy_by_id
    G = cm.global_policy

    ci = cm.manifest.get("ciGuards") or {}
    fail_on_unknown = bool(ci.get("failOnUnknownPolicyRefs", True))

    # Validate business policies
    biz_by_id = {}
    for biz in businesses:
        bid = biz.get("businessId")
        ref = biz.get("complianceProfileRef")
        if not bid:
            raise RuntimeError("[COMPLIANCE_BOOT_FAIL] Business missing businessId")
        if not ref:
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] Business {bid} missing complianceProfileRef")
        if fail_on_unknown and ref not in policy_by_id:
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] Unknown business complianceProfileRef: {ref}")

        B = policy_by_id[ref]
        errs = detect_downgrade(G, B, "Global→Business")
        if errs:
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] GateG downgrade for business {bid}: " + "; ".join(errs))

        biz_by_id[bid] = biz

    # Validate app policies vs global and owning business
    for app in apps:
        aid = app.get("appId")
        owner = app.get("owningBusinessId")
        ref = app.get("complianceProfileRef")

        if not aid:
            raise RuntimeError("[COMPLIANCE_BOOT_FAIL] App missing appId")
        if not owner:
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] App {aid} missing owningBusinessId")
        if owner not in biz_by_id:
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] App {aid} references missing owningBusinessId={owner}")
        if not ref:
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] App {aid} missing complianceProfileRef")
        if fail_on_unknown and ref not in policy_by_id:
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] Unknown app complianceProfileRef: {ref}")

        A = policy_by_id[ref]
        B = policy_by_id[biz_by_id[owner]["complianceProfileRef"]]

        errs = detect_downgrade(G, A, "Global→App") + detect_downgrade(B, A, "Business→App")
        if errs:
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] GateG downgrade for app {aid}: " + "; ".join(errs))
