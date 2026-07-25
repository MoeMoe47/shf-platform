from __future__ import annotations

import pytest

from services.extension_kernel import (
    CAPABILITY_TYPES,
    EVENT_TYPES,
    KERNEL_SCHEMA_VERSION,
    LIFECYCLE_STATES,
    ExtensionActivationRequest,
    ExtensionApprovalRequest,
    ExtensionCapabilityContract,
    ExtensionDependency,
    ExtensionDescriptor,
    ExtensionManifest,
    ExtensionMetadata,
    ExtensionRegistrationRecord,
    ExtensionSecurityContract,
    InMemoryExtensionRegistry,
    allowed_next_states,
    define_event,
    diagnostics_for_manifest,
    is_compatible_version,
    is_stable_identifier,
    normalize_labels,
    require_transition,
    to_json,
    validate_manifest,
)


def _manifest() -> ExtensionManifest:
    return ExtensionManifest(
        descriptor=ExtensionDescriptor(
            extension_id="generic.kernel.fixture",
            name="Generic Kernel Fixture",
            description="Owner independent fixture",
            version="1.2.3",
            compatibility_version="1.0.0",
            labels=normalize_labels(("Kernel", "kernel", " Foundation ")),
        ),
        metadata=ExtensionMetadata(created_by="package_h_batch_01"),
        lifecycle_state="REGISTERED",
        security=ExtensionSecurityContract(trust_level="DECLARED"),
        capabilities=(
            ExtensionCapabilityContract(
                capability_type="READ",
                capability_id="generic.read",
                description="Generic read contract",
                permissions=("read:generic",),
            ),
        ),
    )


def _record(registration_id: str, extension_id: str | None = None) -> ExtensionRegistrationRecord:
    manifest = _manifest()
    if extension_id:
        manifest = ExtensionManifest(
            descriptor=ExtensionDescriptor(
                extension_id=extension_id,
                name=manifest.descriptor.name,
                description=manifest.descriptor.description,
                version=manifest.descriptor.version,
                compatibility_version=manifest.descriptor.compatibility_version,
                labels=manifest.descriptor.labels,
            ),
            metadata=manifest.metadata,
            lifecycle_state=manifest.lifecycle_state,
            security=manifest.security,
            capabilities=manifest.capabilities,
        )
    return ExtensionRegistrationRecord(registration_id=registration_id, manifest=manifest)


def test_kernel_constants_match_governance_contract() -> None:
    assert KERNEL_SCHEMA_VERSION == "shs.extension_kernel.foundation.v1"
    assert LIFECYCLE_STATES == (
        "DISCOVERED",
        "REGISTERED",
        "VALIDATED",
        "OWNER_APPROVED",
        "READY",
        "ACTIVE",
        "LIMITED",
        "SUSPENDED",
        "DISABLED",
        "RETIRED",
    )
    assert {"READ", "WRITE", "EVENT", "REGISTRY"}.issubset(set(CAPABILITY_TYPES))
    assert all(event_type.startswith("EXTENSION_") for event_type in EVENT_TYPES)


def test_manifest_validation_versioning_and_serialization() -> None:
    manifest = _manifest()
    result = validate_manifest(manifest)
    assert result.ok is True
    assert is_compatible_version("1.2.3", "1.0.0") is True
    assert '"extension_id":"generic.kernel.fixture"' in to_json(manifest)
    assert manifest.descriptor.labels == ("foundation", "kernel")


def test_invalid_manifest_rejects_bad_capability_and_version() -> None:
    manifest = ExtensionManifest(
        descriptor=ExtensionDescriptor(
            extension_id="generic.kernel.bad",
            name="Bad Fixture",
            description="Invalid fixture",
            version="1.0.0",
            compatibility_version="2.0.0",
        ),
        metadata=ExtensionMetadata(created_by="package_h_batch_01"),
        lifecycle_state="REGISTERED",
        security=ExtensionSecurityContract(trust_level="DECLARED"),
        capabilities=(ExtensionCapabilityContract(capability_type="OWNER_SPECIFIC", capability_id="bad"),),
    )
    result = validate_manifest(manifest)
    assert result.ok is False
    assert {issue.code for issue in result.issues} == {"invalid_capability_type", "incompatible_major_version"}


def test_lifecycle_is_definition_only() -> None:
    assert "VALIDATED" in allowed_next_states("REGISTERED")
    require_transition("READY", "ACTIVE")
    with pytest.raises(Exception):
        require_transition("RETIRED", "ACTIVE")


