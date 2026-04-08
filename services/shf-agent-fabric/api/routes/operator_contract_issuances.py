from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from services.operator_contract_issuances_service import (
    issue_contract,
    list_issuances,
    get_issuance,
    submit_issuance,
    verify_issuance,
    settle_issuance,
)

router = APIRouter(tags=["operator-contract-issuances"])

class IssueContractRequest(BaseModel):
    participant_id: str
    program_id: str
    submission_id: str | None = None
    actor_id: str

class IssuanceActionRequest(BaseModel):
    actor_id: str
    submission_id: str | None = None

@router.post("/api/v1/operator/contracts/{contract_id}/issue")
def issue_contract_route(contract_id: str, body: IssueContractRequest):
    result = issue_contract(contract_id, body.model_dump())
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("error", "issue failed"))
    return result

@router.get("/api/v1/operator/contract-issuances")
def list_issuances_route(
    state: str | None = Query(default=None),
    contract_id: str | None = Query(default=None),
    participant_id: str | None = Query(default=None),
):
    return {
        "ok": True,
        "issuances": list_issuances(state=state, contract_id=contract_id, participant_id=participant_id),
    }

@router.get("/api/v1/operator/contract-issuances/{issuance_id}")
def get_issuance_route(issuance_id: str):
    result = get_issuance(issuance_id)
    if not result.get("ok"):
        raise HTTPException(status_code=404, detail=result.get("error", "issuance not found"))
    return result

@router.post("/api/v1/operator/contract-issuances/{issuance_id}/submit")
def submit_issuance_route(issuance_id: str, body: IssuanceActionRequest):
    result = submit_issuance(issuance_id, body.model_dump())
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("error", "submit failed"))
    return result

@router.post("/api/v1/operator/contract-issuances/{issuance_id}/verify")
def verify_issuance_route(issuance_id: str, body: IssuanceActionRequest):
    result = verify_issuance(issuance_id, body.model_dump())
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("error", "verify failed"))
    return result

@router.post("/api/v1/operator/contract-issuances/{issuance_id}/settle")
def settle_issuance_route(issuance_id: str, body: IssuanceActionRequest):
    result = settle_issuance(issuance_id, body.model_dump())
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("error", "settle failed"))
    return result
