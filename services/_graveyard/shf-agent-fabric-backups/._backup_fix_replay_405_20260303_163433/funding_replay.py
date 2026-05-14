from typing import Any, Dict
from fastapi import APIRouter, HTTPException
from fabric.funding.journal.decision_journal import record_decision
from fabric.funding.journal.replay_engine import replay_decision

router = APIRouter(prefix="/api/funding", tags=["funding"])

@router.post("/decisions")
def record(payload: Dict[str, Any]):
    request = payload.get("request") or {}
    response = payload.get("response") or {}
    ruleset_sha256 = payload.get("ruleset_sha256") or "unknown"
    manifest_sha256 = payload.get("manifest_sha256") or "unknown"
    entry = record_decision(
        request=request,
        response=response,
        ruleset_sha256=ruleset_sha256,
        manifest_sha256=manifest_sha256,
    )
    return {"decision_id": entry["decision_id"]}

@router.get("/replay/{decision_id}")
def replay(decision_id: str):
    try:
        return replay_decision(decision_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="decision not found")
