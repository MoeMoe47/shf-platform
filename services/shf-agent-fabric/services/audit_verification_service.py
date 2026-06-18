from __future__ import annotations

import hashlib
import json
from collections import Counter, defaultdict
from typing import Any, Dict, List


EVENT_TYPES = [
    "intake",
    "federation",
    "aggregation",
    "normalization",
    "evidence_package",
    "data_verification",
    "truth_review",
    "oracle_review",
    "data_approval",
    "report_snapshot",
    "watchtower_observation",
    "agent_action",
    "unknown",
]

DATA_CHAIN_EVENT_TYPES = {
    "intake",
    "federation",
    "aggregation",
    "normalization",
    "evidence_package",
    "data_verification",
    "truth_review",
    "oracle_review",
    "data_approval",
}

REQUIRED_FIELDS = ["event_id", "event_type", "layer"]
REVIEW_FIELDS = ["actor", "subject_id", "timestamp"]

BOUNDARY_WARNINGS = [
    "Audit Verification evaluates audit completeness, traceability, and replay readiness only.",
    "Audit Verification does not verify truth, create Truth Spine claims, public-approve data, override Truth Spine, override Oracle, publish reports, replace Watchtower, or mutate SHF Impact Data Spine.",
]


def _clean_str(value: Any) -> str:
    return str(value or "").strip()


