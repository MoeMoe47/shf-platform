from __future__ import annotations

"""
AFCC-3 Phase 6 — shared artifact & evidence storage (real PostgreSQL).

Opt-in like the repo's other runtime PG proofs: SHF_RUNTIME_PG_PROOF=1.
Throwaway databases only; migrations 149 + 150 applied from the SHS
migrations directory.

Proves: artifact bodies commit in the same transaction as the run's terminal
event and are retrievable + hash-verified from any application instance, even
after the executing instance and its filesystem are gone; evidence status is
separate from execution result and never claims durability it does not have;
storage failures are recorded truthfully; access follows run scope; legacy
local artifacts are labelled, never promoted; production never falls back to
local artifact files.
"""

import hashlib
import json
import os
import secrets
import shutil
import subprocess
import sys
import textwrap
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
from fabric import run_authority_pg as pg  # noqa: E402
from fabric.command.live_operations import (  # noqa: E402
    artifact_storage_projection,
    live_runs_projection,
    run_detail_projection,
    run_evidence_projection,
)
from main import app  # type: ignore  # noqa: E402

SERVICE_ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS_DIR = SERVICE_ROOT.parents[1] / "apps" / "shs-api" / "migrations"
ADMIN_DSN = os.getenv("SHF_PG_ADMIN_URL", "postgresql://localhost:5432/postgres")
CREATOR, APPROVER = "u-creator", "u-approver"
TABLES = ("fabric_run_artifacts", "fabric_run_events", "fabric_execution_claims", "fabric_plan_decisions", "fabric_plans")


def _create_db(migrations: list[str]) -> str:
    name = f"afcc_phase6_{secrets.token_hex(4)}"
    with psycopg.connect(ADMIN_DSN, autocommit=True) as admin:
        admin.execute(f"CREATE DATABASE {name}")
    dsn = ADMIN_DSN.rsplit("/", 1)[0] + f"/{name}"
    with psycopg.connect(dsn, autocommit=True) as conn:
        for m in migrations:
            conn.execute((MIGRATIONS_DIR / m).read_text())
    return dsn


def _drop_db(dsn: str) -> None:
    name = dsn.rsplit("/", 1)[1]
    with psycopg.connect(ADMIN_DSN, autocommit=True) as admin:
        admin.execute("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = %s AND pid <> pg_backend_pid()", (name,))
        admin.execute(f"DROP DATABASE {name}")


@pytest.fixture(scope="module")
def database():
    dsn = _create_db(["149_fabric_run_authority.sql", "150_fabric_run_artifacts.sql"])
    yield dsn
    _drop_db(dsn)


@pytest.fixture(scope="module")
def database_without_artifact_store():
    dsn = _create_db(["149_fabric_run_authority.sql"])
    yield dsn
    _drop_db(dsn)


@pytest.fixture()
def env(database, monkeypatch, tmp_path):
    import fabric.plan_store as plan_store
    import routers.runs_routes as runs_routes

    with psycopg.connect(database, autocommit=True) as conn:
        conn.execute("TRUNCATE " + ", ".join(TABLES))
    monkeypatch.setenv("SHF_RUN_AUTHORITY_STORAGE", "postgres")
    monkeypatch.setenv("SHF_DATABASE_URL", database)
    monkeypatch.delenv("FABRIC_RUN_LEASE_SECONDS", raising=False)
    files = {"plans": tmp_path / "plans", "log": tmp_path / "runs" / "events.jsonl", "artifacts": tmp_path / "artifacts"}
    monkeypatch.setattr(plan_store, "PLANS_DIR", files["plans"])
    monkeypatch.setattr(runs_routes, "PLANS_DIR", files["plans"])
    monkeypatch.setattr(runs_routes, "ARTIFACTS_DIR", files["artifacts"])
    monkeypatch.setattr(runs_routes, "RUNS_LOG", files["log"])
    monkeypatch.setattr(runs_routes, "assert_global_execution_allowed", lambda route: None)
    _SESSIONS.clear()
    _EVENTS.clear()
    yield {"dsn": database, "root": tmp_path, **files}
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
    return c


