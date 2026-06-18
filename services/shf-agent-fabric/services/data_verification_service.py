from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, List


VERIFICATION_STATUSES = ["blocked", "needs_review", "ready_for_truth_spine"]
QUALITY_LEVELS = ["missing", "weak", "acceptable", "strong"]

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
    "Data Verification evaluates readiness only.",
    "Data Verification does not verify truth, create Truth Spine claims, public-approve data, override Truth Spine, override Oracle, publish reports, or mutate SHF Impact Data Spine.",
]


def _clean_str(value: Any) -> str:
    return str(value or "").strip()


def _canonical_json(value: Dict[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _verification_id(payload: Dict[str, Any]) -> str:
    digest = hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()[:16]
    return f"data_verify_{digest}"


def _package(payload: Dict[str, Any]) -> Dict[str, Any]:
    package = payload.get("package") if isinstance(payload.get("package"), dict) else payload
    return dict(package or {})


def _source_metadata(package: Dict[str, Any]) -> Dict[str, Any]:
    value = package.get("source_metadata") if isinstance(package.get("source_metadata"), dict) else {}
    return {
        "source_id": _clean_str(value.get("source_id")),
        "source_name": _clean_str(value.get("source_name") or value.get("title")),
        "source_url": _clean_str(value.get("source_url") or value.get("uri")),
        "source_type": _clean_str(value.get("source_type")),
    }


def _provenance(package: Dict[str, Any]) -> Dict[str, Any]:
    value = package.get("provenance") if isinstance(package.get("provenance"), dict) else {}
    return {
        "source_id": _clean_str(value.get("source_id")),
        "source_name": _clean_str(value.get("source_name")),
        "source_url": _clean_str(value.get("source_url")),
        "provenance": _clean_str(value.get("provenance")),
    }


def _evidence_refs(package: Dict[str, Any]) -> List[Dict[str, Any]]:
    value = package.get("evidence_refs")
    if not isinstance(value, list):
        return []
    refs: List[Dict[str, Any]] = []
    for index, item in enumerate(value):
        if isinstance(item, dict):
            refs.append(
                {
                    "ref_id": _clean_str(item.get("ref_id") or item.get("id") or f"evidence_ref_{index + 1}"),
                    "title": _clean_str(item.get("title") or item.get("name") or f"Evidence reference {index + 1}"),
                    "uri": _clean_str(item.get("uri") or item.get("url") or item.get("source_url")),
                    "evidence_type": _clean_str(item.get("evidence_type") or item.get("type") or "reference"),
                }
            )
    return refs


def _quality(values: List[str], strong_threshold: int) -> str:
    present = len([value for value in values if _clean_str(value)])
    if present == 0:
        return "missing"
    if present < strong_threshold:
        return "weak"
    if present == strong_threshold:
        return "acceptable"
    return "strong"


def _evidence_quality(refs: List[Dict[str, Any]]) -> str:
    if not refs:
        return "missing"
    refs_with_uri = len([ref for ref in refs if ref.get("uri")])
    if len(refs) == 1 and refs_with_uri == 0:
        return "weak"
    if len(refs) == 1:
        return "acceptable"
    return "strong" if refs_with_uri >= 2 else "acceptable"


def _readiness_score(
    package_id: str,
    normalized_record: Dict[str, Any],
    source_quality: str,
    provenance_quality: str,
    evidence_quality: str,
) -> int:
    score = 0
    if package_id:
        score += 15
    if normalized_record:
        score += 20
    score += {"missing": 0, "weak": 8, "acceptable": 16, "strong": 20}[source_quality]
    score += {"missing": 0, "weak": 8, "acceptable": 16, "strong": 20}[provenance_quality]
    score += {"missing": 0, "weak": 8, "acceptable": 16, "strong": 25}[evidence_quality]
    return min(100, score)


def evaluate_verification(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    source = dict(payload or {})
    package = _package(source)
    package_id = _clean_str(package.get("package_id"))
    canonical_type = _clean_str(package.get("canonical_type") or "unknown")
    normalized_record = package.get("normalized_record") if isinstance(package.get("normalized_record"), dict) else {}
    source_metadata = _source_metadata(package)
    provenance = _provenance(package)
    evidence_refs = _evidence_refs(package)
    warnings: List[str] = []
    blockers: List[str] = []

    if not package_id:
        warnings.append("missing_package_id")
        blockers.append("missing_package_id")
    if not normalized_record:
        warnings.append("missing_normalized_record")
        blockers.append("missing_normalized_record")

    source_quality = _quality(
        [source_metadata["source_id"], source_metadata["source_name"], source_metadata["source_url"], source_metadata["source_type"]],
        strong_threshold=3,
    )
    provenance_quality = _quality(
        [provenance["source_id"], provenance["source_name"], provenance["source_url"], provenance["provenance"]],
        strong_threshold=3,
    )
    evidence_quality = _evidence_quality(evidence_refs)

    if source_quality == "missing":
        warnings.append("missing_source_metadata")
        blockers.append("missing_source_metadata")
    elif source_quality == "weak":
        warnings.append("weak_source_metadata")

    if provenance_quality == "missing":
        warnings.append("missing_provenance")
        blockers.append("missing_provenance")
    elif provenance_quality == "weak":
        warnings.append("weak_provenance")

    if evidence_quality == "missing":
        warnings.append("missing_evidence_refs")
    elif evidence_quality == "weak":
        warnings.append("weak_evidence_refs")

    readiness_score = _readiness_score(package_id, normalized_record, source_quality, provenance_quality, evidence_quality)

    if blockers:
        verification_status = "blocked"
        recommended_action = "resolve_blockers_before_truth_spine_review"
    elif evidence_quality in {"missing", "weak"}:
        verification_status = "needs_review"
        recommended_action = "attach_or_review_evidence_refs"
    else:
        verification_status = "ready_for_truth_spine"
        recommended_action = "submit_to_truth_spine_for_review"

    ready_for_truth_spine = verification_status == "ready_for_truth_spine"
    verification = {
        "verification_id": _verification_id({"package_id": package_id, "canonical_type": canonical_type, "score": readiness_score}),
        "package_id": package_id,
        "canonical_type": canonical_type,
        "readiness_score": readiness_score,
        "verification_status": verification_status,
        "source_quality": source_quality,
        "evidence_quality": evidence_quality,
        "provenance_quality": provenance_quality,
        "warnings": warnings,
        "blockers": blockers,
        "recommended_action": recommended_action,
        "ready_for_truth_spine": ready_for_truth_spine,
        "truth_verified": False,
        "ready_for_public_approval": False,
    }
    return {
        "ok": True,
        "layer": "data_verification",
        "verification": verification,
        "warnings": warnings,
        "blockers": blockers,
        "readiness_score": readiness_score,
        "ready_for_truth_spine": ready_for_truth_spine,
        "truth_verified": False,
        "ready_for_public_approval": False,
        "downstream_targets": list(DOWNSTREAM_TARGETS),
    }


def batch_evaluate_verification(records: Any) -> Dict[str, Any]:
    items = records if isinstance(records, list) else []
    evaluations = [evaluate_verification(item if isinstance(item, dict) else {}) for item in items]
    statuses = [item["verification"]["verification_status"] for item in evaluations]
    return {
        "ok": True,
        "layer": "data_verification",
        "total": len(evaluations),
        "blocked": statuses.count("blocked"),
        "needs_review": statuses.count("needs_review"),
        "ready_for_truth_spine": statuses.count("ready_for_truth_spine"),
        "truth_verified_count": 0,
        "public_approval_ready": 0,
        "evaluations": evaluations,
    }


def data_verification_schema() -> Dict[str, Any]:
    return {
        "ok": True,
        "layer": "data_verification",
        "verification_statuses": list(VERIFICATION_STATUSES),
        "quality_levels": list(QUALITY_LEVELS),
        "verification_fields": [
            "verification_id",
            "package_id",
            "canonical_type",
            "readiness_score",
            "verification_status",
            "source_quality",
            "evidence_quality",
            "provenance_quality",
            "warnings",
            "blockers",
            "recommended_action",
            "ready_for_truth_spine",
            "truth_verified",
            "ready_for_public_approval",
        ],
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def data_verification_summary() -> Dict[str, Any]:
    sample = batch_evaluate_verification(
        [
            {
                "package": {
                    "package_id": "evidence_pkg_sample_ready",
                    "canonical_type": "metric",
                    "normalized_record": {"metric_name": "students_served", "value": 2810},
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
                    "evidence_refs": [
                        {"ref_id": "sample_ref_1", "title": "Sample CSV row", "uri": "local://foundation-sample.csv"},
                        {"ref_id": "sample_ref_2", "title": "Sample export manifest", "uri": "local://foundation-manifest.json"},
                    ],
                }
            },
            {
                "package": {
                    "package_id": "evidence_pkg_sample_review",
                    "canonical_type": "program",
                    "normalized_record": {"program_name": "Digital Access"},
                    "source_metadata": {"source_name": "Program intake", "source_url": "local://program-intake"},
                    "provenance": {"source_name": "Program intake", "source_url": "local://program-intake", "provenance": "local://program-intake"},
                    "evidence_refs": [],
                }
            },
            {
                "package": {
                    "canonical_type": "story",
                    "normalized_record": {"story_text": "Missing package id and provenance"},
                    "source_metadata": {},
                    "provenance": {},
                    "evidence_refs": [],
                }
            },
        ]
    )
    return {
        "policy_status": "formalized_v1",
        "total_evaluations": sample["total"],
        "blocked": sample["blocked"],
        "needs_review": sample["needs_review"],
        "ready_for_truth_spine": sample["ready_for_truth_spine"],
        "truth_verified_count": 0,
        "public_approval_ready": 0,
        "verifies_truth": False,
        "approves_public_data": False,
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def data_verification_readiness() -> Dict[str, Any]:
    summary = data_verification_summary()
    return {
        "ok": True,
        "layer": "data_verification",
        "blocked": summary["blocked"],
        "needs_review": summary["needs_review"],
        "ready_for_truth_spine": summary["ready_for_truth_spine"],
        "truth_verified_count": 0,
        "public_approval_ready": 0,
        "verifies_truth": False,
    }


def data_verification_health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "data_verification",
        "status": "formalized_v1",
        "summary": data_verification_summary(),
    }
