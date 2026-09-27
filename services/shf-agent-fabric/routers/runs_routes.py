from __future__ import annotations

import json
import secrets
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Header
from auth.permissions import FABRIC_RUN_EXECUTE
from fabric.loo.validator import validate_report
from fabric.security import require_admin_key
from fabric.layers.global_gate import assert_global_execution_allowed
from fabric import run_claims
from fabric.run_identity import VerifiedActor, actor_may_act_on, declared_identity, require_fabric_actor, verified_identity_fields
from fabric.run_lifecycle import RUN_EVENT_SCHEMA, approval_basis, execution_refusal, is_valid_id, resolve_correlation_id

router = APIRouter(prefix="/runs", tags=["runs"])

ROOT = Path(__file__).resolve().parents[1]
PLANS_DIR = ROOT / "db" / "plans"
ARTIFACTS_DIR = ROOT / "db" / "artifacts"
RUNS_LOG = ROOT / "db" / "runs" / "events.jsonl"

def _utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

def _read_json(p: Path) -> dict:
    return json.loads(p.read_text(encoding="utf-8"))

def _write_json(p: Path, obj: dict):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, indent=2, sort_keys=True) + "\n", encoding="utf-8")

def _append_run_event(ev: dict):
    RUNS_LOG.parent.mkdir(parents=True, exist_ok=True)
    with RUNS_LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(ev, sort_keys=True) + "\n")

def _canon(obj: object) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

def _sha256(obj: object) -> str:
    return hashlib.sha256(_canon(obj)).hexdigest()

def _load_plan_or_404(plan_id: str) -> tuple[dict, Path]:
    plan_path = PLANS_DIR / f"{plan_id}.json"
    if not plan_path.exists():
        raise HTTPException(status_code=404, detail="Plan not found")
    return _read_json(plan_path), plan_path

def _extract_pilot_steps_from_plan(plan: dict) -> list[dict]:
    steps = plan.get("steps", [])
    if not isinstance(steps, list) or not steps:
        return []
    s1 = steps[0] if isinstance(steps[0], dict) else {}
    args = s1.get("args", {}) if isinstance(s1.get("args", {}), dict) else {}
    body = args.get("body", {}) if isinstance(args.get("body", {}), dict) else {}
    pilot = body.get("pilotPlan", {}) if isinstance(body.get("pilotPlan", {}), dict) else {}
    psteps = pilot.get("steps", [])
    if not isinstance(psteps, list):
        return []
    return [s for s in psteps if isinstance(s, dict)]

def _validate_pilot_steps(psteps: list[dict]) -> dict:
    step_nums = sorted({s.get("step") for s in psteps if isinstance(s.get("step"), int)})
    msgs = []
    north = None
    if not step_nums:
        return {"ok": True, "pilotStepsCount": len(psteps), "stepNums": step_nums, "northStar": north, "errors": []}
    if max(step_nums) < 6:
        return {"ok": True, "pilotStepsCount": len(psteps), "stepNums": step_nums, "northStar": north, "errors": []}

    s6 = [s for s in psteps if s.get("step") == 6]
    if not s6:
        msgs.append("Step 6 missing")
    else:
        m = s6[0].get("model", {}) if isinstance(s6[0].get("model", {}), dict) else {}
        north = m.get("northStar")
        if not isinstance(north, dict):
            msgs.append("Step 6 northStar metrics required")

    ok = len(msgs) == 0
    return {"ok": ok, "pilotStepsCount": len(psteps), "stepNums": step_nums, "northStar": north, "errors": [] if ok else msgs}

def _validate_plan_for_pilot(plan: dict) -> dict:
    psteps = _extract_pilot_steps_from_plan(plan)
    return _validate_pilot_steps(psteps)

def _claims_dir() -> Path:
    # Claims live in the same store as the run log they guard.
    return RUNS_LOG.parent / "claims"


def _diagnostic_plan(plan_id, actor: VerifiedActor) -> dict:
    if not plan_id:
        raise HTTPException(status_code=400, detail="planId required")
    if not is_valid_id(plan_id):
        raise HTTPException(status_code=404, detail="Plan not found")
    plan, _ = _load_plan_or_404(plan_id)
    if not actor_may_act_on(actor, plan):
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


