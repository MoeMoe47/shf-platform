from __future__ import annotations
from typing import Any, Dict, Optional, Literal

from fastapi import APIRouter, Body, HTTPException

from app.core.growth_provider import get_provider
from app.core import settings

router = APIRouter(prefix="/api/growth", tags=["growth"])

@router.get("/dashboard")
def growth_dashboard() -> Dict[str, Any]:
    prov = get_provider()
    d = prov.dashboard()
    d["provider"] = getattr(prov, "__class__", type(prov)).__name__
    return d

@router.get("/claims")
def list_claims() -> Dict[str, Any]:
    prov = get_provider()
    return {"items": prov.list_claims()}

@router.post("/claims/{claim_id}/challenge")
def challenge_claim(
    claim_id: str,
    actor_id: str = Body(..., embed=True),
    confidence: float = Body(..., embed=True),
    stake: float = Body(settings.DEFAULT_STAKE, embed=True),
) -> Dict[str, Any]:
    prov = get_provider()
    return prov.add_position(claim_id=claim_id, actor_id=actor_id, side="skeptic", confidence=confidence, stake=stake)

@router.post("/claims/{claim_id}/support")
def support_claim(
    claim_id: str,
    actor_id: str = Body(..., embed=True),
    confidence: float = Body(..., embed=True),
    stake: float = Body(settings.DEFAULT_STAKE, embed=True),
) -> Dict[str, Any]:
    prov = get_provider()
    return prov.add_position(claim_id=claim_id, actor_id=actor_id, side="scout", confidence=confidence, stake=stake)

@router.post("/claims/{claim_id}/resolve")
def resolve_claim(
    claim_id: str,
    outcome: Literal[0,1] = Body(..., embed=True),
    note: str = Body("", embed=True),
) -> Dict[str, Any]:
    prov = get_provider()
    return prov.resolve(claim_id=claim_id, outcome=int(outcome), note=note)

@router.post("/agents/journal")
def agent_journal(
    actor_id: str = Body(..., embed=True),
    kind: Literal["agent","human"] = Body("agent", embed=True),
    claim_id: Optional[str] = Body(None, embed=True),
    entry: Dict[str, Any] = Body(...),
) -> Dict[str, Any]:
    """
    entry shape suggestion (top-1%):
      {
        "hypothesis": "...",
        "evidence": [{"type":"link|metric|attestation","value":"..."}],
        "confidence": 0.72,
        "expected_value": 123.4,
        "game_theory": {"opponents":"...","strategy":"...","risk":"..."},
        "falsify": ["what would change my mind"]
      }
    """
    prov = get_provider()
    return prov.add_journal(actor_id=actor_id, kind=kind, claim_id=claim_id, entry=entry)
