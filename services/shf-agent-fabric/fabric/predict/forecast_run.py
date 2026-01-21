from __future__ import annotations

from typing import Any, Dict, Optional

from fabric.loe.signals import compute_loe_signals
from fabric.runs_registry.store import get_run
from fabric.predict.forecast import build_forecast
from fabric.runs_registry.loo_payload_store import load_latest_loo_payload

try:
    from routers.loo_routes import _score_payload as loo_score_payload
    from routers.loo_routes import _inject_run_targets as loo_inject_targets
except Exception:
    loo_score_payload = None
    loo_inject_targets = None


def forecast_run(
    run_id: str,
    loo_payload: Optional[Dict[str, Any]] = None,
    limit: int = 5000,
    since: Optional[str] = None,
) -> Dict[str, Any]:
    r = get_run(run_id)
    if not r.get("ok"):
        return {"ok": False, "error": r.get("error", "RUN_NOT_FOUND"), "run_id": run_id}

    run = r.get("run") or {}
    targets = run.get("targets") if isinstance(run.get("targets"), dict) else {}
    app_id = run.get("app_id")

    # 1) LOE
    loe = compute_loe_signals(limit=limit, app_id=app_id, run_id=run_id, since=since)

    # 2) LOO (from provided payload or stored payload)
    loo_score = None
    targets_used = {}
    loo_payload_used = None

    if loo_payload is None:
        stored = load_latest_loo_payload(run_id)
        if stored.get("ok"):
            loo_payload = stored.get("payload") if isinstance(stored.get("payload"), dict) else {}
            loo_payload_used = {"source": "stored", "stored_ts": stored.get("stored_ts")}
        else:
            loo_payload_used = {"source": "missing"}

    if isinstance(loo_payload, dict) and loo_score_payload and loo_inject_targets:
        injected = loo_inject_targets(loo_payload, targets)
        targets_used = injected.get("northStar") if isinstance(injected.get("northStar"), dict) else {}
        scored = loo_score_payload(injected)
        loo_score = {**(scored or {}), "run_id": run_id, "targets_used": targets_used, "payload_source": loo_payload_used or {"source": "request"}}
    elif isinstance(loo_payload, dict) and not (loo_score_payload and loo_inject_targets):
        loo_score = {"ok": False, "error": "LOO_SCORER_NOT_AVAILABLE", "run_id": run_id}
    else:
        loo_score = {"ok": False, "error": "LOO_PAYLOAD_NOT_PROVIDED", "run_id": run_id}

    # 3) Prediction
    pred = build_forecast(
        limit=limit,
        app_id=app_id,
        run_id=run_id,
        since=since,
        loo_score=loo_score if isinstance(loo_score, dict) and loo_score.get("ok") else None,
    )

    summary = {
        "run_health": {
            "loe_health": loe.get("health"),
            "loo_decision": loo_score.get("decision") if isinstance(loo_score, dict) else None,
            "predict_top_code": (pred.get("forecasts") or [{}])[0].get("code") if isinstance(pred, dict) else None,
        },
        "next_actions": pred.get("suggestions", []) if isinstance(pred, dict) else [],
    }

    return {
        "ok": True,
        "run": {
            "run_id": run.get("run_id"),
            "app_id": run.get("app_id"),
            "name": run.get("name"),
            "mode": run.get("mode"),
            "owner": run.get("owner"),
        },
        "filters": {"run_id": run_id, "app_id": app_id, "since": since, "limit": limit},
        "loe": loe,
        "loo": loo_score,
        "predict": pred,
        "summary": summary,
        "guardrails": {"advisory_only": True, "no_commands": True, "no_enforcement": True},
        "note": "Forecast is computed from event telemetry (LOE) and outcome payload (LOO), using targets from Run Registry."
    }
