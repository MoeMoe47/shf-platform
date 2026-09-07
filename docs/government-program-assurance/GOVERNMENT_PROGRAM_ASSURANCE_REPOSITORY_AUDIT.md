# Government Program Assurance Repository Audit

Audit date: 2026-09-06
Repository: `/Users/mikeslate/Projects/shrv1`
Scope: read-only repository audit; the only created artifact is this document.

## 1. Executive Result

**FOUNDATIONAL**

The repository contains substantial reusable foundations for a Government Program Assurance platform: organization-scoped identity, organization relationships, program stewardship, funding/grant and service-agreement records, operational learning/workforce records, source ingestion, evidence projection, Truth Spine-adjacent reporting controls, public disclosure governance, and governed AI authority. These are real code and migration-backed capabilities, not only documentation.

The repository does not yet establish a trustworthy government-assurance product boundary. The aggregation layer is primarily fixture/placeholder code, Oracle truth storage is process-local, the executable Truth Spine is curriculum-specific, and there is no first-class Claim authority, general Metric Registry, Verification Method Registry, temporal control/requirement registry, provider assurance, monitoring/finding/corrective-action workflow, audit workspace, sampling engine, investigation workspace, recovery/recoupment domain, or source-system authority/use-policy registry. A narrow county pilot is therefore not ready for assurance decisions without a foundation build and explicit ownership decisions.

This result means: proceed to gap-driven architecture and foundation planning, but do not represent existing reporting, Oracle, UI, or fixture behavior as government-grade verification.

## 2. Repository Baseline

### Initial state

- Repository: `/Users/mikeslate/Projects/shrv1`
- Branch: `studio-v1-plus-development`
- HEAD: `f02eff81c193f63fcb2878fc949689f8a5b75627`
- Initial dirty count: 46
- Initial status hash: `9ac931180f111b6dacf08ce4cb63572a56571d1f62e07e1ed9d1fd4da7923d59`
- Initial status included owner-controlled SHF frontend changes, OAS pages/assets, UI harness changes, SHF documentation/legal files, temporary scripts, `AGENTS.md`, and `audit-output/`.

### Final state

- The only new file is `docs/government-program-assurance/GOVERNMENT_PROGRAM_ASSURANCE_REPOSITORY_AUDIT.md`.
- No source, migration, test, configuration, frontend, or owner file was modified.
- Existing owner work remains present and unmodified.
- Final status must be compared with the initial status after this document is written; the audit does not normalize or clean the worktree.

## 3. Architecture Summary

The repository is a multi-layer SHF/SHS application rather than one coherent government assurance product:

1. `apps/shs-api/migrations/001_identity_base.sql:3-70` and the identity domain provide organizations, users, teams, roles, permissions, and memberships.
2. `apps/shs-api/migrations/032_organization_relationships_program_stewardship.sql:7-105` extends the existing `programs` table with owner/operator/accountable organization references and constrains four relationship types.
3. The operational domain contains programs, curriculum, cohorts, enrollments, assignments, projects, workforce outcomes, source assets, reporting, evidence projection, and public disclosure controls.
4. `apps/shs-api/src/aggregation/` presents a desired provider-neutral ingestion, lineage, mapping, quality, reconciliation, verification, and metric surface, but many repositories/services/controllers are literal placeholders and the active engine uses hard-coded test fixtures.
5. `apps/shs-api/src/oracle/` composes aggregation output into a TruthPackage, but `truth.repo.ts:3-11` stores it in an in-memory process-local object.
6. `apps/shs-api/src/domain/verified-evidence/` is a real persistence-backed projection for selected curriculum/workforce source events into `prepare_prove_evidence` and `curriculum_truth_facts`, with organization/learner scoping and supersession.
7. Reporting has real database-backed artifact, draft, distribution, disclosure, publication, and public snapshot authorities, but its canonical metric registrations are narrow and code-defined rather than a government Metric Registry.
8. Phase 1-7 governed AI domains are present and mounted in `apps/shs-api/src/api/router.ts:63-69`, but they govern AI access and simulation/release workflows; they do not supply the missing government assurance authorities.
9. The frontend contains real API-backed admin/reporting/truth surfaces alongside many localStorage, mock, fallback, seed, and demo surfaces. UI presence is therefore not proof of institutional data authority.

## 4. Canonical Ownership Map

