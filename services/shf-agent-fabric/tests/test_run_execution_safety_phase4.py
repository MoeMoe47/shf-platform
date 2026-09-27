from __future__ import annotations

"""
AFCC-3 Phase 4 — execution safety.

Proves: one live execution per plan (real threads and real processes); the claim
is created once and released on success, failure and timeout; a duplicate never
writes a start event; the executor enforces its server-side lease as TIMED_OUT;
a crashed execution is reported as ORPHANED (never FAILED/COMPLETED) and can be
reclaimed only after lease + grace; preflight routes no longer take the admin key.
"""

import json
import subprocess
import sys
import threading
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from auth import permissions as perms
from auth.audit import _EVENTS
from auth.config import get_auth_settings
from auth.sessions import _SESSIONS, create_session
from auth.store import AuthUser
from fabric import run_claims
from fabric import run_lifecycle as lc
from fabric.command.live_operations import run_detail_projection, run_timeline_projection
from main import app  # type: ignore

ADMIN_KEY = "phase4-admin-key-must-not-authorize"
SERVICE_ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture(autouse=True)
def isolated(monkeypatch, tmp_path):
    import fabric.plan_store as plan_store
    import routers.runs_routes as runs_routes

    monkeypatch.setenv("ADMIN_API_KEY", ADMIN_KEY)
    monkeypatch.delenv("FABRIC_RUN_LEASE_SECONDS", raising=False)
    plans = tmp_path / "plans"
    monkeypatch.setattr(plan_store, "PLANS_DIR", plans)
    monkeypatch.setattr(runs_routes, "PLANS_DIR", plans)
    monkeypatch.setattr(runs_routes, "ARTIFACTS_DIR", tmp_path / "artifacts")
    monkeypatch.setattr(runs_routes, "RUNS_LOG", tmp_path / "runs" / "events.jsonl")
    monkeypatch.setattr(runs_routes, "assert_global_execution_allowed", lambda route: None)
    _SESSIONS.clear()
    _EVENTS.clear()
    yield {"plans": plans, "log": runs_routes.RUNS_LOG, "claims": tmp_path / "runs" / "claims", "artifacts": tmp_path / "artifacts"}
    _SESSIONS.clear()
    _EVENTS.clear()


def _client(role: str = "shs_admin", *, user_id: str = "u-operator", org: str | None = None) -> TestClient:
    token, session = create_session(AuthUser(user_id=user_id, email=f"{user_id}@test.invalid", display_name=user_id,
                                             role=role, password_hash="", organization_id=org))
    c = TestClient(app)
    c.cookies.set(get_auth_settings().cookie_name, token)
    c.headers.update({"x-csrf-token": session.csrf_token})
    return c


def _clone(c: TestClient) -> TestClient:
    other = TestClient(app)
    other.cookies.update(c.cookies)
    other.headers.update({"x-csrf-token": c.headers["x-csrf-token"]})
    return other


def _creator() -> TestClient:
    # Phase 4.1 Policy B: plans are created by a different operator than the approver.
    return _client(user_id="u-creator")


def _approved(c: TestClient) -> str:
    plan_id = _creator().post("/plan", json={"agentName": "UnregisteredTestAgent", "input": {"x": 1}}).json()["planId"]
    assert c.post(f"/plan/{plan_id}/approve").status_code == 200
    return plan_id


def _log(isolated) -> list[dict]:
    return [json.loads(l) for l in isolated["log"].read_text().splitlines()] if isolated["log"].exists() else []


def _claims(isolated) -> list[str]:
    # Live claims only; `.reclaimed.*` files are retained evidence of reclaimed claims.
    return sorted(p.name for p in isolated["claims"].glob("*.json") if not p.name.startswith(".")) if isolated["claims"].exists() else []


def _plan(isolated, plan_id: str) -> dict:
    return json.loads((isolated["plans"] / f"{plan_id}.json").read_text())


class _Gate:
    """Holds the winning execution inside its artifact write until released."""

    def __init__(self, monkeypatch):
        import routers.runs_routes as runs_routes

        self.entered = threading.Event()
        self.release = threading.Event()
        real = runs_routes._write_json

        def gated(path, obj):
            if "artifacts" in str(path):
                self.entered.set()
                assert self.release.wait(10), "gate never released"
            return real(path, obj)

        monkeypatch.setattr(runs_routes, "_write_json", gated)


