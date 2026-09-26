from __future__ import annotations

from fastapi.testclient import TestClient

from main import app  # type: ignore


def test_admin_observability_verify_contract_v1(monkeypatch, tmp_path):
    # Privileged action (AFCC-2A): admin key required; side effects kept out of the real stores.
    monkeypatch.setenv("ADMIN_API_KEY", "test-admin-key")
    monkeypatch.setenv("SHF_COMMAND_VERIFICATION_DIR", str(tmp_path / "verification"))
    monkeypatch.setenv("SHF_WATCHTOWER_STORE_PATH", str(tmp_path / "watchtower_store.sqlite"))
    monkeypatch.setenv("SHF_WATCHTOWER_AUDIT_PATH", str(tmp_path / "watchtower_audit.jsonl"))
    c = TestClient(app)
    assert c.get("/admin/observability/verify").status_code == 401
    r = c.get("/admin/observability/verify", headers={"X-Admin-Key": "test-admin-key"})
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
