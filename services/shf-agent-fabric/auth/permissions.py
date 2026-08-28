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

# Truth Spine permissions (Truth Spine security remediation).
#
# Read/write/verify/approve are deliberately separate permissions so that no
# single "create" or "admin" grant implies the ability to self-verify
# evidence or unilaterally publish institutional Truth - see
# services/truth_spine_service.py and routers/truth_routes.py for the
# endpoints that require each one.
TRUTH_PUBLIC_READ = "truth.public.read"
TRUTH_INTERNAL_READ = "truth.internal.read"
TRUTH_SOURCE_CREATE = "truth.source.create"
TRUTH_SOURCE_UPDATE = "truth.source.update"
TRUTH_SOURCE_VERIFY = "truth.source.verify"
TRUTH_CLAIM_CREATE = "truth.claim.create"
TRUTH_CLAIM_UPDATE = "truth.claim.update"
TRUTH_CLAIM_APPROVE_PUBLIC = "truth.claim.approve_public"
TRUTH_CLAIM_REVOKE_PUBLIC = "truth.claim.revoke_public"
TRUTH_CLAIM_APPROVE_INTERNAL = "truth.claim.approve_internal"
TRUTH_CLAIM_REVOKE_INTERNAL = "truth.claim.revoke_internal"
TRUTH_PUBLIC_POPULATION_APPROVE = "truth.public_population.approve"
TRUTH_PUBLIC_POPULATION_REVOKE = "truth.public_population.revoke"
TRUTH_PUBLIC_POPULATION_AUTHORITY_MANAGE = "truth.public_population.authority.manage"
TRUTH_PUBLIC_POPULATION_SIGNOFF_MANAGE = "truth.public_population.signoff.manage"
TRUTH_AUDIT_READ = "truth.audit.read"
TRUTH_ADMIN = "truth.admin"

TRUTH_PERMISSIONS = (
    TRUTH_PUBLIC_READ,
    TRUTH_INTERNAL_READ,
    TRUTH_SOURCE_CREATE,
    TRUTH_SOURCE_UPDATE,
    TRUTH_SOURCE_VERIFY,
    TRUTH_CLAIM_CREATE,
    TRUTH_CLAIM_UPDATE,
    TRUTH_CLAIM_APPROVE_PUBLIC,
    TRUTH_CLAIM_REVOKE_PUBLIC,
    TRUTH_CLAIM_APPROVE_INTERNAL,
    TRUTH_CLAIM_REVOKE_INTERNAL,
    TRUTH_PUBLIC_POPULATION_APPROVE,
    TRUTH_PUBLIC_POPULATION_REVOKE,
    TRUTH_PUBLIC_POPULATION_AUTHORITY_MANAGE,
    TRUTH_PUBLIC_POPULATION_SIGNOFF_MANAGE,
    TRUTH_AUDIT_READ,
    TRUTH_ADMIN,
)

SHF_EVENT_CREATE = "shf.event.create"
SHF_EVENT_READ = "shf.event.read"
SHF_EVIDENCE_CREATE = "shf.evidence.create"
SHF_EVIDENCE_READ = "shf.evidence.read"
SHF_METRIC_READ = "shf.metric.read"
SHF_REPORT_READ = "shf.report.read"
SHF_REPORT_GENERATE = "shf.report.generate"
SHF_REPORT_EXPORT = "shf.report.export"

SHF_TRUSTED_REPORTING_PERMISSIONS = (
    SHF_EVENT_CREATE,
    SHF_EVENT_READ,
    SHF_EVIDENCE_CREATE,
    SHF_EVIDENCE_READ,
    SHF_METRIC_READ,
    SHF_REPORT_READ,
    SHF_REPORT_GENERATE,
    SHF_REPORT_EXPORT,
)

