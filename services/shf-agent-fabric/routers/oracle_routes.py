from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body, HTTPException

from services.oracle_service import (
    create_case,
    get_case,
    get_case_ruling,
    get_ruling,
    list_cases,
    list_rulings,
    oracle_summary,
    rule_case,
)


router = APIRouter(prefix="/oracle", tags=["oracle"])


@router.get("/health")
def oracle_health() -> Dict[str, Any]:
    return {"ok": True, "service": "oracle-layer-v1", **oracle_summary()}


@router.get("/cases")
def oracle_cases() -> Dict[str, Any]:
    cases = list_cases()
    return {"ok": True, "count": len(cases), "cases": cases}


@router.post("/cases")
def oracle_create_case(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    oracle_case = create_case(payload or {})
    return {"ok": True, "case": oracle_case}


@router.get("/cases/{case_id}")
def oracle_get_case(case_id: str) -> Dict[str, Any]:
    oracle_case = get_case(case_id)
    if not oracle_case:
        raise HTTPException(status_code=404, detail="oracle case not found")
    return {"ok": True, "case": oracle_case}


@router.post("/cases/{case_id}/rule")
def oracle_rule_case(case_id: str) -> Dict[str, Any]:
    ruling = rule_case(case_id)
    if not ruling:
        raise HTTPException(status_code=404, detail="oracle case not found")
    return {"ok": True, "ruling": ruling}


@router.get("/rulings")
def oracle_rulings() -> Dict[str, Any]:
    rulings = list_rulings()
    return {"ok": True, "count": len(rulings), "rulings": rulings}


@router.get("/rulings/{ruling_id}")
def oracle_get_ruling(ruling_id: str) -> Dict[str, Any]:
    ruling = get_ruling(ruling_id)
    if not ruling:
        raise HTTPException(status_code=404, detail="oracle ruling not found")
    return {"ok": True, "ruling": ruling}


@router.get("/cases/{case_id}/ruling")
def oracle_get_case_ruling(case_id: str) -> Dict[str, Any]:
    if not get_case(case_id):
        raise HTTPException(status_code=404, detail="oracle case not found")
    ruling = get_case_ruling(case_id)
    if not ruling:
        raise HTTPException(status_code=404, detail="oracle ruling not found")
    return {"ok": True, "ruling": ruling}
