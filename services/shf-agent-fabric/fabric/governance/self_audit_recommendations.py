from __future__ import annotations

from typing import Any, Dict, List


RECOMMENDATION_MAP = {
    "VAR_DIR_MISSING": "Restore or recreate the var directory before relying on audit persistence.",
    "OUT_DIR_MISSING": "Recreate the out directory or confirm output artifacts are intentionally disabled.",
    "WATCHTOWER_STORE_MISSING": "Verify watchtower persistence configuration and restore watchtower_store.sqlite.",
    "WATCHTOWER_AUDIT_LOG_MISSING": "Re-enable watchtower audit logging or restore watchtower_audit.jsonl.",
    "MAIN_ENTRYPOINT_MISSING": "Restore main.py entrypoint immediately; service boot integrity is compromised.",
    "FABRIC_DIR_MISSING": "Restore fabric core package immediately; institutional core is incomplete.",
    "APP_DIR_MISSING": "Restore app package immediately; API layer is incomplete.",
    "WATCHTOWER_EXPORTS_MISSING": "Review watchtower export pipeline and confirm exports are being written.",
    "WATCHTOWER_SQLITE_EMPTY": "Inspect watchtower_store.sqlite for initialization or persistence failure.",
    "WATCHTOWER_AUDIT_LOG_EMPTY": "Inspect watchtower_audit.jsonl for stalled or silent audit logging.",
    "REGISTRY_DIR_MISSING": "Restore the registry directory immediately; publication and registry integrity are compromised.",
    "REGISTRY_PUBLISHED_MISSING": "Restore registry/published or confirm publication output location.",
    "REGISTRY_RUNS_MISSING": "Restore registry/runs or confirm run persistence location.",
    "COMPLIANCE_PROFILES_MISSING": "Restore complianceProfiles; compliance readiness cannot be evaluated correctly.",
    "CONTRACTS_DIR_MISSING": "Restore contracts; institutional contract integrity cannot be verified.",
    "COMPLIANCE_PROFILES_EMPTY": "Populate complianceProfiles with active profiles before relying on compliance readiness.",
    "CONTRACTS_DIR_EMPTY": "Populate contracts with active contract material before relying on compliance readiness.",
    "OUTCOMES_DIR_MISSING": "Restore fabric/outcomes immediately; outcome credibility cannot be evaluated.",
    "OUTCOME_VERIFICATION_DIR_MISSING": "Restore fabric/outcomes/verification so outcome verification can be audited.",
    "OUTCOME_SCHEMAS_DIR_MISSING": "Restore fabric/outcomes/schemas to preserve outcome schema integrity.",
    "RUNS_REGISTRY_DIR_MISSING": "Restore fabric/runs_registry so decision traceability can be evaluated.",
    "DB_RUNS_DIR_MISSING": "Restore db/runs so execution history remains auditable.",
}


def build_recommendations(findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    recommendations: List[Dict[str, Any]] = []

    for finding in findings:
        code = finding.get("code")
        severity = finding.get("severity", "info")
        action = RECOMMENDATION_MAP.get(code)
        if not action:
            continue
        recommendations.append(
            {
                "priority": "high" if severity == "critical" else "medium" if severity == "warning" else "low",
                "source_code": code,
                "message": action,
            }
        )

    if not recommendations:
        recommendations.append(
            {
                "priority": "low",
                "source_code": "NO_ACTION_NEEDED",
                "message": "No action needed; the current self-audit cycle is healthy.",
            }
        )

    return recommendations
