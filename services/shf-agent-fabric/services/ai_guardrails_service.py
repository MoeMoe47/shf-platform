from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from services.truth_spine_service import build_truth_package


SERVICE_ROOT = Path(__file__).resolve().parents[1]
AI_GUARDRAILS_DB_DIR = SERVICE_ROOT / "db" / "ai_guardrails"
POLICIES_PATH = AI_GUARDRAILS_DB_DIR / "policies.json"
DECISIONS_PATH = AI_GUARDRAILS_DB_DIR / "decisions.json"
AUDIT_LOG_PATH = SERVICE_ROOT / "logs" / "ai_guardrails.audit.log"

ALLOWED_DECISIONS = {
    "allowed",
    "allowed_with_limits",
    "blocked",
    "requires_truth_review",
    "requires_oracle_review",
    "requires_alignment_approval",
}

TRUTH_TRIGGER_WORDS = ("verified", "proven", "guaranteed", "public-approved", "public approved", "official", "report-ready", "report ready")
PUBLIC_ACTION_WORDS = ("publish", "public", "publicize", "release")
REPORT_ACTION_WORDS = ("export", "report", "snapshot")
ORACLE_ACTION_WORDS = ("rule", "ruling", "decide", "decision", "reject")
ALIGNMENT_ACTION_WORDS = ("execute", "approve", "escalate", "intervention", "trigger", "send")
RANK_ACTION_WORDS = ("rank", "score")

