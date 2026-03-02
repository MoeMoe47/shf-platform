from __future__ import annotations

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

FUNDING_GET_ENDPOINTS = [
    "/api/funding/health",
    "/api/funding/capabilities",
    "/api/funding/discovery",
    "/api/funding/rulesets",
    "/api/funding/lock-triggers",
    "/api/funding/schemas",
    "/api/funding/sdk",
]

# If you have these endpoints, keep them here. If not, remove them.
# (They should still be GET-safe.)
OPTIONAL_GET_ENDPOINTS = [
    "/api/funding/version",
    "/api/funding/changelog",
]

WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"]


def req(method: str, path: str, json_body=None):
    method = method.upper()
    if method == "GET":
        return client.get(path)
    if method == "HEAD":
        return client.head(path)
    if method == "OPTIONS":
        return client.options(path)
    if method == "POST":
        return client.post(path, json=json_body)
    if method == "PUT":
        return client.put(path, json=json_body)
    if method == "PATCH":
        return client.patch(path, json=json_body)
    if method == "DELETE":
        return client.delete(path)
    raise ValueError(f"unsupported method: {method}")


def test_funding_get_endpoints_are_readable():
    # At minimum, these should not be blocked by the guard.
    # Some endpoints might return 404 depending on configuration; adjust if needed.
    for p in FUNDING_GET_ENDPOINTS:
        r = client.get(p)
        assert r.status_code in (200, 404), (p, r.status_code, r.text[:200])


def test_funding_write_methods_blocked_everywhere_except_simulate():
    # All write methods should be blocked on standard funding endpoints (405).
    # Note: 404 is also acceptable *if the route doesn't exist*.
    for p in FUNDING_GET_ENDPOINTS + OPTIONAL_GET_ENDPOINTS:
        for m in WRITE_METHODS:
            if p == "/api/funding/simulate" and m == "POST":
                continue
            r = req(m, p)
            assert r.status_code in (405, 404), (m, p, r.status_code, r.text[:200])


def test_simulate_post_allowed_but_validates_body():
    # Guard allows POST /simulate; without a body, FastAPI should respond 422.
    r = client.post("/api/funding/simulate")
    assert r.status_code == 422, (r.status_code, r.text[:200])


def test_simulate_put_is_blocked():
    r = client.put("/api/funding/simulate", json={"x": 1})
    assert r.status_code in (405, 404), (r.status_code, r.text[:200])


def test_example_write_to_sdk_is_blocked():
    # This is the exact proof: POST to /sdk must be blocked by guard.
    r = client.post("/api/funding/sdk", json={"x": 1})
    assert r.status_code in (405, 404), (r.status_code, r.text[:200])
