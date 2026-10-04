from __future__ import annotations

"""
AFCC-3 Phase 5 — shared Postgres run authority (migration 149).

Transaction boundaries (every one locks the plan row first, then the claim
row, so lock order is fixed and deadlock-free):

  create plan      INSERT fabric_plans
  decide           SELECT plan FOR UPDATE -> policy checks -> INSERT decision
                   (UNIQUE per plan) -> UPDATE plan
  begin execution  SELECT plan FOR UPDATE -> admission re-check -> conditional
                   claim upsert (only if absent, released, or expired + grace)
                   -> [orphan evidence for a reclaimed run] -> run.execution_started
                   -> COMMIT. No work starts before this commit.
  close execution  SELECT plan FOR UPDATE -> SELECT claim FOR UPDATE -> fence
                   (own run_id + claim_version, unreleased, lease unexpired by the
                   DB clock) -> terminal event -> plan DONE (completed only) ->
                   release claim -> COMMIT. A stale or expired executor can never
                   commit COMPLETED; it records TIMED_OUT and touches neither the
                   plan nor the claim it no longer owns.

The database clock is the lease and event clock. Stored payloads never contain
server file paths, credentials or exception text.
"""

import hashlib
import json
import os
import secrets
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Iterator, List, Optional

from fastapi import HTTPException

from fabric.run_claims import TAKEOVER_GRACE_SECONDS


TERMINAL_EVENT_TYPES = ("run.completed", "run.execution_failed", "run.timed_out")
_TERMINAL_STATE = {"run.completed": "COMPLETED", "run.execution_failed": "FAILED", "run.timed_out": "TIMED_OUT"}


class RunAuthorityUnavailable(HTTPException):
    """The shared run authority cannot be reached. Fails closed (503)."""

    def __init__(self, reason: str = "RUN_AUTHORITY_UNAVAILABLE"):
        super().__init__(status_code=503, detail="RUN_AUTHORITY_UNAVAILABLE")
        self.reason = reason


class ClaimHeld(Exception):
    pass


class ArtifactStorageFailed(Exception):
    """Artifact bodies could not be persisted; the whole terminal transaction rolled back."""


# AFCC-3 Phase 6: bounded JSON artifact bodies (migration 150).
ARTIFACT_MAX_BYTES = 1_048_576
ARTIFACT_STORAGE = "FABRIC_RUN_ARTIFACTS"


def _fault(point: str) -> None:
    """Failure-injection seam for tests. No-op in normal operation."""


def _dsn() -> str:
    return (os.getenv("SHF_DATABASE_URL") or os.getenv("DATABASE_URL") or "").strip()


@contextmanager
def transaction() -> Iterator[Any]:
    dsn = _dsn()
    if not dsn:
        raise RunAuthorityUnavailable("RUN_AUTHORITY_DATABASE_UNCONFIGURED")
    try:
        import psycopg  # type: ignore
        from psycopg.rows import dict_row  # type: ignore
    except ImportError as exc:  # pragma: no cover - dependency is installed
        raise RunAuthorityUnavailable("RUN_AUTHORITY_DRIVER_MISSING") from exc
    try:
        connection = psycopg.connect(dsn, row_factory=dict_row)
    except Exception as exc:
        raise RunAuthorityUnavailable("RUN_AUTHORITY_DATABASE_UNREACHABLE") from exc
    try:
        with connection.transaction():
            with connection.cursor() as cursor:
                yield cursor
    finally:
        connection.close()


def _json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, default=str)


def _doc(row: Dict[str, Any]) -> Dict[str, Any]:
    document = row["document"]
    return json.loads(document) if isinstance(document, str) else dict(document)


def _scope(record: Dict[str, Any]) -> tuple[Optional[str], Optional[str]]:
    org = record.get("organization_id")
    tenant = record.get("tenant_id")
    return (tenant if isinstance(tenant, str) else None, org if isinstance(org, str) else None)


def _db_safe_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """Artifacts are referenced by id + hash; the server path never enters the shared store."""
    safe = dict(event)
    if isinstance(safe.get("artifacts"), list):
        safe["artifacts"] = [
            {"storage": "REPLICA_LOCAL_FILE"} | {k: v for k, v in a.items() if k != "path"}
            for a in safe["artifacts"] if isinstance(a, dict)
        ]
    return safe