def _executed(corr: str | None = None) -> tuple[str, str, str]:
    headers = {"X-Correlation-Id": corr} if corr else {}
    plan_id = _client(CREATOR).post("/plan", json={"agentName": "UnregisteredTestAgent", "input": {"task": "pilot", "constraints": ["draft only"]}}, headers=headers).json()["planId"]
    approver = _client(APPROVER)
    assert approver.post(f"/plan/{plan_id}/approve").status_code == 200
    res = approver.post("/runs/execute", json={"planId": plan_id})
    assert res.status_code == 200, res.text
    run_id = res.json()["runId"]
    artifact_id = res.json()["results"][0]["result"]["artifactId"]
    return plan_id, run_id, artifact_id


def _events(env, run_id: str) -> list[dict]:
    return [r[0] for r in q(env, "SELECT payload FROM fabric_run_events WHERE run_id = %s ORDER BY seq", run_id)]


# ================================================================ durability + integrity


def test_completed_run_commits_verifiable_artifact_with_its_terminal_event(env):
    corr = "corr-phase6-evidence-1"
    plan_id, run_id, artifact_id = _executed(corr)
    assert not env["artifacts"].exists(), "no replica-local artifact file was written"

    (canonical_ref, a_run, a_type, a_hash, a_len, body, completeness, actor, a_corr, provider), = q(env,
        """SELECT canonical_ref, run_id, artifact_type, content_hash, content_length, body_canonical, completeness,
                  created_by_actor_id, correlation_id, storage_provider FROM fabric_run_artifacts""")
    assert (canonical_ref, a_run, a_type, completeness, actor, a_corr, provider) == (f"fabric-artifact:{artifact_id}", run_id, "draft_artifact", "COMPLETE", APPROVER, corr, "postgres_text")
    assert hashlib.sha256(body.encode()).hexdigest() == a_hash and len(body.encode()) == a_len
    completed = _events(env, run_id)[-1]
    assert completed["event_type"] == "run.completed"
    assert completed["artifacts"] == [{"artifactId": artifact_id, "sha256": a_hash, "canonical_ref": canonical_ref, "content_length": a_len,
                                       "storage": "FABRIC_RUN_ARTIFACTS", "storage_state": "STORED"}]
    assert json.loads(body)["provenance"] == {"run_id": run_id, "plan_id": plan_id, "correlation_id": corr}

    fetched = _client("u-reader").get(f"/artifacts/{artifact_id}")
    assert fetched.status_code == 200
    meta = fetched.json()["metadata"]
    assert (meta["verification_state"], meta["storage_state"], meta["durable"], meta["content_hash"]) == ("VERIFIED", "STORED", True, a_hash)
    assert fetched.json()["artifact"] == json.loads(body)

    evidence = run_evidence_projection(run_id)["evidence"]
    assert evidence["evidence_status"] == {"status": "DURABLE", "artifact_count": 1, "durable_count": 1, "verified": True, "storage": "FABRIC_RUN_ARTIFACTS"}
    ref = evidence["artifact_refs"][0]
    assert (ref["storage_state"], ref["verification_state"], ref["size"], ref["type"], ref["canonical_ref"]) == ("STORED", "VERIFIED", a_len, "draft_artifact", canonical_ref)
    detail = run_detail_projection(run_id)["run"]
    assert (detail["current_state"], detail["evidence"]["status"]) == ("COMPLETED", "DURABLE")
    listed = next(r for r in live_runs_projection()["runs"] if r["run_id"] == run_id)
    assert listed["evidence"]["status"] == "DURABLE" and listed["artifact_refs"][0]["verification_state"] == "HASH_RECORDED"


@pytest.mark.parametrize("tamper", ["body", "stored_hash"])
def test_tampered_artifact_is_detected_never_served(env, tamper):
    _, run_id, artifact_id = _executed()
    if tamper == "body":
        q(env, "UPDATE fabric_run_artifacts SET body_canonical = replace(body_canonical, 'pilot', 'PILOT')")
    else:  # row self-consistent but disagrees with the lifecycle's recorded digest
        q(env, "UPDATE fabric_run_artifacts SET body_canonical = body_canonical || ' ', content_hash = encode(sha256(convert_to(body_canonical || ' ', 'UTF8')), 'hex'), content_length = content_length + 1")
    res = _client("u-reader").get(f"/artifacts/{artifact_id}")
    if tamper == "body":
        assert res.status_code == 409 and res.json()["detail"] == "ARTIFACT_INTEGRITY_FAILED"
    ev = run_evidence_projection(run_id)["evidence"]["evidence_status"]
    assert ev["status"] == "INTEGRITY_FAILED" and ev["verified"] is False


