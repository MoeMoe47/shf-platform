from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from services.ai_layer.game_theory import run_scenario_comparison
from services.oracle_service import get_case, get_case_ruling, list_rulings
from services.truth_spine_service import build_truth_package

ROOT = Path(__file__).resolve().parents[1]
GAME_THEORY_DB_DIR = ROOT / "db" / "game_theory"
SCENARIOS_PATH = GAME_THEORY_DB_DIR / "scenarios.json"
ANALYSES_PATH = GAME_THEORY_DB_DIR / "analyses.json"
AUDIT_PATH = ROOT / "logs" / "game_theory.audit.log"

ALLOWED_SCENARIO_TYPES = {
    "funding_loss",
    "funding_gain",
    "partner_gain",
    "partner_loss",
    "staff_loss",
    "staff_growth",
    "data_quality_drop",
    "public_trust_drop",
    "public_trust_gain",
    "policy_change",
    "technology_failure",
    "adoption_growth",
    "adoption_resistance",
    "client_churn_risk",
    "upsell_opportunity",
    "program_expansion",
    "program_pause",
    "custom",
}

ALLOWED_SEVERITIES = {"low", "medium", "high", "critical"}
ALLOWED_TIME_HORIZONS = {"immediate", "short_term", "medium_term", "long_term"}

NEGATIVE_TYPES = {
    "funding_loss",
    "partner_loss",
    "staff_loss",
    "technology_failure",
    "data_quality_drop",
    "client_churn_risk",
    "public_trust_drop",
    "adoption_resistance",
    "program_pause",
}

POSITIVE_TYPES = {
    "funding_gain",
    "partner_gain",
    "staff_growth",
    "public_trust_gain",
    "adoption_growth",
    "upsell_opportunity",
    "program_expansion",
}

SEVERITY_RISK_ADJUSTMENT = {"low": 5, "medium": 15, "high": 30, "critical": 45}


def _now() -> str:
    return datetime.now(UTC).isoformat()


def _ensure_files() -> None:
    GAME_THEORY_DB_DIR.mkdir(parents=True, exist_ok=True)
    AUDIT_PATH.parent.mkdir(parents=True, exist_ok=True)
    for path in (SCENARIOS_PATH, ANALYSES_PATH):
        if not path.exists():
            path.write_text("[]\n", encoding="utf-8")
    if not AUDIT_PATH.exists():
        AUDIT_PATH.write_text("", encoding="utf-8")


def _read_list(path: Path) -> List[Dict[str, Any]]:
    _ensure_files()
    try:
        data = json.loads(path.read_text(encoding="utf-8") or "[]")
    except json.JSONDecodeError:
        data = []
    return data if isinstance(data, list) else []