class _Clock:
    def __init__(self, monkeypatch):
        self.offset = timedelta(0)
        monkeypatch.setattr(run_claims, "now", lambda: datetime.now(timezone.utc) + self.offset)

    def advance(self, seconds: float) -> None:
        self.offset += timedelta(seconds=seconds)


# ================================================================ single-flight


def test_concurrent_execute_one_wins_one_is_refused(isolated, monkeypatch):
    admin = _client()
    plan_id = _approved(admin)
    gate = _Gate(monkeypatch)
    results = {}

    def first():
        results["a"] = _clone(admin).post("/runs/execute", json={"planId": plan_id})

    t = threading.Thread(target=first)
    t.start()
    assert gate.entered.wait(10), "winner never reached its work"
    # Winner is mid-execution: its claim is held and its start event is on disk.
    assert _claims(isolated) == [f"{plan_id}.json"]
    second = _clone(admin).post("/runs/execute", json={"planId": plan_id})
    gate.release.set()
    t.join(10)

    assert second.status_code == 409 and second.json()["detail"] == "RUN_ALREADY_EXECUTING"
    assert results["a"].status_code == 200
    events = _log(isolated)
    assert [e["event_type"] for e in events] == ["run.execution_started", "run.completed"], "no duplicate start"
    assert _claims(isolated) == [], "claim released on success"
    assert _plan(isolated, plan_id)["executedRunId"] == results["a"].json()["runId"]


def test_many_simultaneous_requests_exactly_one_executes(isolated, monkeypatch):
    admin = _client()
    plan_id = _approved(admin)
    gate = _Gate(monkeypatch)
    n = 8
    barrier = threading.Barrier(n)
    responses: list = [None] * n
    clients = [_clone(admin) for _ in range(n)]

    def fire(i):
        barrier.wait()
        responses[i] = clients[i].post("/runs/execute", json={"planId": plan_id})

    threads = [threading.Thread(target=fire, args=(i,)) for i in range(n)]
    for th in threads:
        th.start()
    assert gate.entered.wait(10)
    deadline = time.time() + 10
    while sum(r is not None for r in responses) < n - 1 and time.time() < deadline:
        time.sleep(0.01)
    gate.release.set()
    for th in threads:
        th.join(10)

    codes = sorted(r.status_code for r in responses)
    assert codes == [200] + [409] * (n - 1), codes
    assert {r.json()["detail"] for r in responses if r.status_code == 409} == {"RUN_ALREADY_EXECUTING"}
    starts = [e for e in _log(isolated) if e["event_type"] == "run.execution_started"]
    assert len(starts) == 1, "execution claim created once; one start event"
    assert len(list(isolated["artifacts"].glob("*.json"))) == 1
    assert _claims(isolated) == []


def test_claim_is_exclusive_across_real_processes(isolated):
    claims_dir = isolated["claims"]
    script = (
        "import sys, json; from pathlib import Path; from fabric import run_claims\n"
        "rec = run_claims.new_claim(plan_id='p-multi', run_id=sys.argv[2], actor_id='u', correlation_id='corr-multiproc')\n"
        "try:\n    run_claims.acquire_claim(Path(sys.argv[1]), rec); print('ACQUIRED')\n"
        "except run_claims.ClaimHeld:\n    print('HELD')\n"
    )
    procs = [subprocess.Popen([sys.executable, "-c", script, str(claims_dir), f"run{i:02d}"], cwd=SERVICE_ROOT,
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True) for i in range(6)]
    outs = [p.communicate(timeout=60)[0].strip() for p in procs]
    assert sorted(outs) == ["ACQUIRED"] + ["HELD"] * 5, outs
    holder = json.loads((claims_dir / "p-multi.json").read_text())
    assert holder["run_id"].startswith("run") and holder["correlation_id"] == "corr-multiproc"


