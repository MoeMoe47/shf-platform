# SHS BOS V1.2 Package H Batch 02 Acceptance Criteria

This contract binds the future Package H Batch 02 implementation and certification missions. Passing this contract does not itself authorize runtime routes, UI, Package G runtime closure, or release tagging.

## Architecture criteria

| Criterion ID | Requirement | Evidence required | Validator or test | Failure meaning | Certification criticality |
| --- | --- | --- | --- | --- | --- |
| PHB02-ARCH-001 | Batch 01 owner-neutrality remains preserved. | Kernel source has no hard-coded canonical owner names or package-specific branches. | Batch 02 validator plus focused tests | Shared infrastructure captured owner-specific authority. | BLOCKING |
| PHB02-ARCH-002 | No duplicate canonical authority is introduced. | Ownership map and implementation path review show no new truth, identity, contract, audit, readiness, command, or presentation authority. | Batch 02 validator | Package H is owning data or runtime it should only reference. | BLOCKING |
| PHB02-ARCH-003 | No new architectural layer is introduced. | Files remain in approved Package H extension-kernel boundary. | Git diff path validation | Batch 02 exceeded its mission boundary. | BLOCKING |
| PHB02-ARCH-004 | No new command/API/UI surface is introduced. | No route, `main.py`, or `src/**` changes. | Git diff path validation | Batch 02 became a runtime or presentation mission. | BLOCKING |
| PHB02-ARCH-005 | No parallel registry is created. | Implementation uses Batch 01 registry contracts and does not add durable registry stores. | Unit tests and path review | Registration authority is duplicated. | BLOCKING |

## Contract criteria

| Criterion ID | Requirement | Evidence required | Validator or test | Failure meaning | Certification criticality |
| --- | --- | --- | --- | --- | --- |
| PHB02-CONTRACT-001 | Owner declaration schema is deterministic. | Schema fields and failure codes are fixed and documented. | Contract tests | Onboarding cannot be validated repeatably. | BLOCKING |
| PHB02-CONTRACT-002 | Versioning is explicit. | Contract, provider, registration, and compatibility versions are represented or intentionally rejected/deferred. | Contract tests | Future compatibility cannot be proven. | REQUIRED |
| PHB02-CONTRACT-003 | Capability declarations are explicit. | Accepted declarations include capability ids and types compatible with Batch 01. | Unit tests | Registered owners cannot be discovered safely. | BLOCKING |
| PHB02-CONTRACT-004 | Dependency declarations are explicit and public. | Dependencies are declared without owner-private imports. | Negative tests | Shared infrastructure reaches into owner internals. | BLOCKING |
| PHB02-CONTRACT-005 | Ownership collision detection is stable. | Duplicate authority-domain/capability declarations are rejected with `OWNERSHIP_COLLISION`. | Collision tests | Duplicate authority can enter the registry. | BLOCKING |
| PHB02-CONTRACT-006 | Failure codes are stable. | Invalid declarations return documented failure codes. | Negative tests | Certification evidence is ambiguous. | REQUIRED |
| PHB02-CONTRACT-007 | Governance-owned fields are reference-only. | Governance status is not fabricated or mutated by Package H. | Validator | Package H is fabricating approval. | BLOCKING |

## Runtime criteria

| Criterion ID | Requirement | Evidence required | Validator or test | Failure meaning | Certification criticality |
| --- | --- | --- | --- | --- | --- |
| PHB02-RUNTIME-001 | At least one neutral test owner can register. | Owner-neutral fixture accepted through Batch 01 registry semantics. | Unit test | Core onboarding flow is not functional. | BLOCKING |
| PHB02-RUNTIME-002 | Invalid owner declaration is rejected. | Missing/invalid fields produce stable failures. | Unit test | Unsafe declarations can register. | BLOCKING |
| PHB02-RUNTIME-003 | Ownership collision is rejected. | Duplicate domain/capability claim fails. | Collision test | Duplicate authority is possible. | BLOCKING |
| PHB02-RUNTIME-004 | Owner absence does not break shared foundation. | Empty registry and missing optional owners remain valid states. | Unit test | Shared foundation requires a specific owner. | BLOCKING |
| PHB02-RUNTIME-005 | Multiple owners coexist without special cases. | Two neutral declarations register and discover deterministically. | Unit test | Shared foundation contains owner-specific branching. | BLOCKING |
| PHB02-RUNTIME-006 | Shared infrastructure does not call owner internals. | Imports and test fixtures stay inside allowed dependencies. | Validator AST/import check | Owner-private runtime coupling was introduced. | BLOCKING |

