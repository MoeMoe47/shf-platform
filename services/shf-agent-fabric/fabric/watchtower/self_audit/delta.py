from __future__ import annotations

from typing import Any, Dict, List


def build_changes_since_prior(current: Dict[str, Any], prior: Dict[str, Any] | None) -> List[Dict[str, Any]]:
    if not prior:
        return [{"type": "baseline", "message": "No prior audit snapshot available; baseline established"}]

    changes: List[Dict[str, Any]] = []

    current_scores = current.get("scores", {})
    prior_scores = prior.get("scores", {})

    watched_scores = [
        "data_health",
        "verification_health",
        "compliance_readiness",
        "decision_integrity",
        "infrastructure_health",
        "institutional_integrity",
    ]

    for key in watched_scores:
        cur = current_scores.get(key)
        prev = prior_scores.get(key)
        if cur is None or prev is None:
            continue
        delta = cur - prev
        if delta != 0:
            direction = "improved" if delta > 0 else "declined"
            changes.append(
                {
                    "type": "score_delta",
                    "metric": key,
                    "previous": prev,
                    "current": cur,
                    "delta": delta,
                    "direction": direction,
                    "message": f"{key} {direction} by {abs(delta)} points",
                }
            )

    current_findings = current.get("findings", [])
    prior_findings = prior.get("findings", [])

    current_codes = {f.get("code") for f in current_findings if f.get("code")}
    prior_codes = {f.get("code") for f in prior_findings if f.get("code")}

    new_codes = sorted(current_codes - prior_codes)
    resolved_codes = sorted(prior_codes - current_codes)

    for code in new_codes:
        changes.append(
            {
                "type": "finding_added",
                "code": code,
                "message": f"New finding detected: {code}",
            }
        )

    for code in resolved_codes:
        changes.append(
            {
                "type": "finding_resolved",
                "code": code,
                "message": f"Finding resolved: {code}",
            }
        )

    if not changes:
        changes.append({"type": "no_material_change", "message": "No material change since prior audit"})

    return changes
