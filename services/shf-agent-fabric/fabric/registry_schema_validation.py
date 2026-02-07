from __future__ import annotations

from typing import Any, Dict, List

from fastapi import HTTPException

# NOTE:
# We cannot use fabric/registry/schema_validation.py because fabric/registry.py exists,
# so "fabric.registry" is a module, not a package. This file is the canonical validator.


def _normalize_errors(errs: List[Dict[str, Any]]) -> Dict[str, Any]:
    return {
        "message": "Schema validation failed",
        "violations": errs,
    }


def _reject_unknown_fields(payload: Dict[str, Any], allowed: set[str]) -> List[Dict[str, Any]]:
    unknown = sorted([k for k in payload.keys() if k not in allowed])
    if not unknown:
        return []
    return [{
        "path": "",
        "code": "unknown_fields",
        "message": "Unknown fields are not allowed",
        "fields": unknown,
    }]


def validate_registry_entity_or_422(entity: Dict[str, Any]) -> Dict[str, Any]:
    """
    Phase 1 (A+C) strict validator:
    - Reject unknown top-level fields
    - Require minimal canonical fields for institutional hygiene

    This is intentionally minimal; Phase 2+ will deepen the full contract validation.
    """
    if not isinstance(entity, dict):
        raise HTTPException(status_code=422, detail=_normalize_errors([{
            "path": "",
            "code": "type",
            "message": "Entity must be an object",
        }]))

    allowed = {
        "id", "kind", "name", "title", "orgId", "env", "environment",
        "legal", "policy", "lifecycle",
        "createdAt", "updatedAt", "hash",
        # allow optional known extension fields if already in use:
        "metadata", "notes", "tags",
    }

    errs: List[Dict[str, Any]] = []
    errs.extend(_reject_unknown_fields(entity, allowed))

    # Minimal required fields
    if not entity.get("id"):
        errs.append({"path": "id", "code": "required", "message": "id is required"})
    if not entity.get("kind"):
        errs.append({"path": "kind", "code": "required", "message": "kind is required"})
    if not (entity.get("name") or entity.get("title")):
        errs.append({"path": "name/title", "code": "required", "message": "name or title is required"})
    if not entity.get("orgId"):
        errs.append({"path": "orgId", "code": "required", "message": "orgId is required"})

    # legal + retention baseline (if legal exists, it must be an object)
    legal = entity.get("legal")
    if legal is not None and not isinstance(legal, dict):
        errs.append({"path": "legal", "code": "type", "message": "legal must be an object"})
    policy = entity.get("policy")
    if policy is not None and not isinstance(policy, dict):
        errs.append({"path": "policy", "code": "type", "message": "policy must be an object"})
    lifecycle = entity.get("lifecycle")
    if lifecycle is not None and not isinstance(lifecycle, dict):
        errs.append({"path": "lifecycle", "code": "type", "message": "lifecycle must be an object"})

    if errs:
        raise HTTPException(status_code=422, detail=_normalize_errors(errs))

    return entity


def validate_reason_or_422(reason: Any) -> str:
    if not isinstance(reason, str) or not reason.strip():
        raise HTTPException(status_code=422, detail=_normalize_errors([{
            "path": "reason",
            "code": "required",
            "message": "reason is required and must be a non-empty string",
        }]))
    return reason.strip()
