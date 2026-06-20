from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List


ROOT = Path(__file__).resolve().parents[1]
DB_DIR = ROOT / "db" / "shs_launch_ledger"
RECORDS_PATH = DB_DIR / "launch_records.json"
AUDIT_PATH = DB_DIR / "launch_audit.jsonl"

COMPLETE_STATUSES = {
    "approved",
    "approved_with_exceptions",
    "complete",
    "completed",
    "signed",
    "signed_off",
    "ready",
}

LAUNCH_STATUSES = {
    "draft",
    "qa_review",
    "delivery_ready",
    "launch_ready",
    "launched",
    "blocked",
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _clean(value: Any) -> str:
    return str(value or "").strip()


def _clean_array(value: Any) -> List[str]:
    return [_clean(item) for item in value if _clean(item)] if isinstance(value, list) else []


def _is_object(value: Any) -> bool:
    return isinstance(value, dict)


def _safety_flags() -> Dict[str, bool]:
    return {
        "public_approved": False,
        "mutated_shf_impact_data": False,
        "published_report": False,
    }


def _id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:16]}"


def _ensure_storage() -> None:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    if not RECORDS_PATH.exists():
        RECORDS_PATH.write_text("[]\n", encoding="utf-8")
    if not AUDIT_PATH.exists():
        AUDIT_PATH.touch()


def _read_json_list(path: Path) -> List[Dict[str, Any]]:
    _ensure_storage()
    try:
        parsed = json.loads(path.read_text(encoding="utf-8") or "[]")
    except json.JSONDecodeError:
        return []
    return [item for item in parsed if isinstance(item, dict)] if isinstance(parsed, list) else []


