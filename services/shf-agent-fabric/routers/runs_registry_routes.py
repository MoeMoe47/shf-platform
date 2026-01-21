from typing import Any, Dict, Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from fabric.runs_registry.store import register_run, get_run, list_runs

router = APIRouter(prefix="/runs", tags=["runs"])

class RunRegisterBody(BaseModel):
    run_id: str = Field(..., min_length=3)
    app_id: str = Field(..., min_length=2)

    name: Optional[str] = None
    owner: Optional[str] = None
    mode: Optional[str] = Field(default=None, description="pilot | system | dev")

    start_ts: Optional[str] = Field(default=None, description="ISO timestamp string")
    end_ts: Optional[str] = Field(default=None, description="ISO timestamp string")

    targets: Optional[Dict[str, Any]] = None
    meta: Optional[Dict[str, Any]] = None


@router.get("/health")
def runs_health():
    return {"ok": True}


@router.post("/register")
def runs_register(body: RunRegisterBody):
    # Upsert
    return register_run(
        run_id=body.run_id,
        app_id=body.app_id,
        name=body.name,
        owner=body.owner,
        mode=body.mode,
        start_ts=body.start_ts,
        end_ts=body.end_ts,
        targets=body.targets,
        meta=body.meta,
    )


@router.get("")
def runs_list(
    app_id: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
):
    return list_runs(app_id=app_id, limit=limit)


@router.get("/{run_id}")
def runs_get(run_id: str):
    return get_run(run_id)
