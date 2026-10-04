from __future__ import annotations

"""
AFCC-3 Phase 5 — shared Postgres run authority (real PostgreSQL, no mocks).

Opt-in like the repo's other runtime PG proofs: SHF_RUNTIME_PG_PROOF=1. A
throwaway database is created per module, migration 149 is applied from the
SHS migrations directory, and the database is dropped afterwards.

Proves with independent connections / processes (never an in-process mutex):
exactly one execution claim per plan; one start event; conditional reclaim
has one winner; terminal close is fenced and idempotent; approval decisions
are final under races; every failure point leaves a truthful lifecycle; two
application instances with separate filesystems share one authority.
"""

import json
import os
import secrets
import subprocess
import sys
import textwrap
import threading
import time
from pathlib import Path

import pytest

pytestmark = pytest.mark.skipif(os.getenv("SHF_RUNTIME_PG_PROOF") != "1", reason="explicit PostgreSQL runtime proof opt-in")

psycopg = pytest.importorskip("psycopg")
from fastapi.testclient import TestClient  # noqa: E402

from auth import permissions as perms  # noqa: E402
from auth.audit import _EVENTS  # noqa: E402
from auth.config import get_auth_settings  # noqa: E402
from auth.sessions import _SESSIONS, create_session  # noqa: E402
from auth.store import AuthUser  # noqa: E402
from fabric import run_authority, run_authority_pg as pg  # noqa: E402
from fabric.command.live_operations import live_runs_projection, run_detail_projection, run_timeline_projection  # noqa: E402
from main import app  # type: ignore  # noqa: E402

SERVICE_ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = [SERVICE_ROOT.parents[1] / "apps" / "shs-api" / "migrations" / name
              for name in ("149_fabric_run_authority.sql", "150_fabric_run_artifacts.sql")]
ADMIN_DSN = os.getenv("SHF_PG_ADMIN_URL", "postgresql://localhost:5432/postgres")
ADMIN_KEY = "phase5-admin-key-must-not-authorize"
CREATOR, APPROVER = "u-creator", "u-approver"
TABLES = ("fabric_run_artifacts", "fabric_run_events", "fabric_execution_claims", "fabric_plan_decisions", "fabric_plans")


@pytest.fixture(scope="module")
def database():
    name = f"afcc_phase5_{secrets.token_hex(4)}"
    with psycopg.connect(ADMIN_DSN, autocommit=True) as admin:
        admin.execute(f"CREATE DATABASE {name}")
    dsn = ADMIN_DSN.rsplit("/", 1)[0] + f"/{name}"
    with psycopg.connect(dsn, autocommit=True) as conn:
        for migration in MIGRATIONS:
            conn.execute(migration.read_text())
            conn.execute(migration.read_text())  # idempotent, like every SHS migration
    yield dsn
    with psycopg.connect(ADMIN_DSN, autocommit=True) as admin:
        admin.execute("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = %s AND pid <> pg_backend_pid()", (name,))
        admin.execute(f"DROP DATABASE {name}")


@pytest.fixture()
def env(database, monkeypatch, tmp_path):
    import fabric.plan_store as plan_store
    import routers.runs_routes as runs_routes

    with psycopg.connect(database, autocommit=True) as conn:
        conn.execute("TRUNCATE " + ", ".join(TABLES))
    monkeypatch.setenv("SHF_RUN_AUTHORITY_STORAGE", "postgres")
    monkeypatch.setenv("SHF_DATABASE_URL", database)
    monkeypatch.setenv("ADMIN_API_KEY", ADMIN_KEY)
    monkeypatch.delenv("FABRIC_RUN_LEASE_SECONDS", raising=False)
    files = {"plans": tmp_path / "plans", "log": tmp_path / "runs" / "events.jsonl", "artifacts": tmp_path / "artifacts"}
    monkeypatch.setattr(plan_store, "PLANS_DIR", files["plans"])
    monkeypatch.setattr(runs_routes, "PLANS_DIR", files["plans"])
    monkeypatch.setattr(runs_routes, "ARTIFACTS_DIR", files["artifacts"])
    monkeypatch.setattr(runs_routes, "RUNS_LOG", files["log"])
    monkeypatch.setattr(runs_routes, "assert_global_execution_allowed", lambda route: None)
    _SESSIONS.clear()
    _EVENTS.clear()
    yield {"dsn": database, **files, "claims": tmp_path / "runs" / "claims"}
    _SESSIONS.clear()
    _EVENTS.clear()


