from __future__ import annotations

import json
import os
import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from auth.audit import record_auth_event
from services.reporting_lineage_service import find_lineage_entry
from services.operational_telemetry import emit_operational_telemetry


SERVICE_ROOT = Path(__file__).resolve().parents[1]
OPERATIONAL_DB_DIR = Path(os.getenv("SHF_OPERATIONAL_DB_DIR", str(SERVICE_ROOT / "db" / "reporting")))
OPERATIONAL_EVENTS_PATH = OPERATIONAL_DB_DIR / "operational_events.jsonl"
STORAGE_BACKEND = "jsonl_repository_abstraction"
STORAGE_DURABILITY_CLASS = "development_only"
PRODUCTION_DURABILITY_APPROVED = False
DEPLOYMENT_REQUIREMENT = (
    "JSONL is a repository abstraction/development implementation and is not approved production persistence; "
    "production deployment requires an owner-approved durable database boundary, backup/restore policy, retention controls, and monitoring."
)

SUPPORTED_EVENT_TYPES = {
    "lesson.started",
    "lesson.completed",
    "assessment.submitted",
    "assessment.completed",
    "reflection.submitted",
    "course.started",
    "course.completed",
    "credential.earned",
    "portfolio.artifact.created",
    "referral.created",
    "report.created",
    "grant_binder.created",
    "funding_commitment.committed",
    "employment_started.verified",
    "government_assurance.truth_determination.accepted",
}

SUPPORTED_SUBJECT_TYPES = {"student", "lesson", "assessment", "course", "credential", "portfolio_artifact", "referral", "report", "grant_binder", "funding_commitment", "workforce_employment_outcome", "gpa_truth_determination"}


class OperationalEventError(ValueError):
    def __init__(self, reason: str, detail: Dict[str, Any] | None = None):
        super().__init__(reason)
        self.reason = reason
        self.detail = detail or {}


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _ensure_store() -> None:
    OPERATIONAL_DB_DIR.mkdir(parents=True, exist_ok=True)
    if not OPERATIONAL_EVENTS_PATH.exists():
        OPERATIONAL_EVENTS_PATH.write_text("", encoding="utf-8")


def _read_events() -> List[Dict[str, Any]]:
    _ensure_store()
    events: List[Dict[str, Any]] = []
    for line in OPERATIONAL_EVENTS_PATH.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(event, dict):
            events.append(event)
    return events


def _append_event(event: Dict[str, Any]) -> None:
    _ensure_store()
    with OPERATIONAL_EVENTS_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(event, sort_keys=True) + "\n")


def list_operational_events(actor: Any) -> List[Dict[str, Any]]:
    tenant_id, organization_id = _scope_from_actor(actor)
    return [
        event
        for event in _read_events()
        if event.get("tenant_id") == tenant_id and event.get("organization_id") == organization_id
    ]


def get_operational_event_for_actor(event_id: str, actor: Any) -> Dict[str, Any] | None:
    event_id = str(event_id or "").strip()
    if not event_id:
        return None
    for event in list_operational_events(actor):
        if event.get("event_id") == event_id:
            return event
    return None