# ================================================================ multi-replica + restart


REPLICA = textwrap.dedent("""
    import json, os, sys
    from pathlib import Path
    root, action, arg = Path(sys.argv[1]), sys.argv[2], sys.argv[3]
    os.environ["SHF_RUN_AUTHORITY_STORAGE"] = "postgres"
    from fastapi.testclient import TestClient
    import fabric.plan_store as plan_store, routers.runs_routes as rr
    from auth.sessions import create_session; from auth.store import AuthUser; from auth.config import get_auth_settings
    from fabric.command.live_operations import run_detail_projection
    from main import app
    plan_store.PLANS_DIR = rr.PLANS_DIR = root / "plans"; rr.ARTIFACTS_DIR = root / "artifacts"; rr.RUNS_LOG = root / "runs" / "events.jsonl"
    rr.assert_global_execution_allowed = lambda route: None
    token, s = create_session(AuthUser(user_id="u-approver", email="a@x.invalid", display_name="a", role="shs_admin", password_hash=""))
    c = TestClient(app); c.cookies.set(get_auth_settings().cookie_name, token); c.headers.update({"x-csrf-token": s.csrf_token})
    if action == "execute":
        r = c.post("/runs/execute", json={"planId": arg}).json()
        out = {"run_id": r["runId"], "artifact_id": r["results"][0]["result"]["artifactId"]}
    else:
        run_id, artifact_id = arg.split(",")
        a = c.get(f"/artifacts/{artifact_id}")
        run = run_detail_projection(run_id)["run"]
        out = {"status": a.status_code, "verification": a.json().get("metadata", {}).get("verification_state"),
               "body_sha": __import__("hashlib").sha256(json.dumps(a.json().get("artifact"), sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest(),
               "state": run["current_state"], "evidence": run["evidence"]["status"], "ref_verification": run["artifact_refs"][0]["verification_state"]}
    out["local_files"] = sorted(str(p.relative_to(root)) for p in root.rglob("*") if p.is_file())
    print("RESULT " + json.dumps(out), flush=True)
""")


def _replica(env, root: Path, action: str, arg: str) -> dict:
    root.mkdir(parents=True, exist_ok=True)
    proc = subprocess.run([sys.executable, "-c", REPLICA, str(root), action, arg], cwd=SERVICE_ROOT, capture_output=True, text=True,
                          env={**os.environ, "SHF_DATABASE_URL": env["dsn"]}, timeout=120)
    line = [l for l in proc.stdout.splitlines() if l.startswith("RESULT ")]
    assert line, proc.stderr[-2000:]
    return json.loads(line[0][7:])


def test_replica_b_resolves_and_verifies_after_replica_a_is_gone_and_after_restart(env):
    plan_id = _client(CREATOR).post("/plan", json={"agentName": "UnregisteredTestAgent", "input": {"x": 1}}).json()["planId"]
    assert _client(APPROVER).post(f"/plan/{plan_id}/approve").status_code == 200

    a_root = env["root"] / "replica-a"
    produced = _replica(env, a_root, "execute", plan_id)  # process exits: replica A is gone
    assert produced["local_files"] == [], "replica A kept nothing on its own disk"
    shutil.rmtree(a_root)  # and its filesystem is destroyed

    b = _replica(env, env["root"] / "replica-b", "read", f"{produced['run_id']},{produced['artifact_id']}")
    assert (b["status"], b["verification"], b["state"], b["evidence"], b["ref_verification"]) == (200, "VERIFIED", "COMPLETED", "DURABLE", "VERIFIED")
    (stored_hash,), = q(env, "SELECT content_hash FROM fabric_run_artifacts WHERE artifact_id = %s", produced["artifact_id"])
    assert b["body_sha"] == stored_hash, "replica B re-derived the exact recorded digest"
    assert b["local_files"] == []

    restarted = _replica(env, a_root, "read", f"{produced['run_id']},{produced['artifact_id']}")  # replica A restarted, empty disk
    assert (restarted["status"], restarted["verification"], restarted["evidence"]) == (200, "VERIFIED", "DURABLE")


