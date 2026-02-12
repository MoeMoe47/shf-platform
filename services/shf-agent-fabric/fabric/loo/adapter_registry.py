from __future__ import annotations

from typing import Any, Dict, Protocol, TypedDict, runtime_checkable, Callable

class Metrics(TypedDict, total=False):
    metrics_contract_version: str
    window_days: int
    enrolled_agents: int
    active_agents: int
    active_rate: float
    signals_total: int
    signals_per_day: float
    rounds_finalized_total: int
    rounds_per_day: float
    median_minutes_between_rounds: float
    winner_strategy_counts: Dict[str, int]
    winner_strategy_diversity_01: float
    program_health: str
    interpretation: Dict[str, Any]
    weekly_series: list
    baseline_compare: Dict[str, Any]
    baseline_weeks: int

@runtime_checkable
class ProgramMetricsAdapter(Protocol):
    def __call__(self, *, days: int, baseline_weeks: int) -> Dict[str, Any]: ...

def wrap_legacy_adapter(fn: Callable[..., Dict[str, Any]]) -> ProgramMetricsAdapter:
    def _wrapped(*, days: int, baseline_weeks: int) -> Dict[str, Any]:
        try:
            return fn(days=int(days), baseline_weeks=int(baseline_weeks))  # type: ignore
        except TypeError:
            return fn(days=int(days))  # type: ignore
    return _wrapped  # type: ignore

# --- Real builders ---
from fabric.arena.rollup import build_arena_metrics  # noqa: E402

def build_watchtower_demo_metrics(*, days: int, baseline_weeks: int) -> Dict[str, Any]:
    """
    Parity-safe stub adapter for the demo program.
    Replace with a real builder later.
    """
    d = int(days)
    bw = int(baseline_weeks)
    return {
        "metrics_contract_version": "v1",
        "window_days": d,
        "baseline_weeks": bw,
        "enrolled_agents": 0,
        "active_agents": 0,
        "active_rate": 0.0,
        "signals_total": 0,
        "signals_per_day": 0.0,
        "rounds_finalized_total": 0,
        "rounds_per_day": 0.0,
        "median_minutes_between_rounds": 0.0,
        "winner_strategy_counts": {},
        "winner_strategy_diversity_01": 0.0,
        "program_health": "RED",
        "interpretation": {
            "headline": "Stub program: adapter not implemented yet.",
            "action": "Replace build_watchtower_demo_metrics with a real metrics builder."
        },
        "weekly_series": [],
        "baseline_compare": {"delta_score_01": 0.0, "trend_band": "DOWN"},
    }

PROGRAM_ADAPTERS: Dict[str, ProgramMetricsAdapter] = {
    "arena_observation_deck": wrap_legacy_adapter(build_arena_metrics),
    "watchtower_demo_program": build_watchtower_demo_metrics,
}

ProgramAdapter = ProgramMetricsAdapter

PROGRAM_ADAPTER_META: Dict[str, Dict[str, Any]] = {
    "arena_observation_deck": {
        "label": "Observation Deck (Agent Arena)",
        "owner": "arena",
        "metrics_contract_version": "v1",
        "adapter_version": "v1",
        "supports_baseline_weeks": True,
        "notes": "Deterministic spectator-safe metrics builder.",
        "app_id": "agent_arena",
    },
    "watchtower_demo_program": {
        "label": "Watchtower Demo Program",
        "owner": "watchtower",
        "metrics_contract_version": "v1",
        "adapter_version": "v1",
        "supports_baseline_weeks": True,
        "notes": "Stub adapter (RED). Replace with real program metrics builder.",
        "app_id": "watchtower",
    },
}
