from __future__ import annotations

from typing import Any, Dict, List, Tuple
import math

from fastapi import APIRouter

# ✅ IMPORTANT: no self-HTTP calls inside the server
# We rank programs by calling their builders in-process.

router = APIRouter(prefix="/loo", tags=["loo"])


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
    """
    Prefer health_01 if present (weekly last point), else infer a simple proxy.
    """
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
    """
    Return (delta_score_01, trend_band) from baseline_compare if available.
    """
    bc = metrics.get("baseline_compare")
    if isinstance(bc, dict):
        ds = _safe_float(bc.get("delta_score_01"), 0.0)
        tb = str(bc.get("trend_band") or "FLAT").upper()
        return (_clamp01(ds), tb)
    return (0.0, "FLAT")


def _volume01(metrics: Dict[str, Any]) -> float:
    """
    Deterministic volume score: combines signals_total and rounds_finalized_total.
    Uses log scaling so a huge program doesn't dominate.
    """
    signals_total = max(0.0, _safe_float(metrics.get("signals_total"), 0.0))
    rounds_total = max(0.0, _safe_float(metrics.get("rounds_finalized_total"), 0.0))

    s = math.log1p(signals_total) / math.log1p(200.0)  # 200 signals ~ 1.0
    r = math.log1p(rounds_total) / math.log1p(50.0)    # 50 rounds ~ 1.0
    return _clamp01(0.6 * s + 0.4 * r)


def _quality01(metrics: Dict[str, Any]) -> float:
    """
    Deterministic quality: diversity + stability proxy.
    """
    diversity = _clamp01(_safe_float(metrics.get("winner_strategy_diversity_01"), 0.0))
    median_gap = max(0.0, _safe_float(metrics.get("median_minutes_between_rounds"), 0.0))

    # Stability proxy: peak around 10–60 minutes
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
    """
    Single ranking score. Health dominates, then momentum, then volume/quality.
    """
    s = 0.55 * _clamp01(health01) + 0.20 * _clamp01(delta01) + 0.15 * _clamp01(volume01) + 0.10 * _clamp01(quality01)
    return _clamp01(s)


def _load_program_catalog() -> List[Dict[str, Any]]:
    """
    Source of truth: reuse the existing /loo/programs implementation in-process.
    No HTTP.
    """
    try:
        from routers.loo_routes import loo_programs  # type: ignore
        cat = loo_programs()
        progs = cat.get("programs") if isinstance(cat, dict) else None
        return progs if isinstance(progs, list) else []
    except Exception:
        return []


def _metrics_for_program(program: Dict[str, Any], *, days: int, baseline_weeks: int) -> Dict[str, Any]:
    """
    In-process metrics fetch.
    v1: supports Arena via fabric.arena.rollup.build_arena_metrics
    Future: add mappings for other programs.
    """
    program_id = str(program.get("program_id") or "")
    metrics_ep = str(program.get("metrics_endpoint") or "")

    # Arena program mapping (current)
    if program_id == "arena_observation_deck" or metrics_ep == "/arena/metrics":
        from fabric.arena.rollup import build_arena_metrics  # type: ignore
        # Your build_arena_metrics already supports baseline_weeks in your latest output.
        try:
            return build_arena_metrics(days=int(days), baseline_weeks=int(baseline_weeks))  # type: ignore
        except TypeError:
            # fallback if baseline_weeks not supported in some branch
            return build_arena_metrics(days=int(days))  # type: ignore

    # Unknown program
    return {}


@router.get("/rankings")
def loo_rankings(days: int = 30, baseline_weeks: int = 8) -> Dict[str, Any]:
    """
    Cross-program comparator for LOO (deterministic, spectator-safe, no self-HTTP).

    Steps:
      1) Load program catalog from loo_programs() (in-process)
      2) Call each program's metrics builder (in-process)
      3) Compute: health_01, delta_score_01, volume_01, quality_01
      4) Rank by rank_score_01 descending
    """
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
        if not isinstance(metrics, dict) or not metrics:
            rows.append(
                {
                    "program_id": program_id,
                    "app_id": app_id,
                    "label": label,
                    "ok": False,
                    "error": "METRICS_UNAVAILABLE",
                    "detail": {"program_id": program_id, "metrics_endpoint": p.get("metrics_endpoint")},
                }
            )
            continue

        health01 = _health01_from_metrics(metrics)
        delta01, trend_band = _delta_pack(metrics)
        volume01 = _volume01(metrics)
        quality01 = _quality01(metrics)
        score01 = _rank_score01(health01, delta01, volume01, quality01)

        rows.append(
            {
                "program_id": program_id,
                "app_id": app_id,
                "label": label,
                "ok": True,
                "rank_score_01": float(round(score01, 4)),
                "health_01": float(round(health01, 4)),
                "delta_score_01": float(round(delta01, 4)),
                "trend_band": trend_band,
                "volume_01": float(round(volume01, 4)),
                "quality_01": float(round(quality01, 4)),
                "metrics_endpoint": p.get("metrics_endpoint"),
                "rank_formula_version": "v1",
            }
        )

    rows.sort(key=lambda r: (r.get("rank_score_01", 0.0), r.get("health_01", 0.0), r.get("label", "")), reverse=True)

    for i, r in enumerate(rows, start=1):
        r["rank"] = i

    return {
        "ok": True,
        "days": int(days),
        "baseline_weeks": int(baseline_weeks),
        "count": len(rows),
        "rankings": rows,
        "notes": "Deterministic cross-program comparator (no self-HTTP). Programs come from /loo/programs; metrics computed in-process.",
    }
