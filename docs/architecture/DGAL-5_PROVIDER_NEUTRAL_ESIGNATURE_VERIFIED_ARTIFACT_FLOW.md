# DGAL-5 Provider-Neutral E-Signature Adapter & Verified Artifact Flow

## 1. Executive Result
DGAL-5 closes DGAL-GAP-006 and finalizes DGAL-GAP-010 at the accepted roadmap scope. A bounded provider-neutral electronic-signature contract now persists exact document/version/hash bindings, normalizes provider state, authenticates callbacks, prevents replay and stale-state regression, and stores signed-artifact references separately from original documents. The deterministic `test` adapter proves the contract without claiming production provider activation.

## 2. Repository Baseline
Repository: `/Users/mikeslate/Projects/shrv1`. Branch: `studio-v1-plus-development`. Starting HEAD: `9eaaa0c`. The worktree contains prior readiness and DGAL-0 through DGAL-4 owner changes; no unrelated changes were discarded. Migration head was 135; DGAL-5 adds migration 136.

## 3. DGAL-5 Gap IDs
DGAL-GAP-006 (P1) and DGAL-GAP-010 (P2, final digital/paper parity acceptance at this roadmap point).

## 4. Scope Boundaries
This phase adds adapter, request, callback, artifact-reference, status, and bounded status UX contracts. It does not add Legal authority, Evidence authority, Truth writes, entitlement activation, provider production accounts, DocuSign, Adobe Acrobat Sign, callbacks from real providers, or the premium Document Center.

## 5. Existing Provider Integration Patterns
Existing permission guards, scoped repositories, source storage, provider health conventions, idempotency patterns, and external-integration readiness documents were reused. No second provider framework was created.

## 6. Canonical Authority Model
DGAL owns signature-request orchestration metadata and normalized provider state. Legal and service domains own meaning and acceptability. Evidence owns evidence acceptance; Truth and workflow owners remain separate.

## 7. Signature Request Model
`documentation_signature_requests` stores organization/tenant, domain, requirement, document instance, exact template version/hash, agreement reference, signer identity/role/capacity, provider/environment/reference, normalized/raw status, artifact/hash, retention/hold, and timestamps.

## 8. Signature State Model
Electronic requests use `DRAFT`, `SENT`, `VIEWED`, `SIGNED`, `DECLINED`, `VOIDED`, `EXPIRED`, and `FAILED`. Manual DGAL-4 records remain `UPLOADED`/`VERIFIED`/`REJECTED` and are not rewritten as electronic signatures.

## 9. Manual vs Electronic Separation
The two state machines and persistence tables are distinct. A paper upload is never interpreted as a provider event, and a provider event never changes a manual-signature record.

## 10. Document Version / Hash Binding
Creation requires a generated document instance and matching content hash. The service derives the template version from the server-side document and rejects client substitutions.

## 11. Provider Adapter Contract
`SignatureProviderAdapter` defines request creation, signing session, status, void, webhook verification/normalization, artifact retrieval, and health checks. Provider-specific vocabulary stays behind the adapter.

## 12. Provider Registry
`SignatureProviderRegistry` selects an explicitly registered key/environment pair. The default registry contains only the test adapter in `TEST`; arbitrary client provider names do not activate providers.

## 13. Test Adapter
`TestSignatureProviderAdapter` is deterministic and test-only. It supports request creation, sessions, state fixtures, HMAC-authenticated callbacks, status, void, artifact retrieval, and health.

## 14. Real Provider Activation Boundary
No real provider is production-activated. DocuSign, Adobe Acrobat Sign, or another provider needs external account credentials, webhook registration, provider/legal configuration, and sandbox/production approval.

## 15. Signer Identity / Capacity
Signer reference, role, represented party, and capacity are explicit. Request authorization is server-side; an email or arbitrary client role is not legal-authority proof.

## 16. Signing Session Security
Sessions are requested server-side for an existing scoped request and are bounded to the provider request. A session reference is not proof of completion.

## 17. Webhook Verification
The adapter verifies the callback before normalization. The test adapter uses an environment-configurable HMAC secret; no secret is committed. Raw callback payloads are not treated as trusted authority.