def _utc(value: datetime) -> datetime:
    # timestamptz comes back in the session zone; records use UTC so ISO strings sort.
    return value.astimezone(timezone.utc)


def _now(cur) -> datetime:
    cur.execute("SELECT clock_timestamp() AS now")
    return _utc(cur.fetchone()["now"])


def _insert_event(cur, event: Dict[str, Any]) -> Dict[str, Any]:
    event = _db_safe_event(event)
    at = _now(cur)
    event["ts"] = at.isoformat()
    cur.execute("SELECT COALESCE(MAX(seq), 0) + 1 AS seq FROM fabric_run_events WHERE run_id = %s", (event["runId"],))
    seq = cur.fetchone()["seq"]
    event["seq"] = seq
    identity = event.get("initiator_actor_id") or (event.get("recorded_by") or {}).get("recorder_actor_id")
    tenant, org = _scope(event)
    _fault(f"event:{event.get('event_type')}")
    cur.execute(
        """INSERT INTO fabric_run_events
             (event_id, run_id, plan_id, seq, event_type, to_state, correlation_id, actor_id, reason_code,
              tenant_id, organization_id, event_at, payload)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb)""",
        (event["event_id"], event["runId"], event["planId"], seq, event.get("event_type"), event.get("to_state"),
         event.get("correlation_id"), identity, event.get("reason_code") or event.get("failure_code"),
         tenant, org, at, _json(event)),
    )
    return event


# ------------------------------------------------------------------ plans


def insert_plan(plan: Dict[str, Any]) -> str:
    created_by = plan.get("createdBy") if isinstance(plan.get("createdBy"), dict) else {}
    verification = (created_by.get("identity_verification") or {}).get("actor")
    tenant, org = _scope(created_by)
    with transaction() as cur:
        cur.execute(
            """INSERT INTO fabric_plans
                 (plan_id, request_id, correlation_id, status, approval_required, approved,
                  creator_actor_id, creator_verification, tenant_id, organization_id, document)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb)""",
            (plan["planId"], plan.get("requestId"), plan.get("correlationId"), plan.get("status", "PLANNED"),
             bool(plan.get("approvalRequired", True)), plan.get("approved") is True,
             created_by.get("creator_actor_id"), verification, tenant, plan.get("organization_id") or org, _json(plan)),
        )
    return plan["planId"]


def load_plan(plan_id: str) -> Optional[Dict[str, Any]]:
    with transaction() as cur:
        cur.execute("SELECT document FROM fabric_plans WHERE plan_id = %s", (plan_id,))
        row = cur.fetchone()
    return _doc(row) if row else None


def list_recent_plans(limit: int) -> List[Dict[str, Any]]:
    with transaction() as cur:
        cur.execute("SELECT document FROM fabric_plans ORDER BY updated_at DESC, plan_id LIMIT %s", (max(0, int(limit)),))
        return [_doc(r) for r in cur.fetchall()]


def _write_plan(cur, plan: Dict[str, Any]) -> None:
    cur.execute(
        """UPDATE fabric_plans
              SET status = %s, approved = %s, correlation_id = %s, document = %s::jsonb,
                  version = version + 1, updated_at = clock_timestamp()
            WHERE plan_id = %s""",
        (plan["status"], plan.get("approved") is True, plan.get("correlationId"), _json(plan), plan["planId"]),
    )


