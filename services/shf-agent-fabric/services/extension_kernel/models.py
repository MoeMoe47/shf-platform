from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from services.extension_kernel.constants import (
    APPROVAL_TYPES,
    CAPABILITY_TYPES,
    KERNEL_SCHEMA_VERSION,
    TRUST_LEVELS,
)


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


@dataclass(frozen=True)
class ExtensionDescriptor:
    extension_id: str
    name: str
    description: str
    version: str
    compatibility_version: str
    schema_version: str = KERNEL_SCHEMA_VERSION
    labels: tuple[str, ...] = ()

    def as_dict(self) -> dict[str, Any]:
        return {
            "extension_id": self.extension_id,
            "name": self.name,
            "description": self.description,
            "version": self.version,
            "compatibility_version": self.compatibility_version,
            "schema_version": self.schema_version,
            "labels": list(self.labels),
        }


@dataclass(frozen=True)
class ExtensionMetadata:
    created_by: str
    created_at: str = field(default_factory=utc_now)
    updated_at: str = ""
    provenance: tuple[str, ...] = ()

    def as_dict(self) -> dict[str, Any]:
        return {
            "created_by": self.created_by,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "provenance": list(self.provenance),
        }


@dataclass(frozen=True)
class ExtensionCapabilityContract:
    capability_type: str
    capability_id: str
    description: str = ""
    permissions: tuple[str, ...] = ()
    configuration_keys: tuple[str, ...] = ()

    def as_dict(self) -> dict[str, Any]:
        return {
            "capability_type": self.capability_type,
            "capability_id": self.capability_id,
            "description": self.description,
            "permissions": list(self.permissions),
            "configuration_keys": list(self.configuration_keys),
        }


@dataclass(frozen=True)
class ExtensionDependency:
    dependency_id: str
    version_constraint: str
    required: bool = True
    reason: str = ""

    def as_dict(self) -> dict[str, Any]:
        return {
            "dependency_id": self.dependency_id,
            "version_constraint": self.version_constraint,
            "required": self.required,
            "reason": self.reason,
        }


@dataclass(frozen=True)
class ExtensionSecurityContract:
    trust_level: str = "UNKNOWN"
    permissions: tuple[str, ...] = ()
    approval_types: tuple[str, ...] = APPROVAL_TYPES
    audit_required: bool = True
    policy_refs: tuple[str, ...] = ()

    def as_dict(self) -> dict[str, Any]:
        return {
            "trust_level": self.trust_level,
            "permissions": list(self.permissions),
            "approval_types": list(self.approval_types),
            "audit_required": self.audit_required,
            "policy_refs": list(self.policy_refs),
        }


@dataclass(frozen=True)
class ExtensionConfiguration:
    defaults: dict[str, Any] = field(default_factory=dict)
    required_keys: tuple[str, ...] = ()
    secret_keys: tuple[str, ...] = ()

    def as_dict(self) -> dict[str, Any]:
        return {
            "defaults": dict(self.defaults),
            "required_keys": list(self.required_keys),
            "secret_keys": list(self.secret_keys),
        }


@dataclass(frozen=True)
class ExtensionHealth:
    status: str = "UNKNOWN"
    checked_at: str = ""
    diagnostics: dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "checked_at": self.checked_at,
            "diagnostics": dict(self.diagnostics),
        }


@dataclass(frozen=True)
class ExtensionRollbackMetadata:
    supported: bool = True
    strategy: str = "disable_registration"
    rollback_version: str = ""
    migration_notes: str = ""

    def as_dict(self) -> dict[str, Any]:
        return {
            "supported": self.supported,
            "strategy": self.strategy,
            "rollback_version": self.rollback_version,
            "migration_notes": self.migration_notes,
        }


@dataclass(frozen=True)
class ExtensionManifest:
    descriptor: ExtensionDescriptor
    metadata: ExtensionMetadata
    lifecycle_state: str
    security: ExtensionSecurityContract
    capabilities: tuple[ExtensionCapabilityContract, ...] = ()
    dependencies: tuple[ExtensionDependency, ...] = ()
    configuration: ExtensionConfiguration = field(default_factory=ExtensionConfiguration)
    health: ExtensionHealth = field(default_factory=ExtensionHealth)
    rollback: ExtensionRollbackMetadata = field(default_factory=ExtensionRollbackMetadata)

    def as_dict(self) -> dict[str, Any]:
        return {
            "descriptor": self.descriptor.as_dict(),
            "metadata": self.metadata.as_dict(),
            "lifecycle_state": self.lifecycle_state,
            "security": self.security.as_dict(),
            "capabilities": [capability.as_dict() for capability in self.capabilities],
            "dependencies": [dependency.as_dict() for dependency in self.dependencies],
            "configuration": self.configuration.as_dict(),
            "health": self.health.as_dict(),
            "rollback": self.rollback.as_dict(),
        }


@dataclass(frozen=True)
class ExtensionRegistrationRecord:
    registration_id: str
    manifest: ExtensionManifest
    registered_at: str = field(default_factory=utc_now)
    status_reason: str = ""

    def as_dict(self) -> dict[str, Any]:
        return {
            "registration_id": self.registration_id,
            "manifest": self.manifest.as_dict(),
            "registered_at": self.registered_at,
            "status_reason": self.status_reason,
        }


@dataclass(frozen=True)
class ExtensionApprovalRequest:
    request_id: str
    registration_id: str
    approval_type: str
    requested_by: str
    requested_at: str = field(default_factory=utc_now)
    reason: str = ""

    def as_dict(self) -> dict[str, Any]:
        return {
            "request_id": self.request_id,
            "registration_id": self.registration_id,
            "approval_type": self.approval_type,
            "requested_by": self.requested_by,
            "requested_at": self.requested_at,
            "reason": self.reason,
        }


@dataclass(frozen=True)
class ExtensionActivationRequest:
    request_id: str
    registration_id: str
    requested_by: str
    requested_at: str = field(default_factory=utc_now)
    target_state: str = "READY"
    reason: str = ""

    def as_dict(self) -> dict[str, Any]:
        return {
            "request_id": self.request_id,
            "registration_id": self.registration_id,
            "requested_by": self.requested_by,
            "requested_at": self.requested_at,
            "target_state": self.target_state,
            "reason": self.reason,
        }


@dataclass(frozen=True)
class ExtensionKernelEvent:
    event_type: str
    registration_id: str
    occurred_at: str = field(default_factory=utc_now)
    payload: dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        return {
            "event_type": self.event_type,
            "registration_id": self.registration_id,
            "occurred_at": self.occurred_at,
            "payload": dict(self.payload),
        }


@dataclass(frozen=True)
class ExtensionKernelIssue:
    code: str
    message: str
    field: str = ""

    def as_dict(self) -> dict[str, str]:
        return {"code": self.code, "message": self.message, "field": self.field}


@dataclass(frozen=True)
class ExtensionKernelResult:
    ok: bool
    status: str
    issues: tuple[ExtensionKernelIssue, ...] = ()
    payload: dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        return {
            "ok": self.ok,
            "status": self.status,
            "issues": [issue.as_dict() for issue in self.issues],
            "payload": dict(self.payload),
        }


def allowed_capability_types() -> tuple[str, ...]:
    return CAPABILITY_TYPES


def allowed_trust_levels() -> tuple[str, ...]:
    return TRUST_LEVELS
