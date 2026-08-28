from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query
from auth.dependencies import require_permission
from auth.permissions import SHF_METRIC_READ
from services.metric_registry_service import MetricCalculationError, MetricRegistryError, calculate_metric

router = APIRouter(prefix="/shf/metrics", tags=["shf-metrics"])

@router.get("/{metric_id}")
def read_metric(metric_id: str, period_start: str = Query("2026-01-01T00:00:00+00:00"), period_end: str = Query("2026-12-31T23:59:59+00:00"), x_public: str | None = None, session=Depends(require_permission(SHF_METRIC_READ))):
    try:
        result = calculate_metric(metric_id, f"{session.organization_id}", period_start, period_end, session, public=str(x_public or "").lower() == "true")
    except (MetricRegistryError, MetricCalculationError) as exc:
        raise HTTPException(status_code=422, detail="Metric request rejected") from exc
    return {"ok": True, "metric": result}
