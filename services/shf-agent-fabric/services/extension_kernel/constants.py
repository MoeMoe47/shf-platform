from __future__ import annotations

from enum import StrEnum

KERNEL_SCHEMA_VERSION = "shs.extension_kernel.foundation.v1"


class ExtensionLifecycleState(StrEnum):
    DISCOVERED = "DISCOVERED"
    REGISTERED = "REGISTERED"
    VALIDATED = "VALIDATED"
    OWNER_APPROVED = "OWNER_APPROVED"
    READY = "READY"
    ACTIVE = "ACTIVE"
    LIMITED = "LIMITED"
    SUSPENDED = "SUSPENDED"
    DISABLED = "DISABLED"
    RETIRED = "RETIRED"


class ExtensionTrustLevel(StrEnum):
    UNKNOWN = "UNKNOWN"
    DECLARED = "DECLARED"
    VERIFIED = "VERIFIED"
    APPROVED = "APPROVED"
    RESTRICTED = "RESTRICTED"


class ExtensionApprovalType(StrEnum):
    TECHNICAL = "TECHNICAL"
    SECURITY = "SECURITY"
    GOVERNANCE = "GOVERNANCE"
    OWNER = "OWNER"
    RUNTIME = "RUNTIME"
    ACTIVATION = "ACTIVATION"


class ExtensionCapabilityType(StrEnum):
    READ = "READ"
    WRITE = "WRITE"
    EVENT = "EVENT"
    PROJECTION = "PROJECTION"
    NOTIFICATION = "NOTIFICATION"
    VALIDATION = "VALIDATION"
    OBSERVER = "OBSERVER"
    ADAPTER = "ADAPTER"
    HOOK = "HOOK"
    MIDDLEWARE = "MIDDLEWARE"
    PLUGIN = "PLUGIN"
    REGISTRY = "REGISTRY"


class ExtensionEventType(StrEnum):
    DISCOVERED = "EXTENSION_DISCOVERED"
    REGISTERED = "EXTENSION_REGISTERED"
    VALIDATED = "EXTENSION_VALIDATED"
    APPROVAL_REQUESTED = "EXTENSION_APPROVAL_REQUESTED"
    ACTIVATION_REQUESTED = "EXTENSION_ACTIVATION_REQUESTED"
    HEALTH_REPORTED = "EXTENSION_HEALTH_REPORTED"
    ROLLBACK_REQUESTED = "EXTENSION_ROLLBACK_REQUESTED"
    STATUS_CHANGED = "EXTENSION_STATUS_CHANGED"


LIFECYCLE_STATES = tuple(state.value for state in ExtensionLifecycleState)
TRUST_LEVELS = tuple(level.value for level in ExtensionTrustLevel)
APPROVAL_TYPES = tuple(kind.value for kind in ExtensionApprovalType)
CAPABILITY_TYPES = tuple(kind.value for kind in ExtensionCapabilityType)
EVENT_TYPES = tuple(kind.value for kind in ExtensionEventType)
