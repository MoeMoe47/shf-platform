from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Body

from fabric.watchtower.aggregator import build_watchtower_summary, build_watchtower_program_rows
from fabric.watchtower.store import set_quarantine, clear_quarantine, get_quarantine_map, get_risk_history


router = APIRouter(prefix="/watchtower", tags=["watchtower"])

@router.get("/summary")
def watchtower_summary(days: int = 30, baseline_weeks: int = 8, top_n: int = 10) -> Dict[str, Any]:
    return build_watchtower_summary(days=int(days), baseline_weeks=int(baseline_weeks), top_n=int(top_n))

@router.get("/programs")
def watchtower_programs(days: int = 30, baseline_weeks: int = 8) -> Dict[str, Any]:
    rows, integrity = build_watchtower_program_rows(days=int(days), baseline_weeks=int(baseline_weeks))
    return {
        "ok": True,
        "days": int(days),
        "baseline_weeks": int(baseline_weeks),
        "count": len(rows),
        "integrity": integrity,
        "programs": rows,
    }

@router.get("/quarantine")
def watchtower_quarantine() -> Dict[str, Any]:
    q = get_quarantine_map()
    return {"ok": True, "count": len(q), "quarantine": q}


@router.post("/quarantine/{program_id}")
def watchtower_set_quarantine(
    program_id: str,
    payload: Dict[str, Any] = Body(default={}),
) -> Dict[str, Any]:
    reason = str((payload or {}).get("reason") or "manual_quarantine")
    expires_at = (payload or {}).get("expires_at")
    created_by = str((payload or {}).get("created_by") or "")
    exp = int(expires_at) if expires_at is not None and str(expires_at).strip() else None
    set_quarantine(program_id, reason=reason, expires_at=exp, created_by=(created_by or None))
    return {"ok": True, "program_id": program_id, "status": "quarantined"}


@router.delete("/quarantine/{program_id}")
def watchtower_clear_quarantine(program_id: str) -> Dict[str, Any]:
    clear_quarantine(program_id)
    return {"ok": True, "program_id": program_id, "status": "cleared"}


@router.get("/risk/history")
def watchtower_risk_history(program_id: str, limit: int = 50) -> Dict[str, Any]:
    hist = get_risk_history(program_id, limit=int(limit))
    return {"ok": True, "program_id": program_id, "count": len(hist), "history": hist}
