from __future__ import annotations

import json
import os
import time
from typing import Any, Dict

import pytest
import requests

BASE = os.environ.get("FUNDING_BASE_URL", "http://127.0.0.1:8001")


def _j(obj: Any) -> str:
    """Stable JSON for exact comparisons."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


def _post(path: str, payload: Dict[str, Any], timeout: float = 15.0) -> Dict[str, Any]:
    r = requests.post(f"{BASE}{path}", json=payload, timeout=timeout)
    r.raise_for_status()
    return r.json()


def _get(path: str, timeout: float = 10.0) -> Dict[str, Any]:
    r = requests.get(f"{BASE}{path}", timeout=timeout)
    r.raise_for_status()
    return r.json()


@pytest.mark.integrity
def test_health_ok():
    data = _get("/api/funding/health")
    assert data.get("ok") is True


@pytest.mark.integrity
def test_simulate_is_deterministic_for_same_payload():
    """
    SAME request must produce EXACT same response (byte-stable JSON after sorting).
    If something includes timestamps/nonces, those must be excluded from response
    or placed in a separate debug envelope that isn't part of the core result.
    """
    payload = {
        "ruleset_id": "rs_2026Q2_workforce_v1_0",
        "metrics": {
            "participants_enrolled": 24,
            "participants_completed": 19,
            "attendance_rate": 0.87,
            "job_placement_count": 11,
            "verified_placement_rate": 0.73,
            "certification_earned_count": 8,
            "retention_3m_rate": 0.62,
            "retention_6m_rate": 0.48,
            "participant_opportunity_index": 0.60,
        },
        "benchmarks": {"cost_per_job_placement_percentile": 0.44},
        "watchtower": {"signals": []},
    }

    a = _post("/api/funding/simulate", payload)
    b = _post("/api/funding/simulate", payload)

    assert _j(a) == _j(b), "simulate must be deterministic for identical inputs"


@pytest.mark.integrity
def test_simulate_does_not_mutate_ruleset_state():
    """
    Fetch rulesets snapshot, run simulate, fetch rulesets again.
    We don't require the full document to be identical if there is a 'last_accessed'
    field, but we DO require a stable ruleset fingerprint.
    """
    before = _get("/api/funding/rulesets")
    _ = _post(
        "/api/funding/simulate",
        {
            "ruleset_id": "rs_2026Q2_workforce_v1_0",
            "metrics": {"participants_enrolled": 10, "participants_completed": 9},
        },
    )
    after = _get("/api/funding/rulesets")

    # Find a stable fingerprint if present
    # Acceptable fields: sha256 / hash / fingerprint / version
    def _fingerprints(doc: Dict[str, Any]) -> Dict[str, str]:
        out: Dict[str, str] = {}
        for rs in doc.get("rulesets", []):
            rid = rs.get("ruleset_id") or rs.get("id")
            if not rid:
                continue
            fp = (
                rs.get("sha256")
                or rs.get("hash")
                or rs.get("fingerprint")
                or rs.get("version")
                or ""
            )
            out[str(rid)] = str(fp)
        return out

    fb = _fingerprints(before)
    fa = _fingerprints(after)

    # If fingerprints exist, they MUST NOT change due to simulate.
    if fb and fa:
        assert fb == fa, "ruleset fingerprints must not change after simulate"
    else:
        # If you don't currently expose fingerprints, require at least same ruleset ids list
        ids_before = sorted(
            [r.get("ruleset_id") or r.get("id") for r in before.get("rulesets", [])]
        )
        ids_after = sorted(
            [r.get("ruleset_id") or r.get("id") for r in after.get("rulesets", [])]
        )
        assert ids_before == ids_after, "ruleset list must not mutate after simulate"


@pytest.mark.integrity
def test_funding_surface_is_compute_only():
    """
    Verify policy: POST under /api/funding/* is blocked EXCEPT /simulate.
    (We check a representative endpoint that must always be blocked.)
    """
    r = requests.post(f"{BASE}/api/funding/sdk", timeout=10)
    assert r.status_code == 405

    # simulate is allowed but may reject missing body
    r2 = requests.post(f"{BASE}/api/funding/simulate", timeout=10)
    assert r2.status_code in (200, 422), "simulate must be reachable (200 or validation 422)"
