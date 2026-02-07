from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from fastapi import HTTPException

# jsonschema is a common dependency; if it's not installed, we'll surface a clean error.
try:
    from jsonschema import Draft202012Validator
except Exception as e:  # pragma: no cover
    Draft202012Validator = None  # type: ignore[assignment]
    _JSONSCHEMA_IMPORT_ERROR = e
else:
    _JSONSCHEMA_IMPORT_ERROR = None

ROOT = Path(__file__).resolve().parents[2]

# Canonical contract location (single source of truth)
CANONICAL_SCHEMA_PATH = ROOT / "contracts" / "registry_entity.schema.json"

@dataclass(frozen=True)
class ValidationIssue:
    path: str
    message: str

_validator_cache: Optional[Any] = None
_schema_cache: Optional[dict] = None

def _load_schema() -> dict:
    global _schema_cache
    if _schema_cache is not None:
        return _schema_cache
    if not CANONICAL_SCHEMA_PATH.exists():
        raise HTTPException(
            status_code=500,
            detail={
                "error": "registry_schema_missing",
                "message": "Canonical registry schema not found",
                "expected_path": str(CANONICAL_SCHEMA_PATH),
            },
        )
    try:
        _schema_cache = json.loads(CANONICAL_SCHEMA_PATH.read_text(encoding="utf-8"))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "registry_schema_unreadable",
                "message": "Failed to read canonical registry schema",
                "expected_path": str(CANONICAL_SCHEMA_PATH),
                "exception": str(e),
            },
        )
    return _schema_cache

def _get_validator():
    global _validator_cache
    if _validator_cache is not None:
        return _validator_cache
    if Draft202012Validator is None:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "jsonschema_not_available",
                "message": "jsonschema (Draft 2020-12) is required for strict validation",
                "exception": str(_JSONSCHEMA_IMPORT_ERROR),
            },
        )
    schema = _load_schema()
    _validator_cache = Draft202012Validator(schema)
    return _validator_cache

def _format_path(err) -> str:
    # err.path is a deque of keys/indices
    if not getattr(err, "path", None):
        return "$"
    parts = ["$"]
    for p in err.path:
        if isinstance(p, int):
            parts.append(f"[{p}]")
        else:
            parts.append(f".{p}")
    return "".join(parts)

def validate_registry_entity_or_422(payload: Dict[str, Any]) -> None:
    """
    Strict institutional validation:
    - Must conform to the canonical JSON schema.
    - Unknown fields are rejected by schema (unevaluatedProperties:false).
    - Returns 422 with structured issues.
    """
    v = _get_validator()
    errors = sorted(v.iter_errors(payload), key=lambda e: list(getattr(e, "path", [])))
    if not errors:
        return

    issues: List[dict] = []
    for e in errors:
        issues.append({
            "path": _format_path(e),
            "message": getattr(e, "message", "invalid"),
            "validator": getattr(e, "validator", None),
            "validator_value": getattr(e, "validator_value", None),
        })

    raise HTTPException(
        status_code=422,
        detail={
            "error": "registry_schema_validation_failed",
            "schema_path": str(CANONICAL_SCHEMA_PATH),
            "issues": issues,
        },
    )
