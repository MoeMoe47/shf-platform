from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Iterable

from services.extension_kernel.constants import CAPABILITY_TYPES
from services.extension_kernel.models import (
    ExtensionCapabilityContract,
    ExtensionDependency,
    ExtensionDescriptor,
    ExtensionHealth,
    ExtensionKernelIssue,
    ExtensionKernelResult,
    ExtensionManifest,
    ExtensionMetadata,
    ExtensionRegistrationRecord,
    ExtensionSecurityContract,
)
from services.extension_kernel.registry import InMemoryExtensionRegistry
from services.extension_kernel.utilities import is_stable_identifier
from services.extension_kernel.validation import validate_manifest
from services.extension_kernel.versioning import parse_semantic_version

OWNER_ONBOARDING_CONTRACT_VERSION = "1.0.0"
OWNER_ONBOARDING_REGISTRATION_VERSION = "1.0.0"
OWNER_ONBOARDING_EVIDENCE_CONTRACT = "owner_onboarding.evidence.v1"
DETERMINISTIC_REGISTRATION_TIME = "OWNER_ONBOARDING_TIME_NOT_RECORDED"

OWNER_ONBOARDING_FAILURE_CODES = (
    "OWNER_ID_MISSING",
    "OWNER_ID_INVALID",
    "AUTHORITY_DOMAIN_MISSING",
    "AUTHORITY_DOMAIN_INVALID",
    "CAPABILITY_MISSING",
    "CAPABILITY_ID_INVALID",
    "CAPABILITY_TYPE_INVALID",
    "CONTRACT_VERSION_INVALID",
    "REGISTRATION_VERSION_INVALID",
    "COMPATIBILITY_RANGE_INVALID",
    "OWNERSHIP_COLLISION",
    "AUTHORITY_BOUNDARY_VIOLATION",
    "OWNER_PRIVATE_IMPORT_DECLARED",
    "DEPENDENCY_DECLARATION_INVALID",
    "GOVERNANCE_STATUS_OWNED_ELSEWHERE",
    "SECRET_FIELD_DECLARED",
    "READINESS_NOT_PROVEN",
)

_PRIVATE_MARKERS = ("services.", "src.", "routers.", "tests.", "/", "\\")
_SECRET_MARKERS = ("secret", "token", "password", "api_key", "apikey", "credential")
_FABRICATED_GOVERNANCE_VALUES = ("APPROVED", "OWNER_APPROVED", "CERTIFIED", "VERIFIED")


@dataclass(frozen=True)
class OwnerCapabilityDeclaration:
    capability_id: str
    capability_type: str
    description: str = ""
    permissions: tuple[str, ...] = ()
    configuration_keys: tuple[str, ...] = ()

    def as_dict(self) -> dict[str, Any]:
        return {
            "capability_id": self.capability_id,
            "capability_type": self.capability_type,
            "description": self.description,
            "permissions": list(self.permissions),
            "configuration_keys": list(self.configuration_keys),
        }


