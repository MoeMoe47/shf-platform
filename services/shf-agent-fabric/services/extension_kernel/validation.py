from __future__ import annotations

from services.extension_kernel.constants import (
    APPROVAL_TYPES,
    CAPABILITY_TYPES,
    EVENT_TYPES,
    KERNEL_SCHEMA_VERSION,
    LIFECYCLE_STATES,
    TRUST_LEVELS,
)
from services.extension_kernel.models import ExtensionKernelIssue, ExtensionKernelResult, ExtensionManifest
from services.extension_kernel.versioning import is_compatible_version, parse_semantic_version


def _issue(code: str, message: str, field: str = "") -> ExtensionKernelIssue:
    return ExtensionKernelIssue(code=code, message=message, field=field)


def validate_manifest(manifest: ExtensionManifest) -> ExtensionKernelResult:
    issues: list[ExtensionKernelIssue] = []
    descriptor = manifest.descriptor

    for field, value in (
        ("descriptor.extension_id", descriptor.extension_id),
        ("descriptor.name", descriptor.name),
        ("descriptor.version", descriptor.version),
        ("descriptor.compatibility_version", descriptor.compatibility_version),
        ("metadata.created_by", manifest.metadata.created_by),
    ):
        if not str(value or "").strip():
            issues.append(_issue("missing_required_field", f"{field} is required", field))

    if descriptor.schema_version != KERNEL_SCHEMA_VERSION:
        issues.append(_issue("invalid_schema_version", "descriptor schema_version must match kernel schema", "descriptor.schema_version"))
    if manifest.lifecycle_state not in LIFECYCLE_STATES:
        issues.append(_issue("invalid_lifecycle_state", "lifecycle_state is not a kernel lifecycle state", "lifecycle_state"))
    if manifest.security.trust_level not in TRUST_LEVELS:
        issues.append(_issue("invalid_trust_level", "security trust_level is not recognized", "security.trust_level"))

    for approval_type in manifest.security.approval_types:
        if approval_type not in APPROVAL_TYPES:
            issues.append(_issue("invalid_approval_type", f"unknown approval type: {approval_type}", "security.approval_types"))
    for capability in manifest.capabilities:
        if capability.capability_type not in CAPABILITY_TYPES:
            issues.append(_issue("invalid_capability_type", f"unknown capability type: {capability.capability_type}", "capabilities.capability_type"))
        if not capability.capability_id.strip():
            issues.append(_issue("missing_capability_id", "capability_id is required", "capabilities.capability_id"))
    for event_type in EVENT_TYPES:
        if not event_type.startswith("EXTENSION_"):
            issues.append(_issue("invalid_event_definition", f"event type must be namespaced: {event_type}", "events"))

    try:
        parse_semantic_version(descriptor.version)
        parse_semantic_version(descriptor.compatibility_version)
        if not is_compatible_version(descriptor.version, descriptor.compatibility_version):
            issues.append(_issue("incompatible_major_version", "version and compatibility_version must share a major version", "descriptor.compatibility_version"))
    except ValueError as exc:
        issues.append(_issue("invalid_semantic_version", str(exc), "descriptor.version"))

    if manifest.rollback.supported and not manifest.rollback.strategy.strip():
        issues.append(_issue("missing_rollback_strategy", "rollback strategy is required when rollback is supported", "rollback.strategy"))

    return ExtensionKernelResult(ok=not issues, status="valid" if not issues else "invalid", issues=tuple(issues), payload=manifest.as_dict())
