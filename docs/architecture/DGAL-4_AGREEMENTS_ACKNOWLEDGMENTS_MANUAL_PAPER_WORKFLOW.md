# DGAL-4 — Agreements, Acknowledgments & Manual Paper Workflow

## 1. Executive Result
DGAL-4 adds durable, server-authoritative acknowledgment records and a first-class manual-paper signed-artifact workflow. Exact DGAL document identity, template version, original hash, uploaded-artifact hash, signer capacity, verifier identity, scope, provenance, and retention references are preserved. No electronic-signature provider or signature-provider lifecycle was introduced.

## 2. Repository Baseline
Repository `/Users/mikeslate/Projects/shrv1`, branch `studio-v1-plus-development`, starting HEAD `9eaaa0cf7b54905ca5eaedcea542ed4c298cb061`. Migration 134 was preserved; migration 135 was added. Existing owner/DGAL work remains uncommitted and was not reverted.

## 3. DGAL-4 Gap IDs
`DGAL-GAP-005` and the manual-paper portion of `DGAL-GAP-010`.

## 4. Scope Boundaries
Implemented durable acknowledgment composition and manual paper upload/verification. Deferred DGAL-5 provider-neutral e-signature, callbacks, remote signing, and provider status. No premium Document Center was added.

## 5. Existing Agreement Architecture
Service Agreements remain in `service_agreements` and `service_agreement_versions`; Legal remains in `legal_artifacts`, `legal_decisions`, `legal_obligations`, and `legal_holds`. DGAL references exact owner records and does not copy lifecycle authority.

## 6. Canonical Ownership
DGAL owns composition metadata, acknowledgment records, manual-signature orchestration metadata, artifact references, and presentation state. Service Agreement owns agreement lifecycle; Legal owns legal meaning/approval/hold; Evidence owns verification/evidence; Truth and service domains own projection and workflow completion.

## 7. Agreement Reference Model
Acknowledgments may bind to a generated DGAL document instance and/or an exact canonical Service Agreement/version. The agreement reader validates the agreement and version through Service Agreement authority.

## 8. Acknowledgment Model
`documentation_acknowledgments` stores actor, role, represented capacity, organization/tenant, owning domain, requirement, exact document/template/hash or agreement/version, resource/workflow scope, method, status, timestamps, and retention references.

## 9. Acknowledgment State Model
Supported states are `PENDING`, `ACKNOWLEDGED`, `VOIDED`, `INVALIDATED`, and `SUPERSEDED`. The implemented explicit action records `ACKNOWLEDGED`; no signature state is reused.

## 10. Exact Version Binding
Acknowledgment requires a generated document instance or canonical agreement reference. Document acknowledgments retain the exact instance, template version, and content hash. Agreement acknowledgments require an exact owner-provided version.

## 11. Explicit Action Semantics
Only the authenticated acknowledgment action creates a record. Viewing, downloading, printing, Tour completion, Companion interaction, and passive timeout do not acknowledge.

## 12. Legal Content Boundary
DGAL does not author consent, waiver, legal, or binding language. Missing owner/legal wording remains an owner-content requirement.

## 13. Service Agreement Integration
`CanonicalServiceAgreementReader` uses existing `ServiceAgreementService` to verify readable agreement/version references. DGAL cannot approve, activate, amend, or otherwise change Service Agreement state.

## 14. Representative Capacity
Actor identity and server-derived actor role are stored separately from represented-party and signer-capacity references. Client role claims are ignored for acknowledgment actor role.

## 15. Authorization
Routes require explicit DGAL permissions. Repository reads and writes require actor-derived organization/tenant scope. Direct IDs cannot cross scope.

## 16. Idempotency
Acknowledgment idempotency keys and exact obligation uniqueness prevent ambiguous duplicate acknowledgments. Manual uploads support scoped idempotency keys.

## 17. New Version / Re-Acknowledgment
Historical acknowledgments are not mutated by new versions. Re-acknowledgment remains driven by DGAL-1 requirement rules; DGAL-4 does not infer re-acknowledgment from any version change.

## 18. Invalidation / Historical Preservation
The schema preserves invalidation/void/supersession fields and does not delete acknowledgment history. Manual status transitions append events and preserve the uploaded record.

