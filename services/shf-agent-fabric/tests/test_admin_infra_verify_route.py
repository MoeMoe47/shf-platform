from fastapi.testclient import TestClient

# conftest.py sets PYTHONPATH so `from main import app` works when running from services/shf-agent-fabric
from main import app  # type: ignore


def _checks_to_dict(checks):
    return {c.get("name"): c for c in checks if isinstance(c, dict) and "name" in c}


def test_admin_infra_verify_route_ok_contract_v1():
    client = TestClient(app)
    r = client.get("/admin/infra/verify")
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

    # Overall ok should match all checks ok (route's intended meaning)
    all_ok = all(cd[n]["ok"] is True for n in ("registry_contract", "runtime_enforcement_lock", "gate_g_startup"))
    assert data.get("ok") == all_ok
