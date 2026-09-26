from fastapi.testclient import TestClient

# conftest.py sets PYTHONPATH so `from main import app` works when running from services/shf-agent-fabric
from main import app  # type: ignore


def _checks_to_dict(checks):
    return {c.get("name"): c for c in checks if isinstance(c, dict) and "name" in c}


def test_admin_infra_verify_route_ok_contract_v1(monkeypatch, tmp_path):
    # Privileged action (AFCC-2A): admin key required; side effects kept out of the real stores.
    monkeypatch.setenv("ADMIN_API_KEY", "test-admin-key")
    monkeypatch.setenv("SHF_COMMAND_VERIFICATION_DIR", str(tmp_path / "verification"))
    monkeypatch.setenv("SHF_WATCHTOWER_SNAPSHOT_DB_PATH", str(tmp_path / "probe.db"))
    # Throwaway keyring so the attestation check runs for real (never a production key).
    monkeypatch.setenv("SHF_ATTEST_KEYRING_JSON", '{"test-kid": "test-only-secret"}')
    monkeypatch.setenv("SHF_ATTEST_ACTIVE_KID", "test-kid")
    client = TestClient(app)
    assert client.get("/admin/infra/verify").status_code == 401
    r = client.get("/admin/infra/verify", headers={"X-Admin-Key": "test-admin-key"})
    assert r.status_code == 200, r.text

    data = r.json()
    assert data.get("contract") == "v1"
    assert isinstance(data.get("ts"), int)

    checks = data.get("checks")
    assert isinstance(checks, list)
    cd = _checks_to_dict(checks)

    # Required checks exist
    for name in ("registry_contract", "runtime_enforcement_lock", "gate_g_startup"):
        assert name in cd, f"missing check: {name}"

    # Each check has ok + tails
    for name, c in cd.items():
        assert isinstance(c.get("ok"), bool), f"{name}.ok not bool"
        assert "stdout_tail" in c
        assert "stderr_tail" in c

    # Overall ok is every check ok — the route ANDs all checks it runs. (Before AFCC-2A the
    # script checks never ran because of a doubled path, so a 3-check subset matched by accident.)
    all_ok = all(c["ok"] is True for c in cd.values())
    assert data.get("ok") == all_ok
