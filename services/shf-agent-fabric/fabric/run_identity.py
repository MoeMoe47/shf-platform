from __future__ import annotations

"""
AFCC-3 Phase 3 — verified identity for plan, approval and execution authority.

Identity comes only from an authenticated Fabric session (cookie + CSRF) whose
role holds the route's permission. Request bodies can never supply verified
identity: any actor/organization/tenant/source claims found in a body are kept
apart under `declared_identity` and labelled DECLARED.

Nothing here stores credentials: no session token, CSRF token, cookie, email or
password is ever copied into a record.
"""

from dataclasses import dataclass
from typing import Any, Dict, Mapping, Optional

from fastapi import HTTPException, Request

from auth.audit import record_auth_event
from auth.csrf import validate_csrf
from auth.dependencies import require_authenticated_user
from auth.permissions import has_global_scope, has_permission, normalize_role
from fabric.run_lifecycle import is_valid_id

VERIFIED = "VERIFIED"
DECLARED = "DECLARED"
NOT_CAPTURED = "NOT_CAPTURED"
NOT_APPLICABLE = "NOT_APPLICABLE"

SESSION_SOURCE_SYSTEM = "agent_fabric.session"

# Body keys that look like identity claims. Recorded as DECLARED, never trusted.
_DECLARED_KEYS = {
    "actor_id": ("actor_id", "actorId", "initiatedBy", "initiator_actor_id", "userId", "user_id", "approver_id"),
    "organization_id": ("organization_id", "organizationId", "org_id", "orgId"),
    "tenant_id": ("tenant_id", "tenantId"),
    "source_system": ("source_system", "sourceSystem"),
}


@dataclass(frozen=True)
class VerifiedActor:
    actor_id: str
    role: str
    permission: str
    organization_id: Optional[str]

    @property
    def global_scope(self) -> bool:
        return self.organization_id is None and has_global_scope(self.role)


def require_fabric_actor(permission: str):
    """Session + CSRF + explicit permission. No admin key, no service identity."""

    def dependency(request: Request) -> VerifiedActor:
        session = require_authenticated_user(request)
        if not has_permission(session.role, permission):
            record_auth_event(
                "permission_check_failed",
                user_id=session.user_id,
                route=request.url.path,
                method=request.method,
                result="denied",
                role=session.role,
                permission=permission,
            )
            raise HTTPException(status_code=403, detail="Forbidden")
        validate_csrf(request, session)
        org = session.organization_id if isinstance(session.organization_id, str) and session.organization_id else None
        return VerifiedActor(actor_id=session.user_id, role=normalize_role(session.role), permission=permission, organization_id=org)

    return dependency


def verified_identity_fields(actor: VerifiedActor, *, prefix: str) -> Dict[str, Any]:
    """Flat record fields for a verified actor. `prefix` is e.g. "initiator" or "approver"."""
    if actor.organization_id:
        org, org_status, scope = actor.organization_id, VERIFIED, "ORGANIZATION"
        # Same derivation the operational event service uses; the org is verified, the tenant follows from it.
        tenant, tenant_status = f"tenant:{actor.organization_id}", "DERIVED_FROM_VERIFIED_ORGANIZATION"
    else:
        org, org_status, scope = NOT_APPLICABLE, VERIFIED, "PLATFORM_GLOBAL"
        tenant, tenant_status = NOT_APPLICABLE, VERIFIED
    return {
        f"{prefix}_actor_id": actor.actor_id,
        f"{prefix}_type": "HUMAN",
        "organization_id": org,
        "tenant_id": tenant,
        "source_system": SESSION_SOURCE_SYSTEM,
        "identity_verification": {
            "actor": VERIFIED,
            "organization": org_status,
            "tenant": tenant_status,
            "source_system": VERIFIED,
        },
        "authority": {
            "authentication": "FABRIC_SESSION",
            "role": actor.role,
            "permission": actor.permission,
            "scope": scope,
        },
    }


def declared_identity(*bodies: Any) -> Optional[Dict[str, Any]]:
    """Identity-looking claims from request bodies, kept apart and labelled DECLARED."""
    found: Dict[str, str] = {}
    for body in bodies:
        if not isinstance(body, Mapping):
            continue
        for field, keys in _DECLARED_KEYS.items():
            if field in found:
                continue
            for key in keys:
                value = body.get(key)
                if value is None or value == "":
                    continue
                found[field] = value if is_valid_id(value) else "[redacted]"
                break
    if not found:
        return None
    return {**found, "verification": DECLARED}


def actor_may_act_on(actor: VerifiedActor, record: Mapping[str, Any]) -> bool:
    """Org-scoped actors may only act on records of their own verified organization.
    Global actors may act on any record. Records without a verified organization
    are platform records and are reachable only by global actors."""
    if actor.global_scope:
        return True
    return bool(actor.organization_id) and record.get("organization_id") == actor.organization_id
