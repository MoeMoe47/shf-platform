from __future__ import annotations

import hashlib
import json
from collections import Counter
from typing import Any, Dict, List, Tuple


SUPPORTED_LAYERS = [
    "source_registry",
    "data_federation",
    "data_aggregator",
    "data_normalization",
    "evidence_package",
    "data_verification",
    "truth_spine",
    "oracle",
    "data_approval",
    "data_approval_gateway",
    "shf_impact_data_spine",
    "reports",
    "watchtower",
]

SUPPORTED_TRANSITIONS = [
    ("source_registry", "data_federation"),
    ("data_federation", "data_aggregator"),
    ("data_aggregator", "data_normalization"),
    ("data_normalization", "evidence_package"),
    ("evidence_package", "data_verification"),
    ("data_verification", "truth_spine"),
    ("truth_spine", "oracle"),
    ("oracle", "data_approval"),
    ("data_approval", "data_approval_gateway"),
    ("data_approval_gateway", "shf_impact_data_spine"),
    ("reports", "watchtower"),
    ("watchtower", "reports"),
]

LAYER_ALIASES = {
    "source registry": "source_registry",
    "data federation": "data_federation",
    "data aggregator": "data_aggregator",
    "data normalization": "data_normalization",
    "evidence package": "evidence_package",
    "data verification": "data_verification",
    "truth spine": "truth_spine",
    "oracle layer": "oracle",
    "oracle": "oracle",
    "data approval": "data_approval",
    "data approval gateway": "data_approval_gateway",
    "shf impact data spine": "shf_impact_data_spine",
    "reports": "reports",
    "watchtower": "watchtower",
}

POST_EVIDENCE_LAYERS = {
    "evidence_package",
    "data_verification",
    "truth_spine",
    "oracle",
    "data_approval",
    "data_approval_gateway",
    "shf_impact_data_spine",
    "reports",
    "watchtower",
}

BOUNDARY_WARNINGS = [
    "Readiness Gate evaluates whether an output can move to the next layer.",
    "Readiness Gate does not verify truth, create Truth Spine claims, public-approve data, override Truth Spine, override Oracle, replace Data Approval Gateway, replace Audit & Verification, replace Watchtower, or mutate SHF Impact Data Spine.",
]


def _clean_str(value: Any) -> str:
    return str(value or "").strip()