## 19. Manual Paper Workflow
Exact generated document → print/download → physical signing → validated private upload → `UPLOADED` → authorized verification → `VERIFIED` or `REJECTED`. Original generated artifact is never overwritten.

## 20. Manual Signature Model
`documentation_manual_signature_records` stores original document/template/hash, signed artifact reference/hash/media/size, signer reference/role/capacity/date, uploader, verifier, state, owning domain, requirement, Evidence reference, retention, and hold references.

## 21. Manual Signature State Model
States are `PENDING`, `UPLOADED`, `VERIFIED`, `REJECTED`, and `VOIDED`. Provider e-signature states such as `SENT` or `VIEWED` are absent.

## 22. Upload vs Verification Boundary
Upload always creates `UPLOADED` and requires verification. It never creates `VERIFIED` automatically and does not claim physical signature authenticity.

## 23. Verifier Authority
Verification requires `documentation.manual_signature.verify`. The uploader cannot self-verify unless an explicit future policy grants `documentation.manual_signature.self_verify`; current tests deny self-verification.

## 24. Signed Artifact Storage
Signed files reuse `validateSourceFile` and `LocalPrivateSourceStorage`, including path safety, PDF/DOCX/TXT/Markdown validation, 25 MB limit, and private storage.

## 25. Original / Signed Artifact Separation
The original DGAL document instance remains immutable and separately addressable. The signed upload receives a distinct scoped storage reference and record.

## 26. Integrity / Hashing
Original and signed artifact hashes are explicit. The signed hash proves stored-byte integrity, not signer authenticity.

## 27. Evidence Boundary
Acknowledgment and manual upload do not create or accept Evidence. Existing Evidence remains the authority.

## 28. Evidence Linkage
The records include future/reference fields for authorized owner-domain Evidence linkage. DGAL-3 explicit Evidence-link permissions and scope remain the canonical linkage path.

## 29. Truth Boundary
No acknowledgment or manual signature path writes Truth or completes a service workflow.

## 30. Retention
Acknowledgment and manual-signature records carry retention policy references and classification-related metadata without creating a second retention engine.

## 31. Legal Hold
Legal/Retention remains hold authority. DGAL preserves and surfaces hold references and does not place or release holds.

## 32. Packet Integration
DGAL-3 packet instances can distinguish generated document items from later acknowledgment/manual-signature records. Packet/workflow completion remains an owning-domain decision.

## 33. Print / PDF Integration
Manual paper uses DGAL-3 exact document instances and the existing Reporting/print/PDF integration. No competing PDF engine or current-template regeneration path was added.

## 34. Guidance Integration
`agreementWorkflowSources` maps acknowledgment/manual states into required, waiting, blocked, and completed guidance while preserving source IDs and not mutating state.

## 35. Tour Integration
Tour may explain review, print, upload, and verification steps. Tour completion remains experience-only.

## 36. Companion Integration
Companion may explain exact requirements and waiting ownership from the bounded guidance projection. It cannot acknowledge, verify, waive, or approve.

## 37. Packet Completion Semantics
Generated, acknowledged, uploaded, verified, and owning-workflow-complete remain distinct states. `UPLOADED` is not `VERIFIED`.

## 38. Workflow Completion Boundary
Onboarding, CivicSure, Studio, ARAG, Agent Fabric, Curriculum, entitlement, and payment authorities remain outside DGAL.

## 39. Primary Service Slice
Organization onboarding / Service Agreement was selected conceptually: the exact agreement is referenced, an authorized representative acknowledgment binds an exact version, and paper return is bound to the generated document. The implementation is domain-neutral and does not activate onboarding.

## 40. Secondary Domain Acceptance
CivicSure/provider-style document and manual signature fixtures prove a second owning-domain reference can use the same acknowledgment/upload/verification contract without creating a CivicSure authority.

## 41. API Surface
Added bounded routes for acknowledgment create/read, manual-signature multipart upload/read/artifact retrieval, and authorized verify/reject. No generic CRUD or e-signature endpoints exist.