## 18. Replay / Idempotency
Signature request idempotency is scoped by organization/tenant. Provider event identity is unique by provider/environment/event reference; replay returns the existing result without a second transition.

## 19. Out-of-Order Events
Terminal states do not regress. A stale `VIEWED` event cannot move a `SIGNED` request backward.

## 20. State Normalization
Consumers receive provider-neutral states while `provider_status`, provider reference, and bounded metadata preserve traceability.

## 21. Polling / Reconciliation
The bounded `refresh` action asks the adapter for status and applies the same monotonic transition rules. Browser redirects are not the completion authority.

## 22. Signed Artifact Retrieval
After a verified `SIGNED` provider event, the adapter supplies a signed artifact reference/bytes. The service stores a private local reference and hash without overwriting the original.

## 23. Original / Signed Artifact Separation
The original DGAL document instance and provider-signed artifact have separate references, hashes, and lifecycle metadata.

## 24. Provider Audit Reference
Provider request/event references and bounded raw-status metadata are retained. No unsupported legal or evidentiary conclusion is inferred.

## 25. Hash / Integrity
Original content hash remains bound to the request. Signed artifact bytes receive a separate SHA-256 hash; equality is not assumed because providers may wrap or transform artifacts.

## 26. Evidence Boundary
`SIGNED` does not auto-create or accept Evidence. Evidence remains a canonical owner-domain decision.

## 27. Evidence Linkage
An authorized `documentation.evidence.link` action can attach an Evidence reference to a signed request while preserving request, signer, provider, document, hash, organization, and workflow references.

## 28. Truth Boundary
Provider callbacks do not write Truth, approve releases, activate entitlements, or complete service workflows.

## 29. Legal Boundary
Legal/service owners determine whether an electronic-signature method is acceptable for an agreement. DGAL stores references and policy inputs; it does not declare enforceability.

## 30. Provider Eligibility Policy
Provider/environment selection is registry/configuration controlled. The default repository path permits only the explicit test adapter in TEST mode.

## 31. Decline / Void / Expiry
Decline, void, and expiry are distinct normalized terminal states. None is silently converted into workflow rejection or agreement invalidity.

## 32. Multiple Signers
Migration 136 includes a scoped signer-participant table with ordered signer rows, preserving a future path for parallel or ordered signers without hiding authority in JSON. The current acceptance slice uses one signer.

## 33. Packet Integration
Existing DGAL packets can reference the signature request/document item and display signature status through the bounded request metadata. Packet completion remains outside DGAL.

## 34. Guidance / Tour / Companion Integration
`electronicSignatureWorkflowSources` exposes required, waiting, completed, blocked, declined, expired, and unavailable states with source IDs and safe actions. Tour and Companion remain presentation/explanation-only.

## 35. Retention / Legal Hold
Requests and signed artifacts carry retention/hold references and use PR-2 authority. DGAL does not create or release legal holds.

## 36. Provider Outage / Failure
Unavailable or unconfigured providers fail without claiming `SENT`; failed requests retain the document binding and expose retry/reconciliation through authorized actions.

## 37. Sandbox / Production Separation
Environment is explicit in the request, provider registry key, migration constraints, and test acceptance. No test adapter is registered as production.

## 38. Observability / Security Events
Provider event references, invalid callback rejection, status transitions, artifact retrieval failures, and state conflicts are structured operationally through existing API/error boundaries. Sensitive document content and secrets are not logged.

## 39. API Surface
Added bounded routes for create/read/session/refresh/void/artifact/evidence-link and provider webhook handling under `/documentation/signatures`. There is no generic provider CRUD surface.

## 40. Frontend UX
The existing DGAL guidance projection can render signature-required, waiting, signed, declined, expired, and unavailable states. No Document Center or provider-hosted signing UI was fabricated.

## 41. Primary Service Slice
Organization Onboarding / Service Agreement is the primary contract slice: exact generated agreement → test adapter request → signed callback → signed artifact reference → optional authorized Evidence link, while onboarding remains activation authority.

