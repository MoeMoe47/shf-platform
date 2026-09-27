from __future__ import annotations

"""
AFCC-3 Phase 3 — authenticated approval authority, execution identity, live state.

Proves: plan creation, approval, rejection and execution require a Fabric
session + CSRF + a narrow fabric.* permission; no admin key, service identity or
read permission can reach them; approvals are attributable; body identity is
DECLARED only; rejected/pending/unattributed plans cannot execute; execution
writes a durable start event before work and always attempts a truthful
terminal event; one correlation id runs through the whole chain.
"""

import hashlib
import hmac
import json
import time
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from auth import permissions as perms
from auth.audit import _EVENTS
from auth.config import get_auth_settings
from auth.sessions import _SESSIONS, create_session
from auth.store import AuthUser
from fabric import run_lifecycle as lc
from fabric.command.live_operations import live_runs_projection, run_detail_projection, run_timeline_projection
from main import app  # type: ignore
from services.internal_service_identity import canonical_request_bytes

ADMIN_KEY = "phase3-admin-key-must-not-authorize"
KID = "phase3-kid"
SECRET = "phase3-hmac-secret-value"
APPROVER = "u-approver"
# Phase 4.1 Policy B: plans are created by a different operator than the approver.
CREATOR = "u-creator"


@pytest.fixture(autouse=True)
def isolated(monkeypatch, tmp_path):
    import fabric.plan_store as plan_store
    import routers.runs_routes as runs_routes

    monkeypatch.setenv("ADMIN_API_KEY", ADMIN_KEY)
    monkeypatch.setenv("SHF_INTERNAL_SERVICE_KEYS_JSON", json.dumps({KID: SECRET}))
    monkeypatch.setenv("SHF_INTERNAL_SERVICE_ACTIVE_KID", KID)
    plans = tmp_path / "plans"
    monkeypatch.setattr(plan_store, "PLANS_DIR", plans)
    monkeypatch.setattr(runs_routes, "PLANS_DIR", plans)
    monkeypatch.setattr(runs_routes, "ARTIFACTS_DIR", tmp_path / "artifacts")
    monkeypatch.setattr(runs_routes, "RUNS_LOG", tmp_path / "runs" / "events.jsonl")
    monkeypatch.setattr(runs_routes, "assert_global_execution_allowed", lambda route: None)
    _SESSIONS.clear()
    _EVENTS.clear()
    yield {"plans": plans, "log": runs_routes.RUNS_LOG, "artifacts": tmp_path / "artifacts"}
    _SESSIONS.clear()
    _EVENTS.clear()


def _client(role: str | None, *, user_id: str = APPROVER, org: str | None = None, csrf: bool = True) -> TestClient:
    c = TestClient(app)
    if role is None:
        return c
    token, session = create_session(AuthUser(user_id=user_id, email=f"{user_id}@test.invalid", display_name=user_id,
                                             role=role, password_hash="", organization_id=org))
    c.cookies.set(get_auth_settings().cookie_name, token)
    if csrf:
        c.headers.update({"x-csrf-token": session.csrf_token})
    c.secret_material = (token, session.csrf_token)  # type: ignore[attr-defined]
    return c


def _signed(method: str, path: str) -> dict:
    now = int(time.time())
    digest = hashlib.sha256(b"{}").hexdigest()
    msg = canonical_request_bytes(method, path, digest, str(now), str(now + 60), KID)
    return {"X-SHF-Service-Id": "service:shs-api", "X-SHF-Service-Kid": KID, "X-SHF-Service-Iat": str(now),
            "X-SHF-Service-Exp": str(now + 60), "X-SHF-Service-Signature": hmac.new(SECRET.encode(), msg, hashlib.sha256).hexdigest()}


def _plan(stores, plan: dict) -> str:
    stores["plans"].mkdir(parents=True, exist_ok=True)
    (stores["plans"] / f"{plan['planId']}.json").write_text(json.dumps(plan), encoding="utf-8")
    return plan["planId"]


