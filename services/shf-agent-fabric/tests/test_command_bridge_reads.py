from __future__ import annotations

"""
AFCC-2A.2: Command Center reads for the formerly admin-key-only lanes, reached by
the SHS API with its existing service:shs-api HMAC identity.

Proves: the service identity can READ exactly four projections with GET; the
signature binds method and path; it cannot read other projections, ingest, or
reach any admin/mutation route; the admin key is not a read credential; output
is minimized and sanitized (no server paths, no exception text) while evidence
hashes survive; the run window is fixed server-side; reads have no side effects.
"""

import hashlib
import hmac
import json
import socket
import subprocess
import time

import pytest
from fastapi.testclient import TestClient

from auth.audit import _EVENTS
from auth.config import get_auth_settings
from auth.sessions import _SESSIONS, create_session
from auth.store import AuthUser
from main import app  # type: ignore
from services.internal_service_identity import (
    COMMAND_READ_PATHS,
    authenticate_internal_request,
    canonical_request_bytes,
)

BASE = "/api/v1-command-center/agent-fabric"
BRIDGED = {
    "agents/health": "agents_health",
    "agents/readiness": "agents_readiness",
    "gate": "gate",
    "runs/recent": "runs_recent",
    # AFCC-2A.3: the existing safe projections.
    "watchtower": "watchtower",
    "infrastructure": "infrastructure",
    "observability": "observability",
}
# Valid, truthful non-error states per kind (nothing seeded => not evaluated / not verified).
EXPECTED_STATE = {
    "watchtower": {"AVAILABLE", "NOT_YET_EVALUATED"},
    "infrastructure": {"AVAILABLE", "NOT_YET_VERIFIED"},
    "observability": {"AVAILABLE", "NOT_YET_VERIFIED"},
}
SECRET = "bridge-test-secret"
KID = "bridge-k1"
ADMIN_KEY = "bridge-admin-key"
LEAK_MARKERS = ("/Users/", "/private/", "/home/", "Traceback", "File \"", "ValueError", ADMIN_KEY, SECRET)
SHA = "a" * 64


@pytest.fixture(autouse=True)
def isolated(monkeypatch, tmp_path):
    monkeypatch.setenv("ADMIN_API_KEY", ADMIN_KEY)
    monkeypatch.setenv("SHF_INTERNAL_SERVICE_KEYS_JSON", json.dumps({KID: SECRET}))
    monkeypatch.setenv("SHF_INTERNAL_SERVICE_ACTIVE_KID", KID)
    monkeypatch.setenv("SHF_COMMAND_VERIFICATION_DIR", str(tmp_path / "verification"))
    monkeypatch.setenv("SHF_WATCHTOWER_STORE_PATH", str(tmp_path / "watchtower_store.sqlite"))
    monkeypatch.setenv("SHF_WATCHTOWER_AUDIT_PATH", str(tmp_path / "watchtower_audit.jsonl"))
    monkeypatch.setenv("SHF_WATCHTOWER_SNAPSHOT_DB_PATH", str(tmp_path / "probe.db"))
    runs_log = tmp_path / "events.jsonl"
    events = [
        {"runId": f"r{i}", "planId": "p1", "agentName": "Layer23OrchestratorAgent", "kind": "execute", "outcome": "ok",
         "ts": f"2026-01-09T03:{i % 60:02d}:00+00:00", "snapshotSha256": SHA,
         "artifacts": [{"artifactId": f"draft_{i}", "path": f"/Users/someone/server/db/artifacts/draft_{i}.json", "sha256": SHA}]}
        for i in range(40)
    ]
    events.append({"runId": "rX", "kind": "execute", "outcome": "error", "ts": "2026-01-10T00:00:00+00:00",
                   "message": "Traceback (most recent call last): File \"/srv/fabric/x.py\" ValueError boom",
                   "error": "internal detail", "path": "/srv/db/runs/events.jsonl"})
    runs_log.write_text("\n".join(json.dumps(e) for e in events) + "\n", encoding="utf-8")
    import routers.runs_routes as runs_routes

    monkeypatch.setattr(runs_routes, "RUNS_LOG", runs_log)
    _SESSIONS.clear()
    _EVENTS.clear()
    yield tmp_path
    _SESSIONS.clear()
    _EVENTS.clear()


