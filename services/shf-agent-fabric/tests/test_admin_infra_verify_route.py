from fastapi.testclient import TestClient

# Import app from the shf-agent-fabric service package (PYTHONPATH is handled by conftest/CI)
from main import app  # type: ignore


def test_admin_infra_verify_route_ok():
    client = TestClient(app)
    r = client.get("/admin/infra/verify")
    assert r.status_code == 200, r.text

    data = r.json()
    assert data.get("ok") is True

    # Shape-tolerant: "checks" may be a dict (named checks) or a list (ordered checks)
    assert "checks" in data
    checks = data["checks"]

    if isinstance(checks, list):
        # minimal expectations for list form
        assert len(checks) >= 1
    elif isinstance(checks, dict):
        # minimal expectations for dict form
        assert len(checks.keys()) >= 1
    else:
        raise AssertionError(f"Unexpected checks type: {type(checks)}")

    # Optional, non-breaking: if known keys exist, they should contain ok=True
    if isinstance(checks, dict):
        for k in ("registry_contract", "runtime_enforcement_lock", "gate_g_startup"):
            if k in checks:
                assert checks[k].get("ok") is True
