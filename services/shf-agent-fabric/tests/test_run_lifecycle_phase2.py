from __future__ import annotations

"""
AFCC-3 Phase 2 — run lifecycle hardening.

Proves: the run event log is the single lifecycle authority; state derivation is
centralized, allow-listed and fails safe on conflict; new runs capture only
execution context the writer actually knows (no actor/org/model is invented);
legacy runs stay NOT_CAPTURED; correlation flows /plan -> /runs/execute ->
run event -> projection -> timeline; domain references are references only;
reads have no side effects and never touch the tenant-scoped operational store.
"""

import hashlib
import json
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from fabric import run_lifecycle as lc
from fabric.command.live_operations import (
    NOT_CAPTURED,
    NOT_PUBLISHED,
    live_runs_projection,
    run_dependencies_projection,
    run_detail_projection,
    run_evidence_projection,
    run_timeline_projection,
)
from services.internal_service_identity import is_command_read_path

SHA = "c" * 64
ADMIN_KEY = "phase2-admin-key-value"
ACTOR = "u-phase2-admin"
BASE = "/api/v1-command-center/agent-fabric"


@pytest.fixture()
def stores(monkeypatch, tmp_path):
    import fabric.plan_store as plan_store
    import routers.runs_routes as runs_routes

    plans = tmp_path / "plans"
    monkeypatch.setattr(plan_store, "PLANS_DIR", plans)
    monkeypatch.setattr(runs_routes, "PLANS_DIR", plans)
    monkeypatch.setattr(runs_routes, "ARTIFACTS_DIR", tmp_path / "artifacts")
    monkeypatch.setattr(runs_routes, "RUNS_LOG", tmp_path / "runs" / "events.jsonl")
    return {"plans": plans, "log": runs_routes.RUNS_LOG, "root": tmp_path}


def _write_events(log: Path, *events, raw_lines=()) -> None:
    log.parent.mkdir(parents=True, exist_ok=True)
    lines = [json.dumps(e) for e in events] + list(raw_lines)
    log.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _write_plan(plans: Path, plan: dict) -> None:
    plans.mkdir(parents=True, exist_ok=True)
    (plans / f"{plan['planId']}.json").write_text(json.dumps(plan), encoding="utf-8")


@pytest.fixture()
def writer_client(monkeypatch, stores):
    # Phase 3: writers authenticate with a Fabric session + CSRF (no admin key).
    import routers.plan_routes as plan_routes
    import routers.runs_routes as runs_routes
    from auth.config import get_auth_settings
    from auth.sessions import create_session
    from auth.store import AuthUser

    monkeypatch.setenv("ADMIN_API_KEY", ADMIN_KEY)
    monkeypatch.setattr(runs_routes, "assert_global_execution_allowed", lambda route: None)
    app = FastAPI()
    app.include_router(plan_routes.router)
    app.include_router(runs_routes.router)
    token, session = create_session(AuthUser(user_id=ACTOR, email="a@test.invalid", display_name="A", role="shs_admin", password_hash=""))
    client = TestClient(app)
    client.cookies.set(get_auth_settings().cookie_name, token)
    client.headers.update({"x-csrf-token": session.csrf_token})
    return client


# ------------------------------------------------------------ state derivation


@pytest.mark.parametrize("events,plan,expected,reason", [
    ([{"outcome": "ok"}], None, "COMPLETED", "RUN_EVENT_TERMINAL"),
    ([{"outcome": "error"}], None, "FAILED", "RUN_EVENT_TERMINAL"),
    ([{"to_state": "COMPLETED", "outcome": "ok"}], None, "COMPLETED", "RUN_EVENT_TERMINAL"),
    ([{"to_state": "FAILED", "outcome": "ok"}], None, "UNKNOWN", "EVENT_STATE_CONFLICT"),
    ([{"outcome": "ok"}, {"outcome": "error"}], None, "UNKNOWN", "CONFLICTING_TERMINAL_STATES"),
    ([{"outcome": "ok"}, {"outcome": "ok"}], None, "COMPLETED", "RUN_EVENT_TERMINAL"),
    ([{"state": "EXECUTING"}], None, "UNKNOWN", "UNSUPPORTED_STATE_IN_SOURCE"),
    ([{"status": "CANCELLED", "outcome": "ok"}], None, "UNKNOWN", "UNSUPPORTED_STATE_IN_SOURCE"),
    ([{"outcome": "blocked"}], None, "UNKNOWN", "NO_STATE_IN_SOURCE"),
    ([{"outcome": "ok"}], {"status": "REJECTED", "approvalRequired": True}, "UNKNOWN", "APPROVAL_EXECUTION_CONFLICT"),
    ([{"outcome": "ok"}], {"status": "PLANNED", "approvalRequired": True, "approved": False}, "UNKNOWN", "APPROVAL_EXECUTION_CONFLICT"),
    ([{"outcome": "ok"}], {"status": "DONE", "approvalRequired": True, "approved": True}, "COMPLETED", "RUN_EVENT_TERMINAL"),
])
def test_run_state_derivation_is_deterministic_and_fails_safe(events, plan, expected, reason):
    first = lc.derive_run_state(events, plan)
    second = lc.derive_run_state(list(events), dict(plan) if plan else None)
    assert first == second
    assert (first["state"], first["reason_code"]) == (expected, reason)


