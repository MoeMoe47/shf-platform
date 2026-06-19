from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, List


PUBLIC_RELEASE_STATES = ["blocked", "needs_review", "public_ready_candidate"]
SUPPORTABLE_TRUTH_STATUSES = {"verified", "trusted", "supported", "public_approved", "report_ready"}
SUPPORTABLE_ORACLE_STATUSES = {"supportable", "supported", "supports", "approved_support"}
PUBLIC_READY_DATA_APPROVAL_STATES = {"gateway_ready", "public_ready_candidate"}
GATEWAY_APPROVED_STATUSES = {"approved", "review_complete", "human_approved", "gateway_approved"}
READY_GATE_STATUSES = {"ready", "approved", "passed"}
PRIVACY_CLEAR_STATUSES = {"clear", "approved", "pass", "passed", "review_complete", "no_pii"}
SECURITY_CLEAR_STATUSES = {"clear", "approved", "pass", "passed", "review_complete"}

BOUNDARY_WARNINGS = [
    "Public Approval evaluates public release readiness only.",
    "Public Approval does not verify truth, create Truth Spine claims, override Truth Spine, override Oracle, write final public approval, publish reports, or mutate SHF Impact Data Spine.",
]


def _clean_str(value: Any) -> str:
    return str(value or "").strip()


