from __future__ import annotations

from typing import Dict, List, Any

from .gate_g import detect_downgrade
from .manifest_loader import load_compliance_manifest


# 🔒 ALLOWLIST GUARD (Institutional)
# If an app is owned by one of these businesses, it MUST use an allowlisted complianceProfileRef.
# This prevents accidental assignment of regulated/high policies (e.g., app-kermit) to SHF core apps.
ALLOWLIST_BY_BUSINESS: Dict[str, set[str]] = {
    # SHF nonprofit core apps must stay on the non-regulated core policy
    "shf_nonprofit": {"app-shf-core"},
    # If you later add an SHS for-profit businessId, add it here.
    # "shf_solutions": {"app-shf-core", "app-shs-core"},
}


def _policy(cm, policy_id: str) -> Dict[str, Any]:
    if policy_id not in cm.policy_by_id:
        raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] Unknown compliance policyId referenced: {policy_id}")
    return cm.policy_by_id[policy_id]


def enforce_gate_g_on_startup(*, repo_root, businesses: List[Dict[str, Any]], apps: List[Dict[str, Any]]) -> None:
    """
    Gate G startup enforcement:
      1) Allowlist guard (business->allowed app profiles)
      2) No-downgrade inheritance:
         - Global -> Business (business cannot loosen global)
         - Global -> App     (app cannot loosen global)
         - Business -> App   (app cannot loosen owning business)
    """
    cm = load_compliance_manifest(repo_root)

    # Build business map
    biz_by_id: Dict[str, Dict[str, Any]] = {b["businessId"]: b for b in businesses}

    # Load global policy
    G = cm.global_policy

    # 1) Business must not loosen Global
    for b in businesses:
        B = _policy(cm, b["complianceProfileRef"])
        errs = detect_downgrade(G, B, "Global→Business")
        if errs:
            raise RuntimeError(
                f"[COMPLIANCE_BOOT_FAIL] GateG downgrade for business {b['businessId']}: " + "; ".join(errs)
            )

    # 2) Allowlist guard + App must not loosen Global/Business
    for a in apps:
        aid = a["appId"]
        owning = a["owningBusinessId"]
        app_policy_id = a["complianceProfileRef"]

        # Allowlist guard (hard fail)
        allowed = ALLOWLIST_BY_BUSINESS.get(owning)
        if allowed is not None and app_policy_id not in allowed:
            raise RuntimeError(
                f"[COMPLIANCE_BOOT_FAIL] AllowlistGuard: app {aid} owned by business {owning} "
                f"must use one of {sorted(allowed)} (found '{app_policy_id}')."
            )

        if owning not in biz_by_id:
            raise RuntimeError(
                f"[COMPLIANCE_BOOT_FAIL] app {aid} references unknown owningBusinessId: {owning}"
            )

        B = _policy(cm, biz_by_id[owning]["complianceProfileRef"])
        A = _policy(cm, app_policy_id)

        errs = []
        errs += detect_downgrade(G, A, "Global→App")
        errs += detect_downgrade(B, A, "Business→App")
        if errs:
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] GateG downgrade for app {aid}: " + "; ".join(errs))
