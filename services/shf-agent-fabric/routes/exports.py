from typing import Any, Dict
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from exports_signing import sign_payload, verify_payload

router = APIRouter(prefix="/api/exports", tags=["exports"])

class SignRequest(BaseModel):
    payload: Dict[str, Any]

class VerifyRequest(BaseModel):
    payload: Dict[str, Any]
    signature_b64: str

@router.post("/sign")
def sign_export(req: SignRequest):
    try:
        return sign_payload(req.payload)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify")
def verify_export(req: VerifyRequest):
    try:
        valid, h = verify_payload(req.payload, req.signature_b64)
        return {"valid": valid, "canonical_sha256": h}
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