def _write_list(path: Path, rows: List[Dict[str, Any]]) -> None:
    _ensure_files()
    path.write_text(json.dumps(rows, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def _audit(event: str, object_type: str, object_id: str, payload: Optional[Dict[str, Any]] = None) -> None:
    _ensure_files()
    entry = {
        "ts": _now(),
        "event": event,
        "object_type": object_type,
        "object_id": object_id,
        "payload": payload or {},
    }
    with AUDIT_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(entry, sort_keys=True) + "\n")


def _clean_string(value: Any, fallback: str = "") -> str:
    text = str(value or "").strip()
    return text or fallback


def _clean_list(value: Any) -> List[str]:
    if isinstance(value, list):
        return [_clean_string(item) for item in value if _clean_string(item)]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def _clamp(value: int, low: int = 0, high: int = 100) -> int:
    return max(low, min(high, int(round(value))))


def _truth_context(claim_ids: List[str]) -> Dict[str, Any]:
    packages: List[Dict[str, Any]] = []
    missing_claim_ids: List[str] = []
    warnings: List[str] = []
    for claim_id in claim_ids:
        package = build_truth_package(claim_id)
        if not package:
            missing_claim_ids.append(claim_id)
            warnings.append(f"missing_truth_package:{claim_id}")
            continue
        packages.append(package)
        for warning in package.get("warnings") or []:
            if warning:
                warnings.append(f"{claim_id}:{warning}")

    verified = [p for p in packages if p.get("verification_status") == "verified"]
    public = [p for p in packages if p.get("public_approved") is True]
    draft = [p for p in packages if p.get("verification_status") != "verified"]
    low_trace = [p for p in packages if int(p.get("trace_coverage") or 0) < 80]
    avg_trace = int(round(sum(int(p.get("trace_coverage") or 0) for p in packages) / len(packages))) if packages else 0
    return {
        "packages": packages,
        "package_count": len(packages),
        "verified_count": len(verified),
        "public_approved_count": len(public),
        "draft_count": len(draft),
        "low_trace_count": len(low_trace),
        "missing_claim_ids": missing_claim_ids,
        "package_hashes": [p.get("package_hash") for p in packages if p.get("package_hash")],
        "average_trace_coverage": avg_trace,
        "warnings": warnings,
    }


def _oracle_context(case_ids: List[str]) -> Dict[str, Any]:
    cases = []
    rulings = []
    missing_case_ids = []
    warnings = []
    for case_id in case_ids:
        case = get_case(case_id)
        if not case:
            missing_case_ids.append(case_id)
            warnings.append(f"missing_oracle_case:{case_id}")
            continue
        cases.append(case)
        ruling = get_case_ruling(case_id)
        if ruling:
            rulings.append(ruling)
        else:
            warnings.append(f"missing_oracle_ruling:{case_id}")

    decisions = {}
    for ruling in rulings:
        decision = _clean_string(ruling.get("decision"), "unknown")
        decisions[decision] = decisions.get(decision, 0) + 1
    return {
        "case_count": len(cases),
        "ruling_count": len(rulings),
        "supportable_count": decisions.get("supportable", 0),
        "disputed_count": decisions.get("disputed", 0),
        "unsupported_count": decisions.get("unsupported", 0),
        "insufficient_evidence_count": decisions.get("insufficient_evidence", 0),
        "missing_case_ids": missing_case_ids,
        "ruling_ids": [r.get("ruling_id") for r in rulings if r.get("ruling_id")],
        "warnings": warnings,
    }


def list_scenarios() -> List[Dict[str, Any]]:
    return _read_list(SCENARIOS_PATH)


def list_analyses() -> List[Dict[str, Any]]:
    return _read_list(ANALYSES_PATH)


def get_scenario(scenario_id: str) -> Optional[Dict[str, Any]]:
    return next((item for item in list_scenarios() if item.get("scenario_id") == scenario_id), None)


def get_analysis(analysis_id: str) -> Optional[Dict[str, Any]]:
    return next((item for item in list_analyses() if item.get("analysis_id") == analysis_id), None)


def get_scenario_analysis(scenario_id: str) -> Optional[Dict[str, Any]]:
    analyses = [item for item in list_analyses() if item.get("scenario_id") == scenario_id]
    return analyses[-1] if analyses else None


def create_scenario(payload: Dict[str, Any]) -> Dict[str, Any]:
    now = _now()
    scenario_type = _clean_string(payload.get("scenario_type"), "custom")
    severity = _clean_string(payload.get("severity"), "medium").lower()
    time_horizon = _clean_string(payload.get("time_horizon"), "short_term").lower()
    scenario = {
        "scenario_id": _clean_string(payload.get("scenario_id"), f"gt_scenario_{uuid.uuid4().hex[:12]}"),
        "scenario_type": scenario_type if scenario_type in ALLOWED_SCENARIO_TYPES else "custom",
        "title": _clean_string(payload.get("title"), "Untitled strategic scenario"),
        "description": _clean_string(payload.get("description")),
        "app_id": _clean_string(payload.get("app_id")),
        "program_id": _clean_string(payload.get("program_id")),
        "client_id": _clean_string(payload.get("client_id")),
        "stakeholder_ids": _clean_list(payload.get("stakeholder_ids")),
        "claim_ids": _clean_list(payload.get("claim_ids")),
        "oracle_case_ids": _clean_list(payload.get("oracle_case_ids")),
        "severity": severity if severity in ALLOWED_SEVERITIES else "medium",
        "time_horizon": time_horizon if time_horizon in ALLOWED_TIME_HORIZONS else "short_term",
        "status": _clean_string(payload.get("status"), "draft"),
        "created_at": now,
        "updated_at": now,
    }
    scenarios = [item for item in list_scenarios() if item.get("scenario_id") != scenario["scenario_id"]]
    scenarios.append(scenario)
    _write_list(SCENARIOS_PATH, scenarios)
    _audit("scenario.created", "game_theory_scenario", scenario["scenario_id"], {"scenario_type": scenario["scenario_type"]})
    return scenario


def _recommended_strategy(scenario: Dict[str, Any], strategic_risk: int, cooperation: int, conflict: int) -> str:
    scenario_type = scenario.get("scenario_type")
    if strategic_risk >= 85:
        return "contain_and_escalate_for_alignment_review"
    if scenario_type in {"funding_loss", "client_churn_risk"}:
        return "stabilize_relationship_and_prepare_retention_path"
    if scenario_type in {"funding_gain", "upsell_opportunity", "program_expansion"}:
        return "advance_with_truth_backed_growth_package"
    if scenario_type in {"partner_loss", "staff_loss", "technology_failure", "data_quality_drop"}:
        return "reduce_operational_exposure_and_monitor_watchtower_risk"
    if cooperation >= conflict:
        return "coordinate_stakeholders_with_verified_evidence"
    return "deescalate_conflict_and_request_oracle_review"


def _legacy_strategy_signal(scenario: Dict[str, Any]) -> Dict[str, Any]:
    severity = scenario.get("severity")
    scenario_type = scenario.get("scenario_type")
    risk_level = "high" if severity in {"high", "critical"} or scenario_type in NEGATIVE_TYPES else "low"
    funding_risk = "high" if scenario_type == "funding_loss" else "low"
    if scenario_type in {"funding_gain", "upsell_opportunity"}:
        funding_risk = "low"
    time_sensitivity = "urgent" if scenario.get("time_horizon") == "immediate" else "high" if severity in {"high", "critical"} else "medium"
    county_inputs = [{
        "region": scenario.get("program_id") or scenario.get("client_id") or "Strategic scenario",
        "risk_level": risk_level,
        "funding_risk": funding_risk,
        "time_sensitivity": time_sensitivity,
        "confidence_score": 0.85,
        "verification_quality": 0.85,
        "suspicious_spike": False,
    }]
    return run_scenario_comparison(county_inputs, total_budget=100)


def analyze_scenario(scenario_id: str) -> Optional[Dict[str, Any]]:
    scenario = get_scenario(scenario_id)
    if not scenario:
        return None

    truth = _truth_context(_clean_list(scenario.get("claim_ids")))
    oracle = _oracle_context(_clean_list(scenario.get("oracle_case_ids")))
    warnings = list(truth["warnings"]) + list(oracle["warnings"])
    scenario_type = scenario.get("scenario_type")
    severity = scenario.get("severity")

    risk = 50 + SEVERITY_RISK_ADJUSTMENT.get(severity, 15)
    cooperation = 50
    conflict = 50
    incentive = 50
    expected_delta = 0
    trust_delta = 0
    adoption_delta = 0
    funding_delta = 0
    operational_delta = 0

    if scenario_type in NEGATIVE_TYPES:
        risk += 15
        conflict += 18
        cooperation -= 8
        incentive -= 6
        expected_delta -= 12
        trust_delta -= 8
        operational_delta += 12
    if scenario_type in POSITIVE_TYPES:
        cooperation += 18
        incentive += 12
        expected_delta += 14
        trust_delta += 8
        adoption_delta += 12
        risk -= 6
    if scenario_type in {"funding_loss"}:
        funding_delta -= 18
    if scenario_type in {"funding_gain", "upsell_opportunity", "program_expansion"}:
        funding_delta += 18
    if scenario_type in {"adoption_resistance", "client_churn_risk"}:
        adoption_delta -= 14
    if scenario_type in {"technology_failure", "data_quality_drop", "staff_loss"}:
        operational_delta += 18

    if truth["verified_count"]:
        confidence_bonus = truth["verified_count"] * 6 + truth["public_approved_count"] * 4
        cooperation += min(10, truth["verified_count"] * 2)
        trust_delta += min(12, truth["verified_count"] * 3)
    else:
        confidence_bonus = 0
    if truth["draft_count"] or truth["missing_claim_ids"]:
        warnings.append("truth_coverage_incomplete")
        risk += 8
        confidence_bonus -= 12
    if truth["low_trace_count"]:
        warnings.append("truth_trace_coverage_below_reporting_threshold")
        confidence_bonus -= 8

    if oracle["supportable_count"]:
        cooperation += oracle["supportable_count"] * 4
        confidence_bonus += oracle["supportable_count"] * 8
    if oracle["disputed_count"] or oracle["insufficient_evidence_count"]:
        risk += (oracle["disputed_count"] * 10) + (oracle["insufficient_evidence_count"] * 8)
        conflict += oracle["disputed_count"] * 8
        confidence_bonus -= (oracle["disputed_count"] * 10) + (oracle["insufficient_evidence_count"] * 8)
    if oracle["unsupported_count"]:
        risk += oracle["unsupported_count"] * 6
        confidence_bonus -= oracle["unsupported_count"] * 6

    if not scenario.get("title") or not scenario.get("description"):
        warnings.append("scenario_context_incomplete")
    if not scenario.get("stakeholder_ids"):
        warnings.append("stakeholders_missing")
    if scenario.get("time_horizon") == "immediate":
        operational_delta += 8
        risk += 4
        warnings.append("alignment_review_required_for_immediate_action")

    completeness = 20
    for key in ("title", "description", "scenario_type", "severity", "time_horizon"):
        if scenario.get(key):
            completeness += 5
    if scenario.get("stakeholder_ids"):
        completeness += 8
    if scenario.get("claim_ids"):
        completeness += 7
    if scenario.get("oracle_case_ids"):
        completeness += 5

    warning_penalty = min(35, len(set(warnings)) * 4)
    confidence = _clamp(completeness + confidence_bonus + truth["average_trace_coverage"] // 5 - warning_penalty)
    legacy_signal = _legacy_strategy_signal(scenario)
    recommended_strategy = _recommended_strategy(scenario, risk, cooperation, conflict)
    analysis = {
        "analysis_id": f"gt_analysis_{uuid.uuid4().hex[:12]}",
        "scenario_id": scenario_id,
        "strategic_risk_score": _clamp(risk),
        "cooperation_score": _clamp(cooperation),
        "conflict_score": _clamp(conflict),
        "incentive_alignment_score": _clamp(incentive),
        "expected_outcome_delta": int(expected_delta),
        "trust_delta": int(trust_delta),
        "adoption_delta": int(adoption_delta),
        "funding_delta": int(funding_delta),
        "operational_risk_delta": int(operational_delta),
        "recommended_strategy": recommended_strategy,
        "confidence": confidence,
        "reasoning_summary": (
            "Deterministic V1 strategic analysis using scenario type, severity, Truth Package quality, "
            "Oracle ruling quality, and existing AI-layer game theory scenario comparison primitives."
        ),
        "evidence_summary": {
            "truth_package_count": truth["package_count"],
            "verified_truth_package_count": truth["verified_count"],
            "public_approved_truth_package_count": truth["public_approved_count"],
            "missing_claim_ids": truth["missing_claim_ids"],
            "package_hashes": truth["package_hashes"],
        },
        "oracle_summary": {
            "case_count": oracle["case_count"],
            "ruling_count": oracle["ruling_count"],
            "supportable_count": oracle["supportable_count"],
            "disputed_count": oracle["disputed_count"],
            "unsupported_count": oracle["unsupported_count"],
            "insufficient_evidence_count": oracle["insufficient_evidence_count"],
            "ruling_ids": oracle["ruling_ids"],
            "missing_case_ids": oracle["missing_case_ids"],
        },
        "legacy_game_theory_signal": {
            "recommended_strategy": legacy_signal.get("recommended_strategy"),
            "gaming_risk": legacy_signal.get("gaming_risk"),
            "confidence": legacy_signal.get("confidence"),
        },
        "warnings": sorted(set(warnings)),
        "created_at": _now(),
    }
    analyses = list_analyses()
    analyses.append(analysis)
    _write_list(ANALYSES_PATH, analyses)
    updated = {**scenario, "status": "analyzed", "updated_at": _now()}
    _write_list(SCENARIOS_PATH, [updated if item.get("scenario_id") == scenario_id else item for item in list_scenarios()])
    _audit("analysis.created", "game_theory_analysis", analysis["analysis_id"], {"scenario_id": scenario_id})
    return analysis


def strategy_playbook() -> Dict[str, Any]:
    return {
        "ok": True,
        "entries": [
            {
                "strategy_id": "contain_and_escalate_for_alignment_review",
                "label": "Contain and escalate",
                "use_when": "Critical risk, immediate horizon, or action pressure appears.",
                "boundary": "Requires Alignment before action; does not execute.",
            },
            {
                "strategy_id": "advance_with_truth_backed_growth_package",
                "label": "Advance with Truth-backed growth package",
                "use_when": "Funding gain, partner gain, upsell, or expansion scenario with supporting metadata.",
                "boundary": "Reports still require Truth Spine readiness and public approval.",
            },
            {
                "strategy_id": "stabilize_relationship_and_prepare_retention_path",
                "label": "Stabilize relationship",
                "use_when": "Funding loss or client churn risk appears.",
                "boundary": "Strategic prediction only; Oracle decides evidence support.",
            },
            {
                "strategy_id": "coordinate_stakeholders_with_verified_evidence",
                "label": "Coordinate stakeholders",
                "use_when": "Cooperation exceeds conflict and verified packages are available.",
                "boundary": "Does not verify claims or publish reports.",
            },
        ],
    }


def game_theory_summary() -> Dict[str, Any]:
    scenarios = list_scenarios()
    analyses = list_analyses()
    high = [a for a in analyses if int(a.get("strategic_risk_score") or 0) >= 80 and int(a.get("strategic_risk_score") or 0) < 95]
    critical = [a for a in analyses if int(a.get("strategic_risk_score") or 0) >= 95]
    avg_confidence = int(round(sum(int(a.get("confidence") or 0) for a in analyses) / len(analyses))) if analyses else 0
    top_recommendation = analyses[-1].get("recommended_strategy") if analyses else "none"
    return {
        "ok": True,
        "policy_status": "active",
        "scenarios_total": len(scenarios),
        "analyses_total": len(analyses),
        "high_risk": len(high),
        "critical_risk": len(critical),
        "high_risk_count": len(high),
        "critical_risk_count": len(critical),
        "average_confidence": avg_confidence,
        "top_recommendation": top_recommendation,
    }


def audit_feed(limit: int = 100) -> Dict[str, Any]:
    _ensure_files()
    lines = AUDIT_PATH.read_text(encoding="utf-8").splitlines()
    rows = []
    for line in lines[-max(1, int(limit)):]:
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return {"ok": True, "count": len(rows), "events": rows}
