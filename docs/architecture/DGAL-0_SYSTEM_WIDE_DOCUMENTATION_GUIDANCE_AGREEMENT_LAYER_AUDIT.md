# DGAL-0 System-Wide Documentation, Guidance & Agreement Layer Audit

Date: 2026-09-12
Repository: `/Users/mikeslate/Projects/shrv1`
Phase: DGAL-0 - audit only

## 1. Executive Result

DGAL does not currently exist as one system-wide runtime layer. The repository has substantial reusable pieces: a shared Tour system, several domain tours, a deterministic Learning Companion context service, service agreements, Legal Layer V2, Evidence/source assets, report templates/renderers, certificate delivery, print CSS, onboarding, service entitlements, Studio QA/review, and governed work-order/approval systems.

The primary finding is architectural fragmentation, not absence. DGAL should be a thin composition layer that resolves contextual guidance and document requirements from canonical service state, delegates domain authority to existing systems, records acknowledgment/signature/document events through canonical audit and Evidence pathways, and reuses existing storage/retention controls. It should not become a new Legal, Evidence, Truth, reporting, entitlement, approval, or file-storage authority.

No migrations, production routes, runtime models, e-signature providers, or broad product changes were created. The exact first implementation phase is **DGAL-1 - Canonical Registry, Requirement Rules & Ownership Foundation**.

## 2. Repository Baseline

| Item | Result |
|---|---|
| Repository | `/Users/mikeslate/Projects/shrv1` |
| Branch | `studio-v1-plus-development` |
| HEAD | `9eaaa0cf7b54905ca5eaedcea542ed4c298cb061` |
| Upstream | `origin/studio-v1-plus-development` |
| Worktree | Dirty before DGAL-0; prior PR-1 through PR-7 changes and runtime/generated artifacts preserved |
| DGAL-0 source changes | None before this report |
| Commit/push | Not performed |

The worktree contains prior readiness changes, generated `dist/`, API runtime artifacts, audit output, reports, test results, and unrelated owner work. They were not reset, cleaned, stashed, or deleted.

## 3. DGAL Product Intent

The target composition is:

`Service -> Guidance -> Required Documents -> Completion/Acknowledgment -> Signature -> Evidence -> Retention`

The user experience should be role-, organization-, service-, workflow-, permission-, and requirement-aware. Documentation explains authority; it does not create authority. Generated, approved, sent, viewed, acknowledged, signed, and evidenced are distinct states.

## 4. Existing Related Architecture

| Area | Evidence | Audit result |
|---|---|---|
| Tour | `src/system/tour/*`, `TourProvider`, `useTour`, `tourConfig`; Hub, Exchange, growth, lesson and app-specific tours | EXISTS, fragmented by app and audience |
| Guidance | Companion context, calendar intelligence, career `NextActions`, orchestrator next-actions, Truth/report readiness recommendations | EXISTS as several bounded resolvers; no system-wide resolver |
| Learning Companion | `apps/shs-api/src/domain/companion/*`, `src/companion/*`, `CompanionBubble` | EXISTS, read-only and deterministic; safe presentation reuse |
| Onboarding | Organization onboarding service, lifecycle migration 085, operator page/client | EXISTS as service lifecycle authority |
| Entitlements | Service Catalog and organization entitlements, migration 084 | EXISTS as service-access authority |
| Agreements | Service Agreements service, migration 087, operator UI | EXISTS for service agreement domain; not a general document/signature registry |
| Legal | Legal Layer V2 docs, legal authority service, migration 111 | EXISTS as legal authority boundary; keep separate |
| Evidence/storage | Source assets/documents migration 058, extraction 065, canonical Evidence services | EXISTS; reuse, do not duplicate |
| Reporting | Report template registry, immutable report artifacts, HTML/PDF renderer | EXISTS for reports; extend only through explicit adapter boundaries |
| Certificates | Credential/certificate service and renderer, migrations 108+ | EXISTS for educational credentials; remain domain-owned |
| Studio | Workspace revisions, QA, review, release, build packet | EXISTS as Studio workflow authority |
| Agent Fabric/ARAG | Work orders, policy, approvals, evidence packets, WF-040 | EXISTS; DGAL presents and packages, never authorizes around them |
| Print/export | Print CSS, browser print, report HTML/PDF, export helpers | PARTIAL; no general accessible packet renderer |
| E-signature | No DocuSign/Adobe Sign/HelloSign/provider adapter found | MISSING; future provider-neutral adapter |

## 5. Tour / Orientation Inventory

| Capability | Location | Owner | Audience | State storage | Canonical? | Reusable? | Problem |
|---|---|---|---|---|---|---|---|
| Shared guided tour | `src/system/tour/TourProvider.jsx`, `useTour.js`, `tourConfig.js` | Experience layer | App-specific | React state; inspect persistence in caller | Experience | Yes | No role/org/service/workflow context |
| Hub business tour | `src/pages/hub/shared/HubBusinessTourProvider.jsx` | Hub | Operators/business users | `sessionStorage` guided intent; URL flags | Experience | Partially | Hub-specific and intent-driven |
| Exchange tours | `src/pages/exchange/*TourSteps.js` | Exchange | Operators | Component state/route | Experience | Partially | Separate vocabulary and lifecycle |
| Growth tour | `src/pages/admin/growth/partnerGrowthTourSteps.js` | Admin growth | Admin/operators | Caller state | Experience | Partially | No shared requirement/document linkage |
| Guided lessons | `GuidedLessonExperience`, lesson utilities | Curriculum | Learners | Lesson/progress state | Domain experience | No, except presentation patterns | Curriculum completion is not legal acknowledgment |
| Tour flags | `sessionStorage`/`localStorage` matches in active pages | App owners | Mixed | Client storage | No institutional authority | No | Acceptable for revisit/dismissal only, unsafe for signed/required completion |

Tours are fragmented. A future DGAL tour adapter should reuse `TourProvider` and preserve existing domain tours, while adding a context contract and return-to-workflow target. Tour completion remains an experience state unless separately acknowledged through a canonical domain.

## 6. Contextual Guidance / Next-Action Inventory