def _read_plan(stores, plan_id: str) -> dict:
    return json.loads((stores["plans"] / f"{plan_id}.json").read_text())


def _log(stores) -> list[dict]:
    return [json.loads(l) for l in stores["log"].read_text().splitlines()] if stores["log"].exists() else []


def _create(c: TestClient, **headers) -> str:
    # Always created by CREATOR so that `c` (usually the approver) may decide it.
    res = _client("shs_admin", user_id=CREATOR).post("/plan", json={"agentName": "UnregisteredTestAgent", "input": {"x": 1}}, headers=headers)
    assert res.status_code == 200, res.text
    return res.json()["planId"]


# ================================================================== security


WRITE_ROUTES = [
    ("POST", "/plan", {"agentName": "A", "input": {}}),
    ("POST", "/plan/p1/approve", {}),
    ("POST", "/plan/p1/reject", {}),
    ("POST", "/runs/execute", {"planId": "p1", "approved": True}),
]


@pytest.mark.parametrize("method,path,body", WRITE_ROUTES)
def test_unauthenticated_writes_are_rejected(isolated, method, path, body):
    assert TestClient(app).request(method, path, json=body).status_code == 401
    assert _log(isolated) == [] and not isolated["plans"].exists()


@pytest.mark.parametrize("method,path,body", WRITE_ROUTES)
def test_admin_key_and_service_identity_are_not_write_authority(isolated, method, path, body):
    c = TestClient(app)
    assert c.request(method, path, json=body, headers={"X-Admin-Key": ADMIN_KEY}).status_code == 401
    assert c.request(method, path, json=body, headers=_signed(method, path)).status_code == 401
    assert _log(isolated) == []


@pytest.mark.parametrize("role", ["client_admin", "client"])
@pytest.mark.parametrize("method,path,body", WRITE_ROUTES)
def test_wrong_role_is_forbidden(isolated, role, method, path, body):
    assert _client(role, org="client-demo").request(method, path, json=body).status_code == 403


def test_read_permission_cannot_create_approve_reject_or_execute(isolated, monkeypatch):
    # A role holding ONLY the Command Center read grant.
    monkeypatch.setitem(perms.ROLE_PERMISSION_MAP, perms.ROLE_CLIENT_ADMIN, ("bos.governance.read",))
    reader = _client("client_admin")
    plan_id = _create(_client("shs_admin"))
    assert reader.get("/plans/recent").status_code == 200, "the read grant still reads"
    for method, path, body in [("POST", "/plan", {"agentName": "A", "input": {}}), ("POST", f"/plan/{plan_id}/approve", {}),
                               ("POST", f"/plan/{plan_id}/reject", {}), ("POST", "/runs/execute", {"planId": plan_id, "approved": True})]:
        assert reader.request(method, path, json=body).status_code == 403, path
    assert _read_plan(isolated, plan_id)["status"] == "PLANNED"
    assert _log(isolated) == []


def test_permissions_are_narrow_and_separate():
    assert set(perms.FABRIC_RUN_AUTHORITY_PERMISSIONS) == {"fabric.plan.create", "fabric.plan.approve", "fabric.run.execute"}
    for p in perms.FABRIC_RUN_AUTHORITY_PERMISSIONS:
        assert perms.has_permission("shs_admin", p)
        assert not perms.has_permission("client_admin", p) and not perms.has_permission("client", p)
    assert "audit.view" not in perms.FABRIC_RUN_AUTHORITY_PERMISSIONS
    assert "bos.governance.read" not in perms.FABRIC_RUN_AUTHORITY_PERMISSIONS


def test_session_without_csrf_cannot_write(isolated):
    c = _client("shs_admin", csrf=False)
    for method, path, body in WRITE_ROUTES:
        assert c.request(method, path, json=body).status_code == 403, path


def test_plan_reads_require_the_read_grant(isolated):
    assert TestClient(app).get("/plans/recent").status_code == 401
    assert TestClient(app).get("/plan/p1").status_code == 401
    assert _client("client", org="client-demo").get("/plans/recent").status_code == 403


