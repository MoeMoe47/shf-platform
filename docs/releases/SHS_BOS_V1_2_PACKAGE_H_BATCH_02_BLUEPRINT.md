# SHS BOS V1.2 Package H Batch 02 Blueprint

## 1. Executive decision

Decision: `PACKAGE_H_BATCH_02_BLUEPRINT_ONLY`.

Package H Batch 02 is approved for future implementation planning only. This mission does not restore archived implementation, add runtime code, add APIs, add UI, change tests, or create a release tag.

Planning lock: no new registry is authorized by this blueprint.

Readiness recommendation: `PACKAGE_H_BATCH_02_READY_FOR_IMPLEMENTATION=YES`, provided the next mission remains bounded by this blueprint and its acceptance criteria.

## 2. Repository evidence reviewed

| Evidence | Classification | Finding |
| --- | --- | --- |
| `docs/releases/SHS_BOS_V1_2_DEVELOPMENT_BASELINE.md` | RELEASE_ARTIFACT_EVIDENCE | V1.2 starts after frozen V1.1; Package H Batch 02 is the next planning target; implementation is not authorized by initialization. |
| `docs/releases/SHS_BOS_V1_2_MISSION_PLAN.md` | RELEASE_ARTIFACT_EVIDENCE | Mission 02 is blueprint and restoration-readiness; Mission 03 is the separate implementation mission. |
| `docs/releases/SHS_BOS_V1_2_DEVELOPMENT_MANIFEST.json` | RELEASE_ARTIFACT_EVIDENCE | Implementation, runtime changes, archive restoration, and new layer authorization remain false. |
| `shs-bos-package-h-batch-01-v1` -> `185ee97db7cd8c44bdcf97b74e3194862087ce89` | GIT_HISTORY_EVIDENCE | Batch 01 established the certified extension kernel foundation. |
| `services/shf-agent-fabric/services/extension_kernel/*` | ACTIVE_REPOSITORY_EVIDENCE | Batch 01 provides owner-neutral contracts, manifest validation, lifecycle states, registry behavior, diagnostics, serialization, and versioning. |
| `services/shf-agent-fabric/tests/test_extension_kernel_foundation.py` | ACTIVE_REPOSITORY_EVIDENCE | Batch 01 tests prove generic registration behavior without canonical owner registration or special owner handling. |
| `/Users/mikeslate/Desktop/shrv1-worktree-closure-archive/20260725T020504Z/manifest/candidates/CS-11.paths` | ARCHIVED_CANDIDATE_EVIDENCE | Archived Batch 02 candidate contains docs, a validator, service code, a router, and a runtime test. |
| Archived CS-11 files under `untracked-files/` | ARCHIVED_CANDIDATE_EVIDENCE | Candidate intent is useful, but implementation claims runtime wiring and hard owner lists that are not safe to restore wholesale. |

## 3. Certified Batch 01 foundation

| Capability | Canonical file | Canonical owner | Public contract | Current implementation status | Batch 02 relevance | Evidence classification |
| --- | --- | --- | --- | --- | --- | --- |
| Extension manifest model | `services/shf-agent-fabric/services/extension_kernel/models.py` | Package H shared foundation | `ExtensionManifest`, descriptor, metadata, security, capabilities, dependencies, health, rollback | Implemented | Batch 02 owner declarations must fit this model or extend it minimally. | ACTIVE_REPOSITORY_EVIDENCE |
| Manifest validation | `services/shf-agent-fabric/services/extension_kernel/validation.py` | Package H shared foundation | `validate_manifest` and validation result objects | Implemented | Batch 02 must use deterministic validation before accepting owner declarations. | ACTIVE_REPOSITORY_EVIDENCE |
| Registration storage behavior | `services/shf-agent-fabric/services/extension_kernel/registry.py` | Package H shared foundation | `InMemoryExtensionRegistry.register`, `unregister`, `discover`, `lookup`, `validate`, `health`, `metadata`, `status`, `approval` | Implemented as in-memory foundation | Batch 02 may define registration acceptance semantics but must not create a parallel registry. | ACTIVE_REPOSITORY_EVIDENCE |
| Lifecycle states | `services/shf-agent-fabric/services/extension_kernel/constants.py` and `lifecycle.py` | Package H shared foundation | `DISCOVERED`, `REGISTERED`, `VALIDATED`, `OWNER_APPROVED`, `READY`, `ACTIVE`, `LIMITED`, `SUSPENDED`, `DISABLED`, `RETIRED` | Implemented | Batch 02 must map onboarding status onto existing lifecycle states. | ACTIVE_REPOSITORY_EVIDENCE |
| Owner neutrality invariant | `scripts/check_shs_bos_package_h_batch_01_extension_kernel.py` | Package H shared foundation validator | Prohibited owner/package tokens in kernel source | Validated | Batch 02 must preserve owner-blind shared infrastructure. | ACTIVE_REPOSITORY_EVIDENCE |
| Future integration checklist | `docs/architecture/SHS_BOS_PACKAGE_H_BATCH_01_KERNEL_FUTURE_INTEGRATION_CHECKLIST_V1.json` | Package H governance | Future steps for controlled onboarding inputs and owner manifests | Published | Batch 02 is the planned owner-onboarding follow-on. | RELEASE_ARTIFACT_EVIDENCE |

