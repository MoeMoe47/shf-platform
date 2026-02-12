from __future__ import annotations

from typing import Any, Dict, List
import math


def _clamp01(x: float) -> float:
    if x < 0.0:
        return 0.0
    if x > 1.0:
        return 1.0
    return float(x)


def build_watchtower_demo_metrics(*, days: int, baseline_weeks: int = 8) -> Dict[str, Any]:
    """
    Real (deterministic) demo adapter for cross-program Day 1:
    - Produces contract-valid metrics.
    - Uses simple math so it behaves consistently across runs.
    - Includes a weekly_series and baseline_compare so rankings/health work.
    """
    days = int(days)
    baseline_weeks = int(baseline_weeks)

    # Deterministic "activity" curve based on window size (no randomness)
    enrolled = 25
    active = max(0, min(enrolled, int(round(enrolled * (0.55 + (0.05 * math.log1p(days)))))))
    active_rate = _clamp01(active / enrolled if enrolled else 0.0)

    signals_total = int(round(8.5 * days))
    signals_per_day = signals_total / float(days) if days > 0 else 0.0

    rounds_total = int(round(0.9 * days))
    rounds_per_day = rounds_total / float(days) if days > 0 else 0.0

    median_gap = 35.0  # minutes between rounds

    winner_counts = {"steady": int(round(rounds_total * 0.6)), "spiky": int(round(rounds_total * 0.4))}
    diversity_01 = _clamp01(0.72)

    # Health label + interpretation
    program_health = "GREEN" if active_rate >= 0.6 else ("YELLOW" if active_rate >= 0.35 else "RED")

    # Weekly series (simple)
    weekly: List[Dict[str, Any]] = []
    weeks = max(1, min(12, days // 7))
    for w in range(weeks):
        # deterministic wiggle
        h = _clamp01(active_rate - 0.05 + (0.02 * (w % 3)))
        weekly.append({"week_index": w + 1, "health_01": h})

    # Baseline compare (demo)
    # If baseline_weeks increases, we slightly reduce delta (harder to outperform)
    delta = _clamp01(0.85 - 0.02 * max(0, baseline_weeks - 8))
    trend = "UP" if delta >= 0.55 else ("FLAT" if delta >= 0.35 else "DOWN")

    return {
        "metrics_contract_version": "v1",
        "window_days": days,
        "baseline_weeks": baseline_weeks,

        "enrolled_agents": enrolled,
        "active_agents": active,
        "active_rate": float(active_rate),

        "signals_total": int(signals_total),
        "signals_per_day": float(signals_per_day),

        "rounds_finalized_total": int(rounds_total),
        "rounds_per_day": float(rounds_per_day),

        "median_minutes_between_rounds": float(median_gap),
        "winner_strategy_counts": dict(winner_counts),
        "winner_strategy_diversity_01": float(diversity_01),

        "program_health": str(program_health),
        "interpretation": {
            "summary": "Watchtower demo metrics: deterministic cross-program adapter (Day 1).",
            "notes": [
                "Replace this builder with real Watchtower telemetry when ready.",
                "Contract stays stable; only internals evolve.",
            ],
        },

        "weekly_series": weekly,
        "baseline_compare": {"delta_score_01": float(delta), "trend_band": trend},
    }
