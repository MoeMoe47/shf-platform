from __future__ import annotations

from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from auth.config import validate_auth_configuration
from auth.sessions import _SESSIONS, now_utc, revoke_all_sessions
from main import app

client = TestClient(app)

ORIGIN = "http://127.0.0.1:5174"


@pytest.fixture(autouse=True)
def clear_auth_state():
    _SESSIONS.clear()
    client.cookies.clear()
    yield
    _SESSIONS.clear()
    client.cookies.clear()


def login(email: str = "shs@demo.shs", password: str = "demo-password"):
    return client.post(
        "/auth/login",
        json={"email": email, "password": password},
        headers={"Origin": ORIGIN},
    )


def test_valid_login_sets_httponly_cookie_and_sanitized_identity():
    response = login()
    assert response.status_code == 200
    data = response.json()
    assert data["authenticated"] is True
    assert data["role"] == "shs_admin"
    assert "password" not in response.text.lower()
    assert "raw session" not in response.text.lower()
    cookie = response.headers.get("set-cookie", "")
    assert "shs_bos_session=" in cookie
    assert "HttpOnly" in cookie
    assert "SameSite=lax" in cookie


def test_invalid_and_nonexistent_login_are_generic():
    bad_password = client.post(
        "/auth/login",
        json={"email": "shs@demo.shs", "password": "wrong-password"},
        headers={"Origin": ORIGIN},
    )
    missing_user = client.post(
        "/auth/login",
        json={"email": "missing@example.test", "password": "wrong-password"},
        headers={"Origin": ORIGIN},
    )
    assert bad_password.status_code == 401
    assert missing_user.status_code == 401
    assert bad_password.json()["detail"] == missing_user.json()["detail"]


def test_me_requires_session_and_ignores_client_supplied_role_header():
    anonymous = client.get("/auth/me")
    assert anonymous.status_code == 401
    login_response = login("admin@demo.shs")
    assert login_response.status_code == 200
    me = client.get("/auth/me", headers={"X-User-Role": "shs_admin"})
    assert me.status_code == 200
    assert me.json()["role"] == "client_admin"


def test_client_admin_cannot_use_identity_management_route():
    login_response = login("admin@demo.shs")
    csrf = login_response.json()["csrf_token"]
    denied = client.post(
        "/auth/session/revoke-all",
        headers={"Origin": ORIGIN, "X-CSRF-Token": csrf},
    )
    assert denied.status_code == 403


def test_logout_revokes_session_and_csrf_is_required():
    login_response = login()
    csrf = login_response.json()["csrf_token"]
    csrf_failure = client.post("/auth/logout", headers={"Origin": ORIGIN})
    assert csrf_failure.status_code == 403
    logout = client.post("/auth/logout", headers={"Origin": ORIGIN, "X-CSRF-Token": csrf})
    assert logout.status_code == 200
    assert client.get("/auth/me").status_code == 401


def test_refresh_rotates_session_and_old_session_is_revoked():
    login_response = login()
    old_session_id = login_response.json()["session_id"]
    csrf = login_response.json()["csrf_token"]
    refresh = client.post(
        "/auth/session/refresh",
        headers={"Origin": ORIGIN, "X-CSRF-Token": csrf},
    )
    assert refresh.status_code == 200
    assert refresh.json()["session_id"] != old_session_id


def test_revoke_all_invalidates_active_sessions_for_user():
    first = login()
    assert first.status_code == 200
    second = login()
    assert second.status_code == 200
    csrf = second.json()["csrf_token"]
    revoked = client.post(
        "/auth/session/revoke-all",
        headers={"Origin": ORIGIN, "X-CSRF-Token": csrf},
    )
    assert revoked.status_code == 200
    assert client.get("/auth/me").status_code == 401


def test_expired_session_is_denied():
    response = login()
    session_hash = response.json()["session_id"]
    _SESSIONS[session_hash].expires_at = now_utc() - timedelta(minutes=1)
    assert client.get("/auth/me").status_code == 401


def test_invalid_origin_and_rate_limit_are_blocked():
    invalid_origin = client.post(
        "/auth/login",
        json={"email": "origin-test@demo.shs", "password": "wrong"},
        headers={"Origin": "https://evil.example"},
    )
    assert invalid_origin.status_code == 403

    limited_status = None
    for _ in range(7):
        limited_status = client.post(
            "/auth/login",
            json={"email": "rate-limit@demo.shs", "password": "wrong"},
            headers={"Origin": ORIGIN},
        ).status_code
    assert limited_status == 429


def test_auth_audit_security_headers_and_config_fail_closed(monkeypatch):
    response = login()
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    audit = client.get("/auth/audit")
    assert audit.status_code == 200
    assert any(event["event_type"] == "login_success" for event in audit.json()["events"])

    monkeypatch.setenv("SHS_AUTH_ENV", "production")
    monkeypatch.setenv("AUTH_DEMO_IDENTITY_ENABLED", "1")
    monkeypatch.setenv("AUTH_COOKIE_SECURE", "0")
    config = validate_auth_configuration()
    assert config["ok"] is False
    assert any("AUTH_DEMO_IDENTITY_ENABLED" in item for item in config["blockers"])
