from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from fabric.funding.simulator import simulate_ruleset


router = APIRouter(prefix="/api/funding", tags=["funding"])


class SimulateRequest(BaseModel):
    ruleset_id: str = Field(..., description="Ruleset file name without .json, or full ruleset_id")
    metrics: Dict[str, float] = Field(default_factory=dict)
    costs: Optional[Dict[str, float]] = None
    benchmarks: Optional[Dict[str, float]] = None
    watchtower: Optional[Dict[str, Any]] = None


def _load_ruleset(ruleset_id: str) -> Dict[str, Any]:
    root = Path(__file__).resolve().parents[1]  # shf-agent-fabric/
    p = root / "contracts" / "aim_rulesets" / f"{ruleset_id}.json"
    if not p.exists():
        # allow user to pass the filename-style or the canonical id
        alt = root / "contracts" / "aim_rulesets" / f"{ruleset_id.replace(':','_')}.json"
        if alt.exists():
            p = alt
        else:
            raise FileNotFoundError(str(p))
    return json.loads(p.read_text(encoding="utf-8"))


@router.post("/simulate")
def simulate(req: SimulateRequest) -> Dict[str, Any]:
    try:
        ruleset = _load_ruleset(req.ruleset_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Ruleset not found: {req.ruleset_id}")

    result = simulate_ruleset(
        ruleset=ruleset,
        metrics=req.metrics,
        costs=req.costs,
        benchmarks=req.benchmarks,
        watchtower=req.watchtower,
    )
    return result
