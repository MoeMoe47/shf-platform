from __future__ import annotations

from typing import Any, Iterable

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel

from fabric.admin_auth import require_admin_key
from fabric.registry_schema_validation import validate_registry_entity_or_422
from fabric.registry_canon import (
    list_entities,
    get_entity,
    upsert_entity,
    set_lifecycle,
    add_attestation,
    read_events,
)

from fabric.registry_event_ledger import (
    list_ledger_events,
    verify_ledger,
    auditor_one_liner,
)

try:
    from fabric.registry_parity import enforce_entity_parity, enforce_lifecycle_transition
except Exception:
    enforce_entity_parity = None
    enforce_lifecycle_transition = None


router = APIRouter(
    prefix="/admin/registry",
    tags=["admin-registry"],
    dependencies=[Depends(require_admin_key)],
)

# -------------------------
# RBAC + Org Isolation
# -------------------------

ROLE_READ = {"registry_readonly", "registry_admin", "registry_super"}
ROLE_WRITE = {"registry_admin", "registry_super"}


def _require_role(
    x_admin_role: str | None,
    allowed: set[str],
) -> str:
    role = (x_admin_role or "").strip()
    if not role:
        raise HTTPException(status_code=403, detail={"error": "missing_role", "allowed": sorted(list(allowed))})
    if role not in allowed:
        raise HTTPException(status_code=403, detail={"error": "forbidden_role", "role": role, "allowed": sorted(list(allowed))})
    return role


def _require_org(x_org_id: str | None) -> str:
    org_id = (x_org_id or "").strip()
    if not org_id:
        raise HTTPException(status_code=400, detail={"error": "missing_org", "hint": "Send header X-Org-Id"})
    return org_id


def _entity_org_id(entity: Any) -> str | None:
    if isinstance(entity, dict):
        v = entity.get("orgId")
        return v if isinstance(v, str) else None
    return None


def _filter_by_org(items: Iterable[Any], org_id: str, role: str) -> list[Any]:
    # registry_super can see everything (optional but useful)
    if role == "registry_super":
        return list(items)

    out: list[Any] = []
    for it in items:
        if _entity_org_id(it) == org_id:
            out.append(it)
    return out


def _assert_write_org(entity: dict[str, Any], org_id: str, role: str) -> None:
    if role == "registry_super":
        return
    ent_org = _entity_org_id(entity) or ""
    if ent_org != org_id:
        raise HTTPException(
            status_code=403,
            detail={"error": "org_isolation_write", "orgId": org_id, "entityOrgId": (ent_org or "MISSING")},
        )


# -------------------------
# Request bodies
# -------------------------

class UpsertBody(BaseModel):
    entity: dict[str, Any]
    reason: str = "admin_upsert"


class LifecycleBody(BaseModel):
    status: str
    reason: str = "admin_lifecycle"


class AttestBody(BaseModel):
    attestation: dict[str, Any]
    reason: str = "admin_attest"


# -------------------------
# Routes (order matters)
# -------------------------

@router.get("")
def admin_list(
    kind: str | None = Query(default=None),
    x_admin_role: str | None = Header(default=None, alias="X-Admin-Role"),
    x_org_id: str | None = Header(default=None, alias="X-Org-Id"),
):
    role = _require_role(x_admin_role, ROLE_READ)
    org_id = _require_org(x_org_id)

    items = list_entities(kind=kind)
    items = _filter_by_org(items, org_id=org_id, role=role)
    return {"items": items, "orgId": org_id, "kind": kind}


@router.get("/events")
def admin_events(
    limit: int = 200,
    entity_id: str | None = None,
    x_admin_role: str | None = Header(default=None, alias="X-Admin-Role"),
    x_org_id: str | None = Header(default=None, alias="X-Org-Id"),
):
    role = _require_role(x_admin_role, ROLE_READ)
    org_id = _require_org(x_org_id)

    items = read_events(limit=limit, entity_id=entity_id)

    # Filter events by org unless super
    if role != "registry_super":
        filtered: list[dict[str, Any]] = []
        for ev in items:
            if isinstance(ev, dict) and ev.get("orgId") == org_id:
                filtered.append(ev)
        items = filtered

    return {"items": items, "orgId": org_id, "entityId": entity_id}


@router.get("/events/ledger")
def admin_ledger(
    limit: int = 50,
    entity_id: str | None = None,
    x_admin_role: str | None = Header(default=None, alias="X-Admin-Role"),
    x_org_id: str | None = Header(default=None, alias="X-Org-Id"),
):
    role = _require_role(x_admin_role, ROLE_READ)
    org_id = _require_org(x_org_id)

    items = list_ledger_events(limit=limit, entity_id=entity_id)

    # Filter ledger events by org unless super
    if role != "registry_super":
        filtered: list[dict[str, Any]] = []
        for ev in items:
            if isinstance(ev, dict) and ev.get("orgId") == org_id:
                filtered.append(ev)
        items = filtered

    return {"items": items, "orgId": org_id, "entityId": entity_id}