# AFCC-3 Phase 4: validate and dry-run are execution preflight. They read the
# full plan and write nothing, and now need the executor's own authority
# (session + CSRF + fabric.run.execute) instead of the shared admin key.
@router.post("/validate")
def validate_run(payload: dict, actor: VerifiedActor = Depends(require_fabric_actor(FABRIC_RUN_EXECUTE))):
    plan_id = payload.get("planId")
    plan = _diagnostic_plan(plan_id, actor)
    v = _validate_plan_for_pilot(plan)
    if not v["ok"]:
        raise HTTPException(status_code=400, detail="; ".join(v["errors"]))
    return {"ok": True, "planId": plan_id, "validation": {"ok": True, "pilotStepsCount": v["pilotStepsCount"], "stepNums": v["stepNums"], "northStar": v["northStar"]}}

@router.post("/dry-run")
def dry_run(payload: dict, actor: VerifiedActor = Depends(require_fabric_actor(FABRIC_RUN_EXECUTE))):
    plan_id = payload.get("planId")
    plan = _diagnostic_plan(plan_id, actor)
    v = _validate_plan_for_pilot(plan)
    if not v["ok"]:
        raise HTTPException(status_code=400, detail="; ".join(v["errors"]))
    would = []
    for s in plan.get("steps", []):
        if not isinstance(s, dict):
            continue
        if s.get("type") == "tool_call" and s.get("tool") == "save_draft_artifact":
            a = s.get("args", {}) if isinstance(s.get("args", {}), dict) else {}
            would.append({"step": s.get("step"), "tool": "save_draft_artifact", "type": a.get("type", "draft_artifact"), "title": a.get("title", "Draft Artifact")})
    return {"ok": True, "planId": plan_id, "validation": {"ok": True, "pilotStepsCount": v["pilotStepsCount"], "stepNums": v["stepNums"], "northStar": v["northStar"]}, "wouldWrite": would}


class _DeadlineExceeded(Exception):
    pass


def _admit(plan_id: str, actor: VerifiedActor) -> tuple[dict, Path] | dict:
    """Load and check a plan. Returns (plan, path), or the idempotent DONE response."""
    plan, plan_path = _load_plan_or_404(plan_id)
    if not actor_may_act_on(actor, plan):
        raise HTTPException(status_code=404, detail="Plan not found")
    if isinstance(plan, dict) and plan.get("status") == "DONE":
        return {"ok": True, "runId": None, "planId": plan_id, "note": "Plan already DONE (idempotent)."}
    # Approval comes only from an attributable decision in the plan store. The
    # request's `approved` flag is no longer authority and is ignored.
    refusal = execution_refusal(plan)
    if refusal:
        raise HTTPException(status_code=409, detail=refusal)
    return plan, plan_path