def _canonical_json(value: Dict[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _audit_id(payload: Dict[str, Any]) -> str:
    digest = hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()[:16]
    return f"audit_verify_{digest}"


def _event(payload: Dict[str, Any]) -> Dict[str, Any]:
    event = payload.get("event") if isinstance(payload.get("event"), dict) else payload
    return dict(event or {})


def _event_type(event: Dict[str, Any]) -> str:
    value = _clean_str(event.get("event_type")).lower()
    return value if value in EVENT_TYPES else "unknown"


def _refs(value: Any) -> List[Dict[str, Any]]:
    if not isinstance(value, list):
        return []
    refs: List[Dict[str, Any]] = []
    for index, item in enumerate(value):
        if isinstance(item, dict):
            refs.append(
                {
                    "ref_id": _clean_str(item.get("ref_id") or item.get("id") or f"ref_{index + 1}"),
                    "uri": _clean_str(item.get("uri") or item.get("url") or item.get("source_url")),
                    "title": _clean_str(item.get("title") or item.get("name")),
                }
            )
        elif _clean_str(item):
            refs.append({"ref_id": _clean_str(item), "uri": "", "title": ""})
    return refs


def _provenance(event: Dict[str, Any]) -> Dict[str, Any]:
    value = event.get("provenance")
    if isinstance(value, dict):
        return dict(value)
    if _clean_str(value):
        return {"provenance": _clean_str(value)}
    return {}


def _completeness_score(event: Dict[str, Any], missing_fields: List[str], warnings: List[str], blockers: List[str]) -> int:
    fields = [
        "event_id",
        "event_type",
        "layer",
        "actor",
        "subject_id",
        "timestamp",
        "input_ref",
        "output_ref",
    ]
    score = sum(8 for field in fields if _clean_str(event.get(field)))
    if _refs(event.get("source_refs")):
        score += 12
    if _refs(event.get("evidence_refs")):
        score += 12
    if _provenance(event):
        score += 12
    score -= len(missing_fields) * 4
    score -= len(warnings) * 2
    score -= len(blockers) * 8
    return max(0, min(100, score))


def evaluate_audit_event(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    source = dict(payload or {})
    event = _event(source)
    event_id = _clean_str(event.get("event_id"))
    event_type = _event_type(event)
    layer = _clean_str(event.get("layer"))
    actor = _clean_str(event.get("actor"))
    subject_id = _clean_str(event.get("subject_id"))
    input_ref = _clean_str(event.get("input_ref"))
    output_ref = _clean_str(event.get("output_ref"))
    source_refs = _refs(event.get("source_refs"))
    evidence_refs = _refs(event.get("evidence_refs"))
    provenance = _provenance(event)
    decision_before = _clean_str(event.get("decision_before"))
    decision_after = _clean_str(event.get("decision_after"))
    timestamp = _clean_str(event.get("timestamp"))
    warnings: List[str] = []
    blockers: List[str] = []
    missing_fields: List[str] = []

    for field in REQUIRED_FIELDS:
        if field == "event_type":
            if not _clean_str(event.get("event_type")):
                missing_fields.append(field)
                blockers.append(f"missing_{field}")
            elif event_type == "unknown":
                warnings.append("unknown_event_type")
            continue
        if not _clean_str(event.get(field)):
            missing_fields.append(field)
            blockers.append(f"missing_{field}")

    for field in REVIEW_FIELDS:
        if not _clean_str(event.get(field)):
            missing_fields.append(field)
            warnings.append(f"missing_{field}")

    if not source_refs and not evidence_refs:
        warnings.append("missing_source_or_evidence_refs")
    if event_type in DATA_CHAIN_EVENT_TYPES and not provenance:
        warnings.append("missing_provenance")
    if decision_before and not decision_after:
        warnings.append("missing_decision_after")

    completeness_score = _completeness_score(event, missing_fields, warnings, blockers)
    if blockers:
        audit_status = "blocked"
    elif warnings:
        audit_status = "needs_review"
    else:
        audit_status = "audit_ready"

    trace_ready = audit_status == "audit_ready"
    replay_ready = trace_ready and bool(input_ref and output_ref)
    audit = {
        "audit_id": _audit_id({"event_id": event_id, "event_type": event_type, "layer": layer, "score": completeness_score}),
        "event_id": event_id,
        "layer": layer,
        "event_type": event_type,
        "audit_status": audit_status,
        "completeness_score": completeness_score,
        "missing_fields": missing_fields,
        "warnings": warnings,
        "blockers": blockers,
        "trace_ready": trace_ready,
        "replay_ready": replay_ready,
        "truth_verified": False,
        "public_approved": False,
    }
    canonical_event = {
        "event_id": event_id,
        "event_type": event_type,
        "layer": layer,
        "actor": actor,
        "subject_id": subject_id,
        "input_ref": input_ref,
        "output_ref": output_ref,
        "source_refs": source_refs,
        "evidence_refs": evidence_refs,
        "provenance": provenance,
        "decision_before": decision_before,
        "decision_after": decision_after,
        "timestamp": timestamp,
        "warnings": warnings,
        "blockers": blockers,
        "audit_complete": audit_status == "audit_ready",
        "truth_verified": False,
        "public_approved": False,
    }
    return {
        "ok": True,
        "layer": "audit_verification",
        "event": canonical_event,
        "audit": audit,
        "warnings": warnings,
        "blockers": blockers,
        "completeness_score": completeness_score,
        "trace_ready": trace_ready,
        "replay_ready": replay_ready,
        "truth_verified": False,
        "public_approved": False,
    }


def batch_evaluate_audit_events(records: Any) -> Dict[str, Any]:
    items = records if isinstance(records, list) else []
    evaluations = [evaluate_audit_event(item if isinstance(item, dict) else {}) for item in items]
    statuses = [item["audit"]["audit_status"] for item in evaluations]
    coverage: dict[str, int] = defaultdict(int)
    missing_trace_fields: Counter[str] = Counter()
    for item in evaluations:
        layer = item["audit"]["layer"] or "unknown"
        coverage[layer] += 1
        missing_trace_fields.update(item["audit"]["missing_fields"])
    return {
        "ok": True,
        "layer": "audit_verification",
        "total": len(evaluations),
        "blocked": statuses.count("blocked"),
        "needs_review": statuses.count("needs_review"),
        "audit_ready": statuses.count("audit_ready"),
        "trace_ready": sum(1 for item in evaluations if item["trace_ready"]),
        "replay_ready": sum(1 for item in evaluations if item["replay_ready"]),
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "coverage_by_layer": dict(sorted(coverage.items())),
        "missing_trace_fields": dict(sorted(missing_trace_fields.items())),
        "evaluations": evaluations,
    }


def audit_verification_schema() -> Dict[str, Any]:
    return {
        "ok": True,
        "layer": "audit_verification",
        "event_types": list(EVENT_TYPES),
        "audit_statuses": ["blocked", "needs_review", "audit_ready"],
        "audit_event_fields": [
            "event_id",
            "event_type",
            "layer",
            "actor",
            "subject_id",
            "input_ref",
            "output_ref",
            "source_refs",
            "evidence_refs",
            "provenance",
            "decision_before",
            "decision_after",
            "timestamp",
            "warnings",
            "blockers",
            "audit_complete",
            "truth_verified",
            "public_approved",
        ],
        "audit_result_fields": [
            "audit_id",
            "event_id",
            "layer",
            "event_type",
            "audit_status",
            "completeness_score",
            "missing_fields",
            "warnings",
            "blockers",
            "trace_ready",
            "replay_ready",
            "truth_verified",
            "public_approved",
        ],
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def _sample_evaluations() -> Dict[str, Any]:
    return batch_evaluate_audit_events(
        [
            {
                "event": {
                    "event_id": "audit_event_truth_ready",
                    "event_type": "truth_review",
                    "layer": "Truth Spine",
                    "actor": "truth_spine_service",
                    "subject_id": "claim_001",
                    "input_ref": "truth/package/claim_001",
                    "output_ref": "truth/envelope/claim_001",
                    "source_refs": [{"ref_id": "source_001", "uri": "local://source.json"}],
                    "evidence_refs": [{"ref_id": "evidence_001", "uri": "local://evidence.json"}],
                    "provenance": {"source_id": "source_001", "trace": "local://source.json"},
                    "decision_before": "draft",
                    "decision_after": "verified",
                    "timestamp": "2026-01-01T00:00:00Z",
                }
            },
            {
                "event": {
                    "event_id": "audit_event_review",
                    "event_type": "data_approval",
                    "layer": "Data Approval",
                    "actor": "data_approval_service",
                    "subject_id": "candidate_001",
                    "source_refs": [{"ref_id": "source_002"}],
                    "timestamp": "2026-01-01T00:00:00Z",
                }
            },
            {
                "event": {
                    "event_type": "aggregation",
                    "layer": "Data Aggregator",
                    "subject_id": "intake_001",
                }
            },
        ]
    )


def audit_verification_summary() -> Dict[str, Any]:
    sample = _sample_evaluations()
    return {
        "policy_status": "formalized_v1",
        "total_events": sample["total"],
        "blocked": sample["blocked"],
        "needs_review": sample["needs_review"],
        "audit_ready": sample["audit_ready"],
        "trace_ready": sample["trace_ready"],
        "replay_ready": sample["replay_ready"],
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "verifies_truth": False,
        "approves_public_data": False,
        "mutates_shf_impact_data": False,
        "coverage_by_layer": sample["coverage_by_layer"],
        "missing_trace_fields": sample["missing_trace_fields"],
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def audit_verification_readiness() -> Dict[str, Any]:
    summary = audit_verification_summary()
    return {
        "ok": True,
        "layer": "audit_verification",
        "blocked": summary["blocked"],
        "needs_review": summary["needs_review"],
        "audit_ready": summary["audit_ready"],
        "trace_ready": summary["trace_ready"],
        "replay_ready": summary["replay_ready"],
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "verifies_truth": False,
    }


def audit_verification_health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "audit_verification",
        "status": "formalized_v1",
        "summary": audit_verification_summary(),
    }
