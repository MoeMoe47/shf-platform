from __future__ import annotations

import unittest
from typing import Any, Dict

from fabric.loo.adapter_registry import PROGRAM_ADAPTERS


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


def _assert_metrics_shape(testcase: unittest.TestCase, program_id: str, m: Dict[str, Any]) -> None:
    testcase.assertIsInstance(m, dict, f"{program_id}: metrics must be a dict")

    # Required keys exist
    missing = [k for k in REQUIRED_KEYS if k not in m]
    testcase.assertFalse(missing, f"{program_id}: missing keys: {missing}")

    # Types
    testcase.assertIsInstance(m["window_days"], int, f"{program_id}: window_days must be int")
    testcase.assertIsInstance(m["enrolled_agents"], int, f"{program_id}: enrolled_agents must be int")
    testcase.assertIsInstance(m["active_agents"], int, f"{program_id}: active_agents must be int")
    testcase.assertTrue(_is_number(m["active_rate"]), f"{program_id}: active_rate must be number")
    testcase.assertIsInstance(m["signals_total"], int, f"{program_id}: signals_total must be int")
    testcase.assertTrue(_is_number(m["signals_per_day"]), f"{program_id}: signals_per_day must be number")
    testcase.assertIsInstance(m["rounds_finalized_total"], int, f"{program_id}: rounds_finalized_total must be int")
    testcase.assertTrue(_is_number(m["rounds_per_day"]), f"{program_id}: rounds_per_day must be number")
    testcase.assertTrue(_is_number(m["median_minutes_between_rounds"]), f"{program_id}: median_minutes_between_rounds must be number")
    testcase.assertIsInstance(m["winner_strategy_counts"], dict, f"{program_id}: winner_strategy_counts must be dict")
    testcase.assertTrue(_is_number(m["winner_strategy_diversity_01"]), f"{program_id}: winner_strategy_diversity_01 must be number")
    testcase.assertIsInstance(m["program_health"], str, f"{program_id}: program_health must be str")
    testcase.assertIsInstance(m["interpretation"], dict, f"{program_id}: interpretation must be dict")

    # Ranges / sanity
    testcase.assertGreaterEqual(m["window_days"], 1, f"{program_id}: window_days must be >= 1")
    testcase.assertGreaterEqual(m["enrolled_agents"], 0, f"{program_id}: enrolled_agents must be >= 0")
    testcase.assertGreaterEqual(m["active_agents"], 0, f"{program_id}: active_agents must be >= 0")
    testcase.assertLessEqual(m["active_agents"], m["enrolled_agents"], f"{program_id}: active_agents cannot exceed enrolled_agents")

    testcase.assertGreaterEqual(float(m["active_rate"]), 0.0, f"{program_id}: active_rate must be >= 0")
    testcase.assertLessEqual(float(m["active_rate"]), 1.0, f"{program_id}: active_rate must be <= 1")

    testcase.assertGreaterEqual(m["signals_total"], 0, f"{program_id}: signals_total must be >= 0")
    testcase.assertGreaterEqual(float(m["signals_per_day"]), 0.0, f"{program_id}: signals_per_day must be >= 0")

    testcase.assertGreaterEqual(m["rounds_finalized_total"], 0, f"{program_id}: rounds_finalized_total must be >= 0")
    testcase.assertGreaterEqual(float(m["rounds_per_day"]), 0.0, f"{program_id}: rounds_per_day must be >= 0")

    testcase.assertGreaterEqual(float(m["median_minutes_between_rounds"]), 0.0, f"{program_id}: median_minutes_between_rounds must be >= 0")

    testcase.assertGreaterEqual(float(m["winner_strategy_diversity_01"]), 0.0, f"{program_id}: winner_strategy_diversity_01 must be >= 0")
    testcase.assertLessEqual(float(m["winner_strategy_diversity_01"]), 1.0, f"{program_id}: winner_strategy_diversity_01 must be <= 1")

    testcase.assertIn(m["program_health"].upper(), ALLOWED_HEALTH, f"{program_id}: program_health must be GREEN/YELLOW/RED")

    # Optional: weekly_series shape (if present)
    if "weekly_series" in m and isinstance(m["weekly_series"], list) and m["weekly_series"]:
        last = m["weekly_series"][-1]
        testcase.assertIsInstance(last, dict, f"{program_id}: weekly_series entries must be dicts")
        if "health_01" in last:
            testcase.assertTrue(_is_number(last["health_01"]), f"{program_id}: weekly_series.health_01 must be number")
            testcase.assertGreaterEqual(float(last["health_01"]), 0.0, f"{program_id}: weekly_series.health_01 must be >= 0")
            testcase.assertLessEqual(float(last["health_01"]), 1.0, f"{program_id}: weekly_series.health_01 must be <= 1")

    # Optional: baseline_compare shape (if present)
    if "baseline_compare" in m and isinstance(m["baseline_compare"], dict):
        bc = m["baseline_compare"]
        if "delta_score_01" in bc:
            testcase.assertTrue(_is_number(bc["delta_score_01"]), f"{program_id}: baseline_compare.delta_score_01 must be number")
            testcase.assertGreaterEqual(float(bc["delta_score_01"]), 0.0, f"{program_id}: baseline_compare.delta_score_01 must be >= 0")
            testcase.assertLessEqual(float(bc["delta_score_01"]), 1.0, f"{program_id}: baseline_compare.delta_score_01 must be <= 1")


class TestProgramAdaptersContract(unittest.TestCase):
    def test_each_adapter_returns_contract_shape(self) -> None:
        self.assertIsInstance(PROGRAM_ADAPTERS, dict, "PROGRAM_ADAPTERS must be a dict")
        self.assertTrue(PROGRAM_ADAPTERS, "PROGRAM_ADAPTERS must not be empty")

        for program_id, adapter in PROGRAM_ADAPTERS.items():
            self.assertTrue(callable(adapter), f"{program_id}: adapter must be callable")

            # Try calling with baseline_weeks first; fall back if adapter doesn't accept it.
            try:
                metrics = adapter(days=30, baseline_weeks=8)  # type: ignore
            except TypeError:
                metrics = adapter(days=30)  # type: ignore

            _assert_metrics_shape(self, str(program_id), metrics)


if __name__ == "__main__":
    unittest.main()
