from __future__ import annotations

from pathlib import Path
from typing import List

from fabric.watchtower.self_audit.schema import AuditFinding


def run_registry_health_checks(base_dir: Path) -> List[AuditFinding]:
    findings: List[AuditFinding] = []

    registry_dir = base_dir / "registry"
    published_dir = registry_dir / "published"
    runs_dir = registry_dir / "runs"

    if not registry_dir.exists():
        findings.append(
            AuditFinding(
                runner="registry_health",
                severity="critical",
                code="REGISTRY_DIR_MISSING",
                message="registry directory is missing",
                details={"path": str(registry_dir)},
            )
        )
        return findings

    if not published_dir.exists():
        findings.append(
            AuditFinding(
                runner="registry_health",
                severity="warning",
                code="REGISTRY_PUBLISHED_MISSING",
                message="registry/published directory is missing",
                details={"path": str(published_dir)},
            )
        )

    if not runs_dir.exists():
        findings.append(
            AuditFinding(
                runner="registry_health",
                severity="warning",
                code="REGISTRY_RUNS_MISSING",
                message="registry/runs directory is missing",
                details={"path": str(runs_dir)},
            )
        )

    return findings
