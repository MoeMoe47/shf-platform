from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from auth.audit import record_auth_event
from auth.permissions import TRUTH_CLAIM_CREATE, TRUTH_SOURCE_CREATE, has_permission
from services import operational_event_service, truth_spine_service
from services import truth_spine_postgres_repository as durable_repo
from services.reporting_lineage_service import ALLOWED_TRUTH_ELIGIBILITY, LineageRegistryError, find_lineage_for_event


SERVICE_ROOT = Path(__file__).resolve().parents[1]
EVIDENCE_DB_DIR = Path(os.getenv("SHF_EVIDENCE_DB_DIR", str(SERVICE_ROOT / "db" / "reporting")))
EVIDENCE_PATH = EVIDENCE_DB_DIR / "evidence.jsonl"
PROJECTION_RESULTS_PATH = EVIDENCE_DB_DIR / "truth_projection_results.jsonl"
EVIDENCE_STORAGE_BACKEND = "postgres_truth_spine_records" if durable_repo.is_postgres_mode() else "jsonl_repository_abstraction"
EVIDENCE_STORAGE_DURABILITY_CLASS = "durable_append_only" if durable_repo.is_postgres_mode() else "development_only"
EVIDENCE_PRODUCTION_DURABILITY_APPROVED = durable_repo.is_postgres_mode()
EVIDENCE_DEPLOYMENT_REQUIREMENT = (
    "PostgreSQL Truth Spine persistence is selected; production deployment still requires retention controls, backup/restore, and monitoring."
    if durable_repo.is_postgres_mode()
    else
    "Evidence JSONL is a repository abstraction/development implementation and is not approved production persistence; "
    "production deployment requires an owner-approved durable evidence store, retention controls, backup/restore, and monitoring."
)

TRUTH_PROJECTABLE_ELIGIBILITY = "TRUTH_ELIGIBLE"
NON_PROJECTABLE_ELIGIBILITIES = {
    "EVIDENCE_ONLY",
    "OPERATIONAL_ONLY",
    "SENSITIVE_RESTRICTED",
    "AGGREGATE_ONLY",
    "PUBLICATION_ELIGIBLE",
    "NOT_APPLICABLE",
}
REQUIRED_EVENT_FIELDS = (
    "event_id",
    "event_type",
    "schema_version",
    "producer_id",
    "subject_type",
    "subject_id",
    "tenant_id",
    "organization_id",
    "actor_id",
    "occurred_at",
    "payload",
    "correlation_id",
)


class ProjectionError(Exception):
    def __init__(self, reason: str, status_code: int = 409, retryable: bool = False):
        super().__init__(reason)
        self.reason = reason
        self.status_code = status_code
        self.retryable = retryable


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _ensure_store() -> None:
    if durable_repo.is_postgres_mode():
        return
    EVIDENCE_DB_DIR.mkdir(parents=True, exist_ok=True)
    for path in (EVIDENCE_PATH, PROJECTION_RESULTS_PATH):
        if not path.exists():
            path.write_text("", encoding="utf-8")


def _read_jsonl(path: Path) -> List[Dict[str, Any]]:
    if durable_repo.is_postgres_mode():
        return durable_repo.read_records(path.name)
    _ensure_store()
    rows: List[Dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            item = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(item, dict):
            rows.append(item)
    return rows


def _append_evidence(record: Dict[str, Any]) -> None:
    if durable_repo.is_postgres_mode():
        durable_repo.append_record(EVIDENCE_PATH.name, record)
        return
    _ensure_store()
    with EVIDENCE_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, sort_keys=True) + "\n")


def _append_projection_result(record: Dict[str, Any]) -> None:
    if durable_repo.is_postgres_mode():
        durable_repo.append_record(PROJECTION_RESULTS_PATH.name, record)
        return
    _ensure_store()
    with PROJECTION_RESULTS_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, sort_keys=True) + "\n")


