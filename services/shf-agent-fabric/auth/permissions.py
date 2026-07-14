from __future__ import annotations

from typing import Iterable

ROLE_SHS_ADMIN = "shs_admin"
ROLE_CLIENT_ADMIN = "client_admin"
ROLE_CLIENT = "client"

PERMISSIONS = (
    "bos.executive.read",
    "bos.orchestrator.read",
    "bos.orchestrator.review",
    "bos.command.preview",
    "bos.command.approve",
    "bos.scheduler.read",
    "bos.scheduler.manage_local",
    "bos.notifications.read",
    "bos.notifications.review",
    "bos.persistence.read",
    "bos.persistence.migrate_local",
    "bos.tracking.read",
    "bos.registry.read",
    "bos.agents.read",
    "bos.agents.approve",
    "bos.reports.read",
    "bos.direct_connect.read",
    "bos.governance.read",
    "bos.identity.read",
    "bos.identity.manage",
)

CLIENT_PERMISSIONS = (
    "bos.reports.read",
)

ROLE_PERMISSION_MAP = {
    ROLE_SHS_ADMIN: tuple(PERMISSIONS),
    ROLE_CLIENT_ADMIN: CLIENT_PERMISSIONS,
    ROLE_CLIENT: (),
}


def normalize_role(role: str | None) -> str:
    value = str(role or "").strip().lower()
    if value in {"shs_admin", "shs-admin", "super_admin", "system_admin"}:
        return ROLE_SHS_ADMIN
    if value in {"client_admin", "client-admin", "admin_client"}:
        return ROLE_CLIENT_ADMIN
    return ROLE_CLIENT


def permissions_for_role(role: str | None) -> list[str]:
    return list(ROLE_PERMISSION_MAP.get(normalize_role(role), ()))


def has_permission(role: str | None, permission: str) -> bool:
    return permission in permissions_for_role(role)


def has_any_permission(role: str | None, permissions: Iterable[str]) -> bool:
    owned = set(permissions_for_role(role))
    return any(permission in owned for permission in permissions)


def route_access_matrix() -> list[dict]:
    return [
        {
            "route": "/ops/identity-access",
            "required_role": ROLE_SHS_ADMIN,
            "required_permission": "bos.identity.read",
            "client_admin": "blocked",
            "public": "blocked",
        },
        {
            "route": "/ops/executive-command",
            "required_role": ROLE_SHS_ADMIN,
            "required_permission": "bos.executive.read",
            "client_admin": "blocked",
            "public": "blocked",
        },
        {
            "route": "/ops/orchestrator",
            "required_role": ROLE_SHS_ADMIN,
            "required_permission": "bos.orchestrator.read",
            "client_admin": "blocked",
            "public": "blocked",
        },
        {
            "route": "/ops/command-bus",
            "required_role": ROLE_SHS_ADMIN,
            "required_permission": "bos.command.preview",
            "client_admin": "blocked",
            "public": "blocked",
        },
        {
            "route": "/ops/persistence",
            "required_role": ROLE_SHS_ADMIN,
            "required_permission": "bos.persistence.read",
            "client_admin": "blocked",
            "public": "blocked",
        },
    ]

