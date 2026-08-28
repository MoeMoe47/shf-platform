from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from services.extension_kernel.models import ExtensionKernelIssue, ExtensionKernelResult
from services.extension_kernel.owner_onboarding import (
    OwnerOnboardingDeclaration,
    onboarding_evidence,
    validate_owner_declaration,
)
from services.extension_kernel.registry import InMemoryExtensionRegistry


RUNTIME_OWNER_CLOSURE_CONTRACT_VERSION = "1.0.0"
RUNTIME_OWNER_CLOSURE_EVIDENCE_CONTRACT = "package_h.batch03.runtime_owner_closure.evidence.v1"
AUTHORIZED_BATCH_03_CAPABILITIES = ("B03-CAP-001", "B03-CAP-002", "B03-CAP-003", "B03-CAP-004")
AUTHORIZED_ACCEPTANCE_CRITERIA = ("ACS-1-001", "ACS-1-002", "ACS-1-003", "ACS-1-004")
AUTHORIZED_EVIDENCE_REQUIREMENTS = ("EM-1-001", "EM-1-002", "EM-1-003", "EM-1-004")
DETERMINISTIC_EVIDENCE_STATE = "PHASE_6_EVIDENCE_READY_FOR_CERTIFICATION_REVIEW"

RUNTIME_OWNER_CLOSURE_FAILURE_CODES = (
    "CAPABILITY_NOT_AUTHORIZED",
    "OWNER_READINESS_NOT_PROVEN",
    "OWNER_VALIDATION_FAILED",
    "REGISTRY_REFERENCE_MISSING",
    "REGISTRY_SOURCE_INVALID",
    "BOUNDARY_INPUT_MISSING",
    "CANONICAL_OWNER_MISSING",
    "UNREGISTERED_INTEGRATION",
    "DUPLICATE_REGISTRY_DECLARED",
    "OWNER_PRIVATE_REACH_IN",
    "UNAUTHORIZED_CONTRACT",
    "UNSUPPORTED_PASS",
    "EVIDENCE_TRACE_MISSING",
    "EPL_MAPPING_MISSING",
    "ACCEPTANCE_CRITERION_UNAUTHORIZED",
    "EVIDENCE_REQUIREMENT_UNAUTHORIZED",
    "RUNTIME_DRIFT",
    "API_DRIFT",
    "UI_DRIFT",
    "PERSISTENCE_DRIFT",
    "DEPLOYMENT_DRIFT",
    "DUPLICATE_RUNTIME_OWNER",
    "LIFECYCLE_TRANSITION_INVALID",
)

_PRIVATE_MARKERS = ("services.owner_onboarding", "services.shared_integration", "routers.", "src/pages/", "../", "/private/")
_API_PATH_MARKERS = ("/api/", "api/routes", "routers/", "main.py")
_UI_PATH_MARKERS = ("src/pages/", "src/router/", ".jsx", ".tsx", ".css")
_PERSISTENCE_PATH_MARKERS = ("migrations/", ".sql", "database", "db_schema", "store.py")
_DEPLOYMENT_PATH_MARKERS = ("Dockerfile", "deploy", "deployment", "k8s", "helm", ".env")
_RUNTIME_DEPENDENCIES = ("fastapi", "uvicorn", "sqlalchemy", "requests", "httpx")


@dataclass(frozen=True)
class IntegrationBoundaryRequest:
    producer: str
    consumer: str
    contract_id: str
    producer_owner: str
    consumer_owner: str
    registry_source: str = "Master Layer Registry"
    proposed_dependencies: tuple[str, ...] = ()


@dataclass(frozen=True)
class EvidenceEnvelopeInput:
    work_package_id: str
    capability_id: str
    acceptance_criterion_id: str
    evidence_requirement_id: str
    validator_result: str
    test_result: str
    readiness_result: ExtensionKernelResult
    boundary_result: ExtensionKernelResult
    minimalism_result: ExtensionKernelResult
    epl_evidence_id: str
    repository_path: str
    test_reference: str
    validator_reference: str


@dataclass(frozen=True)
class RuntimeMinimalismRequest:
    capability_id: str
    future_paths: tuple[str, ...]
    dependency_ids: tuple[str, ...]
    runtime_authority_map: dict[str, str]
    requested_transition: tuple[str, str] = ("DECLARED", "AUDITED")


def _issue(code: str, message: str, field: str = "") -> ExtensionKernelIssue:
    return ExtensionKernelIssue(code=code, message=message, field=field)


def _result(ok: bool, status: str, issues: list[ExtensionKernelIssue], payload: dict[str, Any] | None = None) -> ExtensionKernelResult:
    return ExtensionKernelResult(ok=ok, status=status, issues=tuple(issues), payload=payload or {})


def _is_authorized_capability(capability_id: str) -> bool:
    return capability_id in AUTHORIZED_BATCH_03_CAPABILITIES


def _contains_marker(value: str, markers: tuple[str, ...]) -> bool:
    return any(marker in value for marker in markers)