@pytest.mark.parametrize("plan,expected,reason", [
    ({"status": "PLANNED", "approvalRequired": True, "approved": False}, "APPROVAL_REQUIRED", "PLAN_APPROVAL_PENDING"),
    ({"status": "PLANNED", "approvalRequired": False}, "APPROVED", "PLAN_APPROVAL_SATISFIED"),
    # Phase 3: an approval without a verified approver cannot authorize execution.
    ({"status": "APPROVED", "approvalRequired": True}, "APPROVAL_REQUIRED", "PLAN_APPROVAL_UNATTRIBUTED"),
    ({"status": "REJECTED", "approvalRequired": True}, "APPROVAL_DENIED", "PLAN_REJECTED"),
    ({"status": "REJECTED", "approvalRequired": True, "approved": True}, "UNKNOWN", "PLAN_APPROVAL_CONFLICT"),
    ({"status": "DONE", "approvalRequired": True, "approved": True}, "UNKNOWN", "RUN_EVENT_MISSING"),
    ({"status": "QUEUED"}, "UNKNOWN", "UNSUPPORTED_PLAN_STATUS"),
])
def test_plan_state_derivation(plan, expected, reason):
    derived = lc.derive_plan_state(plan)
    assert (derived["state"], derived["reason_code"]) == (expected, reason)


def test_only_supported_states_are_ever_projected(stores):
    _write_plan(stores["plans"], {"planId": "p-q", "status": "QUEUED"})
    _write_events(
        stores["log"],
        {"runId": "r-exec", "state": "EXECUTING", "ts": "2026-02-01T00:00:00Z"},
        {"runId": "r-cancel", "status": "CANCELLED", "ts": "2026-02-01T00:00:01Z"},
        {"runId": "r-ok", "outcome": "ok", "ts": "2026-02-01T00:00:02Z"},
    )
    body = live_runs_projection()
    allowed = lc.SUPPORTED_STATES | {lc.UNKNOWN}
    assert {r["current_state"] for r in body["runs"]} <= allowed
    for deferred in lc.DEFERRED_STATES:
        assert all(r["current_state"] != deferred for r in body["runs"])
    for rid in ("r-exec", "r-cancel", "r-ok"):
        for event in run_timeline_projection(rid)["events"]:
            assert event["to_state"] in allowed
    assert body["lifecycle"]["deferred_states"] == list(lc.DEFERRED_STATES)


def test_conflicting_events_for_one_run_are_grouped_and_fail_safe(stores):
    _write_events(
        stores["log"],
        {"runId": "r-dup", "outcome": "ok", "ts": "2026-02-01T00:00:00Z"},
        {"runId": "r-dup", "outcome": "error", "ts": "2026-02-01T00:00:05Z"},
    )
    runs = [r for r in live_runs_projection()["runs"] if r["run_id"] == "r-dup"]
    assert len(runs) == 1, "one run per run id, not one per event"
    assert runs[0]["current_state"] == "UNKNOWN"
    assert runs[0]["state_derivation"] == {"state": "UNKNOWN", "reason_code": "CONFLICTING_TERMINAL_STATES", "conflict": True}
    assert runs[0]["completed_at"] == "NOT_AVAILABLE" and runs[0]["failed_at"] == "NOT_AVAILABLE"
    assert runs[0]["event_count"] == 2


