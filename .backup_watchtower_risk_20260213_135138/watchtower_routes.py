from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter

from fabric.watchtower.aggregator import build_watchtower_summary, build_watchtower_program_rows

router = APIRouter(prefix="/watchtower", tags=["watchtower"])

@router.get("/summary")
def watchtower_summary(days: int = 30, baseline_weeks: int = 8, top_n: int = 10) -> Dict[str, Any]:
    return build_watchtower_summary(days=int(days), baseline_weeks=int(baseline_weeks), top_n=int(top_n))

@router.get("/programs")
def watchtower_programs(days: int = 30, baseline_weeks: int = 8) -> Dict[str, Any]:
    rows, integrity = build_watchtower_program_rows(days=int(days), baseline_weeks=int(baseline_weeks))
    return {
        "ok": True,
        "days": int(days),
        "baseline_weeks": int(baseline_weeks),
        "count": len(rows),
        "integrity": integrity,
        "programs": rows,
    }