DEFAULT_POLICIES = [
    {
        "policy_id": "ai_guardrail_truth_spine_v1",
        "title": "Truth Spine Required",
        "description": "AI may draft, summarize, and inspect, but verified/public/report-ready claims require Truth Spine metadata.",
        "status": "active",
    },
    {
        "policy_id": "ai_guardrail_oracle_v1",
        "title": "Oracle Required For Rulings",
        "description": "AI may not issue final rulings; evidence-support decisions must defer to Oracle.",
        "status": "active",
    },
    {
        "policy_id": "ai_guardrail_alignment_v1",
        "title": "Alignment Required For Actions",
        "description": "AI may not execute, approve, reject, escalate, or publish actions without infrastructure approval.",
        "status": "active",
    },
]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure_storage() -> None:
    AI_GUARDRAILS_DB_DIR.mkdir(parents=True, exist_ok=True)
    AUDIT_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not POLICIES_PATH.exists():
        POLICIES_PATH.write_text(json.dumps(DEFAULT_POLICIES, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    if not DECISIONS_PATH.exists():
        DECISIONS_PATH.write_text("[]\n", encoding="utf-8")


def _read_list(path: Path) -> List[Dict[str, Any]]:
    _ensure_storage()
    try:
        data = json.loads(path.read_text(encoding="utf-8") or "[]")
    except json.JSONDecodeError:
        return []
    return data if isinstance(data, list) else []


def _write_list(path: Path, items: List[Dict[str, Any]]) -> None:
    _ensure_storage()
    path.write_text(json.dumps(items, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def _audit(action: str, entity_id: str, payload: Optional[Dict[str, Any]] = None) -> None:
    _ensure_storage()
    event = {
        "ts": _now(),
        "action": action,
        "entity_type": "ai_guardrail",
        "entity_id": entity_id,
        "payload": payload or {},
    }
    with AUDIT_LOG_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(event, sort_keys=True) + "\n")


def _clean_string(value: Any) -> str:
    return str(value or "").strip()


def _clean_list(value: Any) -> List[str]:
    if not isinstance(value, list):
        return []
    out: List[str] = []
    for item in value:
        cleaned = _clean_string(item)
        if cleaned and cleaned not in out:
            out.append(cleaned)
    return out


def _contains_any(text: str, words: tuple[str, ...]) -> bool:
    lowered = text.lower()
    return any(word in lowered for word in words)


def list_policies() -> List[Dict[str, Any]]:
    return _read_list(POLICIES_PATH)


def list_decisions() -> List[Dict[str, Any]]:
    return _read_list(DECISIONS_PATH)


def get_decision(decision_id: str) -> Optional[Dict[str, Any]]:
    return next((decision for decision in list_decisions() if decision.get("decision_id") == decision_id), None)


def _truth_package_status(claim_ids: List[str]) -> Dict[str, Any]:
    packages: List[Dict[str, Any]] = []
    missing_claim_ids: List[str] = []
    package_warnings: List[str] = []
    for claim_id in claim_ids:
        package = build_truth_package(claim_id)
        if not package:
            missing_claim_ids.append(claim_id)
            continue
        packages.append(package)
        for warning in package.get("warnings") or []:
            package_warnings.append(f"{claim_id}:{warning}")

    all_verified = bool(packages) and not missing_claim_ids and all(
        package.get("verification_status") == "verified" and package.get("trust_level") in {"verified", "public_approved"}
        for package in packages
    )
    all_report_ready = bool(packages) and all(package.get("report_ready") is True for package in packages)
    all_public_approved = bool(packages) and all(package.get("public_approved") is True for package in packages)

    return {
        "packages": packages,
        "missing_claim_ids": missing_claim_ids,
        "warnings": package_warnings,
        "all_verified": all_verified,
        "all_report_ready": all_report_ready,
        "all_public_approved": all_public_approved,
    }


def _normalize_check(payload: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "check_id": _clean_string(payload.get("check_id") or f"ai_check_{uuid.uuid4().hex[:12]}"),
        "app_id": _clean_string(payload.get("app_id") or "shs"),
        "agent_id": _clean_string(payload.get("agent_id") or "unknown_agent"),
        "user_id": _clean_string(payload.get("user_id") or "unknown_user"),
        "output_type": _clean_string(payload.get("output_type") or "draft"),
        "output_text": _clean_string(payload.get("output_text")),
        "requested_action": _clean_string(payload.get("requested_action") or "draft"),
        "claim_ids": _clean_list(payload.get("claim_ids", [])),
        "oracle_case_ids": _clean_list(payload.get("oracle_case_ids", [])),
        "risk_level": _clean_string(payload.get("risk_level") or "low"),
        "created_at": _now(),
    }


def check_ai_output(payload: Dict[str, Any]) -> Dict[str, Any]:
    check = _normalize_check(payload or {})
    output_text = check["output_text"]
    action_text = check["requested_action"]
    combined = f"{output_text} {action_text} {check['output_type']}"
    truth_status = _truth_package_status(check["claim_ids"])
    warnings = list(truth_status["warnings"])

    truth_required = False
    oracle_required = False
    alignment_required = False
    public_publish_allowed = False
    report_export_allowed = False
    required_layer = "AI/Swarm Layer"
    allowed_actions = ["draft_internal_text", "summarize", "inspect", "recommend_next_steps"]
    blocked_actions: List[str] = []

    has_truth_language = _contains_any(combined, TRUTH_TRIGGER_WORDS)
    wants_public = _contains_any(action_text, PUBLIC_ACTION_WORDS) or _contains_any(output_text, ("public-approved", "public approved"))
    wants_report = _contains_any(action_text, REPORT_ACTION_WORDS)
    wants_oracle = _contains_any(action_text, ORACLE_ACTION_WORDS)
    wants_alignment = _contains_any(action_text, ALIGNMENT_ACTION_WORDS)
    wants_rank = _contains_any(action_text, RANK_ACTION_WORDS)

    if has_truth_language and not truth_status["all_verified"]:
        truth_required = True
        required_layer = "Truth Spine"
        warnings.append("truth_language_without_verified_claims")

    if wants_public:
        truth_required = True
        required_layer = "Truth Spine"
        if truth_status["all_public_approved"]:
            public_publish_allowed = True
        else:
            blocked_actions.append("public_publish")
            warnings.append("public_publish_requires_public_approved_truth_package")

    if wants_report:
        truth_required = True
        required_layer = "Reports"
        if truth_status["all_report_ready"]:
            report_export_allowed = True
        else:
            blocked_actions.append("report_export")
            warnings.append("report_export_requires_report_ready_truth_package")

    if wants_oracle:
        oracle_required = True
        required_layer = "Oracle Layer"
        blocked_actions.append("final_ruling")
        warnings.append("oracle_ruling_required")

    if wants_alignment:
        alignment_required = True
        required_layer = "Alignment Layer"
        blocked_actions.append("execute_or_approve_action")
        warnings.append("alignment_l25_l26_required")

    if wants_rank:
        required_layer = "LOO"
        blocked_actions.append("rank_outcome")
        warnings.append("loo_required_for_ranking")

    missing_claims = truth_status["missing_claim_ids"]
    if missing_claims:
        truth_required = True
        required_layer = "Truth Spine"
        warnings.append("missing_truth_package")

    if alignment_required:
        decision = "requires_alignment_approval"
        reason = "AI requested execution/approval/escalation behavior that must pass Alignment L25/L26."
    elif oracle_required:
        decision = "requires_oracle_review"
        reason = "AI requested ruling/decision behavior that must defer to Oracle."
    elif truth_required and blocked_actions:
        decision = "blocked"
        reason = "AI requested public/report/truth-sensitive output without required Truth Spine approval."
    elif truth_required:
        decision = "requires_truth_review"
        reason = "AI output uses verified/public/official language without verified Truth Spine packages."
    elif warnings or blocked_actions:
        decision = "allowed_with_limits"
        reason = "AI output may continue only as internal draft/recommendation with listed limits."
    else:
        decision = "allowed"
        reason = "AI output is limited to internal drafting, summarizing, inspection, or recommendation."

    if decision in {"blocked", "requires_truth_review", "requires_oracle_review", "requires_alignment_approval"}:
        allowed_actions = ["draft_internal_text", "revise_with_required_metadata"]

    record = {
        "decision_id": f"ai_guardrail_decision_{uuid.uuid4().hex[:12]}",
        "check_id": check["check_id"],
        "check": check,
        "decision": decision if decision in ALLOWED_DECISIONS else "blocked",
        "reason": reason,
        "required_layer": required_layer,
        "allowed_actions": allowed_actions,
        "blocked_actions": blocked_actions,
        "warnings": warnings,
        "truth_required": truth_required,
        "oracle_required": oracle_required,
        "alignment_required": alignment_required,
        "public_publish_allowed": public_publish_allowed,
        "report_export_allowed": report_export_allowed,
        "created_at": _now(),
        "truth_package_summary": {
            "claim_ids": check["claim_ids"],
            "package_hashes": [package.get("package_hash") for package in truth_status["packages"] if package.get("package_hash")],
            "missing_claim_ids": missing_claims,
            "all_verified": truth_status["all_verified"],
            "all_report_ready": truth_status["all_report_ready"],
            "all_public_approved": truth_status["all_public_approved"],
        },
    }

    decisions = list_decisions()
    decisions.append(record)
    _write_list(DECISIONS_PATH, decisions)
    _audit("decision.created", record["decision_id"], {"decision": record["decision"], "required_layer": record["required_layer"]})
    return record


def ai_guardrails_summary() -> Dict[str, Any]:
    decisions = list_decisions()
    review_decisions = {"requires_truth_review", "requires_oracle_review", "requires_alignment_approval"}
    return {
        "ok": True,
        "policy_status": "active",
        "policies_total": len(list_policies()),
        "decisions_total": len(decisions),
        "blocked": len([decision for decision in decisions if decision.get("decision") == "blocked"]),
        "blocked_count": len([decision for decision in decisions if decision.get("decision") == "blocked"]),
        "requires_truth_review": len([decision for decision in decisions if decision.get("decision") == "requires_truth_review"]),
        "requires_oracle_review": len([decision for decision in decisions if decision.get("decision") == "requires_oracle_review"]),
        "requires_alignment_approval": len([decision for decision in decisions if decision.get("decision") == "requires_alignment_approval"]),
        "review_required_count": len([decision for decision in decisions if decision.get("decision") in review_decisions]),
    }


def audit_feed(limit: int = 100) -> List[Dict[str, Any]]:
    _ensure_storage()
    if not AUDIT_LOG_PATH.exists():
        return []
    lines = AUDIT_LOG_PATH.read_text(encoding="utf-8").splitlines()
    events: List[Dict[str, Any]] = []
    for line in lines[-max(1, int(limit)):]:
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(event, dict):
            events.append(event)
    return events