| Existing resolver/pattern | Location | Scope | Reuse decision |
|---|---|---|---|
| Calendar recommendations | `calendar-intelligence-service.ts` | Calendar/deadline guidance | Keep domain-owned; expose as input |
| Learning Companion guidance | `companion-context-service.ts` | Calendar, journey, pathway, credentials | Extend input contract later; do not replace |
| Career next actions | `src/pages/career/sections/NextActions.jsx` | Career UI | Keep Career-owned; adapt presentation if needed |
| Orchestrator next actions | `src/pages/admin/orchestrator/components/OrchestratorNextActions.jsx` | Admin orchestration | Keep workflow-owned |
| Truth/report readiness recommendation | `src/shared/truth-spine/*` | Truth/report preparation | Keep authority separate |
| Studio workflow status | Studio project service and UI | Project/QA/review/release | Reuse state as requirement input |

There is no reusable cross-domain `user + role + organization + service + workflow + requirements -> next action` resolver. DGAL should introduce a thin deterministic composition contract, not another domain-specific resolver. Existing resolvers remain sources of facts.

## 7. Learning Companion Integration

The Companion API is `/companion/context/me`, protected by `enrollment.view`, and reads canonical Calendar, Journey, Career Pathway, and Credentials services once per request. It emits deterministic guidance with source IDs, action URLs, priority, dismissal, and partial-source state. It does not persist or create institutional truth.

Safe future integration:

`DGAL requirement/readiness facts -> Companion presentation context -> explanation/action link`

The Companion may explain what a requirement means, why it is present, what action is next, and where a guide lives. Mandatory requirements, signatures, retention, and legal status must come from DGAL/domain configuration, never generated model output.

## 8. Documentation Inventory

| Domain | Existing documentation | Location | Format | Audience | Versioned | Contextual | Printable | Reusable |
|---|---|---|---|---|---|---|---|---|
| Operations | Runbooks, recovery packet, escalation guidance | `docs/operator-runbook/*`, `docs/operations/*` | Markdown/JSON | Operators | File/version conventions | Low | Yes | Yes |
| Legal | Authority, ownership, artifact register, storage boundary | `docs/legal/legal-layer-v2/*` | Markdown | Owners/counsel/engineering | Phase/versioned | Low | Yes | As boundary reference |
| CivicSure | County pilot packets, provider requirements, assurance docs | `docs/government-program-assurance/*`, `docs/ui/CIVICSURE_*` | Markdown/JSON/UI | Operators/providers/public | Mixed | Low | Partial | Yes |
| Studio | Build packets and phase contracts | `docs/STUDIO_*`, `src/pages/studio/*` | Markdown/JSON/UI | Students/reviewers/operators | Phase/versioned | Workflow-bound | Partial | Domain-only |
| Curriculum | Lessons, curriculum import/extraction, role surfaces | `src/content/*`, curriculum pages | JSON/JSX/Markdown | Learners/instructors | Release/content versioned | Lesson-contextual | Partial | Domain-only |
| Agent/ARAG | Pilot report, work-order/policy docs, evidence packets | PR-5 report, ARAG docs, agent services | Markdown/JSON/runtime | Operators/approvers | Versioned in domain | Workflow-bound | Partial | Boundary reference |
| Onboarding | Lifecycle docs and acceptance packet | `docs/SHF_HYBRID_PHASE_4_*`, PR-7 packet | Markdown/runtime | Applicants/operators | Phase/versioned | Low | Yes | Candidate for DGAL guidance |

The repository is documentation-rich but lacks a canonical registry connecting a guidance item to audience, service, workflow stage, requirement rule, document version, and return action.

## 9. Printable Artifact Inventory

Existing printable or packet-like artifacts include PR-7 acceptance packets, county intake/request packets, operator runbooks, build packets, policy decision packets, report artifacts, certificates, and browser print views. Most are static Markdown, HTML, JSON, or domain-specific renderer output. No general packet instance links guides, forms, acknowledgments, signatures, evidence, and retention metadata.

## 10. Document Generation Inventory

| Generator | Location | Formats | Authority | DGAL decision |
|---|---|---|---|---|
| Reporting renderer | `apps/shs-api/src/domain/reporting/report-renderer.ts` | JSON/HTML/PDF | Reporting | Reuse renderer patterns, keep report owner |
| Report template registry | `apps/shs-api/src/domain/reporting/report-template-registry.ts` | Template IDs/versions/formats | Reporting | Reuse version/hash concepts, do not make it DGAL registry |
| Certificate renderer | `apps/shs-api/src/domain/credentials/service/certificate-renderer.ts` | Downloadable certificate/PDF path | Credentials | Keep credentials-owned |
| Curriculum document extraction | `curriculum-catalog/service/*document*` | PDF/DOCX/TXT/Markdown input | Curriculum ingestion | Keep ingestion-owned; not document output |
| Browser print | `src/styles/print-plan.css`, app print CSS, `window.print()` | Printed HTML / Save as PDF | Experience | Reuse as interim paper path |
| Export helpers | `src/utils/exports.js`, reporting export adapters | JSON/CSV/HTML-like exports | Domain/reporting | Reuse only for export, not agreements |

## 11. Template Inventory

There are report template definitions and many content/configuration templates, including agent/workflow templates and governance document templates. No canonical general-purpose document template registry was found with a stable document type, template ID, effective version, required fields, approval/publish state, or supersession semantics.

## 12. Versioning Inventory

Strong equivalents exist in reporting templates/artifacts, curriculum releases, Studio revisions, policies/work orders, evidence/source assets, and credentials. General document instances do not consistently retain template ID/version, renderer version, source version, content hash, effective date, superseded instance, signer, or Evidence reference. Those fields are DGAL-1 foundation requirements.

## 13. Agreement / Consent / Acknowledgment Inventory

Service Agreements are persisted and scoped through `service_agreements` and the service-agreements domain. Legal runtime authority and legal artifact registers exist. CivicSure packets contain acknowledgments/checklists as documents, and pilot documents identify future acknowledgment opportunities. No single cross-domain acknowledgment or agreement instance authority was found. Legal agreements remain Legal/service-owned; DGAL may orchestrate their presentation and record references.

## 14. Signature / E-Signature Inventory

Repository search found no active DocuSign, Adobe Acrobat Sign, Dropbox Sign/HelloSign, envelope, signer webhook, signing URL, or provider adapter implementation. Signature-like words occur in documentation, certificates, legal boundaries, and acceptance packets. Electronic signature is therefore MISSING, not partially activated. Paper/manual signature needs a first-class record later, but no provider should be integrated in DGAL-0.

