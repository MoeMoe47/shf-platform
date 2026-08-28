from __future__ import annotations

from services.extension_kernel import (
    AUTHORIZED_BATCH_03_CAPABILITIES,
    EvidenceEnvelopeInput,
    InMemoryExtensionRegistry,
    IntegrationBoundaryRequest,
    OwnerCapabilityDeclaration,
    OwnerOnboardingDeclaration,
    RuntimeMinimalismRequest,
    evaluate_integration_boundary,
    evaluate_owner_activation_readiness,
    evaluate_runtime_minimalism,
    produce_evidence_trust_envelope,
    register_owner_declaration,
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
        readiness_evidence=("batch02.owner.ready",),
        evidence_references=("docs/releases/PACKAGE_H_BATCH_02_EVIDENCE_ACCEPTANCE_MATRIX.json",),
        registered_by="phase6.fixture",
    )


def _registry() -> InMemoryExtensionRegistry:
    registry = InMemoryExtensionRegistry()
    assert register_owner_declaration(_declaration("owner.alpha", "domain.alpha"), registry=registry).ok
    assert register_owner_declaration(_declaration("owner.beta", "domain.beta"), registry=registry).ok
    return registry


def _issue_codes(result) -> set[str]:
    return {issue.code for issue in result.issues}


def _good_minimalism():
    return evaluate_runtime_minimalism(
        RuntimeMinimalismRequest(
            capability_id="B03-CAP-004",
            future_paths=("services/shf-agent-fabric/services/extension_kernel/runtime_owner_closure.py",),
            dependency_ids=("services.extension_kernel.owner_onboarding",),
            runtime_authority_map={"governance_validation": "Package H shared foundation"},
        )
    )


def test_authorized_capability_set_is_phase_5_bound() -> None:
    assert AUTHORIZED_BATCH_03_CAPABILITIES == ("B03-CAP-001", "B03-CAP-002", "B03-CAP-003", "B03-CAP-004")


def test_cap_001_owner_readiness_happy_path_does_not_activate_runtime() -> None:
    result = evaluate_owner_activation_readiness(_declaration())

    assert result.ok is True
    assert result.status == "READY_FOR_ACTIVATION_REVIEW"
    assert result.payload["capability_id"] == "B03-CAP-001"
    assert result.payload["readiness_classification"] == "READY_FOR_ACTIVATION_REVIEW"
    assert result.payload["activation_runtime_introduced"] is False
    assert result.payload["blockers"] == []


def test_cap_001_missing_evidence_fails_closed() -> None:
    result = evaluate_owner_activation_readiness(
        OwnerOnboardingDeclaration(
            owner_id="owner.empty",
            authority_domain="domain.empty",
            capability_declarations=(OwnerCapabilityDeclaration(capability_id="domain.empty.read", capability_type="READ"),),
        )
    )

    assert result.ok is False
    assert "OWNER_READINESS_NOT_PROVEN" in _issue_codes(result)
    assert result.payload["readiness_classification"] == "BLOCKED"


def test_cap_001_malformed_owner_input_reuses_batch_02_validation() -> None:
    result = evaluate_owner_activation_readiness(OwnerOnboardingDeclaration(owner_id="", authority_domain="", capability_declarations=()))

    assert result.ok is False
    assert {"OWNER_ID_MISSING", "AUTHORITY_DOMAIN_MISSING", "OWNER_VALIDATION_FAILED"}.issubset(_issue_codes(result))


def test_cap_002_neutral_boundary_happy_path_reads_registry_without_mutation() -> None:
    registry = _registry()
    before = registry.discover()
    result = evaluate_integration_boundary(
        IntegrationBoundaryRequest(
            producer="domain.alpha readiness evidence",
            consumer="domain.beta evidence envelope",
            contract_id="B03-CONTRACT-BOUNDARY",
            producer_owner="domain.alpha",
            consumer_owner="domain.beta",
            proposed_dependencies=("shared.contract.foundation",),
        ),
        registry,
    )

    assert result.ok is True
    assert result.payload["capability_id"] == "B03-CAP-002"
    assert result.payload["boundary_finding"] == "PERMITTED"
    assert result.payload["registry_mutated"] is False
    assert registry.discover() == before


