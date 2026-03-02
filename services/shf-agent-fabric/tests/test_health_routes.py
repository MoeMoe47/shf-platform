from fastapi.testclient import TestClient

# conftest.py already fixes PYTHONPATH to services/shf-agent-fabric, so this import works:
from main import app  # type: ignore

def test_health_live_ok():
    c = TestClient(app)
    r = c.get("/health/live")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("ok") is True
    assert data.get("status") == "live"

def test_health_ready_shape():
    c = TestClient(app)
    r = c.get("/health/ready")
    assert r.status_code == 200, r.text
    data = r.json()
    assert "ok" in data
    assert "checks" in data
    assert isinstance(data["checks"], dict)
    # keys we expect
    for k in ("gate_g_startup", "registry_contract", "runtime_enforcement_lock"):
        assert k in data["checks"]

def test_health_degraded_shape():
    c = TestClient(app)
    r = c.get("/health/degraded")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("ok") is True
    assert "degraded" in data
    assert isinstance(data["degraded"], bool)
    assert isinstance(data.get("checks"), dict)
