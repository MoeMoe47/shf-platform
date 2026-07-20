from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from routers.v1_command_center_routes import require_v1_command_center_access
from services.contract_runtime.registry import contract_foundation_record, foundation_payload

router = APIRouter(prefix="/api/v1-command-center/contract-foundation", tags=["v1-command-center"])


def _protected(session=Depends(require_v1_command_center_access)):
    return session


@router.get("/overview")
def overview(session=Depends(_protected)) -> dict:
    payload = foundation_payload()
    return {"metadata": payload["metadata"], "overview": payload["overview"], "ownership": payload["ownership"]}


@router.get("/identities")
def identities(session=Depends(_protected)) -> dict:
    return foundation_payload()["identity"]


@router.get("/persistence")
def persistence(session=Depends(_protected)) -> dict:
    return foundation_payload()["persistence"]


@router.get("/permissions")
def permissions(session=Depends(_protected)) -> dict:
    return {"permission_contract": foundation_payload()["overview"].get("permission_contract", {})}


@router.get("/traces")
def traces(session=Depends(_protected)) -> dict:
    return {"traceability_contract": foundation_payload()["overview"].get("traceability_contract", {})}


@router.get("/failures")
def failures(session=Depends(_protected)) -> dict:
    return foundation_payload()["failure_codes"]


@router.get("/contracts")
def contracts(session=Depends(_protected)) -> dict:
    return {"contracts": foundation_payload()["contracts"]}


@router.get("/contracts/{contract_id}")
def contract(contract_id: str, session=Depends(_protected)) -> dict:
    record = contract_foundation_record(contract_id)
    if not record:
        raise HTTPException(status_code=404, detail="Contract foundation record not found")
    return record


@router.get("/dead-letters")
def dead_letters(session=Depends(_protected)) -> dict:
    return {"dead_letters": foundation_payload()["dead_letters"]}


@router.get("/migrations")
def migrations(session=Depends(_protected)) -> dict:
    return {"migrations": foundation_payload()["migrations"]}

