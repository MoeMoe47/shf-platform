from __future__ import annotations

from typing import Any, Dict, List, Tuple
import math

from fastapi import APIRouter

from fabric.loo.adapter_registry import PROGRAM_ADAPTERS
from fabric.watchtower.risk_engine import apply_risk_fields
from fabric.watchtower.store import get_quarantine_map
from fabric.watchtower.audit import log_event


router = APIRouter(prefix="/loo", tags=["loo"])


# -------------------------
# Helpers
# -------------------------

def _clamp01(x: float) -> float:
    if x < 0:
        return 0.0
    if x > 1:
        return 1.0
    return float(x)


def _safe_float(x: Any, default: float = 0.0) -> float:
    try:
        if x is None:
            return default
        return float(x)
    except Exception:
        return default


def _health01_from_metrics(metrics: Dict[str, Any]) -> float:
    weekly = metrics.get("weekly_series")
    if isinstance(weekly, list) and weekly:
        last = weekly[-1]
        if isinstance(last, dict) and "health_01" in last:
            return _clamp01(_safe_float(last.get("health_01"), 0.0))

    if "health_01" in metrics:
        return _clamp01(_safe_float(metrics.get("health_01"), 0.0))

    active_rate = _clamp01(_safe_float(metrics.get("active_rate"), 0.0))
    rounds_per_day = _safe_float(metrics.get("rounds_per_day"), 0.0)
    signals_per_day = _safe_float(metrics.get("signals_per_day"), 0.0)

    vol_rounds = _clamp01(rounds_per_day / 1.0)     # 1 round/day -> 1.0
    vol_signals = _clamp01(signals_per_day / 10.0)  # 10 signals/day -> 1.0

    proxy = 0.55 * active_rate + 0.25 * vol_rounds + 0.20 * vol_signals
    return _clamp01(proxy)


def _delta_pack(metrics: Dict[str, Any]) -> Tuple[float, str]:
    bc = metrics.get("baseline_compare")
    if isinstance(bc, dict):
        ds = _safe_float(bc.get("delta_score_01"), 0.0)
        tb = str(bc.get("trend_band") or "FLAT").upper()
        return (_clamp01(ds), tb)
    return (0.0, "FLAT")


def _volume01(metrics: Dict[str, Any]) -> float:
    signals_total = max(0.0, _safe_float(metrics.get("signals_total"), 0.0))
    rounds_total = max(0.0, _safe_float(metrics.get("rounds_finalized_total"), 0.0))

    s = math.log1p(signals_total) / math.log1p(200.0)  # 200 signals ~ 1.0
    r = math.log1p(rounds_total) / math.log1p(50.0)    # 50 rounds ~ 1.0
    return _clamp01(0.6 * s + 0.4 * r)


def _quality01(metrics: Dict[str, Any]) -> float:
    diversity = _clamp01(_safe_float(metrics.get("winner_strategy_diversity_01"), 0.0))
    median_gap = max(0.0, _safe_float(metrics.get("median_minutes_between_rounds"), 0.0))

    if median_gap <= 0:
        stability = 0.0
    elif median_gap < 10:
        stability = median_gap / 10.0
    elif median_gap <= 60:
        stability = 1.0
    elif median_gap <= 240:
        stability = max(0.0, 1.0 - ((median_gap - 60.0) / 180.0))
    else:
        stability = 0.0

    return _clamp01(0.65 * diversity + 0.35 * stability)


def _rank_score01(health01: float, delta01: float, volume01: float, quality01: float) -> float:
    s = (
        0.55 * _clamp01(health01)
        + 0.20 * _clamp01(delta01)
        + 0.15 * _clamp01(volume01)
        + 0.10 * _clamp01(quality01)
    )
    return _clamp01(s)


# -------------------------
# Watchtower-aligned risk + quarantine gate
# -------------------------

def _as_list(x: Any) -> List[Any]:
    if isinstance(x, list):
        return x
    return []


