from __future__ import annotations

from typing import Any, Dict, Protocol, runtime_checkable, Callable, TypedDict

# ------------------------------------------------------------
# Adapter Registry (single source of truth)
#
# - PROGRAM_ADAPTERS must never be empty in production.
# - All adapters must support the same strict signature:
#     adapter(*, days: int, baseline_weeks: int) -> Metrics
# - Legacy builders that don't accept baseline_weeks are wrapped.
# ------------------------------------------------------------

class Metrics(TypedDict, total=False):
    # Required by adapter_contract.validate_metrics_shape()
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
    # Optional extras
    weekly_series: list
    baseline_compare: Dict[str, Any]
    baseline_weeks: int


@runtime_checkable
class ProgramMetricsAdapter(Protocol):
    def __call__(self, *, days: int, baseline_weeks: int) -> Dict[str, Any]: ...


# Backwards-compat alias (older code imports ProgramAdapter)
ProgramAdapter = ProgramMetricsAdapter


def wrap_legacy_adapter(fn: Callable[..., Dict[str, Any]]) -> ProgramMetricsAdapter:
    """
    Wrap legacy builders that may only accept days=...
    so routers/guards never need try/except again.
    """
    def _wrapped(*, days: int, baseline_weeks: int) -> Dict[str, Any]:
        try:
            return fn(days=int(days), baseline_weeks=int(baseline_weeks))  # type: ignore[misc]
        except TypeError:
            return fn(days=int(days))  # type: ignore[misc]
    return _wrapped  # type: ignore[return-value]


# --- Register program adapters here (single source of truth) ---
from fabric.arena.rollup import build_arena_metrics  # noqa: E402

PROGRAM_ADAPTERS: Dict[str, ProgramMetricsAdapter] = {
    "arena_observation_deck": wrap_legacy_adapter(build_arena_metrics),
}


# ------------------------------------------------------------
# Adapter metadata (used by routers/loo_adapters_routes.py)
# ------------------------------------------------------------
PROGRAM_ADAPTER_META: Dict[str, Dict[str, Any]] = {
    "arena_observation_deck": {
        "label": "Observation Deck (Agent Arena)",
        "owner": "arena",
        "metrics_contract_version": "v1",
        "adapter_version": "v1",
        "supports_baseline_weeks": True,
        "notes": "Deterministic spectator-safe metrics builder.",
    }
}