def ingest_operational_event(payload: Dict[str, Any], actor: Any, correlation_id: str | None = None) -> Dict[str, Any]:
    tenant_id, organization_id = _scope_from_actor(actor)
    try:
        validate_operational_event(payload, actor)
    except OperationalEventError as exc:
        emit_operational_telemetry(event_name="operational_event_rejected", severity="INFO", component="agent_fabric", category="INGESTION", outcome="EXPECTED_DOMAIN_REJECTION", metadata={"reason": exc.reason})
        raise

    producer_id = str(payload["producer_id"]).strip()
    event_type = str(payload["event_type"]).strip()
    idempotency_key = str(payload["idempotency_key"]).strip()
    existing = _find_duplicate(tenant_id, organization_id, producer_id, idempotency_key)
    if existing:
        emit_operational_telemetry(event_name="operational_event_idempotent_replay", severity="INFO", component="agent_fabric", category="INGESTION", outcome="SUCCESS", metadata={"reason": "existing_idempotency_key"})
        return {"event": existing, "idempotent_replay": True}

    received_at = now_utc()
    event = {
        "event_id": f"op_evt_{secrets.token_hex(12)}",
        "event_type": event_type,
        "schema_version": str(payload.get("schema_version") or "1.0"),
        "producer_id": producer_id,
        "subject_type": str(payload["subject_type"]).strip(),
        "subject_id": str(payload["subject_id"]).strip(),
        "tenant_id": tenant_id,
        "organization_id": organization_id,
        "actor_id": str(getattr(actor, "user_id", "")),
        "actor_type": str(getattr(actor, "role", "")),
        "occurred_at": str(payload["occurred_at"]).strip(),
        "received_at": received_at,
        "payload": payload.get("payload") or {},
        "evidence_references": payload.get("evidence_references") or [],
        "idempotency_key": idempotency_key,
        "correlation_id": str(correlation_id or payload.get("correlation_id") or f"corr_{secrets.token_hex(8)}"),
        "data_classification": str(payload.get("data_classification") or "internal").strip(),
        "processing_status": "accepted",
        "retention_policy": _retention_policy_for(producer_id, event_type),
        "storage_backend": STORAGE_BACKEND,
        "storage_durability_class": STORAGE_DURABILITY_CLASS,
        "production_durability_approved": PRODUCTION_DURABILITY_APPROVED,
    }
    try:
        _append_event(event)
    except Exception:
        emit_operational_telemetry(event_name="operational_event_persistence_failed", severity="CRITICAL", component="agent_fabric", category="INGESTION", outcome="SYSTEM_FAILURE", metadata={"reason": "operational_event_write_failed"})
        raise
    emit_operational_telemetry(event_name="operational_event_accepted", severity="INFO", component="agent_fabric", category="INGESTION", outcome="SUCCESS", metadata={"event_class": event_type})
    record_auth_event(
        "shf_operational_event_created",
        user_id=event["actor_id"],
        role=event["actor_type"],
        result="allowed",
        metadata={
            "event_id": event["event_id"],
            "event_type": event["event_type"],
            "producer_id": event["producer_id"],
            "tenant_id": event["tenant_id"],
            "organization_id": event["organization_id"],
            "correlation_id": event["correlation_id"],
        },
    )
    return {"event": event, "idempotent_replay": False}


def validate_operational_event(payload: Dict[str, Any], actor: Any) -> None:
    """Run the existing event/binding checks without changing persistence."""
    _validate_payload(payload)
    validators = {
        "shs.reporting": _validate_report_created_payload,
        "shs.grant_binder": _validate_grant_binder_created_payload,
        "shs.exchange": _validate_funding_commitment_committed_payload,
        "shf.workforce": _validate_employment_started_verified_payload,
        "shs.government_assurance": _validate_government_assurance_truth_determination_payload,
    }
    validator = validators.get(str(payload.get("producer_id") or "").strip())
    if validator:
        validator(payload, actor)


def storage_status() -> Dict[str, Any]:
    return {
        "backend": STORAGE_BACKEND,
        "durability_class": STORAGE_DURABILITY_CLASS,
        "production_ready": False,
        "approved_production_persistence_boundary": PRODUCTION_DURABILITY_APPROVED,
        "path": str(OPERATIONAL_EVENTS_PATH),
        "append_oriented": True,
        "idempotency_scope": "tenant_id + organization_id + producer_id + idempotency_key",
        "deployment_requirement": DEPLOYMENT_REQUIREMENT,
    }


def _scope_from_actor(actor: Any) -> tuple[str, str]:
    organization_id = getattr(actor, "organization_id", None)
    if not organization_id:
        raise OperationalEventError("actor_missing_organization_scope")
    tenant_id = f"tenant:{organization_id}"
    return tenant_id, str(organization_id)


def _find_duplicate(tenant_id: str, organization_id: str, producer_id: str, idempotency_key: str) -> Dict[str, Any] | None:
    for event in _read_events():
        if (
            event.get("tenant_id") == tenant_id
            and event.get("organization_id") == organization_id
            and event.get("producer_id") == producer_id
            and event.get("idempotency_key") == idempotency_key
        ):
            return event
    return None


