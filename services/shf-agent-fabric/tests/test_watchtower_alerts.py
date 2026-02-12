from __future__ import annotations

import unittest
from fabric.watchtower.alerts import build_watchtower_alerts

class TestWatchtowerAlerts(unittest.TestCase):
    def test_no_alerts_when_all_good(self) -> None:
        summary = {
            "coverage_total": 2,
            "coverage_with_adapter": 2,
            "coverage_adapter_ok": 2,
            "contract_ok": 2,
            "contract_fail": 0,
            "adapter_ok_rate": 1.0,
            "contract_ok_rate": 1.0,
        }
        alerts = build_watchtower_alerts(summary)
        self.assertEqual(len(alerts), 0)

    def test_missing_adapter_is_critical(self) -> None:
        summary = {
            "coverage_total": 2,
            "coverage_with_adapter": 1,
            "coverage_adapter_ok": 1,
            "contract_ok": 1,
            "contract_fail": 0,
            "adapter_ok_rate": 0.5,
            "contract_ok_rate": 1.0,
        }
        alerts = build_watchtower_alerts(summary)
        self.assertTrue(any(a.get("code") == "MISSING_ADAPTER" and a.get("severity") == "CRITICAL" for a in alerts))

    def test_contract_failure_is_critical(self) -> None:
        summary = {
            "coverage_total": 2,
            "coverage_with_adapter": 2,
            "coverage_adapter_ok": 2,
            "contract_ok": 1,
            "contract_fail": 1,
            "adapter_ok_rate": 1.0,
            "contract_ok_rate": 0.5,
        }
        alerts = build_watchtower_alerts(summary)
        self.assertTrue(any(a.get("code") == "CONTRACT_FAILURE" and a.get("severity") == "CRITICAL" for a in alerts))

if __name__ == "__main__":
    unittest.main()
