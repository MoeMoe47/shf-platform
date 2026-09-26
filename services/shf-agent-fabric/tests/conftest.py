from __future__ import annotations

import os
import sys
from pathlib import Path

# Ensure service package root is importable so tests can do:
#   from fabric... import ...
SERVICE_ROOT = Path(__file__).resolve().parents[1]  # .../services/shf-agent-fabric
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

# Also help subprocess-based tests / tools that read PYTHONPATH
os.environ.setdefault("PYTHONPATH", str(SERVICE_ROOT))


# ---------------------------------------------------------------------------
# Watchtower test isolation (AFCC Watchtower test isolation).
#
# Watchtower persists to three places, each overridable by env:
#   SHF_WATCHTOWER_STORE_PATH        default var/watchtower_store.sqlite  (gitignored; the store the
#                                     Command Center reads: snapshots, history, quarantine, attestations)
#   SHF_WATCHTOWER_AUDIT_PATH        default var/watchtower_audit.jsonl   (TRACKED)
#   SHF_WATCHTOWER_SNAPSHOT_DB_PATH  default data/watchtower.db           (gitignored snapshot self-check)
# Several route tests call the evaluating GET /watchtower/summary, which writes
# risk snapshots, history and audit lines. Without isolation those landed in the
# developer's real local store and the tracked audit journal.
#
# 1. A session default is set at import time, before any test imports the app.
# 2. Every test gets its own fresh Watchtower directory (tests that set their own
#    paths with monkeypatch still win, because their fixtures run later).
# 3. A guard refuses SQLite connections to the real Watchtower databases.
# 4. The session fails if any real Watchtower file changed during the run.
# ---------------------------------------------------------------------------
import hashlib
import shutil
import sqlite3
import tempfile

import pytest

WATCHTOWER_ENV = {
    "SHF_WATCHTOWER_STORE_PATH": "watchtower_store.sqlite",
    "SHF_WATCHTOWER_AUDIT_PATH": "watchtower_audit.jsonl",
    "SHF_WATCHTOWER_SNAPSHOT_DB_PATH": "watchtower_snapshots.db",
}
REAL_WATCHTOWER_FILES = {
    "store": SERVICE_ROOT / "var" / "watchtower_store.sqlite",
    "audit": SERVICE_ROOT / "var" / "watchtower_audit.jsonl",
    "snapshot_db": SERVICE_ROOT / "data" / "watchtower.db",
}
_REAL_DATABASES = {REAL_WATCHTOWER_FILES["store"].resolve(), REAL_WATCHTOWER_FILES["snapshot_db"].resolve()}

_SESSION_DIR = Path(tempfile.mkdtemp(prefix="shf-watchtower-tests-"))
for _name, _file in WATCHTOWER_ENV.items():
    os.environ[_name] = str(_SESSION_DIR / _file)


class RealWatchtowerStoreAccess(AssertionError):
    """A test tried to open the developer's real Watchtower database."""


def _fingerprint(path: Path):
    if not path.exists():
        return None
    return hashlib.sha256(path.read_bytes()).hexdigest()


_REAL_BEFORE: dict = {}
_real_connect = sqlite3.connect


def _guarded_connect(database, *args, **kwargs):
    target = str(database)
    if target.startswith("file:"):
        target = target[5:].split("?", 1)[0]
    if target not in (":memory:", ""):
        try:
            if Path(target).expanduser().resolve() in _REAL_DATABASES:
                raise RealWatchtowerStoreAccess(f"test opened the real Watchtower database: {target}")
        except (OSError, ValueError):
            pass
    return _real_connect(database, *args, **kwargs)


def pytest_sessionstart(session):
    _REAL_BEFORE.update({name: _fingerprint(path) for name, path in REAL_WATCHTOWER_FILES.items()})
    sqlite3.connect = _guarded_connect


def pytest_sessionfinish(session, exitstatus):
    sqlite3.connect = _real_connect
    changed = [name for name, path in REAL_WATCHTOWER_FILES.items() if _fingerprint(path) != _REAL_BEFORE.get(name)]
    shutil.rmtree(_SESSION_DIR, ignore_errors=True)
    if changed:
        session.config._watchtower_contamination = changed  # type: ignore[attr-defined]
        session.exitstatus = pytest.ExitCode.TESTS_FAILED


def pytest_terminal_summary(terminalreporter):
    changed = getattr(terminalreporter.config, "_watchtower_contamination", None)
    if changed:
        terminalreporter.write_line(f"WATCHTOWER CONTAMINATION: the test run changed real Watchtower files: {', '.join(changed)}", red=True)


@pytest.fixture(autouse=True)
def _isolated_watchtower_store(tmp_path_factory, monkeypatch):
    directory = tmp_path_factory.mktemp("watchtower")
    for name, filename in WATCHTOWER_ENV.items():
        monkeypatch.setenv(name, str(directory / filename))
    yield directory
