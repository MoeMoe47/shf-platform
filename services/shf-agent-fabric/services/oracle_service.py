from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from services.truth_spine_service import build_truth_package


SERVICE_ROOT = Path(__file__).resolve().parents[1]
ORACLE_DB_DIR = SERVICE_ROOT / "db" / "oracle"
CASES_PATH = ORACLE_DB_DIR / "cases.json"
RULINGS_PATH = ORACLE_DB_DIR / "rulings.json"
AUDIT_LOG_PATH = SERVICE_ROOT / "logs" / "oracle.audit.log"

ALLOWED_DECISIONS = {"supportable", "unsupported", "disputed", "insufficient_evidence"}
NEGATIVE_TEXT_MARKERS = {"not", "no ", "never", "declined", "decreased", "failed", "cannot", "did not"}
POSITIVE_TEXT_MARKERS = {"is ", "are ", "reached", "increased", "completed", "achieved", "can ", "did "}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure_storage() -> None:
    ORACLE_DB_DIR.mkdir(parents=True, exist_ok=True)
    AUDIT_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not CASES_PATH.exists():
        CASES_PATH.write_text("[]\n", encoding="utf-8")
    if not RULINGS_PATH.exists():
        RULINGS_PATH.write_text("[]\n", encoding="utf-8")


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


def _audit(action: str, entity_type: str, entity_id: str, payload: Optional[Dict[str, Any]] = None) -> None:
    _ensure_storage()
    event = {
        "ts": _now(),
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "payload": payload or {},
    }
    with AUDIT_LOG_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(event, sort_keys=True) + "\n")


def _clean_string(value: Any) -> str:
    return str(value or "").strip()


def _clean_claim_ids(value: Any) -> List[str]:
    if not isinstance(value, list):
        return []
    out: List[str] = []
    for item in value:
        claim_id = _clean_string(item)
        if claim_id and claim_id not in out:
            out.append(claim_id)
    return out


def _int_0_100(value: Any) -> int:
    try:
        numeric = int(float(value))
    except (TypeError, ValueError):
        numeric = 0
    return max(0, min(100, numeric))


