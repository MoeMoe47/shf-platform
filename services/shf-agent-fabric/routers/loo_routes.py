from typing import Any, Dict, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

try:
    from jsonschema import Draft202012Validator, FormatChecker
except Exception:
    Draft202012Validator = None
    FormatChecker = None

from fabric.runs_registry.store import get_run

router = APIRouter(prefix="/loo", tags=["loo"])


class LooValidateBody(BaseModel):
    schema_name: Dict[str, Any]
    payload: Dict[str, Any]


class LooScoreBody(BaseModel):
    payload: Dict[str, Any]


class LooScoreRunBody(BaseModel):
    run_id: str = Field(..., min_length=3)
    payload: Dict[str, Any]


def _safe_div(a: float, b: float) -> float:
    return float(a) / float(b) if b else 0.0


def _clamp01(x: float) -> float:
    if x < 0:
        return 0.0
    if x > 1:
        return 1.0
    return float(x)


def _score_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    daily = payload.get("daily") if isinstance(payload.get("daily"), list) else []
    weekly = payload.get("weekly") if isinstance(payload.get("weekly"), list) else []
    monthly = payload.get("monthly") if isinstance(payload.get("monthly"), dict) else {}
    north = payload.get("northStar") if isinstance(payload.get("northStar"), dict) else {}

    enrolled = float(monthly.get("enrolled_count") or 0)
    retained = float(monthly.get("retained_count") or 0)
    retention_rate = float(monthly.get("retention_rate") or _safe_div(retained, enrolled))
    parent_sat = float(monthly.get("parent_satisfaction_avg") or 0)
    incidents_total = float(monthly.get("incidents_total_level3_plus") or 0)

    days = float(len(daily))
    total_att = float(sum((d.get("attendance_count") or 0) for d in daily if isinstance(d, dict)))
    attendance_rate_est = _safe_div(total_att, max(1.0, enrolled * max(1.0, days)))

    incident_rate_per100 = _safe_div(incidents_total, max(1.0, total_att)) * 100.0

    if weekly and isinstance(weekly[0], dict):
        w0 = weekly[0]
        artifact_count = float(w0.get("artifact_count") or 0)
        unique_students = float(w0.get("unique_students_served") or 0)
        artifacts_per_student = _safe_div(artifact_count, max(1.0, unique_students))
        weekly_artifact_completion = _clamp01(_safe_div(artifacts_per_student, 1.0))
    else:
        weekly_artifact_completion = 0.0

    # Targets (from payload.northStar)
    t_att = float(north.get("attendanceRateTarget") or 0)
    t_ret = float(north.get("retentionTarget") or 0)
    t_ps = float(north.get("parentSatisfactionTarget") or 0)
    t_inc_max = float(north.get("behaviorIncidentRateMaxPer100Sessions") or 0)
    t_art = float(north.get("weeklyArtifactCompletionTarget") or 0)

    checks = []
    checks.append(("attendanceRate", attendance_rate_est, t_att, attendance_rate_est >= t_att, "higher_is_better"))
    checks.append(("retentionRate", retention_rate, t_ret, retention_rate >= t_ret, "higher_is_better"))
    checks.append(("parentSatisfaction", parent_sat, t_ps, parent_sat >= t_ps, "higher_is_better"))
    checks.append(("incidentRatePer100Sessions", incident_rate_per100, t_inc_max, incident_rate_per100 <= t_inc_max, "lower_is_better"))
    checks.append(("weeklyArtifactCompletion", weekly_artifact_completion, t_art, weekly_artifact_completion >= t_art, "higher_is_better"))

    per_metric_points = 20
    score = sum(per_metric_points for (_, _, _, ok, _) in checks if ok)
    decision = "GREEN" if score >= 80 else ("YELLOW" if score >= 60 else "RED")

    metrics = {}
    for name, actual, target, ok, rule in checks:
        metrics[name] = {"actual": actual, "target": target, "pass": bool(ok), "rule": rule}

    derived = {
        "enrolled_count": enrolled,
        "days_in_period_sampled": int(days),
        "total_attendance_count": total_att,
        "attendance_rate_est": attendance_rate_est,
        "incident_rate_per100_sessions": incident_rate_per100,
        "weekly_artifact_completion": weekly_artifact_completion,
    }

    return {
        "ok": True,
        "score": int(score),
        "decision": decision,
        "metrics": metrics,
        "derived": derived,
    }


def _inject_run_targets(payload: Dict[str, Any], targets: Dict[str, Any]) -> Dict[str, Any]:
    """
    Authoritative injection:
      payload.northStar is overwritten/merged by run targets
      so scoring matches the registered run definition.
    """
    p = dict(payload or {})
    ns = p.get("northStar") if isinstance(p.get("northStar"), dict) else {}
    ns2 = dict(ns)
    for k, v in (targets or {}).items():
        # Only inject LOO target keys we recognize for scoring
        if k in (
            "attendanceRateTarget",
            "retentionTarget",
            "parentSatisfactionTarget",
            "behaviorIncidentRateMaxPer100Sessions",
            "weeklyArtifactCompletionTarget",
        ):
            ns2[k] = v
    p["northStar"] = ns2
    return p


@router.get("/health")
def health():
    return {"ok": True, "jsonschema": bool(Draft202012Validator)}


@router.post("/validate")
def validate_loo(body: LooValidateBody):
    if Draft202012Validator is None:
        return {"ok": False, "errors": ["jsonschema not installed"]}

    errors: List[Dict[str, Any]] = []
    v = Draft202012Validator(body.schema_name, format_checker=FormatChecker())
    for e in sorted(v.iter_errors(body.payload), key=lambda x: list(x.absolute_path)):
        errors.append(
            {
                "message": e.message,
                "path": list(e.absolute_path),
                "schema_path": list(e.absolute_schema_path),
            }
        )

    return {"ok": len(errors) == 0, "errors": errors}


@router.post("/score")
def score_loo(body: LooScoreBody):
    payload = body.payload if isinstance(body.payload, dict) else {}
    return _score_payload(payload)


@router.post("/score_run")
def score_loo_run(body: LooScoreRunBody):
    payload = body.payload if isinstance(body.payload, dict) else {}

    r = get_run(body.run_id)
    if not r.get("ok"):
        return {"ok": False, "error": r.get("error", "RUN_NOT_FOUND"), "run_id": body.run_id}

    run = r.get("run") or {}
    targets = run.get("targets") if isinstance(run.get("targets"), dict) else {}

    payload2 = _inject_run_targets(payload, targets)

    scored = _score_payload(payload2)
    return {
        **scored,
        "run_id": body.run_id,
        "run": {
            "run_id": run.get("run_id"),
            "app_id": run.get("app_id"),
            "name": run.get("name"),
            "mode": run.get("mode"),
        },
        "targets_used": payload2.get("northStar", {}),
        "note": "Targets were loaded from Run Registry and applied to payload.northStar before scoring.",
    }
