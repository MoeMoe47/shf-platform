from __future__ import annotations

"""
Regression guard: the test suite never touches the developer's real Watchtower
persistence (see tests/conftest.py, "Watchtower test isolation").

Watchtower writes risk snapshots, risk history and audit lines when its
evaluating GET /watchtower/summary runs. Before isolation, route tests wrote those
into var/watchtower_store.sqlite (the store the Command Center reads) and the
tracked var/watchtower_audit.jsonl.
"""

import hashlib
import sqlite3

import pytest
from fastapi.testclient import TestClient

from fabric.watchtower import attestation_core, audit, chain_root, snapshot_verify, store
from main import app  # type: ignore

from conftest import REAL_WATCHTOWER_FILES, RealWatchtowerStoreAccess, SERVICE_ROOT


def _fingerprint(path):
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.exists() else None


def test_every_watchtower_path_resolves_into_the_per_test_directory(_isolated_watchtower_store):
    resolved = {
        "store": store._db_path(),
        "chain_root": chain_root._db_path(),
        "attestation_core": attestation_core._db_path(),
        "audit": audit._audit_path(),
        "snapshot_verify": snapshot_verify._db_path(),
    }
    for name, path in resolved.items():
        assert _isolated_watchtower_store in path.parents, f"{name} resolves to {path}"
        assert SERVICE_ROOT not in path.parents, f"{name} resolves inside the service tree: {path}"


def test_evaluating_summary_writes_only_to_the_isolated_store(_isolated_watchtower_store):
    before = {name: _fingerprint(path) for name, path in REAL_WATCHTOWER_FILES.items()}
    body = TestClient(app).get("/watchtower/summary").json()
    assert isinstance(body, dict)
    isolated_store = _isolated_watchtower_store / "watchtower_store.sqlite"
    assert isolated_store.exists(), "the evaluation wrote to the isolated store"
    conn = sqlite3.connect(isolated_store)
    try:
        assert conn.execute("select count(*) from risk_snapshots").fetchone()[0] > 0
    finally:
        conn.close()
    assert (_isolated_watchtower_store / "watchtower_audit.jsonl").exists(), "audit lines went to the isolated journal"
    after = {name: _fingerprint(path) for name, path in REAL_WATCHTOWER_FILES.items()}
    assert after == before, "real Watchtower store, audit journal and snapshot DB are untouched"


def test_each_test_gets_a_fresh_store(_isolated_watchtower_store):
    assert not (_isolated_watchtower_store / "watchtower_store.sqlite").exists()


@pytest.mark.parametrize("name", ["store", "snapshot_db"])
def test_guard_refuses_the_real_watchtower_databases(name):
    real = REAL_WATCHTOWER_FILES[name]
    with pytest.raises(RealWatchtowerStoreAccess):
        sqlite3.connect(real)
    with pytest.raises(RealWatchtowerStoreAccess):
        sqlite3.connect(f"file:{real}?mode=ro", uri=True)


def test_guard_still_allows_other_databases(tmp_path):
    conn = sqlite3.connect(tmp_path / "other.sqlite")
    conn.execute("create table t (x int)")
    conn.close()
    sqlite3.connect(":memory:").close()


def test_clearing_the_env_cannot_fall_back_to_the_real_store(monkeypatch):
    # If a test removes the override, the default path is the real store, and the guard stops it.
    monkeypatch.delenv("SHF_WATCHTOWER_STORE_PATH")
    assert store._db_path() == REAL_WATCHTOWER_FILES["store"].resolve()
    with pytest.raises(RealWatchtowerStoreAccess):
        store._connect()  # Watchtower's own connection path