def test_conflicting_plan_references_fail_safe(stores):
    _write_events(
        stores["log"],
        {"runId": "r-pp", "planId": "plan-a", "outcome": "ok", "ts": "2026-02-01T00:00:00Z"},
        {"runId": "r-pp", "planId": "plan-b", "outcome": "ok", "ts": "2026-02-01T00:00:01Z"},
    )
    run = run_detail_projection("r-pp")["run"]
    assert run["current_state"] == "UNKNOWN"
    assert run["state_derivation"]["reason_code"] == "PLAN_REFERENCE_CONFLICT"
    assert run["operation"]["plan_id"] == "UNKNOWN"


# ------------------------------------------------------------ writer capture + correlation


def test_new_run_captures_execution_context_and_correlation_chain(writer_client, stores):
    corr = "corr-chain-0001"
    created = writer_client.post("/plan", json={"agentName": "UnregisteredTestAgent", "input": {"x": 1}}, headers={"X-Correlation-Id": corr})
    assert created.status_code == 200, created.text
    assert created.json()["correlationId"] == corr
    plan_id = created.json()["planId"]
    plan = json.loads((stores["plans"] / f"{plan_id}.json").read_text())
    assert plan["correlationId"] == corr and plan["correlationSource"] == "REQUEST_HEADER"
    assert plan["createdAt"]

    approved = writer_client.post(f"/plan/{plan_id}/approve")
    assert approved.status_code == 200
    assert json.loads((stores["plans"] / f"{plan_id}.json").read_text())["statusUpdatedAt"]

    # A different header at execute time does not fork the chain: the plan's id wins.
    executed = writer_client.post("/runs/execute", json={"planId": plan_id, "approved": True}, headers={"X-Correlation-Id": "corr-other-9999"})
    assert executed.status_code == 200, executed.text
    run_id = executed.json()["runId"]
    assert executed.json()["correlationId"] == corr

    event = json.loads(stores["log"].read_text().splitlines()[-1])
    assert event["schema_version"] == lc.RUN_EVENT_SCHEMA
    assert event["event_id"].startswith("run_evt_")
    assert (event["event_type"], event["from_state"], event["to_state"]) == ("run.completed", "EXECUTING", "COMPLETED")
    assert event["approval_basis"] == "PLAN_APPROVAL_VERIFIED"
    assert (event["correlation_id"], event["correlation_source"]) == (corr, "PLAN")
    assert (event["initiator_actor_id"], event["initiator_type"]) == (ACTOR, "HUMAN")
    assert event["executor"] == {"adapters": ["save_draft_artifact"], "model_invoked": False}
    # No provider or model is invented; no credential is stored.
    for absent in ("provider", "model"):
        assert absent not in event
    assert ADMIN_KEY not in stores["log"].read_text()
    # Legacy keys are kept for existing readers.
    assert event["id"] is None and event["kind"] == "execute" and event["outcome"] == "ok"

    run = run_detail_projection(run_id)["run"]
    assert run["current_state"] == "COMPLETED"
    assert run["approval"]["state"] == "APPROVED" and run["approval"]["basis"] == "PLAN_APPROVAL_VERIFIED"
    assert run["initiator"]["actor_id"] == ACTOR and run["initiator"]["actor_verification"] == "VERIFIED"
    assert run["initiator"]["initiator_type"] == "HUMAN"
    assert run["initiator"]["entry_point"] == "fabric.runs.execute"
    assert run["initiator"]["source_system"] == "agent_fabric.session"
    assert (run["tenant_id"], run["organization_id"]) == ("NOT_APPLICABLE", "NOT_APPLICABLE")
    assert (run["provider"], run["model"], run["adapter"]) == ("NOT_APPLICABLE", "NOT_APPLICABLE", "save_draft_artifact")
    assert run["execution"]["model_invoked"] is False
    assert run["execution"]["agent_version"] == NOT_CAPTURED
    assert run["correlation"] == {"id": corr, "source": "PLAN", "continuity": "CONSISTENT"}

    timeline = run_timeline_projection(run_id)["events"]
    assert [e["event_type"] for e in timeline] == ["plan.created", "plan.approved", "run.execution_started", "run.completed"]
    assert all(e["correlation_id"] == corr for e in timeline)
    assert timeline[0]["provenance"] == "DERIVED" and timeline[0]["source"] == "agent_fabric.plan_store"
    assert timeline[1]["provenance"] == "RECORDED" and timeline[1]["actor_ref"] == ACTOR
    assert timeline[3]["provenance"] == "RECORDED" and timeline[3]["from_state"] == "EXECUTING"
    for field in ("event_id", "run_id", "event_type", "from_state", "to_state", "occurred_at", "actor_ref", "authority_ref",
                  "reason_code", "reason_summary", "evidence_refs", "policy_refs", "correlation_id", "source"):
        assert field in timeline[3]
    assert "/Users/" not in json.dumps(run) and "path" not in json.dumps(run["artifact_refs"])