def list_evidence_for_actor(actor: Any) -> List[Dict[str, Any]]:
    tenant_id, organization_id = operational_event_service._scope_from_actor(actor)
    return [
        record
        for record in _read_jsonl(EVIDENCE_PATH)
        if record.get("tenant_id") == tenant_id and record.get("organization_id") == organization_id
    ]


def list_projection_results_for_actor(actor: Any) -> List[Dict[str, Any]]:
    tenant_id, organization_id = operational_event_service._scope_from_actor(actor)
    return [
        record
        for record in _read_jsonl(PROJECTION_RESULTS_PATH)
        if record.get("tenant_id") == tenant_id and record.get("organization_id") == organization_id
    ]


def project_operational_event_to_truth(event_id: str, actor: Any) -> Dict[str, Any]:
    _require_projection_authority(actor)
    event = operational_event_service.get_operational_event_for_actor(event_id, actor)
    if not event:
        raise ProjectionError("event_not_found", status_code=404)
    _validate_event(event, actor)

    existing = _terminal_projection_for_event(event["event_id"], actor)
    if existing:
        if durable_repo.is_postgres_mode() and existing.get("truth_claim_id") and not existing.get("truth_spine_record_id"):
            identity = durable_repo.find_record_identity(
                "claims", existing["truth_claim_id"], event["tenant_id"], event["organization_id"]
            )
            if identity:
                existing = {**existing, "truth_spine_record_id": identity["record_id"]}
        return {"projection": existing, "idempotent_replay": True}

    lineage = _lineage_for_event(event)
    eligibility = lineage.get("truth_eligibility")
    if eligibility != TRUTH_PROJECTABLE_ELIGIBILITY:
        result = _projection_result(
            event,
            lineage,
            status="not_truth_eligible",
            evidence_id=None,
            truth_source_id=None,
            truth_claim_id=None,
            truth_claim_version=None,
            retryable=False,
        )
        _append_projection_result(result)
        return {"projection": result, "idempotent_replay": False}

    try:
        evidence = _ensure_evidence_record(event, lineage)
    except Exception as exc:
        _record_failure(event, lineage, "evidence_write_failed", retryable=True)
        record_auth_event(
            "shf_truth_projection_failed",
            user_id=str(getattr(actor, "user_id", "")),
            role=str(getattr(actor, "role", "")),
            result="denied",
            metadata={"event_id": event["event_id"], "reason": "evidence_write_failed"},
        )
        raise ProjectionError("evidence_write_failed", status_code=503, retryable=True) from exc

    try:
        source = _ensure_truth_source(evidence, lineage, actor)
        claim = _ensure_truth_claim(event, evidence, lineage, source, actor)
    except Exception as exc:
        _record_failure(event, lineage, "truth_write_failed", retryable=True, evidence_id=evidence["evidence_id"])
        record_auth_event(
            "shf_truth_projection_failed",
            user_id=str(getattr(actor, "user_id", "")),
            role=str(getattr(actor, "role", "")),
            result="denied",
            metadata={"event_id": event["event_id"], "reason": "truth_write_failed"},
        )
        raise ProjectionError("truth_write_failed", status_code=503, retryable=True) from exc

    result = _projection_result(
        event,
        lineage,
        status="projected",
        evidence_id=evidence["evidence_id"],
        truth_source_id=source["source_id"],
        truth_claim_id=claim["claim_id"],
        truth_claim_version=int(claim.get("version") or 1),
        truth_spine_record_id=(
            (durable_repo.find_record_identity("claims", claim["claim_id"], event["tenant_id"], event["organization_id"]) or {}).get("record_id")
            if durable_repo.is_postgres_mode()
            else None
        ),
        retryable=False,
    )
    _append_projection_result(result)
    record_auth_event(
        "shf_truth_projection_created",
        user_id=str(getattr(actor, "user_id", "")),
        role=str(getattr(actor, "role", "")),
        result="allowed",
        metadata={
            "event_id": event["event_id"],
            "evidence_id": evidence["evidence_id"],
            "truth_source_id": source["source_id"],
            "truth_claim_id": claim["claim_id"],
            "lineage_id": lineage["lineage_id"],
            "tenant_id": event["tenant_id"],
            "organization_id": event["organization_id"],
        },
    )
    return {"projection": result, "idempotent_replay": False}


