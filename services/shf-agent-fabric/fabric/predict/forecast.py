from __future__ import annotations

from typing import Any, Dict, Optional

from fabric.loe.signals import compute_loe_signals
from fabric.runs_registry.store import get_run
from fabric.predict.targeting import build_target_checks


def build_forecast(
    limit: int = 5000,
    app_id: Optional[str] = None,
    run_id: Optional[str] = None,
    since: Optional[str] = None,
    loo_score: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Canonical, advisory prediction layer with filtering + run-target awareness.

    If run_id is provided:
      - auto-loads run metadata and targets from Run Registry (SQLite)
      - computes target checks for measurable efficiency targets
      - returns unmet telemetry targets as NOT_EVALUATED (honest)
    """
    # If run_id is provided, prefer app_id from registry (source of truth)
    run_meta = None
    run_targets = None
    if run_id:
        r = get_run(run_id)
        if r.get("ok"):
            run_meta = r.get("run")
            if isinstance(run_meta, dict):
                # Use registry app_id as authority unless user explicitly passed different
                reg_app = run_meta.get("app_id")
                if isinstance(reg_app, str) and reg_app and not app_id:
                    app_id = reg_app
                t = run_meta.get("targets")
                run_targets = t if isinstance(t, dict) else {}
        else:
            # Run not found: still allow forecast, but label it
            run_meta = {"run_id": run_id, "error": r.get("error", "RUN_NOT_FOUND")}

    loe = compute_loe_signals(limit=limit, app_id=app_id, run_id=run_id, since=since)
    derived = loe.get("derived", {}) if isinstance(loe, dict) else {}

    manual_rate = float(derived.get("manual_override_rate") or 0.0)
    p95_ms = float(derived.get("p95_duration_ms") or 0.0)
    first_reward_idx = derived.get("first_reward_event_index")
    legacy_ignored = int(derived.get("legacy_events_ignored") or 0)
    canonical_used = int(derived.get("canonical_events_used") or 0)

    loo_decision = None
    loo_score_val = None
    if isinstance(loo_score, dict):
        loo_decision = loo_score.get("decision")
        loo_score_val = loo_score.get("score")

    forecasts = []
    suggestions = []
    why = []

    if legacy_ignored > 0:
        why.append(f"{legacy_ignored} legacy events were ignored to preserve data integrity.")

    # Target checks (efficiency)
    target_checks = None
    if isinstance(run_targets, dict):
        target_checks = build_target_checks(
            {
                "manual_override_rate": manual_rate,
                "p95_duration_ms": p95_ms,
                "first_reward_event_index": first_reward_idx,
            },
            run_targets,
        )

    # Not enough data in filtered view
    if (app_id or run_id or since) and canonical_used == 0:
        forecasts.append({
            "code": "NO_DATA",
            "probability": 0.55,
            "message": "Not enough canonical data matched the filters to produce strong signals yet."
        })
        why.append("No canonical (schema_version=1) events matched the requested filters.")
        return {
            "ok": True,
            "forecasts": forecasts,
            "suggestions": suggestions,
            "filters": {"app_id": app_id, "run_id": run_id, "since": since},
            "run": run_meta,
            "targets": run_targets,
            "target_checks": target_checks,
            "explain": {
                "observed": {
                    "loe_health": loe.get("health"),
                    "canonical_events_used": canonical_used,
                    "legacy_events_ignored": legacy_ignored,
                },
                "assumptions": [
                    "Only canonical (schema_version=1) events are used.",
                    "Predictions are advisory and probabilistic.",
                    "No commands or enforcement are issued."
                ],
                "why": why,
            },
            "guardrails": {
                "advisory_only": True,
                "no_commands": True,
                "probabilistic_language": True,
            },
        }

    # --- core forecasts ---
    if first_reward_idx is None:
        forecasts.append({
            "code": "REWARD_DELAY",
            "probability": 0.65,
            "message": "Engagement may decline because rewards appear late or not at all."
        })
        suggestions.append({
            "code": "MOVE_REWARD_EARLIER",
            "message": "Consider shortening time-to-first-reward."
        })
        why.append("No canonical reward events detected in the sampled window.")

    if manual_rate > 0.20:
        forecasts.append({
            "code": "SCALE_RISK",
            "probability": 0.70,
            "message": "Scaling may be constrained due to elevated manual intervention."
        })
        suggestions.append({
            "code": "REDUCE_MANUAL",
            "message": "Streamline or automate high-touch steps."
        })
        why.append(f"Manual override rate is ~{manual_rate:.0%}.")

    if p95_ms > 60000:
        forecasts.append({
            "code": "PROCESS_DRAG",
            "probability": 0.60,
            "message": "Slow paths may reduce retention."
        })
        suggestions.append({
            "code": "REMOVE_BOTTLENECKS",
            "message": "Focus on the highest-frequency friction steps."
        })
        why.append(f"p95 duration is ~{int(p95_ms)}ms.")

    if loo_decision in ("RED", "YELLOW"):
        forecasts.append({
            "code": "OUTCOME_RISK",
            "probability": 0.65,
            "message": f"Outcomes may remain unstable while LOO is {loo_decision}."
        })
        why.append(f"LOO decision is {loo_decision}.")
        if loo_decision == "RED":
            suggestions.append({
                "code": "FOCUS_ONE_FIX",
                "message": "Address the single largest friction point first."
            })

    # --- target-aware nudges (only if efficiency targets exist) ---
    if isinstance(target_checks, dict) and target_checks.get("checks"):
        status = target_checks.get("status")
        if status in ("AT_RISK", "OFF_TRACK"):
            forecasts.append({
                "code": "TARGET_DRIFT",
                "probability": 0.65,
                "message": f"Efficiency targets appear {status.replace('_',' ').lower()} based on current telemetry."
            })
            suggestions.append({
                "code": "TIGHTEN_EFFICIENCY",
                "message": "Focus on reducing manual overrides and bottleneck durations to meet your targets."
            })
            why.append("Run registry efficiency targets were evaluated against LOE signals.")

    if not forecasts:
        forecasts.append({
            "code": "STABLE",
            "probability": 0.55,
            "message": "No major efficiency risks detected; stability may continue."
        })
        why.append("Canonical signals are within current thresholds.")

    return {
        "ok": True,
        "forecasts": forecasts,
        "suggestions": suggestions,
        "filters": {"app_id": app_id, "run_id": run_id, "since": since},
        "run": run_meta,
        "targets": run_targets,
        "target_checks": target_checks,
        "explain": {
            "observed": {
                "loe_health": loe.get("health"),
                "manual_override_rate": manual_rate,
                "p95_duration_ms": p95_ms,
                "first_reward_event_index": first_reward_idx,
                "loo_decision": loo_decision,
                "loo_score": loo_score_val,
                "legacy_events_ignored": legacy_ignored,
                "canonical_events_used": canonical_used,
            },
            "assumptions": [
                "Only canonical (schema_version=1) events are used.",
                "Predictions are advisory and probabilistic.",
                "Only efficiency targets with matching telemetry are evaluated."
            ],
            "why": why,
        },
        "guardrails": {
            "advisory_only": True,
            "no_commands": True,
            "probabilistic_language": True,
        },
    }