def test_execute_uses_valid_header_for_legacy_plan_and_generates_otherwise(writer_client, stores):
    for plan_id in ("legacy-a", "legacy-b"):
        _write_plan(stores["plans"], {"planId": plan_id, "requestId": "req-" + plan_id, "approvalRequired": False, "status": "PLANNED", "steps": []})
    ok = writer_client.post("/runs/execute", json={"planId": "legacy-a"}, headers={"X-Correlation-Id": "corr-incoming-01"})
    bad = writer_client.post("/runs/execute", json={"planId": "legacy-b"}, headers={"X-Correlation-Id": "bad id /etc/passwd"})
    events = [json.loads(line) for line in stores["log"].read_text().splitlines()]
    a_events = [e for e in events if e["planId"] == "legacy-a"]
    b_events = [e for e in events if e["planId"] == "legacy-b"]
    assert {(e["correlation_id"], e["correlation_source"]) for e in a_events} == {("corr-incoming-01", "REQUEST_HEADER")}
    assert b_events[0]["correlation_source"] == "GENERATED" and b_events[0]["correlation_id"].startswith("corr_")
    assert a_events[-1]["approval_basis"] == "NOT_REQUIRED"
    assert a_events[-1]["executor"] == {"adapters": [], "model_invoked": False}
    assert run_detail_projection(ok.json()["runId"])["run"]["adapter"] == "NONE"
    assert bad.json()["correlationId"] == b_events[0]["correlation_id"]


def test_execute_appends_without_rewriting_legacy_events(writer_client, stores):
    legacy = {"runId": "legacy-run", "kind": "execute", "outcome": "ok", "ts": "2026-01-01T00:00:00Z"}
    _write_events(stores["log"], legacy)
    before = stores["log"].read_bytes()
    _write_plan(stores["plans"], {"planId": "p-new", "approvalRequired": False, "status": "PLANNED", "steps": []})
    assert writer_client.post("/runs/execute", json={"planId": "p-new"}).status_code == 200
    after = stores["log"].read_bytes()
    assert after.startswith(before), "append-only: legacy lines are untouched"
    assert json.loads(after.decode().splitlines()[-1])["approval_basis"] == "NOT_REQUIRED"


# ------------------------------------------------------------ legacy + capture


def test_legacy_runs_stay_not_captured(stores):
    _write_plan(stores["plans"], {"planId": "p-old", "requestId": "req-old", "approvalRequired": True, "approved": True, "status": "DONE",
                                  "agent": {"name": "Layer23OrchestratorAgent", "agentId": "L23", "layer": "L23"}})
    _write_events(stores["log"], {"runId": "old-1", "planId": "p-old", "kind": "execute", "outcome": "ok", "ts": "2026-01-09T03:56:55+00:00",
                                  "agentName": "Layer23OrchestratorAgent", "requestId": "req-old"})
    run = run_detail_projection("old-1")["run"]
    assert run["current_state"] == "COMPLETED"
    for value in (run["tenant_id"], run["organization_id"], run["initiator"]["actor_id"], run["initiator"]["initiator_type"],
                  run["initiator"]["source_system"], run["initiator"]["entry_point"], run["provider"], run["model"], run["adapter"],
                  run["execution"]["agent_version"], run["execution"]["model_invoked"], run["retry_count"], run["parent_run_id"]):
        assert value == NOT_CAPTURED
    assert run["approval"]["basis"] == NOT_CAPTURED
    assert run["correlation"] == {"id": "req-old", "source": "LEGACY_REQUEST_ID", "continuity": NOT_CAPTURED}
    timeline = run_timeline_projection("old-1")["events"]
    assert [e["provenance"] for e in timeline] == ["LEGACY_DERIVED"]
    assert timeline[0]["from_state"] == NOT_CAPTURED and timeline[0]["event_type"] == "run.execute"


