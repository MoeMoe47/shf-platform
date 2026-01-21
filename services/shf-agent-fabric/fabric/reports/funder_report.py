from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional
import json


def build_funder_report(run_id: str, limit: int = 5000, since: Optional[str] = None, include_raw: bool = False) -> Dict[str, Any]:
    """
    Build a funder-facing report JSON.
    - If the run registry file is missing: ok=false, RUN_NOT_FOUND
    - If the run exists but we don't have event data wired yet: ok=true with notes=["no_data_yet"]
    """
    base = Path(__file__).resolve().parents[2]
    run_fp = base / "registry" / "runs" / f"{run_id}.json"

    if not run_fp.exists():
        return {"ok": False, "error": "RUN_NOT_FOUND", "run_id": run_id}

    meta = json.loads(run_fp.read_text(encoding="utf-8"))
    run_obj = meta.get("run") if isinstance(meta.get("run"), dict) else meta

    return {
        "ok": True,
        "run_id": run_id,
        "run": run_obj or {"run_id": run_id},
        "targets": meta.get("targets", {}),
        "outcomes": meta.get("outcomes", {}),
        "events": {"count": 0},
        "notes": ["no_data_yet"],
        "filters": {"limit": limit, "since": since},
    }
