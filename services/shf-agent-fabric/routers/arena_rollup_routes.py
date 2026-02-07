from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

from fastapi import APIRouter, Query

from fabric.arena.rollup import build_loo_payload, build_arena_metrics

router = APIRouter(prefix="/arena", tags=["arena-rollup"])

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "db" / "arena"
OUT_FILE = OUT_DIR / "loo_payload.latest.json"


@router.get("/loo/payload")
def arena_loo_payload(days: int = Query(30, ge=1, le=365), write: bool = Query(True)) -> Dict[str, Any]:
    """
    Generates a LOO-compatible payload for Arena.
    If write=true, writes to db/arena/loo_payload.latest.json (background only).
    """
    payload = build_loo_payload(days=int(days))

    if write:
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        OUT_FILE.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    return {
        "ok": True,
        "days": int(days),
        "wrote": bool(write),
        "path": str(OUT_FILE) if write else None,
        "payload": payload,
    }


@router.get("/metrics")
def arena_metrics(days: int = Query(30, ge=1, le=365)) -> Dict[str, Any]:
    """
    Spectator-safe institutional metrics for Arena.
    """
    m = build_arena_metrics(days=int(days))
    return {"ok": True, "days": int(days), "metrics": m}