def _records_by_owner(registry: InMemoryExtensionRegistry) -> dict[str, str]:
    owners: dict[str, str] = {}
    for record in registry.discover():
        diagnostics = record.manifest.health.diagnostics
        authority_domain = str(diagnostics.get("authority_domain", ""))
        if authority_domain:
            owners[authority_domain] = record.registration_id
    return owners


def evaluate_owner_activation_readiness(
    declaration: OwnerOnboardingDeclaration,
    accepted_declarations: tuple[OwnerOnboardingDeclaration, ...] = (),
) -> ExtensionKernelResult:
    validation = validate_owner_declaration(declaration, accepted_declarations=accepted_declarations)
    issues = list(validation.issues)
    if not validation.ok:
        issues.append(_issue("OWNER_VALIDATION_FAILED", "owner declaration failed Batch 02 validation", "declaration"))
    if not declaration.readiness_evidence:
        issues.append(_issue("OWNER_READINESS_NOT_PROVEN", "readiness evidence is required before activation review", "readiness_evidence"))

    evidence = onboarding_evidence(declaration, issues)
    payload = {
        "contract_version": RUNTIME_OWNER_CLOSURE_CONTRACT_VERSION,
        "capability_id": "B03-CAP-001",
        "capability_title": "Owner Activation Readiness Contract",
        "readiness_classification": "READY_FOR_ACTIVATION_REVIEW" if not issues else "BLOCKED",
        "activation_runtime_introduced": False,
        "owner_id": declaration.owner_id,
        "authority_domain": declaration.authority_domain,
        "blockers": [issue.code for issue in issues],
        "evidence_references": evidence.get("evidence_references", []),
        "owner_onboarding_evidence": evidence,
    }
    return _result(not issues, "READY_FOR_ACTIVATION_REVIEW" if not issues else "BLOCKED", issues, payload)


def evaluate_integration_boundary(
    request: IntegrationBoundaryRequest,
    registry: InMemoryExtensionRegistry,
) -> ExtensionKernelResult:
    issues: list[ExtensionKernelIssue] = []
    if request.registry_source != "Master Layer Registry":
        issues.append(_issue("REGISTRY_SOURCE_INVALID", "Master Layer Registry is the only authorized owner registry", "registry_source"))
    if not registry.discover():
        issues.append(_issue("REGISTRY_REFERENCE_MISSING", "canonical owner records are required", "registry"))
    for field_name in ("producer", "consumer", "contract_id", "producer_owner", "consumer_owner"):
        if not getattr(request, field_name).strip():
            issues.append(_issue("BOUNDARY_INPUT_MISSING", f"{field_name} is required", field_name))
    if request.contract_id != "B03-CONTRACT-BOUNDARY":
        issues.append(_issue("UNAUTHORIZED_CONTRACT", "only B03-CONTRACT-BOUNDARY may govern boundary evaluation", "contract_id"))
    if request.registry_source != "Master Layer Registry" or "registry" in request.producer.lower():
        if request.producer != "Master Layer Registry":
            issues.append(_issue("DUPLICATE_REGISTRY_DECLARED", "boundary evaluation cannot declare a parallel registry", "producer"))
    for value in (request.producer, request.consumer, request.producer_owner, request.consumer_owner, *request.proposed_dependencies):
        if _contains_marker(value, _PRIVATE_MARKERS):
            issues.append(_issue("OWNER_PRIVATE_REACH_IN", "boundary evaluation cannot reference private implementation paths", "proposed_dependencies"))

    owner_map = _records_by_owner(registry)
    for field_name, owner in (("producer_owner", request.producer_owner), ("consumer_owner", request.consumer_owner)):
        if owner and owner not in owner_map and owner != "Master Layer Registry":
            issues.append(_issue("CANONICAL_OWNER_MISSING", "owner is not represented in canonical registry records", field_name))

    if request.producer_owner == request.consumer_owner and request.producer != request.consumer:
        issues.append(_issue("UNREGISTERED_INTEGRATION", "same-owner cross-surface integration still requires explicit neutral registration", "producer_owner"))

    payload = {
        "contract_version": RUNTIME_OWNER_CLOSURE_CONTRACT_VERSION,
        "capability_id": "B03-CAP-002",
        "capability_title": "Neutral Integration Boundary Register",
        "registry_source": request.registry_source,
        "registry_mutated": False,
        "boundary_finding": "PERMITTED" if not issues else "BLOCKED",
        "permitted_dependencies": list(request.proposed_dependencies) if not issues else [],
        "forbidden_dependencies": list(request.proposed_dependencies) if issues else [],
        "blockers": [issue.code for issue in issues],
    }
    return _result(not issues, "BOUNDARY_PERMITTED" if not issues else "BLOCKED", issues, payload)