# ================================================================ failure semantics


def test_evidence_storage_failure_fails_the_run_truthfully(env, monkeypatch):
    plan_id = _client(CREATOR).post("/plan", json={"agentName": "A", "input": {"x": 1}}).json()["planId"]
    approver = _client(APPROVER)
    approver.post(f"/plan/{plan_id}/approve")

    def fault(point):
        if point == "artifact_insert":
            raise RuntimeError("storage down")

    monkeypatch.setattr(pg, "_fault", fault)
    res = approver.post("/runs/execute", json={"planId": plan_id})
    assert res.status_code == 500 and res.json()["detail"] == "EVIDENCE_STORAGE_FAILED"
    run_id = q(env, "SELECT run_id FROM fabric_run_events LIMIT 1")[0][0]
    events = _events(env, run_id)
    assert [e["event_type"] for e in events] == ["run.execution_started", "run.execution_failed"]
    assert events[1]["failure_code"] == "EVIDENCE_STORAGE_FAILED"
    assert {a["storage_state"] for a in events[1]["artifacts"]} == {"STORAGE_FAILED"}
    assert q(env, "SELECT count(*) FROM fabric_run_artifacts")[0][0] == 0
    assert q(env, "SELECT status FROM fabric_plans") == [("APPROVED",)], "never DONE without durable evidence"
    assert q(env, "SELECT release_reason FROM fabric_execution_claims") == [("FAILED",)]
    run = run_detail_projection(run_id)["run"]
    assert (run["current_state"], run["evidence"]["status"]) == ("FAILED", "STORAGE_FAILED")
    monkeypatch.setattr(pg, "_fault", lambda p: None)
    assert approver.post("/runs/execute", json={"planId": plan_id}).status_code == 200, "a retry can succeed"


def test_oversize_artifact_is_refused_before_insert(env, monkeypatch):
    monkeypatch.setattr(pg, "ARTIFACT_MAX_BYTES", 10)
    plan_id = _client(CREATOR).post("/plan", json={"agentName": "A", "input": {"x": 1}}).json()["planId"]
    approver = _client(APPROVER)
    approver.post(f"/plan/{plan_id}/approve")
    assert approver.post("/runs/execute", json={"planId": plan_id}).json()["detail"] == "EVIDENCE_STORAGE_FAILED"
    assert q(env, "SELECT count(*) FROM fabric_run_artifacts")[0][0] == 0


def test_storage_and_failure_record_both_down_leaves_executing_not_invented(env, monkeypatch):
    plan_id = _client(CREATOR).post("/plan", json={"agentName": "A", "input": {"x": 1}}).json()["planId"]
    approver = _client(APPROVER)
    approver.post(f"/plan/{plan_id}/approve")

    def fault(point):
        if point in ("artifact_insert", "event:run.execution_failed"):
            raise RuntimeError(point)

    monkeypatch.setattr(pg, "_fault", fault)
    assert approver.post("/runs/execute", json={"planId": plan_id}).status_code == 500
    run_id = q(env, "SELECT run_id FROM fabric_run_events LIMIT 1")[0][0]
    assert [e["event_type"] for e in _events(env, run_id)] == ["run.execution_started"]
    assert q(env, "SELECT released_at IS NULL FROM fabric_execution_claims") == [(True,)]
    assert run_detail_projection(run_id)["run"]["current_state"] == "EXECUTING"


def test_crash_before_terminal_leaves_no_orphan_artifact_and_reclaim_stores_only_new_run(env):
    plan_id = _client(CREATOR).post("/plan", json={"agentName": "A", "input": {"x": 1}}).json()["planId"]
    _client(APPROVER).post(f"/plan/{plan_id}/approve")
    pg.begin_execution(plan_id=plan_id, run_id="crashed", actor_id="u", correlation_id="corr-crashed-0001", lease_seconds=300,
                       admit=lambda p: None,
                       start_event=lambda plan, lease: {"runId": "crashed", "planId": plan_id, "event_id": "evt_crashed", "event_type": "run.execution_started",
                                                        "schema_version": "fabric.run_event.v4", "to_state": "EXECUTING", "lease_expires_at": lease["lease_expires_at"]},
                       orphan_event=lambda prev: {})
    assert q(env, "SELECT count(*) FROM fabric_run_artifacts")[0][0] == 0, "bodies exist only with a terminal event"
    q(env, "UPDATE fabric_execution_claims SET lease_started_at = now() - interval '2 hours', lease_expires_at = now() - interval '1 hour'")
    res = _client(APPROVER).post("/runs/execute", json={"planId": plan_id})
    assert res.status_code == 200
    assert q(env, "SELECT DISTINCT run_id FROM fabric_run_artifacts") == [(res.json()["runId"],)]
    assert run_detail_projection("crashed")["run"]["evidence"]["status"] == "NONE"


