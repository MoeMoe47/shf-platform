from __future__ import annotations

import os
import tempfile

from fabric.watchtower.store import ensure_schema, set_quarantine, get_quarantine_map, clear_quarantine


def test_store_quarantine_roundtrip():
    with tempfile.TemporaryDirectory() as d:
        os.environ["SHF_WATCHTOWER_STORE_PATH"] = d + "/wt.sqlite"
        ensure_schema()
        set_quarantine("demo.program", reason="unit_test")
        q = get_quarantine_map()
        assert "demo.program" in q
        clear_quarantine("demo.program")
        q2 = get_quarantine_map()
        assert "demo.program" not in q2
