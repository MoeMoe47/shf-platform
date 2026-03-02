from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Query

from fabric.watchtower.global_chain_root import (
    generate_global_chain_root,
    verify_global_attestation_chain,
)
from fabric.watchtower.store import ensure_schema, get_risk_snapshots  # type: ignore


router = APIRouter(prefix="/watchtower/attest", tags=["watchtower"])


@router.post("/root")
def attest_root(
    window_days: int = Query(30, ge=1, le=3650),
    baseline_weeks: int = Query(8, ge=1, le=520),
    notes: str = Query("", max_length=5000),
    signer: Optional[str] = Query(None, max_length=200),
) -> Dict[str, Any]:
    """
    Creates an attestation for the current system-wide snapshot state.
    Contract-safe: adds new endpoint without changing existing responses.
    """
    ensure_schema()
    return generate_global_chain_root(
        window_days=int(window_days),
        baseline_weeks=int(baseline_weeks),
        notes=str(notes or ""),
        signer=(str(signer) if signer else None),
    )


@router.get("/chain/verify")
def attest_chain_verify(limit: int = Query(5000, ge=1, le=5000)) -> Dict[str, Any]:
    ensure_schema()
    return verify_global_attestation_chain(limit=int(limit))


@router.get("/program/{program_id}/snapshots")
def attest_program_snapshots(program_id: str, limit: int = Query(50, ge=1, le=500)) -> Dict[str, Any]:
    """
    Convenience read endpoint for enforcement snapshots.
    """
    ensure_schema()
    snaps = get_risk_snapshots(program_id, limit=int(limit))
    return {"ok": True, "program_id": str(program_id), "count": len(snaps), "snapshots": snaps}