def test_authorized_approver_decision_is_attributable(isolated):
    admin = _client("shs_admin")
    plan_id = _create(admin, **{"X-Correlation-Id": "corr-approval-0001"})
    res = admin.post(f"/plan/{plan_id}/approve", json={"reason": "reviewed scope"})
    assert res.status_code == 200 and res.json()["decidedBy"] == APPROVER
    plan = _read_plan(isolated, plan_id)
    decision = plan["approvalDecision"]
    assert (plan["status"], plan["approved"]) == ("APPROVED", True)
    assert decision["decision"] == "APPROVED" and decision["plan_id"] == plan_id
    assert (decision["approver_actor_id"], decision["approver_type"]) == (APPROVER, "HUMAN")
    assert decision["identity_verification"] == {"actor": "VERIFIED", "organization": "VERIFIED", "tenant": "VERIFIED", "source_system": "VERIFIED"}
    assert decision["authority"] == {"authentication": "FABRIC_SESSION", "role": "shs_admin", "permission": "fabric.plan.approve", "scope": "PLATFORM_GLOBAL"}
    assert (decision["organization_id"], decision["tenant_id"]) == ("NOT_APPLICABLE", "NOT_APPLICABLE")
    assert decision["reason"] == "reviewed scope" and decision["decided_at"]
    assert decision["correlation_id"] == "corr-approval-0001"
    assert plan["approvalHistory"] == [decision]
    assert plan["createdBy"]["creator_actor_id"] == CREATOR
    assert any(e["event_type"] == "fabric_plan_decision_recorded" and e["user_id"] == APPROVER for e in _EVENTS)


def test_rejection_is_attributable_and_decisions_are_final(isolated):
    admin = _client("shs_admin")
    plan_id = _create(admin)
    assert admin.post(f"/plan/{plan_id}/reject", json={"reason": "out of scope"}).status_code == 200
    plan = _read_plan(isolated, plan_id)
    assert (plan["status"], plan["approved"], plan["approvalDecision"]["decision"]) == ("REJECTED", False, "REJECTED")
    other = _client("shs_admin", user_id="u-second")
    assert other.post(f"/plan/{plan_id}/approve").json()["detail"] == "DECISION_ALREADY_RECORDED"
    assert _read_plan(isolated, plan_id)["status"] == "REJECTED"


def test_body_identity_claims_are_declared_never_verified(isolated):
    admin = _client("shs_admin")
    spoof = {"actor_id": "ceo", "organizationId": "org_victim", "tenant_id": "tenant:org_victim", "source_system": "payroll"}
    res = _client("shs_admin", user_id=CREATOR).post("/plan", json={"agentName": "UnregisteredTestAgent", "input": {"x": 1, **spoof}})
    plan_id = res.json()["planId"]
    assert admin.post(f"/plan/{plan_id}/approve", json={"approver_id": "ceo", "organization_id": "org_victim"}).status_code == 200
    run_id = admin.post("/runs/execute", json={"planId": plan_id, "actorId": "ceo", "organizationId": "org_victim", "userId": "u@x.com"}).json()["runId"]

    plan = _read_plan(isolated, plan_id)
    assert plan["createdBy"]["creator_actor_id"] == CREATOR and plan["organization_id"] == "NOT_APPLICABLE"
    assert plan["declared_identity"]["verification"] == "DECLARED" and plan["declared_identity"]["actor_id"] == "ceo"
    assert plan["approvalDecision"]["approver_actor_id"] == APPROVER
    assert plan["approvalDecision"]["declared_identity"] == {"actor_id": "ceo", "organization_id": "org_victim", "verification": "DECLARED"}
    for event in _log(isolated):
        assert event["initiator_actor_id"] == APPROVER and event["organization_id"] == "NOT_APPLICABLE"
        assert event["declared_identity"]["verification"] == "DECLARED"

    run = run_detail_projection(run_id)["run"]
    assert (run["initiator"]["actor_id"], run["initiator"]["actor_verification"]) == (APPROVER, "VERIFIED")
    assert (run["organization_id"], run["initiator"]["organization_verification"]) == ("NOT_APPLICABLE", "VERIFIED")
    assert run["initiator"]["declared_identity"]["actor_id"] == "ceo"
    assert run["initiator"]["declared_identity"]["verification"] == "DECLARED"
    assert run["approval"]["decision"]["approver_actor_id"] == APPROVER
    assert run["approval"]["decision"]["actor_verification"] == "VERIFIED"
    assert "org_victim" not in json.dumps({k: v for k, v in run.items() if k not in {"initiator", "approval"}})