@dataclass(frozen=True)
class OwnerDependencyDeclaration:
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
class OwnerOnboardingDeclaration:
    owner_id: str
    authority_domain: str
    capability_declarations: tuple[OwnerCapabilityDeclaration, ...]
    contract_version: str = OWNER_ONBOARDING_CONTRACT_VERSION
    registration_version: str = OWNER_ONBOARDING_REGISTRATION_VERSION
    compatibility_range: str = "1.x"
    owner_type: str = ""
    owner_display_name: str = ""
    provider_version: str = ""
    public_interface: str = ""
    health_check_contract: str = ""
    evidence_contract: str = OWNER_ONBOARDING_EVIDENCE_CONTRACT
    dependency_declarations: tuple[OwnerDependencyDeclaration, ...] = ()
    optional_dependency_declarations: tuple[OwnerDependencyDeclaration, ...] = ()
    readiness_evidence: tuple[str, ...] = ()
    governance_status: str = "REFERENCE_ONLY"
    registered_by: str = ""
    evidence_references: tuple[str, ...] = ()

    def as_dict(self) -> dict[str, Any]:
        return {
            "owner_id": self.owner_id,
            "authority_domain": self.authority_domain,
            "capability_declarations": [item.as_dict() for item in self.capability_declarations],
            "contract_version": self.contract_version,
            "registration_version": self.registration_version,
            "compatibility_range": self.compatibility_range,
            "owner_type": self.owner_type,
            "owner_display_name": self.owner_display_name,
            "provider_version": self.provider_version,
            "public_interface": self.public_interface,
            "health_check_contract": self.health_check_contract,
            "evidence_contract": self.evidence_contract,
            "dependency_declarations": [item.as_dict() for item in self.dependency_declarations],
            "optional_dependency_declarations": [item.as_dict() for item in self.optional_dependency_declarations],
            "readiness_evidence": list(self.readiness_evidence),
            "governance_status": self.governance_status,
            "registered_by": self.registered_by,
            "evidence_references": list(self.evidence_references),
        }


def _issue(code: str, message: str, field: str = "") -> ExtensionKernelIssue:
    return ExtensionKernelIssue(code=code, message=message, field=field)


def _has_private_marker(value: str) -> bool:
    return any(marker in value for marker in _PRIVATE_MARKERS)


def _has_secret_marker(value: str) -> bool:
    return any(marker in value.lower() for marker in _SECRET_MARKERS)


def _valid_compatibility_range(value: str) -> bool:
    if value.endswith(".x"):
        prefix = value[:-2]
        return prefix.isdigit()
    try:
        parse_semantic_version(value)
    except ValueError:
        return False
    return True


def _identity_for(declaration: OwnerOnboardingDeclaration) -> tuple[str, tuple[str, ...]]:
    return (
        declaration.authority_domain,
        tuple(sorted(capability.capability_id for capability in declaration.capability_declarations)),
    )


def _string_values(declaration: OwnerOnboardingDeclaration) -> Iterable[tuple[str, str]]:
    for field_name, value in declaration.as_dict().items():
        if isinstance(value, str):
            yield field_name, value
        elif isinstance(value, list):
            for index, item in enumerate(value):
                if isinstance(item, str):
                    yield f"{field_name}[{index}]", item
                elif isinstance(item, dict):
                    for sub_key, sub_value in item.items():
                        if isinstance(sub_value, str):
                            yield f"{field_name}[{index}].{sub_key}", sub_value
                        elif isinstance(sub_value, list):
                            for sub_index, nested in enumerate(sub_value):
                                if isinstance(nested, str):
                                    yield f"{field_name}[{index}].{sub_key}[{sub_index}]", nested


