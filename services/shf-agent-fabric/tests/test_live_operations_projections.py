from __future__ import annotations

import json
from pathlib import Path

from fabric.command.live_operations import (
    NOT_CAPTURED,
    live_runs_projection,
    run_dependencies_projection,
    run_detail_projection,
    run_evidence_projection,
    run_timeline_projection,
)

SHA = "b" * 64


def _write_json(path: Path, body: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(body), encoding="utf-8")


def test_live_operations_derives_only_supported_lifecycle_from_run_events(monkeypatch, tmp_path):
    import fabric.plan_store as plan_store
    import routers.runs_routes as runs_routes

    monkeypatch.setattr(plan_store, "PLANS_DIR", tmp_path / "plans")
    monkeypatch.setattr(runs_routes, "RUNS_LOG", tmp_path / "runs" / "events.jsonl")
    _write_json(plan_store.PLANS_DIR / "plan-1.json", {
        "planId": "plan-1",
        "requestId": "req-1",
        "agent": {"name": "Layer23OrchestratorAgent", "agentId": "L23-ORCH-001", "layer": "L23"},
        "approvalRequired": True,
        "approved": True,
        "status": "DONE",
        "policy": {"humanApproval": True},
    })
    runs_routes.RUNS_LOG.parent.mkdir(parents=True, exist_ok=True)
    runs_routes.RUNS_LOG.write_text(json.dumps({
        "runId": "run-1",
        "planId": "plan-1",
        "kind": "execute",
        "outcome": "ok",
        "ts": "2026-01-09T03:56:55+00:00",
        "snapshotSha256": SHA,
        "artifacts": [{"artifactId": "draft_1", "path": "/Users/local/secret.json", "sha256": SHA}],
        "message": "ok",
    }) + "\n", encoding="utf-8")

    body = live_runs_projection()
    run = body["runs"][0]
    assert body["state"] == "AVAILABLE"
    assert run["run_id"] == "run-1"
    assert run["work_order_id"] == "req-1"
    assert run["current_state"] == "COMPLETED"
    assert run["approval"]["state"] == "APPROVED"
    assert run["provider"] == NOT_CAPTURED
    assert run["model"] == NOT_CAPTURED
    assert run["artifact_refs"] == [{"artifact_id": "draft_1", "sha256": SHA}]
    assert "/Users/" not in json.dumps(body)


def test_failed_run_has_terminal_failure_fields_but_no_future_states(monkeypatch, tmp_path):
    import routers.runs_routes as runs_routes

    monkeypatch.setattr(runs_routes, "RUNS_LOG", tmp_path / "events.jsonl")
    runs_routes.RUNS_LOG.write_text(json.dumps({
        "runId": "run-failed",
        "kind": "execute",
        "outcome": "error",
        "ts": "2026-01-10T00:00:00Z",
        "message": "Traceback (most recent call last): File \"/srv/x.py\" RuntimeError boom",
        "provider": "NOT_CAPTURED",
    }) + "\n", encoding="utf-8")

    run = run_detail_projection("run-failed")["run"]
    assert run["current_state"] == "FAILED"
    assert run["failed_at"] == "2026-01-10T00:00:00Z"
    assert run["failure_summary"] == "[redacted]"
    assert run["cancelled_at"] == "NOT_AVAILABLE"
    assert run["timed_out_at"] == "NOT_AVAILABLE"


def test_timeline_evidence_dependencies_are_references_only(monkeypatch, tmp_path):
    import routers.runs_routes as runs_routes

    monkeypatch.setattr(runs_routes, "RUNS_LOG", tmp_path / "events.jsonl")
    runs_routes.RUNS_LOG.write_text(json.dumps({
        "runId": "run-lineage",
        "kind": "execute",
        "outcome": "ok",
        "ts": "2026-01-11T00:00:00Z",
        "evidence_refs": ["evidence:1"],
        "proof_refs": ["proof:1"],
        "report_refs": ["report:1"],
        "truth_refs": ["truth:1"],
        "watchtower_refs": ["watchtower:1"],
        "loo_refs": ["loo:1"],
        "dependency_run_ids": ["run-parent"],
        "parent_run_id": "run-parent",
        "correlation_id": "corr-1",
        "artifacts": [{"artifactId": "draft_1", "sha256": SHA}],
    }) + "\n", encoding="utf-8")

    timeline = run_timeline_projection("run-lineage")
    evidence = run_evidence_projection("run-lineage")
    deps = run_dependencies_projection("run-lineage")
    assert timeline["events"][0]["to_state"] == "COMPLETED"
    assert evidence["evidence"]["counts"] == {"evidence": 1, "artifacts": 1, "proofs": 1, "reports": 1}
    assert evidence["evidence"]["artifact_refs"] == [{"artifact_id": "draft_1", "sha256": SHA}]
    assert deps["dependency_run_ids"] == ["run-parent"]
    assert deps["correlation_id"] == "corr-1"


def test_unknown_run_and_malformed_identifier_are_safe(monkeypatch, tmp_path):
    import routers.runs_routes as runs_routes

    monkeypatch.setattr(runs_routes, "RUNS_LOG", tmp_path / "missing.jsonl")
    assert run_detail_projection("missing-run")["state"] == "NOT_AVAILABLE"
    try:
        run_detail_projection("../secret")
    except ValueError as exc:
        assert str(exc) == "INVALID_RUN_ID"
    else:
        raise AssertionError("unsafe run id was accepted")