def decide(plan_id: str, decision: Dict[str, Any], may_decide: Callable[[Dict[str, Any]], Optional[str]]) -> Dict[str, Any]:
    from fabric.plan_store import PlanDecisionError

    with transaction() as cur:
        cur.execute("SELECT document FROM fabric_plans WHERE plan_id = %s FOR UPDATE", (plan_id,))
        row = cur.fetchone()
        if not row:
            raise PlanDecisionError("PLAN_NOT_FOUND")
        plan = _doc(row)
        refusal = may_decide(plan)
        if refusal:
            raise PlanDecisionError(refusal)
        decided_at = _now(cur)
        decision = {**decision, "decided_at": decided_at.isoformat()}
        tenant, org = _scope(decision)
        cur.execute(
            """INSERT INTO fabric_plan_decisions
                 (decision_id, plan_id, decision, approver_actor_id, approver, reason, correlation_id,
                  tenant_id, organization_id, decided_at)
               VALUES (%s, %s, %s, %s, %s::jsonb, %s, %s, %s, %s, %s)
               ON CONFLICT (plan_id) DO NOTHING
               RETURNING decision_id""",
            (f"dec_{secrets.token_hex(10)}", plan_id, decision["decision"], decision["approver_actor_id"],
             _json({k: decision.get(k) for k in ("approver_actor_id", "approver_type", "identity_verification", "authority",
                                                   "organization_id", "tenant_id", "source_system", "declared_identity")}),
             decision.get("reason"), decision.get("correlation_id"), tenant, org, decided_at),
        )
        if cur.fetchone() is None:
            raise PlanDecisionError("DECISION_ALREADY_RECORDED")
        approved = decision["decision"] == "APPROVED"
        plan["status"] = "APPROVED" if approved else "REJECTED"
        plan["approved"] = approved
        plan["statusUpdatedAt"] = decision["decided_at"]
        if not plan.get("correlationId") and decision.get("correlation_id"):
            plan["correlationId"] = decision["correlation_id"]
            plan["correlationSource"] = decision.get("correlation_source")
        plan["approvalDecision"] = decision
        plan.setdefault("approvalHistory", []).append(decision)
        _write_plan(cur, plan)
    return plan


# ------------------------------------------------------------------ execution


@dataclass
class Begun:
    plan: Dict[str, Any]
    run_id: str
    claim_version: int
    lease_started_at: str
    lease_expires_at: str
    lease_seconds: int
    reclaimed_run_id: Optional[str]


