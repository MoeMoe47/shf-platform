from fastapi import APIRouter
from services.execution_service import create_action, execute_action

router = APIRouter(prefix="/api/v1/execution", tags=["execution"])

@router.post("/create")
def create_execution_action(body: dict):

    result = create_action(
        body.get("action_type"),
        body.get("entity_type"),
        body.get("entity_id"),
        body.get("payload")
    )

    return {"ok": True, "result": result}


@router.post("/execute")
def execute_execution_action(body: dict):

    result = execute_action(
        body.get("action_id")
    )

    return {"ok": True, "result": result}
