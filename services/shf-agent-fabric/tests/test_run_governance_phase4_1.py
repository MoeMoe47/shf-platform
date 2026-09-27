from __future__ import annotations

"""
AFCC-3 Phase 4.1 — separation of duties (Policy B) and truthful execution safety.

Proves: the verified plan creator can neither approve nor reject their own plan
(403 SELF_APPROVAL_DENIED); a different authorized approver can, and may also
execute; body identity cannot bypass the rule; cross-org stays 404; legacy plans
without a verified creator stay decidable; the dev-only second operator never
exists in production; and nothing claims distributed single-flight while the
claim is a replica-local file.
"""

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from auth import permissions as perms
from auth import store as auth_store
from auth.audit import _EVENTS
from auth.config import get_auth_settings
from auth.sessions import _SESSIONS, create_session
from auth.store import FIXTURE_PASSWORD, AuthUser
from fabric import run_claims
from fabric.command.live_operations import live_runs_projection, run_detail_projection
from main import app  # type: ignore

CREATOR = "u-creator"
APPROVER = "u-approver"


@pytest.fixture(autouse=True)
def isolated(monkeypatch, tmp_path):
    import fabric.plan_store as plan_store
    import routers.runs_routes as runs_routes

    plans = tmp_path / "plans"
    monkeypatch.setattr(plan_store, "PLANS_DIR", plans)
    monkeypatch.setattr(runs_routes, "PLANS_DIR", plans)
    monkeypatch.setattr(runs_routes, "ARTIFACTS_DIR", tmp_path / "artifacts")
    monkeypatch.setattr(runs_routes, "RUNS_LOG", tmp_path / "runs" / "events.jsonl")
    monkeypatch.setattr(runs_routes, "assert_global_execution_allowed", lambda route: None)
    _SESSIONS.clear()
    _EVENTS.clear()
    yield {"plans": plans, "log": runs_routes.RUNS_LOG}
    _SESSIONS.clear()
    _EVENTS.clear()


def _client(user_id: str, role: str = "shs_admin", org: str | None = None) -> TestClient:
    token, session = create_session(AuthUser(user_id=user_id, email=f"{user_id}@test.invalid", display_name=user_id,
                                             role=role, password_hash="", organization_id=org))
    c = TestClient(app)
    c.cookies.set(get_auth_settings().cookie_name, token)
    c.headers.update({"x-csrf-token": session.csrf_token})
    return c


def _create(c: TestClient, body_input: dict | None = None) -> str:
    res = c.post("/plan", json={"agentName": "UnregisteredTestAgent", "input": body_input or {"x": 1}})
    assert res.status_code == 200, res.text
    return res.json()["planId"]


def _plan(isolated, plan_id: str) -> dict:
    return json.loads((isolated["plans"] / f"{plan_id}.json").read_text())


# ================================================================ Policy B


@pytest.mark.parametrize("decision", ["approve", "reject"])
def test_creator_cannot_decide_own_plan(isolated, decision):
    creator = _client(CREATOR)
    plan_id = _create(creator)
    res = creator.post(f"/plan/{plan_id}/{decision}", json={"reason": "my own plan"})
    assert res.status_code == 403 and res.json()["detail"] == "SELF_APPROVAL_DENIED"
    plan = _plan(isolated, plan_id)
    assert (plan["status"], plan["approved"]) == ("PLANNED", False)
    assert "approvalDecision" not in plan and "approvalHistory" not in plan
    refused = [e for e in _EVENTS if e["event_type"] == "fabric_plan_decision_refused"]
    assert refused and refused[-1]["user_id"] == CREATOR and refused[-1]["metadata"]["reason"] == "SELF_APPROVAL_DENIED"


def test_different_authorized_approver_succeeds_and_may_execute(isolated):
    plan_id = _create(_client(CREATOR))
    approver = _client(APPROVER)
    assert approver.post(f"/plan/{plan_id}/approve").status_code == 200
    plan = _plan(isolated, plan_id)
    assert plan["createdBy"]["creator_actor_id"] == CREATOR
    assert plan["approvalDecision"]["approver_actor_id"] == APPROVER
    assert len(plan["approvalHistory"]) == 1
    # Policy B only separates creator and approver; the approver may execute.
    executed = approver.post("/runs/execute", json={"planId": plan_id})
    assert executed.status_code == 200
    run = run_detail_projection(executed.json()["runId"])["run"]
    assert run["initiator"]["actor_id"] == APPROVER and run["current_state"] == "COMPLETED"
    # The creator may also execute once someone else approved.
    plan2 = _create(_client(CREATOR))
    approver.post(f"/plan/{plan2}/approve")
    assert _client(CREATOR).post("/runs/execute", json={"planId": plan2}).status_code == 200


