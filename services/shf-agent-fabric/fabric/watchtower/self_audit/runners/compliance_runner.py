from __future__ import annotations

from pathlib import Path
from typing import List

from fabric.watchtower.self_audit.schema import AuditFinding


def run_compliance_checks(base_dir: Path) -> List[AuditFinding]:
    findings: List[AuditFinding] = []

    profiles_dir = base_dir / "complianceProfiles"
    contracts_dir = base_dir / "contracts"

    if not profiles_dir.exists():
        findings.append(
            AuditFinding(
                runner="compliance",
                severity="critical",
                code="COMPLIANCE_PROFILES_MISSING",
                message="complianceProfiles directory is missing",
                details={"path": str(profiles_dir)},
            )
        )

    if not contracts_dir.exists():
        findings.append(
            AuditFinding(
                runner="compliance",
                severity="critical",
                code="CONTRACTS_DIR_MISSING",
                message="contracts directory is missing",
                details={"path": str(contracts_dir)},
            )
        )

    if profiles_dir.exists():
        profile_entries = [p for p in profiles_dir.iterdir()]
        if len(profile_entries) == 0:
            findings.append(
                AuditFinding(
                    runner="compliance",
                    severity="warning",
                    code="COMPLIANCE_PROFILES_EMPTY",
                    message="complianceProfiles exists but is empty",
                    details={"path": str(profiles_dir)},
                )
            )

    if contracts_dir.exists():
        contract_entries = [p for p in contracts_dir.iterdir()]
        if len(contract_entries) == 0:
            findings.append(
                AuditFinding(
                    runner="compliance",
                    severity="warning",
                    code="CONTRACTS_DIR_EMPTY",
                    message="contracts directory exists but is empty",
                    details={"path": str(contracts_dir)},
                )
            )

    return findings
