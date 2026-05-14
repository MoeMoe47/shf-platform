from __future__ import annotations

from pathlib import Path
from typing import List

from fabric.watchtower.self_audit.schema import AuditFinding


def run_infrastructure_checks(base_dir: Path) -> List[AuditFinding]:
    findings: List[AuditFinding] = []

    main_py = base_dir / "main.py"
    fabric_dir = base_dir / "fabric"
    app_dir = base_dir / "app"

    if not main_py.exists():
        findings.append(
            AuditFinding(
                runner="infrastructure",
                severity="critical",
                code="MAIN_ENTRYPOINT_MISSING",
                message="main.py entrypoint is missing",
                details={"path": str(main_py)},
            )
        )

    if not fabric_dir.exists():
        findings.append(
            AuditFinding(
                runner="infrastructure",
                severity="critical",
                code="FABRIC_DIR_MISSING",
                message="fabric directory is missing",
                details={"path": str(fabric_dir)},
            )
        )

    if not app_dir.exists():
        findings.append(
            AuditFinding(
                runner="infrastructure",
                severity="critical",
                code="APP_DIR_MISSING",
                message="app directory is missing",
                details={"path": str(app_dir)},
            )
        )

    return findings