def test_unauthorized_approver_fails_on_permission_not_policy(isolated):
    plan_id = _create(_client(CREATOR))
    res = _client("u-client", role="client_admin", org="client-demo").post(f"/plan/{plan_id}/approve")
    assert res.status_code == 403 and res.json()["detail"] == "Forbidden"


def test_cross_org_stays_404_even_for_the_creator_of_another_plan(isolated, monkeypatch):
    monkeypatch.setitem(perms.ROLE_PERMISSION_MAP, perms.ROLE_CLIENT_ADMIN, perms.FABRIC_RUN_AUTHORITY_PERMISSIONS)
    org_a_creator = _client("u-a-creator", role="client_admin", org="org_a")
    own = _create(org_a_creator)
    platform_plan = _create(_client(CREATOR))
    assert org_a_creator.post(f"/plan/{platform_plan}/approve").status_code == 404
    org_b = _client("u-b", role="client_admin", org="org_b")
    assert org_b.post(f"/plan/{own}/approve").status_code == 404, "404 before the self-approval rule"
    assert org_a_creator.post(f"/plan/{own}/approve").json()["detail"] == "SELF_APPROVAL_DENIED"
    assert _client("u-a-approver", role="client_admin", org="org_a").post(f"/plan/{own}/approve").status_code == 200


def test_final_decision_and_self_approval_are_both_preserved(isolated):
    creator = _client(CREATOR)
    plan_id = _create(creator)
    assert _client(APPROVER).post(f"/plan/{plan_id}/reject").status_code == 200
    assert creator.post(f"/plan/{plan_id}/approve").json()["detail"] == "SELF_APPROVAL_DENIED"
    assert _client("u-third").post(f"/plan/{plan_id}/approve").json()["detail"] == "DECISION_ALREADY_RECORDED"
    assert [d["decision"] for d in _plan(isolated, plan_id)["approvalHistory"]] == ["REJECTED"]


@pytest.mark.parametrize("created_by", [
    None,  # pre-Phase-3 plan: no creator recorded
    {"creator_actor_id": CREATOR},  # creator recorded without verification
    {"creator_actor_id": CREATOR, "identity_verification": {"actor": "DECLARED"}},
])
def test_legacy_plan_without_verified_creator_stays_decidable(isolated, created_by):
    plan = {"planId": "legacy-plan", "status": "PLANNED", "approved": False, "approvalRequired": True, "steps": []}
    if created_by:
        plan["createdBy"] = created_by
    isolated["plans"].mkdir(parents=True, exist_ok=True)
    (isolated["plans"] / "legacy-plan.json").write_text(json.dumps(plan))
    # Even the actor named in an unverified record may decide: nothing proves they created it.
    assert _client(CREATOR).post("/plan/legacy-plan/approve").status_code == 200


def test_body_spoofing_cannot_bypass_or_trigger_the_rule(isolated):
    creator = _client(CREATOR)
    # Creator claims someone else created it / is approving: still denied.
    plan_id = _create(creator, {"x": 1, "actor_id": "someone-else", "creator_actor_id": "someone-else"})
    for body in ({"approver_id": "someone-else"}, {"actor_id": "someone-else", "userId": "someone-else"}, {"creator_actor_id": "x"}):
        assert creator.post(f"/plan/{plan_id}/approve", json=body).json()["detail"] == "SELF_APPROVAL_DENIED"
    # A declared claim naming the approver as creator cannot block the real approver.
    plan2 = _create(creator, {"x": 1, "actor_id": APPROVER, "creator_actor_id": APPROVER})
    assert _plan(isolated, plan2)["declared_identity"]["actor_id"] == APPROVER
    assert _client(APPROVER).post(f"/plan/{plan2}/approve", json={"actor_id": CREATOR}).status_code == 200
    assert _plan(isolated, plan2)["approvalDecision"]["approver_actor_id"] == APPROVER


# ================================================================ dev workflow fixtures