| Capability | Canonical Owner | Persistence | API | UI | Tests | Status |
|---|---|---|---|---|---|---|
| Organization / identity | Identity domain | `organizations`, `users`, `memberships`, roles | Identity/auth routes | Admin identity surfaces | Auth and isolation tests | REUSABLE |
| Organization relationships | Organization Relationships | `organization_relationships` | Relationship routes | Admin relationship surfaces | Relationship tests | REUSABLE |
| Program stewardship | Programs | `programs` plus stewardship columns | Program routes | Curriculum/program UI | Program tests | PARTIAL |
| Funding/grants | Funding Grants / Grant Binder / Exchange commitments | `funding_grants`, allocations, binders, commitments | Funding and grant routes | Funding UI | Funding tests | PARTIAL |
| Source ingestion | Source Ingestion | `source_assets`, versions, extraction metadata | Source routes | Upload/import UI | Source tests | PARTIAL |
| Learning/service evidence | Verified Evidence | `prepare_prove_evidence`, `curriculum_truth_facts` | Verified-evidence routes | Truth/evidence UI | Projection tests | REUSABLE WITH EXTENSION |
| General Truth Spine | Oracle plus frontend Truth Spine | Oracle process memory; curriculum truth tables | Oracle routes; frontend adapter | Truth Spine/Oracle pages | Oracle/projection tests | DUPLICATE / PARTIAL |
| Aggregation / integration assurance | Aggregation | No repository persistence; placeholder repositories | Aggregation routes | Aggregation workbenches | Limited fixture tests | MOCK_ONLY |
| Public reporting governance | Reporting | Public disclosure/publication tables | Reporting routes | Reporting/public UI | Reporting tests | REUSABLE |
| AI governance | AI Governance / Agent Fabric foundation | AI delegation/classification/session/model tables | AI governance routes | AI admin surfaces | AI governance tests | REUSABLE |
| Release assurance | ARAG | ARAG release/policy/packet tables | ARAG routes | Release Assurance UI | ARAG tests | OUT OF SCOPE FOR GOVERNMENT CLAIMS; REUSABLE PROCESS PATTERN |
| Government assurance claims | None | None | None | Truth UI has claim-like display only | No canonical claim tests | MISSING |
| Government metric authority | None; narrow reporting registrations | Code constants and report tables | No general metric API | Metric displays | No Metric Registry tests | MISSING |
| Requirements/controls | Completion Policy is domain-specific | Completion policy tables | Completion routes | Requirements panels | Completion tests | PARTIAL / DOMAIN-SPECIFIC |
| Findings/corrective actions | Operational Awareness only for derived findings | Awareness finding table | Awareness routes | Daily Brief/admin | Awareness tests | PARTIAL |

## 5. Government Program Assurance Capability Matrix

Evidence notation uses repository paths and symbols; documentation is treated as design evidence only, not implementation proof.

