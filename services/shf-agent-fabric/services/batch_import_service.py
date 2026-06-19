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
    "partner_feed",
    "api_export",
    "manual_upload",
    "unknown",
]

IMPORT_TYPES = ["csv", "json", "api_export", "manual_entry", "partner_dataset", "unknown"]
INPUT_FORMATS = ["csv", "json", "inline_records", "file_reference", "unknown"]
SHS_OPERATIONAL_SOURCE_TYPES = {"shs_spine", "clientops", "production_ops", "website_studio", "webmaker"}
PARTNER_SOURCE_TYPES = {"partner_feed", "api_export", "manual_upload"}
READY_IMPORT_TYPES = {"csv", "json", "api_export", "manual_entry", "partner_dataset"}
READY_INPUT_FORMATS = {"csv", "json", "inline_records", "file_reference"}
PII_OR_SECRET_KEYS = {"ssn", "social_security_number", "password", "secret", "api_key", "token", "private_key"}

BOUNDARY_WARNINGS = [
    "Batch / Import Layer reviews bulk intake readiness, row quarantine needs, and target intake only.",
    "Batch / Import Layer does not ingest production files, parse large files, write production records, perform final normalization, verify truth, approve public data, mutate SHF Impact Data Spine, publish reports, replace Adapter Layer, replace Source Registry, replace Data Aggregator, or replace Data Normalization.",
]


def _clean_str(value: Any) -> str:
    return str(value or "").strip()


def _canonical(value: Any) -> str:
    return _clean_str(value).lower().replace("-", "_").replace(" ", "_")


def _request(payload: Dict[str, Any]) -> Dict[str, Any]:
    request = payload.get("batch_import") if isinstance(payload.get("batch_import"), dict) else payload
    return dict(request or {})


def _dict(value: Any) -> Dict[str, Any]:
    return dict(value) if isinstance(value, dict) else {}