def test_cap_002_missing_registry_and_parallel_registry_fail_closed() -> None:
    result = evaluate_integration_boundary(
        IntegrationBoundaryRequest(
            producer="local registry",
            consumer="domain.beta",
            contract_id="B03-CONTRACT-BOUNDARY",
            producer_owner="domain.alpha",
            consumer_owner="domain.beta",
            registry_source="Batch 03 Local Registry",
        ),
        InMemoryExtensionRegistry(),
    )

    assert result.ok is False
    assert {"REGISTRY_SOURCE_INVALID", "REGISTRY_REFERENCE_MISSING", "DUPLICATE_REGISTRY_DECLARED"}.issubset(_issue_codes(result))


def test_cap_002_owner_private_reach_in_is_blocked() -> None:
    result = evaluate_integration_boundary(
        IntegrationBoundaryRequest(
            producer="domain.alpha",
            consumer="domain.beta",
            contract_id="B03-CONTRACT-BOUNDARY",
            producer_owner="domain.alpha",
            consumer_owner="domain.beta",
            proposed_dependencies=("services.owner_onboarding.private",),
        ),
        _registry(),
    )

    assert result.ok is False
    assert "OWNER_PRIVATE_REACH_IN" in _issue_codes(result)


def test_cap_004_runtime_minimalism_happy_path_is_deterministic() -> None:
    result = _good_minimalism()

    assert result.ok is True
    assert result.payload["capability_id"] == "B03-CAP-004"
    assert result.payload["minimalism_finding"] == "ACCEPTED"
    assert result.payload["runtime_added"] is False
    assert result.payload["api_added"] is False
    assert result.payload["deployment_added"] is False


def test_cap_004_blocks_runtime_api_ui_persistence_and_deployment_drift() -> None:
    result = evaluate_runtime_minimalism(
        RuntimeMinimalismRequest(
            capability_id="B03-CAP-004",
            future_paths=(
                "services/shf-agent-fabric/api/routes/runtime_owner.py",
                "src/pages/runtime/RuntimeOwner.jsx",
                "services/shf-agent-fabric/fabric/migrations/999_runtime.sql",
                "deploy/runtime-owner.yaml",
            ),
            dependency_ids=("fastapi",),
            runtime_authority_map={"runtime_owner": "Package H shared foundation"},
        )
    )

    assert result.ok is False
    assert {"API_DRIFT", "UI_DRIFT", "PERSISTENCE_DRIFT", "DEPLOYMENT_DRIFT", "RUNTIME_DRIFT", "DUPLICATE_RUNTIME_OWNER"}.issubset(_issue_codes(result))


def test_cap_004_rejects_invalid_lifecycle_transition() -> None:
    result = evaluate_runtime_minimalism(
        RuntimeMinimalismRequest(
            capability_id="B03-CAP-004",
            future_paths=(),
            dependency_ids=(),
            runtime_authority_map={},
            requested_transition=("AUDITED", "ACTIVE"),
        )
    )

    assert result.ok is False
    assert "LIFECYCLE_TRANSITION_INVALID" in _issue_codes(result)


