from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.operator_contracts_service import CONTRACTS
from services.operator_contract_issuances_service import issue_contract

router = APIRouter(prefix="/api/v1/operator/issuances", tags=["operator-issuances-alias"])


class CreateIssuanceRequest(BaseModel):
    contract_code: str
    participant_id: str
    evidence_root_hash: str
    operator_id: str


@router.post("/create")
def create_issuance_route(body: CreateIssuanceRequest):
    contract = None
    for item in CONTRACTS.values():
        if item.get("contract_code") == body.contract_code:
            contract = item
            break

    if not contract:
        raise HTTPException(status_code=404, detail="contract not found")

    result = issue_contract(
        contract["id"],
        {
            "participant_id": body.participant_id,
            "program_id": "operator_ui_program",
            "submission_id": body.evidence_root_hash,
            "actor_id": body.operator_id,
        },
    )

    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("error", "issuance create failed"))

    issuance = result["issuance"]

    return {
        "ok": True,
        "issuance_id": issuance["id"],
        "issuance": issuance,
        "event_id": result.get("event_id"),
    }
