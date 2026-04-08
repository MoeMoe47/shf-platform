from fastapi import APIRouter, Query
from services.operator_treasury_ledger_service import list_ledger, list_pool_balances

router = APIRouter(prefix="/api/v1/operator", tags=["operator-treasury-ledger"])

@router.get("/ledger")
def ledger_route(limit: int = Query(default=100)):
    return {"ok": True, "entries": list_ledger(limit=limit)}

@router.get("/pool-balances")
def pool_balances_route():
    return {"ok": True, "balances": list_pool_balances()}