def _risk_band_quarantine(row: Dict[str, Any]) -> Tuple[str, bool, List[str]]:
    """
    Returns (risk_band, quarantined, reasons).

    Quarantine is a hard block: score forced to 0 and ranked last.
    This is the core "top 1%" rule: unsafe programs cannot win.
    """
    reasons: List[str] = []

    # Hard quarantine conditions
    if not bool(row.get("ok")):
        reasons.append("NOT_OK")
    if not bool(row.get("adapter_ok")):
        reasons.append("ADAPTER_NOT_OK")

    evidence = row.get("evidence") if isinstance(row.get("evidence"), dict) else {}
    contract_errors = _as_list(evidence.get("contract_errors"))
    if contract_errors:
        reasons.append("CONTRACT_ERRORS")

    mcv = str(row.get("metrics_contract_version") or "").strip()
    if not mcv:
        reasons.append("MISSING_METRICS_CONTRACT_VERSION")

    # If any hard reason -> quarantine
    quarantined = len(reasons) > 0
    if quarantined:
        return ("QUARANTINE", True, reasons)

    # Numeric risk signals
    health = float(row.get("health_01") or 0.0)
    rank_score = float(row.get("rank_score_01") or 0.0)
    delta = float(row.get("delta_score_01") or 0.0)
    trend = str(row.get("trend_band") or "").upper()

    # RED conditions
    if health < 0.40:
        return ("RED", False, [])
    if rank_score < 0.35:
        return ("RED", False, [])
    if trend == "DOWN" and delta < 0.25:
        return ("RED", False, [])

    # YELLOW conditions
    if health < 0.60:
        return ("YELLOW", False, [])
    if rank_score < 0.55:
        return ("YELLOW", False, [])
    if trend == "FLAT" and delta < 0.35:
        return ("YELLOW", False, [])

    return ("GREEN", False, [])


# -------------------------
# Catalog + adapter metrics
# -------------------------

def _load_program_catalog() -> List[Dict[str, Any]]:
    try:
        from routers.loo_routes import loo_programs  # type: ignore
        cat = loo_programs()
        progs = cat.get("programs") if isinstance(cat, dict) else None
        return progs if isinstance(progs, list) else []
    except Exception:
        return []


def _metrics_for_program(program: Dict[str, Any], *, days: int, baseline_weeks: int) -> Dict[str, Any]:
    program_id = str(program.get("program_id") or "")
    adapter = PROGRAM_ADAPTERS.get(program_id)
    if not adapter:
        return {"__adapter_ok": False, "__adapter_error": "NO_ADAPTER"}

    try:
        m = adapter(days=int(days), baseline_weeks=int(baseline_weeks))
    except Exception as ex:
        return {
            "__adapter_ok": False,
            "__adapter_error": f"ADAPTER_EXCEPTION:{type(ex).__name__}",
            "__adapter_detail": str(ex),
        }

    if not isinstance(m, dict):
        return {"__adapter_ok": False, "__adapter_error": "NON_DICT_METRICS"}

    m["__adapter_ok"] = True
    m["__adapter_error"] = ""
    return m


# -------------------------
# Route
# -------------------------