@pytest.fixture()
def client():
    return TestClient(app)


def _signed(method: str, path: str, *, secret=SECRET, kid=KID, service="service:shs-api", now=None, ttl=60):
    now = now or int(time.time())
    digest = hashlib.sha256(b"{}").hexdigest()
    message = canonical_request_bytes(method, path, digest, str(now), str(now + ttl), kid)
    return {
        "X-SHF-Service-Id": service,
        "X-SHF-Service-Kid": kid,
        "X-SHF-Service-Iat": str(now),
        "X-SHF-Service-Exp": str(now + ttl),
        "X-SHF-Service-Signature": hmac.new(secret.encode(), message, hashlib.sha256).hexdigest(),
    }


def _session(role: str) -> TestClient:
    token, _ = create_session(AuthUser(user_id=f"u-{role}", email=f"{role}@test.invalid", display_name=role, role=role, password_hash=""))
    c = TestClient(app)
    c.cookies.set(get_auth_settings().cookie_name, token)
    return c


def test_allow_list_is_exactly_the_bridged_reads():
    assert COMMAND_READ_PATHS == {f"{BASE}/{p}" for p in BRIDGED}


@pytest.mark.parametrize("path,kind", BRIDGED.items())
def test_unauthenticated_is_401(client, path, kind):
    assert client.get(f"{BASE}/{path}").status_code == 401


@pytest.mark.parametrize("path,kind", BRIDGED.items())
def test_service_identity_reads_sanitized_envelope(client, path, kind):
    full = f"{BASE}/{path}"
    res = client.get(full, headers=_signed("GET", full))
    assert res.status_code == 200, res.text
    body = res.json()
    assert (body["contract"], body["kind"], body["read_only"], body["access"]) == ("afcc.read.v1", kind, True, "shs_service")
    assert body["state"] in EXPECTED_STATE.get(kind, {"AVAILABLE"}), body["state"]
    for marker in LEAK_MARKERS:
        assert marker not in res.text, marker


@pytest.mark.parametrize("path,kind", BRIDGED.items())
def test_admin_key_alone_is_not_a_read_credential(client, path, kind):
    assert client.get(f"{BASE}/{path}", headers={"X-Admin-Key": ADMIN_KEY}).status_code == 401


@pytest.mark.parametrize("path,kind", BRIDGED.items())
def test_fabric_session_with_governance_read_still_works_and_client_is_403(path, kind):
    assert _session("shs_admin").get(f"{BASE}/{path}").status_code == 200
    assert _session("client").get(f"{BASE}/{path}").status_code == 403


def test_signature_binds_path_and_method(client):
    signed_for_gate = _signed("GET", f"{BASE}/gate")
    assert client.get(f"{BASE}/runs/recent", headers=signed_for_gate).status_code == 401
    post_signed = _signed("POST", f"{BASE}/gate")
    assert client.get(f"{BASE}/gate", headers=post_signed).status_code == 401


@pytest.mark.parametrize("variant", ["wrong_secret", "wrong_kid", "wrong_service", "expired", "ttl_too_long"])
def test_bad_service_credentials_are_401(client, variant):
    path = f"{BASE}/agents/health"
    headers = {
        "wrong_secret": lambda: _signed("GET", path, secret="nope"),
        "wrong_kid": lambda: _signed("GET", path, kid="unknown"),
        "wrong_service": lambda: _signed("GET", path, service="service:other"),
        "expired": lambda: _signed("GET", path, now=int(time.time()) - 600),
        "ttl_too_long": lambda: _signed("GET", path, ttl=3600),
    }[variant]()
    assert client.get(path, headers=headers).status_code == 401
    assert any(e.get("event_type") == "service_auth_failed" for e in _EVENTS)