def evidence_storage_status() -> Dict[str, Any]:
    return {
        "backend": EVIDENCE_STORAGE_BACKEND,
        "durability_class": EVIDENCE_STORAGE_DURABILITY_CLASS,
        "production_ready": EVIDENCE_PRODUCTION_DURABILITY_APPROVED,
        "approved_production_persistence_boundary": EVIDENCE_PRODUCTION_DURABILITY_APPROVED,
        "path": str(EVIDENCE_PATH),
        "projection_results_path": str(PROJECTION_RESULTS_PATH),
        "deployment_requirement": EVIDENCE_DEPLOYMENT_REQUIREMENT,
    }


def _require_projection_authority(actor: Any) -> None:
    if (
        getattr(actor, "principal_type", None) == "service"
        and getattr(actor, "service_id", None) == "service:shs-api"
        and getattr(actor, "permission", None) == "shf.event.create"
    ):
        return
    role = getattr(actor, "role", None)
    if not has_permission(role, TRUTH_SOURCE_CREATE) or not has_permission(role, TRUTH_CLAIM_CREATE):
        raise ProjectionError("missing_truth_projection_permission", status_code=403)


def _validate_event(event: Dict[str, Any], actor: Any) -> None:
    for field in REQUIRED_EVENT_FIELDS:
        if field == "payload":
            if not isinstance(event.get(field), dict):
                raise ProjectionError("malformed_event", status_code=422)
            continue
        if not str(event.get(field) or "").strip():
            raise ProjectionError("malformed_event", status_code=422)
    tenant_id, organization_id = operational_event_service._scope_from_actor(actor)
    if event.get("tenant_id") != tenant_id or event.get("organization_id") != organization_id:
        raise ProjectionError("event_not_found", status_code=404)


def _lineage_for_event(event: Dict[str, Any]) -> Dict[str, Any]:
    try:
        lineage = find_lineage_for_event(event.get("producer_id", ""), event.get("event_type", ""))
    except LineageRegistryError as exc:
        raise ProjectionError("lineage_registry_invalid", status_code=409) from exc
    if not lineage:
        raise ProjectionError("lineage_not_found", status_code=409)
    eligibility = lineage.get("truth_eligibility")
    if eligibility not in ALLOWED_TRUTH_ELIGIBILITY:
        raise ProjectionError("lineage_classification_invalid", status_code=409)
    if eligibility == TRUTH_PROJECTABLE_ELIGIBILITY:
        for field in ("truth_claim_type", "truth_subject_mapping", "truth_predicate"):
            if not lineage.get(field):
                raise ProjectionError("lineage_mapping_invalid", status_code=409)
    if eligibility not in NON_PROJECTABLE_ELIGIBILITIES | {TRUTH_PROJECTABLE_ELIGIBILITY}:
        raise ProjectionError("lineage_classification_invalid", status_code=409)
    return lineage


def _terminal_projection_for_event(event_id: str, actor: Any) -> Dict[str, Any] | None:
    for result in reversed(list_projection_results_for_actor(actor)):
        if result.get("operational_event_id") == event_id and result.get("status") in {"projected", "not_truth_eligible"}:
            return result
    return None


def _existing_evidence_for_event(event_id: str) -> Dict[str, Any] | None:
    for evidence in _read_jsonl(EVIDENCE_PATH):
        if evidence.get("operational_event_id") == event_id:
            return evidence
    return None


