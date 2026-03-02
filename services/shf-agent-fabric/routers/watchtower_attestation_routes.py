from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel

from fabric.watchtower.attestation import create_attestation, verify_attestation_signature

router = APIRouter(prefix="/watchtower/attest", tags=["watchtower-attestation"])


def _split_csv(s: Optional[str]) -> List[str]:
    if not s:
        return []
    return [p.strip() for p in str(s).split(",") if p.strip()]


class VerifyReq(BaseModel):
    payload: Dict[str, Any]
    sig: str


@router.get("/root")
def attest_root(
    program_ids: Optional[str] = Query(default=None, description="CSV program ids to include in root proof"),
    top_n: int = Query(default=10, ge=1, le=200, description="Top N program tips in proof sample"),
) -> Dict[str, Any]:
    """
    Unit test contract:
      top-level keys: ok, payload, sig
    """
    pids = _split_csv(program_ids)
    att = create_attestation(program_ids=pids, top_n=int(top_n))
    return {"ok": True, "payload": att["payload"], "sig": att["sig"]}


@router.post("/verify")
def attest_verify(req: VerifyReq) -> Dict[str, Any]:
    out = verify_attestation_signature(payload=req.payload, sig=req.sig)
    # Ensure stable response shape for tests
    return {
        "ok": bool(out.get("ok")),
        "verified": bool(out.get("verified")),
        "kid": out.get("kid"),
        "error": out.get("error"),
    }
