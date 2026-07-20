from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from routers.v1_command_center_routes import require_v1_command_center_access
from services.truth_pipeline.service import entity_record, trace_for, truth_package_record, truth_pipeline_payload

router = APIRouter(prefix="/api/v1-command-center/truth-pipeline", tags=["v1-command-center"])


def _protected(session=Depends(require_v1_command_center_access)):
    return session


@router.get("/overview")
def overview(session=Depends(_protected)) -> dict:
    payload = truth_pipeline_payload()
    return {"metadata": payload["metadata"], "overview": payload["overview"], "pipeline": payload}


@router.get("/transitions")
def transitions(session=Depends(_protected)) -> dict:
    return {"transitions": truth_pipeline_payload()["transitions"]}


@router.get("/transitions/{contract_id}")
def transition(contract_id: str, session=Depends(_protected)) -> dict:
    matches = [item for item in truth_pipeline_payload()["transitions"] if item.get("contract_id") == contract_id]
    if not matches:
        raise HTTPException(status_code=404, detail="Truth pipeline transition not found")
    return {"contract_id": contract_id, "transitions": matches}


@router.get("/entities/{entity_id}")
def entity(entity_id: str, session=Depends(_protected)) -> dict:
    record = entity_record(entity_id)
    if not record:
        raise HTTPException(status_code=404, detail="Truth pipeline entity not found")
    return record


@router.get("/entities/{entity_id}/history")
def entity_history(entity_id: str, session=Depends(_protected)) -> dict:
    record = entity_record(entity_id)
    if not record:
        raise HTTPException(status_code=404, detail="Truth pipeline entity not found")
    return {"entity_id": entity_id, "truth_package_history": record.get("truth_packages", []), "report_readiness_history": record.get("report_readiness", [])}


@router.get("/traces/{trace_id}")
def trace(trace_id: str, session=Depends(_protected)) -> dict:
    record = trace_for(trace_id)
    if not record.get("record_count"):
        raise HTTPException(status_code=404, detail="Truth pipeline trace not found")
    return record


@router.get("/truth-packages/{truth_package_id}")
def truth_package(truth_package_id: str, session=Depends(_protected)) -> dict:
    record = truth_package_record(truth_package_id)
    if not record:
        raise HTTPException(status_code=404, detail="Truth package not found")
    return record


@router.get("/failures")
def failures(session=Depends(_protected)) -> dict:
    return {"failures": truth_pipeline_payload()["failures"]}


@router.get("/runtime-gates")
def runtime_gates(session=Depends(_protected)) -> dict:
    return {"runtime_gates": truth_pipeline_payload()["runtime_gates"]}
