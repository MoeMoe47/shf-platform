from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body, HTTPException

from services.ai_guardrails_service import (
    ai_guardrails_summary,
    audit_feed,
    check_ai_output,
    get_decision,
    list_decisions,
    list_policies,
)


router = APIRouter(prefix="/ai-guardrails", tags=["ai-guardrails"])


@router.get("/health")
def ai_guardrails_health() -> Dict[str, Any]:
    return {"ok": True, "service": "ai-swarm-guardrails-v1", **ai_guardrails_summary()}


@router.get("/policies")
def ai_guardrails_policies() -> Dict[str, Any]:
    policies = list_policies()
    return {"ok": True, "count": len(policies), "policies": policies}


@router.post("/check-output")
def ai_guardrails_check_output(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    decision = check_ai_output(payload or {})
    return {"ok": True, "decision": decision}


@router.get("/decisions")
def ai_guardrails_decisions() -> Dict[str, Any]:
    decisions = list_decisions()
    return {"ok": True, "count": len(decisions), "decisions": decisions}


@router.get("/decisions/{decision_id}")
def ai_guardrails_get_decision(decision_id: str) -> Dict[str, Any]:
    decision = get_decision(decision_id)
    if not decision:
        raise HTTPException(status_code=404, detail="ai guardrail decision not found")
    return {"ok": True, "decision": decision}


@router.get("/audit-feed")
def ai_guardrails_audit_feed(limit: int = 100) -> Dict[str, Any]:
    events = audit_feed(limit=limit)
    return {"ok": True, "count": len(events), "events": events}