def _canonical_json(value: Dict[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _batch_review_id(payload: Dict[str, Any]) -> str:
    digest = hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()[:16]
    return f"batch_import_{digest}"


def _records(value: Any) -> List[Dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [dict(item) if isinstance(item, dict) else {"value": item} for item in value]


def _record_count(raw_count: Any, records: List[Dict[str, Any]]) -> int:
    if records:
        return len(records)
    try:
        count = int(raw_count or 0)
    except (TypeError, ValueError):
        count = 0
    return max(count, 0)


def _row_flags(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    warnings: List[str] = []
    blockers: List[str] = []
    quarantined = 0
    accepted = 0

    for index, record in enumerate(records):
        row_warnings: List[str] = []
        row_blockers: List[str] = []
        if not any(_clean_str(record.get(key)) for key in ("source_id", "source_name", "canonical_type")):
            row_blockers.append("missing_source_identity")
        lowered_keys = {_canonical(key) for key in record.keys()}
        if lowered_keys & PII_OR_SECRET_KEYS:
            row_warnings.append("possible_sensitive_or_secret_field")

        if row_blockers:
            quarantined += 1
            blockers.extend(f"row_{index}_{item}" for item in row_blockers)
        else:
            accepted += 1
        warnings.extend(f"row_{index}_{item}" for item in row_warnings)

    return {
        "accepted_record_count": accepted if records else 0,
        "quarantined_record_count": quarantined,
        "row_warning_count": len(warnings),
        "row_blocker_count": len(blockers),
        "row_warnings": warnings,
        "row_blockers": blockers,
    }


def _target_layer(source_system_type: str, import_type: str, input_format: str) -> str:
    if source_system_type in SHS_OPERATIONAL_SOURCE_TYPES:
        return "adapter_layer"
    if source_system_type in PARTNER_SOURCE_TYPES:
        return "adapter_layer"
    if import_type == "partner_dataset":
        return "adapter_layer"
    if input_format in {"csv", "json", "inline_records", "file_reference"}:
        return "adapter_layer"
    return "source_registry"


def evaluate_batch_import(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    source = dict(payload or {})
    request = _request(source)
    batch_id = _clean_str(request.get("batch_id"))
    batch_name = _clean_str(request.get("batch_name"))
    source_system = _clean_str(request.get("source_system"))
    raw_source_system_type = _clean_str(request.get("source_system_type"))
    source_system_type = _canonical(raw_source_system_type)
    raw_import_type = _clean_str(request.get("import_type"))
    import_type = _canonical(raw_import_type)
    raw_input_format = _clean_str(request.get("input_format"))
    input_format = _canonical(raw_input_format)
    records = _records(request.get("records"))
    record_count = _record_count(request.get("record_count"), records)
    mapping_profile = _clean_str(request.get("mapping_profile"))
    source_metadata = _dict(request.get("source_metadata"))
    provenance = _dict(request.get("provenance"))
    metadata = _dict(request.get("metadata"))
    warnings: List[str] = []
    blockers: List[str] = []

    if not batch_id:
        blockers.append("missing_batch_id")
    if not source_system:
        blockers.append("missing_source_system")
    if not raw_source_system_type:
        blockers.append("missing_source_system_type")
    elif source_system_type not in SOURCE_SYSTEM_TYPES or source_system_type == "unknown":
        warnings.append("unknown_source_system_type")
        source_system_type = "unknown"
    if not raw_import_type:
        blockers.append("missing_import_type")
    elif import_type not in IMPORT_TYPES or import_type == "unknown":
        warnings.append("unknown_import_type")
        import_type = "unknown"
    if not raw_input_format:
        blockers.append("missing_input_format")
    elif input_format not in INPUT_FORMATS or input_format == "unknown":
        warnings.append("unknown_input_format")
        input_format = "unknown"
    if record_count <= 0:
        blockers.append("missing_records")
    if not mapping_profile:
        warnings.append("missing_mapping_profile")
    if not source_metadata:
        warnings.append("missing_source_metadata")
    if not provenance:
        warnings.append("missing_provenance")

    if source_system_type in SHS_OPERATIONAL_SOURCE_TYPES:
        warnings.append("shs_operational_private_by_default")
        warnings.append("requires_downstream_shs_to_shf_governance")
    if source_system_type in PARTNER_SOURCE_TYPES:
        warnings.append("requires_adapter_layer_review")

    row_flags = _row_flags(records)
    warnings.extend(row_flags["row_warnings"])
    blockers.extend(row_flags["row_blockers"])
    target_layer = _target_layer(source_system_type, import_type, input_format)
    accepted_record_count = row_flags["accepted_record_count"] if records else record_count
    quarantined_record_count = row_flags["quarantined_record_count"]
    if quarantined_record_count:
        warnings.append("quarantine_required")

    ready_context = bool(
        record_count > 0
        and mapping_profile
        and source_metadata
        and provenance
        and import_type in READY_IMPORT_TYPES
        and input_format in READY_INPUT_FORMATS
    )
    if blockers:
        batch_status = "blocked"
    elif warnings and not ready_context:
        batch_status = "needs_review"
    else:
        batch_status = "import_ready"

    import_ready = batch_status == "import_ready"
    if blockers:
        recommended_action = "resolve_batch_import_blockers"
    elif warnings and not import_ready:
        recommended_action = "review_batch_mapping_provenance_and_quarantine"
    else:
        recommended_action = f"route_to_{target_layer}"

    result = {
        "batch_review_id": _batch_review_id(
            {
                "batch_id": batch_id,
                "source_system": source_system,
                "source_system_type": source_system_type,
                "import_type": import_type,
                "input_format": input_format,
                "record_count": record_count,
                "mapping_profile": mapping_profile,
            }
        ),
        "batch_id": batch_id,
        "batch_name": batch_name,
        "source_system": source_system,
        "source_system_type": source_system_type,
        "import_type": import_type,
        "input_format": input_format,
        "batch_status": batch_status,
        "record_count": record_count,
        "accepted_record_count": accepted_record_count,
        "quarantined_record_count": quarantined_record_count,
        "row_warning_count": row_flags["row_warning_count"],
        "row_blocker_count": row_flags["row_blocker_count"],
        "target_layer": target_layer,
        "required_fields": ["batch_id", "source_system", "source_system_type", "import_type", "input_format", "record_count_or_records", "mapping_profile", "source_metadata", "provenance"],
        "warnings": sorted(set(warnings)),
        "blockers": sorted(set(blockers)),
        "recommended_action": recommended_action,
        "import_ready": import_ready,
        "records_written": False,
        "external_call_made": False,
        "normalized_final": False,
        "truth_verified": False,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
        "mapping_profile": mapping_profile,
        "source_metadata": source_metadata,
        "provenance": provenance,
        "metadata": metadata,
    }
    return {
        "ok": True,
        "layer": "batch_import",
        "batch_import": result,
        "warnings": result["warnings"],
        "blockers": result["blockers"],
        "import_ready": import_ready,
        "records_written": False,
        "external_call_made": False,
        "normalized_final": False,
        "truth_verified": False,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
    }


def batch_evaluate_imports(records: Any) -> Dict[str, Any]:
    items = records if isinstance(records, list) else []
    evaluations = [evaluate_batch_import(item if isinstance(item, dict) else {}) for item in items]
    batches = [item["batch_import"] for item in evaluations]
    target_layer_counts: Dict[str, int] = {}
    import_type_counts: Dict[str, int] = {}
    for item in batches:
        target_layer_counts[item["target_layer"]] = target_layer_counts.get(item["target_layer"], 0) + 1
        import_type_counts[item["import_type"]] = import_type_counts.get(item["import_type"], 0) + 1
    return {
        "ok": True,
        "layer": "batch_import",
        "total_batches": len(batches),
        "blocked": sum(1 for item in batches if item["batch_status"] == "blocked"),
        "needs_review": sum(1 for item in batches if item["batch_status"] == "needs_review"),
        "import_ready": sum(1 for item in batches if item["import_ready"]),
        "total_records_seen": sum(item["record_count"] for item in batches),
        "accepted_record_count": sum(item["accepted_record_count"] for item in batches),
        "quarantined_record_count": sum(item["quarantined_record_count"] for item in batches),
        "row_warning_count": sum(item["row_warning_count"] for item in batches),
        "row_blocker_count": sum(item["row_blocker_count"] for item in batches),
        "records_written_count": 0,
        "external_call_made_count": 0,
        "normalized_final_count": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "target_layer_counts": target_layer_counts,
        "import_type_counts": import_type_counts,
        "evaluations": evaluations,
    }


def batch_import_schema() -> Dict[str, Any]:
    return {
        "ok": True,
        "layer": "batch_import",
        "source_system_types": list(SOURCE_SYSTEM_TYPES),
        "import_types": list(IMPORT_TYPES),
        "input_formats": list(INPUT_FORMATS),
        "batch_statuses": ["blocked", "needs_review", "import_ready"],
        "result_fields": [
            "batch_review_id",
            "batch_id",
            "batch_name",
            "source_system",
            "import_type",
            "input_format",
            "batch_status",
            "record_count",
            "accepted_record_count",
            "quarantined_record_count",
            "row_warning_count",
            "row_blocker_count",
            "target_layer",
            "warnings",
            "blockers",
            "recommended_action",
            "import_ready",
            "records_written",
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
    return batch_evaluate_imports(
        [
            {
                "batch_import": {
                    "batch_id": "batch_clientops_001",
                    "batch_name": "ClientOps Export",
                    "source_system": "SHS ClientOps",
                    "source_system_type": "clientops",
                    "import_type": "json",
                    "input_format": "inline_records",
                    "records": [{"source_id": "clientops-1", "canonical_type": "client_record"}],
                    "mapping_profile": "shs_clientops_record",
                    "source_metadata": {"source_name": "ClientOps"},
                    "provenance": {"exported_by": "shs_ops"},
                }
            },
            {
                "batch_import": {
                    "batch_id": "batch_partner_001",
                    "batch_name": "Partner Dataset",
                    "source_system": "Partner Dataset",
                    "source_system_type": "partner_feed",
                    "import_type": "partner_dataset",
                    "input_format": "csv",
                    "record_count": 25,
                    "mapping_profile": "partner_feed_record",
                    "source_metadata": {"source_name": "Partner"},
                    "provenance": {"submitted_by": "partner"},
                }
            },
            {
                "batch_import": {
                    "batch_id": "",
                    "source_system": "",
                    "source_system_type": "unknown",
                    "import_type": "unknown",
                    "input_format": "unknown",
                    "record_count": 0,
                }
            },
        ]
    )


def batch_import_summary() -> Dict[str, Any]:
    sample = _sample_evaluations()
    return {
        "policy_status": "formalized_v1",
        "total_batches": sample["total_batches"],
        "blocked": sample["blocked"],
        "needs_review": sample["needs_review"],
        "import_ready": sample["import_ready"],
        "total_records_seen": sample["total_records_seen"],
        "accepted_record_count": sample["accepted_record_count"],
        "quarantined_record_count": sample["quarantined_record_count"],
        "row_warning_count": sample["row_warning_count"],
        "row_blocker_count": sample["row_blocker_count"],
        "records_written_count": 0,
        "external_call_made_count": 0,
        "normalized_final_count": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "target_layer_counts": sample["target_layer_counts"],
        "import_type_counts": sample["import_type_counts"],
        "writes_records": False,
        "calls_external_systems": False,
        "normalizes_final_data": False,
        "verifies_truth": False,
        "approves_public_data": False,
        "mutates_shf_impact_data": False,
        "publishes_reports": False,
        "replaces_adapter_layer": False,
        "replaces_source_registry": False,
        "replaces_data_aggregator": False,
        "replaces_data_normalization": False,
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def batch_import_readiness() -> Dict[str, Any]:
    summary = batch_import_summary()
    return {
        "ok": True,
        "layer": "batch_import",
        "blocked": summary["blocked"],
        "needs_review": summary["needs_review"],
        "import_ready": summary["import_ready"],
        "records_written_count": 0,
        "external_call_made_count": 0,
        "normalized_final_count": 0,
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "writes_records": False,
        "calls_external_systems": False,
        "normalizes_final_data": False,
    }


def batch_import_health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "batch_import",
        "status": "formalized_v1",
        "summary": batch_import_summary(),
    }
