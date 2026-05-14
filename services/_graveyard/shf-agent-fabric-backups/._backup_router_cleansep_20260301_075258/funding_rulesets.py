from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from fabric.funding.rulesets import list_rulesets, get_ruleset, list_lock_triggers, get_lock_triggers, list_discovery

router = APIRouter(prefix="/api/funding", tags=["funding-discovery"])


@router.get("/rulesets")
def rulesets_index():
    """
    Backward-compatible endpoint:
    - returns only kind=ruleset items
    - keeps the old keys partners may already rely on
    """
    idx = list_discovery(include_kinds=["ruleset"])
    rulesets = []
    for it in idx.get("items", []):
        # legacy shape compatibility
        rulesets.append({
            "ruleset_id": it.get("ruleset_id"),
            "ruleset_version": it.get("ruleset_version"),
            "status": it.get("status"),
            "program_category": it.get("program_category"),
            "scope": it.get("scope"),
            "metric_standard": it.get("metric_standard"),
            "effective_start": it.get("effective_start"),
            "effective_end": it.get("effective_end"),
            "filename": it.get("filename"),
            # new field (harmless for old clients)
            "kind": it.get("kind"),
        })
    return {
        "schema_version": "AIM_RULESET_INDEX_V1",
        "count": len(rulesets),
        "rulesets": rulesets,
    }


@router.get("/rulesets/{ruleset_id}")
def get_ruleset(ruleset_id: str):
    try:
        doc, _ = get_ruleset_doc(ruleset_id)
        return doc
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/lock-triggers")
def lock_triggers_index():
    """
    Read-only: returns only kind=lock_triggers items.
    """
    idx = list_discovery(include_kinds=["lock_triggers"])
    items = idx.get("items", [])
    return {
        "schema_version": "AIM_LOCK_TRIGGERS_INDEX_V1",
        "count": len(items),
        "items": items,
    }


@router.get("/lock-triggers/{ruleset_id}")
def get_lock_triggers(ruleset_id: str):
    """
    Read-only: returns a single lock trigger doc by id.
    Example: aim_lock_triggers_v1
    """
    try:
        doc, _ = get_ruleset_doc(ruleset_id)
        # guard: must be lock triggers
        if doc.get("schema_version") != "AIM_LOCK_TRIGGERS_V1":
            raise HTTPException(status_code=404, detail=f"not a lock triggers doc: {ruleset_id}")
        return doc
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/discovery")
def discovery(include_kinds: Optional[List[str]] = Query(default=None)):
    """
    Unified discovery for partners:
      /api/funding/discovery?include_kinds=ruleset&include_kinds=lock_triggers
    """
    return list_discovery(include_kinds=include_kinds)