def test_recorded_actor_org_provider_are_projected_and_sanitized(stores):
    _write_events(stores["log"], {
        "runId": "cap-1", "outcome": "ok", "ts": "2026-02-02T00:00:00Z",
        "initiator_actor_id": "user_123", "initiator_type": "HUMAN_OPERATOR", "source_system": "shs",
        "organization_id": "org_a", "tenant_id": "tenant:org_a",
        "provider": "anthropic", "model": "claude-test-model", "adapter": "llm_adapter", "agent_version": "v1.2.0",
    }, {
        "runId": "cap-2", "outcome": "ok", "ts": "2026-02-02T00:00:01Z",
        "initiator_actor_id": "someone@example.com", "organization_id": "../../etc",
        "provider": "api_key=sk-live-123", "model": "/srv/models/secret.bin",
    })
    one = run_detail_projection("cap-1")["run"]
    assert one["initiator"]["actor_id"] == "user_123" and one["initiator"]["initiator_type"] == "HUMAN_OPERATOR"
    assert one["initiator"]["source_system"] == "shs"
    assert (one["organization_id"], one["tenant_id"]) == ("org_a", "tenant:org_a")
    assert (one["provider"], one["model"], one["adapter"], one["agent"]["version"]) == ("anthropic", "claude-test-model", "llm_adapter", "v1.2.0")
    two = run_detail_projection("cap-2")["run"]
    assert two["initiator"]["actor_id"] == "[redacted]"
    assert two["organization_id"] == "[redacted]"
    assert two["provider"] == "[redacted]" and two["model"] == "[redacted]"
    text = json.dumps(two)
    assert "sk-live" not in text and "/srv/" not in text and "@example.com" not in text


# ------------------------------------------------------------ retry lineage


def test_retry_lineage_is_reference_only_and_retrying_stays_deferred(stores):
    _write_events(
        stores["log"],
        {"runId": "root-1", "planId": "p-r", "outcome": "error", "ts": "2026-03-01T00:00:00Z"},
        {"runId": "retry-2", "planId": "p-r", "outcome": "ok", "ts": "2026-03-01T00:01:00Z",
         "retry_count": 1, "parent_run_id": "root-1", "root_run_id": "root-1", "retry_of_run_id": "root-1"},
        {"runId": "bad-3", "outcome": "ok", "ts": "2026-03-01T00:02:00Z", "retry_count": "lots", "parent_run_id": "../../x", "retry_of_run_id": True},
    )
    retry = run_detail_projection("retry-2")["run"]["retry_lineage"]
    assert retry["retry_supported"] is False and retry["retrying_state"] == "DEFERRED"
    assert (retry["retry_count"], retry["parent_run_id"], retry["root_run_id"], retry["retry_of_run_id"]) == (1, "root-1", "root-1", "root-1")
    assert retry["same_plan_run_ids"] == ["root-1"]
    deps = run_dependencies_projection("retry-2")
    assert deps["parent_run_id"] == "root-1" and deps["retry_lineage"]["root_run_id"] == "root-1"
    bad = run_detail_projection("bad-3")["run"]["retry_lineage"]
    assert bad["retry_count"] == NOT_CAPTURED
    assert bad["parent_run_id"] == "[redacted]" and bad["retry_of_run_id"] == "[redacted]"
    assert run_detail_projection("retry-2")["run"]["current_state"] != "RETRYING"


# ------------------------------------------------------------ domain references


def test_domain_references_are_published_only_when_recorded(stores):
    _write_events(
        stores["log"],
        {"runId": "dom-1", "outcome": "ok", "ts": "2026-04-01T00:00:00Z",
         "truth_refs": ["truth:claim_1", "/Users/x/truth.json"], "watchtower_refs": ["watchtower:program_a"],
         "loo_refs": ["loo:ranking_7"], "report_refs": ["report:r1"], "proof_refs": ["proof:r1"]},
        {"runId": "dom-2", "outcome": "ok", "ts": "2026-04-01T00:00:01Z"},
    )
    refs = run_evidence_projection("dom-1")["evidence"]["domain_refs"]
    assert refs["truth_spine"] == {"authority": "Truth Spine", "state": "PUBLISHED", "link_basis": "RUN_EVENT_RECORDED", "refs": ["truth:claim_1"]}
    assert refs["watchtower"]["refs"] == ["watchtower:program_a"]
    assert refs["loo"]["refs"] == ["loo:ranking_7"]
    assert refs["reporting"]["refs"] == ["report:r1"] and refs["reporting"]["proof_refs"] == ["proof:r1"]
    empty = run_detail_projection("dom-2")["run"]["domain_refs"]
    for domain in ("truth_spine", "watchtower", "loo", "reporting"):
        assert empty[domain]["state"] == NOT_PUBLISHED
        assert empty[domain]["link_basis"] == "NO_RUN_SPECIFIC_RELATION"
        assert empty[domain]["refs"] == []


