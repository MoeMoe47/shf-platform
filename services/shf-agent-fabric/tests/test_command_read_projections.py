from __future__ import annotations

"""
AFCC-2A: Agent Fabric Command Center read projections.

Covers access (Fabric session with bos.governance.read only; AFCC-2A.1 removed the
transitional X-Admin-Key read), read-only guarantees (no writes, no subprocesses,
no network on GET), sanitization, NOT_YET_VERIFIED / NOT_YET_EVALUATED states,
staleness age, and the READ/ACTION separation from the privileged verify routes.
"""

import gc
import hashlib
import json
import socket
import sqlite3
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from auth.audit import _EVENTS
from auth.config import get_auth_settings
from auth.sessions import _SESSIONS, create_session
from auth.store import AuthUser
from fabric.command import sanitize as sanitize_mod
from fabric.command.verification_results import read_verification_result, record_verification_result
from fabric.watchtower import store as wt_store
from fabric.watchtower.read_projection import build_watchtower_read_projection
from main import app  # type: ignore

BASE = "/api/v1-command-center/agent-fabric"
PROJECTIONS = ("watchtower", "infrastructure", "observability")
ADMIN_KEY = "test-admin-key"
LEAK_MARKERS = ("/Users/", "/private/", "/home/", "Traceback", "File \"", "Error:", "stdout_tail", "stderr_tail", "baseUrl", ADMIN_KEY)


@pytest.fixture(autouse=True)
def isolated(monkeypatch, tmp_path):
    monkeypatch.setenv("ADMIN_API_KEY", ADMIN_KEY)
    monkeypatch.setenv("SHF_COMMAND_VERIFICATION_DIR", str(tmp_path / "verification"))
    monkeypatch.setenv("SHF_WATCHTOWER_STORE_PATH", str(tmp_path / "watchtower_store.sqlite"))
    monkeypatch.setenv("SHF_WATCHTOWER_AUDIT_PATH", str(tmp_path / "watchtower_audit.jsonl"))
    monkeypatch.setenv("SHF_WATCHTOWER_SNAPSHOT_DB_PATH", str(tmp_path / "probe.db"))
    _SESSIONS.clear()
    _EVENTS.clear()
    yield tmp_path
    _SESSIONS.clear()
    _EVENTS.clear()


@pytest.fixture()
def client():
    return TestClient(app)


def _reader() -> TestClient:
    """A Fabric session holding bos.governance.read (shs_admin)."""
    return _session_client("shs_admin")


def _session_client(role: str) -> TestClient:
    token, _ = create_session(AuthUser(user_id=f"u-{role}", email=f"{role}@test.invalid", display_name=role, role=role, password_hash=""))
    c = TestClient(app)
    c.cookies.set(get_auth_settings().cookie_name, token)
    return c


def _seed_watchtower(rows):
    for row in rows:
        wt_store.record_risk_snapshot(row, window_days=30, baseline_weeks=8)


def _sqlite_dump_hash(db: Path) -> str:
    conn = sqlite3.connect(f"{db.as_uri()}?mode=ro", uri=True)
    try:
        return hashlib.sha256("\n".join(conn.iterdump()).encode()).hexdigest()
    finally:
        conn.close()


def _fingerprint(tmp_path: Path) -> dict:
    """
    Content hash of every file under tmp_path plus Watchtower row counts.
    SQLite files are compared by logical content (full dump): WAL checkpointing
    by an earlier *writer* connection may rewrite pages without changing data.
    SQLite's -wal/-shm coordination files are storage-engine state, not data.
    """
    gc.collect()  # close any lingering writer connections from test setup
    files = {}
    for p in sorted(tmp_path.rglob("*")):
        if not p.is_file() or p.name.endswith(("-shm", "-wal")):
            continue
        key = str(p.relative_to(tmp_path))
        files[key] = _sqlite_dump_hash(p) if p.suffix in (".sqlite", ".db") else hashlib.sha256(p.read_bytes()).hexdigest()
    counts = {}
    db = tmp_path / "watchtower_store.sqlite"
    if db.exists():
        conn = sqlite3.connect(f"{db.as_uri()}?mode=ro", uri=True)
        try:
            for table in ("risk_snapshots", "risk_history", "quarantine", "attestations"):
                counts[table] = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        finally:
            conn.close()
    return {"files": files, "counts": counts}


# ------------------------------------------------------------------ access