Batch 01 explicitly excluded owner registration, runtime wiring, activation logic, and owner adapters. Those exclusions define the Batch 02 gap.

## 4. Remaining architectural gap

Batch 01 can validate and register generic extension records, but it does not define the owner-supplied onboarding declaration, authority-boundary checks, collision checks, failure classifications, evidence output, or certification rules required before canonical owners can safely register through the shared foundation.

## 5. Authoritative Batch 02 purpose

`PACKAGE_H_BATCH_02_PURPOSE=Package H Batch 02 exists to define and implement an owner-neutral onboarding contract that validates owner-supplied declarations, detects ownership and authority conflicts, and produces deterministic registration evidence through the certified Batch 01 extension kernel without creating a new registry, command surface, API surface, UI surface, or owner-specific runtime path.`

## 6. In-scope capabilities

| Capability | Status |
| --- | --- |
| Owner declaration contract for canonical owner registration | REQUIRED_IN_BATCH_02 |
| Deterministic schema and semantic validation for owner declarations | REQUIRED_IN_BATCH_02 |
| Authority-domain and capability collision detection | REQUIRED_IN_BATCH_02 |
| Dependency declaration validation without resolving owner-private internals | REQUIRED_IN_BATCH_02 |
| Registration acceptance/rejection result with stable failure codes | REQUIRED_IN_BATCH_02 |
| Evidence object proving accepted/rejected onboarding decisions | REQUIRED_IN_BATCH_02 |
| Integration with Batch 01 manifest, registry, lifecycle, health, and versioning contracts | REQUIRED_IN_BATCH_02 |
| Focused tests using owner-neutral fixtures | REQUIRED_IN_BATCH_02 |
| Deterministic Package H Batch 02 validator | REQUIRED_IN_BATCH_02 |

## 7. Out-of-scope capabilities

| Capability | Disposition |
| --- | --- |
| FastAPI route or V1 Command Center endpoint | DEFER_TO_SEPARATE_AUTHORIZATION |
| Frontend or administrative UI | NOT_REQUIRED |
| Package G runtime closure | DOWNSTREAM |
| Batch 03 activation/runtime-owner closure | DEFER_TO_BATCH_03 |
| Persistent database, migration, or runtime state store | NOT_REQUIRED |
| Owner-private adapters or provider implementations | REGISTERING_OWNER_RESPONSIBILITY |
| Audit runtime implementation | ALREADY_OWNED_ELSEWHERE |
| Release tag creation | DEFER_TO_CERTIFICATION |
| Archived file restoration | REJECTED |

## 8. Owner-onboarding lifecycle

