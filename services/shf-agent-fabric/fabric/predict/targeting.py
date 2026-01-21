from __future__ import annotations

from typing import Any, Dict, Optional


def _num(x: Any) -> Optional[float]:
    try:
        if x is None:
            return None
        return float(x)
    except Exception:
        return None


def build_target_checks(loe_derived: Dict[str, Any], targets: Dict[str, Any]) -> Dict[str, Any]:
    """
    Produces target checks only for signals we can measure from LOE today.
    Everything else is returned under `unmet_telemetry` (not evaluated).

    Supported (optional) targets:
      - manualOverrideRateMax            (e.g. 0.10)
      - p95DurationMsMax                 (e.g. 60000)
      - firstRewardEventIndexMax         (e.g. 5)

    LOE signals:
      - manual_override_rate
      - p95_duration_ms
      - first_reward_event_index
    """
    checks = []
    unmet_telemetry = []

    manual_rate = _num(loe_derived.get("manual_override_rate"))
    p95_ms = _num(loe_derived.get("p95_duration_ms"))
    first_reward_idx = loe_derived.get("first_reward_event_index")  # may be None or int

    # --- manual override rate ---
    t_manual_max = _num(targets.get("manualOverrideRateMax"))
    if t_manual_max is not None:
        ok = (manual_rate is not None) and (manual_rate <= t_manual_max)
        checks.append({
            "metric": "manual_override_rate",
            "actual": manual_rate,
            "target_max": t_manual_max,
            "pass": bool(ok),
            "rule": "lower_is_better",
        })

    # --- p95 duration ---
    t_p95_max = _num(targets.get("p95DurationMsMax"))
    if t_p95_max is not None:
        ok = (p95_ms is not None) and (p95_ms <= t_p95_max)
        checks.append({
            "metric": "p95_duration_ms",
            "actual": p95_ms,
            "target_max": t_p95_max,
            "pass": bool(ok),
            "rule": "lower_is_better",
        })

    # --- time to first reward (index) ---
    t_first_reward_max = _num(targets.get("firstRewardEventIndexMax"))
    if t_first_reward_max is not None:
        # If no reward observed, fail (because target is "make rewards early")
        ok = (first_reward_idx is not None) and (float(first_reward_idx) <= t_first_reward_max)
        checks.append({
            "metric": "first_reward_event_index",
            "actual": first_reward_idx,
            "target_max": t_first_reward_max,
            "pass": bool(ok),
            "rule": "lower_is_better",
        })

    # Anything else in targets isn't measurable from LOE yet
    supported = {"manualOverrideRateMax", "p95DurationMsMax", "firstRewardEventIndexMax"}
    for k, v in (targets or {}).items():
        if k in supported:
            continue
        unmet_telemetry.append({
            "target_key": k,
            "target_value": v,
            "status": "NOT_EVALUATED",
            "reason": "Target not measurable from current event telemetry (LOE-only)."
        })

    # Overall status
    if not checks:
        status = "NO_EFFICIENCY_TARGETS_SET"
    else:
        passes = sum(1 for c in checks if c.get("pass") is True)
        status = "ON_TRACK" if passes == len(checks) else ("AT_RISK" if passes >= 1 else "OFF_TRACK")

    return {
        "status": status,
        "checks": checks,
        "unmet_telemetry": unmet_telemetry,
        "supported_targets": sorted(list(supported)),
    }