def _ensure_evidence_record(event: Dict[str, Any], lineage: Dict[str, Any]) -> Dict[str, Any]:
    existing = _existing_evidence_for_event(event["event_id"])
    if existing:
        return existing
    evidence = {
        "evidence_id": _stable_id("evd", event["event_id"]),
        "evidence_type": lineage["evidence_type"],
        "schema_version": "1.0",
        "operational_event_id": event["event_id"],
        "producer_id": event["producer_id"],
        "subject_type": event["subject_type"],
        "subject_id": event["subject_id"],
        "tenant_id": event["tenant_id"],
        "organization_id": event["organization_id"],
        "actor_id": event["actor_id"],
        "occurred_at": event["occurred_at"],
        "recorded_at": now_utc(),
        "payload_digest": _payload_digest(event.get("payload") or {}),
        "metadata": _permitted_evidence_metadata(event, lineage),
        "correlation_id": event["correlation_id"],
        "lineage_id": lineage["lineage_id"],
        "verification_status": "unverified",
        "storage_classification": "truth_spine_owned_durable" if EVIDENCE_PRODUCTION_DURABILITY_APPROVED else "repository_abstraction_development_only",
        "storage_backend": EVIDENCE_STORAGE_BACKEND,
        "storage_durability_class": EVIDENCE_STORAGE_DURABILITY_CLASS,
        "production_durability_approved": EVIDENCE_PRODUCTION_DURABILITY_APPROVED,
    }
    _append_evidence(evidence)
    return evidence


def _ensure_truth_source(evidence: Dict[str, Any], lineage: Dict[str, Any], actor: Any) -> Dict[str, Any]:
    source_id = _stable_id("src", evidence["evidence_id"])
    existing = truth_spine_service.get_source(source_id)
    if existing:
        truth_spine_service.check_organization_access(actor, existing.get("organization_id"))
        return existing
    return truth_spine_service.create_source(
        {
            "source_id": source_id,
            "system_id": "shf",
            "source_type": "operator_record",
            "title": f"{lineage['truth_predicate']} evidence",
            "uri": f"evidence://{evidence['evidence_id']}",
            "evidence_type": evidence["evidence_type"],
            "verification_status": "verified",
            "public_approved": True,
            "actor_id": "browser_supplied_actor_ignored",
            "organization_id": "browser_supplied_scope_ignored",
        },
        actor,
    )


def _ensure_truth_claim(
    event: Dict[str, Any],
    evidence: Dict[str, Any],
    lineage: Dict[str, Any],
    source: Dict[str, Any],
    actor: Any,
) -> Dict[str, Any]:
    claim_id = _stable_id("claim", event["event_id"])
    existing = truth_spine_service.get_claim(claim_id)
    if existing:
        truth_spine_service.check_organization_access(actor, existing.get("organization_id"))
        if source["source_id"] not in existing.get("source_ids", []):
            raise ProjectionError("truth_claim_missing_evidence_source", status_code=409)
        return existing
    claim = truth_spine_service.create_claim(
        {
            "claim_id": claim_id,
            "app_id": "shf",
            "client_id": event["organization_id"],
            "program_id": str((event.get("payload") or {}).get("curriculum") or "curriculum"),
            "claim_type": lineage["truth_claim_type"],
            "claim_text": _claim_text(event, lineage),
            "source_ids": [source["source_id"]],
            "evidence_ids": [evidence["evidence_id"]],
            "subject_id": event["subject_id"],
            "predicate": lineage["truth_predicate"],
            "occurred_at": event["occurred_at"],
            "lineage_id": lineage["lineage_id"],
            "producer_id": event["producer_id"],
            "producer_event_type": event["event_type"],
            "trace_coverage": 100,
            "verification_status": "verified",
            "public_approved": True,
            "approved_by": "browser_supplied_approval_ignored",
            "organization_id": "browser_supplied_scope_ignored",
            "created_by": "browser_supplied_actor_ignored",
        },
        actor,
    )
    if source["source_id"] not in claim.get("source_ids", []):
        raise ProjectionError("truth_claim_missing_evidence_source", status_code=409)
    return claim