def begin_execution(
    *,
    plan_id: str,
    run_id: str,
    actor_id: str,
    correlation_id: str,
    lease_seconds: int,
    admit: Callable[[Dict[str, Any]], Optional[Dict[str, Any]]],
    start_event: Callable[[Dict[str, Any], Dict[str, Any]], Dict[str, Any]],
    orphan_event: Callable[[Dict[str, Any]], Dict[str, Any]],
) -> Begun | Dict[str, Any]:
    """One transaction: lock plan, re-admit, claim, record start. Returns the
    admission response (e.g. idempotent DONE) instead of Begun when admit() gives one."""
    with transaction() as cur:
        _fault("begin_before_plan_lock")
        cur.execute("SELECT document FROM fabric_plans WHERE plan_id = %s FOR UPDATE", (plan_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Plan not found")
        plan = _doc(row)
        _fault("begin_after_plan_lock")
        early = admit(plan)
        if early is not None:
            return early

        cur.execute("SELECT * FROM fabric_execution_claims WHERE plan_id = %s FOR UPDATE", (plan_id,))
        previous = cur.fetchone()
        _fault("begin_before_claim")
        # Conditional upsert: the WHERE clause alone decides the winner, so this
        # is atomic even without the plan lock.
        cur.execute(
            """INSERT INTO fabric_execution_claims
                 (plan_id, run_id, claimed_by_actor_id, correlation_id, lease_started_at, lease_expires_at, claim_version)
               VALUES (%s, %s, %s, %s, clock_timestamp(), clock_timestamp() + make_interval(secs => %s), 1)
               ON CONFLICT (plan_id) DO UPDATE
                 SET run_id = EXCLUDED.run_id,
                     claimed_by_actor_id = EXCLUDED.claimed_by_actor_id,
                     correlation_id = EXCLUDED.correlation_id,
                     lease_started_at = EXCLUDED.lease_started_at,
                     lease_expires_at = EXCLUDED.lease_expires_at,
                     claim_version = fabric_execution_claims.claim_version + 1,
                     released_at = NULL,
                     release_reason = NULL
               WHERE fabric_execution_claims.released_at IS NOT NULL
                  OR fabric_execution_claims.lease_expires_at + make_interval(secs => %s) <= clock_timestamp()
               RETURNING run_id, claim_version, lease_started_at, lease_expires_at""",
            (plan_id, run_id, actor_id, correlation_id, lease_seconds, TAKEOVER_GRACE_SECONDS),
        )
        claim = cur.fetchone()
        if claim is None:
            raise ClaimHeld()
        _fault("begin_after_claim")

        reclaimed_run_id = None
        if previous and previous["released_at"] is None and previous["run_id"] != run_id:
            # A live-but-expired claim was taken over: record that for its run.
            reclaimed_run_id = previous["run_id"]
            _insert_event(cur, orphan_event({
                "run_id": previous["run_id"],
                "correlation_id": previous["correlation_id"],
                "lease_expires_at": _utc(previous["lease_expires_at"]).isoformat(),
                "claim_version": previous["claim_version"],
            }))

        lease = {
            "lease_started_at": _utc(claim["lease_started_at"]).isoformat(),
            "lease_expires_at": _utc(claim["lease_expires_at"]).isoformat(),
            "lease_seconds": lease_seconds,
            "claim_version": claim["claim_version"],
        }
        _insert_event(cur, start_event(plan, lease))
        _fault("begin_before_commit")
    return Begun(plan=plan, run_id=run_id, claim_version=claim["claim_version"], lease_started_at=lease["lease_started_at"],
                 lease_expires_at=lease["lease_expires_at"], lease_seconds=lease_seconds, reclaimed_run_id=reclaimed_run_id)


def _insert_artifacts(cur, artifacts: List[Dict[str, Any]], *, run_id: str, plan_id: str, completeness: str) -> None:
    """Artifact bodies, inside the terminal transaction. Any failure aborts the
    whole transaction and surfaces as ArtifactStorageFailed."""
    for a in artifacts:
        if len(a["canonical_text"].encode("utf-8")) > ARTIFACT_MAX_BYTES:
            raise ArtifactStorageFailed("ARTIFACT_TOO_LARGE")
    try:
        for a in artifacts:
            _fault("artifact_insert")
            cur.execute(
                """INSERT INTO fabric_run_artifacts
                     (artifact_id, canonical_ref, run_id, plan_id, artifact_type, content_hash, content_length,
                      body_canonical, completeness, created_by_actor_id, tenant_id, organization_id, correlation_id, created_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, clock_timestamp())""",
                (a["artifact_id"], a["canonical_ref"], run_id, plan_id, a["artifact_type"], a["content_hash"],
                 len(a["canonical_text"].encode("utf-8")), a["canonical_text"], completeness, a["created_by_actor_id"],
                 a.get("tenant_id"), a.get("organization_id"), a.get("correlation_id")),
            )
    except ArtifactStorageFailed:
        raise
    except Exception as exc:
        raise ArtifactStorageFailed("ARTIFACT_INSERT_FAILED") from exc


def close_execution(
    *,
    plan_id: str,
    run_id: str,
    claim_version: int,
    outcome: str,
    terminal_event: Callable[[str, bool], Dict[str, Any]],
    complete_plan: Callable[[Dict[str, Any]], None],
    artifacts: Optional[List[Dict[str, Any]]] = None,
) -> str:
    """One transaction: fence, artifact bodies, terminal event, plan transition,
    claim release. Returns the outcome actually recorded (COMPLETED may become
    TIMED_OUT). Raises ArtifactStorageFailed (nothing persisted) if bodies fail."""
    with transaction() as cur:
        cur.execute("SELECT document FROM fabric_plans WHERE plan_id = %s FOR UPDATE", (plan_id,))
        row = cur.fetchone()
        plan = _doc(row) if row else None
        cur.execute(
            """SELECT run_id, claim_version, released_at, lease_expires_at <= clock_timestamp() AS expired
                 FROM fabric_execution_claims WHERE plan_id = %s FOR UPDATE""",
            (plan_id,),
        )
        claim = cur.fetchone()
        # A run is closed once: a second close returns the recorded outcome.
        cur.execute(
            "SELECT event_type FROM fabric_run_events WHERE run_id = %s AND event_type = ANY(%s) ORDER BY seq LIMIT 1",
            (run_id, list(TERMINAL_EVENT_TYPES)),
        )
        already = cur.fetchone()
        if already:
            return _TERMINAL_STATE[already["event_type"]]
        owned = bool(claim) and claim["run_id"] == run_id and claim["claim_version"] == claim_version and claim["released_at"] is None
        expired = (not claim) or bool(claim["expired"])
        final = outcome
        if outcome == "COMPLETED" and (not owned or expired):
            # No completion after the lease: the executor lost its authority.
            final = "TIMED_OUT"
        _fault("close_before_event")
        if artifacts:
            # Bodies commit with the terminal event or not at all.
            _insert_artifacts(cur, artifacts, run_id=run_id, plan_id=plan_id,
                              completeness="COMPLETE" if final == "COMPLETED" else "PARTIAL")
        _insert_event(cur, terminal_event(final, not owned))
        if owned:
            if final == "COMPLETED" and plan is not None:
                complete_plan(plan)
                _write_plan(cur, plan)
            _fault("close_before_release")
            cur.execute(
                "UPDATE fabric_execution_claims SET released_at = clock_timestamp(), release_reason = %s WHERE plan_id = %s AND claim_version = %s",
                (final, plan_id, claim_version),
            )
        _fault("close_before_commit")
    return final


# ------------------------------------------------------------------ reads


def read_events() -> List[Dict[str, Any]]:
    with transaction() as cur:
        cur.execute("SELECT payload FROM fabric_run_events ORDER BY event_at, run_id, seq")
        rows = cur.fetchall()
    out = []
    for r in rows:
        payload = r["payload"]
        out.append(json.loads(payload) if isinstance(payload, str) else dict(payload))
    return out


# ------------------------------------------------------------------ artifacts (reads)


def get_artifact(artifact_id: str) -> Optional[Dict[str, Any]]:
    with transaction() as cur:
        cur.execute("SELECT * FROM fabric_run_artifacts WHERE artifact_id = %s", (artifact_id,))
        row = cur.fetchone()
    return dict(row) if row else None


def artifacts_for_run(run_id: str) -> List[Dict[str, Any]]:
    with transaction() as cur:
        cur.execute("SELECT * FROM fabric_run_artifacts WHERE run_id = %s ORDER BY created_at, artifact_id", (run_id,))
        return [dict(r) for r in cur.fetchall()]


def artifact_ids() -> set:
    with transaction() as cur:
        cur.execute("SELECT artifact_id FROM fabric_run_artifacts")
        return {r["artifact_id"] for r in cur.fetchall()}


def storage_health() -> Dict[str, Any]:
    """Read-only: connectivity plus presence of the run-authority and artifact tables.
    Never writes, never reads artifact bodies."""
    if not _dsn():
        return {"state": "NOT_CONFIGURED", "reason_code": "RUN_AUTHORITY_DATABASE_UNCONFIGURED"}
    try:
        with transaction() as cur:
            cur.execute(
                """SELECT to_regclass('public.fabric_run_events') IS NOT NULL AS run_authority,
                          to_regclass('public.fabric_run_artifacts') IS NOT NULL AS artifact_store"""
            )
            row = cur.fetchone()
    except RunAuthorityUnavailable as exc:
        return {"state": "UNAVAILABLE", "reason_code": exc.reason}
    if row["run_authority"] and row["artifact_store"]:
        return {"state": "AVAILABLE", "reason_code": "SHARED_ARTIFACT_STORE_READY"}
    if row["run_authority"]:
        return {"state": "DEGRADED", "reason_code": "ARTIFACT_STORE_MIGRATION_MISSING"}
    return {"state": "DEGRADED", "reason_code": "RUN_AUTHORITY_MIGRATION_MISSING"}


def artifact_metadata_for_runs(run_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    """Metadata only (no bodies) for list projections."""
    if not run_ids:
        return {}
    with transaction() as cur:
        cur.execute(
            """SELECT artifact_id, canonical_ref, run_id, artifact_type, content_hash, content_length, completeness, created_at
                 FROM fabric_run_artifacts WHERE run_id = ANY(%s)""",
            (list(run_ids),),
        )
        return {r["artifact_id"]: dict(r) for r in cur.fetchall()}


def verify_artifact_row(row: Dict[str, Any], expected_hash: Optional[str] = None) -> str:
    """VERIFIED only if the stored body hashes to its recorded digest (and to the
    run lifecycle's recorded digest when one is given). Pure; no I/O."""
    body = str(row.get("body_canonical") or "").encode("utf-8")
    digest = hashlib.sha256(body).hexdigest()
    if digest != row.get("content_hash") or len(body) != row.get("content_length"):
        return "HASH_MISMATCH"
    if expected_hash is not None and expected_hash != digest:
        return "HASH_MISMATCH"
    return "VERIFIED"
