from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional, List
from datetime import datetime, timezone
import json

# Reuse existing platform logic instead of rebuilding it
from routers.loo_routes import _score_payload as loo_score_payload
from services.aal_service import list_program_health, list_participant_risk


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _safe_float(v: Any, default: float = 0.0) -> float:
    try:
        if v is None:
            return default
        return float(v)
    except Exception:
        return default


def _safe_int(v: Any, default: int = 0) -> int:
    try:
        if v is None:
            return default
        return int(v)
    except Exception:
        return default


def _clamp01(x: float) -> float:
    if x < 0:
        return 0.0
    if x > 1:
        return 1.0
    return float(x)


def _pct01(v: Any) -> float:
    x = _safe_float(v, 0.0)
    if x > 1.0:
        # tolerate already-percent-ish data
        return _clamp01(x / 100.0)
    return _clamp01(x)


def _service_root() -> Path:
    # services/shf-agent-fabric/fabric/reports/funder_report.py
    # -> services/shf-agent-fabric/
    return Path(__file__).resolve().parents[2]


def _registry_run_path(run_id: str) -> Path:
    return _service_root() / "registry" / "runs" / f"{run_id}.json"


def _load_registry_run(run_id: str) -> Dict[str, Any]:
    fp = _registry_run_path(run_id)
    if not fp.exists():
        return {"ok": False, "error": "RUN_NOT_FOUND", "run_id": run_id}

    try:
        doc = json.loads(fp.read_text(encoding="utf-8"))
    except Exception as e:
        return {"ok": False, "error": "RUN_READ_FAILED", "run_id": run_id, "detail": str(e)}

    # tolerate either {"run": {...}} or flat object
    run_obj = doc.get("run") if isinstance(doc.get("run"), dict) else doc
    targets = doc.get("targets") if isinstance(doc.get("targets"), dict) else {}
    outcomes = doc.get("outcomes") if isinstance(doc.get("outcomes"), dict) else {}

    return {
        "ok": True,
        "run_id": run_id,
        "doc": doc,
        "run": run_obj if isinstance(run_obj, dict) else {"run_id": run_id},
        "targets": targets,
        "outcomes": outcomes,
    }


def _pick_program_id(run_obj: Dict[str, Any]) -> Optional[str]:
    candidates = [
        run_obj.get("program_id"),
        run_obj.get("site"),
        run_obj.get("app_id"),
        run_obj.get("name"),
        run_obj.get("run_id"),
    ]
    for c in candidates:
        if isinstance(c, str) and c.strip():
            return c.strip()
    return None


def _extract_outcomes_payload(outcomes: Dict[str, Any], targets: Dict[str, Any]) -> Dict[str, Any]:
    """
    Build a payload shape that the existing LOO scorer understands.

    Expected scorer shape:
      daily: [...]
      weekly: [...]
      monthly: {...}
      northStar: {...}
    """
    daily = outcomes.get("daily") if isinstance(outcomes.get("daily"), list) else []
    weekly = outcomes.get("weekly") if isinstance(outcomes.get("weekly"), list) else []
    monthly = outcomes.get("monthly") if isinstance(outcomes.get("monthly"), dict) else {}

    # If there is no proper monthly block, try to infer one from common keys.
    if not monthly:
        monthly = {
            "enrolled_count": outcomes.get("enrolled_count") or outcomes.get("enrolled") or 0,
            "retained_count": outcomes.get("retained_count") or outcomes.get("retained") or 0,
            "retention_rate": outcomes.get("retention_rate") or 0,
            "parent_satisfaction_avg": outcomes.get("parent_satisfaction_avg")
            or outcomes.get("parent_satisfaction")
            or 0,
            "incidents_total_level3_plus": outcomes.get("incidents_total_level3_plus")
            or outcomes.get("behavior_incidents_total")
            or 0,
        }

    payload = {
        "daily": daily,
        "weekly": weekly,
        "monthly": monthly,
        "northStar": targets or {},
    }
    return payload


