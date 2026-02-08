from __future__ import annotations

import unittest

from fabric.loo.adapter_registry import PROGRAM_ADAPTERS, PROGRAM_ADAPTER_META


class TestAdapterStatusBoardBasics(unittest.TestCase):
    def test_registry_has_meta_for_each_adapter(self) -> None:
        self.assertTrue(PROGRAM_ADAPTERS, "PROGRAM_ADAPTERS must not be empty")
        for program_id in PROGRAM_ADAPTERS.keys():
            self.assertIn(program_id, PROGRAM_ADAPTER_META, f"{program_id}: missing metadata")


if __name__ == "__main__":
    unittest.main()
