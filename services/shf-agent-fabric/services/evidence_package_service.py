from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, List


SUPPORTED_PACKAGE_TYPES = [
    "county",
    "program",
    "metric",
    "story",
    "organization",
    "source",
    "evidence",
    "unknown",
]

REQUIRED_PACKAGE_COMPONENTS = [
    "canonical_type",
    "normalized_record",
    "source_metadata",
    "provenance",
]

DOWNSTREAM_TARGETS = [
    "Truth Spine",
    "Oracle",
    "Reports",
    "Watchtower",
    "LOO",
    "Data Approval Gateway",
    "SHF Impact Data Spine",
]

BOUNDARY_WARNINGS = [
    "Evidence Package prepares review-ready packages only.",
    "Evidence Package does not verify truth, public-approve data, override Truth Spine, override Oracle, publish reports, or mutate SHF Impact Data Spine.",
]


def _clean_str(value: Any) -> str:
    return str(value or "").strip()


def _clean_refs(value: Any) -> List[Dict[str, Any]]:
    if not isinstance(value, list):
        return []
    refs: List[Dict[str, Any]] = []
    for index, item in enumerate(value):
        if isinstance(item, dict):
            ref = {
                "ref_id": _clean_str(item.get("ref_id") or item.get("id") or f"evidence_ref_{index + 1}"),
                "title": _clean_str(item.get("title") or item.get("name") or f"Evidence reference {index + 1}"),
                "uri": _clean_str(item.get("uri") or item.get("url") or item.get("source_url")),
                "evidence_type": _clean_str(item.get("evidence_type") or item.get("type") or "reference"),
            }
        else:
            ref = {
                "ref_id": f"evidence_ref_{index + 1}",
                "title": _clean_str(item) or f"Evidence reference {index + 1}",
                "uri": "",
                "evidence_type": "reference",
            }
        refs.append(ref)
    return refs