| Capability | Status | Evidence | Reusable? | Gap | Recommended Action |
|---|---|---|---|---|---|
| A. Organization / tenancy / identity | REUSABLE | `migrations/001_identity_base.sql:3-70`; `auth/organization-context.ts:94-141`; `auth/tenant-context.ts:1-21` | Yes | Government agency/provider taxonomy, federation/MFA proof, stronger ABAC absent | Extend canonical Identity/Organization owners; do not add a second organization model |
| B. Program registry | PARTIAL | `migrations/002_programs.sql:3-16`; `domain/programs/model/program.ts:1-13`; stewardship in migration 032 | Yes | No government lifecycle/version/theory/objective/eligibility/geography authority | Extend `programs` under Programs with historical versions and assurance-specific requirements |
| C. Funding / grants / contracts / obligations | PARTIAL | `migrations/009_grant_binders.sql`, `010_exchange_funding_commitments.sql`, `086_funding_grants_restricted_funds.sql`, `087_service_agreements.sql` | Partly | No complete award-agreement-obligation-payment-service-outcome lineage; no invoices/payments/allowable cost | Reconcile Funding Grants, Grant Binder, commitments, and agreements into one lineage contract |
| D. Operational events / participant / service delivery | PARTIAL | `migrations/031`, `041`, `046`, `066`; workforce outcome repo | Yes for learning/workforce | Participant is mostly user/ref string; no general service-delivery event authority, corrections, immutable chain | Extend Operational Events with participant/service provenance and correction history |
| E. Claim Registry | MISSING | No first-class claim table/model/service; frontend claim-like `src/pages/admin/truth-spine/TruthSpinePage.jsx:22-174` is not backed by a matching general API | No | No claimant, population, period, metric, evidence, contradiction, determination authority | Establish one canonical Claim owner before government reporting |
| F. Evidence | REUSABLE WITH EXTENSION | `migrations/034_prepare_prove_evidence_competency.sql`; `067_verified_evidence_truth_projection.sql:4-66`; verified-evidence service | Yes | Curriculum-specific, limited hash/chain-of-custody/access-history/retention/legal-hold and claim linkage | Generalize evidence contract while keeping existing curriculum owner |
| G. Verification Engine | PARTIAL / MOCK_ONLY | Aggregation `verification.service.ts:3-70` returns fixture statuses; verified-evidence eligibility checks are real | Limited | No general verifier/method/level/contradiction/authority record | Replace fixture verification with persisted domain-owned verification records |
| H. Verification Method Registry | MISSING | No persisted method registry found; aggregation mapping/verification repos are placeholders | No | No method version, eligible claim type, evidence threshold, sampling/reviewer policy | Create canonical registry after Claim/Evidence ownership is fixed |
| I. Metric Registry | MISSING | `aggregation/domain/contracts.ts:18-30` describes metrics; `aggregation/routes/metrics.routes.ts:1` is placeholder; reporting has narrow constants | Narrow reporting reuse | No authoritative formulas, denominator, evidence/verification requirements, versioned metric entity | Establish Metric Registry; preserve existing public-report registrations as projections/compatibility |
| J. Truth Spine | PARTIAL / DUPLICATE | Curriculum tables in migration 067; Oracle `truth.repo.ts:3-11` is in-memory; frontend store uses localStorage at `src/shared/truth-spine/truthSpineStore.js:13-31` | Selected pieces | No general persisted canonical fact authority, contradiction/supersession/public status across domains | Choose one persisted Truth Spine owner and demote Oracle/frontend adapters to consumers |
| K. Oracle / reconciliation | MOCK_ONLY / PARTIAL | `oracle.service.ts` consumes aggregation HTTP; `compare-engine.ts`; aggregation reconciliation fixture `reconciliation.service.ts:10-45` | Concepts only | No persisted reconciliation cases/precedence/decisions; cannot defensibly reconcile Euna $1m vs ERP $975k | Build reconciliation case authority with source precedence and human determination |
| L. Requirement / rule / control registry | PARTIAL | Completion Policy tables/migrations 061 and policy services; ARAG work-order policy 097 | Domain-specific reuse | No statute-regulation-grant-contract-control-test-evidence chain | Add a requirements/control registry, likely adjacent to policy but not duplicate completion policy |
| M. Temporal policy / rules | PARTIAL | `completion_policies` and versioned evidence rules in migration 067 | Limited | No general effective historical evaluation, grandfathering, retroactive amendments | Add temporal policy versions and evaluation provenance |
| N. Eligibility & payment validation | PARTIAL | Grade-12 eligibility routes/policies; funding grant restriction/allocations; `PaymentDetails.jsx` and mock payments adapter | Limited | No payment authority, duplicate/improper payment/allowable-cost/debarment/budget checks | Treat financial assurance as a separate controlled build on canonical funding/payment owner |
| O. Program integrity / fraud risk | PARTIAL | Operational Awareness findings and Oracle risk/readiness concepts | Concepts | No indicator-risk-finding-violation-fraud distinction or investigation referral | Introduce risk register and strict determination-state model |
| P. Continuous control monitoring | MISSING | Awareness rules and job names exist; no persisted control execution/test result authority found | No | No scheduled/event control runs, effectiveness, exceptions, historical state | Build control-monitoring foundation after requirements registry |
| Q. Provider assurance | MISSING | Provider organization relationships, service agreements, funding history pieces | Partly | No provider assurance profile, exposure, performance/compliance/audit aggregation | Compose a provider profile projection over canonical sources; do not duplicate provider identity |
| R. Monitoring / findings / corrective action | PARTIAL | `operational_awareness_findings` migration 095 and awareness service; `cases` domain exists | Limited | No monitoring engagement, finding authority/requirement link, CAPA/retest/sanction lifecycle | Establish Monitoring/Finding/CAP domain or prove Cases can own it safely |
| S. Audit Workspace | PARTIAL | `domain/audit`, audit log UI, reporting audit packs | Limited | No engagement/scope/population/workpapers/sample/final determination workspace | Build a restricted audit workspace on Evidence/Finding authorities |
| T. Sampling Engine | MISSING | No sampling implementation found | No | No reproducible random/stratified/risk/monetary-unit sample authority | Build independent deterministic sampling service |
| U. Investigation Workspace | MISSING | Generic `cases` exist; no restricted investigation semantics found | No | No legal hold/restricted evidence/disposition/referral controls | Separate investigation authority from ordinary cases |
| V. Recovery / recoupment | MISSING | Funding/grant financial fields exist; no recovery case/payment schedule/collection model | No | No improper-payment recovery lifecycle | Build only after payment/eligibility authority is established |
| W. Program Theory / logic model | PARTIAL | Curriculum/course/unit/lesson/release structures; `programs` basic metadata | Some curriculum reuse | No problem-input-activity-output-outcome-assumption model | Add versioned logic-model projection to Program |
| X. Program Evaluation | MISSING | Outcome/impact measurement helpers are calculations, not evaluation studies | No | No baseline/comparison/causal-methodology/limitations record | Defer until canonical outcomes/metrics exist |
| Y. Decision Provenance | PARTIAL | Audit events, Oracle actions, review/approval/release records | Reusable patterns | No general decision record linking facts, evidence, policy, AI, dissent, appeal | Establish Decision provenance projection over existing authorities |
| Z. Public Transparency | REUSABLE WITH EXTENSION | Reporting public eligibility/disclosure/publication/snapshot tables and services | Yes | Narrow curriculum metrics; public source/PII/freshness coverage not universal | Reuse reporting authority, require Claim/Metric/Truth linkage |
| AA. Connector / adapter architecture | PARTIAL / MOCK_ONLY | `aggregation/mappers`, connector routes/jobs, source ingestion, external account providers | Interfaces reusable | Aggregation repositories/controllers/services are placeholders; only limited real connectors | Define canonical connector contract and conformance tests |
| AB. Source-of-truth authority registry | MISSING | `source_systems` schema name and placeholder repo; no executable authority precedence | No | Cannot designate authoritative source by record/domain/jurisdiction/effective date | Build source authority registry before reconciliation |
| AC. Data authority & use policy | PARTIAL | RBAC, resource classification, AI context admission | Some AI reuse | No legal basis/purpose/redisclosure/field-level/jurisdiction data-use policy | Extend Governance with data-use policy; do not treat RBAC as sufficient |
| AD. Purpose-based ABAC | PARTIAL | AI Governance evaluates principal/agent/org/tenant/resource/purpose/action/model; `ai-governance-service.ts:104-150` | Yes | General government data access does not compose purpose/program/legal basis/time | Generalize policy evaluation under Governance |
| AE. Canonical government data model | PARTIAL | Organization, Program, Grant, Evidence, Outcome fragments exist | Yes with boundaries | Claim, Metric, Verification, Finding, Decision, Payment, Service are not canonical end-to-end | Publish executable semantic constitution only after owner decisions |
| AF. Semantic mapping registry | MOCK_ONLY | `mapping-registry.service.ts:1-2`, `mappings.repo.ts` placeholder, mapper files | Mapper patterns only | No persisted field mapping/version/effective date/approval | Build persisted Mapping Registry |
| AG. Data quality | PARTIAL / MOCK_ONLY | quality schemas/components/jobs; quality repo/service placeholders | Concepts reusable | No persisted quality observations tied to source/record/confidence enforcement | Build data-quality records and admission impact |
| AH. Entity resolution | MOCK_ONLY / PARTIAL | `entity-resolution.service.ts:1-65` uses hard-coded case fixtures; no persisted resolver repo | Interface only | No person/org merge/unmerge/survivor/confidence/review | Build privacy-aware entity resolution authority |
| AI. Cross-program conflict detection | PARTIAL / MOCK_ONLY | Fixture reconciliation; duplicate utilities exist but no government conflict authority | Concepts only | No participant/benefit/invoice/outcome conflict cases | Extend reconciliation after source authority and entities |
| AJ. Integration provenance | REUSABLE WITH EXTENSION | Source assets hash/storage/scan fields in migration 058; evidence provenance JSON; outbox | Yes | Connector version/batch/rejected records/reconciliation state not universal | Standardize provenance envelope |
| AK. Integration Operations Center | MISSING | Connector health page/hooks and job names; connector health service is placeholder | UI concept reusable | No durable status/freshness/error/schema drift authority | Build integration operations records and UI |
| AL. Read/write separation | PARTIAL | MCP side-effect classes and AI authority action scopes; provider adapters | Reusable AI pattern | General connectors/payment systems do not have universal read/action permission separation | Apply canonical capability permissions to connectors |
| AM. Secret / credential boundaries | PARTIAL | `external-secret-cipher.ts`; credential and external-account domains; MCP credential resolver | Yes | Government connector scoping/rotation/audit/environment separation not proven universally | Extend canonical secret boundary with connector scope |
| AN. Certified connector framework | MISSING | No conformance suite for provenance/isolation/retry/schema/versioning found | No | No certification gate | Define connector contract and test harness before pilots |

