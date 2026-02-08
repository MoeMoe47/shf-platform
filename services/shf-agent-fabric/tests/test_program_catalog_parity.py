from __future__ import annotations

import unittest

from fabric.loo.adapter_registry import PROGRAM_ADAPTERS
from fabric.loo.catalog_parity import validate_program_catalog_parity


class TestProgramCatalogParity(unittest.TestCase):
    def test_catalog_and_adapters_in_sync(self) -> None:
        validate_program_catalog_parity(PROGRAM_ADAPTERS)


if __name__ == "__main__":
    unittest.main()