@router.post("/execute")
def execute_run(
    payload: dict,
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-Id"),
    actor: VerifiedActor = Depends(require_fabric_actor(FABRIC_RUN_EXECUTE)),
):
    # AFCC-3 Phase 3: an authenticated session with fabric.run.execute is the
    # only execution authority. The shared admin key is no longer accepted here.
    assert_global_execution_allowed(route="/runs/execute")

    plan_id = payload.get("planId")
    if not plan_id:
        raise HTTPException(status_code=400, detail="planId required")
    if not is_valid_id(plan_id):
        raise HTTPException(status_code=404, detail="Plan not found")

    admitted = _admit(plan_id, actor)
    if isinstance(admitted, dict):
        return admitted
    plan, _ = admitted

    # Pre-start validation: a refused request never becomes a run.
    v = _validate_plan_for_pilot(plan)
    if not v["ok"]:
        raise HTTPException(status_code=400, detail="; ".join(v["errors"]))

    correlation = resolve_correlation_id(plan_correlation_id=plan.get("correlationId"), incoming=x_correlation_id)
    run_id = secrets.token_hex(6)

    # AFCC-3 Phase 4: single-flight. One live claim per plan; a concurrent or
    # duplicate request is refused before it can write anything.
    claims_dir = _claims_dir()
    claim = run_claims.new_claim(plan_id=plan_id, run_id=run_id, actor_id=actor.actor_id, correlation_id=correlation["correlation_id"])
    try:
        reclaimed = run_claims.acquire_claim(claims_dir, claim)
    except run_claims.ClaimHeld:
        raise HTTPException(status_code=409, detail="RUN_ALREADY_EXECUTING")

    # Re-check under the claim: another execution may have finished, or the
    # plan's approval may have changed, between the first check and the claim.
    try:
        admitted = _admit(plan_id, actor)
    except BaseException:
        run_claims.release_claim(claims_dir, plan_id, run_id)
        raise
    if isinstance(admitted, dict):
        run_claims.release_claim(claims_dir, plan_id, run_id)
        return admitted
    plan, plan_path = admitted

    snapshot = json.loads(json.dumps(plan))
    snapshot_hash = _sha256(snapshot)
    basis = approval_basis(plan)
    agent = plan.get("agent") or {}
    identity = verified_identity_fields(actor, prefix="initiator")
    common = {
        "id": None,
        "schema_version": RUN_EVENT_SCHEMA,
        "kind": "execute",
        "runId": run_id,
        "planId": plan_id,
        "requestId": plan.get("requestId"),
        "agentName": agent.get("name"),
        "agentId": agent.get("agentId"),
        "layer": agent.get("layer"),
        "approval_basis": basis,
        "approval_decision_ref": f"plan:{plan_id}:decision" if basis == "PLAN_APPROVAL_VERIFIED" else None,
        "correlation_id": correlation["correlation_id"],
        "correlation_source": correlation["correlation_source"],
        "entry_point": "fabric.runs.execute",
        "execution_system": "agent_fabric",
        "snapshotSha256": snapshot_hash,
        "claim_ref": f"claim:{plan_id}:{run_id}",
        **identity,
    }
    declared = declared_identity(payload)
    if declared:
        common["declared_identity"] = declared

    def _event(event_type: str, from_state: str, to_state: str, outcome: str | None, **extra) -> dict:
        return {
            **common,
            "ts": datetime.now(timezone.utc).isoformat(),
            "event_id": f"run_evt_{secrets.token_hex(12)}",
            "event_type": event_type,
            "from_state": from_state,
            "to_state": to_state,
            "outcome": outcome,
            **extra,
        }

    try:
        if reclaimed and is_valid_id(reclaimed.get("run_id")):
            # The previous execution's lease expired (plus grace) with no terminal
            # event. Record that fact for its run; do not claim it failed or finished.
            _append_run_event({
                "id": None,
                "schema_version": RUN_EVENT_SCHEMA,
                "kind": "execute",
                "runId": reclaimed["run_id"],
                "planId": plan_id,
                "ts": datetime.now(timezone.utc).isoformat(),
                "event_id": f"run_evt_{secrets.token_hex(12)}",
                "event_type": "run.lease_expired",
                "from_state": "EXECUTING",
                "to_state": "ORPHANED",
                "outcome": None,
                "reason_code": "LEASE_EXPIRED_NO_TERMINAL",
                "lease_expires_at": reclaimed.get("lease_expires_at"),
                "correlation_id": reclaimed.get("correlation_id") if is_valid_id(reclaimed.get("correlation_id")) else None,
                # Who recorded it, nested so it never reads as the orphaned run's initiator.
                "recorded_by": {"run_id": run_id, **verified_identity_fields(actor, prefix="recorder")},
            })

        # Durable before any work starts, so EXECUTING is observable on its own.
        _append_run_event(_event(
            "run.execution_started", "APPROVED", "EXECUTING", "started",
            lease_expires_at=claim["lease_expires_at"], lease_seconds=claim["lease_seconds"],
        ))
    except BaseException:
        # Nothing has started: give the plan back.
        run_claims.release_claim(claims_dir, plan_id, run_id)
        raise

    def checkpoint() -> None:
        # The executor enforces its own lease: no step starts and nothing is
        # finalized after the deadline. A step already running cannot be interrupted.
        if run_claims.deadline_passed(claim):
            raise _DeadlineExceeded()

    results = []
    artifacts_written = []
    adapters_used: list[str] = []
    stage = "artifact"
    try:
        for s in plan.get("steps", []):
            if not isinstance(s, dict):
                continue
            if s.get("type") != "tool_call":
                continue
            if s.get("tool") != "save_draft_artifact":
                continue

            checkpoint()
            args = s.get("args", {}) if isinstance(s.get("args", {}), dict) else {}
            ts = _utc_stamp()
            rand = secrets.token_hex(6)
            artifact_id = f"draft_{ts}_{rand}"
            artifact_path = ARTIFACTS_DIR / f"{artifact_id}.json"

            body = args.get("body", args)
            artifact = {
                "type": args.get("type", "draft_artifact"),
                "title": args.get("title", "Draft Artifact"),
                "meta": args.get("meta", {}),
                "body": body,
                # References back to the run chain; part of the hashed content.
                "provenance": {"run_id": run_id, "plan_id": plan_id, "correlation_id": correlation["correlation_id"]},
            }
            artifact_hash = _sha256(artifact)

            _write_json(artifact_path, artifact)

            artifacts_written.append({"artifactId": artifact_id, "path": str(artifact_path), "sha256": artifact_hash})
            results.append({"step": s.get("step"), "ok": True, "result": artifacts_written[-1]})
            if "save_draft_artifact" not in adapters_used:
                adapters_used.append("save_draft_artifact")

        checkpoint()
        stage = "plan_update"
        plan["approved"] = plan.get("approved") is True or not plan.get("approvalRequired", True)
        plan["status"] = "DONE"
        plan["executedAt"] = datetime.now(timezone.utc).isoformat()
        plan["executedRunId"] = run_id
        plan["snapshotSha256"] = snapshot_hash
        _write_json(plan_path, plan)
    except _DeadlineExceeded:
        # The deadline stopped the work. Artifacts already written are kept and
        # listed as partial; the plan is not marked DONE.
        _append_run_event(_event(
            "run.timed_out", "EXECUTING", "TIMED_OUT", "timed_out",
            failure_code="DEADLINE_EXCEEDED", reason_code="DEADLINE_EXCEEDED", message="execution deadline exceeded",
            lease_expires_at=claim["lease_expires_at"], partial=True,
            executor={"adapters": adapters_used, "model_invoked": False},
            artifacts=artifacts_written,
        ))
        run_claims.release_claim(claims_dir, plan_id, run_id)
        raise HTTPException(status_code=504, detail="RUN_TIMED_OUT")
    except Exception:
        # Record the failure, then re-raise the original error unchanged. No
        # exception text is stored; the failure code names the stage.
        recorded = False
        try:
            _append_run_event(_event(
                "run.execution_failed", "EXECUTING", "FAILED", "error",
                failure_code="ARTIFACT_WRITE_FAILED" if stage == "artifact" else "PLAN_UPDATE_FAILED",
                message="execution failed",
                executor={"adapters": adapters_used, "model_invoked": False},
                artifacts=artifacts_written,
            ))
            recorded = True
        except Exception:
            pass
        if recorded:
            run_claims.release_claim(claims_dir, plan_id, run_id)
        # If no terminal could be recorded, the claim stays held until its lease
        # (plus grace) expires, so the run is detectable as ORPHANED.
        raise

    _append_run_event(_event(
        "run.completed", "EXECUTING", "COMPLETED", "ok",
        message="plan executed",
        # This executor runs deterministic tools only; it cannot invoke a model.
        executor={"adapters": adapters_used, "model_invoked": False},
        northStar=v.get("northStar"),
        artifacts=artifacts_written,
    ))
    run_claims.release_claim(claims_dir, plan_id, run_id)

    return {"ok": True, "runId": run_id, "planId": plan_id, "snapshotSha256": snapshot_hash, "northStar": v.get("northStar"), "results": results, "correlationId": correlation["correlation_id"]}

def read_recent_run_events(limit: int = 50) -> list:
    """Newest-first run events from the run log. Reads only; never writes."""
    if not RUNS_LOG.exists():
        return []
    lines = RUNS_LOG.read_text(encoding="utf-8").splitlines()
    events = []
    for line in reversed(lines):
        if not line.strip():
            continue
        try:
            events.append(json.loads(line))
        except Exception:
            continue
        if len(events) >= limit:
            break
    return events


@router.get("/recent")
def recent_runs(limit: int = 50, x_admin_key: str | None = Header(default=None, alias="X-Admin-Key")):
    require_admin_key(x_admin_key)
    return {"events": read_recent_run_events(limit)}

@router.post("/loo/validate")
def loo_validate(body: dict):
    schema = body.get("schema")
    payload = body.get("payload")
    if not isinstance(schema, dict) or not isinstance(payload, dict):
        return {"ok": False, "errors": ["schema and payload required"]}
    return validate_report(schema, payload)