## Security criteria

| Criterion ID | Requirement | Evidence required | Validator or test | Failure meaning | Certification criticality |
| --- | --- | --- | --- | --- | --- |
| PHB02-SEC-001 | No secrets are accepted or exposed by onboarding evidence. | Secret-like fields are absent or rejected. | Negative test | Onboarding leaks private data. | BLOCKING |
| PHB02-SEC-002 | Owner approval is never fabricated. | Approval/governance status is declared as external/reference-only unless proven by a canonical owner. | Validator | Package H minted approval authority. | BLOCKING |
| PHB02-SEC-003 | Owner-private paths are rejected. | Dependencies/public interfaces cannot point to private implementation modules. | Negative test | Shared foundation can reach into owner internals. | BLOCKING |

## Evidence criteria

| Criterion ID | Requirement | Evidence required | Validator or test | Failure meaning | Certification criticality |
| --- | --- | --- | --- | --- | --- |
| PHB02-EVID-001 | Registration result is inspectable. | Accepted and rejected results serialize deterministically. | Unit test | Certification cannot inspect results. | REQUIRED |
| PHB02-EVID-002 | Validation evidence is deterministic. | Repeated validator runs produce the same pass/fail decision. | Batch 02 validator | Evidence is volatile or environment-bound. | BLOCKING |
| PHB02-EVID-003 | Audit evidence is handoff-ready but not audit-owned. | Evidence has non-secret references and no audit runtime implementation. | Validator | Package H duplicates audit runtime. | REQUIRED |

## Testing criteria

| Criterion ID | Requirement | Evidence required | Validator or test | Failure meaning | Certification criticality |
| --- | --- | --- | --- | --- | --- |
| PHB02-TEST-001 | Focused unit tests exist for contract behavior. | Dedicated owner-onboarding test file. | Pytest | Behavior is uncertified. | BLOCKING |
| PHB02-TEST-002 | Negative tests exist. | Missing identity, bad version, collision, private import, and boundary violation cases. | Pytest | Unsafe failures are untested. | BLOCKING |
| PHB02-TEST-003 | Validator is local and deterministic. | Validator uses local files only, no HTTP, no service startup. | Validator review | Certification depends on live systems. | BLOCKING |
| PHB02-TEST-004 | Execution is bounded. | Validator and tests complete without background processes or dependency installation. | CI/local run | Validation cannot be repeated reliably. | REQUIRED |

## Governance criteria

| Criterion ID | Requirement | Evidence required | Validator or test | Failure meaning | Certification criticality |
| --- | --- | --- | --- | --- | --- |
| PHB02-GOV-001 | Exact mutation boundary is respected. | Changed paths are limited to the next mission authorization. | Git diff path validation | Scope contamination occurred. | BLOCKING |
| PHB02-GOV-002 | Archive implementation is not restored. | No archived service, router, runtime test, or stale docs copied into active paths. | Git diff/path review | V1.2 imported uncertified code. | BLOCKING |
| PHB02-GOV-003 | Worktree is clean before certification. | `git status --short` empty after commit. | Git status | Unrelated changes remain. | REQUIRED |
| PHB02-GOV-004 | Release tag is created only during certification. | No Batch 02 tag in Mission 03 implementation commit. | Git tag review | Release governance was skipped. | BLOCKING |
| PHB02-GOV-005 | Remote lineage is verified. | Local and remote `v1.2-development` match after publication. | Git fetch/rev-list | Published state is not synchronized. | REQUIRED |

## Explicit non-goals

| Non-goal | Reason |
| --- | --- |
| Package G runtime closure | Downstream package/runtime work. |
| FastAPI route | API surface not required for Batch 02 acceptance. |
| Frontend UI | No active evidence requires presentation changes. |
| Persistent store | No canonical persistence owner authorization exists. |
| Canonical owner registry rewrite | Would duplicate owner authority. |
| Owner-private adapter implementation | Registering owners own private behavior. |

## Completion decision rules

Mission 03 implementation is complete only if every `BLOCKING` criterion passes and every `REQUIRED` criterion is either passing or explicitly deferred by a separate governance artifact. Mission 04 certification is complete only if all `BLOCKING` and `REQUIRED` criteria pass, final release evidence is generated, remote lineage is clean, and tag creation is separately authorized.

Unresolved criteria: none.