## 15. Legal Layer Connection

Legal Layer V2 owns legal authority, artifact evidence register, legal-to-technical authority mapping, owner/counsel decisions, and secure legal record storage boundaries. DGAL should own guidance composition, document-instance orchestration, packet presentation, and adapter lifecycle metadata. Legal must continue to own legal meaning, approval authority, enforceability, official agreement content, and legal hold decisions.

## 16. Evidence Connection

Evidence/source assets already preserve organization scope, source, provenance, classification, status, and references. Future DGAL artifacts should link to canonical Evidence rather than creating `dgal_evidence`. A generated or signed artifact is not Evidence until the owning domain accepts or links it through canonical Evidence rules.

## 17. Truth Boundary

The safe flow is:

`document/agreement state -> canonical domain event -> Evidence -> verification/projection -> Truth where authorized`

DGAL must never write arbitrary Truth from a PDF, signature callback, acknowledgment click, or AI explanation.

## 18. Retention / Legal Hold

PR-2 provides classification, retention decisions, archival/deletion controls, legal-hold protection, scoped export, and recovery contracts. DGAL should supply artifact classification, owner, retention policy key, legal-hold reference, archival eligibility, and deletion state as metadata consumed by PR-2. DGAL must not create a second retention engine.

## 19. Access Control

Existing auth middleware, permission guards, organization/tenant scope, Evidence access, Legal restrictions, and service ownership are the reusable controls. A future DGAL API must resolve actor, org, service, resource, signer, and document visibility server-side. Client completion flags, document IDs, or signer links cannot grant access.

## 20. Public / Private Boundary

Existing reporting/publication controls distinguish report creation, approval, publication, classification, and public-safe projection. DGAL should default documents to restricted/private and require explicit canonical publication authority for any public artifact. A signed or approved document is not automatically public.

## 21. Smart Prefill Sources

| Source | Classification |
|---|---|
| Organization identity/contact/type | Safe automatic prefill after authorized scope |
| Service/entitlement/relationship | Safe as read-only context; confirmation for user-facing commitments |
| Onboarding case/requested services | Prefill with human confirmation before submission |
| User/role/provider/learner | Prefill only scoped identity fields; confirm signer/relationship |
| Evidence requirements/cases | Safe as requirement reference; protected content requires authorization |
| Studio/ARAG/Agent work order and policy | Read-only contextual prefill; no authority expansion |
| Dates/deadlines | Prefill from canonical workflow/calendar; confirm when commitment changes |
| Secrets, raw credentials, protected evidence payloads | Never expose or prefill |
| Legal conclusions, tax status, mandatory language | Never infer; use approved canonical content |

## 22. Required-Document Resolution

Required-document rules can be deterministic if driven by service, role, org, workflow stage, policy version, relationship, and canonical domain state. Existing entitlement, completion-policy, onboarding, Studio QA/review, ARAG policy, CivicSure evidence-request, and Agent work-order systems are inputs. No AI-generated requirement resolver is acceptable.

## 23. Completion Semantics

| State | Current classification |
|---|---|
| Tour viewed/completed, guide dismissed, local progress | Experience state; client persistence may be acceptable |
| Lesson/project progress | Domain-owned operational state |
| Service agreement status | Institutional/service state; persisted and scoped |
| Evidence received/verified | Evidence/domain state |
| Review approved, release approved, entitlement active | Canonical domain authority |
| Acknowledged, signed, manual signature verified | Cross-domain institutional state; missing general authority |

Viewing a guide or setting local completion must never imply acknowledgment, consent, signature, approval, or Evidence.

## 24. Local Storage / Client State Risk

Active client state includes tour intent, profile/demo preferences, lesson progress, companion UI state, and other app preferences. This is acceptable for presentation, dismissal, and resume behavior. It is unsafe for legal acknowledgment, signature, document issuance, entitlement activation, approval, Evidence, or retention. Historical backup/demo files contain additional localStorage use and should not be treated as active authority.

## 25. Accessibility

The Accessibility Layer and FE-2 contracts cover semantic structure, focus, keyboard, contrast, reduced motion, responsive layout, and text scaling. Future DGAL must reuse these primitives. Remaining gaps are accessible document templates, print CSS conventions, tagged/accessible PDF evidence, signature-flow accessibility, and plain-language review. These are DGAL implementation gaps, not reasons to duplicate the Accessibility Layer.

## 26. Print / Export

Browser print and report HTML/PDF are available. DOCX output is not a general output path; DOCX is primarily an ingestion input. Organization-branded packets, archive copies, QR/reference verification, and accessible PDF metadata are not unified.

## 27. Paper Workflow

The repository can print HTML/report/Markdown-like artifacts and accept uploaded source files, but it lacks a canonical:

`generate -> print -> manually sign -> upload -> verify -> Evidence`

workflow. A future manual-signature record must bind the uploaded artifact to document version/hash, signer identity/role, organization, verification actor, and Evidence/retention state.

## 28. Document State Recommendation

Recommend the following provider-neutral instance states, subject to DGAL-1 confirmation:

`DRAFT -> GENERATED -> REVIEW_REQUIRED -> APPROVED -> ISSUED -> SUPERSEDED / VOIDED / ARCHIVED`

State transitions must be owned by the document/owning domain service. Generation does not mean approval or issuance.

## 29. Signature State Recommendation

Recommend:

`DRAFT -> SENT -> VIEWED -> SIGNED`

with terminal/exception states `DECLINED`, `VOIDED`, and `EXPIRED`. Manual signatures should use a parallel `MANUAL_PENDING -> UPLOADED -> VERIFIED` path, never pretending to be provider e-signature state.

## 30. Packet Model

No canonical cross-domain packet model exists. Recommend a packet definition/instance composition that references, rather than owns, guides, document instances, requirements, acknowledgments, signatures, evidence links, and retention metadata. Existing report/evidence/build packets remain domain-owned and should be adapted through references, not merged destructively.

## 31. CivicSure Opportunities

Reuse PR-7 provider self-service, `gpa_evidence_requests`, findings, corrective actions, source assets, provenance, and operator/public boundaries. A future CivicSure Provider Verification Packet can compose orientation, evidence checklist, provider response/attestation, correction guidance, and status links. Provider submission remains Evidence input; provider cannot verify, publish, or trigger payment.

## 32. BOS Opportunities