@pytest.mark.parametrize("kind", PROJECTIONS)
def test_unauthenticated_is_401(client, kind):
    assert client.get(f"{BASE}/{kind}").status_code == 401
    assert client.get(f"{BASE}/{kind}", headers={"X-Admin-Key": "wrong"}).status_code == 401


@pytest.mark.parametrize("kind", PROJECTIONS)
def test_session_without_read_permission_is_403(kind):
    c = _session_client("client")
    r = c.get(f"{BASE}/{kind}")
    assert r.status_code == 403


@pytest.mark.parametrize("kind", PROJECTIONS)
def test_session_with_read_permission_reads(kind):
    r = _session_client("shs_admin").get(f"{BASE}/{kind}")
    assert r.status_code == 200, r.text
    assert r.json()["access"] == "session"
    assert r.json()["read_only"] is True


@pytest.mark.parametrize("kind", PROJECTIONS)
def test_admin_key_alone_is_not_a_read_credential(client, kind):
    # AFCC-2A.1: the transitional browser admin-key read was removed.
    assert client.get(f"{BASE}/{kind}", headers={"X-Admin-Key": ADMIN_KEY}).status_code == 401


def test_read_router_exposes_get_only():
    methods = {
        (route.path, m)
        for route in app.routes
        if getattr(route, "path", "").startswith(BASE)
        for m in getattr(route, "methods", set())
    }
    assert methods and all(m in {"GET", "HEAD"} for _, m in methods)


# ------------------------------------------------ read user cannot act


def test_read_session_cannot_run_verification_actions():
    c = _session_client("shs_admin")  # holds bos.governance.read, but no admin key
    assert c.get("/admin/infra/verify").status_code == 401
    assert c.get("/admin/observability/verify").status_code == 401


def test_read_session_cannot_execute_runs_publish_or_change_policy():
    c = _session_client("shs_admin")
    # AFCC-3 Phase 3: execution needs a session with fabric.run.execute AND a CSRF
    # token; the admin key is gone. A cookie alone (no CSRF) is refused.
    assert c.post("/runs/execute", json={"planId": "p", "approved": True}).status_code == 403
    assert c.post("/runs/reports/r1/publish", json={}).status_code in (401, 422)
    assert c.post("/admin/layers/L08/enabled", json={"enabled": False}).status_code == 401
    assert c.post("/admin/agents/a1/enabled", json={"enabled": False}).status_code == 401
    assert c.patch("/admin/align/containment", json={}).status_code == 401


def test_read_router_has_no_quarantine_route():
    paths = {getattr(r, "path", "") for r in app.routes if getattr(r, "path", "").startswith(BASE)}
    assert not any("quarantine" in p for p in paths)


@pytest.mark.xfail(strict=True, reason="Pre-existing gap outside AFCC-2A: /watchtower/quarantine mutations have no backend auth for any caller.")
def test_read_session_cannot_quarantine_or_release():
    c = _session_client("client")
    assert c.post("/watchtower/quarantine/p1", json={"reason": "x"}).status_code in (401, 403)
    assert c.delete("/watchtower/quarantine/p1").status_code in (401, 403)


# ------------------------------------------------------- side-effect free


@pytest.fixture()
def no_subprocess_no_network(monkeypatch):
    def _deny(*_a, **_k):
        raise AssertionError("read projection attempted a subprocess")

    def _deny_net(*_a, **_k):
        raise AssertionError("read projection attempted a network connection")

    monkeypatch.setattr(subprocess, "Popen", _deny)
    monkeypatch.setattr(subprocess, "run", _deny)
    monkeypatch.setattr(socket.socket, "connect", _deny_net)


@pytest.mark.parametrize("kind", PROJECTIONS)
def test_reads_have_no_side_effects(client, isolated, kind, no_subprocess_no_network):
    _seed_watchtower([
        {"program_id": "arena_observation_deck", "risk_band": "RED", "quarantined": False, "watchtower_action": "DEGRADE", "quarantine_reasons": ["health<0.40"]},
    ])
    record_verification_result(kind if kind != "watchtower" else "infrastructure", [{"name": "registry_contract", "ok": True}], trigger="test")
    wt_store.set_quarantine("watchtower_demo_program", reason="manual_quarantine")
    before = _fingerprint(isolated)
    for _ in range(3):
        assert _reader().get(f"{BASE}/{kind}").status_code == 200
    assert _fingerprint(isolated) == before


