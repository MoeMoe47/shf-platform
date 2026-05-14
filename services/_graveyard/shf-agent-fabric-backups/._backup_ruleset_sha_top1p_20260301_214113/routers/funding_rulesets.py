from __future__ import annotations

from fastapi import APIRouter, HTTPException

from fabric.funding.rulesets import (
    list_rulesets,
    get_ruleset,
    list_lock_triggers,
    get_lock_triggers,
    list_discovery,
)

router = APIRouter(prefix="/api/funding", tags=["funding"])

# ---------------------------
# RULESETS (AIM_RULESET_V1 only)
# ---------------------------

@router.get("/rulesets")
def rulesets_index():
    # returns AIM_RULESET_INDEX_V1
    return list_rulesets()

@router.get("/rulesets/{ruleset_id}")
def rulesets_get(ruleset_id: str):
    obj = get_ruleset(ruleset_id)
    if not obj:
        raise HTTPException(status_code=404, detail="ruleset not found")
    return obj

# ---------------------------
# LOCK TRIGGERS (AIM_LOCK_TRIGGERS_V1 only)
# ---------------------------

@router.get("/lock-triggers")
def lock_triggers_index():
    # returns AIM_LOCK_TRIGGERS_INDEX_V1
    return list_lock_triggers()

@router.get("/lock-triggers/{ruleset_id}")
def lock_triggers_get(ruleset_id: str):
    obj = get_lock_triggers(ruleset_id)
    if not obj:
        raise HTTPException(status_code=404, detail="lock-triggers ruleset not found")
    return obj

# ---------------------------
# DISCOVERY (union index, read-only)
# ---------------------------

@router.get("/discovery")
def discovery_index():
    # returns AIM_DISCOVERY_INDEX_V1 (union of ruleset + lock_triggers)
    return list_discovery()