| Step | Classification | Reason |
| --- | --- | --- |
| Owner identity declaration | REQUIRED_IN_BATCH_02 | The declaration must identify the registering owner without hard-coding owners in shared code. |
| Owner capability declaration | REQUIRED_IN_BATCH_02 | Batch 01 capability contracts require explicit capability metadata. |
| Contract version declaration | REQUIRED_IN_BATCH_02 | Compatibility must be deterministic. |
| Registration request | REQUIRED_IN_BATCH_02 | Batch 02 must define the request object that can become a Batch 01 registration record. |
| Schema validation | REQUIRED_IN_BATCH_02 | Required before registration acceptance. |
| Ownership collision detection | REQUIRED_IN_BATCH_02 | Prevents duplicate authority for the same owner/capability/domain tuple. |
| Authority-boundary validation | REQUIRED_IN_BATCH_02 | Prevents Package H from accepting declarations that claim authority owned elsewhere. |
| Dependency declaration | REQUIRED_IN_BATCH_02 | Dependencies may be declared, but not resolved through owner-private imports. |
| Readiness validation | REQUIRED_IN_BATCH_02 | Required to distinguish accepted, limited, suspended, and rejected declarations. |
| Registration acceptance or rejection | REQUIRED_IN_BATCH_02 | Produces deterministic result evidence. |
| Registration evidence | REQUIRED_IN_BATCH_02 | Needed for certification. |
| Audit event | ALREADY_OWNED_ELSEWHERE | Batch 02 may expose evidence for audit owners but must not become the audit runtime. |
| Runtime discoverability | REQUIRED_IN_BATCH_02 | Must use Batch 01 registry/discovery contracts. |
| De-registration or suspension policy | REQUIRED_IN_BATCH_02 | Must map to existing lifecycle states. |
| Compatibility handling | REQUIRED_IN_BATCH_02 | Required by Batch 01 versioning semantics. |
| Failure classification | REQUIRED_IN_BATCH_02 | Required for deterministic validation and negative tests. |
| Deterministic test fixtures | REQUIRED_IN_BATCH_02 | Needed without owner-private systems or live services. |
| Release certification | DEFER_TO_CERTIFICATION | Mission 04 owns certification and tag decisions. |

## 9. Contract requirements

| Field | Classification | Owner | Validator | Persisted | Public | Mutable | Shared contract fit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `owner_id` | REQUIRED | Registering owner | Package H Batch 02 validator | Registry record metadata only | Yes | No after acceptance | Yes |
| `owner_type` | OPTIONAL | Registering owner | Package H Batch 02 validator | Optional metadata | Yes | Yes through replacement registration | Yes |
| `owner_display_name` | OPTIONAL | Registering owner | Package H Batch 02 validator | Optional metadata | Yes | Yes | Yes |
| `authority_domain` | REQUIRED | Owner of record | Package H Batch 02 validator checks uniqueness | Registration evidence | Yes | No after acceptance | Yes |
| `capability_ids` | REQUIRED | Registering owner | Batch 01 and Batch 02 validators | Registration record | Yes | No after acceptance | Yes |
| `contract_version` | REQUIRED | Package H shared foundation | Batch 02 validator | Registration evidence | Yes | No | Yes |
| `provider_version` | OPTIONAL | Registering owner | Batch 02 validator | Optional metadata | Yes | Yes | Yes |
| `registration_version` | REQUIRED | Package H shared foundation | Batch 02 validator | Registration evidence | Yes | No | Yes |
| `public_interface` | OPTIONAL | Registering owner | Batch 02 validator | Optional metadata | Yes | Yes | Yes, if it names a public contract only |
| `health_check_contract` | OPTIONAL | Registering owner | Batch 02 validator | Optional metadata | Yes | Yes | Yes, no owner-private import |
| `evidence_contract` | REQUIRED | Package H shared foundation | Batch 02 validator | Evidence output | Yes | No | Yes |
| `dependency_declarations` | OPTIONAL | Registering owner | Batch 02 validator | Registration evidence | Yes | Yes through replacement registration | Yes |
| `optional_dependency_declarations` | OPTIONAL | Registering owner | Batch 02 validator | Registration evidence | Yes | Yes | Yes |
| `compatibility_range` | REQUIRED | Package H shared foundation | Batch 02 validator | Registration evidence | Yes | No | Yes |
| `registration_status` | DERIVED | Package H shared foundation | Batch 02 validator | Result object | Yes | Derived | Yes |
| `readiness_status` | DERIVED | Package H shared foundation | Batch 02 validator | Result object | Yes | Derived | Yes |
| `governance_status` | OWNED_ELSEWHERE | Governance owner | Batch 02 may reference only | Reference only | Yes if public | Owned elsewhere | Reference only |
| `registered_at` | DEFERRED | Runtime/certification owner | Mission 03/04 | Runtime evidence | Yes | No | Avoid volatile commit data |
| `registered_by` | OPTIONAL | Registering owner or release operator | Batch 02 validator | Optional evidence | Yes | No after acceptance | Yes |
| `evidence_references` | REQUIRED | Package H shared foundation | Batch 02 validator | Evidence output | Yes | No | Yes |
| `failure_codes` | REQUIRED | Package H shared foundation | Batch 02 validator | Result object | Yes | Stable | Yes |