Reuse BOS/Hub project, intake, operational packet, reporting, and support/runbook surfaces found in `src/pages/hub`, `src/pages/admin/ops`, and `docs/operator-runbook`. A future implementation packet can compose discovery, intake, responsibilities, implementation checklist, and handoff without creating a second BOS project model.

## 33. Studio Opportunities

Reuse immutable workspace revisions, QA runs, review submissions/decisions, build artifacts, release state, and existing Studio build packets. DGAL should add contextual guidance and document/packet references around these states, not duplicate Studio review or release authority.

## 34. Agent Fabric Opportunities

Reuse PR-5 controlled-pilot configuration, work orders, policy/version binding, tool/resource limits, approvals, revocation, evidence, and WF-040. A future Agent Fabric Pilot Packet should present those records and link to emergency-stop guidance; it must not create a second approval or execution authority.

## 35. ARAG-1 Opportunities

Reuse ARAG work order, release policy, gate, approval, evidence packet, release record, provider-neutral boundaries, and audit events. DGAL can compose a release-assurance checklist and explanation layer only.

## 36. SHF Program Opportunities

Reuse curriculum, enrollment, participation, evidence, credentials, reporting, parent/guardian boundaries, and existing program content. Future participation packets should present operational expectations and acknowledgments only where canonical policy requires them.

## 37. Organization Onboarding Opportunities

Reuse onboarding case lifecycle, relationship requests, requested/approved services, entitlements, role setup, activation, suspension, and exit. A future activation packet should be a projection of onboarding state, not a second onboarding application.

## 38. Curriculum Opportunities

Reuse role-specific Curriculum/Student/Instructor/Parent/Admin routes, lesson content, guided lesson flow, completion policy, accessibility primitives, and credentials. DGAL should explain operational steps and required forms, not duplicate lesson content or learner completion authority.

## 39. Career Opportunities

Reuse Career Pathway, opportunities/events, credential context, mentor/employer surfaces, and Companion guidance. Future pathway packets should reference canonical pathway/credential records and avoid inventing eligibility or employment claims.

## 40. Tour / Orientation Integration Architecture

Recommended conceptual connection:

`Tour step -> guidance item -> document/requirement reference -> workflow action -> exact return target`

The Tour layer owns presentation and navigation. DGAL owns contextual references/rules. Domain services own completion and authority. A return target must be an authorized route/resource, not an arbitrary client URL.

## 41. Learning Companion Integration Architecture

The Companion should consume a bounded DGAL read projection containing explanation text, requirement reason, safe action URL, document/packet reference, and source IDs. It should answer “what/why/next/where” from deterministic DGAL/domain facts, while never deciding that a document is legally required or complete.

## 42. Premium Contextual Experience

The premium experience should show a compact “Your next steps” surface inside the active service, with status groups such as `Required now`, `Waiting on you`, `Waiting on reviewer`, `Reference`, and `Completed`. Every item should have a source, owner, current status, action, return target, and explanation. No generic file dump and no AI-only checklist.

## 43. Premium Document Center

A contextual document center is recommended, but it should be a filtered workflow view rather than a giant repository. It should show required/current documents, pending signatures or acknowledgments, reviewer-held items, signed/completed history, printable packets, expiring items, and archived items according to canonical scope and retention.

## 44. Premium User Experience Blueprint

1. User enters a canonical service.
2. Server resolves role, organization, entitlement, workflow stage, permissions, and outstanding requirements.
3. Tour appears only when relevant and remains dismissible/revisitable.
4. “Your next steps” explains the source and action.
5. User opens a concise contextual guide.
6. A required document or packet is generated from approved template/version data.
7. Safe canonical fields are prefilled; commitments and signer identity require confirmation.
8. User reviews, prints/manual-signs, or uses a future provider-neutral signing adapter.
9. Completion/acknowledgment/signature state is persisted server-side.
10. Evidence links are created only through canonical Evidence/domain rules.
11. User returns to the exact workflow state.
12. Retention and document history remain visible according to access policy.

## 45. Premium Admin Experience Blueprint

`Registry -> Draft template -> Version -> Preview -> Approve -> Publish -> Assign to service/role/workflow -> Monitor -> Supersede -> Archive`

Admin actions must be permissioned, versioned, auditable, scoped, and separate from Legal approval, Evidence acceptance, Truth verification, and service workflow decisions.

## 46. Template Authoring Recommendation

Use a hybrid model: structured schema/merge fields for authoritative data, constrained rich text/HTML for guidance, and approved renderer output for HTML/print/PDF. Do not make DOCX the runtime authority. Legal/signature-bearing templates require controlled version approval; tenant variants inherit from canonical definitions and cannot silently replace them.

## 47. Rendering Architecture

Reuse the reporting pattern:

`canonical structured instance -> approved template/version -> HTML -> print/PDF`

Optionally add DOCX export later through a bounded renderer. Preserve template ID/version, renderer version, generated timestamp, content hash, source references, classification, and owner. Do not make PDF bytes the only source of truth.

## 48. E-Signature Adapter Architecture

Future interface recommendation:

`createRequest`, `addSigner`, `createSigningSession`, `getStatus`, `voidRequest`, `processVerifiedWebhook`, `retrieveSignedArtifactReference`.

DGAL remains provider-neutral. DocuSign, Adobe Acrobat Sign, or another provider can be added as adapters without changing document authority if provider IDs, raw payload references, webhook security, and status normalization remain adapter metadata.

## 49. E-Signature Security

Require signer identity and authorization, exact document/template version binding, content hash/reference, org scope, signer role, expiry/voiding, verified provider callback, replay protection, sandbox/production separation, and Evidence/retention linkage. A signing URL is not proof of signature.

## 50. Audit Trail

Reuse canonical operational/audit events. Future event types should cover template draft/publish/supersede, document generate/approve/issue/view, packet generate, send, acknowledge, signature request/signed/declined/voided/expired, manual signature upload/verification, Evidence link, archive, and retention decision. Do not create a DGAL-only audit ledger.

## 51. Document Integrity / Hashing

Existing report/template hash and Evidence/source provenance primitives are suitable patterns. Future instances should retain content hash, template/version, renderer version, generated time, source/version references, provider reference where applicable, and signed-artifact reference. No blockchain/token dependency is warranted.

## 52. Storage

