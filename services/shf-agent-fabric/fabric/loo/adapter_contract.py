from __future__ import annotations

from typing import Any, Dict, List
import inspect

# IMPORTANT:
# - This file is a pure contract validator.
# - It should NOT contain any shell commands, "code ..." lines, or terminal snippets.
# - It is imported by main.py at boot, so any syntax error kills the server.

REQUIRED_KEYS = [
    "metrics_contract_version",
    "window_days",
    "enrolled_agents",
    "active_agents",
    "active_rate",
    "signals_total",
    "signals_per_day",
    "rounds_finalized_total",
    "rounds_per_day",
    "median_minutes_between_rounds",
    "winner_strategy_counts",
    "winner_strategy_diversity_01",
    "program_health",
    "interpretation",
]

ALLOWED_HEALTH = {"GREEN", "YELLOW", "RED"}


def _is_number(x: Any) -> bool:
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def validate_metrics_shape(program_id: str, m: Dict[str, Any]) -> List[str]:
    errs: List[str] = []

    if not isinstance(m, dict):
        return [f"{program_id}: metrics must be a dict"]

    for k in REQUIRED_KEYS:
        if k not in m:
            errs.append(f"{program_id}: missing key '{k}'")

    if errs:
        return errs

    # Types
    if not isinstance(m["metrics_contract_version"], str):
        errs.append(f"{program_id}: metrics_contract_version must be str")
    if not isinstance(m["window_days"], int):
        errs.append(f"{program_id}: window_days must be int")
    if not isinstance(m["enrolled_agents"], int):
        errs.append(f"{program_id}: enrolled_agents must be int")
    if not isinstance(m["active_agents"], int):
        errs.append(f"{program_id}: active_agents must be int")
    if not _is_number(m["active_rate"]):
        errs.append(f"{program_id}: active_rate must be number")
    if not isinstance(m["signals_total"], int):
        errs.append(f"{program_id}: signals_total must be int")
    if not _is_number(m["signals_per_day"]):
        errs.append(f"{program_id}: signals_per_day must be number")
    if not isinstance(m["rounds_finalized_total"], int):
        errs.append(f"{program_id}: rounds_finalized_total must be int")
    if not _is_number(m["rounds_per_day"]):
        errs.append(f"{program_id}: rounds_per_day must be number")
    if not _is_number(m["median_minutes_between_rounds"]):
        errs.append(f"{program_id}: median_minutes_between_rounds must be number")
    if not isinstance(m["winner_strategy_counts"], dict):
        errs.append(f"{program_id}: winner_strategy_counts must be dict")
    if not _is_number(m["winner_strategy_diversity_01"]):
        errs.append(f"{program_id}: winner_strategy_diversity_01 must be number")
    if not isinstance(m["program_health"], str):
        errs.append(f"{program_id}: program_health must be str")
    if not isinstance(m["interpretation"], dict):
        errs.append(f"{program_id}: interpretation must be dict")

    if errs:
        return errs

    # Ranges / sanity
    if m["window_days"] < 1:
        errs.append(f"{program_id}: window_days must be >= 1")
    if m["enrolled_agents"] < 0:
        errs.append(f"{program_id}: enrolled_agents must be >= 0")
    if m["active_agents"] < 0:
        errs.append(f"{program_id}: active_agents must be >= 0")
    if m["active_agents"] > m["enrolled_agents"]:
        errs.append(f"{program_id}: active_agents cannot exceed enrolled_agents")

    ar = float(m["active_rate"])
    if ar < 0.0 or ar > 1.0:
        errs.append(f"{program_id}: active_rate must be in [0,1]")

    if m["signals_total"] < 0:
        errs.append(f"{program_id}: signals_total must be >= 0")
    if float(m["signals_per_day"]) < 0.0:
        errs.append(f"{program_id}: signals_per_day must be >= 0")

    if m["rounds_finalized_total"] < 0:
        errs.append(f"{program_id}: rounds_finalized_total must be >= 0")
    if float(m["rounds_per_day"]) < 0.0:
        errs.append(f"{program_id}: rounds_per_day must be >= 0")

    if float(m["median_minutes_between_rounds"]) < 0.0:
        errs.append(f"{program_id}: median_minutes_between_rounds must be >= 0")

    div = float(m["winner_strategy_diversity_01"])
    if div < 0.0 or div > 1.0:
        errs.append(f"{program_id}: winner_strategy_diversity_01 must be in [0,1]")

    if m["program_health"].upper() not in ALLOWED_HEALTH:
        errs.append(f"{program_id}: program_health must be one of {sorted(ALLOWED_HEALTH)}")

    return errs


def validate_program_adapters(
    program_adapters: Dict[str, Any],
    *,
    days: int = 30,
    baseline_weeks: int = 8,
) -> None:
    """
    Raises RuntimeError if any adapter violates the contract.
    Called at FastAPI startup to prevent broken deployments.
    """
    all_errs: List[str] = []

    if not isinstance(program_adapters, dict) or not program_adapters:
        raise RuntimeError("PROGRAM_ADAPTERS is empty or not a dict")

    for program_id, adapter in program_adapters.items():
        if not callable(adapter):
            all_errs.append(f"{program_id}: adapter is not callable")
            continue

        # Signature guard: require 'days' kwarg; baseline_weeks preferred.
        try:
            sig = inspect.signature(adapter)
            params = sig.parameters
            if "days" not in params:
                all_errs.append(f"{program_id}: adapter must accept kwarg 'days'")
                continue
            # baseline_weeks may be wrapped; do not hard fail here.
        except Exception:
            pass

        try:
            metrics = adapter(days=int(days), baseline_weeks=int(baseline_weeks))
            errs = validate_metrics_shape(str(program_id), metrics)
            all_errs.extend(errs)
        except TypeError:
            # Backward compatibility for legacy adapter (should be wrapped, but belt+suspenders)
            try:
                metrics = adapter(days=int(days))
                errs = validate_metrics_shape(str(program_id), metrics)
                all_errs.extend(errs)
            except Exception as ex:
                all_errs.append(f"{program_id}: adapter raised exception: {type(ex).__name__}: {ex}")
        except Exception as ex:
            all_errs.append(f"{program_id}: adapter raised exception: {type(ex).__name__}: {ex}")

    if all_errs:
        msg = "Startup adapter contract validation failed:\n  - " + "\n  - ".join(all_errs)
        raise RuntimeError(msg)