@pytest.mark.parametrize("path", [f"{BASE}/not-a-projection", f"{BASE}/watchtower/../gate", "/api/v1-command-center/contract-foundation/overview"])
def test_service_identity_reads_nothing_outside_the_allow_list(client, path):
    assert client.get(path, headers=_signed("GET", path)).status_code in (401, 404)


@pytest.mark.parametrize("method,path", [
    ("POST", "/runs/execute"),
    ("POST", "/admin/agents/some-agent/enabled"),
    ("POST", "/admin/layers/L08/enabled"),
    ("GET", "/admin/agents/summary/health"),
    ("GET", "/runs/recent"),
    ("GET", "/admin/infra/verify"),
    ("GET", "/admin/observability/verify"),
    ("POST", "/admin/infra/verify"),
    ("POST", "/admin/observability/verify"),
])
def test_service_identity_grants_no_admin_or_mutation_route(client, method, path):
    res = client.request(method, path, headers=_signed(method, path), json={} if method == "POST" else None)
    assert res.status_code in (401, 403, 404, 405, 422), (path, res.status_code)
    assert res.status_code != 200


def test_read_signature_cannot_ingest():
    path = "/shf/internal/ingestion/events"
    with pytest.raises(ValueError):
        authenticate_internal_request(method="POST", path=path, body={}, headers=_signed("GET", f"{BASE}/gate"))


@pytest.mark.parametrize("method", ["POST", "PUT", "PATCH", "DELETE"])
def test_bridged_paths_are_get_only(client, method):
    for path in BRIDGED:
        full = f"{BASE}/{path}"
        assert client.request(method, full, headers=_signed(method, full)).status_code == 405


def test_runs_projection_minimizes_and_keeps_hashes(client):
    full = f"{BASE}/runs/recent"
    res = client.get(f"{full}?limit=1000", headers=_signed("GET", full))
    body = res.json()
    assert body["window"] == 25 and len(body["events"]) == 25, "window is fixed server-side"
    newest = body["events"][0]
    assert newest["runId"] == "rX"
    assert newest["message"] == "[redacted]"
    assert "error" not in newest and "path" not in newest
    run = body["events"][1]
    assert run["snapshotSha256"] == SHA
    assert run["artifacts"] == [{"artifactId": "draft_39", "sha256": SHA}]
    assert "/Users/" not in res.text and "events.jsonl" not in res.text


def test_agent_and_gate_projections_have_only_contract_fields(client):
    full = f"{BASE}/agents/health"
    body = client.get(full, headers=_signed("GET", full)).json()
    assert set(body["summary"]) == {"total", "ready", "warning", "approval_required"}
    assert all(set(a) == {"agent_id", "name", "layer", "lifecycle", "enabled", "status", "missing"} for a in body["agents"])
    full = f"{BASE}/gate"
    gate = client.get(full, headers=_signed("GET", full)).json()
    assert isinstance(gate["gate_pass"], bool)
    assert all(set(b) == {"layer", "reason"} for b in gate["gate_blockers"])


def test_projection_failure_returns_code_without_exception_text(client, monkeypatch):
    import fabric.command.fleet_projections as fp

    def boom():
        raise RuntimeError("secret detail at /Users/someone/x.py")

    monkeypatch.setattr(fp, "gate_projection", boom)
    full = f"{BASE}/gate"
    res = client.get(full, headers=_signed("GET", full))
    assert res.status_code == 503
    assert res.json() == {"contract": "afcc.read.v1", "kind": "gate", "read_only": True, "state": "BACKEND_ERROR", "reason_code": "PROJECTION_READ_FAILED"}


