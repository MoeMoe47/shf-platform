from __future__ import annotations

from fastapi import APIRouter

from fabric.funding.capabilities import funding_capabilities

router = APIRouter(prefix="/api/funding", tags=["funding"])

@router.get("/capabilities")
def get_capabilities():
    return funding_capabilities()