def test_watchtower_read_does_not_mutate_watchtower(client, isolated, no_subprocess_no_network):
    _seed_watchtower([
        {"program_id": "arena_observation_deck", "risk_band": "RED", "quarantined": False, "watchtower_action": "DEGRADE", "quarantine_reasons": ["health<0.40"]},
    ])
    wt_store.write_attestation(kind="test", chain_root="root", payload={"n": 1})
    before = _fingerprint(isolated)
    audit_before = (isolated / "watchtower_audit.jsonl").read_bytes() if (isolated / "watchtower_audit.jsonl").exists() else b""
    _reader().get(f"{BASE}/watchtower")
    after = _fingerprint(isolated)
    assert after["counts"] == before["counts"]  # snapshots, history, quarantine, attestations
    assert after["files"] == before["files"]
    audit_after = (isolated / "watchtower_audit.jsonl").read_bytes() if (isolated / "watchtower_audit.jsonl").exists() else b""
    assert audit_after == audit_before


def test_legacy_watchtower_summary_still_evaluates_and_writes(client, isolated):
    """Control: the existing evaluation endpoint is preserved (and is why it is not polled)."""
    _seed_watchtower([{"program_id": "arena_observation_deck", "risk_band": "GREEN"}])
    before = _fingerprint(isolated)["counts"]["risk_snapshots"]
    client.get("/watchtower/summary")
    assert _fingerprint(isolated)["counts"]["risk_snapshots"] > before


def test_reads_do_not_create_missing_stores(client, isolated, no_subprocess_no_network):
    for kind in PROJECTIONS:
        _reader().get(f"{BASE}/{kind}")
    assert list(isolated.iterdir()) == []


# -------------------------------------------------------------- projections


def test_not_yet_verified_and_not_yet_evaluated(client):
    for kind in ("infrastructure", "observability"):
        body = _reader().get(f"{BASE}/{kind}").json()
        assert body["state"] == "NOT_YET_VERIFIED"
        assert body["source"]["run_on_read"] is False
    wt = _reader().get(f"{BASE}/watchtower").json()
    assert wt["state"] == "NOT_YET_EVALUATED"
    assert {p["state"] for p in wt["programs"]} == {"NOT_YET_EVALUATED"}
    assert wt["alerts"]["state"] == "NOT_PUBLISHED"


def test_watchtower_projection_reads_latest_persisted_state(isolated):
    _seed_watchtower([
        {"program_id": "arena_observation_deck", "risk_band": "GREEN", "quarantined": False},
        {"program_id": "arena_observation_deck", "risk_band": "RED", "quarantined": False, "watchtower_action": "DEGRADE", "quarantine_reasons": ["health<0.40"]},
        {"program_id": "__manual_test__", "risk_band": "QUARANTINE", "quarantined": True},
    ])
    wt_store.set_quarantine("watchtower_demo_program", reason="manual_quarantine")
    p = build_watchtower_read_projection()
    assert p["state"] == "AVAILABLE"
    by_id = {x["program_id"]: x for x in p["programs"]}
    assert by_id["arena_observation_deck"]["risk_band"] == "RED"  # latest, not first
    assert by_id["arena_observation_deck"]["reasons"] == ["health<0.40"]
    assert by_id["watchtower_demo_program"]["state"] == "NOT_YET_EVALUATED"
    ev = p["latest_evaluation"]
    assert ev["worst_risk_band"] == "RED"
    assert ev["risk_counts"] == {"GREEN": 0, "YELLOW": 0, "RED": 1, "QUARANTINE": 0}
    assert ev["evaluated_program_count"] == 1 and ev["not_evaluated_program_count"] == 1
    assert ev["staleness"]["threshold"] == "NOT_DEFINED"
    assert p["non_catalog_snapshot_program_count"] == 1  # __manual_test__ excluded, but disclosed
    assert p["manual_quarantine"]["active_count"] == 1
    assert p["latest_attestation"] == {"state": "NOT_RECORDED"}
    assert p["integrity"]["state"] == "NOT_PUBLISHED"


def test_watchtower_staleness_is_age_since_latest_evaluation(isolated):
    _seed_watchtower([{"program_id": "arena_observation_deck", "risk_band": "GREEN"}])
    later = datetime.now(timezone.utc) + timedelta(hours=3)
    age = build_watchtower_read_projection(later)["latest_evaluation"]["staleness"]["age_seconds"]
    assert 3 * 3600 - 60 <= age <= 3 * 3600 + 60