def _write_records(records: List[Dict[str, Any]]) -> None:
    _ensure_storage()
    RECORDS_PATH.write_text(json.dumps(records, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def _is_complete(value: Any) -> bool:
    if not isinstance(value, dict):
        return False
    if value.get("completed") is True or value.get("signed") is True or value.get("approved") is True:
        return True
    return _clean(value.get("status")).lower() in COMPLETE_STATUSES


def _normalize_signoff(input_record: Any, signoff_type: str) -> Dict[str, Any]:
    source = input_record if isinstance(input_record, dict) else {}
    signed_at = _clean(source.get("signed_at") or source.get("completed_at") or source.get("approved_at"))
    return {
        "signoff_id": _clean(source.get("signoff_id")) or _id(f"shs_{signoff_type}_signoff"),
        "type": _clean(source.get("type")) or signoff_type,
        "status": _clean(source.get("status")) or "pending",
        "owner": _clean(source.get("owner") or source.get("approved_by") or source.get("signed_by")),
        "role": _clean(source.get("role")),
        "notes": _clean(source.get("notes")),
        "exceptions": _clean_array(source.get("exceptions")),
        "signed_at": signed_at,
        "created_at": _clean(source.get("created_at")) or _now(),
        "updated_at": _now(),
    }


def _normalize_version(input_record: Any) -> Dict[str, Any]:
    source = input_record if isinstance(input_record, dict) else {}
    return {
        "version_id": _clean(source.get("version_id") or source.get("id")),
        "version_label": _clean(source.get("version_label") or source.get("version")),
        "launch_date": _clean(source.get("launch_date") or source.get("released_at") or source.get("releasedAt")),
        "summary": _clean(source.get("summary")),
        "active_modules": _clean_array(source.get("active_modules") or source.get("activeModules")),
        "active_routes": _clean_array(source.get("active_routes") or source.get("activeRoutes")),
        "included_reports": _clean_array(source.get("included_reports") or source.get("includedReports")),
        "known_exceptions": _clean_array(source.get("known_exceptions") or source.get("knownExceptions")),
        "rollback_note": _clean(source.get("rollback_note") or source.get("rollbackNote")),
        "approval_reference": _clean(source.get("approval_reference") or source.get("approvalReference")),
        "owner": _clean(source.get("owner") or source.get("launch_owner") or source.get("launchOwner")),
        "created_at": _clean(source.get("created_at")) or _now(),
        "updated_at": _now(),
    }


def _normalize_rollback(input_record: Any) -> Dict[str, Any]:
    source = input_record if isinstance(input_record, dict) else {}
    return {
        "owner": _clean(source.get("owner") or source.get("rollback_owner") or source.get("rollbackOwner")),
        "trigger_conditions": _clean_array(source.get("trigger_conditions") or source.get("triggerConditions")),
        "last_known_good_version": _clean(source.get("last_known_good_version") or source.get("lastKnownGoodVersion")),
        "affected_routes": _clean_array(source.get("affected_routes") or source.get("affectedRoutes")),
        "preservation_note": _clean(source.get("preservation_note") or source.get("preservationNote")),
        "client_communication_note": _clean(source.get("client_communication_note") or source.get("clientCommunicationNote")),
        "support_escalation_path": _clean(source.get("support_escalation_path") or source.get("supportEscalationPath")),
        "post_rollback_review_owner": _clean(source.get("post_rollback_review_owner") or source.get("postRollbackReviewOwner")),
    }


def _normalize_clientops(input_record: Any) -> Dict[str, Any]:
    source = input_record if isinstance(input_record, dict) else {}
    return {
        "clientops_record_id": _clean(source.get("clientops_record_id") or source.get("clientOpsRecordId")),
        "owner": _clean(
            source.get("owner")
            or source.get("clientops_owner")
            or source.get("clientOpsOwner")
            or source.get("support_owner")
            or source.get("supportOwner")
        ),
        "status": _clean(source.get("status")) or "pending",
        "activated_at": _clean(source.get("activated_at") or source.get("activatedAt")),
        "support_tier": _clean(source.get("support_tier") or source.get("supportTier")),
        "notes": _clean(source.get("notes")),
    }


def create_signoff_record(input_record: Dict[str, Any] | None = None) -> Dict[str, Any]:
    payload = dict(input_record or {})
    signoff_type = _clean(payload.get("type")) or "signoff"
    signoff = _normalize_signoff(payload, signoff_type)
    return signoff


def create_version_record(input_record: Dict[str, Any] | None = None) -> Dict[str, Any]:
    version = _normalize_version(dict(input_record or {}))
    if not version["version_id"]:
        version["version_id"] = _id("shs_launch_version")
    return version


def _normalize_record(input_record: Dict[str, Any] | None = None) -> Dict[str, Any]:
    source = dict(input_record or {})
    timestamp = _now()
    launch_status = _clean(source.get("launch_status") or source.get("launchStatus")) or "draft"
    if launch_status not in LAUNCH_STATUSES:
        launch_status = "draft"

    record = {
        "ledger_id": _clean(source.get("ledger_id") or source.get("ledgerId")) or _id("shs_launch_ledger"),
        "project_id": _clean(source.get("project_id") or source.get("projectId")),
        "client_name": _clean(source.get("client_name") or source.get("clientName")),
        "project_name": _clean(source.get("project_name") or source.get("projectName")),
        "package_name": _clean(source.get("package_name") or source.get("packageName")),
        "support_tier": _clean(source.get("support_tier") or source.get("supportTier")),
        "launch_status": launch_status,
        "qa_signoff": _normalize_signoff(source.get("qa_signoff") or source.get("qaSignoff"), "qa"),
        "operator_signoff": _normalize_signoff(source.get("operator_signoff") or source.get("operatorSignoff"), "operator"),
        "delivery_signoff": _normalize_signoff(source.get("delivery_signoff") or source.get("deliverySignoff"), "delivery"),
        "client_signoff": _normalize_signoff(source.get("client_signoff") or source.get("clientSignoff"), "client"),
        "version_record": _normalize_version(source.get("version_record") or source.get("versionRecord")),
        "rollback_plan": _normalize_rollback(source.get("rollback_plan") or source.get("rollbackPlan")),
        "clientops_activation": _normalize_clientops(source.get("clientops_activation") or source.get("clientOpsActivation")),
        "created_at": _clean(source.get("created_at") or source.get("createdAt")) or timestamp,
        "updated_at": timestamp,
        "private_beta_only": source.get("private_beta_only") is not False,
    }
    record.update(_safety_flags())
    return record


def get_launch_blockers(record: Dict[str, Any] | None = None) -> List[str]:
    source = _normalize_record(record)
    blockers: List[str] = []

    if not source["project_id"]:
        blockers.append("Missing project_id blocks launch gate evaluation.")
    if not source["client_name"]:
        blockers.append("Missing client_name blocks launch gate evaluation.")
    if not source["project_name"]:
        blockers.append("Missing project_name blocks launch gate evaluation.")
    if not _is_complete(source["qa_signoff"]):
        blockers.append("Missing QA signoff blocks launch_ready.")
    if not _is_complete(source["operator_signoff"]):
        blockers.append("Missing operator signoff blocks launch_ready.")
    if not _is_complete(source["delivery_signoff"]):
        blockers.append("Missing delivery signoff blocks launch_ready.")
    if _is_object(record) and record.get("public_approved") is True:
        blockers.append("public_approved must remain false for this private SHS launch ledger.")
    if _is_object(record) and record.get("mutated_shf_impact_data") is True:
        blockers.append("mutated_shf_impact_data must remain false; SHF Impact Data Spine mutation is blocked.")
    if _is_object(record) and record.get("published_report") is True:
        blockers.append("published_report must remain false unless a separate governed report flow approves publication.")

    return blockers


def get_launch_warnings(record: Dict[str, Any] | None = None) -> List[str]:
    source = _normalize_record(record)
    warnings: List[str] = []

    if not source["package_name"]:
        warnings.append("Missing package_name is a private-beta warning and paid-launch blocker.")
    if not _is_complete(source["client_signoff"]):
        warnings.append("Missing client signoff blocks paid launch but may allow supervised private beta.")
    if not source["version_record"]["version_id"] and not source["version_record"]["version_label"]:
        warnings.append("Missing version record blocks paid launch and ClientOps activation.")
    if not source["rollback_plan"]["owner"] or not source["rollback_plan"]["last_known_good_version"]:
        warnings.append("Incomplete rollback plan blocks paid launch.")
    if not source["support_tier"]:
        warnings.append("Missing support_tier blocks ClientOps activation.")
    if not source["clientops_activation"]["owner"]:
        warnings.append("Missing ClientOps activation owner blocks ClientOps activation.")
    if source["private_beta_only"]:
        warnings.append("Record is marked private_beta_only; paid launch remains blocked.")

    return warnings


def _paid_launch_blockers(record: Dict[str, Any] | None = None) -> List[str]:
    source = _normalize_record(record)
    blockers: List[str] = []

    if not source["package_name"]:
        blockers.append("Missing package_name blocks paid launch.")
    if not _is_complete(source["client_signoff"]):
        blockers.append("Missing client signoff blocks paid launch.")
    if not source["version_record"]["version_id"] and not source["version_record"]["version_label"]:
        blockers.append("Missing version record blocks paid launch.")
    if not source["rollback_plan"]["owner"]:
        blockers.append("Missing rollback owner blocks paid launch.")
    if not source["rollback_plan"]["last_known_good_version"]:
        blockers.append("Missing rollback last_known_good_version blocks paid launch.")
    if not source["support_tier"]:
        blockers.append("Missing support_tier blocks paid launch and ClientOps activation.")
    if not source["clientops_activation"]["owner"]:
        blockers.append("Missing ClientOps activation owner blocks paid launch.")
    if source["private_beta_only"]:
        blockers.append("private_beta_only must be false before paid_launch_ready.")

    return blockers


def is_clientops_activation_allowed(record: Dict[str, Any] | None = None) -> bool:
    source = _normalize_record(record)
    return (
        not get_launch_blockers(source)
        and bool(source["support_tier"])
        and bool(source["clientops_activation"]["owner"])
        and bool(source["version_record"]["version_id"] or source["version_record"]["version_label"])
    )


def compute_launch_gate_status(record: Dict[str, Any] | None = None) -> Dict[str, Any]:
    source = _normalize_record(record)
    blockers = get_launch_blockers(record)
    warnings = get_launch_warnings(source)
    paid_blockers = _paid_launch_blockers(source)
    clientops_allowed = is_clientops_activation_allowed(source)
    identity_or_safety_blocked = any(
        "project_id" in blocker
        or "client_name" in blocker
        or "project_name" in blocker
        or "must remain false" in blocker
        for blocker in blockers
    )

    if identity_or_safety_blocked:
        status = {
            "status": "blocked",
            "launch_status": "blocked",
            "blockers": blockers,
            "warnings": warnings,
            "paid_launch_blockers": paid_blockers,
            "clientops_activation_allowed": False,
        }
    elif blockers:
        status = {
            "status": "needs_review",
            "launch_status": "qa_review",
            "blockers": blockers,
            "warnings": warnings,
            "paid_launch_blockers": paid_blockers,
            "clientops_activation_allowed": False,
        }
    elif paid_blockers:
        status = {
            "status": "private_beta_ready",
            "launch_status": "launch_ready",
            "blockers": [],
            "warnings": warnings,
            "paid_launch_blockers": paid_blockers,
            "clientops_activation_allowed": clientops_allowed,
        }
    else:
        status = {
            "status": "paid_launch_ready",
            "launch_status": "launch_ready",
            "blockers": [],
            "warnings": warnings,
            "paid_launch_blockers": [],
            "clientops_activation_allowed": clientops_allowed,
        }

    status.update(_safety_flags())
    return status


def validate_launch_record(record: Dict[str, Any] | None = None) -> Dict[str, Any]:
    normalized = _normalize_record(record)
    gate = compute_launch_gate_status(record)
    normalized["computed_gate_status"] = gate["status"]
    normalized["computed_launch_status"] = gate["launch_status"]
    return {
        "valid": gate["status"] != "blocked",
        "record": normalized,
        "gate": gate,
        "blockers": gate["blockers"],
        "warnings": gate["warnings"],
        "paid_launch_blockers": gate["paid_launch_blockers"],
        "clientops_activation_allowed": gate["clientops_activation_allowed"],
        **_safety_flags(),
    }


def get_launch_records() -> List[Dict[str, Any]]:
    return [_normalize_record(record) for record in _read_json_list(RECORDS_PATH)]


def get_launch_record(ledger_id: str) -> Dict[str, Any] | None:
    wanted = _clean(ledger_id)
    for record in get_launch_records():
        if record.get("ledger_id") == wanted:
            return record
    return None


def append_launch_audit_event(event: Dict[str, Any] | None = None) -> Dict[str, Any]:
    _ensure_storage()
    source = dict(event or {})
    audit_event = {
        "event_id": _clean(source.get("event_id")) or _id("shs_launch_audit"),
        "event_type": _clean(source.get("event_type")) or "ledger_event",
        "ledger_id": _clean(source.get("ledger_id")),
        "project_id": _clean(source.get("project_id")),
        "actor": _clean(source.get("actor")) or "system",
        "summary": _clean(source.get("summary")),
        "created_at": _clean(source.get("created_at")) or _now(),
        "metadata": source.get("metadata") if isinstance(source.get("metadata"), dict) else {},
    }
    audit_event.update(_safety_flags())
    with AUDIT_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(audit_event, sort_keys=True) + "\n")
    return audit_event


def get_launch_audit_events(limit: int = 100) -> List[Dict[str, Any]]:
    _ensure_storage()
    bounded_limit = max(1, min(int(limit or 100), 500))
    events: List[Dict[str, Any]] = []
    for line in AUDIT_PATH.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            parsed = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            parsed.update(_safety_flags())
            events.append(parsed)
    return events[-bounded_limit:]


def upsert_launch_record(record: Dict[str, Any] | None = None) -> Dict[str, Any]:
    validation = validate_launch_record(record)
    normalized = validation["record"]
    records = get_launch_records()
    existing_index = next((index for index, item in enumerate(records) if item.get("ledger_id") == normalized["ledger_id"]), -1)
    event_type = "launch_record_updated" if existing_index >= 0 else "launch_record_created"

    if existing_index >= 0:
        records[existing_index] = normalized
    else:
        records.append(normalized)

    _write_records(records)
    append_launch_audit_event(
        {
            "event_type": event_type,
            "ledger_id": normalized["ledger_id"],
            "project_id": normalized["project_id"],
            "summary": f"Launch ledger record {event_type.replace('_', ' ')}.",
            "metadata": {
                "gate_status": validation["gate"]["status"],
                "launch_status": validation["gate"]["launch_status"],
            },
        }
    )
    return normalized


def add_signoff_to_record(ledger_id: str, payload: Dict[str, Any] | None = None) -> Dict[str, Any] | None:
    record = get_launch_record(ledger_id)
    if record is None:
        return None

    signoff = create_signoff_record(payload)
    signoff_type = _clean(signoff.get("type")).lower()
    field_map = {
        "qa": "qa_signoff",
        "operator": "operator_signoff",
        "delivery": "delivery_signoff",
        "client": "client_signoff",
    }
    field = field_map.get(signoff_type, f"{signoff_type}_signoff")
    if field not in {"qa_signoff", "operator_signoff", "delivery_signoff", "client_signoff"}:
        field = "operator_signoff"
    record[field] = signoff
    updated = upsert_launch_record(record)
    append_launch_audit_event(
        {
            "event_type": "launch_signoff_added",
            "ledger_id": updated["ledger_id"],
            "project_id": updated["project_id"],
            "actor": signoff.get("owner") or "system",
            "summary": f"{signoff.get('type')} signoff added.",
            "metadata": {"signoff_id": signoff.get("signoff_id"), "signoff_type": signoff.get("type")},
        }
    )
    return updated


def add_version_to_record(ledger_id: str, payload: Dict[str, Any] | None = None) -> Dict[str, Any] | None:
    record = get_launch_record(ledger_id)
    if record is None:
        return None
    version = create_version_record(payload)
    record["version_record"] = version
    updated = upsert_launch_record(record)
    append_launch_audit_event(
        {
            "event_type": "launch_version_recorded",
            "ledger_id": updated["ledger_id"],
            "project_id": updated["project_id"],
            "actor": version.get("owner") or "system",
            "summary": "Launch version record added.",
            "metadata": {"version_id": version.get("version_id"), "version_label": version.get("version_label")},
        }
    )
    return updated


def recalculate_launch_record(ledger_id: str) -> Dict[str, Any] | None:
    record = get_launch_record(ledger_id)
    if record is None:
        return None
    validation = validate_launch_record(record)
    record = validation["record"]
    records = get_launch_records()
    records = [record if item.get("ledger_id") == ledger_id else item for item in records]
    _write_records(records)
    append_launch_audit_event(
        {
            "event_type": "launch_gate_recalculated",
            "ledger_id": record["ledger_id"],
            "project_id": record["project_id"],
            "summary": "Launch gate recalculated.",
            "metadata": {"gate_status": validation["gate"]["status"]},
        }
    )
    return record


def launch_readiness_summary() -> Dict[str, Any]:
    records = get_launch_records()
    gates = [compute_launch_gate_status(record) for record in records]
    return {
        "ok": True,
        "service": "shs_launch_ledger",
        "total_records": len(records),
        "blocked": len([gate for gate in gates if gate["status"] == "blocked"]),
        "needs_review": len([gate for gate in gates if gate["status"] == "needs_review"]),
        "private_beta_ready": len([gate for gate in gates if gate["status"] in {"private_beta_ready", "paid_launch_ready"}]),
        "paid_launch_ready": len([gate for gate in gates if gate["status"] == "paid_launch_ready"]),
        "clientops_activation_allowed": len([record for record in records if is_clientops_activation_allowed(record)]),
        **_safety_flags(),
    }


def shs_launch_ledger_health() -> Dict[str, Any]:
    _ensure_storage()
    return {
        "ok": True,
        "service": "shs_launch_ledger",
        "status": "v1_1_backend_persistence_audit_ledger",
        "storage": {
            "records": str(RECORDS_PATH),
            "audit": str(AUDIT_PATH),
        },
        "readiness": launch_readiness_summary(),
        **_safety_flags(),
    }
