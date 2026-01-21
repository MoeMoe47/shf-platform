from fastapi import APIRouter, Query
from typing import Optional
from fabric.loe.signals import compute_loe_signals

router = APIRouter(prefix="/loe", tags=["loe"])

@router.get("/health")
def loe_health(
    limit: int = Query(default=5000, ge=10, le=200000),
    app_id: Optional[str] = Query(default=None),
    run_id: Optional[str] = Query(default=None),
    since: Optional[str] = Query(default=None),
):
    res = compute_loe_signals(limit=limit, app_id=app_id, run_id=run_id, since=since)
    return {
        "ok": res.get("ok", True),
        "health": res.get("health", "GREEN"),
        "flags": res.get("flags", []),
        "filters": res.get("filters", {}),
        "derived": {
            "events_seen_after_filter": res.get("derived", {}).get("events_seen_after_filter", 0),
            "canonical_events_used": res.get("derived", {}).get("canonical_events_used", 0),
            "legacy_events_ignored": res.get("derived", {}).get("legacy_events_ignored", 0),
            "manual_override_rate": res.get("derived", {}).get("manual_override_rate", 0.0),
        },
    }

@router.get("/signals")
def loe_signals(
    limit: int = Query(default=5000, ge=10, le=200000),
    app_id: Optional[str] = Query(default=None),
    run_id: Optional[str] = Query(default=None),
    since: Optional[str] = Query(default=None),
):
    return compute_loe_signals(limit=limit, app_id=app_id, run_id=run_id, since=since)