def test_verification_read_after_privileged_action(client):
    r = client.get("/admin/infra/verify", headers={"X-Admin-Key": ADMIN_KEY})
    assert r.status_code == 200
    body = _reader().get(f"{BASE}/infrastructure").json()
    assert body["state"] == "AVAILABLE"
    assert body["status"] in {"PASS", "DEGRADED", "FAIL"}
    assert body["trigger"] == "admin_infra_verify"
    names = {c["name"] for c in body["checks"]}
    assert {"registry_contract", "runtime_enforcement_lock", "gate_g_startup", "watchtower_snapshot_store_usability", "watchtower_attestation"} <= names
    # The path bug is fixed: the script-based checks actually run.
    assert next(c for c in body["checks"] if c["name"] == "registry_contract")["ok"] is True
    assert next(c for c in body["checks"] if c["name"] == "runtime_enforcement_lock")["ok"] is True
    assert next(c for c in body["checks"] if c["name"] == "watchtower_snapshot_store_usability")["ok"] is True
    assert body["degraded"] == [c["name"] for c in body["checks"] if c["ok"] is not True]
    assert isinstance(body["staleness"]["age_seconds"], int)
    text = json.dumps(body)
    for marker in LEAK_MARKERS:
        assert marker not in text


def test_observability_probe_is_fixed_and_recorded(client):
    r = client.get("/admin/observability/verify", headers={"X-Admin-Key": ADMIN_KEY})
    assert r.json()["checks"]["watchtower_probe"]["ok"] is True, r.text
    body = _reader().get(f"{BASE}/observability").json()
    assert body["state"] == "AVAILABLE"
    assert next(c for c in body["checks"] if c["name"] == "watchtower_probe")["ok"] is True
    assert body["trigger"] == "admin_observability_verify"
    text = json.dumps(body)
    for marker in LEAK_MARKERS:
        assert marker not in text


# ------------------------------------------------------------- sanitization


def test_recorded_results_never_store_raw_output(isolated):
    record_verification_result(
        "infrastructure",
        [{"name": "registry_contract", "ok": False, "reason_code": "Traceback: /Users/x/secret.py", "stderr_tail": "/Users/x"}],
        trigger="test",
    )
    raw = (isolated / "verification" / "infrastructure.latest.json").read_text()
    assert "/Users/" not in raw and "Traceback" not in raw and "stderr" not in raw
    assert read_verification_result("infrastructure")["checks"][0]["reason_code"] == "CHECK_FAILED"


@pytest.mark.parametrize(
    "value",
    [
        "/Users/someone/services/shf-agent-fabric/db/x.json",
        "Traceback (most recent call last):",
        'File "/app/main.py", line 3',
        "TypeError: missing argument",
        "ADMIN_API_KEY=abc123",
        "api_key: abcdef",
        "Bearer eyJhbGciOi.abc.def",
        "a" * 8 + "0123456789abcdef0123456789abcdef01234567",
        "C:\\Users\\x",
    ],
)
def test_sanitizer_redacts_unsafe_strings(value):
    assert sanitize_mod.sanitize({"note": value}) == {"note": sanitize_mod.REDACTED}


def test_sanitizer_drops_blocked_keys_and_keeps_safe_values():
    out = sanitize_mod.sanitize({"stderr_tail": "x", "baseUrl": "http://h", "kid": "k1", "ok": True, "reason_code": "CHECK_FAILED", "program_id": "arena_observation_deck", "reasons": ["health<0.40"], "at": "2026-09-01T21:40:54.865068Z"})
    assert out == {"ok": True, "reason_code": "CHECK_FAILED", "program_id": "arena_observation_deck", "reasons": ["health<0.40"], "at": "2026-09-01T21:40:54.865068Z"}


def test_projection_failure_returns_code_without_exception_text(client, monkeypatch):
    import fabric.watchtower.read_projection as rp

    def boom(*_a, **_k):
        raise RuntimeError("secret detail at /Users/x/var/store.sqlite")

    monkeypatch.setattr(rp, "build_watchtower_read_projection", boom)
    r = _reader().get(f"{BASE}/watchtower")
    assert r.status_code == 503
    assert r.json() == {"contract": "afcc.read.v1", "kind": "watchtower", "read_only": True, "state": "BACKEND_ERROR", "reason_code": "PROJECTION_READ_FAILED"}


def test_unreadable_record_is_backend_error_not_fabricated(client, isolated):
    d = isolated / "verification"
    d.mkdir()
    (d / "observability.latest.json").write_text("{not json")
    body = _reader().get(f"{BASE}/observability").json()
    assert body["state"] == "BACKEND_ERROR"
    assert body["reason_code"] == "VERIFICATION_RECORD_UNREADABLE"
    assert "status" not in body and "checks" not in body
