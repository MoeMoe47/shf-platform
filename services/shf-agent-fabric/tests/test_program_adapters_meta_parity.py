from __future__ import annotations

import unittest

from fabric.loo.adapter_registry import PROGRAM_ADAPTERS, PROGRAM_ADAPTER_META
from fabric.loo.adapter_meta_parity import validate_adapter_meta_parity


class TestAdapterMetaParity(unittest.TestCase):
    def test_adapters_and_meta_in_sync(self) -> None:
        errs = validate_adapter_meta_parity(PROGRAM_ADAPTERS, PROGRAM_ADAPTER_META)
        self.assertEqual(errs, [], "Parity errors:\n  - " + "\n  - ".join(errs))


if __name__ == "__main__":
    unittest.main()
