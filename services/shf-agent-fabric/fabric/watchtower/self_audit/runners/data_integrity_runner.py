from __future__ import annotations

from pathlib import Path
from typing import List

from fabric.watchtower.self_audit.schema import AuditFinding


def run_data_integrity_checks(base_dir: Path) -> List[AuditFinding]:
    findings: List[AuditFinding] = []

    var_dir = base_dir / "var"
    out_dir = base_dir / "out"

    if not var_dir.exists():
        findings.append(
            AuditFinding(
                runner="data_integrity",
                severity="critical",
                code="VAR_DIR_MISSING",
                message="var directory is missing",
                details={"path": str(var_dir)},
            )
        )

    if not out_dir.exists():
        findings.append(
            AuditFinding(
                runner="data_integrity",
                severity="warning",
                code="OUT_DIR_MISSING",
                message="out directory is missing",
                details={"path": str(out_dir)},
            )
        )

    watchtower_store = var_dir / "watchtower_store.sqlite"
    if var_dir.exists() and not watchtower_store.exists():
        findings.append(
            AuditFinding(
                runner="data_integrity",
                severity="warning",
                code="WATCHTOWER_STORE_MISSING",
                message="watchtower sqlite store is missing",
                details={"path": str(watchtower_store)},
            )
        )

    latest_audit_log = var_dir / "watchtower_audit.jsonl"
    if var_dir.exists() and not latest_audit_log.exists():
        findings.append(
            AuditFinding(
                runner="data_integrity",
                severity="warning",
                code="WATCHTOWER_AUDIT_LOG_MISSING",
                message="watchtower audit log is missing",
                details={"path": str(latest_audit_log)},
            )
        )

    return findings
