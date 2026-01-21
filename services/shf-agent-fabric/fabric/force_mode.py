import os
from typing import List, Tuple, Optional, Dict, Any

def force_enabled() -> bool:
    v = (os.getenv("FABRIC_FORCE", "") or "").strip().lower()
    return v in ("1", "true", "yes", "on")

NON_OVERRIDABLE = {
    "visibility_not_public",
    "policy_blocked",
    "publish_allowed_false",
    "data_allowed_false",
    "run_not_found",
    "already_published",
}

def _is_overridable_issue(issue: str) -> bool:
    if not issue:
        return False
    if issue in NON_OVERRIDABLE:
        return False
    if issue.startswith("missing_"):
        return True
    if issue.startswith("meta_"):
        return True
    if issue.startswith("required_"):
        return True
    if issue.startswith("warn_"):
        return True
    return False

def apply_force(issues: List[str], force_requested: bool, force_reason: Optional[str]) -> Tuple[bool, List[str], Dict[str, Any]]:
    meta: Dict[str, Any] = {"force_requested": bool(force_requested), "force_enabled": force_enabled(), "force_reason": (force_reason or "").strip() or None}
    if not force_requested:
        return False, issues, meta
    if not force_enabled():
        meta["force_denied"] = "force_disabled"
        return False, issues, meta
    if not meta["force_reason"]:
        meta["force_denied"] = "force_reason_required"
        return False, issues, meta
    kept: List[str] = []
    overridden: List[str] = []
    for it in issues:
        if _is_overridable_issue(it):
            overridden.append(it)
        else:
            kept.append(it)
    forced = len(overridden) > 0 and len(kept) == 0
    meta["force_overridden"] = overridden
    meta["force_kept"] = kept
    meta["forced"] = forced
    return forced, kept, meta
