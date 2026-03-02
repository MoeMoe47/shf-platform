from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from exports_signing import sign_payload, verify_payload
router = APIRouter(prefix="/api/exports", tags=["exports"])


class SignRequest(BaseModel):
    payload: Dict[str, Any] = Field(..., description="The JSON payload to canonicalize + sign")


class SignResponse(BaseModel):
    key_id: str
    alg: str
    issued_at_utc: str
    canonical_sha256: str
    signature_b64: str


class VerifyRequest(BaseModel):
    payload: Dict[str, Any]
    signature_b64: str


class VerifyResponse(BaseModel):
    valid: bool
    canonical_sha256: str


@router.post("/sign", response_model=SignResponse)
def sign_export(req: SignRequest):
    try:
        return sign_payload(req.payload)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify", response_model=VerifyResponse)
def verify_export(req: VerifyRequest):
    try:
        valid, h = verify_payload(req.payload, req.signature_b64)
        return {"valid": valid, "canonical_sha256": h}
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