## 10. Persistence boundary

Batch 02 must not introduce a database, migration, runtime-state file, or second registry. Future implementation may use the existing Batch 01 in-memory registry for deterministic tests and may produce immutable evidence objects. Durable persistence, if required later, must be owned by the existing canonical persistence/runtime owner through a separate mission.

## 11. Runtime boundary

Future Batch 02 implementation may add local contract and validation code inside the extension-kernel family. It may not start services, wire FastAPI startup, bind routes in `main.py`, execute owner-private runtime behavior, or prove Package G end-to-end runtime closure.

## 12. API boundary

Default: no new API. The archived `extension_owner_onboarding_routes.py` is not approved for restoration in Batch 02. Any future API exposure requires separate evidence that an existing canonical route owner needs a minimal surface after the contract is certified.

## 13. UI boundary

Default: `NO_NEW_UI`. Owner onboarding can be certified through code, docs, validators, and deterministic tests. No active UI need has been proven.

## 14. Error and failure model

| Failure code | Meaning |
| --- | --- |
| `OWNER_ID_MISSING` | Declaration omits owner identity. |
| `OWNER_ID_INVALID` | Owner identity is malformed or not owner-neutral. |
| `AUTHORITY_DOMAIN_MISSING` | Declaration omits authority domain. |
| `CAPABILITY_MISSING` | Declaration provides no capability. |
| `CONTRACT_VERSION_INVALID` | Contract version is absent or incompatible. |
| `REGISTRATION_VERSION_INVALID` | Registration contract version is absent or incompatible. |
| `OWNERSHIP_COLLISION` | Another accepted declaration owns the same owner/capability/domain tuple. |
| `AUTHORITY_BOUNDARY_VIOLATION` | Declaration claims authority that belongs to another canonical owner. |
| `OWNER_PRIVATE_IMPORT_DECLARED` | Declaration requires shared infrastructure to import owner-private code. |
| `DEPENDENCY_DECLARATION_INVALID` | Dependency declaration is malformed or points to a private implementation path. |
| `READINESS_NOT_PROVEN` | Declaration is syntactically valid but lacks required readiness evidence. |

## 15. Security and governance constraints

Package H validates registration declarations and evidence shape only. It must not hold secrets, issue identity credentials, approve governance exceptions, impersonate audit, or store owner-private state. Owner approval must remain explicit and cannot be inferred from the existence of an archived candidate file.

## 16. Implementation path authorization

| Path | Classification | Reason |
| --- | --- | --- |
| `services/shf-agent-fabric/services/extension_kernel/owner_onboarding.py` | EXPECTED_NEW_PATH | A focused contract module avoids a separate owner-onboarding service and keeps Batch 02 attached to the certified kernel. |
| `services/shf-agent-fabric/services/extension_kernel/__init__.py` | EXPECTED_MODIFIED_PATH | Export only the new public contract symbols after implementation. |
| `services/shf-agent-fabric/services/extension_kernel/models.py` | EXPECTED_MODIFIED_PATH | Add minimal dataclasses only if reuse of existing manifest fields is insufficient. |
| `services/shf-agent-fabric/services/extension_kernel/validation.py` | EXPECTED_MODIFIED_PATH | Add deterministic declaration validation only if it cannot remain entirely in `owner_onboarding.py`. |
| `services/shf-agent-fabric/services/extension_kernel/constants.py` | EXPECTED_MODIFIED_PATH | Add stable failure codes only if not local to the new Batch 02 module. |
| `services/shf-agent-fabric/tests/test_extension_kernel_owner_onboarding.py` | EXPECTED_NEW_PATH | Focused owner-neutral test coverage for declarations, collisions, failures, and coexistence. |
| `scripts/check_shs_bos_v1_2_package_h_batch_02_owner_onboarding.py` | EXPECTED_NEW_PATH | Deterministic implementation validator for Mission 03/04. |
| `docs/releases/SHS_BOS_V1_2_PACKAGE_H_BATCH_02_IMPLEMENTATION_SUMMARY.md` | CONDITIONAL_PATH_REQUIRING_EVIDENCE | Allowed only if the implementation mission requires a release evidence artifact. |
| `services/shf-agent-fabric/services/owner_onboarding/service.py` | PROHIBITED_PATH | Archived standalone service duplicates the extension-kernel boundary. |
| `services/shf-agent-fabric/routers/extension_owner_onboarding_routes.py` | PROHIBITED_PATH | Archived route creates an API surface outside this Batch 02 contract. |
| `services/shf-agent-fabric/main.py` | PROHIBITED_PATH | Runtime wiring is outside Batch 02. |
| `src/**` | PROHIBITED_PATH | No UI is required. |

