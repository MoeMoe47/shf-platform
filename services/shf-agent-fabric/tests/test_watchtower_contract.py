from __future__ import annotations

import unittest

from fabric.watchtower.aggregator import compute_watchtower_rows


REQUIRED_ROW_KEYS = [
    "program_id",
    "app_id",
    "label",
    "window_days",
    "baseline_weeks",
    "adapter_ok",
    "adapter_error",
    "health_01",
    "delta_score_01",
    "trend_band",
    "volume_01",
    "quality_01",
    "rank_score_01",
    "rank_formula_version",
    "rank",
]


class TestWatchtowerContract(unittest.TestCase):
    def test_watchtower_rows_have_required_keys(self) -> None:
        rows, alerts = compute_watchtower_rows(days=30, baseline_weeks=8)
        # It's okay to have 0 programs in some environments, but if rows exist they must be shaped.
        for r in rows:
            for k in REQUIRED_ROW_KEYS:
                self.assertIn(k, r, f"missing {k} in row {r.get('program_id')}")