def produce_evidence_trust_envelope(input_record: EvidenceEnvelopeInput) -> ExtensionKernelResult:
    issues: list[ExtensionKernelIssue] = []
    if not _is_authorized_capability(input_record.capability_id):
        issues.append(_issue("CAPABILITY_NOT_AUTHORIZED", "capability is outside Phase 5 authorization", "capability_id"))
    if input_record.acceptance_criterion_id not in AUTHORIZED_ACCEPTANCE_CRITERIA:
        issues.append(_issue("ACCEPTANCE_CRITERION_UNAUTHORIZED", "acceptance criterion is not part of ACS-1", "acceptance_criterion_id"))
    if input_record.evidence_requirement_id not in AUTHORIZED_EVIDENCE_REQUIREMENTS:
        issues.append(_issue("EVIDENCE_REQUIREMENT_UNAUTHORIZED", "evidence requirement is not part of EM-1", "evidence_requirement_id"))
    if not input_record.epl_evidence_id.startswith("P6-EV-"):
        issues.append(_issue("EPL_MAPPING_MISSING", "Phase 6 evidence must map to EPL-1 evidence id", "epl_evidence_id"))
    for field_name in ("repository_path", "test_reference", "validator_reference"):
        if not getattr(input_record, field_name).strip():
            issues.append(_issue("EVIDENCE_TRACE_MISSING", f"{field_name} is required", field_name))
    supporting_results = (input_record.readiness_result, input_record.boundary_result, input_record.minimalism_result)
    if input_record.validator_result == "PASS" and input_record.test_result == "PASS" and not all(result.ok for result in supporting_results):
        issues.append(_issue("UNSUPPORTED_PASS", "PASS cannot be claimed while a supporting result is blocked", "supporting_results"))
    if input_record.validator_result != "PASS" or input_record.test_result != "PASS":
        issues.append(_issue("UNSUPPORTED_PASS", "validator and test results must both PASS", "validator_result"))

    envelope = {
        "schema_version": RUNTIME_OWNER_CLOSURE_EVIDENCE_CONTRACT,
        "work_package_id": input_record.work_package_id,
        "capability_id": input_record.capability_id,
        "acceptance_criterion_id": input_record.acceptance_criterion_id,
        "evidence_requirement_id": input_record.evidence_requirement_id,
        "epl_evidence_id": input_record.epl_evidence_id,
        "repository_path": input_record.repository_path,
        "test_reference": input_record.test_reference,
        "validator_reference": input_record.validator_reference,
        "validator_result": input_record.validator_result,
        "test_result": input_record.test_result,
        "certification_state": DETERMINISTIC_EVIDENCE_STATE if not issues else "BLOCKED",
        "chain_of_custody_state": "READY_FOR_EPL_1_REGISTRATION" if not issues else "REJECTED",
        "issue_codes": [issue.code for issue in issues],
    }
    return _result(not issues, "EVIDENCE_ENVELOPE_READY" if not issues else "BLOCKED", issues, envelope)


def evaluate_runtime_minimalism(request: RuntimeMinimalismRequest) -> ExtensionKernelResult:
    issues: list[ExtensionKernelIssue] = []
    if request.capability_id != "B03-CAP-004":
        issues.append(_issue("CAPABILITY_NOT_AUTHORIZED", "runtime minimalism guard only implements B03-CAP-004", "capability_id"))
    if request.requested_transition != ("DECLARED", "AUDITED"):
        issues.append(_issue("LIFECYCLE_TRANSITION_INVALID", "minimalism guard supports DECLARED -> AUDITED only", "requested_transition"))
    for path in request.future_paths:
        if _contains_marker(path, _API_PATH_MARKERS):
            issues.append(_issue("API_DRIFT", "API or route path is outside Phase 6 scope", "future_paths"))
        if _contains_marker(path, _UI_PATH_MARKERS):
            issues.append(_issue("UI_DRIFT", "UI path is outside Phase 6 scope", "future_paths"))
        if _contains_marker(path, _PERSISTENCE_PATH_MARKERS):
            issues.append(_issue("PERSISTENCE_DRIFT", "persistence path is outside Phase 6 scope", "future_paths"))
        if _contains_marker(path, _DEPLOYMENT_PATH_MARKERS):
            issues.append(_issue("DEPLOYMENT_DRIFT", "deployment path is outside Phase 6 scope", "future_paths"))
    for dependency in request.dependency_ids:
        if dependency in _RUNTIME_DEPENDENCIES:
            issues.append(_issue("RUNTIME_DRIFT", "runtime dependency is outside Phase 6 scope", "dependency_ids"))
    for authority, owner in request.runtime_authority_map.items():
        if owner.lower().startswith("package h") and authority not in {"governance_validation", "runtime_minimalism_guard"}:
            issues.append(_issue("DUPLICATE_RUNTIME_OWNER", "Package H cannot claim runtime ownership", "runtime_authority_map"))

    payload = {
        "contract_version": RUNTIME_OWNER_CLOSURE_CONTRACT_VERSION,
        "capability_id": "B03-CAP-004",
        "capability_title": "Runtime Minimalism Guard",
        "minimalism_finding": "ACCEPTED" if not issues else "BLOCKED",
        "runtime_added": False,
        "api_added": False,
        "ui_added": False,
        "persistence_added": False,
        "deployment_added": False,
        "registry_mutated": False,
        "blockers": [issue.code for issue in issues],
    }
    return _result(not issues, "MINIMALISM_ACCEPTED" if not issues else "BLOCKED", issues, payload)
