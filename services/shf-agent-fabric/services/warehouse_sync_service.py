from __future__ import annotations

import hashlib
import json
from typing import Any, Dict


TARGET_DOMAINS = [
    "ops",
    "client_reporting",
    "foundation_impact",
    "audit_trace",
    "watchtower",
    "reports",
    "loo",
    "analytics",
    "unknown",
]

DATA_CLASSIFICATIONS = ["public", "internal", "private", "restricted", "unknown"]
PRIVATE_ALLOWED_DOMAINS = {"ops", "audit_trace", "analytics"}
PUBLIC_STYLE_DOMAINS = {"foundation_impact"}
REPORTING_DOMAINS = {"reports", "client_reporting"}
SECURITY_CLEAR_STATUSES = {"clear", "passed", "approved"}
OWNERSHIP_CLEAR_STATUSES = {"clear", "passed", "approved", "reporting_rights_clear", "owner_approved"}
PUBLIC_CANDIDATE_STATUSES = {"public_ready_candidate", "approved_gateway_candidate"}
APPROVAL_CLEAR_STATUSES = {"approved", "report_ready", "owner_approved", "reporting_rights_clear", "public_ready_candidate", "approved_gateway_candidate"}

BOUNDARY_WARNINGS = [
    "Warehouse Sync Layer classifies warehouse sync eligibility, domain readiness, schema readiness, mapping readiness, audit readiness, and governance clearance only.",
    "Warehouse Sync Layer does not connect to a warehouse, write warehouse records, create exports, call external systems, verify truth, approve public data, mutate SHF Impact Data Spine, publish reports, replace Reports, replace Watchtower, replace Batch / Import, replace Adapter Layer, or replace Data Approval Gateway.",
]


def _clean_str(value: Any) -> str:
    return str(value or "").strip()


def _canonical(value: Any) -> str:
    return _clean_str(value).lower().replace("-", "_").replace(" ", "_")


def _request(payload: Dict[str, Any]) -> Dict[str, Any]:
    request = payload.get("warehouse_sync") if isinstance(payload.get("warehouse_sync"), dict) else payload
    return dict(request or {})


def _dict(value: Any) -> Dict[str, Any]:
    return dict(value) if isinstance(value, dict) else {}