def _canonical_json(value: Dict[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _gate_id(payload: Dict[str, Any]) -> str:
    digest = hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()[:16]
    return f"readiness_gate_{digest}"


def _request(payload: Dict[str, Any]) -> Dict[str, Any]:
    request = payload.get("gate") if isinstance(payload.get("gate"), dict) else payload
    return dict(request or {})


def _normalize_layer(value: Any) -> str:
    raw = _clean_str(value).lower().replace("-", "_")
    raw = "_".join(raw.split())
    if raw in SUPPORTED_LAYERS:
        return raw
    return LAYER_ALIASES.get(_clean_str(value).lower(), raw)


def _transition_key(from_layer: str, to_layer: str) -> str:
    return f"{from_layer}->{to_layer}"


def _bool_input(inputs: Dict[str, Any], name: str) -> bool:
    value = inputs.get(name)
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "pass", "passed", "ready"}
    return bool(value)


def _required_checks_for_transition(from_layer: str, to_layer: str) -> List[str]:
    checks = [
        "gate_id_present",
        "from_layer_present",
        "to_layer_present",
        "subject_id_present",
        "supported_transition",
    ]
    if from_layer in POST_EVIDENCE_LAYERS or to_layer in POST_EVIDENCE_LAYERS:
        checks.append("audit_ref_present")
    if (from_layer, to_layer) in {
        ("data_normalization", "evidence_package"),
        ("evidence_package", "data_verification"),
        ("data_verification", "truth_spine"),
        ("truth_spine", "oracle"),
    }:
        checks.append("evidence_ref_present")
    if (from_layer, to_layer) in {("truth_spine", "oracle"), ("oracle", "data_approval")}:
        checks.append("truth_ref_present")
    if (from_layer, to_layer) == ("oracle", "data_approval"):
        checks.append("oracle_ref_present")
    if (from_layer, to_layer) in {
        ("data_approval", "data_approval_gateway"),
        ("data_approval_gateway", "shf_impact_data_spine"),
    }:
        checks.append("approval_ref_present")
    return checks


def _check_status(
    request: Dict[str, Any],
    from_layer: str,
    to_layer: str,
    required_checks: List[str],
) -> Tuple[List[str], List[str], List[str], List[str], str]:
    passed: List[str] = []
    failed: List[str] = []
    warnings: List[str] = []
    blockers: List[str] = []
    blocker_owner_layer = ""

    values = {
        "gate_id_present": _clean_str(request.get("gate_id")),
        "from_layer_present": _clean_str(request.get("from_layer")),
        "to_layer_present": _clean_str(request.get("to_layer")),
        "subject_id_present": _clean_str(request.get("subject_id")),
        "supported_transition": (from_layer, to_layer) in SUPPORTED_TRANSITIONS,
        "audit_ref_present": _clean_str(request.get("audit_ref")),
        "evidence_ref_present": _clean_str(request.get("evidence_ref")),
        "truth_ref_present": _clean_str(request.get("truth_ref")),
        "oracle_ref_present": _clean_str(request.get("oracle_ref")),
        "approval_ref_present": _clean_str(request.get("approval_ref")),
    }

    hard_block_checks = {
        "gate_id_present",
        "from_layer_present",
        "to_layer_present",
        "subject_id_present",
        "evidence_ref_present",
        "truth_ref_present",
        "oracle_ref_present",
    }
    review_checks = {"supported_transition", "audit_ref_present", "approval_ref_present"}

    for check in required_checks:
        if values.get(check):
            passed.append(check)
            continue
        failed.append(check)
        if check in hard_block_checks:
            blockers.append(f"missing_{check.removesuffix('_present')}")
        elif check in review_checks:
            warnings.append(f"missing_or_review_{check.removesuffix('_present')}")

    if _clean_str(request.get("from_layer")) and from_layer not in SUPPORTED_LAYERS:
        warnings.append("unknown_from_layer")
        if "supported_transition" not in failed:
            failed.append("supported_transition")
    if _clean_str(request.get("to_layer")) and to_layer not in SUPPORTED_LAYERS:
        warnings.append("unknown_to_layer")
        if "supported_transition" not in failed:
            failed.append("supported_transition")
    if (from_layer, to_layer) not in SUPPORTED_TRANSITIONS and from_layer in SUPPORTED_LAYERS and to_layer in SUPPORTED_LAYERS:
        warnings.append("unsupported_transition")
        if "supported_transition" not in failed:
            failed.append("supported_transition")

    readiness_inputs = request.get("readiness_inputs") if isinstance(request.get("readiness_inputs"), dict) else {}
    for name, value in readiness_inputs.items():
        check_name = f"input_{name}"
        if _bool_input(readiness_inputs, name):
            passed.append(check_name)
        else:
            failed.append(check_name)
            warnings.append(f"readiness_input_not_ready_{name}")
            if value is False:
                blockers.append(f"readiness_input_failed_{name}")

    if blockers:
        blocker_owner_layer = from_layer or "readiness_gate"
    elif warnings:
        blocker_owner_layer = to_layer or "readiness_gate"

    return passed, sorted(set(failed)), sorted(set(warnings)), sorted(set(blockers)), blocker_owner_layer


def _score(required_checks: List[str], passed_checks: List[str], warnings: List[str], blockers: List[str]) -> int:
    if not required_checks:
        return 0
    required_passed = len([check for check in required_checks if check in passed_checks])
    score = int((required_passed / len(required_checks)) * 100)
    score -= len(warnings) * 4
    score -= len(blockers) * 12
    return max(0, min(100, score))


def _recommended_action(gate_status: str, blockers: List[str], warnings: List[str], owner: str) -> str:
    if gate_status == "ready":
        return "allow_transition_to_next_layer"
    if blockers:
        return f"resolve_blockers_with_{owner or 'producing_layer'}"
    if warnings:
        return f"review_transition_with_{owner or 'target_layer'}"
    return "review_transition"


def evaluate_gate(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    source = dict(payload or {})
    request = _request(source)
    gate_id = _clean_str(request.get("gate_id"))
    from_layer = _normalize_layer(request.get("from_layer"))
    to_layer = _normalize_layer(request.get("to_layer"))
    subject_id = _clean_str(request.get("subject_id"))
    subject_type = _clean_str(request.get("subject_type") or "unknown")

    required_checks = _required_checks_for_transition(from_layer, to_layer)
    passed_checks, failed_checks, warnings, blockers, blocker_owner_layer = _check_status(
        request,
        from_layer,
        to_layer,
        required_checks,
    )
    readiness_score = _score(required_checks, passed_checks, warnings, blockers)

    if blockers:
        gate_status = "blocked"
    elif warnings or failed_checks:
        gate_status = "needs_review"
    else:
        gate_status = "ready"

    can_move_forward = gate_status == "ready"
    result_gate_id = gate_id or _gate_id(
        {
            "from_layer": from_layer,
            "to_layer": to_layer,
            "subject_id": subject_id,
            "subject_type": subject_type,
        }
    )
    gate = {
        "gate_id": result_gate_id,
        "from_layer": from_layer,
        "to_layer": to_layer,
        "subject_id": subject_id,
        "subject_type": subject_type,
        "gate_status": gate_status,
        "readiness_score": readiness_score,
        "required_checks": required_checks,
        "passed_checks": sorted(set(passed_checks)),
        "failed_checks": failed_checks,
        "warnings": warnings,
        "blockers": blockers,
        "blocker_owner_layer": blocker_owner_layer,
        "recommended_action": _recommended_action(gate_status, blockers, warnings, blocker_owner_layer),
        "can_move_forward": can_move_forward,
        "truth_verified": False,
        "public_approved": False,
        "mutated_public_data": False,
    }
    return {
        "ok": True,
        "layer": "readiness_gate",
        "gate": gate,
        "warnings": warnings,
        "blockers": blockers,
        "readiness_score": readiness_score,
        "can_move_forward": can_move_forward,
        "truth_verified": False,
        "public_approved": False,
        "mutated_public_data": False,
    }


def batch_evaluate_gates(records: Any) -> Dict[str, Any]:
    items = records if isinstance(records, list) else []
    evaluations = [evaluate_gate(item if isinstance(item, dict) else {}) for item in items]
    statuses = [item["gate"]["gate_status"] for item in evaluations]
    coverage: Counter[str] = Counter()
    for item in evaluations:
        gate = item["gate"]
        coverage[_transition_key(gate["from_layer"] or "unknown", gate["to_layer"] or "unknown")] += 1
    return {
        "ok": True,
        "layer": "readiness_gate",
        "total": len(evaluations),
        "blocked": statuses.count("blocked"),
        "needs_review": statuses.count("needs_review"),
        "ready": statuses.count("ready"),
        "can_move_forward_count": sum(1 for item in evaluations if item["can_move_forward"]),
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "coverage_by_transition": dict(sorted(coverage.items())),
        "evaluations": evaluations,
    }


def readiness_gate_schema() -> Dict[str, Any]:
    return {
        "ok": True,
        "layer": "readiness_gate",
        "supported_layers": list(SUPPORTED_LAYERS),
        "supported_transitions": [_transition_key(source, target) for source, target in SUPPORTED_TRANSITIONS],
        "gate_statuses": ["blocked", "needs_review", "ready"],
        "gate_request_fields": [
            "gate_id",
            "from_layer",
            "to_layer",
            "subject_id",
            "subject_type",
            "readiness_inputs",
            "audit_ref",
            "evidence_ref",
            "truth_ref",
            "oracle_ref",
            "approval_ref",
        ],
        "gate_result_fields": [
            "gate_id",
            "from_layer",
            "to_layer",
            "subject_id",
            "gate_status",
            "readiness_score",
            "required_checks",
            "passed_checks",
            "failed_checks",
            "warnings",
            "blockers",
            "blocker_owner_layer",
            "recommended_action",
            "can_move_forward",
            "truth_verified",
            "public_approved",
            "mutated_public_data",
        ],
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def _sample_evaluations() -> Dict[str, Any]:
    return batch_evaluate_gates(
        [
            {
                "gate": {
                    "gate_id": "gate_source_to_federation",
                    "from_layer": "source_registry",
                    "to_layer": "data_federation",
                    "subject_id": "source_group_001",
                    "subject_type": "source_group",
                    "readiness_inputs": {"source_registry_complete": True},
                }
            },
            {
                "gate": {
                    "gate_id": "gate_truth_to_oracle_needs_review",
                    "from_layer": "truth_spine",
                    "to_layer": "oracle",
                    "subject_id": "claim_001",
                    "subject_type": "claim",
                    "evidence_ref": "evidence/package/claim_001",
                    "truth_ref": "truth/package/claim_001",
                }
            },
            {
                "gate": {
                    "from_layer": "oracle",
                    "to_layer": "data_approval",
                    "subject_id": "claim_002",
                    "subject_type": "claim",
                    "audit_ref": "audit/event/claim_002",
                    "truth_ref": "truth/package/claim_002",
                }
            },
        ]
    )


def readiness_gate_summary() -> Dict[str, Any]:
    sample = _sample_evaluations()
    return {
        "policy_status": "formalized_v1",
        "total_gate_evaluations": sample["total"],
        "blocked": sample["blocked"],
        "needs_review": sample["needs_review"],
        "ready": sample["ready"],
        "can_move_forward_count": sample["can_move_forward_count"],
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "verifies_truth": False,
        "approves_public_data": False,
        "mutates_shf_impact_data": False,
        "supported_transitions": [_transition_key(source, target) for source, target in SUPPORTED_TRANSITIONS],
        "coverage_by_transition": sample["coverage_by_transition"],
        "boundary_warnings": list(BOUNDARY_WARNINGS),
    }


def readiness_gate_readiness() -> Dict[str, Any]:
    summary = readiness_gate_summary()
    return {
        "ok": True,
        "layer": "readiness_gate",
        "blocked": summary["blocked"],
        "needs_review": summary["needs_review"],
        "ready": summary["ready"],
        "can_move_forward_count": summary["can_move_forward_count"],
        "truth_verified_count": 0,
        "public_approved_count": 0,
        "mutated_public_data_count": 0,
        "verifies_truth": False,
    }


def readiness_gate_health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "readiness_gate",
        "status": "formalized_v1",
        "summary": readiness_gate_summary(),
    }
