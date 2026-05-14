from __future__ import annotations

from pathlib import Path
from typing import List

from fabric.watchtower.self_audit.schema import AuditFinding


def run_outcome_verification_checks(base_dir: Path) -> List[AuditFinding]:
    findings: List[AuditFinding] = []

    outcomes_dir = base_dir / "fabric" / "outcomes"
    verification_dir = outcomes_dir / "verification"
    schemas_dir = outcomes_dir / "schemas"

    if not outcomes_dir.exists():
        findings.append(
            AuditFinding(
                runner="outcome_verification",
                severity="critical",
                code="OUTCOMES_DIR_MISSING",
                message="fabric/outcomes directory is missing",
                details={"path": str(outcomes_dir)},
            )
        )
        return findings

    if not verification_dir.exists():
        findings.append(
            AuditFinding(
                runner="outcome_verification",
                severity="warning",
                code="OUTCOME_VERIFICATION_DIR_MISSING",
                message="fabric/outcomes/verification directory is missing",
                details={"path": str(verification_dir)},
            )
        )

    if not schemas_dir.exists():
        findings.append(
            AuditFinding(
                runner="outcome_verification",
                severity="warning",
                code="OUTCOME_SCHEMAS_DIR_MISSING",
                message="fabric/outcomes/schemas directory is missing",
                details={"path": str(schemas_dir)},
            )
        )

    return findings