@router.get("/rankings")
def loo_rankings(days: int = 30, baseline_weeks: int = 8) -> Dict[str, Any]:
    programs = _load_program_catalog()
    if not programs:
        return {"ok": False, "error": "PROGRAM_CATALOG_EMPTY", "detail": "No programs returned by loo_programs()"}

    rows: List[Dict[str, Any]] = []

    for p in programs:
        if not isinstance(p, dict):
            continue

        program_id = str(p.get("program_id") or "")
        app_id = str(p.get("app_id") or "")
        label = str(p.get("label") or program_id or app_id)

        metrics = _metrics_for_program(p, days=int(days), baseline_weeks=int(baseline_weeks))

        adapter_ok = bool(metrics.get("__adapter_ok") is True)
        adapter_error = str(metrics.get("__adapter_error") or "")

        # Adapter fail row (still included)
        if not adapter_ok:
            rows.append(
                {
                    "program_id": program_id,
                    "app_id": app_id,
                    "label": label,
                    "ok": False,
                    "error": "ADAPTER_FAILED",
                    "adapter_ok": False,
                    "adapter_error": adapter_error,
                    "metrics_contract_version": "",
                    "rank_score_01": 0.0,
                    "health_01": 0.0,
                    "delta_score_01": 0.0,
                    "trend_band": "DOWN",
                    "volume_01": 0.0,
                    "quality_01": 0.0,
                    "rank_formula_version": "v1",
                # Enforcement-grade gating (Watchtower risk engine)
                # Note: we fill risk fields after row construction.

                    "risk_band": "QUARANTINE",
                    "quarantined": True,
                    "quarantine_reasons": ["ADAPTER_FAILED"],
                    "evidence": {"meta": {}, "contract_errors": ["ADAPTER_FAILED"]},
                }
            )
            continue

        health01 = _health01_from_metrics(metrics)
        delta01, trend_band = _delta_pack(metrics)
        volume01 = _volume01(metrics)
        quality01 = _quality01(metrics)

        raw_score01 = _rank_score01(health01, delta01, volume01, quality01)
        mcv = str(metrics.get("metrics_contract_version") or "").strip()

        # evidence for Watchtower + audits
        evidence = {
            "meta": {
                "days": int(days),
                "baseline_weeks": int(baseline_weeks),
            },
            "contract_errors": [],
        }

        base_row: Dict[str, Any] = {
            "program_id": program_id,
            "app_id": app_id,
            "label": label,
            "ok": True,
            "adapter_ok": True,
            "adapter_error": "",
            "metrics_contract_version": mcv,
            "rank_score_01": round(raw_score01, 4),
            "health_01": round(health01, 4),
            "delta_score_01": round(delta01, 4),
            "trend_band": str(trend_band or "FLAT").upper(),
            "volume_01": round(volume01, 4),
            "quality_01": round(quality01, 4),
            "rank_formula_version": "v1",
                # Enforcement-grade gating (Watchtower risk engine)
                # Note: we fill risk fields after row construction.

            "evidence": evidence,
        }

        # Compute risk + quarantine AFTER scoring inputs exist
        risk_band, quarantined, q_reasons = _risk_band_quarantine(base_row)

        # Enforce: quarantined cannot compete
        enforced_score01 = 0.0 if quarantined else float(base_row.get("rank_score_01") or 0.0)
        base_row["rank_score_01"] = round(float(enforced_score01), 4)

        base_row["risk_band"] = risk_band
        base_row["quarantined"] = bool(quarantined)
        base_row["quarantine_reasons"] = q_reasons

        rows.append(base_row)

    # Sort deterministically:
    # 1) non-quarantined first
    # 2) higher score first
    # 3) higher health first
    # 4) label stable
    ## ENFORCEMENT POST-PROCESS (Watchtower consult before scoring)
    qmap = get_quarantine_map()
    for r in rows:
        if not isinstance(r, dict):
            continue
        # Apply shared risk engine
        apply_risk_fields(r)
        pid = str(r.get("program_id") or "")
        # Manual quarantine overrides everything
        if pid and pid in qmap:
            r["risk_band"] = "QUARANTINE"
            r["quarantined"] = True
            r["watchtower_action"] = "QUARANTINE"
            r["quarantine_reasons"] = ["manual_quarantine"]
            r["manual_quarantine"] = qmap.get(pid)

        # Hard gate: quarantined programs cannot compete
        if bool(r.get("quarantined")):
            r["rank_score_01"] = 0.0
            try:
                log_event({"risk_band": r.get("risk_band"), "reasons": r.get("quarantine_reasons")}, kind="loo_quarantine_gate", program_id=pid)
            except Exception:
                pass

    rows.sort(
        key=lambda r: (
            bool(r.get("quarantined") is True),
            -(float(r.get("rank_score_01") or 0.0)),
            -(float(r.get("health_01") or 0.0)),
            str(r.get("label") or ""),
        )
    )

    # Rank numbers assigned after sort
    for i, r in enumerate(rows, start=1):
        r["rank"] = i

    return {
        "ok": True,
        "days": int(days),
        "baseline_weeks": int(baseline_weeks),
        "count": len(rows),
        "rankings": rows,
        "notes": "Adapter-driven comparator. Quarantine/risk gating is enforced so unsafe programs cannot win.",
    }
