from typing import Any, Dict
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from fabric.events.schema import normalize_event
from fabric.run_ledger import write_run_event
from fabric.runs_registry.store import run_exists

router = APIRouter(prefix="/events", tags=["events"])

class EventBody(BaseModel):
    event: Dict[str, Any]

def _strict_enabled() -> bool:
    return (os.getenv("RUN_REGISTRY_STRICT", "0") or "0").strip() in ("1", "true", "TRUE", "yes", "YES")

@router.post("/ingest")
def ingest(body: EventBody):
    # Normalize (for return + for canonical run_id extraction)
    norm = normalize_event(body.event)
    ctx = norm.get("context") if isinstance(norm.get("context"), dict) else {}
    run_id = ctx.get("run_id")

    if _strict_enabled():
        # If strict, require a run_id and it must exist
        if not isinstance(run_id, str) or not run_id.strip():
            raise HTTPException(status_code=400, detail="Missing context.run_id (RUN_REGISTRY_STRICT=1)")
        if not run_exists(run_id.strip()):
            raise HTTPException(status_code=404, detail=f"Unknown run_id: {run_id}")

    write_run_event(body.event)  # ledger normalizes again on write; safe
    return {"ok": True, "normalized": norm}

@router.post("/normalize")
def normalize_only(body: EventBody):
    return {"ok": True, "normalized": normalize_event(body.event)}