def _canonical_json(value: Dict[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _public_approval_id(payload: Dict[str, Any]) -> str:
    digest = hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()[:16]
    return f"public_approval_{digest}"


def _candidate(payload: Dict[str, Any]) -> Dict[str, Any]:
    candidate = payload.get("candidate") if isinstance(payload.get("candidate"), dict) else payload
    return dict(candidate or {})


def _nested_status(candidate: Dict[str, Any], key: str, *fields: str) -> str:
    value = candidate.get(key) if isinstance(candidate.get(key), dict) else {}
    for field in fields:
        if _clean_str(candidate.get(field)):
            return _clean_str(candidate.get(field)).lower()
        if _clean_str(value.get(field)):
            return _clean_str(value.get(field)).lower()
    return ""


def _truth_status(candidate: Dict[str, Any]) -> str:
    return _nested_status(
        candidate,
        "truth_spine",
        "truth_spine_status",
        "truth_status",
        "verification_status",
        "trust_level",
        "status",
    )


def _oracle_supportability(candidate: Dict[str, Any]) -> str:
    return _nested_status(
        candidate,
        "oracle",
        "oracle_supportability",
        "oracle_status",
        "supportability",
        "ruling",
        "status",
    )


def _data_approval_state(candidate: Dict[str, Any]) -> str:
    return _nested_status(
        candidate,
        "data_approval",
        "data_approval_state",
        "approval_state",
        "status",
    )


def _gateway_status(candidate: Dict[str, Any]) -> str:
    return _nested_status(
        candidate,
        "data_approval_gateway",
        "gateway_status",
        "data_approval_gateway_status",
        "approval_gateway_status",
        "status",
    )


def _readiness_gate_status(candidate: Dict[str, Any]) -> str:
    return _nested_status(
        candidate,
        "readiness_gate",
        "readiness_gate_status",
        "gate_status",
        "status",
    )


def _privacy_status(candidate: Dict[str, Any]) -> str:
    return _nested_status(
        candidate,
        "privacy",
        "privacy_review_status",
        "privacy_status",
        "status",
    )


def _security_status(candidate: Dict[str, Any]) -> str:
    return _nested_status(
        candidate,
        "security",
        "security_review_status",
        "security_status",
        "status",
    )


def _has_evidence(candidate: Dict[str, Any]) -> bool:
    evidence_refs = candidate.get("evidence_refs")
    evidence = candidate.get("evidence")
    evidence_ref = candidate.get("evidence_ref")
    return (isinstance(evidence_refs, list) and len(evidence_refs) > 0) or bool(evidence) or bool(_clean_str(evidence_ref))


def _has_provenance(candidate: Dict[str, Any]) -> bool:
    provenance = candidate.get("provenance")
    if isinstance(provenance, dict):
        return any(_clean_str(value) for value in provenance.values())
    return bool(_clean_str(provenance))


def _status_blocks(status: str) -> bool:
    return status in {"failed", "fail", "blocked", "rejected", "unsafe", "unsupported", "not_supportable"}


def _readiness_score(
    candidate_id: str,
    truth_status: str,
    oracle_supportability: str,
    data_approval_state: str,
    gateway_status: str,
    readiness_gate_status: str,
    has_evidence: bool,
    has_provenance: bool,
    privacy_status: str,
    security_status: str,
) -> int:
    score = 0
    if candidate_id:
        score += 10
    if truth_status in SUPPORTABLE_TRUTH_STATUSES:
        score += 18
    elif truth_status:
        score += 5
    if oracle_supportability in SUPPORTABLE_ORACLE_STATUSES:
        score += 14
    elif oracle_supportability:
        score += 5
    if data_approval_state in PUBLIC_READY_DATA_APPROVAL_STATES:
        score += 14
    elif data_approval_state:
        score += 5
    if gateway_status in GATEWAY_APPROVED_STATUSES:
        score += 16
    elif gateway_status:
        score += 5
    if readiness_gate_status in READY_GATE_STATUSES:
        score += 10
    elif readiness_gate_status:
        score += 4
    if has_evidence:
        score += 8
    if has_provenance:
        score += 5
    if privacy_status in PRIVACY_CLEAR_STATUSES:
        score += 3
    if security_status in SECURITY_CLEAR_STATUSES:
        score += 2
    return min(100, score)


def evaluate_public_approval(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    source = dict(payload or {})
    candidate = _candidate(source)
    candidate_id = _clean_str(candidate.get("candidate_id") or candidate.get("id"))
    canonical_type = _clean_str(candidate.get("canonical_type") or "unknown")
    truth_status = _truth_status(candidate)
    oracle_supportability = _oracle_supportability(candidate)
    data_approval_state = _data_approval_state(candidate)
    gateway_status = _gateway_status(candidate)
    readiness_gate_status = _readiness_gate_status(candidate)
    privacy_status = _privacy_status(candidate)
    security_status = _security_status(candidate)
    has_evidence = _has_evidence(candidate)
    has_provenance = _has_provenance(candidate)
    warnings: List[str] = []
    blockers: List[str] = []

    if not candidate_id:
        warnings.append("missing_candidate_id")
        blockers.append("missing_candidate_id")

    if not truth_status:
        warnings.append("missing_truth_spine_status")
        blockers.append("missing_truth_spine_status")
    elif truth_status not in SUPPORTABLE_TRUTH_STATUSES:
        warnings.append("truth_spine_not_verified_or_supported")
        if _status_blocks(truth_status):
            blockers.append("truth_spine_not_verified_or_supported")

    if not oracle_supportability:
        warnings.append("missing_oracle_supportability")
    elif oracle_supportability not in SUPPORTABLE_ORACLE_STATUSES:
        warnings.append("oracle_not_supportable")
        if _status_blocks(oracle_supportability):
            blockers.append("oracle_not_supportable")

    if not data_approval_state:
        warnings.append("missing_data_approval_state")
        blockers.append("missing_data_approval_state")
    elif data_approval_state not in PUBLIC_READY_DATA_APPROVAL_STATES:
        warnings.append("data_approval_not_gateway_ready")
        if data_approval_state in {"blocked", "rejected", "failed"}:
            blockers.append("data_approval_not_gateway_ready")

    if not gateway_status:
        warnings.append("missing_gateway_status")
        blockers.append("missing_gateway_status")
    elif gateway_status not in GATEWAY_APPROVED_STATUSES:
        warnings.append("gateway_not_approved_or_review_complete")
        if _status_blocks(gateway_status):
            blockers.append("gateway_not_approved_or_review_complete")

    if not readiness_gate_status:
        warnings.append("missing_readiness_gate_status")
    elif readiness_gate_status not in READY_GATE_STATUSES:
        warnings.append("readiness_gate_not_ready")
        if _status_blocks(readiness_gate_status):
            blockers.append("readiness_gate_not_ready")

    if not has_evidence:
        warnings.append("missing_evidence")
    if not has_provenance:
        warnings.append("missing_provenance")
        blockers.append("missing_provenance")

    if not privacy_status:
        warnings.append("missing_privacy_review_status")
    elif privacy_status not in PRIVACY_CLEAR_STATUSES:
        warnings.append("privacy_review_not_clear")
        if _status_blocks(privacy_status):
            blockers.append("privacy_review_not_clear")

    if not security_status:
        warnings.append("missing_security_review_status")
    elif security_status not in SECURITY_CLEAR_STATUSES:
        warnings.append("security_review_not_clear")
        if _status_blocks(security_status):
            blockers.append("security_review_not_clear")

    readiness_score = _readiness_score(
        candidate_id,
        truth_status,
        oracle_supportability,
        data_approval_state,
        gateway_status,
        readiness_gate_status,
        has_evidence,
        has_provenance,
        privacy_status,
        security_status,
    )

    if blockers:
        public_release_state = "blocked"
        recommended_action = "resolve_public_release_blockers_before_gateway_completion"
    elif warnings:
        public_release_state = "needs_review"
        recommended_action = "complete_public_release_review_before_candidate_status"
    else:
        public_release_state = "public_ready_candidate"
        recommended_action = "eligible_for_human_public_release_decision"

    ready_candidate = public_release_state == "public_ready_candidate"
    approval = {
        "public_approval_id": _public_approval_id({"candidate_id": candidate_id, "canonical_type": canonical_type, "score": readiness_score}),
        "candidate_id": candidate_id,
        "canonical_type": canonical_type,
        "public_release_state": public_release_state,
        "readiness_score": readiness_score,
        "truth_spine_status": truth_status,
        "oracle_supportability": oracle_supportability,
        "data_approval_state": data_approval_state,
        "gateway_status": gateway_status,
        "readiness_gate_status": readiness_gate_status,
        "privacy_review_status": privacy_status,
        "security_review_status": security_status,
        "warnings": warnings,
        "blockers": blockers,
        "recommended_action": recommended_action,
        "ready_for_public_release_candidate": ready_candidate,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
    }
    return {
        "ok": True,
        "layer": "public_approval",
        "public_approval": approval,
        "warnings": warnings,
        "blockers": blockers,
        "readiness_score": readiness_score,
        "ready_for_public_release_candidate": ready_candidate,
        "public_approved": False,
        "mutated_public_data": False,
        "published_report": False,
    }


def batch_evaluate_public_approval(records: Any) -> Dict[str, Any]:
    items = records if isinstance(records, list) else []
    evaluations = [evaluate_public_approval(item if isinstance(item, dict) else {}) for item in items]
    states = [item["public_approval"]["public_release_state"] for item in evaluations]
    return {
        "ok": True,
        "layer": "public_approval",
        "total": len(evaluations),
        "blocked": states.count("blocked"),
        "needs_review": states.count("needs_review"),
        "public_ready_candidates": states.count("public_ready_candidate"),
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "evaluations": evaluations,
    }


def public_approval_schema() -> Dict[str, Any]:
    return {
        "ok": True,
        "layer": "public_approval",
        "public_release_states": list(PUBLIC_RELEASE_STATES),
        "candidate_fields": [
            "candidate_id",
            "canonical_type",
            "truth_spine_status",
            "oracle_supportability",
            "data_approval_state",
            "gateway_status",
            "readiness_gate_status",
            "evidence_refs",
            "provenance",
            "privacy_review_status",
            "security_review_status",
        ],
        "result_fields": [
            "public_approval_id",
            "candidate_id",
            "canonical_type",
            "public_release_state",
            "readiness_score",
            "truth_spine_status",
            "oracle_supportability",
            "data_approval_state",
            "gateway_status",
            "readiness_gate_status",
            "privacy_review_status",
            "security_review_status",
            "warnings",
            "blockers",
            "recommended_action",
            "ready_for_public_release_candidate",
            "public_approved",
            "mutated_public_data",
            "published_report",
        ],
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def _sample_evaluations() -> Dict[str, Any]:
    return batch_evaluate_public_approval(
        [
            {
                "candidate": {
                    "candidate_id": "public_candidate_ready",
                    "canonical_type": "impact_metric",
                    "truth_spine_status": "verified",
                    "oracle_supportability": "supportable",
                    "data_approval_state": "gateway_ready",
                    "gateway_status": "review_complete",
                    "readiness_gate_status": "ready",
                    "evidence_refs": [{"ref_id": "evidence_001"}],
                    "provenance": {"source_id": "source_001"},
                    "privacy_review_status": "clear",
                    "security_review_status": "clear",
                }
            },
            {
                "candidate": {
                    "candidate_id": "public_candidate_needs_review",
                    "canonical_type": "impact_story",
                    "truth_spine_status": "verified",
                    "oracle_supportability": "supportable",
                    "data_approval_state": "gateway_ready",
                    "gateway_status": "review_complete",
                    "provenance": {"source_id": "source_002"},
                    "privacy_review_status": "clear",
                    "security_review_status": "clear",
                }
            },
            {
                "candidate": {
                    "candidate_id": "public_candidate_blocked",
                    "canonical_type": "impact_metric",
                    "truth_spine_status": "draft",
                    "data_approval_state": "blocked",
                    "gateway_status": "blocked",
                    "privacy_review_status": "failed",
                    "security_review_status": "clear",
                }
            },
        ]
    )


def public_approval_summary() -> Dict[str, Any]:
    sample = _sample_evaluations()
    return {
        "policy_status": "formalized_v1",
        "total_candidates": sample["total"],
        "blocked": sample["blocked"],
        "needs_review": sample["needs_review"],
        "public_ready_candidates": sample["public_ready_candidates"],
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "approves_public_data": False,
        "mutates_shf_impact_data": False,
        "publishes_reports": False,
        "requires_gateway_review": True,
        "requires_human_review": True,
        "requires_privacy_review": True,
        "requires_security_review": True,
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def public_approval_readiness() -> Dict[str, Any]:
    summary = public_approval_summary()
    return {
        "ok": True,
        "layer": "public_approval",
        "blocked": summary["blocked"],
        "needs_review": summary["needs_review"],
        "public_ready_candidates": summary["public_ready_candidates"],
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "published_report_count": 0,
        "approves_public_data": False,
        "requires_gateway_review": True,
        "requires_human_review": True,
    }


def public_approval_health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "public_approval",
        "status": "formalized_v1",
        "summary": public_approval_summary(),
    }