Reuse canonical source asset/file/evidence storage and report artifact storage. DGAL should store metadata and references, not create a parallel object store. Protected access must remain server-authorized and classification-aware.

## 53. Search / Discovery

Use workflow context first, then service navigation, contextual help, Companion, and global search. Search should discover approved guidance and document references but must not be the only way required work is surfaced.

## 54. Notifications / Reminders

Notification and outbox patterns exist. Future DGAL can consume canonical deadlines and workflow events for document-ready, signature-requested, declined, expiring, corrective-paperwork, and packet-complete notifications. Calendar/deadline ownership remains with existing domain services.

## 55. Plain Language / Language Support

Current evidence supports plain-language copy and accessible UI, but no general translation/document variant registry was found. Future variants must preserve source/template version and avoid unsupported claims of legal equivalence. Legal content changes require appropriate owner approval.

## 56. Branding

Reuse existing SHF/SHS/CivicSure/report theme primitives. Brand metadata should be explicit and scoped: SHF, SHS, CivicSure, service, and approved organization co-brand. Branding must not change legal owner, authority, or classification.

## 57. Multi-Tenant Template Overrides

Recommend inheritance:

`global canonical -> service variant -> approved organization variant`

Variants must retain parent template/version, approval status, effective dates, and supersession. Tenants must not edit canonical legal requirements directly.

## 58. Canonical Ownership Model

See the required concept table below. The core rule is distributed ownership: DGAL composes and indexes; service domains own workflow state; Legal owns legal meaning; Evidence owns evidence; Retention owns lifecycle; Tour and Companion own presentation.

## 59. Domain Boundaries

DGAL should own registry metadata, guidance collections, document requirements, document/packet orchestration metadata, contextual projections, and adapter lifecycle references. It should keep Legal, Evidence, Truth, Retention, Reporting, Service Catalog, Onboarding, Studio, ARAG, CivicSure, Agent Fabric, Curriculum, Career, and Accessibility authorities separate.

## 60. API Boundary Recommendation

Conceptual future surfaces only:

`/documentation/templates`, `/documentation/documents`, `/documentation/packets`, `/documentation/requirements`, `/documentation/guidance`, `/documentation/acknowledgments`, `/documentation/signatures`.

These are recommendations, not implemented routes. Each must enforce existing auth, org scope, service entitlement, resource ownership, and domain permissions.

## 61. Frontend Boundary Recommendation

Conceptual future surfaces: contextual guidance drawer, required-next-steps panel, filtered document center, packet view, acknowledgment/signature step, template registry/admin view, Tour integration, and Companion handoff. No page or route was created in DGAL-0.

## 62. Duplication Risk

The largest risks are a second next-action resolver, a generic file repository, a second Evidence store, a parallel Legal agreement database, client-side acknowledgment authority, a provider-specific signing model, duplicate onboarding/entitlement state, and AI-generated mandatory requirements.

## 63. Reuse / Merge / Deprecate Matrix

| Existing Component | Location | Current Owner | Decision | Why | DGAL Relationship |
|---|---|---|---|---|---|
| TourProvider/useTour | `src/system/tour/*` | Experience | EXTEND | Shared presentation primitive | Add context and return-target adapters |
| Hub/Exchange tours | `src/pages/*Tour*` | Domain experiences | KEEP SEPARATE | Domain-specific semantics | Register with DGAL context later |
| Companion Context | `apps/shs-api/src/domain/companion/*` | Companion | EXTEND | Safe explanation surface | Consume bounded DGAL projection |
| Career/Studio/Orchestrator next actions | domain UI/services | Domain owners | KEEP SEPARATE | Each owns local facts | Feed composition contract |
| Onboarding lifecycle | organization-onboarding domain | Onboarding | KEEP SEPARATE | Canonical activation authority | Project into packets/guidance |
| Service agreements | service-agreements domain | Service/Legal boundary | EXTEND | Already persisted/scoped | Reference from packets; do not merge |
| Legal artifacts/authority | `docs/legal`, legal service | Legal | KEEP SEPARATE | Legal meaning and storage authority | DGAL presentation/reference only |
| Evidence/source assets | migration 058 and Evidence services | Evidence | KEEP SEPARATE | Canonical provenance/evidence authority | Link artifacts |
| Report templates/renderers | reporting domain | Reporting | EXTEND carefully | Strong version/render patterns | Reuse renderer concepts, not owner |
| Certificate service | credentials domain | Credentials | KEEP SEPARATE | Credential issuance authority | Link from guidance/history |
| Print CSS/browser print | `src/styles/*`, app views | Experience | REUSE | Existing low-risk paper path | Shared rendering baseline |
| LocalStorage progress | active app components | Experience/domain | DEPRECATE for institutional states | Not authoritative or scoped | Keep for UX-only progress |
| Mock/demo persistence | `src/mocks`, legacy/bak files | Demo/legacy | DEPRECATE from canonical flows | Can misrepresent completion | Exclude from DGAL authority |

## 64. Proposed Canonical DGAL Architecture

`Experience/Tour`
`  -> Contextual Guidance Composition`
`  -> Requirement Rules and Documentation Registry`
`  -> Document/Packet Instance Orchestration`
`  -> Acknowledgment/Signature Adapters`
`  -> Canonical domain events and Evidence links`
`  -> PR-2 Retention/Legal Hold and existing storage`

The arrows are references and controlled transitions, not a new universal authority. Domain services remain authoritative for their own lifecycle; DGAL resolves what to show and what references are needed.

## 65. Service-by-Service Blueprint