def test_row_missing_is_incomplete_and_body_cannot_be_null(env):
    _, run_id, artifact_id = _executed()
    q(env, "DELETE FROM fabric_run_artifacts")
    assert run_evidence_projection(run_id)["evidence"]["evidence_status"]["status"] == "INCOMPLETE"
    assert _client("u-reader").get(f"/artifacts/{artifact_id}").status_code == 404
    with pytest.raises(psycopg.errors.NotNullViolation):
        q(env, "INSERT INTO fabric_run_artifacts (artifact_id, canonical_ref, run_id, plan_id, artifact_type, content_hash, content_length, body_canonical, created_by_actor_id) "
               "SELECT 'x', 'fabric-artifact:x', 'r', plan_id, 't', %s, 1, NULL, 'u' FROM fabric_plans LIMIT 1", "a" * 64)


# ================================================================ scope + sanitization


def _seed_scoped_artifact(env, artifact_id: str, org: str, tenant: str) -> None:
    plan_id = q(env, "SELECT plan_id FROM fabric_plans LIMIT 1")[0][0]
    body = json.dumps({"type": "draft_artifact", "body": {"k": artifact_id}}, sort_keys=True, separators=(",", ":"))
    q(env, """INSERT INTO fabric_run_artifacts (artifact_id, canonical_ref, run_id, plan_id, artifact_type, content_hash, content_length,
              body_canonical, created_by_actor_id, tenant_id, organization_id) VALUES (%s, %s, 'scoped-run', %s, 'draft_artifact', %s, %s, %s, 'u', %s, %s)""",
      artifact_id, f"fabric-artifact:{artifact_id}", plan_id, hashlib.sha256(body.encode()).hexdigest(), len(body.encode()), body, tenant, org)


def test_artifact_access_follows_run_scope(env, monkeypatch):
    _, _, platform_artifact = _executed()
    monkeypatch.setitem(perms.ROLE_PERMISSION_MAP, perms.ROLE_CLIENT_ADMIN, ("bos.governance.read",))
    _seed_scoped_artifact(env, "art-org-a", "org_a", "tenant:org_a")
    _seed_scoped_artifact(env, "art-org-a-other-tenant", "org_a", "tenant:someone_else")
    reader_a = _client("u-a", role="client_admin", org="org_a")
    reader_b = _client("u-b", role="client_admin", org="org_b")

    assert reader_a.get("/artifacts/art-org-a").status_code == 200, "same org + tenant"
    assert reader_b.get("/artifacts/art-org-a").status_code == 404, "wrong org"
    assert reader_a.get("/artifacts/art-org-a-other-tenant").status_code == 404, "wrong tenant"
    assert reader_a.get(f"/artifacts/{platform_artifact}").status_code == 404, "platform evidence is not org-readable"
    guessed = reader_a.get(f"/artifacts/draft_{secrets.token_hex(8)}")
    assert (guessed.status_code, guessed.json()) == (404, reader_b.get("/artifacts/art-org-a").json()), "guessing is indistinguishable"
    assert reader_a.get("/artifacts/art-org-a", params={"organization_id": "org_b"}).status_code == 200
    assert reader_b.get("/artifacts/art-org-a", headers={"X-Organization-Id": "org_a"}).status_code == 404, "no user-supplied scope"
    assert TestClient(app).get("/artifacts/art-org-a").status_code == 401
    assert _client("u-client", role="client", org="org_a").get("/artifacts/art-org-a").status_code == 403
    for method in ("POST", "PUT", "PATCH", "DELETE"):
        assert _client(APPROVER).request(method, "/artifacts/art-org-a").status_code == 405, "no artifact mutation route"