def _build_snapshot_from_loo(loo: Dict[str, Any], outcomes: Dict[str, Any]) -> Dict[str, Any]:
    metrics = loo.get("metrics") if isinstance(loo.get("metrics"), dict) else {}
    derived = loo.get("derived") if isinstance(loo.get("derived"), dict) else {}

    attendance_rate = _safe_float(
        (metrics.get("attendanceRate") or {}).get("actual"),
        _safe_float(outcomes.get("attendance_rate"), 0.0),
    )
    retention_rate = _safe_float(
        (metrics.get("retentionRate") or {}).get("actual"),
        _safe_float(outcomes.get("retention_rate"), 0.0),
    )
    parent_satisfaction = _safe_float(
        (metrics.get("parentSatisfaction") or {}).get("actual"),
        _safe_float(outcomes.get("parent_satisfaction"), 0.0),
    )
    incident_rate_per_100 = _safe_float(
        (metrics.get("incidentRatePer100Sessions") or {}).get("actual"),
        _safe_float(outcomes.get("behavior_incident_rate_per_100"), 0.0),
    )
    weekly_artifact_completion = _safe_float(
        (metrics.get("weeklyArtifactCompletion") or {}).get("actual"),
        _safe_float(outcomes.get("weekly_artifact_completion"), 0.0),
    )

    checks: List[Dict[str, Any]] = []
    for metric_name, metric_obj in metrics.items():
        if not isinstance(metric_obj, dict):
            continue
        checks.append(
            {
                "metric": metric_name,
                "actual": metric_obj.get("actual"),
                "target_min": metric_obj.get("target")
                if metric_obj.get("rule") == "higher_is_better"
                else None,
                "target_max": metric_obj.get("target")
                if metric_obj.get("rule") == "lower_is_better"
                else None,
                "pass": metric_obj.get("pass"),
                "rule": metric_obj.get("rule"),
            }
        )

    return {
        "attendance_rate": attendance_rate,
        "retention_rate": retention_rate,
        "parent_satisfaction": parent_satisfaction,
        "behavior_incident_rate_per_100": incident_rate_per_100,
        "weekly_artifact_completion": weekly_artifact_completion,
        "enrolled_count": _safe_int(derived.get("enrolled_count")),
        "days_in_period_sampled": _safe_int(derived.get("days_in_period_sampled")),
        "total_attendance_count": _safe_int(derived.get("total_attendance_count")),
        "target_checks": {
            "checks": checks,
            "pass_count": sum(1 for c in checks if c.get("pass") is True),
            "fail_count": sum(1 for c in checks if c.get("pass") is False),
        },
    }


def _select_program_health_row(program_id: Optional[str]) -> Dict[str, Any]:
    if not program_id:
        return {}

    try:
        rows = list_program_health(program_id=program_id) or []
    except Exception:
        rows = []

    if rows:
        return rows[0] if isinstance(rows[0], dict) else {}

    # fallback: search global rows for fuzzy match if direct lookup misses
    try:
        all_rows = list_program_health(program_id=None) or []
    except Exception:
        all_rows = []

    pid = str(program_id).strip().lower()
    for row in all_rows:
        if not isinstance(row, dict):
            continue
        rp = str(row.get("program_id") or "").strip().lower()
        if rp == pid:
            return row
    return {}


def _select_participant_risk_rows(limit: int = 50) -> List[Dict[str, Any]]:
    try:
        rows = list_participant_risk(participant_id=None) or []
    except Exception:
        rows = []
    out = [r for r in rows if isinstance(r, dict)]
    return out[: max(1, int(limit))]


def _risk_band_from_program_health(score01: float) -> str:
    if score01 < 0.40:
        return "RED"
    if score01 < 0.70:
        return "YELLOW"
    return "GREEN"


