from __future__ import annotations

"""
AFCC-3 Live Operations read projections.

Lifecycle authority: the append-only run event log `db/runs/events.jsonl`
(written only by `POST /runs/execute`), joined read-only with the plan store
for approval. State rules live in `fabric.run_lifecycle`. This module never
writes, never creates directories, and never reads the tenant-scoped
operational event store.
"""

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from fabric.command.sanitize import REDACTED, sanitize, safe_reason_code
from fabric import run_authority
from fabric.run_lifecycle import (
    APPROVAL_REQUIRED,
    APPROVED,
    APPROVAL_DENIED,
    DEFERRED_STATES,
    NOT_APPLICABLE,
    NOT_CAPTURED,
    RECORDED_SCHEMAS,
    SUPPORTED_STATES,
    TERMINAL_STATES,
    UNKNOWN,
    derive_approval,
    derive_plan_state,
    derive_run_state,
    event_state_claim,
    is_valid_id,
    is_valid_run_id,
)

NOT_AVAILABLE = "NOT_AVAILABLE"
NOT_PUBLISHED = "NOT_PUBLISHED"

RUN_ID_RE = re.compile(r"^[A-Za-z0-9_.:-]{1,128}$")
REF_RE = re.compile(r"^[A-Za-z0-9_.:#-]{1,160}$")
TOKEN_RE = re.compile(r"^[A-Za-z][A-Za-z0-9_.:-]{0,63}$")
EVENT_TYPE_RE = re.compile(r"^[a-z][a-z0-9_.]{0,63}$")

RUN_EVENTS_AUTHORITY = "agent_fabric.run_events"
PLAN_STORE_AUTHORITY = "agent_fabric.plan_store"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _source(extra: Dict[str, Any] | None = None) -> Dict[str, Any]:
    postgres = run_authority.is_postgres()
    base = {
        "authority": "Agent Fabric shared run authority" if postgres else "Agent Fabric run ledger and plan store",
        "stores": ["postgres:fabric_plans", "postgres:fabric_plan_decisions", "postgres:fabric_execution_claims",
                   "postgres:fabric_run_events", "legacy-read-only:db/runs/events.jsonl", "legacy-read-only:db/plans/*.json"]
        if postgres else ["db/runs/events.jsonl", "db/plans/*.json"],
        "run_authority": run_authority.storage_mode(),
        "projection": "live_operations",
        "read_only": True,
    }
    if extra:
        base.update(extra)
    return base


def _safe_run_id(run_id: str) -> str:
    text = str(run_id or "").strip()
    if not is_valid_run_id(text):
        raise ValueError("INVALID_RUN_ID")
    return text


# ------------------------------------------------------------------ sources


def _runs_log_path() -> Path:
    # Tests monkeypatch routers.runs_routes.RUNS_LOG; read it lazily so the
    # projection follows the current run source without importing at module load.
    from routers.runs_routes import RUNS_LOG

    return RUNS_LOG


def _plans_dir() -> Path:
    import fabric.plan_store as plan_store

    return plan_store.PLANS_DIR


LEGACY_FILE_STORE = "LEGACY_FILE_STORE"
POSTGRES_RUN_AUTHORITY = "POSTGRES_RUN_AUTHORITY"
REPLICA_LOCAL_FILE_STORE = "REPLICA_LOCAL_FILE_STORE"


def _read_events() -> Tuple[List[Dict[str, Any]], int]:
    """Run events plus the count of malformed legacy lines.

    Postgres authority: its events, then the replica's legacy JSONL events,
    read-only and marked LEGACY_FILE_STORE (never written again). File
    authority: the JSONL log as before.
    """
    file_events, malformed = _read_file_events()
    if not run_authority.is_postgres():
        return [dict(e, _record_origin=REPLICA_LOCAL_FILE_STORE) for e in file_events], malformed
    from fabric import run_authority_pg

    db_events = [dict(e, _record_origin=POSTGRES_RUN_AUTHORITY) for e in run_authority_pg.read_events()]
    return db_events + [dict(e, _record_origin=LEGACY_FILE_STORE) for e in file_events], malformed


def _read_file_events() -> Tuple[List[Dict[str, Any]], int]:
    path = _runs_log_path()
    if not path.is_file():
        return [], 0
    out: List[Dict[str, Any]] = []
    malformed = 0
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            malformed += 1
            continue
        if isinstance(event, dict):
            out.append(event)
        else:
            malformed += 1
    return out, malformed


def _load_plan(plan_id: Optional[str]) -> Optional[Dict[str, Any]]:
    if not is_valid_id(plan_id):
        return None
    if run_authority.is_postgres():
        from fabric import run_authority_pg

        plan = run_authority_pg.load_plan(plan_id)
        if plan is not None:
            return plan
        # Fall through: a legacy run may reference a legacy plan file.
    return _load_file_plan(plan_id)


def _load_file_plan(plan_id: str) -> Optional[Dict[str, Any]]:
    # Read-only: never uses plan_store helpers, which create directories.
    path = _plans_dir() / f"{plan_id}.json"
    if not path.is_file():
        return None
    try:
        plan = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    return plan if isinstance(plan, dict) else None


def _recent_plans(limit: int) -> List[Dict[str, Any]]:
    if run_authority.is_postgres():
        from fabric import run_authority_pg

        db_plans = [dict(p, _record_origin=POSTGRES_RUN_AUTHORITY) for p in run_authority_pg.list_recent_plans(limit)]
        legacy = [dict(p, _record_origin=LEGACY_FILE_STORE) for p in _recent_file_plans(limit)]
        return (db_plans + legacy)[: max(0, int(limit))]
    return [dict(p, _record_origin=REPLICA_LOCAL_FILE_STORE) for p in _recent_file_plans(limit)]