def _validate_payload(payload: Dict[str, Any]) -> None:
    for field in ("event_type", "producer_id", "subject_type", "subject_id", "occurred_at", "idempotency_key"):
        if not str(payload.get(field) or "").strip():
            raise OperationalEventError("invalid_event_schema", {"field": field})
    if payload["event_type"] not in SUPPORTED_EVENT_TYPES:
        raise OperationalEventError("unsupported_event_type", {"event_type": payload["event_type"]})
    producer_id = str(payload["producer_id"]).strip()
    event_type = str(payload["event_type"]).strip()
    if event_type == "report.created" and producer_id != "shs.reporting":
        raise OperationalEventError("invalid_producer_event_binding", {"producer_id": producer_id, "event_type": event_type})
    if producer_id == "shs.reporting" and event_type != "report.created":
        raise OperationalEventError("invalid_producer_event_binding", {"producer_id": producer_id, "event_type": event_type})
    if event_type == "grant_binder.created" and producer_id != "shs.grant_binder":
        raise OperationalEventError("invalid_producer_event_binding", {"producer_id": producer_id, "event_type": event_type})
    if producer_id == "shs.grant_binder" and event_type != "grant_binder.created":
        raise OperationalEventError("invalid_producer_event_binding", {"producer_id": producer_id, "event_type": event_type})
    if event_type == "funding_commitment.committed" and producer_id != "shs.exchange":
        raise OperationalEventError("invalid_producer_event_binding", {"producer_id": producer_id, "event_type": event_type})
    if producer_id == "shs.exchange" and event_type != "funding_commitment.committed":
        raise OperationalEventError("invalid_producer_event_binding", {"producer_id": producer_id, "event_type": event_type})
    if event_type == "employment_started.verified" and producer_id != "shf.workforce":
        raise OperationalEventError("invalid_producer_event_binding", {"producer_id": producer_id, "event_type": event_type})
    if producer_id == "shf.workforce" and event_type != "employment_started.verified":
        raise OperationalEventError("invalid_producer_event_binding", {"producer_id": producer_id, "event_type": event_type})
    if event_type == "government_assurance.truth_determination.accepted" and producer_id != "shs.government_assurance":
        raise OperationalEventError("invalid_producer_event_binding", {"producer_id": producer_id, "event_type": event_type})
    if producer_id == "shs.government_assurance" and event_type != "government_assurance.truth_determination.accepted":
        raise OperationalEventError("invalid_producer_event_binding", {"producer_id": producer_id, "event_type": event_type})
    if payload["subject_type"] not in SUPPORTED_SUBJECT_TYPES:
        raise OperationalEventError("unsupported_subject_type", {"subject_type": payload["subject_type"]})
    if payload.get("payload") is not None and not isinstance(payload.get("payload"), dict):
        raise OperationalEventError("invalid_event_schema", {"field": "payload"})
    if payload.get("evidence_references") is not None and not isinstance(payload.get("evidence_references"), list):
        raise OperationalEventError("invalid_event_schema", {"field": "evidence_references"})


def _validate_report_created_payload(payload: Dict[str, Any], actor: Any) -> None:
    if str(getattr(actor, "principal_type", "")) != "service" or str(getattr(actor, "service_id", "")) != "service:shs-api":
        raise OperationalEventError("service_identity_required")
    if str(payload.get("schema_version") or "") != "v1":
        raise OperationalEventError("invalid_event_schema", {"field": "schema_version"})
    if str(payload.get("subject_type") or "") != "report":
        raise OperationalEventError("invalid_event_schema", {"field": "subject_type"})
    event_payload = payload.get("payload")
    if not isinstance(event_payload, dict) or set(event_payload) != {"report_id", "revision_id", "report_version", "lifecycle_status"}:
        raise OperationalEventError("invalid_report_created_payload")
    if str(event_payload.get("report_id") or "") != str(payload.get("subject_id") or ""):
        raise OperationalEventError("invalid_report_created_payload", {"field": "report_id"})
    if not str(event_payload.get("revision_id") or "").strip() or not isinstance(event_payload.get("report_version"), int):
        raise OperationalEventError("invalid_report_created_payload")
    if event_payload.get("lifecycle_status") != "draft":
        raise OperationalEventError("invalid_report_created_payload", {"field": "lifecycle_status"})
    expected_key = f"report:{payload['subject_id']}:created"
    if str(payload.get("idempotency_key") or "") != expected_key:
        raise OperationalEventError("invalid_report_created_payload", {"field": "idempotency_key"})