def test_duplicate_after_completion_is_idempotent_not_a_second_run(isolated):
    admin = _client()
    plan_id = _approved(admin)
    assert admin.post("/runs/execute", json={"planId": plan_id}).status_code == 200
    again = admin.post("/runs/execute", json={"planId": plan_id})
    assert again.status_code == 200 and again.json()["runId"] is None
    assert sum(e["event_type"] == "run.execution_started" for e in _log(isolated)) == 1


def test_plan_completed_between_check_and_claim_is_rechecked(isolated, monkeypatch):
    admin = _client()
    plan_id = _approved(admin)
    real_acquire = run_claims.acquire_claim

    def racing_acquire(claims_dir, record):
        # Another execution finishes the plan just before this one claims it.
        plan = _plan(isolated, plan_id)
        plan["status"] = "DONE"
        (isolated["plans"] / f"{plan_id}.json").write_text(json.dumps(plan))
        return real_acquire(claims_dir, record)

    monkeypatch.setattr(run_claims, "acquire_claim", racing_acquire)
    res = admin.post("/runs/execute", json={"planId": plan_id})
    assert res.status_code == 200 and res.json()["runId"] is None
    assert _log(isolated) == [] and _claims(isolated) == []


def test_claim_records_identity_correlation_and_bounded_lease(isolated, monkeypatch):
    admin = _client(user_id="u-exec")
    plan_id = _creator().post("/plan", json={"agentName": "A", "input": {}}, headers={"X-Correlation-Id": "corr-claim-00001"}).json()["planId"]
    admin.post(f"/plan/{plan_id}/approve")
    gate = _Gate(monkeypatch)
    seen = {}
    t = threading.Thread(target=lambda: seen.setdefault("res", _clone(admin).post("/runs/execute", json={"planId": plan_id, "lease_seconds": 1, "leaseSeconds": 1})))
    t.start()
    assert gate.entered.wait(10)
    claim = json.loads((isolated["claims"] / f"{plan_id}.json").read_text())
    gate.release.set()
    t.join(10)
    assert (claim["plan_id"], claim["claimed_by_actor_id"], claim["correlation_id"]) == (plan_id, "u-exec", "corr-claim-00001")
    assert claim["run_id"] == seen["res"].json()["runId"]
    assert claim["lease_seconds"] == run_claims.DEFAULT_LEASE_SECONDS, "request body cannot set the lease"
    assert claim["heartbeat"] == "NOT_SUPPORTED" and claim["claimed_at"]
    start = _log(isolated)[0]
    assert start["lease_expires_at"] == claim["lease_expires_at"] and start["claim_ref"] == f"claim:{plan_id}:{claim['run_id']}"


@pytest.mark.parametrize("configured,expected", [("5", 30), ("99999", 3600), ("120", 120), ("junk", 300)])
def test_lease_is_server_configured_and_bounded(monkeypatch, configured, expected):
    monkeypatch.setenv("FABRIC_RUN_LEASE_SECONDS", configured)
    assert run_claims.lease_seconds() == expected


def test_claim_released_on_failure_and_kept_when_terminal_unrecordable(isolated, monkeypatch):
    import routers.runs_routes as runs_routes

    admin = _client()
    plan_id = _approved(admin)
    monkeypatch.setattr(runs_routes, "_write_json", lambda path, obj: (_ for _ in ()).throw(OSError("disk")))
    with pytest.raises(OSError):
        admin.post("/runs/execute", json={"planId": plan_id})
    assert [e["event_type"] for e in _log(isolated)] == ["run.execution_started", "run.execution_failed"]
    assert _claims(isolated) == [], "claim released after a recorded failure"

    plan_id2 = _approved(admin)
    real_append = runs_routes._append_run_event

    def no_failure_record(ev):
        if ev["event_type"] == "run.execution_failed":
            raise PermissionError("log unwritable")
        return real_append(ev)

    monkeypatch.setattr(runs_routes, "_append_run_event", no_failure_record)
    with pytest.raises(OSError):
        admin.post("/runs/execute", json={"planId": plan_id2})
    assert _claims(isolated) == [f"{plan_id2}.json"], "no terminal recorded: claim stays held"
    retry = admin.post("/runs/execute", json={"planId": plan_id2})
    assert retry.status_code == 409 and retry.json()["detail"] == "RUN_ALREADY_EXECUTING"