def _recent_file_plans(limit: int) -> List[Dict[str, Any]]:
    directory = _plans_dir()
    if not directory.is_dir():
        return []
    files = sorted(directory.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    out = []
    for path in files[: max(0, int(limit))]:
        try:
            plan = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if isinstance(plan, dict):
            out.append(plan)
    return out


# ------------------------------------------------------------------ field access


def _event_run_id(event: Dict[str, Any]) -> str | None:
    for key in ("runId", "run_id"):
        value = event.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    context = event.get("context")
    if isinstance(context, dict):
        value = context.get("run_id") or context.get("runId")
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _event_plan_id(event: Dict[str, Any]) -> str | None:
    for key in ("planId", "plan_id"):
        value = event.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    context = event.get("context")
    if isinstance(context, dict):
        value = context.get("plan_id") or context.get("planId")
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _event_ts(event: Dict[str, Any]) -> str | None:
    for key in ("ts", "timestamp", "occurred_at", "created_at"):
        value = event.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _latest(events: List[Dict[str, Any]], *keys: str) -> Any:
    """Newest non-empty value for any of `keys` across a run's events."""
    for event in reversed(events):
        for key in keys:
            value = event.get(key)
            if value is not None and value != "" and value != []:
                return value
    return None


def _str(events: List[Dict[str, Any]], *keys: str, default: str = NOT_CAPTURED) -> str:
    value = _latest(events, *keys)
    return value.strip() if isinstance(value, str) and value.strip() else default


def _identifier(events: List[Dict[str, Any]], *keys: str) -> str:
    """Actor/org/tenant ids: identifier-shaped values only; anything else is redacted."""
    value = _latest(events, *keys)
    if value is None:
        return NOT_CAPTURED
    return value if is_valid_id(value) else REDACTED


def _token(events: List[Dict[str, Any]], *keys: str, default: str = NOT_CAPTURED) -> str:
    value = _latest(events, *keys)
    if value is None:
        return default
    return value if isinstance(value, str) and TOKEN_RE.match(value) else REDACTED


def _refs(events: List[Dict[str, Any]], *keys: str) -> List[str]:
    """Union of reference ids across a run's events. References only, never records."""
    out: List[str] = []
    for event in events:
        for key in keys:
            value = event.get(key)
            if not isinstance(value, list):
                continue
            for item in value:
                if isinstance(item, str) and REF_RE.match(item.strip()) and item.strip() not in out:
                    out.append(item.strip())
    return out


def _run_ref(events: List[Dict[str, Any]], *keys: str) -> str:
    value = _latest(events, *keys)
    if value is None:
        return NOT_CAPTURED
    return value if is_valid_id(value) else REDACTED


def _artifact_view(run_id: str, events: List[Dict[str, Any]], *, verify: bool, metadata: Optional[Dict[str, Dict[str, Any]]] = None) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """AFCC-3 Phase 6: per-artifact storage + verification state, and the run's
    evidence status. Evidence is DURABLE only when every referenced body is in
    the shared artifact store (and, when verified, hashes match). Never exposes
    bodies, paths or storage internals."""
    origin = _record_origin(events)
    rows: Dict[str, Dict[str, Any]] = {}
    if origin == POSTGRES_RUN_AUTHORITY:
        from fabric import run_authority_pg

        if verify:
            rows = {r["artifact_id"]: r for r in run_authority_pg.artifacts_for_run(run_id)}
        else:
            rows = metadata if metadata is not None else run_authority_pg.artifact_metadata_for_runs([run_id])
    views: List[Dict[str, Any]] = []
    for event in events:
        for artifact in event.get("artifacts") or []:
            if not isinstance(artifact, dict):
                continue
            artifact_id = artifact.get("artifactId") or artifact.get("artifact_id") or NOT_CAPTURED
            recorded_hash = artifact.get("sha256") or NOT_CAPTURED
            view = {"artifact_id": artifact_id, "sha256": recorded_hash, "canonical_ref": NOT_CAPTURED, "type": NOT_CAPTURED,
                    "size": NOT_CAPTURED, "created_at": NOT_CAPTURED, "completeness": NOT_CAPTURED}
            if origin == POSTGRES_RUN_AUTHORITY:
                row = rows.get(artifact_id)
                if artifact.get("storage_state") == "STORAGE_FAILED":
                    state, verification = "STORAGE_FAILED", NOT_APPLICABLE
                elif row is None:
                    state, verification = "MISSING", NOT_APPLICABLE
                else:
                    state = "STORED"
                    if verify:
                        verification = run_authority_pg.verify_artifact_row(row, expected_hash=recorded_hash)
                    else:
                        verification = "HASH_RECORDED" if row["content_hash"] == recorded_hash else "HASH_MISMATCH"
                    view.update(canonical_ref=row["canonical_ref"], type=row["artifact_type"], size=row["content_length"],
                                created_at=row["created_at"].astimezone(timezone.utc).isoformat(), completeness=row["completeness"])
            else:
                state = "LEGACY_REPLICA_LOCAL" if origin == LEGACY_FILE_STORE else "REPLICA_LOCAL"
                verification = "NOT_VERIFIABLE"
            view.update(storage_state=state, verification_state=verification, durable=state == "STORED")
            views.append(view)
    states = {v["storage_state"] for v in views}
    checks = {v["verification_state"] for v in views}
    if not views:
        status = "NONE"
    elif "HASH_MISMATCH" in checks:
        status = "INTEGRITY_FAILED"
    elif "STORAGE_FAILED" in states:
        status = "STORAGE_FAILED"
    elif "MISSING" in states:
        status = "INCOMPLETE"
    elif states == {"STORED"}:
        status = "DURABLE"
    else:
        status = "NOT_DURABLE"
    evidence = {
        "status": status,
        "artifact_count": len(views),
        "durable_count": sum(1 for v in views if v["durable"]),
        "verified": verify and status == "DURABLE" and checks <= {"VERIFIED"},
        "storage": "FABRIC_RUN_ARTIFACTS" if origin == POSTGRES_RUN_AUTHORITY else "REPLICA_LOCAL_FILE",
    }
    return views, evidence


# ------------------------------------------------------------------ projections


VERIFICATION_VALUES = {"VERIFIED", "DECLARED", NOT_CAPTURED, NOT_APPLICABLE, "DERIVED_FROM_VERIFIED_ORGANIZATION"}


def _verification(recorded: Any, field: str, value: str) -> str:
    """VERIFIED only when the writer recorded it from an authenticated session.
    A captured value with no verification record is at most DECLARED."""
    if isinstance(recorded, dict) and recorded.get(field) in VERIFICATION_VALUES:
        return recorded[field]
    return NOT_CAPTURED if value == NOT_CAPTURED else "DECLARED"


def _authority(value: Any) -> Dict[str, str]:
    value = value if isinstance(value, dict) else {}
    out = {}
    for key in ("authentication", "role", "permission", "scope"):
        item = value.get(key)
        out[key] = item if isinstance(item, str) and TOKEN_RE.match(item) else NOT_CAPTURED
    return out


def _declared(value: Any) -> Dict[str, Any] | str:
    if not isinstance(value, dict):
        return NOT_CAPTURED
    out: Dict[str, Any] = {"verification": "DECLARED"}
    for key in ("actor_id", "organization_id", "tenant_id", "source_system"):
        if key in value:
            out[key] = value[key] if is_valid_id(value[key]) else REDACTED
    return out


def _identity(events: List[Dict[str, Any]], prefix: str) -> Dict[str, Any]:
    """Identity block for a run initiator from its latest event that recorded one."""
    recorded = _latest(events, "identity_verification")
    actor_id = _identifier(events, f"{prefix}_actor_id", "actorId", "initiatedBy", "actor_id")
    organization_id = _identifier(events, "organization_id", "organizationId")
    tenant_id = _identifier(events, "tenant_id", "tenantId")
    source_system = _token(events, "source_system", "sourceSystem")
    initiator_type = _token(events, f"{prefix}_type", "actor_type")
    return {
        "actor_id": actor_id,
        "actor_type": initiator_type,
        "initiator_type": initiator_type,
        "actor_verification": _verification(recorded, "actor", actor_id),
        "organization_id": organization_id,
        "organization_verification": _verification(recorded, "organization", organization_id),
        "tenant_id": tenant_id,
        "tenant_verification": _verification(recorded, "tenant", tenant_id),
        "source_system": source_system,
        "source_system_verification": _verification(recorded, "source_system", source_system),
        "authority": _authority(_latest(events, "authority")),
        "declared_identity": _declared(_latest(events, "declared_identity")),
        "entry_point": _token(events, "entry_point"),
        # Every event in this log was written by Agent Fabric itself.
        "execution_system": "agent_fabric",
    }


def _initiator(events: List[Dict[str, Any]]) -> Dict[str, Any]:
    return _identity(events, "initiator")


def _approval_decision(plan: Optional[Dict[str, Any]]) -> Dict[str, Any] | str:
    decision = (plan or {}).get("approvalDecision")
    if not isinstance(decision, dict):
        return NOT_CAPTURED
    view = _identity([decision], "approver")
    return {
        "decision": decision.get("decision") if decision.get("decision") in {"APPROVED", "REJECTED"} else UNKNOWN,
        "approver_actor_id": view["actor_id"],
        "approver_type": view["actor_type"],
        "actor_verification": view["actor_verification"],
        "organization_id": view["organization_id"],
        "organization_verification": view["organization_verification"],
        "tenant_id": view["tenant_id"],
        "tenant_verification": view["tenant_verification"],
        "authority": view["authority"],
        "declared_identity": view["declared_identity"],
        "decided_at": decision.get("decided_at") if isinstance(decision.get("decided_at"), str) else NOT_CAPTURED,
        "reason": decision.get("reason") if isinstance(decision.get("reason"), str) and decision.get("reason") else NOT_CAPTURED,
        "correlation_id": decision.get("correlation_id") if is_valid_id(decision.get("correlation_id")) else NOT_CAPTURED,
        "authority_ref": PLAN_STORE_AUTHORITY,
        "provenance": "RECORDED",
    }


def _approval(plan: Optional[Dict[str, Any]], events: List[Dict[str, Any]] = ()) -> Dict[str, Any]:
    approval = derive_approval(plan, events)
    approval["decision"] = _approval_decision(plan)
    return approval


def _plan_creator(plan: Dict[str, Any]) -> Dict[str, Any] | str:
    created_by = plan.get("createdBy")
    if not isinstance(created_by, dict):
        return NOT_CAPTURED
    view = _identity([created_by], "creator")
    return {k: view[k] for k in ("actor_id", "actor_type", "actor_verification", "organization_id", "organization_verification",
                                  "tenant_id", "tenant_verification", "source_system", "source_system_verification", "authority")}


def _execution(events: List[Dict[str, Any]]) -> Dict[str, Any]:
    executor = _latest(events, "executor")
    executor = executor if isinstance(executor, dict) else {}
    model_invoked = executor.get("model_invoked")
    no_model = model_invoked is False
    adapters = [a for a in executor.get("adapters") or [] if isinstance(a, str) and TOKEN_RE.match(a)] if "adapters" in executor else None
    if adapters is None:
        adapter = _token(events, "adapter")
    elif not adapters:
        adapter = "NONE"
    else:
        adapter = adapters[0] if len(adapters) == 1 else "MULTIPLE"
    return {
        "provider": _token(events, "provider", default=NOT_APPLICABLE if no_model else NOT_CAPTURED),
        "model": _token(events, "model", default=NOT_APPLICABLE if no_model else NOT_CAPTURED),
        "adapter": adapter,
        "adapters": adapters if adapters is not None else [],
        "agent_version": _token(events, "agent_version", "agentVersion"),
        "model_invoked": model_invoked if isinstance(model_invoked, bool) else NOT_CAPTURED,
    }


def _correlation(events: List[Dict[str, Any]], plan: Optional[Dict[str, Any]]) -> Dict[str, str]:
    recorded = _latest(events, "correlation_id", "correlationId")
    if is_valid_id(recorded):
        source = _latest(events, "correlation_source")
        return {"id": recorded, "source": source if isinstance(source, str) and TOKEN_RE.match(source) else "RUN_EVENT"}
    plan_corr = (plan or {}).get("correlationId")
    if is_valid_id(plan_corr):
        return {"id": plan_corr, "source": "PLAN"}
    request_id = _latest(events, "requestId") or (plan or {}).get("requestId")
    if is_valid_id(request_id):
        return {"id": request_id, "source": "LEGACY_REQUEST_ID"}
    return {"id": NOT_CAPTURED, "source": NOT_CAPTURED}


def _execution_safety() -> Dict[str, str]:
    """Operator-facing guarantee of the active run authority.
    DISTRIBUTED only when the shared Postgres authority is in use."""
    safety = run_authority.execution_safety()
    return {
        "level": safety["level"],
        "local_single_flight": safety["local_single_flight"],
        "distributed_single_flight": safety["distributed_single_flight"],
        "scope": "SHARED_TRANSACTIONAL_STORE" if safety["level"] == "DISTRIBUTED" else "REPLICA_LOCAL",
        "production_blocker": safety["production_blocker"],
        "artifact_storage": safety["artifact_storage"],
        "summary": safety["summary"],
    }


def _record_origin(records: List[Dict[str, Any]]) -> str:
    origins = {r.get("_record_origin") for r in records if r.get("_record_origin")}
    if len(origins) == 1:
        return origins.pop()
    return "MIXED" if origins else NOT_CAPTURED


def _execution_lease(events: List[Dict[str, Any]], state: str) -> Dict[str, Any]:
    """What the recorded lease says about a started run. Evaluated against the clock now."""
    start = next((e for e in events if event_state_claim(e) == "EXECUTING"), None)
    expires = start.get("lease_expires_at") if isinstance(start, dict) else None
    seconds = start.get("lease_seconds") if isinstance(start, dict) else None
    if not isinstance(expires, str):
        status = NOT_CAPTURED  # no start event, or a pre-Phase-4 start without a lease
    elif state in TERMINAL_STATES:
        status = "CLOSED_BY_TERMINAL"
    elif state == "ORPHANED":
        status = "EXPIRED"
    else:
        status = "ACTIVE"
    return {
        "status": status,
        "lease_expires_at": expires if isinstance(expires, str) else NOT_CAPTURED,
        "lease_seconds": seconds if isinstance(seconds, int) and not isinstance(seconds, bool) else NOT_CAPTURED,
        "heartbeat": "NOT_SUPPORTED",
        "orphan_recorded": any(event_state_claim(e) == "ORPHANED" for e in events),
        # Shared only when the run's events live in the Postgres run authority.
        "scope": "SHARED_TRANSACTIONAL_STORE" if _record_origin(events) == POSTGRES_RUN_AUTHORITY else "REPLICA_LOCAL",
        "evaluated_at": _now_iso(),
    }


def _correlation_continuity(events: List[Dict[str, Any]], plan: Optional[Dict[str, Any]]) -> str:
    ids = {e.get("correlation_id") for e in events if is_valid_id(e.get("correlation_id"))}
    plan = plan or {}
    if is_valid_id(plan.get("correlationId")):
        ids.add(plan["correlationId"])
    decision = plan.get("approvalDecision")
    if isinstance(decision, dict) and is_valid_id(decision.get("correlation_id")):
        ids.add(decision["correlation_id"])
    if not ids:
        return NOT_CAPTURED
    return "CONSISTENT" if len(ids) == 1 else "DIVERGENT"


def _retry_lineage(events: List[Dict[str, Any]], run_id: str, same_plan_run_ids: List[str]) -> Dict[str, Any]:
    count = _latest(events, "retry_count")
    return {
        "retry_supported": False,
        "retrying_state": "DEFERRED",
        "retry_count": count if isinstance(count, int) and not isinstance(count, bool) and count >= 0 else NOT_CAPTURED,
        "parent_run_id": _run_ref(events, "parent_run_id", "parentRunId"),
        "root_run_id": _run_ref(events, "root_run_id", "rootRunId"),
        "retry_of_run_id": _run_ref(events, "retry_of_run_id", "retryOfRunId"),
        # Other runs recorded against the same plan. /runs/execute is idempotent
        # per plan, so more than one entry is an anomaly, not a retry chain.
        "same_plan_run_ids": [r for r in same_plan_run_ids if r != run_id],
    }


def _domain_ref(authority: str, refs: List[str]) -> Dict[str, Any]:
    return {
        "authority": authority,
        "state": "PUBLISHED" if refs else NOT_PUBLISHED,
        "link_basis": "RUN_EVENT_RECORDED" if refs else "NO_RUN_SPECIFIC_RELATION",
        "refs": refs,
    }


def _plan_events(plan: Optional[Dict[str, Any]], run_id: str) -> List[Dict[str, Any]]:
    """Approval transitions the plan store can prove. Marked DERIVED."""
    if not isinstance(plan, dict) or not is_valid_id(plan.get("planId")):
        return []
    plan_id = plan["planId"]
    required = bool(plan.get("approvalRequired", True))
    correlation = plan.get("correlationId") if is_valid_id(plan.get("correlationId")) else NOT_CAPTURED
    out = []
    created_at = plan.get("createdAt")
    if isinstance(created_at, str) and created_at:
        out.append(_timeline_entry(
            event_id=f"plan:{plan_id}:created", run_id=run_id, event_type="plan.created",
            from_state=NOT_APPLICABLE, to_state=APPROVAL_REQUIRED if required else APPROVED,
            occurred_at=created_at, reason_code="PLAN_CREATED", correlation_id=correlation,
            actor_ref=_identifier([plan["createdBy"]], "creator_actor_id") if isinstance(plan.get("createdBy"), dict) else NOT_CAPTURED,
            source=PLAN_STORE_AUTHORITY, provenance="DERIVED",
        ))
    history = [d for d in plan.get("approvalHistory") or [] if isinstance(d, dict)]
    for index, decision in enumerate(history):
        verdict = decision.get("decision")
        if verdict not in {"APPROVED", "REJECTED"}:
            continue
        out.append(_timeline_entry(
            event_id=f"plan:{plan_id}:decision:{index}", run_id=run_id,
            event_type="plan.approved" if verdict == "APPROVED" else "plan.rejected",
            from_state=APPROVAL_REQUIRED, to_state=APPROVED if verdict == "APPROVED" else APPROVAL_DENIED,
            occurred_at=decision.get("decided_at") if isinstance(decision.get("decided_at"), str) else NOT_CAPTURED,
            actor_ref=_identifier([decision], "approver_actor_id"),
            reason_code=f"PLAN_{verdict}", reason_summary=decision.get("reason") if isinstance(decision.get("reason"), str) and decision.get("reason") else NOT_CAPTURED,
            correlation_id=decision.get("correlation_id") if is_valid_id(decision.get("correlation_id")) else correlation,
            source=PLAN_STORE_AUTHORITY, provenance="RECORDED",
        ))
    status = str(plan.get("status") or "").upper()
    if not history and status in {"APPROVED", "REJECTED"}:
        out.append(_timeline_entry(
            event_id=f"plan:{plan_id}:{status.lower()}", run_id=run_id,
            event_type="plan.approved" if status == "APPROVED" else "plan.rejected",
            from_state=APPROVAL_REQUIRED, to_state=APPROVED if status == "APPROVED" else APPROVAL_DENIED,
            occurred_at=plan.get("statusUpdatedAt") if isinstance(plan.get("statusUpdatedAt"), str) else NOT_CAPTURED,
            reason_code=f"PLAN_{status}", correlation_id=correlation,
            source=PLAN_STORE_AUTHORITY, provenance="DERIVED",
        ))
    return out


def _timeline_entry(**fields: Any) -> Dict[str, Any]:
    return {
        "event_id": fields["event_id"],
        "run_id": fields["run_id"],
        "event_type": fields["event_type"],
        "from_state": fields["from_state"],
        "to_state": fields["to_state"],
        "occurred_at": fields["occurred_at"],
        "actor_ref": fields.get("actor_ref", NOT_CAPTURED),
        "authority_ref": fields["source"],
        "reason_code": fields.get("reason_code", NOT_CAPTURED),
        "reason_summary": fields.get("reason_summary", NOT_CAPTURED),
        "evidence_refs": fields.get("evidence_refs", []),
        "policy_refs": fields.get("policy_refs", []),
        "correlation_id": fields["correlation_id"],
        "source": fields["source"],
        "provenance": fields["provenance"],
    }


def _run_event_entry(event: Dict[str, Any], run_id: str, index: int, correlation_id: str) -> Dict[str, Any]:
    recorded = event.get("schema_version") in RECORDED_SCHEMAS
    claim = event_state_claim(event)
    event_id = event.get("event_id") or event.get("id")
    event_type = event.get("event_type")
    kind = event.get("kind")
    from_state = event.get("from_state")
    reason_code = event.get("reason_code") or event.get("failure_code")
    summary = event.get("message")
    recorded_corr = event.get("correlation_id") or event.get("correlationId")
    return _timeline_entry(
        event_id=event_id if is_valid_id(event_id) else f"run:{run_id}:{index}",
        run_id=run_id,
        event_type=event_type if isinstance(event_type, str) and EVENT_TYPE_RE.match(event_type)
        else f"run.{kind}" if isinstance(kind, str) and EVENT_TYPE_RE.match(kind) else NOT_CAPTURED,
        from_state=from_state if from_state in SUPPORTED_STATES else NOT_CAPTURED,
        to_state=claim if claim in SUPPORTED_STATES else UNKNOWN,
        occurred_at=_event_ts(event) or NOT_CAPTURED,
        actor_ref=_identifier([event], "initiator_actor_id", "actorId", "initiatedBy", "actor_id"),
        reason_code=safe_reason_code(reason_code, NOT_CAPTURED) if reason_code else NOT_CAPTURED,
        reason_summary=summary if isinstance(summary, str) and summary.strip() else NOT_CAPTURED,
        evidence_refs=_refs([event], "evidence_refs", "evidenceRefs"),
        policy_refs=_refs([event], "policy_refs", "policyRefs"),
        correlation_id=recorded_corr if is_valid_id(recorded_corr) else correlation_id,
        source=RUN_EVENTS_AUTHORITY,
        provenance="RECORDED" if recorded else "LEGACY_DERIVED",
    )


def _group_events(events: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """Events per valid run id, oldest first; ties keep file order (deterministic)."""
    indexed = sorted(enumerate(events), key=lambda item: (_event_ts(item[1]) or "", item[0]))
    groups: Dict[str, List[Dict[str, Any]]] = {}
    for _, event in indexed:
        rid = _event_run_id(event)
        if rid and RUN_ID_RE.match(rid):
            groups.setdefault(rid, []).append(event)
    return groups


def _plan_run_index(groups: Dict[str, List[Dict[str, Any]]]) -> Dict[str, List[str]]:
    index: Dict[str, List[str]] = {}
    for rid, evs in groups.items():
        for pid in {p for p in (_event_plan_id(e) for e in evs) if p}:
            index.setdefault(pid, []).append(rid)
    return index


def _run_from_events(run_id: str, events: List[Dict[str, Any]], plan_runs: Dict[str, List[str]], *, verify: bool = False,
                     artifact_metadata: Optional[Dict[str, Dict[str, Any]]] = None) -> Dict[str, Any]:
    plan_ids = sorted({p for p in (_event_plan_id(e) for e in events) if p})
    plan_id = plan_ids[-1] if len(plan_ids) == 1 else None
    plan = _load_plan(plan_id)
    if len(plan_ids) > 1:
        derivation = {"state": UNKNOWN, "reason_code": "PLAN_REFERENCE_CONFLICT", "conflict": True}
    else:
        derivation = derive_run_state(events, plan)
    state = derivation["state"]
    agent = plan.get("agent") if isinstance(plan, dict) and isinstance(plan.get("agent"), dict) else {}
    ts = _event_ts(events[-1])
    terminal_ts = next((_event_ts(e) for e in reversed(events) if event_state_claim(e) == state), None) if state in TERMINAL_STATES else None
    correlation = {**_correlation(events, plan), "continuity": _correlation_continuity(events, plan)}
    execution = _execution(events)
    initiator = _initiator(events)
    retry = _retry_lineage(events, run_id, plan_runs.get(plan_id or "", []))
    evidence_refs = _refs(events, "evidence_refs", "evidenceRefs")
    proof_refs = _refs(events, "proof_refs", "proofRefs")
    report_refs = _refs(events, "report_refs", "reportRefs")
    truth_refs = _refs(events, "truth_refs", "truthRefs")
    watchtower_refs = _refs(events, "watchtower_refs", "watchtowerRefs")
    loo_refs = _refs(events, "loo_refs", "looRefs")
    failed = state in {"FAILED", "TIMED_OUT"}
    artifacts, evidence = _artifact_view(run_id, events, verify=verify, metadata=artifact_metadata)

    run = {
        "run_id": run_id,
        "work_order_id": _str(events, "work_order_id", "workOrderId", "requestId", default=(plan or {}).get("requestId") or NOT_CAPTURED),
        "tenant_id": _identifier(events, "tenant_id", "tenantId"),
        "organization_id": _identifier(events, "organization_id", "organizationId"),
        "initiator": initiator,
        "agent": {
            "agent_id": _str(events, "agentId", "agent_id", default=agent.get("agentId") or NOT_CAPTURED),
            "name": _str(events, "agentName", "agent_name", default=agent.get("name") or NOT_CAPTURED),
            "layer": _str(events, "layer", default=agent.get("layer") or NOT_CAPTURED),
            "version": execution["agent_version"],
        },
        "operation": {
            "type": _str(events, "kind", "operation_type", "action"),
            "plan_id": plan_id or (NOT_CAPTURED if not plan_ids else UNKNOWN),
        },
        "approval": _approval(plan, events),
        "policy": {
            "policy_ref": "plan.policy" if isinstance(plan, dict) and isinstance(plan.get("policy"), dict) else NOT_AVAILABLE,
            "gate_decision_refs": _refs(events, "gate_decision_refs", "gateDecisionRefs"),
        },
        "current_state": state,
        "state_derivation": derivation,
        "created_at": _event_ts(events[0]) or NOT_CAPTURED,
        "queued_at": NOT_CAPTURED,
        # Only a recorded start event proves when execution began.
        "started_at": next((_event_ts(e) or NOT_CAPTURED for e in events if event_state_claim(e) == "EXECUTING"), NOT_CAPTURED),
        "completed_at": terminal_ts if state == "COMPLETED" and terminal_ts else NOT_AVAILABLE,
        "failed_at": terminal_ts if failed and terminal_ts else NOT_AVAILABLE,
        "cancelled_at": NOT_AVAILABLE,
        "timed_out_at": terminal_ts if state == "TIMED_OUT" and terminal_ts else NOT_AVAILABLE,
        "execution_lease": _execution_lease(events, state),
        "last_transition_at": ts or NOT_CAPTURED,
        "result": _str(events, "outcome", "result"),
        "failure_code": safe_reason_code(_latest(events, "failure_code", "reason_code"), NOT_CAPTURED) if failed else NOT_AVAILABLE,
        "failure_summary": _str(events, "failure_summary", "message") if failed else NOT_AVAILABLE,
        "execution": execution,
        "provider": execution["provider"],
        "model": execution["model"],
        "adapter": execution["adapter"],
        "correlation": correlation,
        "correlation_id": correlation["id"],
        "retry_lineage": retry,
        "retry_count": retry["retry_count"],
        "parent_run_id": retry["parent_run_id"],
        "evidence_refs": evidence_refs,
        # Execution result (current_state) and evidence durability are separate facts.
        "artifact_refs": artifacts,
        "evidence": evidence,
        "proof_refs": proof_refs,
        "report_refs": report_refs,
        "policy_decision_refs": _refs(events, "policy_decision_refs", "policyDecisionRefs"),
        "watchtower_refs": watchtower_refs,
        "truth_refs": truth_refs,
        "loo_refs": loo_refs,
        "domain_refs": {
            "truth_spine": _domain_ref("Truth Spine", truth_refs),
            "watchtower": _domain_ref("Watchtower", watchtower_refs),
            "loo": _domain_ref("LOO", loo_refs),
            "reporting": {**_domain_ref("Reporting", report_refs), "proof_refs": proof_refs},
        },
        "dependency_run_ids": [r for r in _refs(events, "dependency_run_ids", "dependencyRunIds") if RUN_ID_RE.match(r)],
        "event_count": len(events),
        "source": _source({"record_type": "run_event", "record_origin": _record_origin(events)}),
        "freshness": {"last_updated": ts or NOT_CAPTURED, "captured_at": ts or NOT_CAPTURED, "threshold": "NOT_DEFINED"},
    }
    return sanitize(run)


def _run_from_plan(plan: Dict[str, Any]) -> Dict[str, Any]:
    derivation = derive_plan_state(plan)
    agent = plan.get("agent") if isinstance(plan.get("agent"), dict) else {}
    plan_id = str(plan.get("planId") or NOT_CAPTURED)
    created_at = str(plan.get("createdAt") or plan.get("created_at") or NOT_CAPTURED)
    correlation = {**_correlation([], plan), "continuity": _correlation_continuity([], plan)}
    not_run = {"retry_supported": False, "retrying_state": "DEFERRED", "retry_count": NOT_CAPTURED,
               "parent_run_id": NOT_CAPTURED, "root_run_id": NOT_CAPTURED, "retry_of_run_id": NOT_CAPTURED, "same_plan_run_ids": []}
    return sanitize({
        "run_id": NOT_AVAILABLE,
        "work_order_id": plan.get("requestId") or NOT_CAPTURED,
        "tenant_id": NOT_CAPTURED,
        "organization_id": NOT_CAPTURED,
        # A plan has no run initiator yet; its verified creator is under `created_by`.
        "initiator": {**_identity([], "initiator"), "entry_point": "fabric.plan.create" if plan.get("createdAt") else NOT_CAPTURED},
        "agent": {"agent_id": agent.get("agentId") or NOT_CAPTURED, "name": agent.get("name") or NOT_CAPTURED, "layer": agent.get("layer") or NOT_CAPTURED, "version": NOT_CAPTURED},
        "operation": {"type": "plan", "plan_id": plan_id},
        "approval": _approval(plan),
        "created_by": _plan_creator(plan),
        "policy": {"policy_ref": "plan.policy" if isinstance(plan.get("policy"), dict) else NOT_AVAILABLE, "gate_decision_refs": []},
        "current_state": derivation["state"],
        "state_derivation": derivation,
        "created_at": created_at,
        "queued_at": NOT_AVAILABLE,
        "started_at": NOT_AVAILABLE,
        "completed_at": NOT_AVAILABLE,
        "failed_at": NOT_AVAILABLE,
        "cancelled_at": NOT_AVAILABLE,
        "timed_out_at": NOT_AVAILABLE,
        "execution_lease": {"status": NOT_AVAILABLE, "lease_expires_at": NOT_AVAILABLE, "lease_seconds": NOT_AVAILABLE,
                            "heartbeat": "NOT_SUPPORTED", "orphan_recorded": False, "evaluated_at": _now_iso()},
        "last_transition_at": plan.get("statusUpdatedAt") or plan.get("executedAt") or created_at,
        "result": NOT_AVAILABLE,
        "failure_code": NOT_AVAILABLE,
        "failure_summary": NOT_AVAILABLE,
        "execution": {"provider": NOT_CAPTURED, "model": NOT_CAPTURED, "adapter": NOT_CAPTURED, "adapters": [], "agent_version": NOT_CAPTURED, "model_invoked": NOT_CAPTURED},
        "provider": NOT_CAPTURED,
        "model": NOT_CAPTURED,
        "adapter": NOT_CAPTURED,
        "correlation": correlation,
        "correlation_id": correlation["id"],
        "retry_lineage": not_run,
        "retry_count": NOT_CAPTURED,
        "parent_run_id": NOT_CAPTURED,
        "evidence_refs": [],
        "artifact_refs": [],
        "evidence": {"status": "NONE", "artifact_count": 0, "durable_count": 0, "verified": False, "storage": NOT_APPLICABLE},
        "proof_refs": [],
        "report_refs": [],
        "policy_decision_refs": [],
        "watchtower_refs": [],
        "truth_refs": [],
        "loo_refs": [],
        "domain_refs": {
            "truth_spine": _domain_ref("Truth Spine", []),
            "watchtower": _domain_ref("Watchtower", []),
            "loo": _domain_ref("LOO", []),
            "reporting": {**_domain_ref("Reporting", []), "proof_refs": []},
        },
        "dependency_run_ids": [],
        "event_count": 0,
        "source": _source({"record_type": "plan", "record_origin": plan.get("_record_origin") or NOT_CAPTURED}),
        "freshness": {"last_updated": created_at, "captured_at": created_at, "threshold": "NOT_DEFINED"},
    })


def _snapshot() -> Tuple[Dict[str, List[Dict[str, Any]]], Dict[str, List[str]], Dict[str, int]]:
    events, malformed = _read_events()
    groups = _group_events(events)
    attributed = sum(len(v) for v in groups.values())
    quality = {"malformed_event_count": malformed, "unattributed_event_count": len(events) - attributed}
    return groups, _plan_run_index(groups), quality


def _runs(limit: int = 25) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
    groups, plan_runs, quality = _snapshot()
    ordered = sorted(groups.items(), key=lambda item: (_event_ts(item[1][-1]) or "", item[0]), reverse=True)
    metadata = None
    if run_authority.is_postgres():
        from fabric import run_authority_pg

        metadata = run_authority_pg.artifact_metadata_for_runs([rid for rid, _ in ordered])  # one query, no bodies
    runs = [_run_from_events(rid, evs, plan_runs, artifact_metadata=metadata) for rid, evs in ordered]
    for plan in _recent_plans(limit):
        # Plans without a run are still live operational intent.
        if plan.get("planId") in plan_runs:
            continue
        runs.append(_run_from_plan(plan))
    return runs[: max(1, min(int(limit or 25), 100))], quality


def live_runs_projection(limit: int = 25) -> Dict[str, Any]:
    runs, quality = _runs(limit)
    updated = next((r.get("freshness", {}).get("last_updated") for r in runs if isinstance(r.get("freshness"), dict)), NOT_CAPTURED)
    return sanitize({
        "source": _source(quality),
        "state": "AVAILABLE",
        "runs": runs,
        "count": len(runs),
        "lifecycle": {"supported_states": sorted(SUPPORTED_STATES), "deferred_states": list(DEFERRED_STATES)},
        "execution_safety": _execution_safety(),
        "freshness": {"last_updated": updated, "captured_at": _now_iso(), "threshold": "NOT_DEFINED"},
    })


def run_detail_projection(run_id: str) -> Dict[str, Any]:
    rid = _safe_run_id(run_id)
    groups, plan_runs, _ = _snapshot()
    if rid in groups:
        return sanitize({"source": _source(), "state": "AVAILABLE", "run": _run_from_events(rid, groups[rid], plan_runs, verify=True), "execution_safety": _execution_safety()})
    return sanitize({"source": _source(), "state": "NOT_AVAILABLE", "reason_code": "RUN_NOT_FOUND", "run_id": rid})


def run_timeline_projection(run_id: str) -> Dict[str, Any]:
    rid = _safe_run_id(run_id)
    groups, _, _ = _snapshot()
    events = groups.get(rid, [])
    entries: List[Dict[str, Any]] = []
    if events:
        plan_ids = {p for p in (_event_plan_id(e) for e in events) if p}
        plan = _load_plan(next(iter(plan_ids))) if len(plan_ids) == 1 else None
        correlation_id = _correlation(events, plan)["id"]
        entries.extend(_plan_events(plan, rid))
        entries.extend(_run_event_entry(e, rid, i, correlation_id) for i, e in enumerate(events))
        entries.sort(key=lambda e: e["occurred_at"] if e["occurred_at"] != NOT_CAPTURED else "")
    return sanitize({"source": _source({"record_type": "run_timeline"}), "state": "AVAILABLE" if entries else "NOT_AVAILABLE", "run_id": rid, "events": entries})


def run_evidence_projection(run_id: str) -> Dict[str, Any]:
    detail = run_detail_projection(run_id)
    if detail.get("state") != "AVAILABLE":
        return detail
    run = detail["run"]
    evidence = {
        "evidence_refs": run.get("evidence_refs") or [],
        "artifact_refs": run.get("artifact_refs") or [],
        "evidence_status": run.get("evidence") or {},
        "proof_refs": run.get("proof_refs") or [],
        "report_refs": run.get("report_refs") or [],
        "truth_refs": run.get("truth_refs") or [],
        "watchtower_refs": run.get("watchtower_refs") or [],
        "loo_refs": run.get("loo_refs") or [],
        "domain_refs": run.get("domain_refs") or {},
        "counts": {
            "evidence": len(run.get("evidence_refs") or []),
            "artifacts": len(run.get("artifact_refs") or []),
            "proofs": len(run.get("proof_refs") or []),
            "reports": len(run.get("report_refs") or []),
        },
    }
    return sanitize({"source": _source({"record_type": "run_evidence"}), "state": "AVAILABLE", "run_id": run["run_id"], "evidence": evidence})


def run_dependencies_projection(run_id: str) -> Dict[str, Any]:
    detail = run_detail_projection(run_id)
    if detail.get("state") != "AVAILABLE":
        return detail
    run = detail["run"]
    return sanitize({
        "source": _source({"record_type": "run_dependencies"}),
        "state": "AVAILABLE",
        "run_id": run["run_id"],
        "dependency_run_ids": run.get("dependency_run_ids") or [],
        "parent_run_id": run.get("parent_run_id") or NOT_CAPTURED,
        "retry_lineage": run.get("retry_lineage") or {},
        "correlation_id": run.get("correlation_id") or NOT_CAPTURED,
    })


def artifact_storage_projection() -> Dict[str, Any]:
    """AFCC-3 Phase 6: artifact storage readiness. Side-effect free: a catalog
    lookup only (no writes, no artifact bodies read, no verification run)."""
    if not run_authority.is_postgres():
        return sanitize({
            "source": _source({"record_type": "artifact_storage"}),
            "state": "NOT_CONFIGURED",
            "reason_code": "SHARED_ARTIFACT_STORE_NOT_ACTIVE",
            "artifact_storage": "REPLICA_LOCAL_FILE",
            "durable": False,
            "check": "NONE",
            "checked_at": _now_iso(),
        })
    from fabric import run_authority_pg

    health = run_authority_pg.storage_health()
    return sanitize({
        "source": _source({"record_type": "artifact_storage"}),
        "state": health["state"],
        "reason_code": health["reason_code"],
        "artifact_storage": "FABRIC_RUN_ARTIFACTS",
        "durable": health["state"] == "AVAILABLE",
        "check": "READ_ONLY_CATALOG_LOOKUP",
        "checked_at": _now_iso(),
    })


def run_artifact_projection(run_id: str, artifact_id: str) -> Dict[str, Any]:
    """AFCC-3 Phase 7: one artifact of one run, for the read-only Live Operations
    viewer. The artifact must be referenced by that run's own events (an id alone
    reveals nothing). The body is returned only when it verifies against both its
    stored digest and the run's recorded digest; legacy replica-local bodies are
    returned only outside production and marked untrusted. Bodies pass the
    sanitizer; no path, storage key or credential is included."""
    rid = _safe_run_id(run_id)
    aid = str(artifact_id or "").strip()
    if not is_valid_id(aid):
        raise ValueError("INVALID_ARTIFACT_ID")
    groups, _, _ = _snapshot()
    events = groups.get(rid, [])
    views, _ = _artifact_view(rid, events, verify=True) if events else ([], {})
    view = next((v for v in views if v["artifact_id"] == aid), None)
    base = {"source": _source({"record_type": "run_artifact", "record_origin": _record_origin(events) if events else NOT_CAPTURED}), "run_id": rid, "artifact_id": aid}
    if view is None:
        return sanitize({**base, "state": "NOT_AVAILABLE", "reason_code": "ARTIFACT_NOT_IN_RUN"})
    metadata = {k: view[k] for k in ("artifact_id", "sha256", "canonical_ref", "type", "size", "created_at", "completeness", "storage_state", "verification_state", "durable")}
    body: Any = None
    trust = "NOT_AVAILABLE"
    if view["storage_state"] == "STORED" and view["verification_state"] == "VERIFIED":
        from fabric import run_authority_pg

        row = run_authority_pg.get_artifact(aid)
        if row is not None and row["run_id"] == rid and run_authority_pg.verify_artifact_row(row, expected_hash=view["sha256"]) == "VERIFIED":
            body, trust = json.loads(row["body_canonical"]), "VERIFIED"
        else:
            trust = "INTEGRITY_FAILED"
    elif view["verification_state"] == "HASH_MISMATCH":
        trust = "INTEGRITY_FAILED"  # body withheld
    elif view["storage_state"] in {"LEGACY_REPLICA_LOCAL", "REPLICA_LOCAL"}:
        trust = "NOT_TRUSTED_REPLICA_LOCAL"
        from auth.config import is_production

        if not is_production():
            path = _artifacts_dir() / f"{aid}.json"
            try:
                body = json.loads(path.read_text(encoding="utf-8")) if path.is_file() else None
            except (OSError, ValueError):
                body = None
    return sanitize({**base, "state": "AVAILABLE", "artifact": metadata, "trust": trust, "body": body,
                     "body_available": body is not None})


def _artifacts_dir() -> Path:
    import routers.runs_routes as runs_routes

    return runs_routes.ARTIFACTS_DIR