def q(env, sql: str, *params):
    with psycopg.connect(env["dsn"], autocommit=True) as conn:
        cur = conn.execute(sql, params)
        return cur.fetchall() if cur.description else []


def _client(user_id: str, role: str = "shs_admin", org: str | None = None) -> TestClient:
    token, session = create_session(AuthUser(user_id=user_id, email=f"{user_id}@test.invalid", display_name=user_id,
                                             role=role, password_hash="", organization_id=org))
    c = TestClient(app)
    c.cookies.set(get_auth_settings().cookie_name, token)
    c.headers.update({"x-csrf-token": session.csrf_token})
    c.secret_material = (token, session.csrf_token)  # type: ignore[attr-defined]
    return c


def _clone(c: TestClient) -> TestClient:
    other = TestClient(app)
    other.cookies.update(c.cookies)
    other.headers.update({"x-csrf-token": c.headers["x-csrf-token"]})
    return other


def _approved_plan(**headers) -> str:
    res = _client(CREATOR).post("/plan", json={"agentName": "UnregisteredTestAgent", "input": {"x": 1}}, headers=headers)
    assert res.status_code == 200, res.text
    plan_id = res.json()["planId"]
    assert _client(APPROVER).post(f"/plan/{plan_id}/approve").status_code == 200
    return plan_id


def _events(env, run_id: str | None = None) -> list[dict]:
    rows = q(env, "SELECT payload FROM fabric_run_events WHERE (%s::text IS NULL OR run_id = %s) ORDER BY event_at, seq", run_id, run_id)
    return [r[0] for r in rows]


def _no_file_writes(env) -> None:
    assert not env["plans"].exists(), "plans never touch the file store"
    assert not env["log"].exists(), "run events never touch the JSONL log"
    assert not env["claims"].exists(), "claims never touch the file store"


class _Gate:
    """Holds the winning execution inside its work (after producing an artifact)."""

    def __init__(self, monkeypatch):
        import routers.runs_routes as runs_routes

        self.entered, self.release = threading.Event(), threading.Event()

        def gated(artifact_id):
            self.entered.set()
            assert self.release.wait(15)

        monkeypatch.setattr(runs_routes, "_on_artifact_produced", gated)


# ================================================================ authority basics


