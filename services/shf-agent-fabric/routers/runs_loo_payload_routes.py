from typing import Any, Dict
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from fabric.runs_registry.store import run_exists
from fabric.runs_registry.loo_payload_store import save_latest_loo_payload, load_latest_loo_payload

router = APIRouter(prefix="/runs", tags=["runs-loo-payload"])

class LooPayloadBody(BaseModel):
    payload: Dict[str, Any] = Field(default_factory=dict)

@router.get("/{run_id}/loo_payload")
def get_loo_payload(run_id: str):
    if not run_exists(run_id):
        raise HTTPException(status_code=404, detail=f"Unknown run_id: {run_id}")
    return load_latest_loo_payload(run_id)

@router.post("/{run_id}/loo_payload")
def set_loo_payload(run_id: str, body: LooPayloadBody):
    if not run_exists(run_id):
        raise HTTPException(status_code=404, detail=f"Unknown run_id: {run_id}")
    return save_latest_loo_payload(run_id, body.payload)
