from fastapi import APIRouter
from services.outcome_efficiency_service import compute_efficiency

router = APIRouter(prefix="/api/v1/efficiency", tags=["efficiency"])

@router.get("/program/{program_id}")
def efficiency(program_id: str):

    result = compute_efficiency(program_id)

    return {"ok": True, "result": result}