def test_start_write_failure_releases_the_claim(isolated, monkeypatch):
    import routers.runs_routes as runs_routes

    admin = _client()
    plan_id = _approved(admin)
    monkeypatch.setattr(runs_routes, "_append_run_event", lambda ev: (_ for _ in ()).throw(OSError("log")))
    with pytest.raises(OSError):
        admin.post("/runs/execute", json={"planId": plan_id})
    assert _claims(isolated) == [] and _plan(isolated, plan_id)["status"] == "APPROVED"


# ================================================================ timeout


def test_deadline_stops_execution_as_timed_out_and_keeps_partial_artifacts(isolated, monkeypatch):
    import routers.runs_routes as runs_routes

    clock = _Clock(monkeypatch)
    admin = _client()
    plan_id = _approved(admin)
    real = runs_routes._write_json

    def slow_step(path, obj):
        out = real(path, obj)
        if "artifacts" in str(path):
            clock.advance(run_claims.lease_seconds() + 1)  # the step overran the lease
        return out

    monkeypatch.setattr(runs_routes, "_write_json", slow_step)
    res = admin.post("/runs/execute", json={"planId": plan_id})
    assert res.status_code == 504 and res.json()["detail"] == "RUN_TIMED_OUT"
    events = _log(isolated)
    assert [e["event_type"] for e in events] == ["run.execution_started", "run.timed_out"]
    timed_out = events[1]
    assert (timed_out["from_state"], timed_out["to_state"], timed_out["failure_code"], timed_out["partial"]) == ("EXECUTING", "TIMED_OUT", "DEADLINE_EXCEEDED", True)
    assert len(timed_out["artifacts"]) == 1 and len(list(isolated["artifacts"].glob("*.json"))) == 1, "partial artifact preserved and listed"
    assert "run.completed" not in {e["event_type"] for e in events}
    assert _plan(isolated, plan_id)["status"] == "APPROVED", "never marked DONE"
    assert _claims(isolated) == [], "claim released after TIMED_OUT"
    run = run_detail_projection(events[0]["runId"])["run"]
    assert run["current_state"] == "TIMED_OUT" and run["timed_out_at"] == timed_out["ts"]
    assert run["failure_code"] == "DEADLINE_EXCEEDED" and run["execution_lease"]["status"] == "CLOSED_BY_TERMINAL"
    # The plan is still approved and may run again.
    monkeypatch.setattr(runs_routes, "_write_json", real)
    clock.offset = timedelta(0)
    assert admin.post("/runs/execute", json={"planId": plan_id}).status_code == 200


# ================================================================ orphans


def _crashed_execution(isolated, *, plan_id: str, run_id: str, lease_expires_at: datetime, corr: str = "corr-crashed-001") -> None:
    """The on-disk state a process leaves if it dies after its start event."""
    isolated["claims"].mkdir(parents=True, exist_ok=True)
    claim = run_claims.new_claim(plan_id=plan_id, run_id=run_id, actor_id="u-gone", correlation_id=corr)
    claim["lease_expires_at"] = lease_expires_at.isoformat()
    (isolated["claims"] / f"{plan_id}.json").write_text(json.dumps(claim))
    isolated["log"].parent.mkdir(parents=True, exist_ok=True)
    with isolated["log"].open("a") as fh:
        fh.write(json.dumps({"runId": run_id, "planId": plan_id, "schema_version": lc.RUN_EVENT_SCHEMA, "event_type": "run.execution_started",
                             "from_state": "APPROVED", "to_state": "EXECUTING", "outcome": "started", "ts": (lease_expires_at - timedelta(seconds=300)).isoformat(),
                             "lease_expires_at": lease_expires_at.isoformat(), "lease_seconds": 300, "correlation_id": corr,
                             "initiator_actor_id": "u-gone", "initiator_type": "HUMAN"}) + "\n")


