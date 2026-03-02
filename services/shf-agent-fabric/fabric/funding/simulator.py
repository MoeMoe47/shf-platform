from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple


Number = float


@dataclass
class SimTotals:
    gross_payment: Number
    final_payment: Number
    cap_applied: bool
    cohort_cap: Optional[Number] = None
    participant_cap: Optional[Number] = None


def _get(d: Dict[str, Any], path: str, default: Any = None) -> Any:
    cur: Any = d
    for part in path.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return default
        cur = cur[part]
    return cur


def _apply_cap(value: Number, cap: Optional[Number]) -> Tuple[Number, bool]:
    if cap is None:
        return value, False
    if value > cap:
        return cap, True
    return value, False


def _band_multiplier(bands: List[Dict[str, Any]], x: float, *, mode: str) -> float:
    """
    mode:
      - 'range': bands have min/max
      - 'percentile': bands have percentile_max
    """
    if not bands:
        return 1.0
    if mode == "range":
        for b in bands:
            if x >= float(b["min"]) and x < float(b["max"]):
                return float(b["multiplier"])
        # if x == 1.0 edge
        last = bands[-1]
        if x >= float(last.get("min", 0.0)):
            return float(last.get("multiplier", 1.0))
        return 1.0
    if mode == "percentile":
        for b in bands:
            if x <= float(b["percentile_max"]):
                return float(b["multiplier"])
        return float(bands[-1].get("multiplier", 1.0))
    return 1.0