## 42. Secondary Domain Acceptance
CivicSure provider attestation is the secondary fixture domain. It uses the same provider-neutral request and guidance contract without changing CivicSure verification authority.

## 43. Database / Migration
Migration 136 adds request, ordered signer-participant, and provider-event tables with scope constraints, status constraints, idempotency/provider-reference indexes, and timestamps. Migrations 001–136 apply cleanly in isolated PostgreSQL.

## 44. Audit Events
Provider event and status metadata are persisted in the existing DGAL operational boundary. No second audit ledger was created.

## 45. Security
Tests cover forged callbacks, replay, direct scope, foreign organization, wrong document/hash, unconfigured provider, stale state, and signed artifact separation. Raw signing references are not completion proof.

## 46. Accessibility
The bounded guidance/status contract uses semantic existing surfaces. Provider-hosted signing accessibility remains a provider dependency and is not claimed as repository-controlled evidence.

## 47. External Dependencies
Remaining blockers are real provider account/credential configuration, verified webhook endpoint registration, provider sandbox/production approval, and legal/service acceptance of a selected provider. These are not repository-local defects.

## 48. Tests
`dgal-signatures.test.ts` covers exact binding, idempotent request creation, valid signed callback, artifact retrieval/hash, replay, stale callback, forged callback, foreign scope, provider selection, Evidence separation, and guidance. DGAL-1 through DGAL-4 focused regressions also pass.

## 49. DGAL-GAP-006 Closure
**RESOLVED** — provider-neutral adapter, durable signature requests, normalized states, authenticated callbacks, replay/idempotency, exact binding, signed artifact references, and authority boundaries are implemented and tested.

## 50. DGAL-GAP-010 Final Status
**RESOLVED at accepted DGAL roadmap scope** — DGAL-4 manual paper parity and DGAL-5 electronic signing parity now share exact document binding, separate artifact handling, verification/status boundaries, and canonical Evidence/retention integration.

## 51. Files Created
`136_dgal_signature_requests.sql`; signature model, provider adapter/registry, repository, service, API routes, focused tests, and this report.

## 52. Files Modified
`security-permissions.ts`, `api/router.ts`, DGAL-2 contextual guidance, and the DGAL-0 gap register.

## 53. Owner Work Preservation
Prior readiness and DGAL-0 through DGAL-4 changes, databases, evidence, and artifacts were preserved. No commit or push was performed.

## 54. Validation
Focused DGAL-5 tests: 4/4. Combined DGAL-1 through DGAL-5 focused tests: 30/30. Typecheck passes. Isolated migration 001–136 passes with no pending/drift/unknown migrations. Full root checks remain required after final documentation edits.

## 55. DGAL-5 Decision
DGAL-GAP-006 and DGAL-GAP-010 are resolved at repository scope. Real provider activation remains external. No e-signature vendor was activated, no callback secret was committed, and no premium Document Center was built.

## 56. Exact Next Phase
`DGAL-6 — PREMIUM DOCUMENT CENTER, ADMIN PUBLISHING, NOTIFICATIONS & SERVICE ACCEPTANCE`.

### Closure Matrix

| DGAL Gap ID | Starting Status | Work Performed | Tests | Final Status | Evidence |
|---|---|---|---|---|---|
| DGAL-GAP-006 | OPEN — P1 | Added provider-neutral request/adapter/registry, normalized state machine, exact binding, authenticated callbacks, replay/idempotency, artifact retrieval, and scoped Evidence/retention references | `dgal-signatures.test.ts`; combined DGAL focused suite; migration 136 | RESOLVED | `documentation_signature_requests`, `documentation_signature_provider_events`, adapter contract, callback tests |
| DGAL-GAP-010 | DGAL-4 manual portion complete; DGAL-5 final acceptance pending | Preserved manual path and added electronic signing parity with separate provider artifact/state and exact original binding | DGAL-4 regression; DGAL-5 signature suite; migration 136 | RESOLVED at accepted roadmap scope | DGAL-4 manual records plus DGAL-5 request/artifact/callback flow |
