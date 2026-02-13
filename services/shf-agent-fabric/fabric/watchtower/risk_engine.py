from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Tuple


def _as_list(x: Any) -> List[Any]:
    return x if isinstance(x, list) else []


@dataclass(frozen=True)
class RiskResult:
    risk_band: str                # GREEN | YELLOW | RED | QUARANTINE
    quarantined: bool
    reasons: List[str]
    action: str                   # ALLOW | DEGRADE | QUARANTINE


def classify_row(row: Dict[str, Any]) -> RiskResult:
    """
    Shared risk/quarantine classifier used by BOTH:
      - LOO rankings (enforcement-grade scoring)
      - Watchtower aggregator (observability / rollups)

    Quarantine means: unsafe/untrusted to score or treat as "winner".
    """
    reasons: List[str] = []

    ok = bool(row.get("ok"))
    adapter_ok = bool(row.get("adapter_ok"))

    evidence = row.get("evidence") if isinstance(row.get("evidence"), dict) else {}
    contract_errors = _as_list(evidence.get("contract_errors"))

    adapter_error = str(row.get("adapter_error") or "")

    # --- Quarantine triggers (hard gates) ---
    if not ok:
        reasons.append("ok=false")
    if not adapter_ok:
        reasons.append("adapter_ok=false")
    if contract_errors:
        reasons.append("contract_errors")
    if adapter_error in {"NO_RANKING_ROW", "RANKINGS_FAILED"}:
        reasons.append("no_ranking_row")

    quarantined = bool(reasons) and (not adapter_ok or bool(contract_errors) or ("no_ranking_row" in reasons) or (not ok))
    if quarantined:
        return RiskResult("QUARANTINE", True, reasons, "QUARANTINE")

    # --- Numeric risk signals (soft) ---
    health = float(row.get("health_01") or 0.0)
    rank_score = float(row.get("rank_score_01") or 0.0)
    delta = float(row.get("delta_score_01") or 0.0)
    trend = str(row.get("trend_band") or "").upper()

    # RED
    if health < 0.40:
        return RiskResult("RED", False, ["health<0.40"], "DEGRADE")
    if rank_score < 0.30 and health < 0.60:
        return RiskResult("RED", False, ["rank_score low + health<0.60"], "DEGRADE")
    if trend == "DOWN" and delta < -0.20:
        return RiskResult("RED", False, ["trend down + delta<-0.20"], "DEGRADE")

    # YELLOW
    if health < 0.70:
        return RiskResult("YELLOW", False, ["health<0.70"], "DEGRADE")
    if rank_score < 0.50:
        return RiskResult("YELLOW", False, ["rank_score<0.50"], "DEGRADE")
    if trend == "DOWN":
        return RiskResult("YELLOW", False, ["trend down"], "DEGRADE")

    return RiskResult("GREEN", False, [], "ALLOW")


def apply_risk_fields(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Mutates row in-place with:
      risk_band, quarantined, quarantine_reasons, watchtower_action
    Returns the same dict for convenience.
    """
    r = classify_row(row)
    row["risk_band"] = r.risk_band
    row["quarantined"] = bool(r.quarantined)
    row["quarantine_reasons"] = list(r.reasons)
    row["watchtower_action"] = r.action
    return row