def test_projections_publish_no_bodies_paths_or_credentials(env):
    _, run_id, artifact_id = _executed()
    blob = json.dumps([live_runs_projection(), run_detail_projection(run_id), run_evidence_projection(run_id), artifact_storage_projection()])
    (body,), = q(env, "SELECT body_canonical FROM fabric_run_artifacts")
    assert body not in blob and '"pilotPlan"' not in blob, "no artifact bodies in read projections"
    for leak in (env["dsn"], "postgresql://", "/Users/", "/private/", "body_canonical", "Traceback", str(env["root"])):
        assert leak not in blob, leak
    fetched = _client("u-reader").get(f"/artifacts/{artifact_id}").text
    assert "/Users/" not in fetched and "postgresql://" not in fetched and '"path"' not in fetched


# ================================================================ legacy + production + health


def test_legacy_local_artifact_is_labelled_and_never_served_in_production(env, monkeypatch):
    env["artifacts"].mkdir(parents=True)
    (env["artifacts"] / "draft_legacy_1.json").write_text(json.dumps({"type": "draft_artifact", "body": {"legacy": True}}))
    env["log"].parent.mkdir(parents=True)
    env["log"].write_text(json.dumps({"runId": "legacy-run", "kind": "execute", "outcome": "ok", "ts": "2026-01-09T03:56:55+00:00",
                                      "artifacts": [{"artifactId": "draft_legacy_1", "sha256": "c" * 64, "path": "/Users/x/db/artifacts/draft_legacy_1.json"}]}) + "\n")
    run = run_detail_projection("legacy-run")["run"]
    assert run["artifact_refs"][0]["storage_state"] == "LEGACY_REPLICA_LOCAL" and run["artifact_refs"][0]["durable"] is False
    assert run["evidence"]["status"] == "NOT_DURABLE"
    dev = _client(APPROVER).get("/artifacts/draft_legacy_1")
    assert dev.status_code == 200 and dev.json()["metadata"] == {"storage": "REPLICA_LOCAL_FILE", "storage_state": "LEGACY_REPLICA_LOCAL",
                                                                 "durable": False, "verification_state": "NOT_VERIFIABLE"}
    assert q(env, "SELECT count(*) FROM fabric_run_artifacts")[0][0] == 0, "legacy artifacts are never promoted"
    monkeypatch.setenv("SHS_AUTH_ENV", "production")
    assert _client(APPROVER).get("/artifacts/draft_legacy_1").status_code == 404, "production never serves replica-local files"


def test_production_without_artifact_store_fails_closed_not_to_local_files(env, database_without_artifact_store, monkeypatch):
    with psycopg.connect(database_without_artifact_store, autocommit=True) as conn:
        conn.execute("TRUNCATE fabric_run_events, fabric_execution_claims, fabric_plan_decisions, fabric_plans")
    monkeypatch.setenv("SHF_DATABASE_URL", database_without_artifact_store)
    monkeypatch.setenv("SHF_RUN_AUTHORITY_STORAGE", "file")
    monkeypatch.setenv("SHS_AUTH_ENV", "production")  # production forces the Postgres authority
    plan_id = _client(CREATOR).post("/plan", json={"agentName": "A", "input": {"x": 1}}).json()["planId"]
    approver = _client(APPROVER)
    approver.post(f"/plan/{plan_id}/approve")
    res = approver.post("/runs/execute", json={"planId": plan_id})
    assert res.status_code == 500 and res.json()["detail"] == "EVIDENCE_STORAGE_FAILED"
    assert not env["artifacts"].exists() and not env["plans"].exists(), "no silent local fallback"
    with psycopg.connect(database_without_artifact_store, autocommit=True) as conn:
        assert conn.execute("SELECT status FROM fabric_plans").fetchall() == [("APPROVED",)]