def _validate_grant_binder_created_payload(payload: Dict[str, Any], actor: Any) -> None:
    if str(getattr(actor, "principal_type", "")) != "service" or str(getattr(actor, "service_id", "")) != "service:shs-api":
        raise OperationalEventError("service_identity_required")
    if str(payload.get("schema_version") or "") != "v1":
        raise OperationalEventError("invalid_event_schema", {"field": "schema_version"})
    if str(payload.get("subject_type") or "") != "grant_binder":
        raise OperationalEventError("invalid_event_schema", {"field": "subject_type"})
    event_payload = payload.get("payload")
    if not isinstance(event_payload, dict) or set(event_payload) != {"binder_id", "lifecycle_status", "version"}:
        raise OperationalEventError("invalid_grant_binder_created_payload")
    if str(event_payload.get("binder_id") or "") != str(payload.get("subject_id") or ""):
        raise OperationalEventError("invalid_grant_binder_created_payload", {"field": "binder_id"})
    if event_payload.get("lifecycle_status") != "draft" or not isinstance(event_payload.get("version"), int) or event_payload.get("version") != 1:
        raise OperationalEventError("invalid_grant_binder_created_payload")
    expected_key = f"grant-binder:{payload['subject_id']}:created"
    if str(payload.get("idempotency_key") or "") != expected_key:
        raise OperationalEventError("invalid_grant_binder_created_payload", {"field": "idempotency_key"})


def _validate_funding_commitment_committed_payload(payload: Dict[str, Any], actor: Any) -> None:
    if str(getattr(actor, "principal_type", "")) != "service" or str(getattr(actor, "service_id", "")) != "service:shs-api":
        raise OperationalEventError("service_identity_required")
    if str(payload.get("schema_version") or "") != "v1":
        raise OperationalEventError("invalid_event_schema", {"field": "schema_version"})
    if str(payload.get("subject_type") or "") != "funding_commitment":
        raise OperationalEventError("invalid_event_schema", {"field": "subject_type"})
    event_payload = payload.get("payload")
    required = {"commitment_id", "recipient_organization_id", "amount_minor", "currency", "lifecycle_status", "version"}
    if not isinstance(event_payload, dict) or set(event_payload) != required:
        raise OperationalEventError("invalid_funding_commitment_committed_payload")
    if str(event_payload.get("commitment_id") or "") != str(payload.get("subject_id") or ""):
        raise OperationalEventError("invalid_funding_commitment_committed_payload", {"field": "commitment_id"})
    if not str(event_payload.get("recipient_organization_id") or "").strip():
        raise OperationalEventError("invalid_funding_commitment_committed_payload", {"field": "recipient_organization_id"})
    if not isinstance(event_payload.get("amount_minor"), int) or event_payload.get("amount_minor") <= 0:
        raise OperationalEventError("invalid_funding_commitment_committed_payload", {"field": "amount_minor"})
    if not isinstance(event_payload.get("currency"), str) or not event_payload["currency"].isalpha() or len(event_payload["currency"]) != 3 or event_payload["currency"] != event_payload["currency"].upper():
        raise OperationalEventError("invalid_funding_commitment_committed_payload", {"field": "currency"})
    if event_payload.get("lifecycle_status") != "committed" or not isinstance(event_payload.get("version"), int) or event_payload.get("version") < 1:
        raise OperationalEventError("invalid_funding_commitment_committed_payload")
    expected_key = f"exchange-funding-commitment:{payload['subject_id']}:committed"
    if str(payload.get("idempotency_key") or "") != expected_key:
        raise OperationalEventError("invalid_funding_commitment_committed_payload", {"field": "idempotency_key"})


