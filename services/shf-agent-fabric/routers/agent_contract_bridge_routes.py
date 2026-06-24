from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter

from services.agent_contract_bridge_service import (
    agent_contract_bridge_agents,
    agent_contract_bridge_health,
    build_agent_contract_bridge_summary,
)


router = APIRouter(prefix="/agent-contract-bridge", tags=["agent-contract-bridge"])


@router.get("/health")
def health() -> Dict[str, Any]:
    return agent_contract_bridge_health()


@router.get("/summary")
def summary() -> Dict[str, Any]:
    return build_agent_contract_bridge_summary()


@router.get("/agents")
def agents() -> Dict[str, Any]:
    return agent_contract_bridge_agents()


@router.get("/alignment")
def alignment() -> Dict[str, Any]:
    result = build_agent_contract_bridge_summary()
    return {
        "ok": True,
        "layer": result["layer"],
        "alignment_status": result["alignment_status"],
        "matched_agents": result["matched_agents"],
        "missing_backend_agents": result["missing_backend_agents"],
        "extra_backend_agents": result["extra_backend_agents"],
        "dangerous_flags_enabled": result["dangerous_flags_enabled"],
        "execution_enabled": False,
        "warnings": result["warnings"],
        "blockers": result["blockers"],
    }