@router.get("/events/verify")
def verify_events(
    entity_id: str | None = None,
    x_admin_role: str | None = Header(default=None, alias="X-Admin-Role"),
    x_org_id: str | None = Header(default=None, alias="X-Org-Id"),
):
    # Phase 3: verify is read-only, org-isolated unless super
    role = _require_role(x_admin_role, ROLE_READ)
    org_id = _require_org(x_org_id)

    v = verify_ledger(entity_id=entity_id)

    # If not super, we can only safely claim PASS/FAIL for the org slice.
    # So: run verification on org-filtered stream by using entity_id when supplied,
    # and otherwise treat it as "global ledger status" but still return orgId.
    # (If you want strict org-sliced verification, we can add verify_ledger_org() later.)
    return {
        "ok": bool(v.get("ok")),
        "pass": bool(v.get("pass")),
        "orgId": org_id,
        "entityId": entity_id,
        "auditor_one_liner": auditor_one_liner(v),
        "details": v,
        "note": ("registry_super can interpret as global; others should treat as informational unless per-entity verify is used"),
    }


@router.get("/{entity_id}")
def admin_get(
    entity_id: str,
    x_admin_role: str | None = Header(default=None, alias="X-Admin-Role"),
    x_org_id: str | None = Header(default=None, alias="X-Org-Id"),
):
    role = _require_role(x_admin_role, ROLE_READ)
    org_id = _require_org(x_org_id)

    e = get_entity(entity_id)
    if not e:
        raise HTTPException(status_code=404, detail="not found")

    if role != "registry_super" and _entity_org_id(e) != org_id:
        raise HTTPException(status_code=404, detail="not found")  # hide existence cross-org

    return e


@router.post("/upsert")
def admin_upsert(
    body: UpsertBody,
    x_admin_role: str | None = Header(default=None, alias="X-Admin-Role"),
    x_org_id: str | None = Header(default=None, alias="X-Org-Id"),
):
    role = _require_role(x_admin_role, ROLE_WRITE)
    org_id = _require_org(x_org_id)

    # Validate entity schema (422 if invalid)
    validate_registry_entity_or_422(body.entity)

    # Org isolation
    _assert_write_org(body.entity, org_id=org_id, role=role)

    # Optional parity enforcement
    if enforce_entity_parity:
        enforce_entity_parity(body.entity)

    try:
        return upsert_entity(body.entity, reason=body.reason)
    except HTTPException:
        raise
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.post("/{entity_id}/lifecycle")
def admin_set_lifecycle(
    entity_id: str,
    body: LifecycleBody,
    x_admin_role: str | None = Header(default=None, alias="X-Admin-Role"),
    x_org_id: str | None = Header(default=None, alias="X-Org-Id"),
):
    role = _require_role(x_admin_role, ROLE_WRITE)
    org_id = _require_org(x_org_id)

    current = get_entity(entity_id)
    if not current:
        raise HTTPException(status_code=404, detail="not found")

    if role != "registry_super" and _entity_org_id(current) != org_id:
        raise HTTPException(status_code=404, detail="not found")

    before = "draft"
    if isinstance(current, dict):
        lc = current.get("lifecycle") if isinstance(current.get("lifecycle"), dict) else {}
        before = (lc.get("status") or "draft") if isinstance(lc, dict) else "draft"

    if enforce_lifecycle_transition:
        enforce_lifecycle_transition(before, body.status)

    try:
        return set_lifecycle(entity_id, status=body.status, reason=body.reason)
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.post("/{entity_id}/attest")
def admin_attest(
    entity_id: str,
    body: AttestBody,
    x_admin_role: str | None = Header(default=None, alias="X-Admin-Role"),
    x_org_id: str | None = Header(default=None, alias="X-Org-Id"),
):
    role = _require_role(x_admin_role, ROLE_WRITE)
    org_id = _require_org(x_org_id)

    current = get_entity(entity_id)
    if not current:
        raise HTTPException(status_code=404, detail="not found")

    if role != "registry_super" and _entity_org_id(current) != org_id:
        raise HTTPException(status_code=404, detail="not found")

    try:
        return add_attestation(entity_id, body.attestation, reason=body.reason)
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.get("/{entity_id}/verify")
def verify_entity(
    entity_id: str,
    x_admin_role: str | None = Header(default=None, alias="X-Admin-Role"),
    x_org_id: str | None = Header(default=None, alias="X-Org-Id"),
):
    role = _require_role(x_admin_role, ROLE_READ)
    org_id = _require_org(x_org_id)

    e = get_entity(entity_id)
    if not e:
        raise HTTPException(status_code=404, detail="not found")

    if role != "registry_super" and _entity_org_id(e) != org_id:
        raise HTTPException(status_code=404, detail="not found")

    v = verify_ledger(entity_id=entity_id)
    return {
        "ok": bool(v.get("ok")),
        "pass": bool(v.get("pass")),
        "orgId": org_id,
        "entityId": entity_id,
        "auditor_one_liner": auditor_one_liner(v),
        "details": v,
    }