def test_crashed_run_is_executing_while_lease_live_then_orphaned_never_failed(isolated):
    admin = _client()
    plan_id = _approved(admin)
    _crashed_execution(isolated, plan_id=plan_id, run_id="crash-live", lease_expires_at=datetime.now(timezone.utc) + timedelta(minutes=5))
    run = run_detail_projection("crash-live")["run"]
    assert run["current_state"] == "EXECUTING" and run["execution_lease"]["status"] == "ACTIVE"
    assert admin.post("/runs/execute", json={"planId": plan_id}).json()["detail"] == "RUN_ALREADY_EXECUTING"

    plan2 = _approved(admin)
    _crashed_execution(isolated, plan_id=plan2, run_id="crash-old", lease_expires_at=datetime.now(timezone.utc) - timedelta(seconds=10))
    old = run_detail_projection("crash-old")["run"]
    assert old["current_state"] == "ORPHANED" and old["state_derivation"]["reason_code"] == "LEASE_EXPIRED_NO_TERMINAL"
    assert old["execution_lease"]["status"] == "EXPIRED" and old["execution_lease"]["orphan_recorded"] is False
    assert old["failed_at"] == "NOT_AVAILABLE" and old["completed_at"] == "NOT_AVAILABLE"
    # Expired but still inside the grace window: not yet reclaimable.
    assert admin.post("/runs/execute", json={"planId": plan2}).json()["detail"] == "RUN_ALREADY_EXECUTING"


def test_reclaim_after_lease_and_grace_records_orphan_and_runs_once(isolated, monkeypatch):
    admin = _client(user_id="u-recoverer")
    plan_id = _approved(admin)
    expired = datetime.now(timezone.utc) - timedelta(seconds=run_claims.TAKEOVER_GRACE_SECONDS + 5)
    _crashed_execution(isolated, plan_id=plan_id, run_id="crash-dead", lease_expires_at=expired)

    res = admin.post("/runs/execute", json={"planId": plan_id})
    assert res.status_code == 200
    new_run = res.json()["runId"]
    types = [(e["runId"], e["event_type"]) for e in _log(isolated)]
    assert types == [("crash-dead", "run.execution_started"), ("crash-dead", "run.lease_expired"),
                     (new_run, "run.execution_started"), (new_run, "run.completed")]
    orphan_event = _log(isolated)[1]
    assert orphan_event["recorded_by"]["run_id"] == new_run and orphan_event["recorded_by"]["recorder_actor_id"] == "u-recoverer"
    assert orphan_event["correlation_id"] == "corr-crashed-001"

    old = run_detail_projection("crash-dead")["run"]
    assert old["current_state"] == "ORPHANED" and old["state_derivation"]["reason_code"] == "ORPHAN_RECORDED"
    assert old["initiator"]["actor_id"] == "u-gone", "the recorder is never shown as the orphan's initiator"
    assert old["execution_lease"]["orphan_recorded"] is True
    assert run_detail_projection(new_run)["run"]["current_state"] == "COMPLETED"
    assert run_detail_projection(new_run)["run"]["retry_lineage"]["same_plan_run_ids"] == ["crash-dead"]
    run_ledger = [e for e in run_timeline_projection("crash-dead")["events"] if e["source"] == "agent_fabric.run_events"]
    assert [e["to_state"] for e in run_ledger] == ["EXECUTING", "ORPHANED"]
    assert list(isolated["claims"].glob(".reclaimed.*.json")), "the stale claim is kept as evidence"
    assert _claims(isolated) == []