| Service | Guidance | Tour | Required Documents | Printable Packet | Acknowledgment | E-Signature Potential | Evidence | Retention | Premium UX Opportunity |
|---|---|---|---|---|---|---|---|---|---|
| CivicSure | Provider/operator requirements and next response | Provider orientation | Evidence request, response, correction guide | Provider Verification Packet | Provider attestation if policy requires | Future provider-neutral | Canonical source assets/responses | PR-2 | Status-first provider workspace |
| BOS | Intake, responsibilities, implementation | Hub/business tour | Discovery/implementation checklist | BOS handoff packet | Service acceptance | Future | Project/report evidence | PR-2 | Guided launch checklist |
| Studio | Brief, QA, review, release | Studio orientation | Brief, QA/review checklist | Release handoff packet | Review/release authority remains Studio | Future | QA/review/release evidence | PR-2 | Return-to-revision workflow |
| Agent Fabric | Pilot scope, tools, limits, stop | Admin tour | Work order/policy/pilot packet | Controlled Pilot Packet | Operator approval/ack | Future | Agent events/evidence | PR-2 | Safe state and approval queue |
| ARAG-1 | Release policy/gate | Admin orientation | Work order/release checklist | Release Assurance Packet | Approval remains ARAG | Future | Evidence packet/release record | PR-2 | Explain gate blockers |
| SHF Programs | Role/service expectations | Role-specific orientation | Participation/consent where canonical | Program participation packet | Policy-specific only | Future | Participation/evidence | PR-2 | Family/learner next steps |
| Organization Onboarding | Review, relationship, activation, entitlement | Onboarding tour | Application/activation checklist | Organization activation packet | Service agreement/ack if required | Future | Onboarding/audit events | PR-2 | One activation journey |
| Curriculum | Role-specific operational guidance | Guided lesson remains Curriculum-owned | Guides/checklists, not duplicated lessons | Instructor/student packets | Existing domain policy only | Future | Completion/evidence/credentials | PR-2 | Companion-linked next step |
| Career | Pathway/readiness guidance | Career orientation | Pathway/checklists | Career readiness packet | Employer/program-specific | Future | Pathway/credential references | PR-2 | Contextual pathway actions |

## 66. DGAL Gap Register

| DGAL Gap ID | Capability | Gap | Existing Evidence | Severity | Recommended Owner | Suggested Phase | Closure Evidence |
|---|---|---|---|---|---|---|---|
| DGAL-GAP-001 | Canonical documentation registry | No cross-domain registry for guidance, templates, document types, versions, and contextual assignment | DGAL-1 bounded documentation registry and ownership contract | P1 | DGAL | DGAL-1 | **RESOLVED** — migration 132, registry repository/model, ownership report, stable/version tests |
| DGAL-GAP-002 | Requirement rules | No deterministic cross-domain document/acknowledgment requirement resolver | DGAL-1 deterministic server-scoped resolver with explainable output | P1 | DGAL + domain owners | DGAL-1 | **RESOLVED** — requirement rule model, unknown/fail-closed, scope, deduplication, conflict tests |
| DGAL-GAP-003 | Contextual next-action composition | Existing resolvers are domain-fragmented | Companion, Career, Studio, Orchestrator | P1 | DGAL + Experience | DGAL-2 | **RESOLVED** — `ContextualGuidanceService` composes DGAL requirements and domain facts with deterministic ordering, source references, deduplication, conflict handling, role/org/service/workflow scope, and honest unknown/unavailable states; CivicSure provider slice and focused tests pass |
| DGAL-GAP-004 | Document/packet instances | No general instance/packet state and reference model | Reports, certificates, build packets | P1 | DGAL | DGAL-3 | **RESOLVED** — migrations 133-134 add scoped document/packet instances, deterministic manifests, exact template-version binding, partial state, idempotent generation, and reference-only Reporting artifact packet items preserving snapshot/version/hash identity |
| DGAL-GAP-005 | Acknowledgment/agreement composition | Service agreements and Legal artifacts are not cross-domain composable | Service Agreements, Legal V2 | P1 | Service/Legal + DGAL | DGAL-4 | **RESOLVED** — migration 135 adds scoped exact-version acknowledgments, canonical Service Agreement version resolution, actor/capacity binding, idempotency, and explicit Legal/Service authority boundaries |
| DGAL-GAP-006 | Signature model/adapter | No signature persistence or provider-neutral adapter | No active provider found | P1 | DGAL + Legal | DGAL-5 | **RESOLVED** — migration 136 adds scoped signature requests, signer capacity, normalized provider-neutral states, provider event idempotency, authenticated test-adapter callbacks, exact document/version/hash binding, signed-artifact references, and retention/Evidence boundaries; production provider activation remains external |
| DGAL-GAP-007 | Evidence/document linkage | General generated/signed artifact linkage is inconsistent | Evidence/source assets, report artifacts | P1 | Evidence + DGAL | DGAL-3 | **RESOLVED** — scoped artifact metadata and explicit authorized `dgal_evidence_links` preserve hash/version/scope/provenance without auto-promoting generated documents; Reporting artifacts are referenced by scoped snapshot/rendered-file metadata and remain Reporting-owned |
| DGAL-GAP-008 | Document retention metadata | PR-2 lifecycle exists, but general document metadata is not unified | PR-2 governance/recovery, Legal storage boundary | P1 | Retention + DGAL | DGAL-3 | **RESOLVED** — instance/packet classification, retention policy/start, hold reference, disposition, archive/supersession metadata participate in migration/restore |
| DGAL-GAP-009 | Tour-to-guidance return path | Tours lack shared workflow/document context and exact return contract | TourProvider, Hub tour intent | P2 | Experience + DGAL | DGAL-2 | **RESOLVED** — bounded `createTourContext`/`createTourReturnTarget`, DGAL tour request bridge, internal-route validation, canonical re-entry, and focused return-target tests pass; tour completion remains experience-only |
| DGAL-GAP-010 | Printable/paper parity | Print exists, but no paper-sign/upload/verify workflow | Print CSS, source upload | P2 | DGAL + Evidence | DGAL-5 | **RESOLVED at accepted DGAL scope** — DGAL-4 manual paper flow and DGAL-5 electronic-signature contract preserve exact document binding, separate artifacts, verification/provider state, secure retrieval, and canonical Evidence/retention boundaries |
| DGAL-GAP-011 | Admin template publishing | No general template draft/approve/publish/supersede registry UX | Report templates and governance templates | P2 | DGAL + Legal/service owners | DGAL-6 | **RESOLVED** — guarded registry overview/version routes, isolated v1→v2 supersession acceptance, authenticated admin route load, permission denial, confirmation, and stale-version protection are accepted |
| DGAL-GAP-012 | Document center | No contextual required/history view | Domain pages and exports | P2 | Experience + DGAL | DGAL-6 | **RESOLVED** — scoped aggregate, service/status filtering, partial/unavailable states, authorized item detail route, cross-org projection acceptance, authenticated browser load, and 375px responsive check are accepted |
| DGAL-GAP-013 | Accessible document output | Tagged/accessibility metadata for generated PDF/packets is not proven | FE Accessibility Layer, report renderer | P2 | DGAL + Accessibility | DGAL-3 | **RESOLVED — semantic accessible HTML and print output are generated/tested; PDF/UA tagging is explicitly not claimed and remains future tooling scope** |
| DGAL-GAP-014 | Notifications/reminders | Existing outbox/deadlines are not unified for document states | Outbox, Calendar, runbooks | P2 | DGAL + Notifications | DGAL-6 | **RESOLVED** — isolated migration-137 database acceptance proves canonical DGAL signature notification persistence, duplicate-event idempotency, fixed deep link, and protected-content exclusion; real delivery provider remains external |
| DGAL-GAP-015 | Plain-language/translation variants | No general versioned language-variant model | Plain-language UI patterns | P3 | DGAL + content owners | DGAL-6 | **RESOLVED at repository scope** — `dgal_content_variants` preserves source/version/language/owner/status/approval lineage; controlled legal text is not rewritten or silently replaced |