## 42. UI
The API exposes explicit ready, acknowledged, uploaded, verification-required, verified, rejected, unavailable, and unauthorized states for the existing DGAL-2/3 presentation surfaces. No Document Center was added.

## 43. Accessibility
No new dense or modal experience was added. Existing semantic document/print output remains the presentation base; future acknowledgment UI must use explicit labels, focus, announcements, and no prechecked controls.

## 44. Responsive Behavior
Manual paper remains usable through the existing responsive document/print surface; provider upload is multipart and not tied to desktop-only layout.

## 45. Security
Actor/org/tenant scope, exact document/hash checks, permission guards, MIME/signature validation, size limits, private storage, no arbitrary storage paths, verifier separation, and cross-org tests are present.

## 46. Audit / Events
Manual transitions append `documentation_manual_signature_events`. Existing operational/audit event authority remains the integration point; no second audit ledger was created.

## 47. Tests
`dgal-agreements-manual-signatures.test.ts` covers exact binding, canonical agreement version, explicit/idempotent acknowledgment, forged role resistance, cross-org denial, validated upload, original/signed separation, self-verification denial, authorized verification, guidance states, and no Evidence/Truth auto-write. Migrations 001-135 apply cleanly in an isolated PostgreSQL database. DGAL-1/2/3 and Reporting regressions were rerun.

## 48. DGAL-GAP-005 Closure
**RESOLVED** — canonical agreement references, exact version binding, durable acknowledgment records, authorization, idempotency, history, and Legal/Service Agreement boundaries are implemented and tested.

## 49. DGAL-GAP-010 Status / Closure
**MANUAL-PAPER IMPLEMENTATION COMPLETE; ROADMAP FINAL ACCEPTANCE PRESERVED** — DGAL-4 implements exact print → upload → verify, but DGAL-0 assigns final printable/paper parity/evidence drill closure to DGAL-5. The gap is not falsely reclassified as fully closed here.

## 50. Files Created
`apps/shs-api/migrations/135_dgal_acknowledgments_manual_signatures.sql`; acknowledgment repository, agreement reader/service, routes, focused tests; this report.

## 51. Files Modified
`apps/shs-api/src/api/router.ts`, `apps/shs-api/src/auth/security-permissions.ts`, DGAL-2 contextual guidance source adapter, DGAL-0 gap register.

## 52. Owner Work Preservation
Prior readiness and DGAL-0 through DGAL-3 work, databases, evidence, artifacts, and unrelated owner modifications were preserved. No commit or push was performed.

## 53. Validation
Focused DGAL-4 tests pass; API typecheck passes; migration 135 applies through the full chain with no drift. Root manifests, UI validation, production build, Layer, Truth, Oracle, and `git diff --check` checks pass; existing Vite chunk-size warnings remain non-blocking.

## 54. DGAL-4 Decision
DGAL-GAP-005 is resolved. The manual-paper implementation assigned to DGAL-4 is complete; DGAL-GAP-010 retains its DGAL-5 final acceptance ownership. No e-signature provider, callback, acknowledgment provider, or Document Center was introduced.

## 55. Exact Next Phase
`DGAL-5 — PROVIDER-NEUTRAL E-SIGNATURE ADAPTER & VERIFIED ARTIFACT FLOW`.

### Closure Matrix

| DGAL Gap ID | Starting Status | Work Performed | Tests | Final Status | Evidence |
|---|---|---|---|---|---|
| DGAL-GAP-005 | OPEN — P1 | Added exact agreement/document references, durable acknowledgments, actor/capacity binding, idempotency, history, and legal/service authority boundaries | DGAL-4 focused suite; migration 135 | RESOLVED | `documentation_acknowledgments`, Service Agreement reader, acknowledgment routes/tests |
| DGAL-GAP-010 | OPEN — P2 | Added exact print/download → validated upload → verification-required → authorized verify/reject workflow with separate original/signed artifacts | DGAL-4 focused suite; DGAL-3 print/PDF regression; migration 135 | OPEN — FINAL ACCEPTANCE ASSIGNED TO DGAL-5 | Manual-paper implementation is complete in DGAL-4; final roadmap acceptance/evidence drill remains assigned to DGAL-5 |