def _validate_employment_started_verified_payload(payload: Dict[str, Any], actor: Any) -> None:
    if str(getattr(actor, "principal_type", "")) != "service" or str(getattr(actor, "service_id", "")) != "service:shs-api":
        raise OperationalEventError("service_identity_required")
    if str(payload.get("schema_version") or "") != "v1":
        raise OperationalEventError("invalid_event_schema", {"field": "schema_version"})
    if str(payload.get("subject_type") or "") != "workforce_employment_outcome":
        raise OperationalEventError("invalid_event_schema", {"field": "subject_type"})
    event_payload = payload.get("payload")
    required = {"outcome_id", "participant_ref", "outcome_type", "employment_started_at", "verification_source_type", "lifecycle_status", "version"}
    allowed = required | {"program_id"}
    if not isinstance(event_payload, dict) or not set(event_payload).issubset(allowed) or not required.issubset(event_payload):
        raise OperationalEventError("invalid_employment_started_verified_payload")
    if str(event_payload.get("outcome_id") or "") != str(payload.get("subject_id") or ""):
        raise OperationalEventError("invalid_employment_started_verified_payload", {"field": "outcome_id"})
    if not str(event_payload.get("participant_ref") or "").strip():
        raise OperationalEventError("invalid_employment_started_verified_payload", {"field": "participant_ref"})
    if event_payload.get("outcome_type") != "EMPLOYMENT_STARTED" or event_payload.get("lifecycle_status") != "verified":
        raise OperationalEventError("invalid_employment_started_verified_payload")
    if not isinstance(event_payload.get("employment_started_at"), str) or not str(event_payload["employment_started_at"]).strip():
        raise OperationalEventError("invalid_employment_started_verified_payload", {"field": "employment_started_at"})
    strong_sources = {"EMPLOYER_CONFIRMATION", "OFFICIAL_EMPLOYER_RECORD", "PAYROLL_OR_EMPLOYMENT_DOCUMENT", "EXTERNAL_SYSTEM_CONFIRMATION"}
    if event_payload.get("verification_source_type") not in strong_sources:
        raise OperationalEventError("invalid_employment_started_verified_payload", {"field": "verification_source_type"})
    if not isinstance(event_payload.get("version"), int) or event_payload.get("version") < 1:
        raise OperationalEventError("invalid_employment_started_verified_payload", {"field": "version"})
    expected_key = f"workforce-employment-outcome:{payload['subject_id']}:verified"
    if str(payload.get("idempotency_key") or "") != expected_key:
        raise OperationalEventError("invalid_employment_started_verified_payload", {"field": "idempotency_key"})


def _validate_government_assurance_truth_determination_payload(payload: Dict[str, Any], actor: Any) -> None:
    if str(getattr(actor, "principal_type", "")) != "service" or str(getattr(actor, "service_id", "")) != "service:shs-api":
        raise OperationalEventError("service_identity_required")
    if str(payload.get("schema_version") or "") != "v1" or str(payload.get("subject_type") or "") != "gpa_truth_determination":
        raise OperationalEventError("invalid_event_schema")
    event_payload = payload.get("payload")
    required = {"determination_id", "truth_fact_id", "claim_reference", "verification_reference", "provenance_reference", "truth_spine_authority", "truth_spine_status", "lifecycle_status"}
    if not isinstance(event_payload, dict) or set(event_payload) != required:
        raise OperationalEventError("invalid_government_assurance_truth_determination_payload")
    if str(event_payload.get("determination_id") or "") != str(payload.get("subject_id") or ""):
        raise OperationalEventError("invalid_government_assurance_truth_determination_payload", {"field": "determination_id"})
    if event_payload.get("truth_spine_authority") != "shs-truth-spine-v1" or event_payload.get("truth_spine_status") != "PENDING_TRUTH_SPINE_INGESTION" or event_payload.get("lifecycle_status") != "accepted":
        raise OperationalEventError("invalid_government_assurance_truth_determination_payload")
    expected_key = f"gpa-truth-determination:{payload['subject_id']}:accepted"
    if str(payload.get("idempotency_key") or "") != expected_key:
        raise OperationalEventError("invalid_government_assurance_truth_determination_payload", {"field": "idempotency_key"})


def _retention_policy_for(producer_id: str, event_type: str) -> str:
    for entry in (
        find_lineage_entry("lineage.curriculum.lesson.completed.v1"),
        find_lineage_entry("lineage.curriculum.assessment.completed.v1"),
        find_lineage_entry("lineage.curriculum.reflection.submitted.v1"),
        find_lineage_entry("lineage.hub.referral.created.v1"),
        find_lineage_entry("lineage.shs.report.created.v1"),
        find_lineage_entry("lineage.shs.grant_binder.created.v1"),
        find_lineage_entry("lineage.shs.exchange.funding_commitment.committed.v1"),
        find_lineage_entry("lineage.shf.workforce.employment_started.verified.v1"),
        find_lineage_entry("lineage.shs.government_assurance.truth_determination.accepted.v1"),
    ):
        if not entry:
            continue
        if entry["producer_id"] == producer_id and entry["producer_event_type"] == event_type:
            return str(entry["retention_policy"])
    return "operational_event_retention_required"