def _canonical_json(value: Dict[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _warehouse_sync_id(payload: Dict[str, Any]) -> str:
    digest = hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()[:16]
    return f"warehouse_sync_{digest}"


def _security_privacy_clear(status: str) -> bool:
    return status in SECURITY_CLEAR_STATUSES


def _ownership_ip_clear(status: str) -> bool:
    return status in OWNERSHIP_CLEAR_STATUSES


def _approval_clear(target_domain: str, approval_status: str, public_approval_status: str, ownership_ip_status: str) -> bool:
    if target_domain in PUBLIC_STYLE_DOMAINS:
        return public_approval_status in PUBLIC_CANDIDATE_STATUSES
    if target_domain in REPORTING_DOMAINS:
        return approval_status in APPROVAL_CLEAR_STATUSES or ownership_ip_status in {"reporting_rights_clear", "owner_approved"}
    return approval_status in APPROVAL_CLEAR_STATUSES or bool(approval_status == "")


def evaluate_warehouse_sync(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    source = dict(payload or {})
    request = _request(source)
    sync_review_id = _clean_str(request.get("sync_review_id"))
    record_id = _clean_str(request.get("record_id"))
    source_layer = _clean_str(request.get("source_layer"))
    source_system = _clean_str(request.get("source_system"))
    raw_target_domain = _clean_str(request.get("target_domain"))
    target_domain = _canonical(raw_target_domain)
    raw_data_classification = _clean_str(request.get("data_classification"))
    data_classification = _canonical(raw_data_classification)
    schema_profile = _clean_str(request.get("schema_profile"))
    mapping_profile = _clean_str(request.get("mapping_profile"))
    audit_ref = _clean_str(request.get("audit_ref"))
    security_privacy_status = _canonical(request.get("security_privacy_status"))
    ownership_ip_status = _canonical(request.get("ownership_ip_status"))
    approval_status = _canonical(request.get("approval_status"))
    public_approval_status = _canonical(request.get("public_approval_status"))
    metadata = _dict(request.get("metadata"))
    warnings: list[str] = []
    blockers: list[str] = []

    if not sync_review_id:
        blockers.append("missing_sync_review_id")
    if not record_id:
        blockers.append("missing_record_id")
    if not source_layer:
        blockers.append("missing_source_layer")
    if not raw_target_domain:
        blockers.append("missing_target_domain")
    elif target_domain not in TARGET_DOMAINS or target_domain == "unknown":
        warnings.append("unknown_target_domain")
        target_domain = "unknown"
    if not raw_data_classification:
        warnings.append("missing_data_classification")
        data_classification = "unknown"
    elif data_classification not in DATA_CLASSIFICATIONS or data_classification == "unknown":
        warnings.append("unknown_data_classification")
        data_classification = "unknown"
    if data_classification == "restricted":
        blockers.append("restricted_data_classification")
    if not schema_profile:
        warnings.append("missing_schema_profile")
    if not mapping_profile:
        warnings.append("missing_mapping_profile")
    if not audit_ref:
        warnings.append("missing_audit_ref")
    if security_privacy_status in {"blocked", "failed"}:
        blockers.append("security_privacy_blocked")
    if ownership_ip_status in {"blocked", "restricted"}:
        blockers.append("ownership_ip_blocked")

    security_privacy_clear = _security_privacy_clear(security_privacy_status)
    ownership_ip_clear = _ownership_ip_clear(ownership_ip_status)
    if not security_privacy_clear:
        warnings.append("security_privacy_not_clear")
    if not ownership_ip_clear:
        warnings.append("ownership_ip_not_clear")

    if data_classification == "private" and target_domain not in PRIVATE_ALLOWED_DOMAINS:
        warnings.append("private_data_target_requires_review")
    if data_classification == "private" and target_domain in PRIVATE_ALLOWED_DOMAINS and not (security_privacy_clear and ownership_ip_clear):
        warnings.append("private_data_requires_security_and_ownership_clearance")
    if target_domain in PUBLIC_STYLE_DOMAINS and public_approval_status not in PUBLIC_CANDIDATE_STATUSES:
        warnings.append("public_target_requires_public_approval_candidate_context")
    if target_domain in REPORTING_DOMAINS and not (approval_status in APPROVAL_CLEAR_STATUSES or ownership_ip_status in {"reporting_rights_clear", "owner_approved"}):
        warnings.append("reporting_target_requires_approval_or_reporting_rights")

    schema_ready = bool(schema_profile)
    mapping_ready = bool(mapping_profile)
    audit_ready = bool(audit_ref)
    approval_clear = _approval_clear(target_domain, approval_status, public_approval_status, ownership_ip_status)
    allowed_private_context = data_classification != "private" or target_domain in PRIVATE_ALLOWED_DOMAINS
    ready_context = bool(
        target_domain in TARGET_DOMAINS
        and target_domain != "unknown"
        and data_classification in DATA_CLASSIFICATIONS
        and data_classification not in {"unknown", "restricted"}
        and schema_ready
        and mapping_ready
        and audit_ready
        and security_privacy_clear
        and ownership_ip_clear
        and approval_clear
        and allowed_private_context
    )
    if blockers:
        sync_status = "blocked"
    elif warnings and not ready_context:
        sync_status = "needs_review"
    else:
        sync_status = "sync_ready"

    sync_ready = sync_status == "sync_ready"
    if blockers:
        recommended_action = "resolve_warehouse_sync_blockers"
    elif warnings and not sync_ready:
        recommended_action = "review_warehouse_sync_governance_context"
    else:
        recommended_action = f"ready_for_future_{target_domain}_warehouse_sync"

    result = {
        "warehouse_sync_id": _warehouse_sync_id(
            {
                "sync_review_id": sync_review_id,
                "record_id": record_id,
                "source_layer": source_layer,
                "target_domain": target_domain,
                "data_classification": data_classification,
                "schema_profile": schema_profile,
                "mapping_profile": mapping_profile,
                "audit_ref": audit_ref,
            }
        ),
        "sync_review_id": sync_review_id,
        "record_id": record_id,
        "source_layer": source_layer,
        "source_system": source_system,
        "target_domain": target_domain,
        "data_classification": data_classification,
        "sync_status": sync_status,
        "schema_ready": schema_ready,
        "mapping_ready": mapping_ready,
        "audit_ready": audit_ready,
        "security_privacy_clear": security_privacy_clear,
        "ownership_ip_clear": ownership_ip_clear,
        "approval_clear": approval_clear,
        "warnings": sorted(set(warnings)),
        "blockers": sorted(set(blockers)),
        "recommended_action": recommended_action,
        "sync_ready": sync_ready,
        "warehouse_write_performed": False,
        "external_call_made": False,
        "export_created": False,
        "truth_verified": False,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
        "security_privacy_status": security_privacy_status,
        "ownership_ip_status": ownership_ip_status,
        "approval_status": approval_status,
        "public_approval_status": public_approval_status,
        "metadata": metadata,
    }
    return {
        "ok": True,
        "layer": "warehouse_sync",
        "warehouse_sync": result,
        "warnings": result["warnings"],
        "blockers": result["blockers"],
        "sync_ready": sync_ready,
        "warehouse_write_performed": False,
        "external_call_made": False,
        "export_created": False,
        "truth_verified": False,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
    }


def batch_evaluate_warehouse_sync(records: Any) -> Dict[str, Any]:
    items = records if isinstance(records, list) else []
    evaluations = [evaluate_warehouse_sync(item if isinstance(item, dict) else {}) for item in items]
    syncs = [item["warehouse_sync"] for item in evaluations]
    target_domain_counts: Dict[str, int] = {}
    data_classification_counts: Dict[str, int] = {}
    for item in syncs:
        target_domain_counts[item["target_domain"]] = target_domain_counts.get(item["target_domain"], 0) + 1
        data_classification_counts[item["data_classification"]] = data_classification_counts.get(item["data_classification"], 0) + 1
    return {
        "ok": True,
        "layer": "warehouse_sync",
        "total_sync_reviews": len(syncs),
        "blocked": sum(1 for item in syncs if item["sync_status"] == "blocked"),
        "needs_review": sum(1 for item in syncs if item["sync_status"] == "needs_review"),
        "sync_ready": sum(1 for item in syncs if item["sync_ready"]),
        "warehouse_write_performed_count": 0,
        "external_call_made_count": 0,
        "export_created_count": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "target_domain_counts": target_domain_counts,
        "data_classification_counts": data_classification_counts,
        "evaluations": evaluations,
    }


def warehouse_sync_schema() -> Dict[str, Any]:
    return {
        "ok": True,
        "layer": "warehouse_sync",
        "target_domains": list(TARGET_DOMAINS),
        "data_classifications": list(DATA_CLASSIFICATIONS),
        "sync_statuses": ["blocked", "needs_review", "sync_ready"],
        "result_fields": [
            "warehouse_sync_id",
            "sync_review_id",
            "record_id",
            "source_layer",
            "target_domain",
            "data_classification",
            "sync_status",
            "schema_ready",
            "mapping_ready",
            "audit_ready",
            "security_privacy_clear",
            "ownership_ip_clear",
            "approval_clear",
            "warnings",
            "blockers",
            "recommended_action",
            "sync_ready",
            "warehouse_write_performed",
            "external_call_made",
            "export_created",
            "truth_verified",
            "public_approved",
            "mutated_public_data",
            "published_report",
        ],
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def _sample_evaluations() -> Dict[str, Any]:
    return batch_evaluate_warehouse_sync(
        [
            {
                "warehouse_sync": {
                    "sync_review_id": "warehouse_sync_ops_001",
                    "record_id": "ops-record-001",
                    "source_layer": "data_approval",
                    "source_system": "SHS Ops",
                    "target_domain": "ops",
                    "data_classification": "internal",
                    "schema_profile": "ops_v1",
                    "mapping_profile": "ops_mapping_v1",
                    "audit_ref": "audit-ops-001",
                    "security_privacy_status": "clear",
                    "ownership_ip_status": "clear",
                    "approval_status": "approved",
                }
            },
            {
                "warehouse_sync": {
                    "sync_review_id": "warehouse_sync_impact_001",
                    "record_id": "impact-record-001",
                    "source_layer": "data_approval_gateway",
                    "source_system": "SHF Impact Data Spine",
                    "target_domain": "foundation_impact",
                    "data_classification": "public",
                    "schema_profile": "impact_v1",
                    "mapping_profile": "impact_mapping_v1",
                    "audit_ref": "audit-impact-001",
                    "security_privacy_status": "clear",
                    "ownership_ip_status": "clear",
                    "public_approval_status": "public_ready_candidate",
                }
            },
            {
                "warehouse_sync": {
                    "sync_review_id": "",
                    "record_id": "",
                    "source_layer": "",
                    "target_domain": "unknown",
                    "data_classification": "restricted",
                }
            },
        ]
    )


def warehouse_sync_summary() -> Dict[str, Any]:
    sample = _sample_evaluations()
    return {
        "policy_status": "formalized_v1",
        "total_sync_reviews": sample["total_sync_reviews"],
        "blocked": sample["blocked"],
        "needs_review": sample["needs_review"],
        "sync_ready": sample["sync_ready"],
        "warehouse_write_performed_count": 0,
        "external_call_made_count": 0,
        "export_created_count": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "target_domain_counts": sample["target_domain_counts"],
        "data_classification_counts": sample["data_classification_counts"],
        "writes_warehouse": False,
        "calls_external_systems": False,
        "creates_exports": False,
        "verifies_truth": False,
        "approves_public_data": False,
        "mutates_shf_impact_data": False,
        "publishes_reports": False,
        "replaces_reports": False,
        "replaces_watchtower": False,
        "replaces_batch_import": False,
        "replaces_adapter_layer": False,
        "replaces_data_approval_gateway": False,
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def warehouse_sync_readiness() -> Dict[str, Any]:
    summary = warehouse_sync_summary()
    return {
        "ok": True,
        "layer": "warehouse_sync",
        "blocked": summary["blocked"],
        "needs_review": summary["needs_review"],
        "sync_ready": summary["sync_ready"],
        "warehouse_write_performed_count": 0,
        "external_call_made_count": 0,
        "export_created_count": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "writes_warehouse": False,
        "calls_external_systems": False,
        "creates_exports": False,
    }


def warehouse_sync_health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "warehouse_sync",
        "status": "formalized_v1",
        "summary": warehouse_sync_summary(),
    }
