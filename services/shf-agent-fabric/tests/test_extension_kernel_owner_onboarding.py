from __future__ import annotations

from services.extension_kernel import (
    InMemoryExtensionRegistry,
    OwnerCapabilityDeclaration,
    OwnerDependencyDeclaration,
    OwnerOnboardingDeclaration,
    onboarding_evidence,
    register_owner_declaration,
    registration_record_for_owner_declaration,
    validate_owner_declaration,
)


def _declaration(owner_id: str = "owner.alpha", authority_domain: str = "domain.alpha") -> OwnerOnboardingDeclaration:
    return OwnerOnboardingDeclaration(
        owner_id=owner_id,
        owner_display_name="Neutral Owner",
        authority_domain=authority_domain,
        capability_declarations=(
            OwnerCapabilityDeclaration(
                capability_id=f"{authority_domain}.read",
                capability_type="READ",
                description="Neutral read capability",
                permissions=("read:neutral",),
            ),
        ),
        dependency_declarations=(
            OwnerDependencyDeclaration(
                dependency_id="shared.contract.foundation",
                version_constraint="1.x",
                reason="public contract dependency",
            ),
        ),
        readiness_evidence=("unit.fixture.ready",),
        evidence_references=("docs/releases/PACKAGE_H_BATCH_02_EVIDENCE_ACCEPTANCE_MATRIX.json",),
        registered_by="release.operator",
    )


def _issue_codes(result) -> set[str]:
    return {issue.code for issue in result.issues}


def test_valid_owner_declaration_registers_through_batch_01_registry() -> None:
    registry = InMemoryExtensionRegistry()
    declaration = _declaration()

    validation = validate_owner_declaration(declaration)
    assert validation.ok is True
    assert validation.status == "READY_FOR_REGISTRATION"

    registered = register_owner_declaration(declaration, registry=registry)
    assert registered.ok is True
    assert registered.status == "REGISTERED"
    assert registry.lookup("registration.owner.alpha.onboarding") is not None
    assert registered.payload["evidence"]["registration_status"] == "READY_FOR_REGISTRATION"


def test_invalid_owner_declaration_returns_stable_failure_codes() -> None:
    declaration = OwnerOnboardingDeclaration(
        owner_id="",
        authority_domain="",
        capability_declarations=(),
        contract_version="bad",
        registration_version="also.bad",
        compatibility_range="wide",
    )

    result = validate_owner_declaration(declaration)
    assert result.ok is False
    assert {
        "OWNER_ID_MISSING",
        "AUTHORITY_DOMAIN_MISSING",
        "CAPABILITY_MISSING",
        "CONTRACT_VERSION_INVALID",
        "REGISTRATION_VERSION_INVALID",
        "COMPATIBILITY_RANGE_INVALID",
        "READINESS_NOT_PROVEN",
    }.issubset(_issue_codes(result))


def test_ownership_collision_and_authority_boundary_are_rejected() -> None:
    accepted = (_declaration(owner_id="owner.alpha", authority_domain="domain.shared"),)
    duplicate = _declaration(owner_id="owner.alpha", authority_domain="domain.shared")
    competing = _declaration(owner_id="owner.beta", authority_domain="domain.shared")

    assert "OWNERSHIP_COLLISION" in _issue_codes(validate_owner_declaration(duplicate, accepted_declarations=accepted))
    assert "AUTHORITY_BOUNDARY_VIOLATION" in _issue_codes(validate_owner_declaration(competing, accepted_declarations=accepted))


def test_owner_absence_and_multiple_owners_remain_owner_neutral() -> None:
    registry = InMemoryExtensionRegistry()
    assert registry.discover() == ()

    first = _declaration(owner_id="owner.alpha", authority_domain="domain.alpha")
    second = _declaration(owner_id="owner.beta", authority_domain="domain.beta")
    assert register_owner_declaration(first, registry=registry).ok is True
    assert register_owner_declaration(second, registry=registry, accepted_declarations=(first,)).ok is True

    assert [record.registration_id for record in registry.discover()] == [
        "registration.owner.alpha.onboarding",
        "registration.owner.beta.onboarding",
    ]


def test_owner_private_imports_secrets_and_fabricated_approval_are_rejected() -> None:
    private_dependency = OwnerOnboardingDeclaration(
        owner_id="owner.private",
        authority_domain="domain.private",
        capability_declarations=(OwnerCapabilityDeclaration(capability_id="domain.private.read", capability_type="READ"),),
        dependency_declarations=(OwnerDependencyDeclaration(dependency_id="services.private.owner", version_constraint="1.x"),),
        public_interface="src/private/module.py",
        readiness_evidence=("ready",),
        governance_status="APPROVED",
        evidence_references=("contains-secret-token",),
    )

    result = validate_owner_declaration(private_dependency)
    assert result.ok is False
    assert {
        "DEPENDENCY_DECLARATION_INVALID",
        "OWNER_PRIVATE_IMPORT_DECLARED",
        "GOVERNANCE_STATUS_OWNED_ELSEWHERE",
        "SECRET_FIELD_DECLARED",
    }.issubset(_issue_codes(result))


def test_registration_record_and_evidence_are_deterministic_and_inspectable() -> None:
    declaration = _declaration()
    record = registration_record_for_owner_declaration(declaration)
    evidence = onboarding_evidence(declaration, ())

    assert record.registered_at == "OWNER_ONBOARDING_TIME_NOT_RECORDED"
    assert record.manifest.metadata.created_at == "OWNER_ONBOARDING_TIME_NOT_RECORDED"
    assert evidence == onboarding_evidence(declaration, ())
    assert evidence["capability_ids"] == ["domain.alpha.read"]
    assert evidence["governance_status"] == "REFERENCE_ONLY"