def test_legacy_shared_credential_run_is_not_a_human(isolated):
    isolated["log"].parent.mkdir(parents=True, exist_ok=True)
    isolated["log"].write_text(json.dumps({"runId": "p2-run", "outcome": "ok", "ts": "2026-09-01T00:00:00Z",
                                           "schema_version": "fabric.run_event.v2", "initiator_type": "SHARED_ADMIN_CREDENTIAL",
                                           "actorId": "claimed-person"}) + "\n")
    initiator = run_detail_projection("p2-run")["run"]["initiator"]
    assert initiator["initiator_type"] == "SHARED_ADMIN_CREDENTIAL"
    assert initiator["actor_verification"] == "DECLARED", "an unverified captured actor is only DECLARED"
    assert initiator["organization_verification"] == "NOT_CAPTURED"


def test_org_scoped_actor_cannot_act_on_another_scope(isolated, monkeypatch):
    monkeypatch.setitem(perms.ROLE_PERMISSION_MAP, perms.ROLE_CLIENT_ADMIN, perms.FABRIC_RUN_AUTHORITY_PERMISSIONS)
    platform_plan = _create(_client("shs_admin"))
    scoped = _client("client_admin", user_id="u-scoped", org="org_a")
    assert scoped.post(f"/plan/{platform_plan}/approve").status_code == 404, "never confirms the plan exists"
    other_org = _plan(isolated, {"planId": "plan-org-b", "status": "PLANNED", "approvalRequired": False, "organization_id": "org_b", "steps": []})
    assert scoped.post("/runs/execute", json={"planId": other_org}).status_code == 404
    own = scoped.post("/plan", json={"agentName": "A", "input": {}}).json()["planId"]
    plan = _read_plan(isolated, own)
    assert plan["organization_id"] == "org_a"
    assert plan["createdBy"]["identity_verification"]["organization"] == "VERIFIED"
    assert plan["createdBy"]["tenant_id"] == "tenant:org_a"
    assert plan["createdBy"]["identity_verification"]["tenant"] == "DERIVED_FROM_VERIFIED_ORGANIZATION"
    assert scoped.post(f"/plan/{own}/approve").json()["detail"] == "SELF_APPROVAL_DENIED"
    assert _client("client_admin", user_id="u-scoped-2", org="org_a").post(f"/plan/{own}/approve").status_code == 200
    assert _log(isolated) == []


def test_rejected_pending_and_unattributed_plans_cannot_execute(isolated):
    admin = _client("shs_admin")
    rejected = _create(admin)
    admin.post(f"/plan/{rejected}/reject")
    pending = _create(admin)
    legacy = _plan(isolated, {"planId": "legacy-approved", "status": "APPROVED", "approved": True, "approvalRequired": True, "steps": []})
    legacy_rejected_flagged = _plan(isolated, {"planId": "legacy-rej", "status": "REJECTED", "approved": False, "approvalRequired": True, "steps": []})

    assert admin.post("/runs/execute", json={"planId": rejected, "approved": True}).json()["detail"] == "PLAN_REJECTED"
    assert admin.post("/runs/execute", json={"planId": pending, "approved": True}).json()["detail"] == "APPROVAL_REQUIRED"
    assert admin.post("/runs/execute", json={"planId": legacy, "approved": True}).json()["detail"] == "APPROVAL_NOT_ATTRIBUTABLE"
    assert admin.post("/runs/execute", json={"planId": legacy_rejected_flagged, "approved": True}).json()["detail"] == "PLAN_REJECTED"
    assert _log(isolated) == [], "a refused request never becomes a run"

    # A verified approver can attribute a legacy approval; then it executes.
    assert admin.post(f"/plan/{legacy}/approve").status_code == 200
    assert admin.post("/runs/execute", json={"planId": legacy}).status_code == 200
    assert admin.post(f"/plan/{legacy}/reject").json()["detail"] == "PLAN_ALREADY_EXECUTED"