def test_registry_supports_generic_contract_without_owner_registration() -> None:
    registry = InMemoryExtensionRegistry()
    record = ExtensionRegistrationRecord(registration_id="registration.generic.fixture", manifest=_manifest())

    registered = registry.register(record)
    assert registered.ok is True
    assert registry.lookup("registration.generic.fixture") == record
    assert registry.status("registration.generic.fixture") == "REGISTERED"
    assert registry.metadata("registration.generic.fixture")["created_by"] == "package_h_batch_01"
    assert registry.validate("registration.generic.fixture").ok is True
    assert registry.health("registration.generic.fixture").status == "UNKNOWN"
    assert len(registry.discover()) == 1

    approval = registry.approval(
        ExtensionApprovalRequest(
            request_id="approval.generic.fixture",
            registration_id="registration.generic.fixture",
            approval_type="TECHNICAL",
            requested_by="package_h_batch_01",
        )
    )
    assert approval.ok is True
    assert ExtensionActivationRequest(
        request_id="activation.generic.fixture",
        registration_id="registration.generic.fixture",
        requested_by="package_h_batch_01",
    ).target_state == "READY"


def test_events_and_diagnostics_define_contracts_only() -> None:
    event = define_event("EXTENSION_REGISTERED", "registration.generic.fixture", {"dry_run": True})
    assert event.as_dict()["payload"] == {"dry_run": True}
    diagnostic = diagnostics_for_manifest(_manifest())
    assert diagnostic.ok is True
    assert diagnostic.payload["capability_count"] == 1


def test_dependency_metadata_is_declarative_batch_01_contract() -> None:
    manifest = ExtensionManifest(
        descriptor=ExtensionDescriptor(
            extension_id="generic.kernel.dependencies",
            name="Dependency Fixture",
            description="Declarative dependency metadata fixture",
            version="1.0.0",
            compatibility_version="1.0.0",
        ),
        metadata=ExtensionMetadata(created_by="package_h_batch_01"),
        lifecycle_state="REGISTERED",
        security=ExtensionSecurityContract(trust_level="DECLARED"),
        dependencies=(
            ExtensionDependency(
                dependency_id="generic.kernel.base",
                version_constraint="1.x",
                required=True,
                reason="foundation ordering metadata",
            ),
        ),
    )

    result = validate_manifest(manifest)
    assert result.ok is True
    assert result.payload["dependencies"] == [
        {
            "dependency_id": "generic.kernel.base",
            "version_constraint": "1.x",
            "required": True,
            "reason": "foundation ordering metadata",
        }
    ]


def test_invalid_and_duplicate_registration_do_not_mutate_registry_state() -> None:
    registry = InMemoryExtensionRegistry()
    first = _record("registration.generic.alpha", "generic.kernel.alpha")
    assert registry.register(first).ok is True
    before = registry.discover()

    invalid = ExtensionRegistrationRecord(
        registration_id="registration.generic.invalid",
        manifest=ExtensionManifest(
            descriptor=ExtensionDescriptor(
                extension_id="generic.kernel.invalid",
                name="Invalid Fixture",
                description="Invalid registry fixture",
                version="1.0.0",
                compatibility_version="2.0.0",
            ),
            metadata=ExtensionMetadata(created_by="package_h_batch_01"),
            lifecycle_state="REGISTERED",
            security=ExtensionSecurityContract(trust_level="DECLARED"),
        ),
    )
    assert registry.register(invalid).ok is False
    assert registry.discover() == before

    duplicate = registry.register(_record("registration.generic.alpha", "generic.kernel.beta"))
    assert duplicate.ok is False
    assert duplicate.status == "duplicate"
    assert registry.discover() == before


def test_discovery_order_and_returned_payload_are_defensive() -> None:
    registry = InMemoryExtensionRegistry()
    registry.register(_record("registration.generic.zeta", "generic.kernel.zeta"))
    registry.register(_record("registration.generic.alpha", "generic.kernel.alpha"))

    assert [record.registration_id for record in registry.discover()] == [
        "registration.generic.alpha",
        "registration.generic.zeta",
    ]

    payload = registry.register(_record("registration.generic.middle", "generic.kernel.middle")).payload
    payload["registration_id"] = "mutated.outside.registry"
    assert registry.lookup("registration.generic.middle").registration_id == "registration.generic.middle"


def test_multiple_owner_neutral_records_receive_no_special_canonical_handling() -> None:
    registry = InMemoryExtensionRegistry()
    for owner_label in ("generic.owner.alpha", "generic.owner.beta", "oracle.named.fixture"):
        assert is_stable_identifier(owner_label)
        assert registry.register(_record(f"registration.{owner_label}", owner_label)).ok is True

    assert len(registry.discover()) == 3
    assert registry.lookup("registration.oracle.named.fixture").manifest.descriptor.extension_id == "oracle.named.fixture"
