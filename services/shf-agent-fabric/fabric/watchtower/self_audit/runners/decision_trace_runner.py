from __future__ import annotations

from pathlib import Path
from typing import List

from fabric.watchtower.self_audit.schema import AuditFinding


def run_decision_trace_checks(base_dir: Path) -> List[AuditFinding]:
    findings: List[AuditFinding] = []

    runs_registry_dir = base_dir / "fabric" / "runs_registry"
    db_runs_dir = base_dir / "db" / "runs"

    if not runs_registry_dir.exists():
        findings.append(
            AuditFinding(
                runner="decision_trace",
                severity="warning",
                code="RUNS_REGISTRY_DIR_MISSING",
                message="fabric/runs_registry directory is missing",
                details={"path": str(runs_registry_dir)},
            )
        )

    if not db_runs_dir.exists():
        findings.append(
            AuditFinding(
                runner="decision_trace",
                severity="warning",
                code="DB_RUNS_DIR_MISSING",
                message="db/runs directory is missing",
                details={"path": str(db_runs_dir)},
            )
        )

    return findings
