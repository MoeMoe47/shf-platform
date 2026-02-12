from __future__ import annotations

import unittest


def _load_catalog_program_ids() -> set[str]:
    try:
        from routers.loo_routes import loo_programs  # type: ignore
        cat = loo_programs()
        progs = cat.get("programs") if isinstance(cat, dict) else None
        out: set[str] = set()
        if isinstance(progs, list):
            for p in progs:
                if isinstance(p, dict):
                    pid = str(p.get("program_id") or "")
                    if pid:
                        out.add(pid)
        return out
    except Exception:
        return set()


class TestWatchtowerCoverage(unittest.TestCase):
    def test_every_catalog_program_has_a_row(self) -> None:
        from fabric.watchtower.aggregator import compute_watchtower_rows

        catalog_ids = _load_catalog_program_ids()
        rows, _alerts = compute_watchtower_rows(days=30, baseline_weeks=8)
        row_ids = {str(r.get("program_id") or "") for r in rows}

        # Watchtower must cover the catalog even if adapter is missing (it will emit NO_ADAPTER rows).
        missing = sorted([pid for pid in catalog_ids if pid not in row_ids])
        self.assertEqual(missing, [], f"Watchtower missing catalog program_ids: {missing}")
