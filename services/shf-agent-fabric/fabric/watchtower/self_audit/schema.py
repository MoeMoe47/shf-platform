from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Any, Dict, List


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class AuditFinding:
    runner: str
    severity: str
    code: str
    message: str
    details: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class AuditScores:
    data_health: int = 100
    verification_health: int = 100
    compliance_readiness: int = 100
    decision_integrity: int = 100
    infrastructure_health: int = 100
    institutional_integrity: int = 100


@dataclass
class AuditResult:
    audit_id: str
    timestamp: str
    status: str
    audit_confidence: float
    scores: AuditScores
    findings: List[AuditFinding] = field(default_factory=list)
    changes_since_prior: List[Dict[str, Any]] = field(default_factory=list)
    recommended_actions: List[Dict[str, Any]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def build_empty_audit() -> AuditResult:
    ts = utc_now_iso()
    return AuditResult(
        audit_id=ts,
        timestamp=ts,
        status="strong",
        audit_confidence=0.95,
        scores=AuditScores(),
        findings=[],
        changes_since_prior=[],
        recommended_actions=[],
        metadata={},
    )
