from __future__ import annotations

from typing import Any, Dict, List, TypedDict


class WatchtowerRow(TypedDict, total=False):
    # Identity
    program_id: str
    app_id: str
    label: str

    # Windowing / versioning
    window_days: int
    baseline_weeks: int
    metrics_contract_version: str

    # Adapter diagnostics
    adapter_ok: bool
    adapter_error: str

    # Normalized scores (0..1)
    health_01: float
    delta_score_01: float
    trend_band: str
    volume_01: float
    quality_01: float
    rank_score_01: float
    rank_formula_version: str

    # Optional: raw / evidence
    evidence: Dict[str, Any]


class WatchtowerSummary(TypedDict, total=False):
    ok: bool
    days: int
    baseline_weeks: int
    count: int

    coverage_total: int
    coverage_with_adapter: int
    coverage_adapter_ok: int
    contract_ok: int
    contract_fail: int

    adapter_ok_rate: float
    contract_ok_rate: float

    alerts_count: int
    alerts: List[Dict[str, Any]]
    top: List[WatchtowerRow]