def test_dev_approver_fixture_exists_only_outside_production(monkeypatch):
    monkeypatch.setenv("SHS_AUTH_ENV", "development")
    dev = auth_store.find_user_by_email("approver@demo.shs")
    assert dev and dev.role == perms.ROLE_SHS_ADMIN and dev.organization_id is None
    assert dev.user_id != auth_store.find_user_by_email("shs@demo.shs").user_id
    for env in ("production", "staging", "prod", ""):
        monkeypatch.setenv("SHS_AUTH_ENV", env)
        monkeypatch.setenv("ENVIRONMENT", env)
        if env == "":
            monkeypatch.delenv("SHS_AUTH_ENV")
            monkeypatch.setenv("ENVIRONMENT", "production")
        assert auth_store.find_user_by_email("approver@demo.shs") is None, env
        assert auth_store.authenticate_user("approver@demo.shs", FIXTURE_PASSWORD) is None
        assert "approver@demo.shs" not in {u["email"] for u in auth_store.list_sanitized_users()}


def test_script_flow_creator_approver_executor_via_real_login(isolated, monkeypatch):
    """The bin/run_plan.sh sequence, through the real /auth/login endpoint."""
    monkeypatch.setenv("SHS_AUTH_ENV", "development")

    def login(email: str) -> TestClient:
        c = TestClient(app)
        res = c.post("/auth/login", json={"email": email, "password": FIXTURE_PASSWORD})
        assert res.status_code == 200, res.text
        c.headers.update({"x-csrf-token": res.json()["csrf_token"]})
        return c

    creator, approver = login("shs@demo.shs"), login("approver@demo.shs")
    plan_id = _create(creator)
    assert creator.post(f"/plan/{plan_id}/approve").json()["detail"] == "SELF_APPROVAL_DENIED"
    assert approver.post(f"/plan/{plan_id}/approve").status_code == 200
    assert approver.post("/runs/validate", json={"planId": plan_id}).status_code == 200
    assert approver.post("/runs/dry-run", json={"planId": plan_id}).status_code == 200
    assert approver.post("/runs/execute", json={"planId": plan_id}).status_code == 200


def test_scripts_use_separate_creator_and_approver_credentials():
    root = Path(__file__).resolve().parents[1] / "bin"
    for name in ("run_plan.sh", "run_schema.sh"):
        text = (root / name).read_text()
        for var in ("FABRIC_EMAIL", "FABRIC_PASSWORD", "APPROVER_EMAIL", "APPROVER_PASSWORD"):
            assert var in text, (name, var)
        assert 'if [ "$FABRIC_EMAIL" = "$APPROVER_EMAIL" ]' in text
        assert '-b "$APPROVER_COOKIES" -X POST "${BASE_URL}/plan/${PLAN_ID}/approve"' in text
        assert '-b "$CREATOR_COOKIES" -X POST "${BASE_URL}/plan"' in text
        assert "X-Admin-Key" not in text and "ADMIN_API_KEY" not in text


# ================================================================ execution safety contract


def test_local_claim_never_claims_distributed_safety(isolated):
    assert run_claims.EXECUTION_SAFETY["claim_authority"] == "REPLICA_LOCAL_FILE"
    assert run_claims.EXECUTION_SAFETY["thread_single_flight"] == "YES"
    assert run_claims.EXECUTION_SAFETY["cross_process_same_store"] == "YES"
    assert run_claims.EXECUTION_SAFETY["cross_replica_distributed_single_flight"] == "NO"
    assert run_claims.EXECUTION_SAFETY["distributed_single_flight"] == "NOT_GUARANTEED"

    plan_id = _create(_client(CREATOR))
    approver = _client(APPROVER)
    approver.post(f"/plan/{plan_id}/approve")
    run_id = approver.post("/runs/execute", json={"planId": plan_id}).json()["runId"]
    for body in (live_runs_projection(), run_detail_projection(run_id)):
        safety = body["execution_safety"]
        assert safety["level"] == "LOCAL" and safety["local_single_flight"] == "ACTIVE"
        assert safety["distributed_single_flight"] == "NOT_GUARANTEED" and safety["scope"] == "REPLICA_LOCAL"
        assert safety["production_blocker"] == "DISTRIBUTED_SINGLE_FLIGHT_NOT_GUARANTEED"
        assert "DISTRIBUTED SINGLE-FLIGHT NOT YET GUARANTEED" in safety["summary"]
        text = json.dumps(body)
        assert "DISTRIBUTED_SINGLE_FLIGHT_GUARANTEED" not in text and '"distributed_single_flight": "ACTIVE"' not in text
        assert "claims/" not in text and "process_instance" not in text, "no infrastructure internals"
    assert run_detail_projection(run_id)["run"]["execution_lease"]["scope"] == "REPLICA_LOCAL"