## 67. Security / Privacy Risks

No new P0 was found in this audit. Material future risks are: client-side completion being mistaken for institutional acknowledgment; cross-tenant document IDs; leaked protected evidence through prefill or search; unsigned or stale template versions; unverified signature webhooks; public publication by default; raw legal/provider content in logs; and document retention/legal-hold bypass. DGAL-1 must make unknown requirement/access state fail closed.

## 68. Authority Risks

The highest authority risk is a “document center” becoming a second source of truth. DGAL must not approve Legal terms, verify Evidence, write Truth, activate entitlements, approve releases, decide CivicSure findings, or approve Agent Fabric actions. It may only reference and explain canonical states.

## 69. UX Risks

Fragmented tours, duplicate next-action lists, dead-end document pages, unclear waiting ownership, local-only progress, excessive form prefilling, inaccessible PDFs, and mixing reference guides with required documents are the main UX risks. A contextual filtered center and return-to-workflow contract address these without a generic help-center redesign.

## 70. External Dependencies

Future DGAL activation may require legal approval of templates, organizational policy owners, e-signature provider accounts, production object storage, notification providers, accessible PDF tooling, translation/content owners, and real organization UAT. These are not repository-local DGAL-0 defects and must not be simulated.

## 71. Suggested Implementation Roadmap

Finite roadmap: six implementation phases after this audit.

1. DGAL-1 - Canonical Registry, Requirement Rules & Ownership Foundation.
2. DGAL-2 - Contextual Guidance, Tour Integration & Companion Projection.
3. DGAL-3 - Document/Packet Instances, Rendering, Evidence Links & Retention Metadata.
4. DGAL-4 - Agreements, Acknowledgments & Manual Paper Workflow.
5. DGAL-5 - Provider-Neutral E-Signature Adapter and Verified Artifact Flow.
6. DGAL-6 - Premium Document Center, Admin Publishing, Notifications & Service Acceptance.

No phase should create a parallel authority. Each phase should close a bounded contract and retain an explicit defer/blocked decision where external providers or legal owners are required.

## 72. Recommended Phase 1

**DGAL-1 - Canonical Registry, Requirement Rules & Ownership Foundation.**

Begin with a design and implementation contract for guidance items/collections, document types/templates/version metadata, requirement rules, packet references, ownership, scope, classification, status, and source references. Reuse existing auth, entitlements, Legal, Evidence, Retention, and audit boundaries. Do not start with a signature provider or a large UI.

## 73. Files Reviewed

- `docs/architecture/DGAL_REAL_PILOT_INPUTS.md`
- `docs/architecture/PR-7_REAL_ORGANIZATION_PILOT_FINAL_PRODUCTION_ACCEPTANCE_REPORT.md`
- `docs/operations/PR-7_REAL_ORGANIZATION_PILOT_ACCEPTANCE_PACKET.md`
- `docs/architecture/PR-2_DATA_LINEAGE_PRIVACY_RETENTION_RECOVERY_REPORT.md`
- `docs/architecture/PR-5_AGENT_FABRIC_CONTROLLED_PRODUCTION_PILOT_REPORT.md`
- `docs/architecture/PR-6_PERFORMANCE_OBSERVABILITY_DISASTER_RECOVERY_REPORT.md`
- Tour, Companion, Legal, service-agreement, reporting, credential, Evidence, onboarding, Studio, CivicSure, ARAG, Agent Fabric, and operations source/docs discovered by repository search.

## 74. Files Created

- `docs/architecture/DGAL-0_SYSTEM_WIDE_DOCUMENTATION_GUIDANCE_AGREEMENT_LAYER_AUDIT.md`

## 75. Files Modified

None. DGAL-0 is audit-only.

## 76. Owner Work Preservation

Prior dirty tracked files, untracked readiness artifacts, generated/runtime artifacts, local databases, documents, and evidence were preserved. No reset, clean, stash, migration, route, provider, production code, commit, or push was performed.

## 77. Validation

Required checks executed against the unchanged runtime source surface:

| Command | Result |
|---|---|
| `npm run manifests:validate` | PASS |
| `npm run ui:validate` | PASS |
| `npm run build` | PASS; existing Vite chunk-size warnings only |
| `npm run check:layers` | PASS |
| `npm run check:truth` | PASS |
| `npm run check:oracle` | PASS |
| `git diff --check` | PASS |
| `npx tsx --test apps/shs-api/tests/companion-context.security.test.ts` | HARNESS INVOCATION / RUNTIME AVAILABILITY BLOCK; the suite attempted HTTP acceptance against an API endpoint that was not running, so all 8 cases failed at the fetch hook before exercising assertions. Not a DGAL product finding. |

Focused source inspection covered tours, Companion, onboarding, entitlements, service agreements, Legal, Evidence/source assets, reporting/certificates, Studio, CivicSure provider self-service, Agent Fabric, ARAG, print/export, local client state, and operations documents. No browser or external-provider acceptance was required for this audit.

## 78. Final Verdict

DGAL-0 is COMPLETE. Existing capabilities are classified as reuse, extension, separation, or deprecation. The recommended architecture is a composition layer over existing domain authorities, with deterministic requirements, versioned document metadata, canonical Evidence/Retention links, and provider-neutral future signatures. The major repository gaps are now stable DGAL implementation work rather than unclassified architecture uncertainty.

## 79. Exact Next Step

**DGAL-1 - Canonical Registry, Requirement Rules & Ownership Foundation.**