def test_not_required_plan_follows_current_policy(isolated):
    plan_id = _plan(isolated, {"planId": "free-plan", "status": "PLANNED", "approvalRequired": False, "steps": []})
    admin = _client("shs_admin")
    assert admin.post(f"/plan/{plan_id}/approve").json()["detail"] == "APPROVAL_NOT_REQUIRED"
    assert admin.post("/runs/execute", json={"planId": plan_id}).status_code == 200
    assert _log(isolated)[-1]["approval_basis"] == "NOT_REQUIRED"


def test_no_secrets_in_records_or_responses(isolated):
    admin = _client("shs_admin")
    token, csrf = admin.secret_material  # type: ignore[attr-defined]
    creator = _client("shs_admin", user_id=CREATOR)
    created = creator.post("/plan", json={"agentName": "UnregisteredTestAgent", "input": {"x": 1}})
    plan_id = created.json()["planId"]
    approved = admin.post(f"/plan/{plan_id}/approve")
    executed = admin.post("/runs/execute", json={"planId": plan_id})
    stored = (isolated["plans"] / f"{plan_id}.json").read_text() + isolated["log"].read_text()
    projected = json.dumps(live_runs_projection()) + json.dumps(run_timeline_projection(executed.json()["runId"]))
    for blob in (stored, projected, created.text, approved.text):
        for secret in (token, csrf, *creator.secret_material, ADMIN_KEY, SECRET, f"{APPROVER}@test.invalid", f"{CREATOR}@test.invalid"):
            assert secret not in blob


# ================================================================== lifecycle


def _approved_plan(isolated, **headers) -> tuple[TestClient, str]:
    admin = _client("shs_admin")
    plan_id = _create(admin, **headers)
    assert admin.post(f"/plan/{plan_id}/approve").status_code == 200
    return admin, plan_id


def test_start_event_is_durable_before_work_and_observable_as_executing(isolated, monkeypatch):
    import routers.runs_routes as runs_routes

    admin, plan_id = _approved_plan(isolated)
    seen = {}
    real_write = runs_routes._write_json

    def observing_write(path, obj):
        if "artifacts" in str(path) and not seen:
            events = _log(isolated)
            seen["events"] = [e["event_type"] for e in events]
            seen["state"] = run_detail_projection(events[0]["runId"])["run"]["current_state"]
            seen["started_at"] = run_detail_projection(events[0]["runId"])["run"]["started_at"]
        return real_write(path, obj)

    monkeypatch.setattr(runs_routes, "_write_json", observing_write)
    run_id = admin.post("/runs/execute", json={"planId": plan_id}).json()["runId"]
    assert seen["events"] == ["run.execution_started"], "start is on disk before any artifact is written"
    assert seen["state"] == "EXECUTING" and seen["started_at"] != "NOT_CAPTURED"
    events = _log(isolated)
    assert [e["event_type"] for e in events] == ["run.execution_started", "run.completed"]
    assert events[0]["ts"] <= events[1]["ts"]
    run = run_detail_projection(run_id)["run"]
    assert run["current_state"] == "COMPLETED" and run["started_at"] == events[0]["ts"]
    assert [e["to_state"] for e in run_timeline_projection(run_id)["events"]] == ["APPROVAL_REQUIRED", "APPROVED", "EXECUTING", "COMPLETED"]