def _projection_result(
    event: Dict[str, Any],
    lineage: Dict[str, Any],
    *,
    status: str,
    evidence_id: str | None,
    truth_source_id: str | None,
    truth_claim_id: str | None,
    truth_claim_version: int | None,
    retryable: bool,
    truth_spine_record_id: str | None = None,
) -> Dict[str, Any]:
    trace = {
        "operational_event_id": event["event_id"],
        "evidence_id": evidence_id,
        "truth_source_id": truth_source_id,
        "truth_claim_id": truth_claim_id,
        "truth_claim_version": truth_claim_version,
        "truth_spine_record_id": truth_spine_record_id,
    }
    return {
        "projection_id": _stable_id("proj", event["event_id"]),
        "operational_event_id": event["event_id"],
        "evidence_id": evidence_id,
        "truth_source_id": truth_source_id,
        "truth_claim_id": truth_claim_id,
        "truth_claim_version": truth_claim_version,
        "truth_spine_record_id": truth_spine_record_id,
        "status": status,
        "retryable": retryable,
        "lineage_id": lineage["lineage_id"],
        "truth_eligibility": lineage["truth_eligibility"],
        "tenant_id": event["tenant_id"],
        "organization_id": event["organization_id"],
        "created_at": now_utc(),
        "updated_at": now_utc(),
        "storage_backend": EVIDENCE_STORAGE_BACKEND,
        "storage_durability_class": EVIDENCE_STORAGE_DURABILITY_CLASS,
        "production_durability_approved": EVIDENCE_PRODUCTION_DURABILITY_APPROVED,
        "trace": trace,
    }


def _record_failure(
    event: Dict[str, Any],
    lineage: Dict[str, Any],
    error_code: str,
    *,
    retryable: bool,
    evidence_id: str | None = None,
) -> None:
    result = _projection_result(
        event,
        lineage,
        status="failed",
        evidence_id=evidence_id,
        truth_source_id=None,
        truth_claim_id=None,
        truth_claim_version=None,
        retryable=retryable,
    )
    result["error_code"] = error_code
    _append_projection_result(result)


def _permitted_evidence_metadata(event: Dict[str, Any], lineage: Dict[str, Any]) -> Dict[str, Any]:
    payload = event.get("payload") or {}
    metadata = {
        "payload_field_count": len(payload),
        "evidence_reference_count": len(event.get("evidence_references") or []),
        "data_classification": event.get("data_classification", "internal"),
        "truth_predicate": lineage.get("truth_predicate"),
        "verification_policy": lineage.get("verification_policy"),
        "approval_policy": lineage.get("approval_policy"),
    }
    if event.get("producer_id") == "shs.exchange" and event.get("event_type") == "funding_commitment.committed":
        metadata.update({
            "commitment_id": payload.get("commitment_id"),
            "recipient_organization_id": payload.get("recipient_organization_id"),
            "amount_minor": payload.get("amount_minor"),
            "currency": payload.get("currency"),
            "lifecycle_status": payload.get("lifecycle_status"),
            "version": payload.get("version"),
            "financial_fact_scope": "commitment_only_not_transfer_or_settlement",
        })
    if event.get("producer_id") == "shf.workforce" and event.get("event_type") == "employment_started.verified":
        metadata.update({
            "outcome_id": payload.get("outcome_id"),
            "participant_ref": payload.get("participant_ref"),
            "program_id": payload.get("program_id"),
            "outcome_type": payload.get("outcome_type"),
            "employment_started_at": payload.get("employment_started_at"),
            "verification_source_type": payload.get("verification_source_type"),
            "lifecycle_status": payload.get("lifecycle_status"),
            "version": payload.get("version"),
            "outcome_fact_scope": "employment_started_only_not_retention_wage_or_impact",
        })
    return metadata


def _payload_digest(payload: Dict[str, Any]) -> str:
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _stable_id(prefix: str, value: str) -> str:
    return f"{prefix}_{hashlib.sha256(str(value).encode('utf-8')).hexdigest()[:24]}"


def _claim_text(event: Dict[str, Any], lineage: Dict[str, Any]) -> str:
    return f"{event['subject_type']}:{event['subject_id']} {lineage['truth_predicate']}"