Estimated maximum implementation path count: 8 exact paths, excluding optional certification artifacts separately authorized by Mission 04.

## 17. Test strategy

Mission 03 should add focused tests proving one valid owner declaration can register, invalid declarations are rejected, ownership collisions are rejected, multiple owners coexist without special cases, owner absence does not break the kernel, and no shared module imports owner-private implementation. Tests must be local, deterministic, network-free, and service-startup-free.

## 18. Release strategy

Mission 03 may implement the contract and validator only after this blueprint is published. Mission 04 must certify the implementation, verify all acceptance criteria, and decide whether a Package H Batch 02 tag is authorized. This mission creates no tag.

## 19. Risks

| Risk | Result |
| --- | --- |
| Archived CS-11 overstates runtime wiring as Batch 02 completion | Mitigated by classifying runtime closure and route/service files as not restorable. |
| Package H becomes a duplicate owner registry | Mitigated by using Batch 01 registry contracts and forbidding new persistent stores. |
| Shared infrastructure hard-codes owners | Mitigated by owner-neutral fixtures and validator checks. |
| Package G runtime closure leaks into Batch 02 | Mitigated by treating Package G as downstream, not an implementation dependency for the Batch 02 contract. |
| V1.2 initialization validator expects Mission 01 manifest fields | Mitigated by preserving compatibility fields and adding Mission 02-specific status fields. |

## 20. Stop conditions

Stop Mission 03 if implementation requires a route, UI, `main.py`, a new database, archive copy, Package G runtime closure, owner-private imports, a new registry, a new layer, or unresolved governance approval. Stop if owner-neutral tests cannot prove the lifecycle without hard-coded canonical owners.

## 21. Next-mission authorization recommendation

`NEXT_GOVERNED_MISSION=PACKAGE_H_BATCH_02_IMPLEMENTATION`

The next mission should implement only the owner-neutral onboarding declaration contract, deterministic validator, focused tests, and required release evidence inside the narrow path boundary above.

## Hostile review

| Question | Result |
| --- | --- |
| Does this create a new layer? | No. It extends Package H extension-kernel contracts. |
| Does this create a hidden second registry? | No. New persistence and parallel registries are prohibited. |
| Does Package H become the owner of data owned elsewhere? | No. Package H validates declarations and evidence shape only. |
| Does shared infrastructure know specific owner names? | No. Owner-neutral fixtures are required. |
| Does the plan require owner-private imports? | No. Owner-private imports are failure conditions. |
| Is a new API being proposed where an existing route already owns the capability? | No. API work is prohibited. |
| Is a new UI proposed without necessity? | No. UI boundary is no new UI. |
| Does the contract include fields owned by another canonical authority? | Governance status is marked owned elsewhere and reference-only. |
| Is archived code being favored over certified current architecture? | No. Archive is evidence only. |
| Are future paths broader than necessary? | No. Paths are exact, with broad directories prohibited. |
| Are acceptance criteria testable? | Yes. The companion criteria document binds validator/test evidence. |
| Are failure states deterministic? | Yes. Stable failure codes are defined. |
| Are blocking questions being concealed as assumptions? | No unresolved blocking questions remain. |
| Does Batch 02 accidentally include Batch 03? | No. Activation and runtime owner closure are deferred. |
| Is the plan solving hypothetical future needs? | No. It addresses the Batch 01 exclusion: controlled owner onboarding. |
| Could the same result be achieved with fewer files or smaller changes? | The future implementation boundary is already limited to one new contract module, focused tests, validator, and minimal exports/constants only when proven necessary. |