## 6. Existing Silicon Heartland Inventory Reuse

### Truth Spine

Reusable: evidence-rule-driven projection, source eligibility checks, stable IDs, organization/learner scoping, idempotent projection, evidence supersession, and Truth Spine fact adapters (`domain/verified-evidence/service/verified-evidence-service.ts:47-106`, `151-182`).

Not reusable as a general government authority without extension: curriculum-specific source table allowlist, learner-bound reads, and frontend localStorage Truth Spine store (`src/shared/truth-spine/truthSpineStore.js:13-31`).

### Oracle

Reusable as a decision/readiness vocabulary: truth status, verification status, contradiction status, readiness, confidence, and recommended next action (`oracle/domain/types.ts`). Not canonical persistence: `oracle/repositories/truth.repo.ts:3-11` is an in-memory object and `oracle.service.ts` depends on an HTTP aggregation pipeline.

### Metric Registry

Reusable only as a pattern: public reporting registrations and a few impact metric constants. There is no general Metric Registry implementation. `aggregation/routes/metrics.routes.ts` and `metrics.controller.ts` are placeholders.

### Operational Events

Reusable: `integration_outbox`, activity-domain source events, curriculum/workforce records, and audit events. The events are not yet a generalized government service-delivery/event authority with correction chains.

### Evidence

Reusable: `prepare_prove_evidence`, evidence rules, provenance JSON, source occurrence timestamps, verifier attribution, supersession, and outbox-driven projection. General government evidence needs source-system IDs, hashes, chain of custody, access history, legal hold, retention, and Claim links.

### Organization/Tenant/Relationships

Strongest reusable foundation. Organizations, memberships, roles, tenant derivation, organization context, relationship effective dates, lifecycle, and the four requested relationship types are executable. The current tenant is derived as `tenant:<organization>` (`auth/tenant-context.ts:3-21`), which is adequate for isolation patterns but not a full county/state hierarchy.

### Identity

Reusable: local identity plus Auth0 session exchange path and permission guard. Production federation/MFA evidence is configuration-dependent and not established by repository code alone.

### Service Catalog

Reusable for organization-level entitlement, especially governed AI services. It is not a government program/service registry or provider assurance authority.

### Funding/Grants

Reusable pieces include funding grants, restricted allocations, grant binders, exchange commitments, and service agreements. The lineage is fragmented across domains and does not reach payment/service/outcome verification.