@pytest.mark.parametrize("fail_on,code", [("artifacts", "ARTIFACT_WRITE_FAILED"), ("plans", "PLAN_UPDATE_FAILED")])
def test_failure_writes_failed_terminal_and_reraises_original(isolated, monkeypatch, fail_on, code):
    import routers.runs_routes as runs_routes

    admin, plan_id = _approved_plan(isolated)
    real_write = runs_routes._write_json

    class Boom(OSError):
        pass

    def failing_write(path, obj):
        if fail_on in str(path):
            raise Boom("disk full at /srv/secret/path")
        return real_write(path, obj)

    monkeypatch.setattr(runs_routes, "_write_json", failing_write)
    with pytest.raises(Boom):
        admin.post("/runs/execute", json={"planId": plan_id})
    events = _log(isolated)
    assert [e["event_type"] for e in events] == ["run.execution_started", "run.execution_failed"]
    assert "run.completed" not in {e["event_type"] for e in events}
    failed = events[1]
    assert (failed["from_state"], failed["to_state"], failed["outcome"], failed["failure_code"]) == ("EXECUTING", "FAILED", "error", code)
    assert "/srv/" not in json.dumps(failed) and "disk full" not in json.dumps(failed)
    run = run_detail_projection(events[0]["runId"])["run"]
    assert run["current_state"] == "FAILED" and run["failure_code"] == code
    assert [e["to_state"] for e in run_timeline_projection(run["run_id"])["events"]][-2:] == ["EXECUTING", "FAILED"]
    assert _read_plan(isolated, plan_id)["status"] != "DONE"


def test_original_error_survives_when_failure_event_cannot_be_written(isolated, monkeypatch):
    import routers.runs_routes as runs_routes

    admin, plan_id = _approved_plan(isolated)
    real_append = runs_routes._append_run_event
    calls = []

    def append(ev):
        calls.append(ev["event_type"])
        if ev["event_type"] == "run.execution_failed":
            raise PermissionError("log unwritable")
        return real_append(ev)

    monkeypatch.setattr(runs_routes, "_append_run_event", append)
    monkeypatch.setattr(runs_routes, "_write_json", lambda path, obj: (_ for _ in ()).throw(ValueError("original")))
    with pytest.raises(ValueError, match="original"):
        admin.post("/runs/execute", json={"planId": plan_id})
    assert calls == ["run.execution_started", "run.execution_failed"]
    # No terminal made it to disk: the run truthfully stays EXECUTING (terminal not recorded).
    assert run_detail_projection(_log(isolated)[0]["runId"])["run"]["current_state"] == "EXECUTING"


def test_correlation_is_one_id_across_the_whole_chain(isolated):
    corr = "corr-phase3-chain-01"
    admin = _client("shs_admin")
    plan_id = _create(admin, **{"X-Correlation-Id": corr})
    admin.post(f"/plan/{plan_id}/approve", headers={"X-Correlation-Id": "corr-ignored-0002"})
    run_id = admin.post("/runs/execute", json={"planId": plan_id}, headers={"X-Correlation-Id": "corr-ignored-0003"}).json()["runId"]
    plan = _read_plan(isolated, plan_id)
    events = _log(isolated)
    artifact = json.loads(next(isolated["artifacts"].glob("*.json")).read_text())
    ids = {plan["correlationId"], plan["approvalDecision"]["correlation_id"], artifact["provenance"]["correlation_id"], *(e["correlation_id"] for e in events)}
    assert ids == {corr}
    assert artifact["provenance"] == {"run_id": run_id, "plan_id": plan_id, "correlation_id": corr}
    run = run_detail_projection(run_id)["run"]
    assert run["correlation"] == {"id": corr, "source": "PLAN", "continuity": "CONSISTENT"}
    assert {e["correlation_id"] for e in run_timeline_projection(run_id)["events"]} == {corr}