def validate_owner_declaration(
    declaration: OwnerOnboardingDeclaration,
    accepted_declarations: tuple[OwnerOnboardingDeclaration, ...] = (),
) -> ExtensionKernelResult:
    issues: list[ExtensionKernelIssue] = []

    if not declaration.owner_id.strip():
        issues.append(_issue("OWNER_ID_MISSING", "owner_id is required", "owner_id"))
    elif not is_stable_identifier(declaration.owner_id):
        issues.append(_issue("OWNER_ID_INVALID", "owner_id must be a stable owner-neutral identifier", "owner_id"))

    if not declaration.authority_domain.strip():
        issues.append(_issue("AUTHORITY_DOMAIN_MISSING", "authority_domain is required", "authority_domain"))
    elif not is_stable_identifier(declaration.authority_domain):
        issues.append(_issue("AUTHORITY_DOMAIN_INVALID", "authority_domain must be a stable identifier", "authority_domain"))

    if not declaration.capability_declarations:
        issues.append(_issue("CAPABILITY_MISSING", "at least one capability declaration is required", "capability_declarations"))

    for index, capability in enumerate(declaration.capability_declarations):
        if not is_stable_identifier(capability.capability_id):
            issues.append(_issue("CAPABILITY_ID_INVALID", "capability_id must be stable and public", f"capability_declarations[{index}].capability_id"))
        if capability.capability_type not in CAPABILITY_TYPES:
            issues.append(_issue("CAPABILITY_TYPE_INVALID", "capability_type must be a Batch 01 capability type", f"capability_declarations[{index}].capability_type"))

    for field_name, version in (
        ("contract_version", declaration.contract_version),
        ("registration_version", declaration.registration_version),
    ):
        try:
            parse_semantic_version(version)
        except ValueError:
            issues.append(_issue(f"{field_name.upper()}_INVALID", f"{field_name} must be semantic version major.minor.patch", field_name))

    if declaration.provider_version:
        try:
            parse_semantic_version(declaration.provider_version)
        except ValueError:
            issues.append(_issue("CONTRACT_VERSION_INVALID", "provider_version must be semantic version major.minor.patch when present", "provider_version"))

    if not _valid_compatibility_range(declaration.compatibility_range):
        issues.append(_issue("COMPATIBILITY_RANGE_INVALID", "compatibility_range must be semantic version or major.x", "compatibility_range"))

    existing_identity = _identity_for(declaration)
    for accepted in accepted_declarations:
        if _identity_for(accepted) == existing_identity:
            issues.append(_issue("OWNERSHIP_COLLISION", "authority_domain and capability set already accepted", "authority_domain"))
        if accepted.authority_domain == declaration.authority_domain and accepted.owner_id != declaration.owner_id:
            issues.append(_issue("AUTHORITY_BOUNDARY_VIOLATION", "authority_domain is already declared by another owner", "authority_domain"))

    for dependency_index, dependency in enumerate(declaration.dependency_declarations + declaration.optional_dependency_declarations):
        if not dependency.dependency_id.strip() or _has_private_marker(dependency.dependency_id):
            issues.append(_issue("DEPENDENCY_DECLARATION_INVALID", "dependency_id must be public and declarative", f"dependency_declarations[{dependency_index}].dependency_id"))
        if not dependency.version_constraint.strip():
            issues.append(_issue("DEPENDENCY_DECLARATION_INVALID", "version_constraint is required", f"dependency_declarations[{dependency_index}].version_constraint"))

    for field_name, value in _string_values(declaration):
        if not field_name.startswith("evidence_references") and _has_private_marker(value):
            issues.append(_issue("OWNER_PRIVATE_IMPORT_DECLARED", "shared onboarding contract cannot reference private implementation paths", field_name))
        if _has_secret_marker(value):
            issues.append(_issue("SECRET_FIELD_DECLARED", "onboarding declarations and evidence cannot expose secrets", field_name))

    if declaration.governance_status in _FABRICATED_GOVERNANCE_VALUES:
        issues.append(_issue("GOVERNANCE_STATUS_OWNED_ELSEWHERE", "governance-owned approval status must remain reference-only", "governance_status"))

    if not declaration.readiness_evidence:
        issues.append(_issue("READINESS_NOT_PROVEN", "readiness_evidence is required", "readiness_evidence"))

    evidence = onboarding_evidence(declaration, issues)
    return ExtensionKernelResult(
        ok=not issues,
        status="READY_FOR_REGISTRATION" if not issues else "REJECTED",
        issues=tuple(issues),
        payload=evidence,
    )