### Legal Layer

Documentation and legal files exist, but no executable legal-to-control-to-test registry was found. Documentation is not proof of government compliance enforcement.

### AI Governance / Agent Fabric

Reusable and comparatively mature: delegated authority is bounded, finite, revocable, org/tenant scoped, classification-aware, model-aware, and evented. It should govern AI assistance to assurance; it must not verify claims, mutate Truth Spine facts, or approve its own recommendations.

### Reporting

Reusable public eligibility, disclosure, publication, snapshots, distribution, artifact, and audit-pack patterns. These must consume canonical Claim/Metric/Truth authorities rather than become them.

### Career/Outcome architecture

Reusable for participant, enrollment, cohort, completion, employment outcome, evidence, and outcome status patterns. It is not yet a general government participant/service model.

### Curriculum/Cohort/Assignment architecture

Reusable for event lifecycle, requirements, evidence eligibility, version-bound records, reviewer attribution, and immutable-ish source history. Do not rebrand curriculum entities as government programs without a bounded semantic extension.

### Studio review/QA patterns

Reusable approval/revision/snapshot patterns for evidence workflows. Studio remains a software-release domain, not a government audit domain.

## 7. Critical Missing Capabilities

### P0 - blocks a trustworthy government pilot

1. First-class Claim Registry with evidence/metric/verification links.
2. Persisted general Truth Spine with source lineage, contradiction, supersession, public status, and tenant/org policy.
3. Canonical Metric Registry and metric lineage enforcement.
4. General Verification Record and Verification Method Registry.
5. Source-of-Truth Authority Registry and reconciliation-case authority.
6. Government data-use/purpose policy beyond ordinary RBAC.
7. Complete funding-to-service-to-outcome lineage for one pilot funding stream.
8. Evidence chain of custody and retention/access history suitable for government audit.

### P1 - required for controlled pilot operations

1. Program version/logic model/requirements extension.
2. Provider Assurance Profile.
3. Monitoring, findings, corrective-action plan, retest, escalation, and payment-hold states.
4. Deterministic entity resolution with human review.
5. Integration provenance, freshness, rejection, schema-drift, and connector operations.
6. Decision provenance record.
7. Public reporting binding to verified Claim/Metric/Truth sources.

### P2 - important assurance depth

1. Sampling engine with reproducible seeds and methodology.
2. Restricted investigation workspace and legal hold.
3. Eligibility/payment validation and improper-payment recovery.
4. Temporal policy evaluation and historical rule versions.
5. Continuous control monitoring.
6. Cross-program conflict detection.

### P3 - later maturity

1. Program evaluation and causal inference metadata.
2. Advanced fraud analytics and anomaly detection.
3. Multi-jurisdiction semantic federation.
4. Automated public data product generation.
5. GovRAMP certification work and independent assurance.

## 8. Integration & Interoperability Findings

- Current connector concepts include aggregation routes/jobs/mappers, source ingestion, external account providers, calendar providers, MCP transport, and raw document import. They are not one certified provider-neutral framework.
- `aggregation/services/run-connectors.job.ts`, `connector-health.service.ts`, `connector-runs.repo.ts`, and related controllers/repositories expose the intended shape but several are placeholders. This is not an operational integration center.
- No executable source-of-truth authority registry was found. `source-systems.repo.ts` is a placeholder.
- No general data-use policy evaluates owner, purpose, legal basis, agreement, allowed fields, redisclosure, or jurisdiction before extraction. AI Governance has a bounded analog, not a government-wide policy engine.
- Semantic mapping is not persisted as an approved, versioned registry; mapper files are one-off transformations.
- Source assets preserve organization/tenant, hash, storage key, visibility, status, scan status, and ingestion metadata (`migrations/058_source_assets_documents.sql:5-55`). Provenance is therefore a useful foundation, but not full integration lineage.
- No durable connector freshness/error/schema-drift/rejected-record authority was found.
- Read/write separation exists in the AI/MCP model but is not proven across government connectors, payments, or external source systems.
- Credentials have encryption and provider abstractions, but government connector-specific scope, rotation, and access audit are not established uniformly.
- Government interoperability readiness: **FOUNDATIONAL**, not pilot-ready.

## 9. Security & Government Readiness Findings

### IMPLEMENTED

- Organization membership, role, permission, active organization context, and tenant derivation.
- Organization relationship lifecycle and overlap constraint.
- Org/tenant-scoped AI delegation, resource classification, model policy, session governance, input security, MCP governance, and simulation.
- Source upload hash/idempotency and evidence projection scoping.
- Public disclosure eligibility, review, publication authorization, and snapshot persistence patterns.
- External secret cipher and credential-domain primitives.

### PARTIAL

- Production identity: Auth0 exchange path exists, but deployment configuration and MFA/federation operation are not proven.
- Encryption and secrets: encrypted secret primitives exist; government-wide key management, rotation, environment separation, and access audit are not proven.
- Audit logs: `audit_events`, outbox, and security audit paths exist; tamper-evidence/retention/legal hold are not established across all events.
- Backup, restore, disaster recovery, vulnerability management, penetration-test readiness, and GovRAMP readiness are not evidenced as executable controls.
- AI governance is stronger than general data governance but does not protect every non-AI integration path.

