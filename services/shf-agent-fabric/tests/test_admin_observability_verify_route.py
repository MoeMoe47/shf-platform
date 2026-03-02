from __future__ import annotations

from fastapi.testclient import TestClient

from main import app  # type: ignore


def test_admin_observability_verify_contract_v1():
    c = TestClient(app)
    r = c.get("/admin/observability/verify")
    # healthy => 200, degraded => 503, but body must always follow the contract
    assert r.status_code in (200, 503), r.text

    data = r.json()
    assert "ok" in data
    assert "status" in data
    assert data.get("version") == "v1"
    assert "checks" in data
    assert isinstance(data["checks"], dict)

    # must contain these keys
    for k in ("contract", "gate_g_probe", "core", "watchtower_probe", "loo_meta_parity_probe"):
        assert k in data["checks"]