def test_storage_health_states_are_real_and_side_effect_free(env, database_without_artifact_store, monkeypatch):
    before = q(env, "SELECT (SELECT count(*) FROM fabric_run_artifacts), (SELECT count(*) FROM fabric_run_events)")
    assert artifact_storage_projection()["state"] == "AVAILABLE"
    assert q(env, "SELECT (SELECT count(*) FROM fabric_run_artifacts), (SELECT count(*) FROM fabric_run_events)") == before
    reader = _client("u-reader")
    via_route = reader.get("/api/v1-command-center/agent-fabric/storage/artifacts").json()
    assert (via_route["kind"], via_route["state"], via_route["durable"], via_route["check"]) == ("artifact_storage", "AVAILABLE", True, "READ_ONLY_CATALOG_LOOKUP")
    monkeypatch.setenv("SHF_DATABASE_URL", database_without_artifact_store)
    assert (artifact_storage_projection()["state"], artifact_storage_projection()["reason_code"]) == ("DEGRADED", "ARTIFACT_STORE_MIGRATION_MISSING")
    monkeypatch.setenv("SHF_DATABASE_URL", "postgresql://localhost:1/unreachable")
    assert artifact_storage_projection()["state"] == "UNAVAILABLE"
    monkeypatch.delenv("SHF_DATABASE_URL")
    monkeypatch.delenv("DATABASE_URL", raising=False)
    assert artifact_storage_projection()["state"] == "NOT_CONFIGURED"
    monkeypatch.setenv("SHF_RUN_AUTHORITY_STORAGE", "file")
    file_mode = artifact_storage_projection()
    assert (file_mode["state"], file_mode["artifact_storage"], file_mode["durable"]) == ("NOT_CONFIGURED", "REPLICA_LOCAL_FILE", False)
    for method in ("POST", "PUT", "DELETE"):
        assert reader.request(method, "/api/v1-command-center/agent-fabric/storage/artifacts").status_code == 405


# ================================================================ Phase 7: read-only artifact viewer projection


def test_run_artifact_projection_serves_only_verified_bodies_of_that_run(env, monkeypatch):
    from fabric.command.live_operations import run_artifact_projection

    _, run_id, artifact_id = _executed()
    _, other_run, other_artifact = _executed()
    ok = run_artifact_projection(run_id, artifact_id)
    assert (ok["state"], ok["trust"], ok["body_available"]) == ("AVAILABLE", "VERIFIED", True)
    assert ok["artifact"]["storage_state"] == "STORED" and ok["body"]["type"] == "draft_artifact"
    assert "body_canonical" not in json.dumps(ok) and env["dsn"] not in json.dumps(ok)
    assert run_artifact_projection(run_id, other_artifact) == {**run_artifact_projection(run_id, other_artifact), "state": "NOT_AVAILABLE", "reason_code": "ARTIFACT_NOT_IN_RUN"}
    q(env, "UPDATE fabric_run_artifacts SET body_canonical = replace(body_canonical, 'draft', 'DRAFT') WHERE artifact_id = %s", other_artifact)
    tampered = run_artifact_projection(other_run, other_artifact)
    assert (tampered["trust"], tampered["body"], tampered["body_available"]) == ("INTEGRITY_FAILED", None, False)
    via_route = _client("u-reader").get(f"/api/v1-command-center/agent-fabric/runs/{run_id}/artifacts/{artifact_id}").json()
    assert (via_route["kind"], via_route["read_only"], via_route["trust"]) == ("run_artifact", True, "VERIFIED")


def test_run_artifact_projection_legacy_is_untrusted_and_absent_in_production(env, monkeypatch):
    from fabric.command.live_operations import run_artifact_projection

    env["artifacts"].mkdir(parents=True)
    (env["artifacts"] / "draft_legacy_2.json").write_text(json.dumps({"type": "draft_artifact", "body": {"legacy": True}}))
    env["log"].parent.mkdir(parents=True)
    env["log"].write_text(json.dumps({"runId": "legacy-run-2", "kind": "execute", "outcome": "ok", "ts": "2026-01-09T03:56:55+00:00",
                                      "artifacts": [{"artifactId": "draft_legacy_2", "sha256": "d" * 64}]}) + "\n")
    dev = run_artifact_projection("legacy-run-2", "draft_legacy_2")
    assert (dev["trust"], dev["body"], dev["artifact"]["storage_state"]) == ("NOT_TRUSTED_REPLICA_LOCAL", {"type": "draft_artifact", "body": {"legacy": True}}, "LEGACY_REPLICA_LOCAL")
    monkeypatch.setenv("SHS_AUTH_ENV", "production")
    prod = run_artifact_projection("legacy-run-2", "draft_legacy_2")
    assert (prod["trust"], prod["body"], prod["body_available"]) == ("NOT_TRUSTED_REPLICA_LOCAL", None, False)