### DOCUMENTED_ONLY

- Many security, legal, adapter, policy, and production-readiness documents describe intended architecture without corresponding executable general-purpose registries or controls.
- NIST/Zero Trust/GovRAMP alignment cannot be claimed from documentation alone.

### MISSING

- Government source authority, purpose/legal-basis ABAC, chain-of-custody/legal-hold evidence, control registry, continuous monitoring, restricted investigation, recovery, certified connector conformance, and general immutable decision provenance.

## 10. Truth / Evidence / Metric Lineage Findings

### Real supported path

For curriculum/workforce data, the strongest current path is:

`source event`
→ `curriculum_evidence_rules`
→ `prepare_prove_evidence`
→ `curriculum_truth_facts`
→ `toTruthSpineFact` adapter
→ impact/reporting consumers.

The persisted portion is implemented in migration 067 and `verified-evidence-service.ts:47-106`. Tests verify idempotent projection, organization/learner reads, source eligibility, and release-bound evidence stability in `tests/verified-evidence-projection.test.ts:100-199`.

### Breaks

- There is no general Claim row between evidence and outcome/metric.
- There is no general Metric Registry row defining formulas and evidence requirements.
- The Oracle path consumes hard-coded aggregation fixtures and stores its latest package in memory.
- Frontend Truth Spine records are localStorage-backed and can fall back when the API is unavailable (`src/shared/truth-spine/truthSpineApi.js:4-10`, `truthSpineStore.js:13-31`).
- Impact metrics use fixed constants and SQL filters over curriculum truth facts, not a canonical metric authority (`domain/impact-attribution/model/impact-attribution.ts:17-21`, `impact-attribution-repo.ts:6-14`).
- Public reporting registrations protect a narrow set of report metric IDs but do not establish a county/state Metric Registry.

### Consequence

The repository can prove selected curriculum facts under specific rules. It cannot yet defensibly trace a government claim such as “Provider X placed 312 qualifying participants into employment during Q2” through authoritative source records, evidence, verification method, metric definition, contradiction handling, and decision provenance.

## 11. Mock / Seed / LocalStorage / False-Data Risks

High-risk findings:

1. `aggregation/entity-resolution.service.ts:11-51` uses hard-coded `test_case_001` through `test_case_003` and fabricated defaults.
2. `aggregation/verification.service.ts:19-54` and `reconciliation.service.ts:10-45` return fixture outcomes, not persisted verification/reconciliation decisions.
3. Aggregation repositories and mapping/quality/lineage/connector services contain literal `Placeholder` implementations.
4. `oracle/truth.repo.ts:3-11` is process-local memory; restart loses state.
5. `src/shared/truth-spine/truthSpineStore.js:13-31` persists records in browser localStorage.
6. `src/shared/truth-spine/truthSpineApi.js:4-10` explicitly permits page-level fallback when the API is down and uses a development bearer token at lines 19-23.
7. `apps/shs-api/src/api/router.ts:86-154` defines demo users, demo organizations, demo roles, and a seeded in-memory audit log.
8. Frontend outcome surfaces use `src/components/util/lordOutcomes/outcomesApi.js` with `USE_MOCK = true` and mock datasets.
9. Hub/civic/operator pages contain localStorage state, fallback organizations, demo referrals/partners, and local event generation. These are not suitable sources for official reporting or Truth Spine facts.
10. `src/shared/growth/claimMarket.js` is a localStorage claim-like market and is unrelated to a government Claim Registry.
11. `src/components/AIChat.jsx` contains a placeholder AI reply path.

Risk rating: **CRITICAL** if any of these paths can feed public reporting, executive assurance, provider assurance, or AI context without an explicit `DEMO`, `UNVERIFIED`, or `FALLBACK` boundary. The audit found multiple UI fallback paths; whether each is reachable in production depends on route/configuration and requires runtime deployment verification.

## 12. Duplicate Authority Findings

| Duplicate candidate | Canonical candidate | Alternate | Assessment |
|---|---|---|---|
| Program | `domain/programs`, `programs` table | Curriculum programs, career pathway program references, frontend program data | Domain-specific alternates are valid, but government Program must extend the existing authority rather than create another top-level model |
| Organization | Identity `organizations` table | Demo org arrays, frontend fallback orgs, SHF/SHS UI models | Identity table is canonical; demo/fallback data must remain non-authoritative |
| Evidence | `prepare_prove_evidence` plus evidence rules | Frontend Evidence Pack/localStorage, source documents, report artifacts | Evidence Pack is UX-only; general evidence needs extension, not a second table |
| Truth | `curriculum_truth_facts` | Oracle in-memory store; frontend localStorage Truth Spine; report adapters | Major competing authorities; choose persisted Truth Spine owner before government build |
| Metric | Reporting public registrations and impact constants | Aggregation metric contracts/controllers | No current canonical general Metric Registry; avoid adding another without ownership decision |
| Outcome | `workforce_employment_outcomes`, curriculum facts, impact models | frontend mock outcomes and outcome routes | Workforce outcome is a useful domain-specific owner; canonical cross-program Outcome needs a boundary |
| Grant/funding | Funding Grants, Grant Binder, Exchange commitments | frontend funding models | These are related domains, but lineage is fragmented; consolidation/projection needed |
| Audit/finding | Audit events, Cases, Operational Awareness findings, report audit packs | UI audit logs/local event records | No single government monitoring/finding authority; define composition and ownership |
| Claim | Oracle/UI claim-like objects, growth claim market | No persisted canonical Claim | Claim-like objects must not be promoted accidentally; new authority is genuinely missing |