def test_mode_selection_and_production_has_no_file_fallback(monkeypatch):
    monkeypatch.delenv("SHF_RUN_AUTHORITY_STORAGE", raising=False)
    monkeypatch.setenv("SHS_AUTH_ENV", "development")
    assert run_authority.storage_mode() == "file"
    monkeypatch.setenv("SHF_RUN_AUTHORITY_STORAGE", "postgres")
    assert run_authority.storage_mode() == "postgres"
    monkeypatch.setenv("SHS_AUTH_ENV", "production")
    monkeypatch.setenv("SHF_RUN_AUTHORITY_STORAGE", "file")
    assert run_authority.storage_mode() == "postgres", "production never uses the file store"
    monkeypatch.delenv("SHF_DATABASE_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    with pytest.raises(pg.RunAuthorityUnavailable) as exc:
        pg.load_plan("any")
    assert exc.value.status_code == 503 and exc.value.detail == "RUN_AUTHORITY_UNAVAILABLE"


def test_plan_decision_and_execution_live_in_postgres_only(env):
    corr = "corr-phase5-chain-01"
    plan_id = _approved_plan(**{"X-Correlation-Id": corr})
    run = _client(APPROVER).post("/runs/execute", json={"planId": plan_id})
    assert run.status_code == 200, run.text
    run_id = run.json()["runId"]
    _no_file_writes(env)

    (status, approved, creator, version), = q(env, "SELECT status, approved, creator_actor_id, version FROM fabric_plans WHERE plan_id = %s", plan_id)
    assert (status, approved, creator) == ("DONE", True, CREATOR) and version == 3  # create, approve, done
    (decision, approver, dcorr), = q(env, "SELECT decision, approver_actor_id, correlation_id FROM fabric_plan_decisions WHERE plan_id = %s", plan_id)
    assert (decision, approver, dcorr) == ("APPROVED", APPROVER, corr)
    (claim_run, released, reason, cversion), = q(env, "SELECT run_id, released_at IS NOT NULL, release_reason, claim_version FROM fabric_execution_claims WHERE plan_id = %s", plan_id)
    assert (claim_run, released, reason, cversion) == (run_id, True, "COMPLETED", 1)
    events = _events(env, run_id)
    assert [(e["event_type"], e["seq"]) for e in events] == [("run.execution_started", 1), ("run.completed", 2)]
    assert {e["correlation_id"] for e in events} == {corr}
    assert all("path" not in a for e in events for a in e.get("artifacts", [])), "no server paths in the shared store"

    detail = run_detail_projection(run_id)
    assert detail["run"]["current_state"] == "COMPLETED"
    assert detail["run"]["source"]["record_origin"] == "POSTGRES_RUN_AUTHORITY"
    assert detail["run"]["execution_lease"]["scope"] == "SHARED_TRANSACTIONAL_STORE"
    assert detail["run"]["approval"]["decision"]["approver_actor_id"] == APPROVER
    assert detail["run"]["correlation"]["continuity"] == "CONSISTENT"
    safety = detail["execution_safety"]
    assert (safety["level"], safety["distributed_single_flight"], safety["scope"]) == ("DISTRIBUTED", "GUARANTEED", "SHARED_TRANSACTIONAL_STORE")
    assert safety["artifact_storage"] == "SHARED_POSTGRES_RUN_ARTIFACTS"  # Phase 6
    assert [e["to_state"] for e in run_timeline_projection(run_id)["events"]] == ["APPROVAL_REQUIRED", "APPROVED", "EXECUTING", "COMPLETED"]


def test_policy_b_and_declared_identity_preserved(env):
    creator = _client(CREATOR)
    plan_id = creator.post("/plan", json={"agentName": "A", "input": {"x": 1, "actor_id": "ceo"}}).json()["planId"]
    assert creator.post(f"/plan/{plan_id}/approve", json={"approver_id": "someone"}).json()["detail"] == "SELF_APPROVAL_DENIED"
    assert q(env, "SELECT count(*) FROM fabric_plan_decisions")[0][0] == 0
    assert _client(APPROVER).post(f"/plan/{plan_id}/approve", json={"actor_id": CREATOR}).status_code == 200
    (doc,), = q(env, "SELECT document FROM fabric_plans WHERE plan_id = %s", plan_id)
    assert doc["declared_identity"] == {"actor_id": "ceo", "verification": "DECLARED"}
    assert doc["createdBy"]["identity_verification"]["actor"] == "VERIFIED"
    assert doc["approvalDecision"]["approver_actor_id"] == APPROVER and len(doc["approvalHistory"]) == 1
    assert _client("u-third").post(f"/plan/{plan_id}/reject").json()["detail"] == "DECISION_ALREADY_RECORDED"


def test_approval_decision_race_has_one_winner(env):
    plan_id = _client(CREATOR).post("/plan", json={"agentName": "A", "input": {}}).json()["planId"]
    approvers = [_client(f"u-approver-{i}") for i in range(6)]
    barrier = threading.Barrier(len(approvers))
    out = [None] * len(approvers)

    def decide(i):
        barrier.wait()
        out[i] = approvers[i].post(f"/plan/{plan_id}/{'approve' if i % 2 else 'reject'}")

    threads = [threading.Thread(target=decide, args=(i,)) for i in range(len(approvers))]
    [t.start() for t in threads]
    [t.join(20) for t in threads]
    codes = sorted(r.status_code for r in out)
    assert codes == [200] + [409] * 5, codes
    assert {r.json()["detail"] for r in out if r.status_code == 409} == {"DECISION_ALREADY_RECORDED"}
    assert q(env, "SELECT count(*) FROM fabric_plan_decisions WHERE plan_id = %s", plan_id)[0][0] == 1


# ================================================================ two-connection concurrency


def test_raw_conditional_claim_upsert_is_atomic_across_two_connections(env):
    """Pure SQL: connection B's claim blocks on A's uncommitted row and then loses."""
    q(env, "INSERT INTO fabric_plans (plan_id, status, approval_required, document) VALUES ('raw-plan', 'APPROVED', true, '{}')")
    upsert = """INSERT INTO fabric_execution_claims (plan_id, run_id, claimed_by_actor_id, lease_started_at, lease_expires_at)
                VALUES ('raw-plan', %s, 'u', clock_timestamp(), clock_timestamp() + interval '300 seconds')
                ON CONFLICT (plan_id) DO UPDATE SET run_id = EXCLUDED.run_id, claim_version = fabric_execution_claims.claim_version + 1, released_at = NULL
                WHERE fabric_execution_claims.released_at IS NOT NULL
                   OR fabric_execution_claims.lease_expires_at + interval '60 seconds' <= clock_timestamp()
                RETURNING run_id"""
    a = psycopg.connect(env["dsn"])
    b_result = {}
    try:
        assert a.execute(upsert, ("run-a",)).fetchone() == ("run-a",)  # A holds its transaction open

        def b():
            with psycopg.connect(env["dsn"]) as conn:
                b_result["row"] = conn.execute(upsert, ("run-b",)).fetchone()
                conn.commit()

        t = threading.Thread(target=b)
        t.start()
        time.sleep(0.5)
        assert t.is_alive(), "B must be blocked by A's uncommitted claim"
        a.commit()
        t.join(10)
    finally:
        a.close()
    assert b_result["row"] is None, "B's conditional upsert affected no row"
    assert q(env, "SELECT run_id, claim_version FROM fabric_execution_claims") == [("run-a", 1)]


def _begin(plan_id: str, run_id: str, *, admit=lambda p: None):
    return pg.begin_execution(
        plan_id=plan_id, run_id=run_id, actor_id="u-exec", correlation_id="corr-begin-000001", lease_seconds=300, admit=admit,
        start_event=lambda plan, lease: {"runId": run_id, "planId": plan_id, "event_id": f"evt_{run_id}", "event_type": "run.execution_started",
                                         "schema_version": "fabric.run_event.v4", "to_state": "EXECUTING", "lease_expires_at": lease["lease_expires_at"]},
        orphan_event=lambda prev: {"runId": prev["run_id"], "planId": plan_id, "event_id": f"orphan_{prev['run_id']}_{run_id}",
                                   "event_type": "run.lease_expired", "schema_version": "fabric.run_event.v4", "to_state": "ORPHANED"},
    )


@pytest.mark.parametrize("n", [2, 8])
def test_n_independent_connections_exactly_one_claim(env, monkeypatch, n):
    plan_id = _approved_plan()
    barrier = threading.Barrier(n)
    wins, losses = [], []

    def slow_after_claim(point):
        if point == "begin_after_claim":
            time.sleep(0.3)  # keep the winner's transaction open while the others arrive

    monkeypatch.setattr(pg, "_fault", slow_after_claim)

    def attempt(i):
        barrier.wait()
        try:
            wins.append(_begin(plan_id, f"run{i:02d}").run_id)
        except pg.ClaimHeld:
            losses.append(i)

    threads = [threading.Thread(target=attempt, args=(i,)) for i in range(n)]
    [t.start() for t in threads]
    [t.join(30) for t in threads]
    assert len(wins) == 1 and len(losses) == n - 1
    assert q(env, "SELECT count(*) FROM fabric_run_events WHERE event_type = 'run.execution_started'")[0][0] == 1
    assert q(env, "SELECT run_id FROM fabric_execution_claims WHERE released_at IS NULL") == [(wins[0],)]


def test_eight_concurrent_http_executions_one_winner_one_artifact_path(env, monkeypatch):
    plan_id = _approved_plan()
    gate = _Gate(monkeypatch)
    approver = _client(APPROVER)
    n = 8
    barrier = threading.Barrier(n)
    out = [None] * n
    clients = [_clone(approver) for _ in range(n)]

    def fire(i):
        barrier.wait()
        out[i] = clients[i].post("/runs/execute", json={"planId": plan_id})

    threads = [threading.Thread(target=fire, args=(i,)) for i in range(n)]
    [t.start() for t in threads]
    assert gate.entered.wait(15)
    deadline = time.time() + 15
    while sum(r is not None for r in out) < n - 1 and time.time() < deadline:
        time.sleep(0.02)
    gate.release.set()
    [t.join(15) for t in threads]
    codes = sorted(r.status_code for r in out)
    assert codes == [200] + [409] * (n - 1), codes
    assert {r.json()["detail"] for r in out if r.status_code == 409} == {"RUN_ALREADY_EXECUTING"}
    assert q(env, "SELECT count(*) FROM fabric_run_events WHERE event_type = 'run.execution_started'")[0][0] == 1
    assert q(env, "SELECT count(*) FROM fabric_run_artifacts")[0][0] == 1, "only one artifact execution path ran"
    assert not env["artifacts"].exists(), "no replica-local artifact files"


def test_expired_claim_reclaim_race_has_one_winner_and_preserves_old_run(env):
    plan_id = _approved_plan()
    _begin(plan_id, "crashed-run")  # a process that committed its start and died
    q(env, "UPDATE fabric_execution_claims SET lease_started_at = now() - interval '2 hours', lease_expires_at = now() - interval '1 hour' WHERE plan_id = %s", plan_id)
    n = 8
    barrier = threading.Barrier(n)
    wins, losses = [], []

    def attempt(i):
        barrier.wait()
        try:
            begun = _begin(plan_id, f"reclaim{i:02d}")
            wins.append((begun.run_id, begun.reclaimed_run_id))
        except pg.ClaimHeld:
            losses.append(i)

    threads = [threading.Thread(target=attempt, args=(i,)) for i in range(n)]
    [t.start() for t in threads]
    [t.join(30) for t in threads]
    assert len(wins) == 1 and len(losses) == n - 1
    assert wins[0][1] == "crashed-run"
    assert q(env, "SELECT claim_version, run_id FROM fabric_execution_claims WHERE plan_id = %s", plan_id) == [(2, wins[0][0])]
    old = _events(env, "crashed-run")
    assert [e["event_type"] for e in old] == ["run.execution_started", "run.lease_expired"], "old evidence kept; never FAILED/COMPLETED"


def test_live_claim_is_not_reclaimable_before_lease_plus_grace(env):
    plan_id = _approved_plan()
    _begin(plan_id, "live-run")
    q(env, "UPDATE fabric_execution_claims SET lease_started_at = now() - interval '10 minutes', lease_expires_at = now() - interval '10 seconds'")
    with pytest.raises(pg.ClaimHeld):
        _begin(plan_id, "too-early")  # expired, but inside the 60 s grace


# ================================================================ terminal fencing


def test_stale_executor_is_fenced_and_cannot_complete(env):
    plan_id = _approved_plan()
    approver = _client(APPROVER)
    import routers.runs_routes as runs_routes

    real_steps = runs_routes._Work.run_steps

    def steps_then_lose_claim(self, checkpoint):
        real_steps(self, checkpoint)
        # While this executor works, its lease expires and another replica reclaims.
        q(env, "UPDATE fabric_execution_claims SET lease_started_at = now() - interval '2 hours', lease_expires_at = now() - interval '1 hour'")
        _begin(plan_id, "replacement-run")

    runs_routes._Work.run_steps = steps_then_lose_claim
    try:
        res = approver.post("/runs/execute", json={"planId": plan_id})
    finally:
        runs_routes._Work.run_steps = real_steps
    assert res.status_code == 504 and res.json()["detail"] == "RUN_TIMED_OUT"
    stale_run = [e for e in _events(env) if e["event_type"] == "run.timed_out"][0]
    assert stale_run["fenced"] is True and stale_run["reason_code"] == "CLAIM_FENCED"
    assert q(env, "SELECT status FROM fabric_plans WHERE plan_id = %s", plan_id) == [("APPROVED",)], "stale executor never marks DONE"
    assert q(env, "SELECT run_id, released_at IS NULL FROM fabric_execution_claims") == [("replacement-run", True)], "the new owner's claim is untouched"
    assert "run.completed" not in {e["event_type"] for e in _events(env)}


def test_terminal_close_race_records_exactly_one_terminal(env):
    plan_id = _approved_plan()
    begun = _begin(plan_id, "double-close")
    barrier = threading.Barrier(4)
    results = []

    def close(outcome):
        barrier.wait()
        results.append(pg.close_execution(
            plan_id=plan_id, run_id="double-close", claim_version=begun.claim_version, outcome=outcome,
            terminal_event=lambda final, fenced: {"runId": "double-close", "planId": plan_id, "event_id": f"t_{secrets.token_hex(6)}",
                                                  "event_type": {"COMPLETED": "run.completed", "FAILED": "run.execution_failed", "TIMED_OUT": "run.timed_out"}[final],
                                                  "schema_version": "fabric.run_event.v4", "to_state": final, "outcome": "ok" if final == "COMPLETED" else "error"},
            complete_plan=lambda doc: doc.update(status="DONE", approved=True)))

    threads = [threading.Thread(target=close, args=(o,)) for o in ("COMPLETED", "COMPLETED", "FAILED", "COMPLETED")]
    [t.start() for t in threads]
    [t.join(20) for t in threads]
    terminals = [e for e in _events(env, "double-close") if e["event_type"] in pg.TERMINAL_EVENT_TYPES]
    assert len(terminals) == 1 and len(set(results)) == 1, (terminals, results)
    assert q(env, "SELECT count(*) FROM fabric_execution_claims WHERE released_at IS NULL")[0][0] == 0


# ================================================================ failure atomicity


@pytest.mark.parametrize("point", ["begin_before_plan_lock", "begin_after_plan_lock", "begin_before_claim", "begin_after_claim",
                                   "event:run.execution_started", "begin_before_commit"])
def test_failure_inside_begin_transaction_leaves_nothing(env, monkeypatch, point):
    plan_id = _approved_plan()

    class Boom(RuntimeError):
        pass

    def fault(p):
        if p == point:
            raise Boom(point)

    monkeypatch.setattr(pg, "_fault", fault)
    with pytest.raises(Boom):
        _client(APPROVER).post("/runs/execute", json={"planId": plan_id})
    assert q(env, "SELECT count(*) FROM fabric_execution_claims")[0][0] == 0, "claim rolled back"
    assert q(env, "SELECT count(*) FROM fabric_run_events")[0][0] == 0, "no start event"
    assert q(env, "SELECT status FROM fabric_plans WHERE plan_id = %s", plan_id) == [("APPROVED",)]
    monkeypatch.setattr(pg, "_fault", lambda p: None)
    assert _client(APPROVER).post("/runs/execute", json={"planId": plan_id}).status_code == 200, "plan still executable"


def test_failure_before_transaction_is_503_and_writes_nothing(env, monkeypatch):
    plan_id = _approved_plan()
    monkeypatch.setenv("SHF_DATABASE_URL", "postgresql://localhost:1/unreachable")
    res = _client(APPROVER).post("/runs/execute", json={"planId": plan_id})
    assert res.status_code == 503 and res.json()["detail"] == "RUN_AUTHORITY_UNAVAILABLE"
    monkeypatch.setenv("SHF_DATABASE_URL", env["dsn"])
    assert q(env, "SELECT count(*) FROM fabric_run_events")[0][0] == 0


def test_crash_after_commit_before_work_is_executing_then_orphaned(env):
    plan_id = _approved_plan()
    _begin(plan_id, "died-after-commit")  # start committed, process gone
    run = run_detail_projection("died-after-commit")["run"]
    assert run["current_state"] == "EXECUTING" and run["execution_lease"]["status"] == "ACTIVE"
    assert _client(APPROVER).post("/runs/execute", json={"planId": plan_id}).json()["detail"] == "RUN_ALREADY_EXECUTING"
    # Only the start event carries the lease the projection reads; expire both.
    q(env, "UPDATE fabric_execution_claims SET lease_started_at = now() - interval '2 hours', lease_expires_at = now() - interval '1 hour'")
    q(env, "UPDATE fabric_run_events SET payload = jsonb_set(payload, '{lease_expires_at}', to_jsonb((now() - interval '1 hour')::text)) WHERE run_id = 'died-after-commit'")
    orphan = run_detail_projection("died-after-commit")["run"]
    assert orphan["current_state"] == "ORPHANED" and orphan["failed_at"] == "NOT_AVAILABLE"
    res = _client(APPROVER).post("/runs/execute", json={"planId": plan_id})
    assert res.status_code == 200
    assert run_detail_projection("died-after-commit")["run"]["state_derivation"]["reason_code"] == "ORPHAN_RECORDED"
    assert run_detail_projection(res.json()["runId"])["run"]["current_state"] == "COMPLETED"


def test_failure_during_artifact_work_records_failed_and_releases(env, monkeypatch):
    import routers.runs_routes as runs_routes

    plan_id = _approved_plan()
    monkeypatch.setattr(runs_routes, "_on_artifact_produced", lambda a: (_ for _ in ()).throw(OSError("step at /srv/secret")))
    with pytest.raises(OSError):
        _client(APPROVER).post("/runs/execute", json={"planId": plan_id})
    events = _events(env)
    assert [e["event_type"] for e in events] == ["run.execution_started", "run.execution_failed"]
    assert events[1]["failure_code"] == "EXECUTION_STEP_FAILED" and "/srv/" not in json.dumps(events)
    # The artifact produced before the failure is kept as PARTIAL evidence of the failed run.
    assert q(env, "SELECT completeness FROM fabric_run_artifacts") == [("PARTIAL",)]
    assert q(env, "SELECT release_reason FROM fabric_execution_claims") == [("FAILED",)]
    assert q(env, "SELECT status FROM fabric_plans WHERE plan_id = %s", plan_id) == [("APPROVED",)]


@pytest.mark.parametrize("point", ["close_before_event", "event:run.completed", "close_before_release", "close_before_commit"])
def test_failure_inside_terminal_transaction_rolls_back_whole_close(env, monkeypatch, point):
    plan_id = _approved_plan()

    class Boom(RuntimeError):
        pass

    def fault(p):
        if p == point:
            raise Boom(point)

    monkeypatch.setattr(pg, "_fault", fault)
    with pytest.raises(Boom):
        _client(APPROVER).post("/runs/execute", json={"planId": plan_id})
    types = [e["event_type"] for e in _events(env)]
    assert types == ["run.execution_started"], "no terminal event, and no FAILED invented for completed work"
    assert q(env, "SELECT status FROM fabric_plans WHERE plan_id = %s", plan_id) == [("APPROVED",)], "no DONE without its event"
    assert q(env, "SELECT released_at IS NULL FROM fabric_execution_claims") == [(True,)], "claim still held"
    run_id = _events(env)[0]["runId"]
    assert run_detail_projection(run_id)["run"]["current_state"] == "EXECUTING"


def test_deadline_timeout_closes_in_one_transaction(env, monkeypatch):
    import routers.runs_routes as runs_routes
    from datetime import timedelta

    from fabric import run_claims

    plan_id = _approved_plan()
    def slow(artifact_id):
        monkeypatch.setattr(run_claims, "now", lambda: run_claims.datetime.now(run_claims.timezone.utc) + timedelta(hours=2))

    monkeypatch.setattr(runs_routes, "_on_artifact_produced", slow)
    res = _client(APPROVER).post("/runs/execute", json={"planId": plan_id})
    assert res.status_code == 504 and res.json()["detail"] == "RUN_TIMED_OUT"
    assert [e["event_type"] for e in _events(env)] == ["run.execution_started", "run.timed_out"]
    assert q(env, "SELECT release_reason FROM fabric_execution_claims") == [("TIMED_OUT",)]
    assert q(env, "SELECT status FROM fabric_plans") == [("APPROVED",)]


# ================================================================ multi-instance


INSTANCE = textwrap.dedent("""
    import json, os, sys, time
    from pathlib import Path
    root, plan_id, release = Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3])
    os.environ["SHF_RUN_AUTHORITY_STORAGE"] = "postgres"
    from fastapi.testclient import TestClient
    import fabric.plan_store as plan_store, routers.runs_routes as rr
    from auth.sessions import create_session; from auth.store import AuthUser; from auth.config import get_auth_settings
    from main import app
    plan_store.PLANS_DIR = rr.PLANS_DIR = root / "plans"; rr.ARTIFACTS_DIR = root / "artifacts"; rr.RUNS_LOG = root / "runs" / "events.jsonl"
    rr.assert_global_execution_allowed = lambda route: None
    def gated(artifact_id):
        print("ENTERED", flush=True)
        for _ in range(300):
            if release.exists(): break
            time.sleep(0.05)
    rr._on_artifact_produced = gated
    token, s = create_session(AuthUser(user_id="u-approver", email="a@x.invalid", display_name="a", role="shs_admin", password_hash=""))
    c = TestClient(app); c.cookies.set(get_auth_settings().cookie_name, token); c.headers.update({"x-csrf-token": s.csrf_token})
    r = c.post("/runs/execute", json={"planId": plan_id})
    local = sorted(str(p.relative_to(root)) for p in root.rglob("*") if p.is_file())
    print("RESULT " + json.dumps({"status": r.status_code, "detail": r.json().get("detail"), "run_id": r.json().get("runId"), "local_files": local}), flush=True)
""")


def test_two_application_instances_with_separate_filesystems_share_one_authority(env, tmp_path):
    plan_id = _approved_plan()
    release = tmp_path / "release"
    procs = []
    for name in ("replica-a", "replica-b"):
        root = tmp_path / name
        root.mkdir()
        procs.append(subprocess.Popen([sys.executable, "-c", INSTANCE, str(root), plan_id, str(release)], cwd=SERVICE_ROOT,
                                      env={**os.environ, "SHF_DATABASE_URL": env["dsn"]}, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True))
    # One replica wins and parks in its work; the other must be refused meanwhile.
    deadline = time.time() + 60
    while time.time() < deadline and not any(p.poll() is not None for p in procs):
        time.sleep(0.1)
    release.write_text("go")
    results = []
    for p in procs:
        stdout, stderr = p.communicate(timeout=60)
        line = [l for l in stdout.splitlines() if l.startswith("RESULT ")]
        assert line, stderr[-2000:]
        results.append(json.loads(line[0][7:]))
    statuses = sorted(r["status"] for r in results)
    assert statuses == [200, 409], results
    assert [r["detail"] for r in results if r["status"] == 409] == ["RUN_ALREADY_EXECUTING"]
    assert all(r["local_files"] == [] for r in results), "neither instance used its local plan/run/claim store"
    assert q(env, "SELECT count(*) FROM fabric_run_events WHERE event_type = 'run.execution_started'")[0][0] == 1
    assert q(env, "SELECT status FROM fabric_plans WHERE plan_id = %s", plan_id) == [("DONE",)]


# ================================================================ security + legacy


def test_security_invariants_hold_on_the_shared_authority(env, monkeypatch):
    plan_id = _approved_plan()
    anon = TestClient(app)
    assert anon.post("/runs/execute", json={"planId": plan_id}, headers={"X-Admin-Key": ADMIN_KEY}).status_code == 401
    assert anon.post("/plan", json={"agentName": "A", "input": {}}).status_code == 401
    no_csrf = _client(APPROVER)
    no_csrf.headers.pop("x-csrf-token")
    assert no_csrf.post("/runs/execute", json={"planId": plan_id}).status_code == 403
    monkeypatch.setitem(perms.ROLE_PERMISSION_MAP, perms.ROLE_CLIENT_ADMIN, ("bos.governance.read",))
    assert _client("u-reader", role="client_admin").post("/runs/execute", json={"planId": plan_id}).status_code == 403
    monkeypatch.setitem(perms.ROLE_PERMISSION_MAP, perms.ROLE_CLIENT_ADMIN, perms.FABRIC_RUN_AUTHORITY_PERMISSIONS)
    assert _client("u-org-b", role="client_admin", org="org_b").post("/runs/execute", json={"planId": plan_id}).status_code == 404
    assert q(env, "SELECT count(*) FROM fabric_run_events")[0][0] == 0
    approver = _client(APPROVER)
    res = approver.post("/runs/execute", json={"planId": plan_id, "actorId": "ceo", "organizationId": "org_victim"})
    assert res.status_code == 200
    (actor_id, payload), = q(env, "SELECT actor_id, payload FROM fabric_run_events WHERE event_type = 'run.execution_started'")
    assert actor_id == APPROVER and payload["declared_identity"]["verification"] == "DECLARED"
    dump = json.dumps([q(env, f"SELECT row_to_json(t)::text FROM {t} t") for t in TABLES])
    for secret in (*approver.secret_material, ADMIN_KEY, "Traceback", "/Users/", "/private/", "@test.invalid"):
        assert secret not in dump, secret


def test_legacy_file_records_stay_readable_and_labelled(env):
    env["plans"].mkdir(parents=True)
    (env["plans"] / "legacy-plan.json").write_text(json.dumps({"planId": "legacy-plan", "status": "DONE", "approved": True, "approvalRequired": True}))
    env["log"].parent.mkdir(parents=True)
    env["log"].write_text(json.dumps({"runId": "legacy-run", "planId": "legacy-plan", "kind": "execute", "outcome": "ok", "ts": "2026-01-09T03:56:55+00:00"}) + "\n")
    plan_id = _approved_plan()
    new_run = _client(APPROVER).post("/runs/execute", json={"planId": plan_id}).json()["runId"]

    body = live_runs_projection()
    origins = {r["run_id"]: r["source"]["record_origin"] for r in body["runs"] if r["run_id"] != "NOT_AVAILABLE"}
    assert origins == {new_run: "POSTGRES_RUN_AUTHORITY", "legacy-run": "LEGACY_FILE_STORE"}
    legacy = run_detail_projection("legacy-run")["run"]
    assert legacy["current_state"] == "COMPLETED" and legacy["execution_lease"]["scope"] == "REPLICA_LOCAL"
    assert body["execution_safety"]["level"] == "DISTRIBUTED"
    # Legacy records are read-only: they are not part of the shared authority.
    assert _client(APPROVER).post("/plan/legacy-plan/approve").status_code == 404
    assert env["log"].read_text().count("\n") == 1, "legacy log never written again"
