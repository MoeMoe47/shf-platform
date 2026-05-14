from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from fabric.watchtower.self_audit.daily_cycle import run_daily_self_audit

router = APIRouter(prefix="/self-audit", tags=["self-audit"])


def _base_dir() -> Path:
    return Path(__file__).resolve().parents[3]


@router.get("/latest")
def get_latest_self_audit():
    latest_path = _base_dir() / "var" / "self_audit" / "latest.json"
    if not latest_path.exists():
        raise HTTPException(status_code=404, detail="No self-audit has been generated yet")
    return json.loads(latest_path.read_text())


@router.get("/latest/brief")
def get_latest_self_audit_brief():
    latest_brief_path = _base_dir() / "var" / "self_audit" / "briefs" / "latest.json"
    if not latest_brief_path.exists():
        raise HTTPException(status_code=404, detail="No self-audit brief has been generated yet")
    return json.loads(latest_brief_path.read_text())


@router.post("/run")
def run_self_audit(
    requested_by: Optional[str] = Query(default="command_center"),
):
    return run_daily_self_audit(
        _base_dir(),
        run_type="manual",
        trigger_source="command_center",
        requested_by=requested_by,
    )


@router.post("/run/scheduled")
def run_scheduled_self_audit():
    return run_daily_self_audit(
        _base_dir(),
        run_type="scheduled",
        trigger_source="daily_cycle",
        requested_by="scheduler",
    )
