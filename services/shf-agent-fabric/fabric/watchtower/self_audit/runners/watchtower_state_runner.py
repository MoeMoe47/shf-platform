from __future__ import annotations

from pathlib import Path
from typing import List

from fabric.watchtower.self_audit.schema import AuditFinding


def run_watchtower_state_checks(base_dir: Path) -> List[AuditFinding]:
    findings: List[AuditFinding] = []

    var_dir = base_dir / "var"
    exports_dir = var_dir / "audit_exports"
    sqlite_store = var_dir / "watchtower_store.sqlite"
    audit_log = var_dir / "watchtower_audit.jsonl"

    if not exports_dir.exists():
        findings.append(
            AuditFinding(
                runner="watchtower_state",
                severity="warning",
                code="WATCHTOWER_EXPORTS_MISSING",
                message="watchtower audit_exports directory is missing",
                details={"path": str(exports_dir)},
            )
        )

    if sqlite_store.exists() and sqlite_store.stat().st_size == 0:
        findings.append(
            AuditFinding(
                runner="watchtower_state",
                severity="warning",
                code="WATCHTOWER_SQLITE_EMPTY",
                message="watchtower_store.sqlite exists but is empty",
                details={"path": str(sqlite_store)},
            )
        )

    if audit_log.exists() and audit_log.stat().st_size == 0:
        findings.append(
            AuditFinding(
                runner="watchtower_state",
                severity="warning",
                code="WATCHTOWER_AUDIT_LOG_EMPTY",
                message="watchtower_audit.jsonl exists but is empty",
                details={"path": str(audit_log)},
            )
        )

    return findings
