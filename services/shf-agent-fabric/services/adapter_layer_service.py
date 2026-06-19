from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, List


SOURCE_SYSTEM_TYPES = [
    "shs_spine",
    "shf_next",
    "clientops",
    "production_ops",
    "website_studio",
    "webmaker",
    "builderhub",
    "partner_feed",
    "api",
    "webhook",
    "csv",
    "json",
    "manual",
    "unknown",
]

INPUT_FORMATS = ["json", "csv", "form", "api_payload", "webhook_event", "document", "unknown"]
PAYLOAD_DOMAINS = ["operational", "impact", "reporting", "event", "client_private", "public_candidate", "unknown"]

ADAPTER_PROFILES = [
    "shs_clientops_record",
    "shs_production_ops_record",
    "shs_website_studio_record",
    "shs_webmaker_record",
    "shf_next_foundation_record",
    "partner_feed_record",
    "api_payload_record",
    "webhook_event_record",
    "csv_import_record",
    "json_import_record",
    "manual_entry_record",
    "unknown_review_required",
]

SHS_OPERATIONAL_SOURCE_TYPES = {"shs_spine", "clientops", "production_ops", "website_studio", "webmaker", "builderhub"}
SOURCE_REGISTRY_SOURCE_TYPES = {"partner_feed", "api", "webhook"}
READY_INPUT_FORMATS = {"json", "csv", "form", "api_payload"}

BOUNDARY_WARNINGS = [
    "Adapter Layer classifies source systems, formats, mapping readiness, and target intake only.",
    "Adapter Layer does not call external systems, perform final normalization, verify truth, approve public data, mutate SHF Impact Data Spine, publish reports, replace Source Registry, replace Data Aggregator, or replace Data Normalization.",
]


def _clean_str(value: Any) -> str:
    return str(value or "").strip()


def _canonical(value: Any) -> str:
    return _clean_str(value).lower().replace("-", "_").replace(" ", "_")


def _request(payload: Dict[str, Any]) -> Dict[str, Any]:
    request = payload.get("adapter") if isinstance(payload.get("adapter"), dict) else payload
    return dict(request or {})