No files were removed or consolidated during this audit.

## 13. AI Governance Findings

### Safe reusable paths

- AI delegation requires the delegating principal to match the authenticated actor, finite expiry, explicit bounded resources/actions, organization/tenant match, and principal permissions (`ai-governance-service.ts:104-150`).
- Delegation revocation, resource classification, model policy, sessions, input security, MCP gateway, simulation, and ARAG are persisted and tested as the Core-v1 control plane.
- Simulation and Conductor are intentionally separate from production mutation.

### Unsafe or incomplete paths

- AI governance does not itself establish Claim verification, Evidence admissibility for government sources, Metric authority, or Decision provenance.
- The Oracle/aggregation path can expose fixture-derived “verified”/readiness results to API/UI consumers without a general persisted verification record.
- Frontend AI/truth adapters include development tokens, local fallback behavior, and placeholder replies; these must never be treated as government assurance context.
- No evidence was found that AI can directly create a canonical government Truth Spine fact, but the broader frontend/localStorage and fixture architecture creates a material laundering risk if consumers do not enforce source class and API origin.
- AI must not approve its own recommendation, alter evidence, or certify a claim; current ARAG/AI controls support that boundary for their domains, but no general government Decision authority enforces it across all UI paths.

## 14. UI / Workflow Inventory

| Target workflow | Existing surface | Status | Backend reality |
|---|---|---|---|
| Executive dashboard | Hub leadership/reporting, Exchange command center, Lord Outcomes | MOCK/SEED + PARTIAL | Several surfaces use fallback/demo data; reporting backend exists but is not a government assurance dashboard |
| Program Assurance | Program routes, curriculum, Lord Outcomes program pages | PARTIAL | Program table and curriculum exist; no assurance case/claim/verification composition |
| Provider Assurance | Provider/partner pages, organization relationships, service agreements | PARTIAL | Relationship/agreement pieces exist; no provider assurance profile |
| Program Registry | Admin/program/curriculum surfaces | PARTIAL | `programs` is real but minimal; no versioned government registry |
| Funding Graph | Grant Binder, funding grants, commitments, funding impact UI | PARTIAL | Multiple real funding domains without complete lineage |
| Claim Review | Truth Spine/Oracle pages and claim-like forms | MOCK/SEED / MISSING backend | UI uses claim IDs but no general Claim authority was found |
| Evidence Workspace | Evidence Locker, curriculum Evidence Panel, Truth Spine admin | PARTIAL | Real curriculum evidence plus localStorage/UI evidence packs |
| Verification Workspace | Aggregation VerificationWorkbench, reporting VerificationAuditSurface | MOCK_ONLY / PARTIAL | Aggregation verification is fixture-backed; curriculum evidence review is real |
| Monitoring | Operational Awareness/Daily Brief | PARTIAL | Findings exist, but not monitoring engagements/control tests |
| Findings | Awareness findings, cases, audit UI | PARTIAL / DUPLICATE | No canonical government finding/CAPA owner |
| Corrective Actions | Cases/Oracle actions/awareness recommendations | PARTIAL | No governed corrective-action lifecycle with retest |
| Audit Workspace | Audit Log Viewer, AuditPackPanel, reporting exports | PARTIAL | Audit artifacts exist; no audit engagement/workpaper/sample authority |
| Integration Operations | ConnectorHealthPanel, aggregation hooks/jobs | MOCK_ONLY | Backend connector health/repositories are placeholders |
| Program Integrity/Risk | Oracle priority/readiness, awareness, command center | PARTIAL / MOCK_ONLY | No fraud-risk determination boundary |
| Metric Registry | Metric tiles, reporting registrations, aggregation placeholder | MISSING | No canonical registry UI/API |
| Public Transparency | Lord Outcomes public pages and reporting disclosure/publication | PARTIAL / MOCK | Public governance backend exists; some public outcome data is mock-backed |
| Provider Portal | Exchange/provider surfaces, partner queue | PARTIAL / MOCK | Provider interactions exist but not assurance evidence workflows |
| Admin/Policy | Admin routes, permissions, completion policies, AI governance, ARAG | REUSABLE | No government requirements/control registry |
| AI Admin Center | Agent/AI guardrails/admin pages | REUSABLE WITH EXTENSION | Strong AI governance foundation; not a government assurance admin center |

## 15. Recommended Canonical Product Boundary

The Government Program Assurance product should own:

- assurance-specific Program profiles and versioned requirements;
- Claim Registry;
- Evidence admissibility/provenance projection;
- Verification Records and Verification Method Registry;
- Metric Registry and metric lineage;
- persisted Truth Spine facts and contradiction/supersession;
- source authority and reconciliation cases;
- monitoring, findings, corrective action, audit, sampling, investigation, and recovery workflows;
- Decision provenance and public-approved reporting projections.

