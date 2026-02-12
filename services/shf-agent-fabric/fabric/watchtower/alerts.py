from __future__ import annotations
from typing import Any, Dict, List

def _sev(score: int) -> str:
    if score >= 90:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 30:
        return "MEDIUM"
    return "LOW"

def _push(alerts: List[Dict[str, Any]], *, code: str, message: str, score: int, ctx: Dict[str, Any] | None = None) -> None:
    alerts.append(
        {
            "code": code,
            "severity": _sev(int(score)),
            "score": int(score),
            "message": str(message),
            "context": ctx or {},
        }
    )

def build_watchtower_alerts(summary: Dict[str, Any]) -> List[Dict[str, Any]]:
    alerts: List[Dict[str, Any]] = []

    coverage_total = int(summary.get("coverage_total") or 0)
    with_adapter = int(summary.get("coverage_with_adapter") or 0)
    adapter_ok = int(summary.get("coverage_adapter_ok") or 0)
    contract_ok = int(summary.get("contract_ok") or 0)
    contract_fail = int(summary.get("contract_fail") or 0)

    adapter_ok_rate = float(summary.get("adapter_ok_rate") or 0.0)
    contract_ok_rate = float(summary.get("contract_ok_rate") or 0.0)

    missing = max(0, coverage_total - with_adapter)
    if missing > 0:
        _push(
            alerts,
            code="MISSING_ADAPTER",
            message=f"{missing} program(s) in catalog have no adapter registered.",
            score=90,
            ctx={"coverage_total": coverage_total, "coverage_with_adapter": with_adapter, "missing": missing},
        )

    if with_adapter > 0 and adapter_ok < with_adapter:
        bad = max(0, with_adapter - adapter_ok)
        _push(
            alerts,
            code="ADAPTER_FAILURE",
            message=f"{bad} adapter(s) failed execution.",
            score=75,
            ctx={"with_adapter": with_adapter, "adapter_ok": adapter_ok, "failed": bad},
        )

    if contract_fail > 0:
        _push(
            alerts,
            code="CONTRACT_FAILURE",
            message=f"{contract_fail} adapter(s) returned metrics that fail the contract.",
            score=95,
            ctx={"contract_ok": contract_ok, "contract_fail": contract_fail},
        )

    if adapter_ok_rate < 1.0 and coverage_total > 0:
        _push(
            alerts,
            code="ADAPTER_OK_RATE_LT_1",
            message=f"Adapter OK rate is {adapter_ok_rate:.3f} (expected 1.000).",
            score=60,
            ctx={"adapter_ok_rate": adapter_ok_rate},
        )

    if contract_ok_rate < 1.0 and coverage_total > 0:
        _push(
            alerts,
            code="CONTRACT_OK_RATE_LT_1",
            message=f"Contract OK rate is {contract_ok_rate:.3f} (expected 1.000).",
            score=90,
            ctx={"contract_ok_rate": contract_ok_rate},
        )

    if coverage_total == 0:
        _push(
            alerts,
            code="NO_PROGRAMS",
            message="No programs found in catalog (Watchtower has nothing to observe).",
            score=80,
            ctx={},
        )

    alerts.sort(key=lambda a: (int(a.get("score", 0)), str(a.get("code", ""))), reverse=True)
    return alerts