def simulate_ruleset(
    *,
    ruleset: Dict[str, Any],
    metrics: Dict[str, float],
    costs: Optional[Dict[str, float]] = None,
    benchmarks: Optional[Dict[str, float]] = None,
    watchtower: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Outcome Funding Simulator v1

    Inputs:
      ruleset: AIM_RULESET_V1 json
      metrics: computed OMS metrics (counts/rates)
      costs: computed costs (optional)
      benchmarks: computed benchmark percentiles (optional)
      watchtower: signals (optional)

    Returns:
      simulation result payload (AIM_SIM_RESULT_V1-like)
    """
    costs = costs or {}
    benchmarks = benchmarks or {}
    watchtower = watchtower or {}

    # 1) Freeze logic (minimal v1)
    freeze = False
    freeze_reason: Optional[str] = None
    sev = _get(ruleset, "stability_controls.freeze_on_watchtower_severity", "high")
    signals = _get(ruleset, "watchtower_integration.signals", []) or []
    incoming_signals = watchtower.get("signals", []) or []
    incoming_map = {(s.get("signal"), s.get("severity")) for s in incoming_signals}
    if sev and incoming_signals:
        # if any incoming signal matches a ruleset signal and is high -> freeze
        for s in signals:
            if s.get("action") == "freeze_ruleset":
                for sev_level in (s.get("severity") or []):
                    if (s.get("signal"), sev_level) in incoming_map and sev_level == sev:
                        freeze = True
                        freeze_reason = f"watchtower:{s.get('signal')}:{sev_level}"
                        break

    payout_breakdown: List[Dict[str, Any]] = []

    # 2) Calculate payouts
    payout_rules = ruleset.get("payout_rules", []) or []
    for rule in payout_rules:
        rule_id = rule.get("rule_id")
        pay_type = rule.get("pay_type")
        amt = float(rule.get("amount_per_unit", 0.0))
        caps = rule.get("caps") or {}
        max_per_cohort = caps.get("max_per_cohort")

        trigger = rule.get("trigger") or {}
        trig_type = trigger.get("type")

        # Units determination
        units = 0.0
        if trig_type == "per_participant_enrolled":
            units = float(metrics.get(rule.get("metric_key", "participants_enrolled"), 0.0))
        elif trig_type == "per_participant_completed":
            # optional eligibility min_attendance_rate
            min_att = _get(rule, "eligibility.min_attendance_rate")
            if min_att is None or float(metrics.get("attendance_rate", 1.0)) >= float(min_att):
                units = float(metrics.get(rule.get("metric_key", "participants_completed"), 0.0))
        elif trig_type in ("per_outcome", "per_verified_outcome"):
            # For v1, treat outcomes as counts in metrics dict:
            # - job_placement_count, certification_earned_count, etc.
            outcome_type = rule.get("outcome_event_type")
            if outcome_type == "job_placement":
                units = float(metrics.get("job_placement_count", 0.0))
            elif outcome_type == "certification_earned":
                units = float(metrics.get("certification_earned_count", 0.0))
            else:
                units = 0.0

            if trig_type == "per_verified_outcome":
                # reduce by verified rate if supplied
                vr = float(metrics.get("verified_placement_rate", 1.0))
                units = units * vr

        elif trig_type == "per_followup_success":
            months = int(rule.get("followup_months", 0))
            if months == 3:
                units = float(metrics.get("retained_3m_count", 0.0))
                if units == 0.0:
                    # fallback: estimate from placement_count * retention_3m_rate
                    units = float(metrics.get("job_placement_count", 0.0)) * float(metrics.get("retention_3m_rate", 0.0))
            elif months == 6:
                units = float(metrics.get("retained_6m_count", 0.0))
                if units == 0.0:
                    units = float(metrics.get("job_placement_count", 0.0)) * float(metrics.get("retention_6m_rate", 0.0))

        gross = units * amt
        net, cap_applied = _apply_cap(gross, float(max_per_cohort) if max_per_cohort is not None else None)

        payout_breakdown.append(
            {
                "rule_id": rule_id,
                "pay_type": pay_type,
                "units": round(units, 4),
                "rate": amt,
                "gross": round(gross, 2),
                "cap_applied": cap_applied,
                "net": round(net, 2),
            }
        )

    gross_payment = sum(x["net"] for x in payout_breakdown)

    # 3) Multipliers
    mult_total = 1.0

    # Risk adjustment (POI bands) - expects `participant_opportunity_index` in metrics (0..1)
    risk_adj = ruleset.get("multipliers", {}).get("risk_adjustment", {})
    if risk_adj.get("enabled"):
        poi = float(metrics.get(risk_adj.get("index_key", "participant_opportunity_index"), 0.5))
        mult_total *= _band_multiplier(risk_adj.get("bands", []) or [], poi, mode="range")

    # Benchmark performance (percentile) - expects percentile in benchmarks dict (0..1)
    bench = ruleset.get("multipliers", {}).get("benchmark_performance", {})
    if bench.get("enabled"):
        # convention: benchmarks store "<metric_key>_percentile"
        mk = bench.get("metric_key", "cost_per_job_placement")
        pct = float(benchmarks.get(f"{mk}_percentile", 0.5))
        mult_total *= _band_multiplier(bench.get("bands", []) or [], pct, mode="percentile")

    # Anti-gaming penalty (minimal v1)
    guard = ruleset.get("anti_gaming_guardrails", {}).get("require_outcome_diversity", {})
    guard_penalty = 1.0
    if guard.get("enabled"):
        distinct = 0
        if float(metrics.get("job_placement_count", 0.0)) > 0:
            distinct += 1
        if float(metrics.get("certification_earned_count", 0.0)) > 0:
            distinct += 1
        if distinct < int(guard.get("min_distinct_outcome_types", 2)):
            guard_penalty = float(guard.get("penalty_multiplier_if_failed", 0.85))
    mult_total *= guard_penalty

    multiplied = gross_payment * mult_total

    # 4) Apply caps (cohort + participant)
    cohort_cap = _get(ruleset, "budget_controls.max_payout_per_cohort")
    max_per_participant = _get(ruleset, "budget_controls.max_payout_per_participant")
    enrolled = float(metrics.get("participants_enrolled", 0.0))
    participant_cap = None
    if max_per_participant is not None and enrolled > 0:
        participant_cap = float(max_per_participant) * enrolled

    final1, cohort_cap_applied = _apply_cap(multiplied, float(cohort_cap) if cohort_cap is not None else None)
    final2, participant_cap_applied = _apply_cap(final1, participant_cap)

    cap_applied = cohort_cap_applied or participant_cap_applied

    # 5) If frozen, mark it and block recommended updates (sim still computes payment)
    res = {
        "schema_version": "AIM_SIM_RESULT_V1",
        "ruleset_id": ruleset.get("ruleset_id"),
        "ruleset_version": ruleset.get("ruleset_version"),
        "freeze": {
            "triggered": freeze,
            "reason": freeze_reason,
        },
        "payout_breakdown": payout_breakdown,
        "multipliers_applied": {
            "total_multiplier": round(mult_total, 4),
            "guardrail_penalty_multiplier": round(guard_penalty, 4),
        },
        "totals": {
            "gross_payment": round(gross_payment, 2),
            "final_payment": round(final2, 2),
            "cap_applied": cap_applied,
            "cohort_cap": float(cohort_cap) if cohort_cap is not None else None,
            "participant_cap": round(participant_cap, 2) if participant_cap is not None else None,
        },
    }
    return res
