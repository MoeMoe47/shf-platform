from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from routers.loo_rankings_routes import loo_rankings  # type: ignore


def _shape(x):
    if isinstance(x, dict):
        return {k: _shape(v) for k, v in sorted(x.items())}
    if isinstance(x, list):
        return [_shape(x[0])] if x else []
    return type(x).__name__


def test_loo_rankings_contract_lock():
    lock_path = ROOT / "contracts" / "locks" / "loo_rankings.lock.json"
    assert lock_path.exists(), f"Missing lockfile: {lock_path}"

    lock = json.loads(lock_path.read_text())
    payload = loo_rankings(days=30, baseline_weeks=8)

    assert lock.get("route") == "/loo/rankings"
    assert lock.get("shape") == _shape(payload), "LOO rankings contract drift detected"