def manifest_for_owner_declaration(declaration: OwnerOnboardingDeclaration) -> ExtensionManifest:
    capabilities = tuple(
        ExtensionCapabilityContract(
            capability_type=capability.capability_type,
            capability_id=capability.capability_id,
            description=capability.description,
            permissions=capability.permissions,
            configuration_keys=capability.configuration_keys,
        )
        for capability in declaration.capability_declarations
    )
    dependencies = tuple(
        ExtensionDependency(
            dependency_id=dependency.dependency_id,
            version_constraint=dependency.version_constraint,
            required=dependency.required,
            reason=dependency.reason,
        )
        for dependency in declaration.dependency_declarations + declaration.optional_dependency_declarations
    )
    return ExtensionManifest(
        descriptor=ExtensionDescriptor(
            extension_id=f"{declaration.owner_id}.onboarding",
            name=declaration.owner_display_name or declaration.owner_id,
            description=f"Owner onboarding declaration for {declaration.authority_domain}",
            version=declaration.registration_version,
            compatibility_version=declaration.contract_version,
            labels=("owner-onboarding", "package-h", "batch-02"),
        ),
        metadata=ExtensionMetadata(
            created_by=declaration.registered_by or declaration.owner_id,
            created_at=DETERMINISTIC_REGISTRATION_TIME,
            provenance=declaration.evidence_references,
        ),
        lifecycle_state="READY",
        security=ExtensionSecurityContract(
            trust_level="DECLARED",
            permissions=tuple(f"owner:onboard:{capability.capability_id}" for capability in declaration.capability_declarations),
            policy_refs=(OWNER_ONBOARDING_EVIDENCE_CONTRACT,),
        ),
        capabilities=capabilities,
        dependencies=dependencies,
        health=ExtensionHealth(
            status="READY",
            checked_at=DETERMINISTIC_REGISTRATION_TIME,
            diagnostics={
                "authority_domain": declaration.authority_domain,
                "readiness_evidence": list(declaration.readiness_evidence),
                "governance_status": declaration.governance_status,
            },
        ),
    )


def registration_record_for_owner_declaration(declaration: OwnerOnboardingDeclaration) -> ExtensionRegistrationRecord:
    return ExtensionRegistrationRecord(
        registration_id=f"registration.{declaration.owner_id}.onboarding",
        manifest=manifest_for_owner_declaration(declaration),
        registered_at=DETERMINISTIC_REGISTRATION_TIME,
        status_reason="owner_onboarding_contract_accepted",
    )


def onboarding_evidence(declaration: OwnerOnboardingDeclaration, issues: tuple[ExtensionKernelIssue, ...] | list[ExtensionKernelIssue]) -> dict[str, Any]:
    issue_codes = tuple(issue.code for issue in issues)
    return {
        "schema_version": OWNER_ONBOARDING_EVIDENCE_CONTRACT,
        "owner_id": declaration.owner_id,
        "authority_domain": declaration.authority_domain,
        "capability_ids": sorted(capability.capability_id for capability in declaration.capability_declarations),
        "contract_version": declaration.contract_version,
        "registration_version": declaration.registration_version,
        "compatibility_range": declaration.compatibility_range,
        "registration_status": "REJECTED" if issue_codes else "READY_FOR_REGISTRATION",
        "readiness_status": "READY" if declaration.readiness_evidence and not issue_codes else "NOT_READY",
        "governance_status": declaration.governance_status,
        "issue_codes": list(issue_codes),
        "evidence_references": list(declaration.evidence_references),
    }


def register_owner_declaration(
    declaration: OwnerOnboardingDeclaration,
    registry: InMemoryExtensionRegistry | None = None,
    accepted_declarations: tuple[OwnerOnboardingDeclaration, ...] = (),
) -> ExtensionKernelResult:
    validation = validate_owner_declaration(declaration, accepted_declarations=accepted_declarations)
    if not validation.ok:
        return validation

    target_registry = registry or InMemoryExtensionRegistry()
    record = registration_record_for_owner_declaration(declaration)
    manifest_validation = validate_manifest(record.manifest)
    if not manifest_validation.ok:
        return manifest_validation

    registered = target_registry.register(record)
    if not registered.ok:
        return registered

    return ExtensionKernelResult(
        ok=True,
        status="REGISTERED",
        payload={
            "registration": registered.payload,
            "evidence": onboarding_evidence(declaration, ()),
        },
    )
