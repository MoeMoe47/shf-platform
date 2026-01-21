from typing import Any, Dict, Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel

from fabric.predict.forecast import build_forecast
from fabric.predict.forecast_run import forecast_run

router = APIRouter(prefix="/predict", tags=["predict"])

class PredictBody(BaseModel):
    loo_score: Optional[Dict[str, Any]] = None
    limit: int = 5000
    app_id: Optional[str] = None
    run_id: Optional[str] = None
    since: Optional[str] = None

@router.get("/health")
def predict_health():
    return {"ok": True}

@router.get("/forecast")
def predict_forecast(
    limit: int = Query(default=5000, ge=10, le=200000),
    app_id: Optional[str] = Query(default=None),
    run_id: Optional[str] = Query(default=None),
    since: Optional[str] = Query(default=None),
):
    return build_forecast(limit=limit, app_id=app_id, run_id=run_id, since=since, loo_score=None)

@router.post("/forecast")
def predict_forecast_post(body: PredictBody):
    return build_forecast(
        limit=body.limit,
        app_id=body.app_id,
        run_id=body.run_id,
        since=body.since,
        loo_score=body.loo_score,
    )


class PredictRunBody(BaseModel):
    run_id: str
    loo_payload: Optional[Dict[str, Any]] = None
    limit: int = 5000
    since: Optional[str] = None

@router.post("/forecast_run")
def predict_forecast_run(body: PredictRunBody):
    return forecast_run(
        run_id=body.run_id,
        loo_payload=body.loo_payload,
        limit=body.limit,
        since=body.since,
    )