def _normalize_case(payload: Dict[str, Any], existing: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    now = _now()
    existing = existing or {}
    case_id = _clean_string(payload.get("case_id") or existing.get("case_id") or f"oracle_case_{uuid.uuid4().hex[:12]}")
    return {
        "case_id": case_id,
        "case_type": _clean_string(payload.get("case_type") or existing.get("case_type") or "adjudication"),
        "title": _clean_string(payload.get("title") or existing.get("title") or "Untitled Oracle case"),
        "question": _clean_string(payload.get("question") or existing.get("question") or "What does verified evidence support?"),
        "claim_ids": _clean_claim_ids(payload.get("claim_ids", existing.get("claim_ids", []))),
        "requested_by": _clean_string(payload.get("requested_by") or existing.get("requested_by") or "shs-admin"),
        "status": _clean_string(payload.get("status") or existing.get("status") or "open"),
        "created_at": _clean_string(existing.get("created_at") or payload.get("created_at") or now),
        "updated_at": now,
    }


def list_cases() -> List[Dict[str, Any]]:
    return _read_list(CASES_PATH)


def list_rulings() -> List[Dict[str, Any]]:
    return _read_list(RULINGS_PATH)


def get_case(case_id: str) -> Optional[Dict[str, Any]]:
    return next((case for case in list_cases() if case.get("case_id") == case_id), None)


def get_ruling(ruling_id: str) -> Optional[Dict[str, Any]]:
    return next((ruling for ruling in list_rulings() if ruling.get("ruling_id") == ruling_id), None)


def get_case_ruling(case_id: str) -> Optional[Dict[str, Any]]:
    rulings = [ruling for ruling in list_rulings() if ruling.get("case_id") == case_id]
    if not rulings:
        return None
    return sorted(rulings, key=lambda ruling: str(ruling.get("created_at") or ""))[-1]


def create_case(payload: Dict[str, Any]) -> Dict[str, Any]:
    cases = list_cases()
    existing = next((case for case in cases if case.get("case_id") == payload.get("case_id")), None)
    oracle_case = _normalize_case(payload, existing=existing)
    cases = [item for item in cases if item.get("case_id") != oracle_case["case_id"]]
    cases.append(oracle_case)
    _write_list(CASES_PATH, cases)
    _audit("case.upserted", "oracle_case", oracle_case["case_id"], {"claim_ids": oracle_case["claim_ids"]})
    return oracle_case


def _claim_package_for_case(claim_id: str) -> Optional[Dict[str, Any]]:
    return build_truth_package(claim_id)


def _has_metric_conflict(packages: List[Dict[str, Any]]) -> bool:
    seen: Dict[str, Any] = {}
    for package in packages:
        claim = package.get("claim") if isinstance(package.get("claim"), dict) else {}
        metric_name = _clean_string(claim.get("metric_name"))
        if not metric_name:
            continue
        metric_value = claim.get("metric_value")
        if metric_name in seen and seen[metric_name] != metric_value:
            return True
        seen[metric_name] = metric_value
    return False


def _has_text_conflict(packages: List[Dict[str, Any]]) -> bool:
    texts = [
        _clean_string((package.get("claim") or {}).get("claim_text")).lower()
        for package in packages
        if isinstance(package.get("claim"), dict)
    ]
    if len(texts) < 2:
        return False
    has_negative = any(any(marker in text for marker in NEGATIVE_TEXT_MARKERS) for text in texts)
    has_positive = any(any(marker in text for marker in POSITIVE_TEXT_MARKERS) for text in texts)
    return has_negative and has_positive


def _confidence(packages: List[Dict[str, Any]], warnings: List[str], missing_count: int) -> int:
    if not packages:
        return 20
    average_trace = round(sum(_int_0_100(package.get("trace_coverage")) for package in packages) / len(packages))
    public_bonus = 8 if all(package.get("public_approved") is True for package in packages) else 0
    ready_bonus = 10 if all(package.get("report_ready") is True for package in packages) else 0
    warning_penalty = min(35, len(warnings) * 7)
    missing_penalty = missing_count * 20
    return _int_0_100(average_trace + public_bonus + ready_bonus - warning_penalty - missing_penalty)


def _evidence_summary(packages: List[Dict[str, Any]], missing_claim_ids: List[str]) -> Dict[str, Any]:
    return {
        "package_count": len(packages),
        "missing_claim_ids": missing_claim_ids,
        "package_hashes": [package.get("package_hash") for package in packages if package.get("package_hash")],
        "claim_ids": [package.get("claim_id") for package in packages],
        "report_ready_count": len([package for package in packages if package.get("report_ready") is True]),
        "public_approved_count": len([package for package in packages if package.get("public_approved") is True]),
    }


def rule_case(case_id: str) -> Optional[Dict[str, Any]]:
    oracle_case = get_case(case_id)
    if not oracle_case:
        return None

    claim_ids = _clean_claim_ids(oracle_case.get("claim_ids"))
    packages: List[Dict[str, Any]] = []
    missing_claim_ids: List[str] = []
    warnings: List[str] = []

    for claim_id in claim_ids:
        package = _claim_package_for_case(claim_id)
        if not package:
            missing_claim_ids.append(claim_id)
            warnings.append(f"missing_truth_package:{claim_id}")
            continue
        packages.append(package)
        for warning in package.get("warnings") or []:
            warning_text = _clean_string(warning)
            if warning_text:
                warnings.append(f"{claim_id}:{warning_text}")

    draft_like = [
        package
        for package in packages
        if package.get("verification_status") != "verified" or package.get("report_ready") is not True
    ]

    if not claim_ids:
        decision = "insufficient_evidence"
        reasoning = "No Truth Spine claim_ids were supplied, so Oracle cannot reason over verified evidence."
    elif missing_claim_ids:
        decision = "insufficient_evidence"
        reasoning = "One or more Truth Packages could not be found."
    elif _has_metric_conflict(packages) or _has_text_conflict(packages):
        decision = "disputed"
        reasoning = "Truth Packages contain conflicting metric values or contradictory claim text signals."
    elif packages and all(
        package.get("verification_status") == "verified"
        and package.get("report_ready") is True
        and package.get("trust_level") in {"verified", "public_approved"}
        for package in packages
    ):
        decision = "supportable"
        reasoning = "All included Truth Packages are verified or public-approved and report-ready."
    elif packages and len(draft_like) >= max(1, round(len(packages) / 2)):
        decision = "unsupported"
        reasoning = "Most included claims are draft, missing-source, unverified, or not report-ready."
    else:
        decision = "insufficient_evidence"
        reasoning = "Truth Spine evidence exists but is not strong enough for a supportable ruling."

    confidence = min(_confidence(packages, warnings, len(missing_claim_ids)), 30) if decision == "insufficient_evidence" and not packages else _confidence(packages, warnings, len(missing_claim_ids))
    ruling = {
        "ruling_id": f"oracle_ruling_{uuid.uuid4().hex[:12]}",
        "case_id": case_id,
        "decision": decision if decision in ALLOWED_DECISIONS else "insufficient_evidence",
        "confidence": confidence,
        "reasoning_summary": reasoning,
        "evidence_summary": _evidence_summary(packages, missing_claim_ids),
        "claim_packages": packages,
        "warnings": warnings,
        "created_at": _now(),
        "decided_by": "shs-oracle-layer-v1",
    }

    rulings = list_rulings()
    rulings.append(ruling)
    _write_list(RULINGS_PATH, rulings)

    updated_case = {**oracle_case, "status": "ruled", "updated_at": _now()}
    cases = [item for item in list_cases() if item.get("case_id") != case_id]
    cases.append(updated_case)
    _write_list(CASES_PATH, cases)

    _audit("ruling.created", "oracle_ruling", ruling["ruling_id"], {"case_id": case_id, "decision": ruling["decision"]})
    return ruling


def oracle_summary() -> Dict[str, Any]:
    cases = list_cases()
    rulings = list_rulings()
    decisions = {decision: len([ruling for ruling in rulings if ruling.get("decision") == decision]) for decision in sorted(ALLOWED_DECISIONS)}
    return {
        "ok": True,
        "cases_total": len(cases),
        "rulings_total": len(rulings),
        "open_cases": len([case for case in cases if case.get("status") != "ruled"]),
        "supportable": decisions.get("supportable", 0),
        "unsupported": decisions.get("unsupported", 0),
        "disputed": decisions.get("disputed", 0),
        "insufficient_evidence": decisions.get("insufficient_evidence", 0),
        "insufficient_evidence_count": decisions.get("insufficient_evidence", 0),
    }