def test_divergent_correlation_is_reported(isolated):
    _plan(isolated, {"planId": "div-plan", "status": "DONE", "approved": True, "approvalRequired": True, "correlationId": "corr-plan-000001"})
    isolated["log"].parent.mkdir(parents=True, exist_ok=True)
    isolated["log"].write_text(json.dumps({"runId": "div-run", "planId": "div-plan", "outcome": "ok", "ts": "2026-09-02T00:00:00Z", "correlation_id": "corr-other-00002"}) + "\n")
    assert run_detail_projection("div-run")["run"]["correlation"]["continuity"] == "DIVERGENT"


@pytest.mark.parametrize("events,expected,reason", [
    ([{"event_type": "run.execution_started", "schema_version": lc.RUN_EVENT_SCHEMA, "to_state": "EXECUTING", "outcome": "started", "ts": "1"}], "EXECUTING", "RUN_EXECUTION_STARTED"),
    ([{"event_type": "run.execution_started", "schema_version": lc.RUN_EVENT_SCHEMA, "to_state": "EXECUTING", "ts": "1"},
      {"to_state": "COMPLETED", "outcome": "ok", "ts": "2"}], "COMPLETED", "RUN_EVENT_TERMINAL"),
    ([{"event_type": "run.execution_started", "schema_version": lc.RUN_EVENT_SCHEMA, "to_state": "EXECUTING", "ts": "1"},
      {"to_state": "FAILED", "outcome": "error", "ts": "2"}], "FAILED", "RUN_EVENT_TERMINAL"),
    ([{"event_type": "run.execution_started", "schema_version": lc.RUN_EVENT_SCHEMA, "to_state": "EXECUTING", "ts": "5"},
      {"to_state": "COMPLETED", "outcome": "ok", "ts": "2"}], "UNKNOWN", "EVENT_ORDER_CONFLICT"),
    ([{"event_type": "run.execution_started", "schema_version": lc.RUN_EVENT_SCHEMA, "to_state": "EXECUTING", "ts": "1"},
      {"event_type": "run.execution_started", "schema_version": lc.RUN_EVENT_SCHEMA, "to_state": "EXECUTING", "ts": "2"}], "UNKNOWN", "DUPLICATE_START_EVENT"),
    ([{"to_state": "EXECUTING", "ts": "1"}], "UNKNOWN", "UNSUPPORTED_STATE_IN_SOURCE"),
    ([{"event_type": "run.execution_started", "to_state": "EXECUTING", "ts": "1"}], "UNKNOWN", "UNSUPPORTED_STATE_IN_SOURCE"),
])
def test_executing_only_from_a_recorded_start_event(events, expected, reason):
    derived = lc.derive_run_state(events, None)
    assert (derived["state"], derived["reason_code"]) == (expected, reason)


def test_verified_basis_without_verified_plan_decision_fails_safe():
    events = [{"outcome": "ok", "approval_basis": "PLAN_APPROVAL_VERIFIED"}]
    plan = {"status": "DONE", "approved": True, "approvalRequired": True}
    assert lc.derive_run_state(events, plan)["reason_code"] == "APPROVAL_PROVENANCE_CONFLICT"


def test_deferred_states_stay_deferred():
    # Phase 4 made TIMED_OUT (enforced deadline) and ORPHANED (expired lease) live.
    assert {"EXECUTING", "TIMED_OUT", "ORPHANED"} <= lc.SUPPORTED_STATES
    for state in ("QUEUED", "WAITING", "RETRYING", "CANCEL_REQUESTED", "CANCELLED", "REVOKED"):
        assert state in lc.DEFERRED_STATES and state not in lc.SUPPORTED_STATES
    assert not any(getattr(r, "path", "").endswith(("/cancel", "/revoke", "/timeout", "/retry")) and "runs" in getattr(r, "path", "") for r in app.routes)


def test_afcc_router_stays_get_only():
    methods = {m for r in app.routes if getattr(r, "path", "").startswith("/api/v1-command-center/agent-fabric") for m in getattr(r, "methods", set())}
    assert methods <= {"GET", "HEAD"}