def _canonical_json(value: Dict[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _adapter_result_id(payload: Dict[str, Any]) -> str:
    digest = hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()[:16]
    return f"adapter_layer_{digest}"


def _dict(value: Any) -> Dict[str, Any]:
    return dict(value) if isinstance(value, dict) else {}


def _adapter_profile(source_system_type: str, input_format: str, payload_domain: str, mapping_profile: str) -> str:
    if mapping_profile:
        return mapping_profile
    if source_system_type == "clientops":
        return "shs_clientops_record"
    if source_system_type == "production_ops":
        return "shs_production_ops_record"
    if source_system_type == "website_studio":
        return "shs_website_studio_record"
    if source_system_type in {"webmaker", "builderhub"}:
        return "shs_webmaker_record"
    if source_system_type == "shf_next":
        return "shf_next_foundation_record" if payload_domain in {"impact", "public_candidate", "reporting"} else "unknown_review_required"
    if source_system_type == "partner_feed":
        return "partner_feed_record"
    if source_system_type == "api":
        return "api_payload_record"
    if source_system_type == "webhook":
        return "webhook_event_record"
    if input_format == "csv":
        return "csv_import_record"
    if input_format == "json":
        return "json_import_record"
    if source_system_type == "manual" or input_format == "form":
        return "manual_entry_record"
    return "unknown_review_required"


def _target_layer(source_system_type: str, input_format: str, payload_domain: str) -> str:
    if payload_domain == "client_private":
        return "security_privacy"
    if source_system_type in SOURCE_REGISTRY_SOURCE_TYPES:
        return "source_registry"
    if source_system_type == "webhook" or input_format == "webhook_event" or payload_domain == "event":
        return "event_webhook"
    if input_format == "csv":
        return "batch_import"
    if payload_domain in {"impact", "public_candidate"}:
        return "source_registry"
    if source_system_type in SHS_OPERATIONAL_SOURCE_TYPES:
        return "source_registry"
    return "data_aggregator"


def _missing_fields(source_metadata: Dict[str, Any], provenance: Dict[str, Any], mapping_profile: str) -> List[str]:
    missing: List[str] = []
    if not source_metadata:
        missing.append("source_metadata")
    if not provenance:
        missing.append("provenance")
    if not mapping_profile:
        missing.append("mapping_profile")
    return missing


def evaluate_adapter(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    source = dict(payload or {})
    request = _request(source)
    adapter_review_id = _clean_str(request.get("adapter_review_id"))
    source_system = _clean_str(request.get("source_system"))
    raw_source_system_type = _clean_str(request.get("source_system_type"))
    source_system_type = _canonical(raw_source_system_type)
    raw_input_format = _clean_str(request.get("input_format"))
    input_format = _canonical(raw_input_format)
    raw_payload_domain = _clean_str(request.get("payload_domain"))
    payload_domain = _canonical(raw_payload_domain)
    payload_ref = _clean_str(request.get("payload_ref"))
    source_metadata = _dict(request.get("source_metadata"))
    provenance = _dict(request.get("provenance"))
    mapping_profile = _clean_str(request.get("mapping_profile"))
    metadata = _dict(request.get("metadata"))
    warnings: List[str] = []
    blockers: List[str] = []

    if not adapter_review_id:
        blockers.append("missing_adapter_review_id")
    if not source_system:
        blockers.append("missing_source_system")
    if not raw_source_system_type:
        blockers.append("missing_source_system_type")
    elif source_system_type not in SOURCE_SYSTEM_TYPES or source_system_type == "unknown":
        warnings.append("unknown_source_system_type")
        source_system_type = "unknown"
    if not raw_input_format:
        blockers.append("missing_input_format")
    elif input_format not in INPUT_FORMATS or input_format == "unknown":
        warnings.append("unknown_input_format")
        input_format = "unknown"
    if not raw_payload_domain:
        warnings.append("missing_payload_domain")
        payload_domain = "unknown"
    elif payload_domain not in PAYLOAD_DOMAINS or payload_domain == "unknown":
        warnings.append("unknown_payload_domain")
        payload_domain = "unknown"

    required_fields = ["adapter_review_id", "source_system", "source_system_type", "input_format", "source_metadata", "provenance", "mapping_profile"]
    missing_fields = _missing_fields(source_metadata, provenance, mapping_profile)
    if not source_metadata:
        warnings.append("missing_source_metadata")
    if not provenance:
        warnings.append("missing_provenance")
    if not mapping_profile:
        warnings.append("missing_mapping_profile")

    if payload_domain == "client_private":
        warnings.append("shs_private_data_rules_apply")
    if source_system_type in SHS_OPERATIONAL_SOURCE_TYPES:
        warnings.append("shs_operational_private_by_default")
        if payload_domain in {"impact", "public_candidate"}:
            warnings.append("requires_shs_to_shf_eligibility_review")
    if source_system_type in SOURCE_REGISTRY_SOURCE_TYPES:
        warnings.append("requires_source_registry_evaluation")
    if payload_domain in {"impact", "public_candidate"}:
        warnings.append("public_approval_not_granted_by_adapter")

    adapter_profile = _adapter_profile(source_system_type, input_format, payload_domain, mapping_profile)
    target_layer = _target_layer(source_system_type, input_format, payload_domain)

    ready_context = bool(source_metadata and provenance and mapping_profile and input_format in READY_INPUT_FORMATS)
    if blockers:
        adapter_status = "blocked"
    elif warnings and not ready_context:
        adapter_status = "needs_review"
    else:
        adapter_status = "adapter_ready"

    adapter_ready = adapter_status == "adapter_ready"
    if blockers:
        recommended_action = "resolve_adapter_blockers"
    elif warnings and not adapter_ready:
        recommended_action = "review_adapter_mapping_and_provenance"
    else:
        recommended_action = f"route_to_{target_layer}"

    result = {
        "adapter_result_id": _adapter_result_id(
            {
                "adapter_review_id": adapter_review_id,
                "source_system": source_system,
                "source_system_type": source_system_type,
                "input_format": input_format,
                "payload_domain": payload_domain,
                "mapping_profile": mapping_profile,
            }
        ),
        "adapter_profile": adapter_profile,
        "source_system": source_system,
        "source_system_type": source_system_type,
        "input_format": input_format,
        "payload_domain": payload_domain,
        "payload_ref": payload_ref,
        "adapter_status": adapter_status,
        "target_layer": target_layer,
        "required_fields": required_fields,
        "missing_fields": sorted(set(missing_fields)),
        "warnings": sorted(set(warnings)),
        "blockers": sorted(set(blockers)),
        "recommended_action": recommended_action,
        "adapter_ready": adapter_ready,
        "external_call_made": False,
        "normalized_final": False,
        "truth_verified": False,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
        "source_metadata": source_metadata,
        "provenance": provenance,
        "metadata": metadata,
    }
    return {
        "ok": True,
        "layer": "adapter_layer",
        "adapter": result,
        "warnings": result["warnings"],
        "blockers": result["blockers"],
        "adapter_ready": adapter_ready,
        "external_call_made": False,
        "normalized_final": False,
        "truth_verified": False,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
    }


def batch_evaluate_adapters(records: Any) -> Dict[str, Any]:
    items = records if isinstance(records, list) else []
    evaluations = [evaluate_adapter(item if isinstance(item, dict) else {}) for item in items]
    adapters = [item["adapter"] for item in evaluations]
    target_layer_counts: Dict[str, int] = {}
    adapter_profile_counts: Dict[str, int] = {}
    for item in adapters:
        target_layer_counts[item["target_layer"]] = target_layer_counts.get(item["target_layer"], 0) + 1
        adapter_profile_counts[item["adapter_profile"]] = adapter_profile_counts.get(item["adapter_profile"], 0) + 1
    return {
        "ok": True,
        "layer": "adapter_layer",
        "total_reviews": len(adapters),
        "blocked": sum(1 for item in adapters if item["adapter_status"] == "blocked"),
        "needs_review": sum(1 for item in adapters if item["adapter_status"] == "needs_review"),
        "adapter_ready": sum(1 for item in adapters if item["adapter_ready"]),
        "external_call_made_count": 0,
        "normalized_final_count": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "target_layer_counts": target_layer_counts,
        "adapter_profile_counts": adapter_profile_counts,
        "evaluations": evaluations,
    }


def adapter_layer_schema() -> Dict[str, Any]:
    return {
        "ok": True,
        "layer": "adapter_layer",
        "source_system_types": list(SOURCE_SYSTEM_TYPES),
        "input_formats": list(INPUT_FORMATS),
        "payload_domains": list(PAYLOAD_DOMAINS),
        "adapter_profiles": list(ADAPTER_PROFILES),
        "adapter_statuses": ["blocked", "needs_review", "adapter_ready"],
        "result_fields": [
            "adapter_result_id",
            "adapter_profile",
            "source_system",
            "source_system_type",
            "input_format",
            "payload_domain",
            "adapter_status",
            "target_layer",
            "required_fields",
            "missing_fields",
            "warnings",
            "blockers",
            "recommended_action",
            "adapter_ready",
            "external_call_made",
            "normalized_final",
            "truth_verified",
            "public_approved",
            "mutated_public_data",
            "published_report",
        ],
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def _sample_evaluations() -> Dict[str, Any]:
    return batch_evaluate_adapters(
        [
            {
                "adapter": {
                    "adapter_review_id": "adapter_clientops_001",
                    "source_system": "SHS ClientOps",
                    "source_system_type": "clientops",
                    "input_format": "json",
                    "payload_domain": "client_private",
                    "payload_ref": "clientops/local",
                    "source_metadata": {"source_name": "ClientOps"},
                    "provenance": {"captured_by": "shs_ops"},
                    "mapping_profile": "shs_clientops_record",
                }
            },
            {
                "adapter": {
                    "adapter_review_id": "adapter_partner_001",
                    "source_system": "Partner Feed",
                    "source_system_type": "partner_feed",
                    "input_format": "csv",
                    "payload_domain": "impact",
                    "payload_ref": "partner/feed.csv",
                    "source_metadata": {"source_name": "Partner"},
                    "provenance": {"submitted_by": "partner"},
                    "mapping_profile": "partner_feed_record",
                }
            },
            {
                "adapter": {
                    "adapter_review_id": "",
                    "source_system": "",
                    "source_system_type": "unknown",
                    "input_format": "unknown",
                    "payload_domain": "unknown",
                }
            },
        ]
    )


def adapter_layer_summary() -> Dict[str, Any]:
    sample = _sample_evaluations()
    return {
        "policy_status": "formalized_v1",
        "total_reviews": sample["total_reviews"],
        "blocked": sample["blocked"],
        "needs_review": sample["needs_review"],
        "adapter_ready": sample["adapter_ready"],
        "external_call_made_count": 0,
        "normalized_final_count": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "target_layer_counts": sample["target_layer_counts"],
        "adapter_profile_counts": sample["adapter_profile_counts"],
        "calls_external_systems": False,
        "normalizes_final_data": False,
        "verifies_truth": False,
        "approves_public_data": False,
        "mutates_shf_impact_data": False,
        "publishes_reports": False,
        "replaces_source_registry": False,
        "replaces_data_aggregator": False,
        "replaces_data_normalization": False,
        "replaces_api_gateway": False,
        "replaces_event_webhook": False,
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def adapter_layer_readiness() -> Dict[str, Any]:
    summary = adapter_layer_summary()
    return {
        "ok": True,
        "layer": "adapter_layer",
        "blocked": summary["blocked"],
        "needs_review": summary["needs_review"],
        "adapter_ready": summary["adapter_ready"],
        "external_call_made_count": 0,
        "normalized_final_count": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "calls_external_systems": False,
        "normalizes_final_data": False,
    }


def adapter_layer_health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "adapter_layer",
        "status": "formalized_v1",
        "summary": adapter_layer_summary(),
    }