def _canonical_json(value: Dict[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _package_id(payload: Dict[str, Any]) -> str:
    digest = hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()[:16]
    return f"evidence_pkg_{digest}"


def _source_metadata(payload: Dict[str, Any], provenance: Dict[str, Any]) -> Dict[str, Any]:
    source_metadata = payload.get("source_metadata") if isinstance(payload.get("source_metadata"), dict) else {}
    return {
        "source_id": _clean_str(source_metadata.get("source_id") or provenance.get("source_id")),
        "source_name": _clean_str(source_metadata.get("source_name") or source_metadata.get("title") or provenance.get("source_name")),
        "source_url": _clean_str(source_metadata.get("source_url") or source_metadata.get("uri") or provenance.get("source_url")),
        "source_type": _clean_str(source_metadata.get("source_type") or payload.get("source_type")),
    }


def _provenance(payload: Dict[str, Any]) -> Dict[str, Any]:
    provenance = payload.get("provenance") if isinstance(payload.get("provenance"), dict) else {}
    return {
        "source_id": _clean_str(provenance.get("source_id") or payload.get("source_id")),
        "source_name": _clean_str(provenance.get("source_name") or payload.get("source_name")),
        "source_url": _clean_str(provenance.get("source_url") or payload.get("source_url")),
        "provenance": _clean_str(provenance.get("provenance") or payload.get("provenance")),
    }


def _completeness_score(
    canonical_type: str,
    normalized_record: Dict[str, Any],
    source_metadata: Dict[str, Any],
    provenance: Dict[str, Any],
    evidence_refs: List[Dict[str, Any]],
) -> int:
    score = 0
    if canonical_type and canonical_type != "unknown":
        score += 20
    if normalized_record:
        score += 25
    if source_metadata.get("source_id") or source_metadata.get("source_name") or source_metadata.get("source_url"):
        score += 20
    if provenance.get("provenance") and (provenance.get("source_name") or provenance.get("source_url")):
        score += 25
    if evidence_refs:
        score += 10
    return min(100, score)


def build_evidence_package(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    record = dict(payload or {})
    canonical_type = _clean_str(record.get("canonical_type") or record.get("input_type") or "unknown").lower()
    if canonical_type not in SUPPORTED_PACKAGE_TYPES:
        canonical_type = "unknown"
    normalized_record = record.get("normalized_record") if isinstance(record.get("normalized_record"), dict) else {}
    provenance = _provenance(record)
    source_metadata = _source_metadata(record, provenance)
    evidence_refs = _clean_refs(record.get("evidence_refs"))
    warnings: List[str] = []
    blockers: List[str] = []

    if canonical_type == "unknown":
        warnings.append("unknown_canonical_type")
        blockers.append("missing_canonical_type")
    if not normalized_record:
        warnings.append("missing_normalized_record")
        blockers.append("missing_normalized_record")
    if not (source_metadata.get("source_id") or source_metadata.get("source_name") or source_metadata.get("source_url")):
        warnings.append("missing_source_metadata")
        blockers.append("missing_source_metadata")
    if not provenance.get("provenance"):
        warnings.append("missing_provenance")
        blockers.append("missing_provenance")
    if not evidence_refs:
        warnings.append("missing_evidence_refs")

    package_basis = {
        "canonical_type": canonical_type,
        "normalized_record": normalized_record,
        "source_metadata": source_metadata,
        "provenance": provenance,
        "evidence_refs": evidence_refs,
    }
    completeness_score = _completeness_score(canonical_type, normalized_record, source_metadata, provenance, evidence_refs)
    ready_for_truth_spine = not blockers

    package = {
        "package_id": _package_id(package_basis),
        "canonical_type": canonical_type,
        "normalized_record": normalized_record,
        "source_metadata": source_metadata,
        "provenance": provenance,
        "evidence_refs": evidence_refs,
        "warnings": warnings,
        "blockers": blockers,
        "completeness_score": completeness_score,
        "ready_for_truth_spine": ready_for_truth_spine,
        "ready_for_public_approval": False,
        "verifies_truth": False,
    }

    return {
        "ok": True,
        "layer": "evidence_package",
        "package": package,
        "warnings": warnings,
        "blockers": blockers,
        "completeness_score": completeness_score,
        "ready_for_truth_spine": ready_for_truth_spine,
        "ready_for_public_approval": False,
        "verifies_truth": False,
        "downstream_targets": list(DOWNSTREAM_TARGETS),
    }


def batch_build_evidence_packages(records: Any) -> Dict[str, Any]:
    items = records if isinstance(records, list) else []
    packages = [build_evidence_package(item if isinstance(item, dict) else {}) for item in items]
    ready = [item for item in packages if item["ready_for_truth_spine"]]
    blocked = [item for item in packages if item["blockers"]]
    return {
        "ok": True,
        "layer": "evidence_package",
        "total": len(packages),
        "complete_packages": len(ready),
        "incomplete_packages": len(blocked),
        "truth_spine_ready": len(ready),
        "public_approval_ready": 0,
        "packages": packages,
    }


def evidence_package_schema() -> Dict[str, Any]:
    return {
        "ok": True,
        "layer": "evidence_package",
        "supported_package_types": list(SUPPORTED_PACKAGE_TYPES),
        "required_components": list(REQUIRED_PACKAGE_COMPONENTS),
        "package_fields": [
            "package_id",
            "canonical_type",
            "normalized_record",
            "source_metadata",
            "provenance",
            "evidence_refs",
            "warnings",
            "blockers",
            "completeness_score",
            "ready_for_truth_spine",
            "ready_for_public_approval",
        ],
        "downstream_targets": list(DOWNSTREAM_TARGETS),
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def evidence_package_summary() -> Dict[str, Any]:
    sample_batch = batch_build_evidence_packages(
        [
            {
                "canonical_type": "metric",
                "normalized_record": {"county_name": "Licking", "metric_name": "students_served", "value": 2810},
                "source_metadata": {
                    "source_id": "sample_source",
                    "source_name": "Foundation sample CSV",
                    "source_url": "local://foundation-sample.csv",
                    "source_type": "csv",
                },
                "provenance": {
                    "source_id": "sample_source",
                    "source_name": "Foundation sample CSV",
                    "source_url": "local://foundation-sample.csv",
                    "provenance": "local://foundation-sample",
                },
                "evidence_refs": [{"ref_id": "sample_ref", "title": "Sample CSV row", "uri": "local://foundation-sample.csv"}],
            },
            {
                "canonical_type": "program",
                "normalized_record": {"program_name": "Digital Access"},
                "source_metadata": {"source_name": "Program intake"},
                "evidence_refs": [],
            },
        ]
    )
    packages = sample_batch["packages"]
    missing_provenance = len([item for item in packages if "missing_provenance" in item["warnings"]])
    missing_sources = len([item for item in packages if "missing_source_metadata" in item["warnings"]])
    return {
        "policy_status": "formalized_v1",
        "total_packages": sample_batch["total"],
        "complete_packages": sample_batch["complete_packages"],
        "incomplete_packages": sample_batch["incomplete_packages"],
        "missing_provenance": missing_provenance,
        "missing_sources": missing_sources,
        "truth_spine_ready": sample_batch["truth_spine_ready"],
        "public_approval_ready": 0,
        "verifies_truth": False,
        "approves_public_data": False,
        "downstream_targets": list(DOWNSTREAM_TARGETS),
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def evidence_package_readiness() -> Dict[str, Any]:
    summary = evidence_package_summary()
    return {
        "ok": True,
        "layer": "evidence_package",
        "truth_spine_ready": summary["truth_spine_ready"],
        "blocked": summary["incomplete_packages"],
        "public_approval_ready": 0,
        "verifies_truth": False,
    }


def evidence_package_health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "evidence_package",
        "status": "formalized_v1",
        "summary": evidence_package_summary(),
    }