def test_late_terminal_after_orphan_wins_and_is_never_completed_by_derivation():
    start = {"event_type": "run.execution_started", "schema_version": lc.RUN_EVENT_SCHEMA, "to_state": "EXECUTING", "ts": "1",
             "lease_expires_at": "2000-01-01T00:00:00+00:00"}
    orphan = {"event_type": "run.lease_expired", "schema_version": lc.RUN_EVENT_SCHEMA, "to_state": "ORPHANED", "ts": "2"}
    late = {"event_type": "run.timed_out", "schema_version": lc.RUN_EVENT_SCHEMA, "to_state": "TIMED_OUT", "outcome": "timed_out", "ts": "3"}
    assert lc.derive_run_state([start], None)["state"] == "ORPHANED"
    assert lc.derive_run_state([start, orphan], None)["reason_code"] == "ORPHAN_RECORDED"
    assert lc.derive_run_state([start, orphan, late], None)["state"] == "TIMED_OUT"
    # Unrecorded or forged state words stay UNKNOWN.
    assert lc.derive_run_state([{"to_state": "TIMED_OUT", "ts": "1"}], None)["state"] == "UNKNOWN"
    assert lc.derive_run_state([{"state": "ORPHANED", "ts": "1"}], None)["state"] == "UNKNOWN"
    assert lc.derive_run_state([orphan], None)["reason_code"] == "ORPHAN_WITHOUT_START"
    # A Phase 3 start without a lease never becomes ORPHANED by the clock.
    phase3 = {k: v for k, v in start.items() if k != "lease_expires_at"}
    assert lc.derive_run_state([phase3], None)["state"] == "EXECUTING"


# ================================================================ authority (Phase 4 surfaces)


PREFLIGHT = ["/runs/validate", "/runs/dry-run"]


@pytest.mark.parametrize("path", PREFLIGHT)
def test_preflight_needs_session_csrf_and_execute_permission(isolated, path, monkeypatch):
    admin = _client()
    plan_id = _approved(admin)
    assert admin.post(path, json={"planId": plan_id}).status_code == 200
    assert TestClient(app).post(path, json={"planId": plan_id}).status_code == 401
    assert TestClient(app).post(path, json={"planId": plan_id}, headers={"X-Admin-Key": ADMIN_KEY}).status_code == 401
    no_csrf = _clone(admin)
    no_csrf.headers.pop("x-csrf-token")
    assert no_csrf.post(path, json={"planId": plan_id}).status_code == 403
    monkeypatch.setitem(perms.ROLE_PERMISSION_MAP, perms.ROLE_CLIENT_ADMIN, ("bos.governance.read",))
    assert _client("client_admin", user_id="u-reader").post(path, json={"planId": plan_id}).status_code == 403
    assert _log(isolated) == []


def test_execution_authority_invariants_hold_under_the_claim(isolated, monkeypatch):
    admin = _client(user_id="u-real")
    plan_id = _approved(admin)
    # Admin key and read permission cannot execute; nothing is claimed.
    assert TestClient(app).post("/runs/execute", json={"planId": plan_id}, headers={"X-Admin-Key": ADMIN_KEY}).status_code == 401
    monkeypatch.setitem(perms.ROLE_PERMISSION_MAP, perms.ROLE_CLIENT_ADMIN, ("bos.governance.read",))
    assert _client("client_admin", user_id="u-reader").post("/runs/execute", json={"planId": plan_id}).status_code == 403
    # Wrong organization cannot execute (and cannot learn the plan exists).
    monkeypatch.setitem(perms.ROLE_PERMISSION_MAP, perms.ROLE_CLIENT_ADMIN, perms.FABRIC_RUN_AUTHORITY_PERMISSIONS)
    assert _client("client_admin", user_id="u-org-b", org="org_b").post("/runs/execute", json={"planId": plan_id}).status_code == 404
    # Rejected and unattributable plans are refused before any claim.
    rejected = _creator().post("/plan", json={"agentName": "A", "input": {}}).json()["planId"]
    admin.post(f"/plan/{rejected}/reject")
    (isolated["plans"] / "legacy-ok.json").write_text(json.dumps({"planId": "legacy-ok", "status": "APPROVED", "approved": True, "approvalRequired": True, "steps": []}))
    assert admin.post("/runs/execute", json={"planId": rejected}).json()["detail"] == "PLAN_REJECTED"
    assert admin.post("/runs/execute", json={"planId": "legacy-ok"}).json()["detail"] == "APPROVAL_NOT_ATTRIBUTABLE"
    assert _claims(isolated) == [] and _log(isolated) == []
    # Body identity cannot change who executes or the claim holder.
    res = admin.post("/runs/execute", json={"planId": plan_id, "actorId": "ceo", "organizationId": "org_victim"})
    assert res.status_code == 200
    start = _log(isolated)[0]
    assert start["initiator_actor_id"] == "u-real" and start["declared_identity"]["actor_id"] == "ceo"
