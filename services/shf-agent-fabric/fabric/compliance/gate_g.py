from __future__ import annotations
from typing import Any, Dict, List

RiskRank = {"low": 0, "medium": 1, "high": 2, "critical": 3}

def detect_downgrade(upstream: Dict[str, Any], downstream: Dict[str, Any], label: str) -> List[str]:
    u = upstream or {}
    d = downstream or {}
    errs: List[str] = []

    def expanded(field: str) -> None:
        extra = set(d.get(field, []) or []) - set(u.get(field, []) or [])
        if extra:
            errs.append(f"{label}: {field} expanded by {sorted(extra)}")

    def removed(field: str) -> None:
        removed_vals = set(u.get(field, []) or []) - set(d.get(field, []) or [])
        if removed_vals:
            errs.append(f"{label}: {field} removed {sorted(removed_vals)}")

    def loosen_bool(field: str) -> None:
        if bool(u.get(field, True)) is True and bool(d.get(field, True)) is False:
            errs.append(f"{label}: {field} flipped true→false")

    def loosen_num(field: str) -> None:
        if int(d.get(field, 0) or 0) > int(u.get(field, 0) or 0):
            errs.append(f"{label}: {field} increased {u.get(field)}→{d.get(field)}")

    # allowlists cannot expand
    for f in ("allowedDataClasses", "allowedJurisdictions", "allowedScopes", "allowedDataTypes"):
        expanded(f)

    # restrictions cannot shrink
    for f in ("restrictedDataTypes", "prohibitedScopes", "neverExecuteActions"):
        removed(f)

    # booleans cannot loosen
    for f in ("auditLoggingRequired", "traceIdRequired", "attributionRequired", "consentRequired", "disclosureRequired"):
        loosen_bool(f)

    # numeric limits cannot loosen
    loosen_num("maxRetentionDays")
    loosen_num("exportLimit")

    # risk cannot loosen (higher rank = looser)
    if RiskRank.get(d.get("maxRiskTier", "low"), 0) > RiskRank.get(u.get("maxRiskTier", "low"), 0):
        errs.append(f"{label}: maxRiskTier increased {u.get('maxRiskTier')}→{d.get('maxRiskTier')}")

    return errs
