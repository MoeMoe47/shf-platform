# SHS BOS V1.2 Package H Batch 02 Ownership Map

## Responsibility-to-owner map

| Responsibility | Canonical owner | Public integration point | Batch 02 role | Prohibited duplication | Evidence |
| --- | --- | --- | --- | --- | --- |
| Shared extension registration foundation | Package H Batch 01 extension kernel | `services.extension_kernel` public models, registry, lifecycle, validation, versioning | `SHARED_REGISTRATION_FOUNDATION` | Batch 02 must not create a second registry or separate service boundary. | ACTIVE_REPOSITORY_EVIDENCE |
| Owner declaration content | Registering owner | Owner-supplied declaration contract | `REGISTERING_OWNER` | Package H must not synthesize owner approval or owner-private capability claims. | INFERENCE_REQUIRING_IMPLEMENTATION_CONFIRMATION |
| Registration validation | Package H Batch 02 | Deterministic validator and extension-kernel contract validation | `VALIDATOR` | Validator must not call owner-private systems or runtime routes. | ACTIVE_REPOSITORY_EVIDENCE |
| Canonical ownership of business data | Owner of record for each domain | Public owner contract only | Reference and boundary validation | Package H must not become truth, identity, contract, audit, command, readiness, or presentation authority. | RELEASE_ARTIFACT_EVIDENCE |
| Master layer registry authority | Master Layer Registry governance | `docs/MASTER_LAYER_REGISTRY.md` as read-only release governance | Read-only dependency | Batch 02 must not update layer authority or add layers. | ACTIVE_REPOSITORY_EVIDENCE |
| Source registry authority | Source Registry owner | Existing public source registry contract, if exposed by future mission | Non-dependency for Batch 02 implementation | No source registry data duplication. | INFERENCE_REQUIRING_IMPLEMENTATION_CONFIRMATION |
| Identity and access | Identity and Access owner | Public identity/approval contract, if exposed | Reference-only declaration value | Package H must not issue identity credentials. | RELEASE_ARTIFACT_EVIDENCE |
| Contract runtime | Contract Runtime owner | Public contract references | Reference-only validation input | Package H must not implement contract execution. | RELEASE_ARTIFACT_EVIDENCE |
| Truth interpretation | Truth Spine and Oracle owners | Public owner contracts only | Non-dependency | Package H must not interpret truth or oracle output. | RELEASE_ARTIFACT_EVIDENCE |
| Agent Fabric | Agent Fabric owner | Public adapter/capability declaration only | Potential registering owner | Package H must not import agent runtime internals. | RELEASE_ARTIFACT_EVIDENCE |
| Audit and verification | Audit and Verification owner | Evidence handoff contract, if exposed | Evidence producer only | Package H must not become the audit runtime. | RELEASE_ARTIFACT_EVIDENCE |
| Readiness gate | Readiness/release governance owner | Certification validator output | Evidence input provider | Package H must not mark release readiness alone. | RELEASE_ARTIFACT_EVIDENCE |
| Release management | Release governance | Mission 04 certification process | Release evidence provider | Package H Batch 02 blueprint must not create tags. | RELEASE_ARTIFACT_EVIDENCE |
| Executive Command | Executive Command owner | Existing command-center public surface only, if later authorized | Experience consumer only | Package H must not create a duplicate command surface. | RELEASE_ARTIFACT_EVIDENCE |
| Shared Experience registration providers | Shared Experience owner | Public provider contract only | Potential registering owner | Package H must not own presentation/provider runtime. | ARCHIVED_CANDIDATE_EVIDENCE |

## Shared-foundation versus owner boundary

| Boundary | Shared foundation may do | Registering owner must do | Not allowed |
| --- | --- | --- | --- |
| Identity | Validate declared owner id shape and uniqueness inside onboarding evidence | Declare its owner id and public ownership domain | Shared foundation cannot create identity credentials or owner approval. |
| Capability | Validate capability declaration shape and collision constraints | Declare public capability ids and versions | Shared foundation cannot infer private capabilities from code. |
| Dependencies | Validate declared dependency metadata | Declare required and optional dependencies | Shared foundation cannot import or execute dependencies. |
| Readiness | Emit deterministic readiness status based on declaration evidence | Supply readiness evidence | Shared foundation cannot certify production runtime readiness by itself. |
| Evidence | Produce local registration evidence and failure codes | Provide non-secret evidence references | Shared foundation cannot expose secrets or owner-private state. |

## Permitted integration points

| Integration point | Permission |
| --- | --- |
| `services.extension_kernel.ExtensionManifest` | Permitted for translating an accepted owner declaration into a kernel-compatible manifest. |
| `services.extension_kernel.InMemoryExtensionRegistry` | Permitted for deterministic local registration tests and contract behavior. |
| `services.extension_kernel.validate_manifest` | Permitted for Batch 01 manifest compatibility validation. |
| `services.extension_kernel` lifecycle states | Permitted for mapping onboarding status to existing states. |
| V1.2 release planning docs | Permitted as governance evidence. |

## Prohibited reach-in paths

| Path or class | Reason |
| --- | --- |
| `services/shf-agent-fabric/services/owner_onboarding/service.py` | Archived standalone implementation, not certified architecture. |
| `services/shf-agent-fabric/routers/extension_owner_onboarding_routes.py` | Archived API surface, outside Batch 02 contract. |
| `services/shf-agent-fabric/main.py` | Runtime startup wiring is outside scope. |
| `services/shf-agent-fabric/services/shared_integration/**` | Package G/shared integration runtime is downstream and not present as an active Batch 02 dependency. |
| `src/**` | UI work is outside scope. |
| Owner-private services | Shared infrastructure must not import owner internals. |
| New persistent registry files | Would duplicate registration authority. |

## Authority-collision risks

| Risk | Status | Mitigation |
| --- | --- | --- |
| Batch 02 duplicates canonical owner registry | Controlled | Treat owner registry as owner-of-record evidence only; do not create a new persistent owner registry. |
| Batch 02 duplicates Contract Runtime | Controlled | Validate contract-version declarations only; do not execute contracts. |
| Batch 02 duplicates audit | Controlled | Emit evidence for audit handoff only. |
| Batch 02 duplicates Executive Command | Controlled | No route or UI is authorized. |
| Batch 02 duplicates Package G runtime closure | Controlled | Package G runtime closure is downstream and not required for Batch 02 owner declaration acceptance. |

## Unresolved ownership questions

| Question | Blocking classification | Resolution |
| --- | --- | --- |
| Which durable persistence owner will store accepted registrations after certification? | DOES_NOT_BLOCK_IMPLEMENTATION | Batch 02 can use deterministic in-memory registry semantics and evidence objects; durable persistence requires separate authorization. |
| Which audit owner will consume onboarding evidence in production? | DOES_NOT_BLOCK_IMPLEMENTATION | Batch 02 only produces evidence; audit runtime integration is downstream. |
| Which UI or command surface should show owner-onboarding status? | DOES_NOT_BLOCK_IMPLEMENTATION | No UI is required for Batch 02 acceptance. |
| Can archived Package G runtime closure be reused later? | DOES_NOT_BLOCK_IMPLEMENTATION | It is downstream evidence and must be revalidated in Package G/Batch 03 work. |

Blocking ownership questions remaining: none.
