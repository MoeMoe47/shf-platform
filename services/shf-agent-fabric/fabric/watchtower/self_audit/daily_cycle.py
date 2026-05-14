from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional

from fabric.governance.self_audit_recommendations import build_recommendations
from fabric.governance.self_audit_scoring import (
    build_scores,
    derive_audit_confidence,
    derive_status_from_findings,
)
from fabric.reports.daily_integrity_brief import write_brief_outputs
from fabric.watchtower.self_audit.delta import build_changes_since_prior
from fabric.watchtower.self_audit.runners.compliance_runner import run_compliance_checks
from fabric.watchtower.self_audit.runners.data_integrity_runner import run_data_integrity_checks
from fabric.watchtower.self_audit.runners.decision_trace_runner import run_decision_trace_checks
from fabric.watchtower.self_audit.runners.infrastructure_runner import run_infrastructure_checks
from fabric.watchtower.self_audit.runners.outcome_verification_runner import run_outcome_verification_checks
from fabric.watchtower.self_audit.runners.registry_health_runner import run_registry_health_checks
from fabric.watchtower.self_audit.runners.watchtower_state_runner import run_watchtower_state_checks
from fabric.watchtower.self_audit.schema import AuditFinding, AuditResult, AuditScores, build_empty_audit


def _ensure_storage(base_dir: Path) -> Path:
    storage_dir = base_dir / "var" / "self_audit"
    (storage_dir / "history").mkdir(parents=True, exist_ok=True)
    (storage_dir / "reports").mkdir(parents=True, exist_ok=True)
    (storage_dir / "briefs").mkdir(parents=True, exist_ok=True)
    return storage_dir


def _load_prior_latest(storage_dir: Path) -> Dict | None:
    latest_path = storage_dir / "latest.json"
    if not latest_path.exists():
        return None
    try:
        return json.loads(latest_path.read_text())
    except Exception:
        return None


def _findings_to_dict(findings: List[AuditFinding]) -> List[Dict]:
    return [f.to_dict() if hasattr(f, "to_dict") else f.__dict__ for f in findings]


def _iso_now() -> datetime:
    return datetime.now(timezone.utc)


def _next_scheduled_run(now: datetime) -> str:
    return (now + timedelta(hours=24)).isoformat()


def run_daily_self_audit(
    base_dir: Path | None = None,
    run_type: str = "manual",
    trigger_source: str = "command_center",
    requested_by: Optional[str] = None,
) -> Dict:
    if base_dir is None:
        base_dir = Path(__file__).resolve().parents[3]

    storage_dir = _ensure_storage(base_dir)
    prior = _load_prior_latest(storage_dir)

    audit: AuditResult = build_empty_audit()

    findings: List[AuditFinding] = []
    findings.extend(run_data_integrity_checks(base_dir))
    findings.extend(run_infrastructure_checks(base_dir))
    findings.extend(run_watchtower_state_checks(base_dir))
    findings.extend(run_registry_health_checks(base_dir))
    findings.extend(run_compliance_checks(base_dir))
    findings.extend(run_outcome_verification_checks(base_dir))
    findings.extend(run_decision_trace_checks(base_dir))

    findings_dict = _findings_to_dict(findings)
    scores = build_scores(findings_dict)
    status = derive_status_from_findings(findings_dict)
    confidence = derive_audit_confidence(findings_dict)

    audit.findings = findings
    audit.status = status
    audit.audit_confidence = confidence
    audit.scores = AuditScores(
        data_health=scores["data_health"],
        verification_health=scores["verification_health"],
        compliance_readiness=scores["compliance_readiness"],
        decision_integrity=scores["decision_integrity"],
        infrastructure_health=scores["infrastructure_health"],
        institutional_integrity=scores["institutional_integrity"],
    )

    payload = audit.to_dict()
    payload["scores"]["watchtower_health"] = scores["watchtower_health"]
    payload["scores"]["registry_health"] = scores["registry_health"]

    now = _iso_now()
    payload["metadata"] = {
        "engine": "Institutional Self-Audit Engine",
        "version": "phase4a",
        "runner_count": 7,
        "finding_count": len(findings_dict),
        "run_type": run_type,
        "trigger_source": trigger_source,
        "requested_by": requested_by or "system",
        "last_run_at": now.isoformat(),
        "next_scheduled_run": _next_scheduled_run(now),
    }

    payload["changes_since_prior"] = build_changes_since_prior(payload, prior)
    payload["recommended_actions"] = build_recommendations(findings_dict)

    latest_path = storage_dir / "latest.json"
    latest_path.write_text(json.dumps(payload, indent=2))

    date_key = now.strftime("%Y-%m-%d")
    timestamp_key = now.strftime("%Y-%m-%dT%H-%M-%SZ")

    history_path = storage_dir / "history" / f"{date_key}.json"
    history_path.write_text(json.dumps(payload, indent=2))

    report_path = storage_dir / "reports" / f"{timestamp_key}.json"
    report_path.write_text(json.dumps(payload, indent=2))

    brief_output = write_brief_outputs(storage_dir, timestamp_key, payload)
    payload["metadata"]["brief_paths"] = {
        "json": brief_output["json_path"],
        "markdown": brief_output["md_path"],
        "latest_json": brief_output["latest_json_path"],
        "latest_markdown": brief_output["latest_md_path"],
    }

    latest_path.write_text(json.dumps(payload, indent=2))
    history_path.write_text(json.dumps(payload, indent=2))
    report_path.write_text(json.dumps(payload, indent=2))

    return payload