def test_cap_003_evidence_envelope_happy_path_binds_all_required_trace() -> None:
    readiness = evaluate_owner_activation_readiness(_declaration())
    boundary = evaluate_integration_boundary(
        IntegrationBoundaryRequest(
            producer="domain.alpha readiness evidence",
            consumer="domain.beta evidence envelope",
            contract_id="B03-CONTRACT-BOUNDARY",
            producer_owner="domain.alpha",
            consumer_owner="domain.beta",
            proposed_dependencies=("shared.contract.foundation",),
        ),
        _registry(),
    )
    minimalism = _good_minimalism()

    result = produce_evidence_trust_envelope(
        EvidenceEnvelopeInput(
            work_package_id="P6-WP-003",
            capability_id="B03-CAP-003",
            acceptance_criterion_id="ACS-1-003",
            evidence_requirement_id="EM-1-003",
            validator_result="PASS",
            test_result="PASS",
            readiness_result=readiness,
            boundary_result=boundary,
            minimalism_result=minimalism,
            epl_evidence_id="P6-EV-003",
            repository_path="services/shf-agent-fabric/services/extension_kernel/runtime_owner_closure.py",
            test_reference="services/shf-agent-fabric/tests/test_extension_kernel_runtime_owner_closure.py",
            validator_reference="scripts/check_package_h_batch_03_phase_6.py",
        )
    )

    assert result.ok is True
    assert result.payload["capability_id"] == "B03-CAP-003"
    assert result.payload["chain_of_custody_state"] == "READY_FOR_EPL_1_REGISTRATION"
    assert result.payload["certification_state"] == "PHASE_6_EVIDENCE_READY_FOR_CERTIFICATION_REVIEW"


def test_cap_003_rejects_unsupported_pass_and_missing_epl_mapping() -> None:
    blocked_readiness = evaluate_owner_activation_readiness(
        OwnerOnboardingDeclaration(owner_id="", authority_domain="", capability_declarations=())
    )
    good_boundary = evaluate_integration_boundary(
        IntegrationBoundaryRequest(
            producer="domain.alpha readiness evidence",
            consumer="domain.beta evidence envelope",
            contract_id="B03-CONTRACT-BOUNDARY",
            producer_owner="domain.alpha",
            consumer_owner="domain.beta",
        ),
        _registry(),
    )

    result = produce_evidence_trust_envelope(
        EvidenceEnvelopeInput(
            work_package_id="P6-WP-003",
            capability_id="B03-CAP-003",
            acceptance_criterion_id="ACS-1-003",
            evidence_requirement_id="EM-1-003",
            validator_result="PASS",
            test_result="PASS",
            readiness_result=blocked_readiness,
            boundary_result=good_boundary,
            minimalism_result=_good_minimalism(),
            epl_evidence_id="",
            repository_path="services/shf-agent-fabric/services/extension_kernel/runtime_owner_closure.py",
            test_reference="services/shf-agent-fabric/tests/test_extension_kernel_runtime_owner_closure.py",
            validator_reference="scripts/check_package_h_batch_03_phase_6.py",
        )
    )

    assert result.ok is False
    assert {"UNSUPPORTED_PASS", "EPL_MAPPING_MISSING"}.issubset(_issue_codes(result))


def test_cap_003_rejects_out_of_scope_capability_and_criterion() -> None:
    result = produce_evidence_trust_envelope(
        EvidenceEnvelopeInput(
            work_package_id="P6-WP-999",
            capability_id="B03-CAP-999",
            acceptance_criterion_id="ACS-1-999",
            evidence_requirement_id="EM-1-999",
            validator_result="PASS",
            test_result="PASS",
            readiness_result=_good_minimalism(),
            boundary_result=_good_minimalism(),
            minimalism_result=_good_minimalism(),
            epl_evidence_id="P6-EV-999",
            repository_path="services/shf-agent-fabric/services/extension_kernel/runtime_owner_closure.py",
            test_reference="services/shf-agent-fabric/tests/test_extension_kernel_runtime_owner_closure.py",
            validator_reference="scripts/check_package_h_batch_03_phase_6.py",
        )
    )

    assert result.ok is False
    assert {"CAPABILITY_NOT_AUTHORIZED", "ACCEPTANCE_CRITERION_UNAUTHORIZED", "EVIDENCE_REQUIREMENT_UNAUTHORIZED"}.issubset(_issue_codes(result))
