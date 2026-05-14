from __future__ import annotations

from typing import Any, Dict, List


SEVERITY_PENALTIES = {
    "info": 1,
    "warning": 5,
    "critical": 20,
}


def score_runner_findings(findings: List[Dict[str, Any]], runner: str, base_score: int = 100) -> int:
    score = base_score
    for finding in findings:
        if finding.get("runner") != runner:
            continue
        severity = finding.get("severity", "info")
        score -= SEVERITY_PENALTIES.get(severity, 0)
    return max(score, 0)


def derive_status_from_findings(findings: List[Dict[str, Any]]) -> str:
    severities = {f.get("severity") for f in findings}
    if "critical" in severities:
        return "critical"
    if "warning" in severities:
        return "watch"
    return "strong"


def build_scores(findings: List[Dict[str, Any]]) -> Dict[str, int]:
    scores = {
        "data_health": score_runner_findings(findings, "data_integrity"),
        "verification_health": score_runner_findings(findings, "outcome_verification"),
        "compliance_readiness": score_runner_findings(findings, "compliance"),
        "decision_integrity": score_runner_findings(findings, "decision_trace"),
        "infrastructure_health": score_runner_findings(findings, "infrastructure"),
        "watchtower_health": score_runner_findings(findings, "watchtower_state"),
        "registry_health": score_runner_findings(findings, "registry_health"),
    }

    institutional_components = [
        scores["data_health"],
        scores["verification_health"],
        scores["compliance_readiness"],
        scores["decision_integrity"],
        scores["infrastructure_health"],
        scores["watchtower_health"],
        scores["registry_health"],
    ]
    scores["institutional_integrity"] = round(sum(institutional_components) / len(institutional_components))
    return scores


def derive_audit_confidence(findings: List[Dict[str, Any]]) -> float:
    if not findings:
        return 0.97

    critical_count = sum(1 for f in findings if f.get("severity") == "critical")
    warning_count = sum(1 for f in findings if f.get("severity") == "warning")

    confidence = 0.97 - (critical_count * 0.08) - (warning_count * 0.02)
    return max(round(confidence, 2), 0.5)