Do not begin DGAL-1 in this audit response.

## Required Final Capability Table

| Capability | Exists? | Current Location | Current Owner | Quality | Reuse Decision | Missing Pieces | Recommended Canonical Owner |
|---|---|---|---|---|---|---|---|
| System-wide documentation layer | Partial | `docs/*`, domain docs | Distributed | Rich but unindexed | EXTEND | Registry/context/version | DGAL composition |
| System-wide guidance layer | Partial | Companion, domain resolvers | Distributed | Deterministic in slices | EXTEND | Cross-domain resolver | DGAL + domain sources |
| Tour/orientation | Yes, fragmented | `src/system/tour`, app tours | Experience/domains | Reusable UI, weak context | EXTEND | Org/service/workflow binding | Experience + DGAL |
| Learning Companion | Yes | Companion API/UI | Companion | Strong read-only boundary | EXTEND | DGAL projection | Companion presentation |
| Document registry | No | Report registry only | Reporting | Domain-specific | EXTEND | General registry | DGAL |
| Template versioning | Partial | Reporting/curriculum/policies | Domain owners | Strong in slices | EXTEND | General instances/supersession | DGAL + owner |
| Document generation | Partial | Reporting/certificates/print | Reporting/Credentials/Experience | Good domain output | REUSE/EXTEND | General renderer contract | DGAL orchestration |
| Packet model | Partial/domain-specific | Reports/build/evidence packets | Domain owners | Good local patterns | EXTEND | Cross-domain references | DGAL composition |
| Agreement persistence | Partial | Service Agreements/Legal | Service/Legal | Scoped but fragmented | KEEP SEPARATE/EXTEND | Cross-domain references | Legal/service owners |
| Acknowledgment persistence | No general authority | Packets/docs | Distributed | Not proven | BUILD later | Durable state | DGAL + owning domain |
| Signature persistence | No | None active | None | Missing | BUILD later | Manual/provider states | DGAL adapter + Legal |
| Evidence linkage | Yes, domain-scoped | Evidence/source assets | Evidence | Strong | REUSE | General artifact links | Evidence |
| Retention/legal hold | Yes, policy/runtime | PR-2 lifecycle/legal docs | Retention/Legal | Strong boundary | REUSE | Artifact metadata | Retention + Legal |
| Accessible print/PDF | Partial | Print CSS/report renderer | Experience/Reporting | Mixed | EXTEND | Tagged PDF/packet QA | DGAL + Accessibility |

## Required Service Blueprint Table

See Section 65. The primary near-term opportunity is CivicSure provider packets and organization activation packets because canonical requirements, evidence, and workflow state already exist.

## Required Concept Ownership Table

| Concept | Existing Equivalent | Proposed Owner | Keep Separate? | Reason |
|---|---|---|---|---|
| Guidance Item | Companion guidance/domain next actions | DGAL composition | Yes | Source domains own facts |
| Guidance Collection | Tour/lesson/packet groupings | DGAL | Yes | Cross-domain presentation metadata |
| Tour Step | `TourProvider`/domain tours | Experience | Yes | UI navigation state |
| Orientation Completion | Local tour/lesson progress | Experience or domain | Yes | Must not imply acknowledgment |
| Document Template | Report/certificate templates | DGAL registry; domain-owned content | Yes | Preserve domain authority |
| Template Version | Report/policy/curriculum version | Template owner + DGAL metadata | Yes | Effective/supersession traceability |
| Document Instance | Report artifact/certificate/source document | Owning domain with DGAL index | Yes | Meaning stays domain-owned |
| Packet Definition | Build/report/evidence packet | DGAL composition | Yes | References components without owning them |
| Packet Instance | Acceptance/build/report packets | DGAL composition | Yes | Scope/status/history |
| Document Requirement | Evidence request/entitlement/policy | DGAL rule references; source domain authority | Yes | Deterministic and explainable |
| Acknowledgment | Service agreement/acceptance checklist | Owning service/Legal + DGAL reference | Yes | Institutional meaning varies |
| Agreement | `service_agreements`, Legal artifacts | Service/Legal | Yes | Do not centralize legal meaning |
| Signature Request | None | DGAL adapter boundary | Yes | Provider-neutral lifecycle |
| Signature Record | None | DGAL + Legal/owner | Yes | Identity and audit required |
| Manual Signature Record | None | DGAL + Evidence | Yes | Paper/digital parity |
| Signed Artifact | Report/source/upload artifacts | Owning domain + Evidence | Yes | Preserve exact bytes/reference |
| Document Evidence Link | Source/evidence references | Evidence | Yes | Canonical evidence authority |
| Retention Classification | PR-2 governance | Retention | Yes | Existing lifecycle authority |
| Document Audit Event | Audit/outbox events | Audit/operational event authority | Yes | Do not create second ledger |

## Required Duplication Table

| Existing System | Potential DGAL Overlap | Risk | Decision | Boundary |
|---|---|---|---|---|
| Organization onboarding | Activation packet | Duplicate activation authority | REUSE | DGAL projects onboarding state |
| Service Catalog/entitlements | Required service docs | Unauthorized access grant | KEEP SEPARATE | Entitlement remains canonical |
| Companion | Guidance resolver | Second guidance engine | EXTEND | Companion presents deterministic projection |
| Studio next actions | “Your next steps” | Conflicting workflow state | KEEP SEPARATE | Studio supplies source state |
| Legal artifacts | Agreements/templates | Legal authority duplication | KEEP SEPARATE | Legal owns meaning/approval |
| Evidence | Signed/generated files | Duplicate evidence store | REUSE | Link canonical Evidence |
| Reporting | Document/PDF renderer | Template authority collision | EXTEND | Reuse rendering patterns, keep reports-owned |
| Retention | Archive/delete metadata | Second retention engine | REUSE | PR-2 owns lifecycle |
| Agent work orders | Pilot packet | Approval bypass | KEEP SEPARATE | DGAL presentation only |
| ARAG work orders | Release packet | Release bypass | KEEP SEPARATE | ARAG owns gate/approval |
| CivicSure requests | Provider packet | Provider self-verification | REUSE | CivicSure owns assurance |
| Print/export | Packet output | Unversioned artifacts | EXTEND | Bind template/version/hash |
| Certificates/diplomas | Credential packet | Credential duplication | KEEP SEPARATE | Credentials owns issuance |