def test_reads_have_no_subprocess_or_network(client, monkeypatch, isolated):
    def forbidden(*_a, **_k):
        raise AssertionError("side effect during a read")

    monkeypatch.setattr(subprocess, "run", forbidden)
    monkeypatch.setattr(subprocess, "Popen", forbidden)
    monkeypatch.setattr(socket, "create_connection", forbidden)
    before = (isolated / "events.jsonl").read_bytes()
    for path in BRIDGED:
        full = f"{BASE}/{path}"
        assert client.get(full, headers=_signed("GET", full)).status_code == 200
    assert (isolated / "events.jsonl").read_bytes() == before


# ------------------------------------------------------------------ AFCC-2A.3


def _sqlite_dump_hash(db):
    import sqlite3

    conn = sqlite3.connect(f"{db.as_uri()}?mode=ro", uri=True)
    try:
        return hashlib.sha256("\n".join(conn.iterdump()).encode()).hexdigest()
    finally:
        conn.close()


def test_watchtower_service_read_returns_persisted_state_and_mutates_nothing(client, isolated, monkeypatch):
    from fabric.watchtower import store as wt_store

    wt_store.record_risk_snapshot(
        {"program_id": "arena_observation_deck", "risk_band": "RED", "action": "DEGRADE", "quarantined": False,
         "reasons": ["health<0.40"], "ok": True},
        window_days=30, baseline_weeks=8,
    )
    store = isolated / "watchtower_store.sqlite"
    audit = isolated / "watchtower_audit.jsonl"
    before = (_sqlite_dump_hash(store), audit.read_bytes() if audit.exists() else b"")

    def forbidden(*_a, **_k):
        raise AssertionError("side effect during a read")

    monkeypatch.setattr(subprocess, "run", forbidden)
    monkeypatch.setattr(subprocess, "Popen", forbidden)
    monkeypatch.setattr(socket, "create_connection", forbidden)
    full = f"{BASE}/watchtower"
    for _ in range(3):
        body = client.get(full, headers=_signed("GET", full)).json()
    assert body["state"] == "AVAILABLE"
    assert body["latest_evaluation"]["worst_risk_band"] == "RED"
    assert body["latest_evaluation"]["staleness"]["threshold"] == "NOT_DEFINED", "staleness stays visible"
    assert isinstance(body["latest_evaluation"]["staleness"]["age_seconds"], int)
    after = (_sqlite_dump_hash(store), audit.read_bytes() if audit.exists() else b"")
    assert after == before, "no risk recomputation, snapshot, audit, quarantine or attestation write"


@pytest.mark.parametrize("kind", ["infrastructure", "observability"])
def test_verification_service_read_never_runs_the_verifier(client, isolated, monkeypatch, kind):
    from fabric.command.verification_results import read_verification_result

    def forbidden(*_a, **_k):
        raise AssertionError("verifier launched during a read")

    monkeypatch.setattr(subprocess, "run", forbidden)
    monkeypatch.setattr(subprocess, "Popen", forbidden)
    monkeypatch.setattr(subprocess, "check_output", forbidden)
    full = f"{BASE}/{kind}"
    body = client.get(full, headers=_signed("GET", full)).json()
    assert (body["state"], body["reason_code"]) == ("NOT_YET_VERIFIED", "NO_VERIFICATION_RECORDED")
    assert read_verification_result(kind) is None, "reading never records a result"
    assert not (isolated / "verification").exists() or not any((isolated / "verification").iterdir())


@pytest.mark.parametrize("kind", ["infrastructure", "observability"])
def test_recorded_verification_is_returned_as_last_known(client, isolated, kind):
    from fabric.command.verification_results import record_verification_result

    # Simulates the privileged action having recorded a result earlier (outside the read path).
    record_verification_result(kind, [{"name": "registry_contract", "ok": True}, {"name": "watchtower_attestation", "ok": False, "reason_code": "CHECK_FAILED"}], trigger=f"admin_{kind}_verify")
    full = f"{BASE}/{kind}"
    body = client.get(full, headers=_signed("GET", full)).json()
    assert (body["state"], body["status"]) == ("AVAILABLE", "DEGRADED")
    assert body["degraded"] == ["watchtower_attestation"]
    assert isinstance(body["staleness"]["age_seconds"], int)
