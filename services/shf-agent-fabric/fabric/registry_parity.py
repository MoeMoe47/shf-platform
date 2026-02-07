from __future__ import annotations
from typing import Any, Dict, Optional

ALLOWED_STATUSES = ("active", "deprecated", "retired")
ALLOWED_TRANSITIONS = {
    "active": ("active", "deprecated", "retired"),
    "deprecated": ("deprecated", "retired"),
    "retired": ("retired",),
}

REQUIRED_LEGAL_KEYS = (
    "jurisdiction",
    "termsRef",
    "disclaimerRef",
    "classification",
    "dataCategory",
    "retention",
    "authority",
)

REQUIRED_RETENTION_KEYS = ("artifactsDays", "auditLogsDays", "deletionPolicy")

def _first_entity_like(locals_dict: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    for k in ("entity", "item", "body", "payload", "data", "req"):
        v = locals_dict.get(k)
        if isinstance(v, dict):
            return v
    for v in locals_dict.values():
        if isinstance(v, dict) and ("kind" in v or "id" in v or "entityId" in v):
            return v
    return None

def _normalize_defaults(entity: Dict[str, Any]) -> None:
    lc = entity.get("lifecycle") or {}
    if not isinstance(lc, dict):
        lc = {}
    lc["status"] = lc.get("status") or "active"
    entity["lifecycle"] = lc

    legal = entity.get("legal") or {}
    if not isinstance(legal, dict):
        legal = {}
    entity["legal"] = legal

def enforce_entity_parity(entity: Dict[str, Any]) -> None:
    if not isinstance(entity, dict):
        raise ValueError("registry parity: entity must be an object")

    _normalize_defaults(entity)

    kind = entity.get("kind")
    if kind not in ("agent", "app", 'business'):
        raise ValueError(f"registry parity: kind must be 'agent' or 'app' or 'business' (got {kind!r})")

    entity_id = entity.get("id") or entity.get("entityId")
    if not entity_id or not isinstance(entity_id, str):
        raise ValueError("registry parity: entity must include string 'id'")

    status = (entity.get("lifecycle") or {}).get("status")
    if status not in ALLOWED_STATUSES:
        raise ValueError(f"registry parity: lifecycle.status must be one of {ALLOWED_STATUSES} (got {status!r})")

    legal = entity.get("legal") or {}
    missing = [k for k in REQUIRED_LEGAL_KEYS if k not in legal]
    if missing:
        raise ValueError(f"registry parity: legal block missing keys: {missing}")

    retention = legal.get("retention")
    if not isinstance(retention, dict):
        raise ValueError("registry parity: legal.retention must be an object")
    missing_r = [k for k in REQUIRED_RETENTION_KEYS if k not in retention]
    if missing_r:
        raise ValueError(f"registry parity: legal.retention missing keys: {missing_r}")

def enforce_lifecycle_transition(before_status: str, after_status: str) -> None:
    if before_status not in ALLOWED_STATUSES:
        raise ValueError(f"registry parity: invalid before status {before_status!r}")
    if after_status not in ALLOWED_STATUSES:
        raise ValueError(f"registry parity: invalid after status {after_status!r}")
    allowed = ALLOWED_TRANSITIONS.get(before_status, ())
    if after_status not in allowed:
        raise ValueError(f"registry parity: illegal lifecycle transition {before_status!r} -> {after_status!r}")
def enforce_parity_from_locals(locals_dict: Dict[str, Any]) -> None:
    ent = _first_entity_like(locals_dict)

    # If router locals didn't include an entity dict, try to pull it from the request body
    if ent is None:
        body = locals_dict.get("body")

        if isinstance(body, dict):
            ent = body.get("entity") or body.get("attestation")
        else:
            if body is not None:
                ent = getattr(body, "entity", None) or getattr(body, "attestation", None)

        # If ent is still a Pydantic model, normalize to dict
        if ent is not None and hasattr(ent, "dict"):
            try:
                ent = ent.dict()
            except Exception:
                pass

    if ent is None:
        raise ValueError("registry parity: could not locate entity payload in route locals()")

    enforce_entity_parity(ent)


def enforce_lifecycle_from_locals(locals_dict: Dict[str, Any]) -> None:
    ent = _first_entity_like(locals_dict)
    after = None
    if isinstance(ent, dict):
        lc = ent.get("lifecycle") if isinstance(ent.get("lifecycle"), dict) else {}
        after = lc.get("status") or ent.get("status")

    if after is None:
        for v in locals_dict.values():
            if isinstance(v, dict) and ("status" in v):
                after = v.get("status")
                break

    if after is None:
        raise ValueError("registry parity: could not locate requested lifecycle.status")

    before = None
    for v in locals_dict.values():
        if isinstance(v, dict) and ("lifecycle" in v) and isinstance(v.get("lifecycle"), dict):
            before = v["lifecycle"].get("status")
            break

    if before is None:
        if after not in ALLOWED_STATUSES:
            raise ValueError(f"registry parity: lifecycle.status must be one of {ALLOWED_STATUSES} (got {after!r})")
        return

    enforce_lifecycle_transition(before, after)

ALLOWED_LIFECYCLE_STATUSES = ("draft","review","active","suspended","retired")

ALLOWED_LIFECYCLE_TRANSITIONS = {
  "draft":     ("review","retired"),
  "review":    ("active","draft","retired"),
  "active":    ("suspended","retired"),
  "suspended": ("active","retired"),
  "retired":   (),
}

def enforce_lifecycle_transition(before: str, after: str):
    b = (before or "draft").strip().lower()
    a = (after or "").strip().lower()
    if a not in ALLOWED_LIFECYCLE_STATUSES:
        raise ValueError(f"invalid lifecycle status: {after}")
    allowed = ALLOWED_LIFECYCLE_TRANSITIONS.get(b, ())
    if a == b:
        return True
    if a not in allowed:
        raise ValueError(f"invalid lifecycle transition: {before} -> {after}")
    return True

def enforce_lifecycle_from_locals(loc):
    body = loc.get("body")
    entity_id = loc.get("entity_id")
    if not entity_id:
        raise ValueError("missing entity_id")
    if not body:
        raise ValueError("missing body")
    status = getattr(body, "status", None) if body is not None else None
    if not status:
        raise ValueError("missing body.status")
    return True
