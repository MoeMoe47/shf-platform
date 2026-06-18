from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body

from services.evidence_package_service import (
    batch_build_evidence_packages,
    build_evidence_package,
    evidence_package_health,
    evidence_package_readiness,
    evidence_package_schema,
    evidence_package_summary,
)


router = APIRouter(prefix="/evidence-package", tags=["evidence-package"])


@router.get("/health")
def health() -> Dict[str, Any]:
    return evidence_package_health()


@router.get("/schema")
def schema() -> Dict[str, Any]:
    return evidence_package_schema()


@router.get("/summary")
def summary() -> Dict[str, Any]:
    return evidence_package_summary()


@router.post("/build")
def build(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    return build_evidence_package(payload)


@router.post("/batch-build")
def batch_build(payload: Any = Body(default=[])) -> Dict[str, Any]:
    records = payload.get("records") if isinstance(payload, dict) else payload
    return batch_build_evidence_packages(records)


@router.get("/readiness")
def readiness() -> Dict[str, Any]:
    return evidence_package_readiness()
