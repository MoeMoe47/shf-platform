from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, List


APPROVAL_STATES = ["blocked", "needs_review", "gateway_ready", "public_ready_candidate"]
SUPPORTABLE_TRUTH_STATUSES = {"verified", "trusted", "supported", "public_approved", "report_ready"}
SUPPORTABLE_ORACLE_STATUSES = {"supportable", "supported", "supports", "approved_support"}
READY_DATA_VERIFICATION_STATUSES = {"ready_for_truth_spine", "ready", "verified_ready"}

BOUNDARY_WARNINGS = [
    "Data Approval evaluates approval readiness only.",
    "Data Approval does not verify truth, override Truth Spine, override Oracle, directly publish public-approved records, or mutate SHF Impact Data Spine.",
]


def _clean_str(value: Any) -> str:
    return str(value or "").strip()


def _canonical_json(value: Dict[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _approval_id(payload: Dict[str, Any]) -> str:
    digest = hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()[:16]
    return f"data_approval_{digest}"


def _candidate(payload: Dict[str, Any]) -> Dict[str, Any]:
    candidate = payload.get("candidate") if isinstance(payload.get("candidate"), dict) else payload
    return dict(candidate or {})


def _truth_status(candidate: Dict[str, Any]) -> str:
    truth = candidate.get("truth_spine") if isinstance(candidate.get("truth_spine"), dict) else {}
    return _clean_str(
        candidate.get("truth_spine_status")
        or candidate.get("truth_status")
        or truth.get("verification_status")
        or truth.get("trust_level")
        or truth.get("status")
    ).lower()


def _oracle_supportability(candidate: Dict[str, Any]) -> str:
    oracle = candidate.get("oracle") if isinstance(candidate.get("oracle"), dict) else {}
    return _clean_str(
        candidate.get("oracle_supportability")
        or candidate.get("oracle_status")
        or oracle.get("supportability")
        or oracle.get("ruling")
        or oracle.get("status")
    ).lower()


def _data_verification_status(candidate: Dict[str, Any]) -> str:
    verification = candidate.get("data_verification") if isinstance(candidate.get("data_verification"), dict) else {}
    return _clean_str(
        candidate.get("data_verification_status")
        or verification.get("verification_status")
        or verification.get("status")
    ).lower()


def _has_truth_support(status: str) -> bool:
    return status in SUPPORTABLE_TRUTH_STATUSES


def _has_oracle_support(status: str) -> bool:
    return status in SUPPORTABLE_ORACLE_STATUSES


def _has_data_verification_ready(status: str) -> bool:
    return status in READY_DATA_VERIFICATION_STATUSES


def _has_evidence(candidate: Dict[str, Any]) -> bool:
    evidence_refs = candidate.get("evidence_refs")
    evidence = candidate.get("evidence")
    return (isinstance(evidence_refs, list) and len(evidence_refs) > 0) or bool(evidence)


def _has_provenance(candidate: Dict[str, Any]) -> bool:
    provenance = candidate.get("provenance")
    if isinstance(provenance, dict):
        return any(_clean_str(value) for value in provenance.values())
    return bool(_clean_str(provenance))


def _readiness_score(
    candidate_id: str,
    truth_status: str,
    oracle_supportability: str,
    data_verification_status: str,
    has_evidence: bool,
    has_provenance: bool,
) -> int:
    score = 0
    if candidate_id:
        score += 15
    if _has_truth_support(truth_status):
        score += 25
    elif truth_status:
        score += 8
    if _has_oracle_support(oracle_supportability):
        score += 20
    elif oracle_supportability:
        score += 8
    if _has_data_verification_ready(data_verification_status):
        score += 15
    elif data_verification_status:
        score += 6
    if has_evidence:
        score += 15
    if has_provenance:
        score += 10
    return min(100, score)


def evaluate_approval(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    source = dict(payload or {})
    candidate = _candidate(source)
    candidate_id = _clean_str(candidate.get("candidate_id") or candidate.get("id"))
    canonical_type = _clean_str(candidate.get("canonical_type") or "unknown")
    truth_status = _truth_status(candidate)
    oracle_supportability = _oracle_supportability(candidate)
    data_verification_status = _data_verification_status(candidate)
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
    elif not _has_truth_support(truth_status):
        warnings.append("truth_spine_not_verified_or_supported")
        blockers.append("truth_spine_not_verified_or_supported")

    if not oracle_supportability:
        warnings.append("missing_oracle_supportability")
    elif oracle_supportability in {"unsupported", "reject", "rejected", "not_supportable"}:
        warnings.append("oracle_unsupported")
        blockers.append("oracle_unsupported")
    elif not _has_oracle_support(oracle_supportability):
        warnings.append("oracle_needs_review")

    if not data_verification_status:
        warnings.append("missing_data_verification_status")
    elif not _has_data_verification_ready(data_verification_status):
        warnings.append("data_verification_not_ready")

    if not has_evidence:
        warnings.append("missing_evidence")
    if not has_provenance:
        warnings.append("missing_provenance")

    readiness_score = _readiness_score(
        candidate_id,
        truth_status,
        oracle_supportability,
        data_verification_status,
        has_evidence,
        has_provenance,
    )

    if blockers:
        approval_state = "blocked"
        recommended_action = "resolve_blockers_before_data_approval_gateway_review"
    elif (
        _has_truth_support(truth_status)
        and _has_oracle_support(oracle_supportability)
        and _has_data_verification_ready(data_verification_status)
        and has_evidence
        and has_provenance
    ):
        approval_state = "gateway_ready"
        recommended_action = "send_to_data_approval_gateway_for_human_review"
    else:
        approval_state = "needs_review"
        recommended_action = "complete_truth_oracle_evidence_review_before_gateway"

    ready_for_gateway = approval_state == "gateway_ready"
    ready_for_public_approval = approval_state == "public_ready_candidate"
    approval = {
        "approval_id": _approval_id(
            {
                "candidate_id": candidate_id,
                "canonical_type": canonical_type,
                "score": readiness_score,
                "approval_state": approval_state,
            }
        ),
        "candidate_id": candidate_id,
        "canonical_type": canonical_type,
        "approval_state": approval_state,
        "readiness_score": readiness_score,
        "truth_spine_status": truth_status,
        "oracle_supportability": oracle_supportability,
        "data_verification_status": data_verification_status,
        "warnings": warnings,
        "blockers": blockers,
        "recommended_action": recommended_action,
        "ready_for_data_approval_gateway": ready_for_gateway,
        "ready_for_public_approval": ready_for_public_approval,
        "public_approved": False,
        "mutated_public_data": False,
    }
    return {
        "ok": True,
        "layer": "data_approval",
        "approval": approval,
        "warnings": warnings,
        "blockers": blockers,
        "readiness_score": readiness_score,
        "ready_for_data_approval_gateway": ready_for_gateway,
        "ready_for_public_approval": ready_for_public_approval,
        "public_approved": False,
        "mutated_public_data": False,
    }


def batch_evaluate_approval(records: Any) -> Dict[str, Any]:
    items = records if isinstance(records, list) else []
    evaluations = [evaluate_approval(item if isinstance(item, dict) else {}) for item in items]
    states = [item["approval"]["approval_state"] for item in evaluations]
    return {
        "ok": True,
        "layer": "data_approval",
        "total": len(evaluations),
        "blocked": states.count("blocked"),
        "needs_review": states.count("needs_review"),
        "gateway_ready": states.count("gateway_ready"),
        "public_ready_candidates": states.count("public_ready_candidate"),
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "evaluations": evaluations,
    }


def data_approval_schema() -> Dict[str, Any]:
    return {
        "ok": True,
        "layer": "data_approval",
        "approval_states": list(APPROVAL_STATES),
        "approval_fields": [
            "approval_id",
            "candidate_id",
            "canonical_type",
            "approval_state",
            "readiness_score",
            "truth_spine_status",
            "oracle_supportability",
            "data_verification_status",
            "warnings",
            "blockers",
            "recommended_action",
            "ready_for_data_approval_gateway",
            "ready_for_public_approval",
            "public_approved",
            "mutated_public_data",
        ],
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def data_approval_summary() -> Dict[str, Any]:
    sample = batch_evaluate_approval(
        [
            {
                "candidate": {
                    "candidate_id": "approval_candidate_gateway_ready",
                    "canonical_type": "metric",
                    "truth_spine_status": "verified",
                    "oracle_supportability": "supportable",
                    "data_verification_status": "ready_for_truth_spine",
                    "evidence_refs": [{"ref_id": "evidence_1", "uri": "local://evidence.csv"}],
                    "provenance": {"source_id": "source_1", "uri": "local://evidence.csv"},
                }
            },
            {
                "candidate": {
                    "candidate_id": "approval_candidate_review",
                    "canonical_type": "program",
                    "truth_spine_status": "verified",
                    "oracle_supportability": "supportable",
                    "evidence_refs": [{"ref_id": "evidence_2", "uri": "local://program.csv"}],
                    "provenance": {"source_id": "source_2", "uri": "local://program.csv"},
                }
            },
            {
                "candidate": {
                    "candidate_id": "approval_candidate_blocked",
                    "canonical_type": "story",
                    "oracle_supportability": "unsupported",
                    "evidence_refs": [],
                    "provenance": {},
                }
            },
        ]
    )
    return {
        "policy_status": "formalized_v1",
        "total_candidates": sample["total"],
        "blocked": sample["blocked"],
        "needs_review": sample["needs_review"],
        "gateway_ready": sample["gateway_ready"],
        "public_ready_candidates": sample["public_ready_candidates"],
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "approves_public_data": False,
        "mutates_shf_impact_data": False,
        "requires_gateway_review": True,
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def data_approval_readiness() -> Dict[str, Any]:
    summary = data_approval_summary()
    return {
        "ok": True,
        "layer": "data_approval",
        "blocked": summary["blocked"],
        "needs_review": summary["needs_review"],
        "gateway_ready": summary["gateway_ready"],
        "public_ready_candidates": summary["public_ready_candidates"],
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "requires_gateway_review": True,
    }


def data_approval_health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "data_approval",
        "status": "formalized_v1",
        "summary": data_approval_summary(),
    }