It should integrate with, not rebuild:

- Identity, organizations, memberships, tenant context, and relationships;
- existing funding/grant/agreement/payment systems;
- county/state source systems and provider systems;
- existing curriculum/cohort/assignment/workforce outcome systems;
- source ingestion/storage and secure connector infrastructure;
- Evidence and Truth Spine primitives after ownership is clarified;
- Reporting/public disclosure;
- AI Governance, Agent Fabric, Conductor, MCP, and ARAG.

The boundary must explicitly reject the current pattern where a fixture aggregation or browser fallback can become an assurance fact.

## 16. Proposed Build Sequence

1. **Authority decision and semantic boundary:** decide the single owners for Program, Claim, Evidence, Verification, Metric, Truth, Finding, Decision, Source Authority, and Reconciliation. Record existing-domain extensions before migrations.
2. **Source and scope foundation:** establish government organization hierarchy mapping, source-system authority, data-use/purpose policy, tenant/org scoping, and integration provenance.
3. **Claim/Evidence/Verification core:** create versioned Claim, general Evidence linkage, Verification Record, and Verification Method Registry using the existing curriculum evidence path as a compatibility adapter.
4. **Metric/Truth lineage:** create Metric Registry and persisted Truth Spine projections; make Oracle and frontend adapters read-only consumers; block report/public use without admissible lineage.
5. **Funding/program/provider lineage:** extend Program versioning, funding award/agreement/obligation/payment references, provider profile projections, and service/outcome links for one bounded pilot.
6. **Reconciliation/entity/data quality:** implement source authority precedence, reconciliation cases, entity resolution, quality dimensions, freshness, rejected-record handling, and contradiction/supersession.
7. **Monitoring/audit:** add requirements/control registry, temporal evaluation, monitoring findings, corrective actions, reproducible sampling, audit workspace, restricted investigation, and decision provenance.
8. **Pilot reporting and AI:** bind Daily Brief/public reporting/AI assistance only to the canonical authorities and retain information classes. Keep AI recommendation separate from verification and decision authority.

This sequence minimizes migration risk by reusing Identity, Program, Evidence, Reporting, and AI Governance owners while preventing Oracle, fixture aggregation, or browser state from becoming a second authority.

## 17. First County Pilot Readiness

**Score: 24 / 100**

Rationale:

- Organization/tenant/identity and relationship foundation: 8/10.
- Program/provider/funding primitives: 5/15.
- Evidence ingestion/provenance: 4/15.
- Claim/verification/metric/Truth authority: 2/25.
- Monitoring/audit/corrective action: 2/15.
- Interoperability/source authority/data quality: 2/15.
- AI governance and reporting presentation: 1/5 for this specific pilot because the controls exist but lack government assurance inputs.

The score reflects reusable infrastructure, not a claim that the platform can currently verify a county program. The missing P0 authorities make a 5-10-provider, 3-5-outcome assurance pilot unsafe to represent as verified.

## 18. Stop / Go Recommendation

**GO_TO_FOUNDATION_BUILD**

Do not begin feature-surface expansion or create a parallel government platform. First resolve canonical ownership and build the P0 Claim, Evidence, Verification, Metric, Truth, Source Authority, Data Use, and Reconciliation foundations. The repository has enough reusable substrate to justify a controlled foundation build, but not enough to go directly to a county assurance pilot.

## 19. Files Created

- `docs/government-program-assurance/GOVERNMENT_PROGRAM_ASSURANCE_REPOSITORY_AUDIT.md`

## 20. Files Modified

**NONE other than the audit document.**

## 21. Verification Evidence

Read-only checks performed:

- `git branch --show-current`
- `git rev-parse HEAD`
- `git status --short`
- `git status --porcelain=v1 | wc -l`
- `git status --porcelain=v1 | shasum -a 256`
- `git remote -v`
- `rg --files` inventory across root, API, migrations, docs, and UI
- `rg` searches for claim, metric, evidence, truth, verification, reconciliation, connector, mapping, source authority, risk, audit, corrective action, sampling, investigation, recovery, payment, obligation, and decision terms
- migration table/index/view inventory across `apps/shs-api/migrations` and `apps/shs-api/src/db/migrations`
- direct source inspection of Identity, Organization Relationships, Programs, Funding Grants, Service Agreements, Source Ingestion, Verified Evidence, Oracle, Aggregation, Reporting, AI Governance, and frontend Truth/Reporting surfaces
- test inventory: 105 API test files and 79 UI spec files discovered; no broad test suite was run because this request is a read-only repository audit and no runtime mutation was authorized

Evidence limitations:

- No live PostgreSQL database was available for a fresh schema/runtime verification during this audit.
- No external county/state systems or production identity provider were exercised.
- Documentation and UI claims were not accepted as proof without executable owner/service/persistence evidence.
- Existing owner worktree changes were not staged, reset, cleaned, or modified.

## 22. Final Verdict

GOVERNMENT PROGRAM ASSURANCE AUDIT COMPLETE — READY FOR GAP-DRIVEN BUILD PLANNING