# Verification and public-approval authority are intentionally reserved for
# ROLE_SHS_ADMIN only - this is what closes the self-verification-to-
# publication attack chain confirmed by the prior security audit. Client
# roles may propose evidence and claims for their own organization, but
# cannot verify their own evidence or unilaterally publish it.
_TRUTH_SHS_ADMIN_PERMISSIONS = (
    TRUTH_PUBLIC_READ,
    TRUTH_INTERNAL_READ,
    TRUTH_SOURCE_CREATE,
    TRUTH_SOURCE_UPDATE,
    TRUTH_SOURCE_VERIFY,
    TRUTH_CLAIM_CREATE,
    TRUTH_CLAIM_UPDATE,
    TRUTH_CLAIM_APPROVE_PUBLIC,
    TRUTH_CLAIM_REVOKE_PUBLIC,
    TRUTH_CLAIM_APPROVE_INTERNAL,
    TRUTH_CLAIM_REVOKE_INTERNAL,
    TRUTH_PUBLIC_POPULATION_APPROVE,
    TRUTH_PUBLIC_POPULATION_REVOKE,
    TRUTH_PUBLIC_POPULATION_AUTHORITY_MANAGE,
    TRUTH_PUBLIC_POPULATION_SIGNOFF_MANAGE,
    TRUTH_AUDIT_READ,
    TRUTH_ADMIN,
)
_TRUTH_CLIENT_ADMIN_PERMISSIONS = (
    TRUTH_PUBLIC_READ,
    TRUTH_INTERNAL_READ,
    TRUTH_SOURCE_CREATE,
    TRUTH_SOURCE_UPDATE,
    TRUTH_CLAIM_CREATE,
    TRUTH_CLAIM_UPDATE,
)
_TRUTH_CLIENT_PERMISSIONS = (
    TRUTH_PUBLIC_READ,
    TRUTH_INTERNAL_READ,
    TRUTH_SOURCE_CREATE,
    TRUTH_CLAIM_CREATE,
    TRUTH_CLAIM_UPDATE,
)

_SHF_ADMIN_REPORTING_PERMISSIONS = SHF_TRUSTED_REPORTING_PERMISSIONS
_SHF_CLIENT_ADMIN_REPORTING_PERMISSIONS = SHF_TRUSTED_REPORTING_PERMISSIONS
_SHF_CLIENT_REPORTING_PERMISSIONS = (
    SHF_EVENT_CREATE,
    SHF_EVENT_READ,
    SHF_EVIDENCE_CREATE,
    SHF_EVIDENCE_READ,
    SHF_METRIC_READ,
    SHF_REPORT_READ,
)

ROLE_PERMISSION_MAP = {
    ROLE_SHS_ADMIN: tuple(PERMISSIONS) + _TRUTH_SHS_ADMIN_PERMISSIONS + _SHF_ADMIN_REPORTING_PERMISSIONS,
    ROLE_CLIENT_ADMIN: CLIENT_PERMISSIONS + _TRUTH_CLIENT_ADMIN_PERMISSIONS + _SHF_CLIENT_ADMIN_REPORTING_PERMISSIONS,
    ROLE_CLIENT: () + _TRUTH_CLIENT_PERMISSIONS + _SHF_CLIENT_REPORTING_PERMISSIONS,
}


def has_global_scope(role: str | None) -> bool:
    """Only ROLE_SHS_ADMIN has cross-organization Truth Spine authority."""
    return normalize_role(role) == ROLE_SHS_ADMIN


def normalize_role(role: str | None) -> str:
    value = str(role or "").strip().lower()
    if value in {"shs_admin", "shs-admin", "super_admin", "system_admin"}:
        return ROLE_SHS_ADMIN
    if value in {"client_admin", "client-admin", "admin_client"}:
        return ROLE_CLIENT_ADMIN
    return ROLE_CLIENT


def permissions_for_role(role: str | None) -> list[str]:
    value = str(role or "").strip().lower()
    if value and normalize_role(value) == ROLE_CLIENT and value not in {"client", "student", "learner"}:
        return []
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