# ------------------------------------------------------------ malformed input


def test_malformed_events_are_counted_not_projected(stores):
    _write_events(
        stores["log"],
        {"runId": "good-1", "outcome": "ok", "ts": "2026-05-01T00:00:00Z"},
        {"kind": "execute", "outcome": "ok"},
        {"runId": "../escape", "outcome": "ok"},
        raw_lines=["{not json", "[1,2,3]", "\"string\""],
    )
    body = live_runs_projection()
    assert [r["run_id"] for r in body["runs"]] == ["good-1"]
    assert body["source"]["malformed_event_count"] == 3
    assert body["source"]["unattributed_event_count"] == 2
    for bad_id in ("../escape", "execute", "cancel", "a/b", ""):
        with pytest.raises(ValueError, match="INVALID_RUN_ID"):
            run_detail_projection(bad_id)


def test_reserved_action_words_are_not_bridgeable_run_ids():
    for word in ("execute", "cancel", "revoke", "retry", "timeout", "validate", "dry-run", "EXECUTE"):
        assert not is_command_read_path(f"{BASE}/runs/{word}")
        assert not is_command_read_path(f"{BASE}/runs/{word}/timeline")
    assert is_command_read_path(f"{BASE}/runs/recent"), "the fixed recent-runs read is unaffected"
    assert is_command_read_path(f"{BASE}/runs/a1b2c3d4e5f6/timeline")


# ------------------------------------------------------------ isolation + side effects


def test_runs_never_blend_tenants_or_read_operational_events(monkeypatch, stores):
    import services.operational_event_service as ops

    def forbidden(*_a, **_k):
        raise AssertionError("live operations must not read the tenant-scoped operational event store")

    monkeypatch.setattr(ops, "_read_events", forbidden)
    monkeypatch.setattr(ops, "list_operational_events", forbidden)
    _write_events(
        stores["log"],
        {"runId": "ten-a", "outcome": "ok", "ts": "2026-06-01T00:00:00Z", "tenant_id": "tenant:org_a", "organization_id": "org_a", "correlation_id": "corr-shared-01"},
        {"runId": "ten-b", "outcome": "ok", "ts": "2026-06-01T00:00:01Z", "correlation_id": "corr-shared-01"},
    )
    a = run_detail_projection("ten-a")["run"]
    b = run_detail_projection("ten-b")["run"]
    assert (a["tenant_id"], a["organization_id"]) == ("tenant:org_a", "org_a")
    assert (b["tenant_id"], b["organization_id"]) == (NOT_CAPTURED, NOT_CAPTURED), "a shared correlation id never joins tenant data"
    assert all(e["run_id"] == "ten-b" for e in run_timeline_projection("ten-b")["events"])
    src = Path(__file__).resolve().parents[1] / "fabric" / "command" / "live_operations.py"
    assert "operational_event" not in src.read_text().split('"""', 2)[2]


def test_projections_have_no_side_effects(stores):
    _write_plan(stores["plans"], {"planId": "p-se", "status": "PLANNED", "approvalRequired": True})
    _write_events(stores["log"], {"runId": "se-1", "planId": "p-se", "outcome": "ok", "ts": "2026-07-01T00:00:00Z"})

    def tree():
        return {str(p.relative_to(stores["root"])): (hashlib.sha256(p.read_bytes()).hexdigest(), p.stat().st_mtime_ns)
                for p in stores["root"].rglob("*") if p.is_file()} | {str(p.relative_to(stores["root"])): "dir" for p in stores["root"].rglob("*") if p.is_dir()}

    before = tree()
    live_runs_projection()
    run_detail_projection("se-1")
    run_timeline_projection("se-1")
    run_evidence_projection("se-1")
    run_dependencies_projection("se-1")
    run_detail_projection("missing-run")
    assert tree() == before


def test_reads_do_not_create_missing_stores(monkeypatch, tmp_path):
    import fabric.plan_store as plan_store
    import routers.runs_routes as runs_routes

    monkeypatch.setattr(plan_store, "PLANS_DIR", tmp_path / "no-plans")
    monkeypatch.setattr(runs_routes, "RUNS_LOG", tmp_path / "no-runs" / "events.jsonl")
    body = live_runs_projection()
    assert body["runs"] == [] and body["state"] == "AVAILABLE"
    assert run_detail_projection("anything-1")["state"] == "NOT_AVAILABLE"
    assert list(tmp_path.iterdir()) == []
