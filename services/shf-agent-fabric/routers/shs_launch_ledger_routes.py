from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body, HTTPException, Query

from services.shs_launch_ledger_service import (
    add_signoff_to_record,
    add_version_to_record,
    compute_launch_gate_status,
    get_launch_audit_events,
    get_launch_record,
    get_launch_records,
    launch_readiness_summary,
    recalculate_launch_record,
    shs_launch_ledger_health,
    upsert_launch_record,
    validate_launch_record,
)


router = APIRouter(prefix="/shs-launch-ledger", tags=["shs-launch-ledger"])

SAFETY_FLAGS = {
    "public_approved": False,
    "mutated_shf_impact_data": False,
    "published_report": False,
}


def _safe_response(payload: Dict[str, Any]) -> Dict[str, Any]:
    return {**payload, **SAFETY_FLAGS}


@router.get("/health")
def health() -> Dict[str, Any]:
    return _safe_response(shs_launch_ledger_health())


@router.get("/records")
def records() -> Dict[str, Any]:
    items = get_launch_records()
    return _safe_response({"ok": True, "count": len(items), "records": items})


@router.get("/records/{ledger_id}")
def record(ledger_id: str) -> Dict[str, Any]:
    item = get_launch_record(ledger_id)
    if item is None:
        raise HTTPException(status_code=404, detail="launch ledger record not found")
    return _safe_response({"ok": True, "record": item, "gate": compute_launch_gate_status(item)})


@router.post("/records")
def upsert_record(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    validation = validate_launch_record(payload)
    item = upsert_launch_record(payload)
    return _safe_response({"ok": True, "record": item, "validation": validation})


@router.post("/records/{ledger_id}/signoff")
def signoff(ledger_id: str, payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    item = add_signoff_to_record(ledger_id, payload)
    if item is None:
        raise HTTPException(status_code=404, detail="launch ledger record not found")
    return _safe_response({"ok": True, "record": item, "gate": compute_launch_gate_status(item)})


@router.post("/records/{ledger_id}/version")
def version(ledger_id: str, payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    item = add_version_to_record(ledger_id, payload)
    if item is None:
        raise HTTPException(status_code=404, detail="launch ledger record not found")
    return _safe_response({"ok": True, "record": item, "gate": compute_launch_gate_status(item)})


@router.post("/records/{ledger_id}/recalculate")
def recalculate(ledger_id: str) -> Dict[str, Any]:
    item = recalculate_launch_record(ledger_id)
    if item is None:
        raise HTTPException(status_code=404, detail="launch ledger record not found")
    return _safe_response({"ok": True, "record": item, "gate": compute_launch_gate_status(item)})


@router.get("/audit")
def audit(limit: int = Query(default=100, ge=1, le=500)) -> Dict[str, Any]:
    events = get_launch_audit_events(limit=limit)
    return _safe_response({"ok": True, "count": len(events), "events": events})


@router.get("/readiness")
def readiness() -> Dict[str, Any]:
    return _safe_response(launch_readiness_summary())