def _build_loe_summary(program_health_row: Dict[str, Any], participant_rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    score01 = _safe_float(program_health_row.get("program_health_score"), 0.0)
    anomaly_flag = bool(program_health_row.get("anomaly_flag"))

    risk_counts = {"high": 0, "medium": 0, "low": 0}
    for row in participant_rows:
        band = str(row.get("risk_band") or "").strip().lower()
        if band in risk_counts:
            risk_counts[band] += 1

    return {
        "program_health_score": round(score01, 4),
        "program_health_band": _risk_band_from_program_health(score01),
        "anomaly_flag": anomaly_flag,
        "participant_risk_counts": risk_counts,
        "derived": {
            "events_seen_after_filter": _safe_int(program_health_row.get("enrollment_count")),
            "canonical_events_used": _safe_int(program_health_row.get("verified_outcome_count")),
            "legacy_events_ignored": 0,
            "participant_rows_considered": len(participant_rows),
        },
    }


def _build_forecast_and_suggestions(
    loo: Dict[str, Any],
    snapshot: Dict[str, Any],
    loe_summary: Dict[str, Any],
    targets: Dict[str, Any],
) -> Dict[str, Any]:
    metrics = loo.get("metrics") if isinstance(loo.get("metrics"), dict) else {}
    score = _safe_float(loo.get("score"), 0.0)

    failed = []
    for name, obj in metrics.items():
        if isinstance(obj, dict) and obj.get("pass") is False:
            failed.append(name)

    program_health_score = _safe_float(loe_summary.get("program_health_score"), 0.0)
    risk_counts = (loe_summary.get("participant_risk_counts") or {}) if isinstance(loe_summary, dict) else {}
    high_risk = _safe_int(risk_counts.get("high"))
    medium_risk = _safe_int(risk_counts.get("medium"))

    forecast_message = "Program appears stable against current target set."
    forecast_probability = 0.68

    suggestions: List[Dict[str, Any]] = []

    if "attendanceRate" in failed:
        forecast_message = "Attendance is trending below target and may reduce funding confidence if not corrected."
        forecast_probability = 0.78
        suggestions.append(
            {
                "priority": "high",
                "message": "Launch an attendance recovery plan with outreach, reminders, and incentive follow-up within 7 days."
            }
        )

    if "retentionRate" in failed:
        forecast_message = "Retention pressure may lower near-term outcome confidence and weaken scale readiness."
        forecast_probability = max(forecast_probability, 0.76)
        suggestions.append(
            {
                "priority": "high",
                "message": "Add retention intervention checkpoints for at-risk participants and monitor weekly exit reasons."
            }
        )

    if "incidentRatePer100Sessions" in failed:
        forecast_message = "Behavior incident levels may create operational drag and weaken readiness for expansion."
        forecast_probability = max(forecast_probability, 0.74)
        suggestions.append(
            {
                "priority": "high",
                "message": "Deploy a behavior support response plan and review incident root causes before scale decisions."
            }
        )

    if "parentSatisfaction" in failed:
        suggestions.append(
            {
                "priority": "medium",
                "message": "Run a satisfaction recovery loop with direct caregiver feedback and close the top 3 complaints."
            }
        )

    if "weeklyArtifactCompletion" in failed:
        suggestions.append(
            {
                "priority": "medium",
                "message": "Strengthen weekly artifact completion with tighter staff follow-up and milestone tracking."
            }
        )

    if program_health_score < 0.70:
        suggestions.append(
            {
                "priority": "high" if program_health_score < 0.40 else "medium",
                "message": "Stabilize program operations before expansion; current health score suggests execution risk."
            }
        )

    if high_risk > 0:
        suggestions.append(
            {
                "priority": "high",
                "message": f"Immediate intervention is recommended for {high_risk} high-risk participant case(s)."
            }
        )
    elif medium_risk > 0:
        suggestions.append(
            {
                "priority": "medium",
                "message": f"Monitor {medium_risk} medium-risk participant case(s) with weekly review."
            }
        )

    if not suggestions:
        suggestions.append(
            {
                "priority": "medium",
                "message": "Maintain current delivery model and continue weekly monitoring against targets."
            }
        )

    # Keep the top suggestion first
    priority_rank = {"high": 0, "medium": 1, "low": 2}
    suggestions.sort(key=lambda s: priority_rank.get(str(s.get("priority")).lower(), 9))

    return {
        "forecast_top": {
            "message": forecast_message,
            "probability": round(_clamp01(forecast_probability), 4),
        },
        "suggestions_top": suggestions[:5],
        "predict_summary": {
            "risk_signals": failed,
            "program_health_score": round(program_health_score, 4),
            "high_risk_participants": high_risk,
            "medium_risk_participants": medium_risk,
        },
    }


def _build_funder_language(
    run_obj: Dict[str, Any],
    loo: Dict[str, Any],
    loe_summary: Dict[str, Any],
    forecast_top: Dict[str, Any],
    suggestions_top: List[Dict[str, Any]],
) -> Dict[str, Any]:
    decision = str(loo.get("decision") or "—").upper()
    score = _safe_int(loo.get("score"), 0)
    ph = _safe_float(loe_summary.get("program_health_score"), 0.0)
    health_band = str(loe_summary.get("program_health_band") or "UNKNOWN")
    pilot_name = str(run_obj.get("name") or run_obj.get("run_id") or "Pilot")

    if decision == "INCOMPLETE":
        summary = (
            f"{pilot_name} does not yet have sufficient target/outcome data attached for a funding-grade decision."
        )
        risk = "Decision confidence is limited because the registered run data is incomplete."
        recommendation = "Attach targets and outcomes before using this report for funding or scale decisions."
    elif decision == "GREEN" and ph >= 0.70:
        summary = (
            f"{pilot_name} is currently performing at a level consistent with continuation or controlled scale."
        )
        risk = "Execution risk appears manageable under the current operating profile."
        recommendation = "Proceed with controlled expansion while maintaining routine monitoring."
    elif decision == "YELLOW" or ph < 0.70:
        summary = (
            f"{pilot_name} shows fundable potential, but targeted improvement is needed before broader scale decisions."
        )
        risk = f"Operational risk is elevated ({health_band}) and should be addressed before expansion."
        recommendation = (
            suggestions_top[0]["message"]
            if suggestions_top
            else "Address the leading performance gaps before scaling."
        )
    else:
        summary = (
            f"{pilot_name} is not yet in a strong position for scale based on current outcome and operational signals."
        )
        risk = "Current performance and/or execution conditions create material funding risk."
        recommendation = (
            suggestions_top[0]["message"]
            if suggestions_top
            else "Stabilize delivery and close the major target gaps before further funding expansion."
        )

    return {
        "summary": summary,
        "risk": risk,
        "recommendation": recommendation,
        "decision": decision,
        "score": score,
        "forecast_message": forecast_top.get("message"),
    }


def build_funder_report(
    run_id: str,
    limit: int = 5000,
    since: Optional[str] = None,
    include_raw: bool = False,
) -> Dict[str, Any]:
    """
    Canonical report builder for funder-facing run reports.

    Output contract is intentionally richer than the old stub and matches
    what the current PDF renderer already expects:
      - run
      - targets
      - outcomes
      - loo
      - snapshot
      - loe_summary
      - forecast_top
      - suggestions_top
      - predict_summary
      - funder_language
    """
    loaded = _load_registry_run(run_id)
    if not loaded.get("ok"):
        return loaded

    run_obj = loaded.get("run") or {"run_id": run_id}
    targets = loaded.get("targets") or {}
    outcomes = loaded.get("outcomes") or {}

    payload = _extract_outcomes_payload(outcomes, targets)

    # Existing LOO scorer
    try:
        loo = loo_score_payload(payload)
    except Exception as e:
        loo = {
            "ok": False,
            "error": "LOO_SCORE_FAILED",
            "detail": str(e),
            "score": 0,
            "decision": "RED",
            "metrics": {},
            "derived": {},
        }

    # Data sufficiency guard:
    # empty targets/outcomes must never look funding-ready
    insufficient_targets = not bool(targets)
    insufficient_outcomes = not bool(outcomes)

    if insufficient_targets or insufficient_outcomes:
        loo = {
            **(loo if isinstance(loo, dict) else {}),
            "ok": True,
            "score": 0,
            "decision": "INCOMPLETE",
            "data_sufficiency": {
                "targets_present": not insufficient_targets,
                "outcomes_present": not insufficient_outcomes,
            },
        }

    snapshot = _build_snapshot_from_loo(loo, outcomes)

    # Existing AAL system
    program_id = _pick_program_id(run_obj)
    program_health_row = _select_program_health_row(program_id)
    participant_rows = _select_participant_risk_rows(limit=50)

    loe_summary = _build_loe_summary(program_health_row, participant_rows)

    predict_pack = _build_forecast_and_suggestions(loo, snapshot, loe_summary, targets)
    forecast_top = predict_pack.get("forecast_top") or {}
    suggestions_top = predict_pack.get("suggestions_top") or []
    predict_summary = predict_pack.get("predict_summary") or {}

    funder_language = _build_funder_language(
        run_obj=run_obj,
        loo=loo,
        loe_summary=loe_summary,
        forecast_top=forecast_top,
        suggestions_top=suggestions_top,
    )

    report: Dict[str, Any] = {
        "ok": True,
        "run_id": run_id,
        "generated_ts": _utc_now_iso(),
        "filters": {"limit": limit, "since": since},
        "run": run_obj or {"run_id": run_id},
        "targets": targets,
        "outcomes": outcomes,
        "events": {
            "count": _safe_int((loe_summary.get("derived") or {}).get("events_seen_after_filter"))
        },
        "notes": [],
        "loo": loo,
        "snapshot": snapshot,
        "loe_summary": loe_summary,
        "forecast_top": forecast_top,
        "suggestions_top": suggestions_top,
        "predict_summary": predict_summary,
        "funder_language": funder_language,
    }

    if not outcomes:
        report["notes"].append("no_outcomes_payload")
    if not targets:
        report["notes"].append("no_targets_payload")
    if not outcomes or not targets:
        report["notes"].append("insufficient_data_for_funding_decision")
    if not program_health_row:
        report["notes"].append("no_program_health_match")
    if not participant_rows:
        report["notes"].append("no_participant_risk_rows")

    if include_raw:
        report["raw"] = {
            "registry_doc": loaded.get("doc"),
            "loo_payload_used": payload,
            "program_health_row": program_health_row,
            "participant_risk_rows": participant_rows,
        }

    return report
