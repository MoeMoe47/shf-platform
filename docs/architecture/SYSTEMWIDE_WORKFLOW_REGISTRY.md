# Silicon Heartland Systemwide Workflow Registry

Audit baseline: 2026-09-10  
Repository: `/Users/mikeslate/Projects/shrv1`  
Branch: `studio-v1-plus-development`  
HEAD: `0441aa4fe5f74d330a9f100f678d6353a6cac43b`

## Registry Rules

This is an audit inventory, not a declaration that a route or schema is a complete workflow. `COMPLETE` requires an executable canonical lifecycle and fresh acceptance evidence. `PARTIAL` means the main path exists but one or more required handoffs, terminal states, runtime proofs, or consumer paths are incomplete. `NOT_VERIFIED` means source evidence exists but live proof is absent. `BLOCKED` means a required dependency or authority is unavailable or explicitly not implemented.

## Material Workflow Inventory

| Workflow ID | Domain | Workflow | Status | Severity | Missing Seam | Dependency | Recommended Action |
|---|---|---|---|---|---|---|---|
| WF-001 | Identity | Identity/session/authentication | COMPLETE | P0 | None for current canonical identity/session contract; SYS-8B2 authenticated HTTP/isolation/restart acceptance passed | Organization scope | Preserve canonical identity middleware and regress |
| WF-002 | Organizations | Organization onboarding/activation/suspension | COMPLETE | P1 | Core lifecycle live-proven; broader API/recovery regression remains | Identity, relationships | Preserve and regress |
| WF-003 | Organizations | Organization relationships | COMPLETE | P1 | Core lifecycle/concurrency live-proven; broader consumer proof remains | Identity, onboarding | Preserve and regress |
| WF-004 | Service Catalog | Service definition/entitlement activation | COMPLETE | P1 | Core entitlement consumer live-proven; broader consumer proof remains | Organizations | Preserve and regress |
| WF-005 | Service Agreements | Shared service agreement lifecycle | COMPLETE | P1 | Tested lifecycle live-proven; broader event/expiry consumer proof remains | Service catalog | Preserve and regress |
| WF-006 | Funding | Funding/grant/restricted-funds lifecycle | COMPLETE | P1 | Obligation-to-service/evidence/reporting handoff proof | Programs, evidence | SYS-8B4 fresh funding/lineage acceptance |
| WF-007 | GPA | Government assurance claim lifecycle | COMPLETE | P1 | Regress after systemwide changes | Evidence, verification | Preserve and include in broad regression |
| WF-008 | GPA | Evidence and verification assurance | COMPLETE | P0 | None known after Wave 3H-A2; broad regression required | Truth Spine | Regress live PostgreSQL path |
| WF-009 | GPA | Reconciliation quality/block/resume | COMPLETE | P0 | None known after Wave 3H-A2; broad regression required | Truth Spine, metrics | Regress live PostgreSQL path |
| WF-010 | GPA | Early warning/risk/Money-at-Risk | COMPLETE | P1 | None known after Wave 3H-B; broad regression required | Claims, findings | Regress lifecycle and isolation |
| WF-011 | GPA | Finding/CAP/retest/remediation | COMPLETE | P1 | None known after Wave 3H-B; broad regression required | Decisions, evidence | Regress lifecycle and isolation |
| WF-012 | GPA | Public assurance disclosure | COMPLETE | P0 | None for current live public list/detail projection contract | Reporting, disclosure | Preserve canonical public projection and regression |
| WF-013 | Truth | Truth Spine ingestion/verification/history | COMPLETE | P0 | SYS-8B3 accepted Evidence → human verification → Truth lineage over authenticated HTTP/PostgreSQL | Evidence, reporting | Preserve canonical Truth gate |
| WF-014 | Metrics | Metric Registry/calculation/readiness | COMPLETE | P0 | Cross-domain producer coverage and live consumer proof | Truth, reporting | SYS-8B4 registered metric/lineage acceptance |
| WF-015 | Evidence | Verified evidence/admissibility | COMPLETE | P0 | SYS-8B3 accepted canonical intake, admissibility, provenance, replay, isolation, and rejection | Truth | Preserve canonical Evidence authority |
| WF-016 | Reporting | Private report creation/publication | COMPLETE | P0 | Publication, disclosure, and trusted-reporting consumers require broad live proof | Truth, metrics | SYS-8B4 publication/revocation acceptance |
| WF-017 | Reporting | Trusted reporting outbox/dispatch | COMPLETE | P1 | Worker retry/final-failure and downstream acknowledgment need live proof | Reporting | SYS-8B4 trusted dispatch acceptance |
| WF-018 | Curriculum | Curriculum catalog/import/document processing | COMPLETE | P1 | SYS-4C5 fresh import -> publication -> assignment -> mounted StudentUnit consumer proof | Evidence, completion | Preserve canonical import/publication chain |
| WF-019 | Curriculum | Lessons/activities/assessment completion | COMPLETE | P1 | Mounted StudentUnit uses canonical learner activity state, submissions, and server completion policy; SYS-4B3 fresh browser/API/PostgreSQL proof passed | Evidence, completion | SYS-4B3 acceptance |
| WF-020 | Enrollment | Enrollment/cohort membership | COMPLETE | P1 | None for current assigned scope | Identity, curriculum | Preserve and regress |
| WF-021 | Assignments | Assignment targeting/submission/review | COMPLETE | P1 | None for current assigned scope | Enrollment, evidence | Preserve and regress |
| WF-022 | Completion | Completion policy/evaluation/certificate eligibility | COMPLETE | P1 | None for current assigned scope | Curriculum, credentials | Preserve and regress |
| WF-023 | Credentials | Credential definition/issuance/delivery | COMPLETE | P1 | None for current repository-local contract | Completion, Truth | Preserve and regress |
| WF-024 | Portfolio | Portfolio evidence/section publishing | COMPLETE | P1 | None for current learner-result projection scope | Evidence, disclosure | Preserve and regress |
| WF-025 | Career | Career pathway/opportunity planning | COMPLETE | P2 | None for current learner-result augmentation scope | Identity, opportunities | Preserve and regress |
| WF-026 | Career | Career events/opportunity visibility | COMPLETE | P2 | None for current visibility/API/Calendar learner scope | Organizations | Preserve and regress |
| WF-027 | Studio | Project/team/workspace lifecycle | COMPLETE | P1 | None for canonical multi-user lifecycle/recovery scope | Identity, assignments | Preserve and regress |
| WF-028 | Studio | Build packet/builder execution boundary | COMPLETE | P1 | None for durable artifact foundation; release execution remains WF-030 | Studio, QA | Preserve artifact identity and regress |
| WF-029 | Studio | QA/review/delivery/finalize | COMPLETE | P0 | None for current QA/review/remediation/delivery contract; WF-049 production Registry remains external | Studio, ARAG | Preserve exact QA/review/artifact/release lineage |
| WF-030 | Studio | Website deployment/public publish | COMPLETE | P0 | Repository-local approval-gated TEST release lifecycle and authenticated API consumer | Review, disclosure | Preserve release/attempt lineage; production provider remains external |
| WF-031 | Onboarding | Provider/partner onboarding network lifecycle | COMPLETE | P1 | Shared activation/suspension/exit handoff live-proven | Organizations, entitlements | Preserve and regress |
| WF-032 | External Accounts | External calendar/account connection | COMPLETE | P1 | None in repository-local contract; external provider credentials remain deployment configuration | Identity | 38-test PostgreSQL/API-backed integration and hardening suite |
| WF-033 | Calendar | Calendar projection/scheduling | COMPLETE | P2 | None; stateless projection has bounded range, partial-source, and hard-failure semantics | External accounts | 9 orchestration tests plus 9-source security projection suite |
| WF-034 | Live Learning | Live learning/cohort/session workflow | COMPLETE | P1 | None in repository-local contract; real provider remains explicitly not-configured without credentials | Enrollment, calendar | 7-test live PostgreSQL cohort/API suite plus provider and security suites |
| WF-035 | Notifications | Notification/alert evaluation | COMPLETE | P0 | None for durable in-app notification contract; external delivery is out of scope | Events, policy | Real PostgreSQL idempotent projection and UNREAD→READ acceptance |
| WF-036 | AI Governance | Model/session/policy approval | COMPLETE | P0 | Generic bounded task approval, action binding, denial, and revocation contract complete | Agent Fabric | Preserve and regress |
| WF-037 | Agent Fabric | Agent identity/session/delegation/policy | COMPLETE | P0 | Durable scoped identity/session/delegation/task foundation complete | Identity, policy | Preserve and regress |
| WF-038 | Agent Fabric | Tool/MCP authorization and execution | COMPLETE | P0 | Bounded governed execution coordination complete; production side effects remain disabled | Agent identity | Preserve bounded execution and regress |
| WF-039 | Agent Fabric | Agent-to-Evidence/Truth/Reporting | COMPLETE | P0 | Bounded Agent Attempt → Evidence → human Truth acceptance complete | Evidence, Truth | Preserve and regress |
| WF-040 | Agent Fabric | Agent workflow/coordination/workbench | BLOCKED — SAFETY/POLICY | P1 | V1 coordination is browser-local and production execution is intentionally disabled | Agent Fabric | Keep V1 bounded; require separately approved execution phase |
| WF-041 | MCP | MCP server/resource/tool governance | COMPLETE | P0 | Repository-local governed server/resource/tool, classification, secret, scope, replay, and input-security contract complete; production provider remains N/A | Agent Fabric, input security | Preserve governed boundary and regress |
| WF-042 | Input Security | Input/document scanning and classification | COMPLETE | P0 | SYS-8B3 accepted direct/indirect/embedded handling, classification, security events, and scanner fail-closed recovery | Evidence, MCP | Preserve gateway and downstream enforcement |
| WF-043 | Operations | Operational awareness/conductor workflows | COMPLETE | P1 | None for bounded awareness/brief consumer; Conductor execution remains policy-disabled | Events, decisions | Real PostgreSQL brief/outbox acceptance and controlled orchestration suite |
| WF-044 | Legal | Legal authority/runtime lifecycle | COMPLETE | P0 | None for current scoped legal artifact/decision lifecycle; SYS-8B2 authenticated HTTP/isolation/restart acceptance passed | Identity, decisions | Preserve scoped legal authority and regress |
| WF-045 | Audit | Audit event capture/retrieval | COMPLETE | P0 | None for current scoped capture/retrieval contract; SYS-8B5 authenticated audit trace, cross-org isolation, and revoked-membership proof passed | All material workflows | Preserve scoped immutable audit history |
| WF-046 | Public Disclosure | Approval/snapshot/public population | COMPLETE | P0 | None for current governed public population contract; SYS-8B5 public list/detail, allowlist, direct-ID, and revocation regression passed | Truth, reporting | Preserve public-safe projection authority |
| WF-047 | Funding/Impact | Impact attribution/aggregation | COMPLETE | P1 | Funding-to-impact evidence/metric handoff live proof | Funding, metrics | SYS-8B4 scoped attribution/lineage acceptance |
| WF-048 | Source Ingestion | Source registry/intake/validation | COMPLETE | P1 | Failure/retry/dead-letter consumer proof | Evidence, Truth | SYS-8B4 source validation/downstream acceptance |
| WF-049 | Registry | Registry submission/provider adapter | BLOCKED — EXTERNAL DEPENDENCY | P1 | Production Registry provider unavailable; repository-local adapter and failure/retry contract exist | Studio, credentials | Revisit only when provider access is available |
| WF-050 | Cross Product | Cross-product composition/identity bridge | COMPLETE | P0 | None for current scoped composition/session/data contract; SYS-8B2 authenticated HTTP/isolation/restart acceptance passed | Identity, all apps | Preserve bounded composition authority and regress |

## Summary Counts

## SYS-8B5 WF-045 / WF-046 Final Closure + SYS-8 Certification - 2026-09-11

Fresh `shs_sys8b5_20260911` PostgreSQL applied migrations 001-130 with no pending, drift, or unknown migrations; schema integrity passed. WF-045 passed authenticated scoped audit retrieval for Org A, empty Org B isolation, revoked-membership denial, and cross-domain audit history after the smallest required repository fix: the audit list query now applies the authenticated organization scope. WF-046 passed public list/detail HTTP, safe missing-ID handling, public-field allowlist, publication/revocation/versioning regression, and no-mock behavior. API typecheck/build, root build, authority checkers, focused audit/disclosure suites, manifests/UI validation, and diff hygiene passed. Root typecheck is not defined and is recorded as N/A — stale/unavailable root contract. WF-040 remains BLOCKED — SAFETY/POLICY and WF-049 remains BLOCKED — EXTERNAL DEPENDENCY. The final count is 48 COMPLETE, 0 PARTIAL, 0 N/A, 1 external block, and 1 safety block. SYS-8 is COMPLETE; FE-0 is deferred and was not started.

## SYS-8B4 Metrics / Reporting / Funding / Source / Impact Acceptance - 2026-09-11

Fresh `shs_sys8b4_20260911` PostgreSQL applied migrations 001-130 with no pending, drift, or unknown migrations; schema integrity passed. Existing live funding, MetricTruth, source, impact, report publication, trusted-reporting, and authenticated HTTP contracts passed. WF-006, WF-014, WF-016, WF-017, WF-047, and WF-048 are COMPLETE. The current partial count is 2: WF-045 and WF-046. WF-040 remains BLOCKED — SAFETY/POLICY and WF-049 remains BLOCKED — EXTERNAL DEPENDENCY. SYS-8B5 is the exact next phase and was not started.

The 50 material workflows above are the current Stage A inventory. Classification is authoritative for this audit and is intentionally conservative:

| Classification | Count |
|---|---:|
| COMPLETE | 48 |
| PARTIAL | 0 |
| DISCONNECTED | 0 |
| PLACEHOLDER | 0 |
| DEMO_ONLY | 0 |
| MOCK_ONLY | 0 |
| NOT_IMPLEMENTED | 0 |
| NOT_VERIFIED | 0 |
| BLOCKED — SAFETY/POLICY | 1 |

The complete count includes the later SYS-4 through SYS-7 closure evidence and
the SYS-8B1 through SYS-8B5 closure evidence. No partial workflows remain.
WF-040 is intentionally safety/policy blocked and WF-049 is externally blocked.

## Canonical Authority Map

| Workflow family | Canonical domain/service | Repository/persistence | Authority status |
|---|---|---|---|
| Identity/auth | `identity` services and auth middleware | identity/session tables | Canonical, scope-sensitive |
| Organizations/membership | `organization-onboarding`, `organization-relationships` | onboarding/relationship tables | Canonical, live proof required |
| Programs/claims | `government-assurance` / `GovernmentAssuranceService` | GPA tables and migrations 98–119 | Canonical |
| Evidence/verification | `ClaimVerificationService`, `MetricTruthService`, verified-evidence | GPA evidence/verification and Truth tables | Canonical, adapter boundary needs proof |
| Reconciliation | `ReconciliationQualityService` | `gpa_reconciliation_*` tables | Canonical |
| Risk | `RiskService`, `AssuranceOutcomeRiskIntegrationService` | `gpa_risk_*`, `gpa_money_at_risk*` | Canonical derived authority |
| Findings | existing GPA finding service/repository | finding tables | Canonical |
| Corrective actions | existing CAP service/repository | corrective-action tables | Canonical |
| Decisions | decision services and guards | decision/audit tables | Canonical human authority |
| Truth | Truth Spine / `MetricTruthService` and Agent Fabric Truth Spine | Truth persistence tables and Agent Fabric repositories | Canonical boundary, integration proof required |
| Metrics | Metric Registry / platform adapter | metric definition/result tables | Canonical |
| Reporting/public | reporting and public disclosure services | report/public snapshot tables | Canonical, public safety proof required |
| Agent Fabric | `services/shf-agent-fabric` runtime, policy, tool, Truth services | Agent Fabric local/PostgreSQL stores | Governed framework; execution completeness partial |

No duplicate provider, program, claim, evidence, Truth, metric, finding, CAP, decision, or payment/recovery authority was introduced by this audit.

## State Machine Audit Snapshot

| Workflow | State | Allowed next states | Implemented | Tested | Live-proven | Gap |
|---|---|---|---|---|---|---|
| GPA risk | OPEN | UNDER_REVIEW, RESOLVED, ESCALATED | yes | yes | yes for Wave 3 slices | broad cross-domain proof |
| GPA reconciliation | OPEN | RESOLVED | yes | yes | yes in H-A2 baseline | regression |
| GPA CAP | OPEN | OVERDUE, REMEDIATING, CLOSED | yes | yes | yes in H-B baseline | regression |
| Organization onboarding | DRAFT/PENDING/ACTIVATED | APPROVED, REJECTED, SUSPENDED, EXITED | yes | yes | partial | live API matrix |
| Curriculum import | CREATED/PROCESSING | COMPLETED, FAILED, RETRY | yes | yes | partial | downstream consumer proof |
| Studio submission | SUBMITTED | ACCEPTED, NEEDS_REVISION | yes | yes | partial | full delivery closure |
| Agent task/run | PENDING/ASSIGNED/RUNNING | COMPLETED, FAILED, BLOCKED | partial | yes | not current runtime | durable runtime/terminal proof |
| Public disclosure | DRAFT/REVIEW/PUBLISHED | APPROVED, REJECTED, REVOKED | yes | yes | partial | post-Wave-3 leakage proof |

## Stage A Findings by Priority

### P0 Institutional Integrity

- Agent Fabric runtime, signed ingress, tool/MCP governance, and Agent-to-Truth/Evidence boundaries require a current live runtime proof. Existing V1 documentation explicitly describes a governed framework with simulated/browser-local or future execution elements.
- Truth, Evidence, Metric, Reporting, and Public Disclosure have canonical owners, but multiple adapters and consumers make a single end-to-end acceptance trace necessary.
- Public CivicSure explorer contains `*MockData.js` modules and must be proven not to feed production/public outputs; replace only confirmed live consumer paths.
- Cross-product identity/session and organization scope need representative live isolation acceptance.
- Legal, AI governance, input-security, audit, and public disclosure controls need runtime proof for consequential paths.

### P1 Canonical Workflow Blockers

- Funding → program → service → evidence → reporting handoff is not represented by one current live acceptance trace.
- Organization onboarding → relationships → entitlements → shared agreements lacks broad live lifecycle proof.
- Curriculum/assignment/completion → evidence → credential and Studio → QA → review → deployment handoffs need cross-domain acceptance.
- Trusted-reporting outbox and source-ingestion jobs need producer/consumer/retry evidence.
- Agent coordination/workbench remains a governed V1 support surface, not a durable workflow execution authority.

### P2 Material Product Completion

- Career, calendar, live-learning, opportunities, and impact attribution have service/API surfaces but require consumer and failure/recovery acceptance.
- Several frontend pages have mock or local fallback data modules; each must be classified by actual production consumer before any change.

### P3 UX/Operational Completion

- UI loading/error/stale-state and route-consumer coverage varies across secondary pages.
- Existing large frontend chunks and local development auth fallback are operational concerns, not canonical authority defects.

## Event/Outbox Audit

Known producers/consumers include Trusted Reporting outbox/worker, project submission outbox, external calendar mirror worker, Agent Fabric operational events, truth pipeline events, and multiple local ledgers. The audit found no basis to declare all consumers live-complete. Required follow-up is producer → consumer → retry → terminal failure → replay acceptance, especially for trusted reporting, source ingestion, Agent Fabric internal ingestion, and truth pipeline.

## Stage A Readiness

Stage A inventory, authority map, state-machine snapshot, and dependency ordering are complete enough to begin Stage B. Stage B must start with P0 runtime/integrity proofs and the confirmed CivicSure mock-consumer boundary, then proceed through P1 handoffs. The registry is deliberately conservative and will be updated after each remediation and fresh acceptance run.

## SYS-0A Rebaseline Update — 2026-09-09

Current evidence: migrations/schema, API and Agent Fabric health, governance, focused Agent authority/Truth tests, and CivicSure H-A2/H-B/H-C live PostgreSQL/API layers pass. The broad API run is not a single product failure: 831 passed, 181 failed, 16 skipped, with rate-limit cascades, missing fixture identities, stale source-contract references, and dependent setup errors. No Azure adapter or subscription-backed workflow was found. Existing storage paths remain local/test or repository-owned and require repository-local completion before any Azure-only classification.

WF-040 is now classified `BLOCKED — SAFETY/POLICY` because the Agent Fabric V1 contract intentionally disables production execution and durable workforce persistence. CivicSure WF-007–WF-011 remain COMPLETE on fresh H-A2/H-B/H-C evidence. WF-012 is COMPLETE after SYS-8B1 connected the mounted public explorer/detail consumer to the canonical public projection API with safe filtering and no mock fallback.

## Stage B Execution Update — 2026-09-09

Fresh evidence: PostgreSQL migrations 001–119 and schema integrity PASS; API and Agent Fabric health PASS; focused Agent authority/Truth tests 20 passed; CivicSure H-A2/H-B/H-C live PostgreSQL/API layers PASS; governance, builds, UI contract validation, and diff hygiene PASS. The public GPA summary now fails closed for omitted scope with HTTP 200 and `NOT_PUBLISHED`.

The separate CivicSure explorer package remains a frame-only mock consumer and is not mounted by the active root entry. It is classified as an orphaned/disconnected consumer surface, not canonical public data. Agent Fabric production execution, durable workforce persistence, and external delivery remain explicitly disabled by the V1 safety contract. The broad API suite remains a release-gate FAIL (831 passed, 181 failed, 16 skipped), with rate-limit cascades, fixture identity failures, and stale source-contract failures requiring domain-owner remediation.

## SYS-1A Integrity Rebaseline — 2026-09-09

SYS-1A acceptance rechecked every SYS-1 workflow against current source and
fresh scope, authority, Evidence, Truth, Metric, disclosure, and Agent Fabric
evidence. `PARTIAL` remains appropriate where broader lifecycle, consumer, UI,
event, or SYS-8 live proof is still outstanding; it does not indicate that the
scoped SYS-1A integrity gate failed.

| Workflow IDs | Integrity result | Fresh evidence | Remaining seam |
|---|---|---|---|
| WF-001 | PASS for centralized scope/permission guards | organization/auth/security suites | cross-app session and derived-scope acceptance |
| WF-012, WF-046 | PASS for fail-closed/sanitized public GPA output | public summary and disclosure suites | cross-domain public linkage/revocation proof |
| WF-013, WF-014 | PASS for Truth handoff and platform Metric Registry gates | Truth/Metric boundary tests and governance validators | broad producer/consumer proof |
| WF-015, WF-042 | PASS for admissibility, provenance, and blocked-input gates | input-security/evidence suites | adapter convergence and downstream recovery |
| WF-016 | PASS for scoped approval/publication gates | reporting disclosure suites | complete report dispatch/revocation proof |
| WF-029, WF-030 | PASS for current human approval/disclosure boundary | ARAG/public-approval governance checks | live QA/rollback and deployment dry-run |
| WF-035, WF-036 | PASS for bounded alert and consequential AI restrictions | governance validators and Agent security suite | delivery terminal states and approval/revocation runtime matrix |
| WF-038, WF-039, WF-041 | PASS for current signed/policy/Truth restrictions | Agent Fabric 104-test security run and `/health/ready` | full tool/resource recovery and consumer trace |
| WF-044, WF-045 | PASS for exercised authority/audit helpers | legal/audit/governance checks | complete live approve/revoke and cross-domain trace |
| WF-050 | PASS for exercised scoped bridge paths | auth/org/security suites | cross-product session/data matrix |

No SYS-1A acceptance identified a P0 product defect, duplicate canonical
authority, or reachable public mock-data leak. WF-040 remains
`BLOCKED — SAFETY/POLICY` under the Agent Fabric V1 contract and is not a
product defect. No Azure adapter or subscription-backed workflow was found.

## SYS-2A Shared Platform Closure Update — 2026-09-09

Fresh disposable PostgreSQL evidence closes the core onboarding, relationship,
service catalog, entitlement, and service-agreement primitives. Focused suites
passed approval/decline, activation and replay, relationship compare-and-set,
suspension, revocation, entitlement consumer guards, agreement lifecycle, and
cross-organization scope. A bounded `MembershipService` now uses the existing
`memberships` and `roles` tables for scoped assignment, listing, idempotent
replay, revocation, and audit history; its PostgreSQL regression passed.

SYS-2A's five remaining consumer/recovery workflows were closed by SYS-2B
fresh evidence. WF-032 external account OAuth, encrypted persistence, provider
failure classification, mirror idempotency, and bounded worker dispatch pass
against PostgreSQL with the API running. WF-033's stateless calendar projection
passes real source-domain security projections plus deterministic partial and
hard-failure orchestration. WF-034's live-learning API and cohort consumer path
pass with idempotent attendance outbox handoff; unconfigured Zoom remains a
safe provider boundary. WF-035 persists an idempotent in-app notification from
the canonical outbox event and reaches its READ terminal state. WF-043 persists
scoped operational briefs and outbox events; its Conductor execution boundary
remains intentionally simulation-only under WF-040. The generic outbox worker
also passes retry/final-failure/idempotency tests. The former identity
membership API mutation remains canonical persisted membership behavior.

## SYS-2B Completion Evidence — 2026-09-09

Fresh acceptance used disposable PostgreSQL `shs_sys1a_20260909` on port 55432
with migration 119 and the SHS API on port 8091. The new
`sys2b-shared-platform-consumers.integration.test.ts` persisted and replayed a
lesson-completion notification, verified scoped listing and READ transition,
then persisted a real operational brief and `daily_brief.generated` outbox
event. External calendar integration passed 38/38, external hardening 14/14,
calendar security 9/9, calendar orchestration 9/9, live-learning cohort
eligibility 7/7, provider contract 9/9, operational awareness 4/4, Conductor
policy 6/6, and trusted outbox 12/12. One legacy live-learning security case
expects an unauthenticated development fallback (200), while the current
API correctly returns 401; it is classified `STALE TEST CONTRACT`, not a
product defect. WF-040 remains `BLOCKED — SAFETY/POLICY`.

## SYS-3A3 Evidence Update — 2026-09-09

SYS-3A3 live-proved canonical report-draft review transitions and immutable
revisions, organization-scoped grant mutation, suspended allocation denial, and
human-scoped quarantined outbox recovery. WF-006, WF-016, and WF-017 remain
`PARTIAL` because funding-use authorization, authenticated end-to-end API,
actual final-consumer delivery, browser proof, and broad SYS-3 terminal
acceptance remain open. No duplicate authority or Azure dependency was
introduced.

## SYS-3A4 Lifecycle Evidence Update — 2026-09-09

Fresh disposable PostgreSQL `shs_sys3a4_20260909` with migrations 001–120
live-proved the repository-local funding-use and report-correction seams.
`FundingGrantService.authorizeFundedUse` enforces scoped active-grant,
program-allocation, and effective-period authorization; explicit funding
transitions preserve `SUSPENDED -> ACTIVE` and deny terminal re-entry. The
canonical report draft authority permits rejected-report correction and
resubmission and provides a human-authorized approved-report correction path
using the existing immutable `report_draft_revisions` history.

WF-006 and WF-016 remain `PARTIAL` because authenticated HTTP, browser, and
full final-consumer/current-public-version acceptance remain SYS-3A5 scope. No
new authority or migration was introduced in SYS-3A4. Activity-level limits
remain N/A because the canonical model exposes award/allocation limits only.

## SYS-3A4B Final Lifecycle Evidence Update — 2026-09-09

Fresh disposable PostgreSQL `shs_sys3a4b_20260909` applied migrations 001–121
with no pending, drift, or unknown migrations. The SYS-3A4B live regression
proved the canonical public publication lineage `V1 -> V2`: V1 is published
and current, V2 requires an explicit predecessor, V1 becomes non-current while
remaining persisted history, current public projection resolves V2, duplicate
V2 publication is idempotent, and revoking V2 leaves no current public version
and does not resurrect V1. Publication supersession is represented by the
additive `report_publications.supersedes_publication_id` and
`report_publications.is_current` fields with a scoped partial unique index.

Funding expiration is canonically **date-derived terminal eligibility**, not a
new persisted grant status. The live funding regression proved valid in-period
use, before/after-period denial, suspension denial, denial of resume after the
effective end date, administrative closure, preserved audit history, and final
report retrieval after closure. The funding service rejects `SUSPENDED -> ACTIVE`
after the grant end date, so resume cannot bypass the date-derived terminal rule.

WF-006 is lifecycle-complete for the repository-local funding authority.
WF-016 remains `PARTIAL` at the broader workflow level pending SYS-3A5
integrated HTTP/browser/final-consumer acceptance, while its public versioning
lifecycle is complete. No Azure dependency, payment authority, or duplicate
canonical authority was introduced.

## SYS-3A5 Acceptance Rebaseline — 2026-09-09

Fresh `shs_sys3a5_20260909` PostgreSQL and a self-contained authenticated API
fixture were used. The focused HTTP slice passed funding creation, activation,
allocation, funded-use authorization, wrong-program denial, scoped report draft
creation/review/approval, cross-organization denial, missing reporting
entitlement denial, and revoked-membership denial. The active operator route
rendered through the root Vite entry on port 5174.

WF-016 remains `PARTIAL`: the complete authenticated HTTP publication-to-real
consumer chain, reviewer/public browser acceptance, and broad regression were
not fully run. Agent Fabric remains safely bounded by WF-040 policy, and its
runtime was environment-blocked by a missing `psycopg2` dependency after
Compliance Gate G. No SYS-3 workflow was promoted to COMPLETE in SYS-3A5.

## SYS-3A5B Final Consumer / Runtime Evidence — 2026-09-09

The repository-declared `psycopg2-binary==2.9.11` dependency was installed in
the Agent Fabric virtualenv. Agent Fabric `/health/live` and `/health/ready`
returned 200; Gate G, registry-contract, and runtime-enforcement locks passed.
A real signed `shs.reporting/report.created` event was accepted by the live
Agent Fabric internal ingestion route and its source outbox row became
`DELIVERED`; replay with the same idempotency key returned the same outbox ID.
Unsigned and bad-signature ingress returned 401.

WF-016 remains `PARTIAL`: the active root entry mounts the API-backed operator
reporting route, but no mounted reviewer/public report browser route was found.
The explorer package is frame/mock-only and is not mounted. Broad API execution
was 587 PASS, 26 SKIP, and 429 default-fixture fetch failures, classified as
test harness/environment fixture failures. Query plans and lifecycle indexes
were reviewed, but application query-count instrumentation is not present.

## SYS-3A5C Final Last-Mile Evidence — 2026-09-09

Reviewer approval is a protected service/API workflow and no reviewer browser
route is mounted. The public reporting projection/API is the canonical public
consumer and no public report browser route is mounted; the explorer package is
unmounted frame/mock code. Both browser requirements are canonical N/A.

Real trusted-consumer recovery is complete: connection refusal is retryable,
retry exhaustion reaches `QUARANTINED`, authorized operator recovery returns
the same event to `PENDING`, isolated live Agent Fabric acknowledges it as
`DELIVERED`, and replay preserves the event identity. `ECONNREFUSED` handling
was added to the existing dispatcher classifier with focused regression.

Representative lifecycle plans and indexes passed structural review. Broad
HTTP/schema failures were classified as fixture/environment failures; no
SYS-3-caused product defect remains. WF-016 is complete for the current
canonical API, projection, trusted-consumer, and service boundaries. WF-040
remains `BLOCKED — SAFETY/POLICY`.

## SYS-4A Curriculum / Student Rebaseline — 2026-09-10

Fresh disposable PostgreSQL `shs_sys4a_20260909` applied migrations 001–121 with no pending, drift, or unknown migrations. Self-contained authenticated HTTP acceptance (`sys4a-`) live-proved Program -> Cohort -> Enrollment -> published Course/Unit/Lesson -> learner Assignment -> canonical activity state -> Practice/Reflection/Assessment submissions -> active completion policy -> assignment completion. API reads and database counts confirmed persistence.

WF-020 Enrollment and WF-021 Assignment are `COMPLETE` for this bounded API slice with fresh PostgreSQL evidence. WF-018 Curriculum Catalog is `PARTIAL` because import/document-processing consumer completion remains outside this slice. WF-019 Lessons/Activities/Assessment is `PARTIAL`: canonical activity APIs are live-proven, while mounted StudentUnit still uses static lesson content and legacy browser-local progression. WF-022 Completion remains `PARTIAL` pending downstream outcome/credential/reporting proof. WF-023–026 remain follow-on work; WF-033 and WF-034 retain prior complete status. No production authority or migration changed.
## SYS-4B Guided Lesson / Activity Consumer Integration — 2026-09-10

WF-019 now has repository-local canonical wiring for the mounted
`/curriculum/lessons/:slug` path: the route resolves an active assignment,
loads the organization-scoped published release lesson and learner activity
definitions, submits practice/assessment/reflection through the Activity
Domain, and checks completion through the Assignment Completion Policy
evaluator. The legacy localStorage completion/assessment path is not used by
the mounted route and remains only for the separate legacy preview surface.

SYS-4B remains `PARTIAL` pending fresh live PostgreSQL/API/browser proof of
the mounted happy, failed, retry, refresh, isolation, and next-action paths.
No migration or duplicate authority was introduced. SYS-4C does not start.

## SYS-4B2 Live Acceptance — 2026-09-10

Fresh `shs_sys4b2_20260909` migration/schema checks passed. The focused API
scenario passed 1/1. The active `curriculum.html` StudentUnit route was
browser-proven against the disposable API for canonical assignment/course/
activity loading, assessment submission, policy-gated completion, and visible
completion state. Course-scoped unit resolution and stable-key completion
submission were corrected during acceptance. WF-019 remains `PARTIAL` pending
the complete negative/retry/isolation/refresh/next-action acceptance matrix.
 
## SYS-4B3 Final Negative / Retry / Isolation Evidence — 2026-09-10

Fresh disposable database `shs_sys4b3_20260909` and the mounted
`curriculum.html#/curriculum/lessons/lesson-1` route passed failed-assessment,
retry, duplicate completion, refresh, fresh-session, API-failure/recovery,
cross-org, and revoked-membership acceptance. Two assessment attempts produced
one final completion; replay returned the existing canonical result. The
dashboard assignment consumer moved from one incomplete lesson to
`nothing_to_do` after completion. Database-backed development identities are
authoritative in acceptance mode, so revoked memberships cannot fall through
to legacy demo identities.

WF-019 is `COMPLETE` for the mounted guided lesson/activity consumer boundary.
SYS-4C remains the next dependency-ranked phase for outcomes/mastery and
downstream portfolio, career, credential, and institutional reporting
consumers. No migration or duplicate authority was introduced.

## SYS-4C downstream learner-result audit — 2026-09-10

Fresh `shs_sys4c_20260910` applied migrations 001-121 with no pending, drift,
or unknown migrations and passed schema integrity. The audit confirms
WF-022-WF-026 remain `PARTIAL`: migration 001-121 has no generic curriculum
Outcome, Mastery, or Progress authority; `curriculum_truth_facts` is an
Evidence/Truth projection; Portfolio is Studio-delivery-Evidence-only; Career
pathway is derived from active Enrollment -> Program -> `program_careers`; and
credential eligibility is accepted-capstone-only. No production code or
migration changed. SYS-4C remains incomplete pending the canonical downstream
learner-result handoff and its final consumers.

## SYS-4C2 Learner-result foundation — 2026-09-10

Migration 122 and fresh `shs_sys4c2_20260910` acceptance establish Curriculum
as the canonical owner for generic learner Outcomes, policy-derived Mastery,
and derived Progress. Assessment, practice, and lesson-completion producers
write immutable, idempotent Outcome history; current resolution supersedes
prior results; competency-linked Mastery keeps academic status separate from
Evidence/Truth verification; and `GET /curriculum/learner-results/me` exposes
the provider-neutral contract. WF-022 remains `PARTIAL` for downstream
credential/reporting consumers, while WF-023-WF-026 remain `PARTIAL`. Next
phase is SYS-4C3.

## SYS-4C3 learner-result consumer integration — 2026-09-10

SYS-4C3 is complete for the bounded Curriculum learner-result consumer
slice. Migration 123 adds a Portfolio-owned projection keyed to immutable
Curriculum Outcomes and current policy-derived Mastery; failed or
non-demonstrated results produce no active Portfolio achievement, and
verification remains explicit. The active `/career.html#/portfolio` route
renders the scoped projection and derived Skill Profile. `GET
/careers/pathway/me` preserves Enrollment -> Program -> Career derivation and
adds a read-only learner-result summary. Fresh `shs_sys4c3_20260910`
PostgreSQL, authenticated API, and browser checks proved failure, retry,
current/superseded projection, idempotent replay, scope, provenance, and
consumer rendering. Credential/reporting consumers remain `PARTIAL`; SYS-4C4
is next. No duplicate authority was introduced.
## SYS-4C4 credential policy and reporting update — 2026-09-10

SYS-4C4 remains `PARTIAL`. Additive migration 124 adds versioned bounded
eligibility requirements to the existing Credential Definition authority.
The `curriculum-learner-result.v1` policy requires a current Outcome,
configured Mastery, and explicit verification; fresh PostgreSQL acceptance
proved eligibility, authorized issuance, provenance, pending-verification
denial, and duplicate-issuance protection. Accepted-capstone behavior remains
the default and was not replaced. MetricTruth/report contract tests remain
green, but the complete learner-result -> registered metric result -> reviewed
institutional report consumer chain still requires integrated acceptance.

## SYS-4C4B learner-result MetricTruth/reporting completion — 2026-09-10

SYS-4C4 remains partial for the bounded credential-policy, registered MetricTruth,
and reviewed institutional Reporting slice. The authenticated Curriculum
adapter consumes only current verified learner-result facts, preserves
Outcome/Mastery/Evidence provenance through existing assurance lineage,
calculates the registered curriculum lesson metric through MetricTruth, and
is idempotent on replay. Reporting consumes the MetricTruth result and
definition, and the canonical draft lifecycle was live-proven through
approval on fresh PostgreSQL. Unverified Mastery fails closed. No SYS-4D or
SYS-5 work starts here.

## SYS-4C4B final authenticated consumer acceptance — 2026-09-10

SYS-4C4 is complete for the bounded verified learner result -> registered
MetricTruth -> reviewed institutional Reporting API/projection workflow.
Fresh authenticated HTTP acceptance proved calculation, wrong-program denial,
wrong-organization denial, revoked-membership denial, report creation, human
review, approval, and final consumer read. Metric replay and source
supersession/recomputation were also proven on fresh PostgreSQL. This does not
mark unrelated downstream SYS-4 workflows complete.

## SYS-4 remaining-workflow re-audit — 2026-09-10

The original SYS-4 rows are superseded by this evidence-based classification.
WF-020 through WF-025 are complete for their current bounded workflow
contracts based on SYS-4A, SYS-4B3, SYS-4C2, SYS-4C3, and SYS-4C4B. WF-018 and
WF-026 remain `PARTIAL — ACCEPTANCE GAP`; their implementations and focused
tests exist, but fresh integrated final-consumer acceptance is absent.
WF-033 and WF-034 remain shared-platform `COMPLETE`.

| Workflow ID | Re-audited status | Evidence |
|---|---|---|
| WF-018 | `PARTIAL — ACCEPTANCE GAP` | Import/document routes and tests exist; import-to-learner-consumer acceptance remains open |
| WF-019 | `COMPLETE` | SYS-4B3 mounted StudentUnit closure |
| WF-020 | `COMPLETE` | SYS-4A enrollment/cohort API and PostgreSQL evidence |
| WF-021 | `COMPLETE` | SYS-4A/SYS-4B3 assignment and completion evidence |
| WF-022 | `COMPLETE` | SYS-4B3 completion plus SYS-4C2/C4 policy evidence |
| WF-023 | `COMPLETE` | SYS-4C4 authorized credential issuance and verification evidence |
| WF-024 | `COMPLETE` | SYS-4C3 Portfolio/Skill Profile consumer evidence |
| WF-025 | `COMPLETE` | SYS-4C3 Career pathway augmentation evidence |
| WF-026 | `PARTIAL — ACCEPTANCE GAP` | Career-event/opportunity APIs and security tests exist; fresh visibility acceptance remains open |
| WF-033 | `COMPLETE` | SYS-2B Calendar projection evidence |
| WF-034 | `COMPLETE` | SYS-2B Live Learning evidence |

SYS-4 remains `INCOMPLETE` until WF-026 receives focused career visibility
consumer acceptance. WF-018 is closed by SYS-4C5. No SYS-4D or SYS-5 work starts
from this update.

## SYS-4C5 curriculum catalog/import final consumer acceptance — 2026-09-10

WF-018 is now `COMPLETE` for the canonical structured-import slice. Fresh
`shs_sys4c5_20260910` PostgreSQL and authenticated API acceptance proved source
fixture -> `READY` import job -> preview -> `COMPLETED` execution -> canonical
Course/Unit/Lesson -> review/approval/publication -> release-bound assignment
-> learner catalog/activity API -> mounted `/curriculum/lessons/:slug`
StudentUnit. Invalid source returned 422, cross-organization reads failed
closed, and completed-job replay returned `alreadyCompleted: true`.

Acceptance exposed and fixed one concrete persistence defect with additive
migration 125: imported lesson raw content was retained in candidates but was
not persisted into canonical lessons or immutable release snapshots. The new
`curriculum_lessons.content` JSONB field preserves that source payload through
the canonical learner consumer. WF-026 remains the only open SYS-4 workflow.

## WF-026 final Career visibility acceptance — 2026-09-10

WF-026 is now `COMPLETE`. Fresh `shs_wf026_20260910` PostgreSQL, authenticated
API, shared Calendar projection, and mounted `career.html#/calendar` browser
acceptance proved eligible visibility, wrong-student/program/organization
denial, direct-ID protection, cancellation, expiration suppression, fresh
session reconstruction, and revoked-membership fail-closed behavior. The only
production correction was adding student-tier opening/deadline and event
end-time predicates. All 11 explicitly listed SYS-4 workflows are closed; SYS-5 is the next wave
and was not started.

## SYS-5B durable Build Artifact foundation — 2026-09-10

WF-028 is `COMPLETE` for the repository-local durable artifact contract.
Fresh `shs_sys5b_20260910` PostgreSQL applied migration 126 with no pending,
drift, or unknown migrations and passed schema integrity. Authenticated API
acceptance proved immutable revision-1/revision-2 artifacts, deterministic
same-revision replay, wrong-student and wrong-organization denial, and
revoked-membership fail-closed behavior. Existing QA and Review paths now
persist the exact `artifact_id` they evaluated/submitted. Manifest size is
bounded and its SHA-256 fingerprint is verifiable from immutable source
material. No release, deployment, rollback, Evidence, Registry, or Agent
Fabric authority was added. WF-027 and WF-029 remain acceptance gaps, WF-030
remains a product gap, and WF-049 remains externally blocked.

## SYS-5E WF-029 QA/review/remediation/delivery acceptance — 2026-09-10

WF-029 is now `COMPLETE`. Fresh authenticated HTTP and mounted Builder/QA/Review
acceptance proved failed QA findings, remediation to a new immutable artifact,
QA rerun, review changes requested, resubmission, authorized approval, exact
finalized delivery, stale-lineage denial, replay safety, and scope/revocation
protection. WF-027, WF-028, and WF-030 are already complete. WF-049 remains
`BLOCKED — EXTERNAL DEPENDENCY` because its production Registry provider is
unavailable.

## SYS-6A Agent Fabric Rebaseline - 2026-09-10

SYS-6A confirms seven assigned workflows: WF-036 through WF-041 and WF-043.
WF-043 remains COMPLETE for bounded operational awareness. WF-036, WF-039,
and WF-041 remain `PARTIAL — ACCEPTANCE GAP`; WF-037 and WF-038 remain
`PARTIAL — PRODUCT GAP` because durable production task/session/worker state
and production side-effect execution are absent. WF-040 remains
`BLOCKED — SAFETY/POLICY`; no production workforce execution was enabled.
The next dependency-ranked phase is SYS-6B, durable identity/delegation/
session/task foundation, and it was not started.

## SYS-6B durable identity/delegation/session/task foundation - 2026-09-10

WF-037 is complete for the bounded SYS-6B foundation. Fresh
`shs_sys6b_20260910` applied migration 128 with no pending, drift, or unknown
migrations and passed schema integrity. Authenticated HTTP acceptance proved
durable scoped identity, delegation and entitlement admission, active
identity/session binding, bounded task creation, pre-execution transitions,
failed attempt history, cancellation, replay idempotency, cross-org
safe-not-found, disabled identity denial, and revoked-membership fail-closed
behavior. WF-038 remains `PARTIAL — PRODUCT GAP`; WF-036, WF-039, and WF-041
remain `PARTIAL — ACCEPTANCE GAP`; WF-040 remains `BLOCKED — SAFETY/POLICY`.
No worker, production side effect, MCP mutation, cloud provider, or SYS-6C work
was enabled.

## SYS-6C Durable Governed Execution Foundation - 2026-09-10

Migration 129 and fresh `shs_sys6c_20260910` PostgreSQL/API evidence close the
bounded WF-038 execution-coordination gap. Scoped workers, atomic claims,
leases, durable attempts/checkpoints, bounded retry, lease recovery,
cancellation, delegation revocation, safe-runner allowlisting, idempotency,
and consequential-action denial are implemented and authenticated-HTTP proven.
WF-038 is COMPLETE for this bounded contract. WF-036, WF-039, and WF-041 remain
`PARTIAL — ACCEPTANCE GAP`; WF-040 remains `BLOCKED — SAFETY/POLICY`. No
unrestricted production execution was enabled. Next dependency-ranked phase:
SYS-6D consequence-aware human approval, incident, and revocation acceptance.

## SYS-6D Consequence-Aware Approval / Incident Rebaseline - 2026-09-10

Fresh audit confirms bounded SYS-6B/SYS-6C execution controls, but generic
Agent Task consequential approval is not a durable authority: simulation, MCP,
and ARAG approvals are domain-specific and are not connected to a generic
task/action/approver decision lifecycle. WF-036 is therefore
`PARTIAL — PRODUCT GAP`; WF-039 and WF-041 remain `PARTIAL — ACCEPTANCE GAP`;
WF-040 remains `BLOCKED — SAFETY/POLICY`. No production execution was enabled.
Recommended next phase: SYS-6E, Generic Agent Task Human Approval / Incident
Control Foundation.

## SYS-6E Generic Agent Task Approval / Incident Control - 2026-09-10

Migration 130 and fresh PostgreSQL/service/HTTP evidence complete WF-036's
generic bounded contract: durable proposed actions, deterministic fingerprints,
scoped approval requests, immutable decisions, stale-action invalidation,
cancellation invalidation, and security events. WF-039 and WF-041 remain
`PARTIAL — ACCEPTANCE GAP`; WF-040 remains `BLOCKED — SAFETY/POLICY`. No
unrestricted production execution was enabled. Next phase: SYS-6F
Agent-to-Evidence / Truth / Reporting Acceptance.

## SYS-6F Agent-to-Evidence / Truth / Reporting Acceptance - 2026-09-10

WF-039 is **COMPLETE** for the current bounded contract. A successful bounded
Agent Task Attempt enters existing REVIEWABLE Evidence and reaches accepted
Truth only through GPA admissibility and human verification. Replay,
failed-attempt exclusion, organization isolation, authenticated consumer reads,
and revoked-membership fail-closed behavior passed on fresh PostgreSQL. WF-041
remains `PARTIAL — ACCEPTANCE GAP`; WF-040 remains `BLOCKED — SAFETY/POLICY`.
No unrestricted production execution was enabled. Recommended next phase:
SYS-6G MCP acceptance.

## SYS-6G MCP Cross-Organization / Resource Classification / Secret Boundary / Replay Acceptance - 2026-09-10

Fresh `shs_sys6g_20260910` PostgreSQL and authenticated HTTP acceptance close
WF-041 for the repository-local governed MCP contract. Org/tenant-scoped
server discovery and direct evaluation, canonical resource classification
ceilings, restricted-resource denial, unknown tool/server denial, raw-secret
rejection, input-security scanning, durable simulated invocation records, and
revoked-membership fail-closed behavior passed. A small MCP service correction
now evaluates the persisted resource classification and passes the canonical
resource type into Agent authority; no duplicate MCP or Agent authority was
introduced. No live external MCP provider or production side effect was used.
WF-040 remains `BLOCKED — SAFETY/POLICY`. SYS-6 is ready for final closure with
the intentional safety block recorded; SYS-7 is the next systemwide wave and
was not started.

## SYS-7A External Integrations / Storage / Provider Adapter Rebaseline - 2026-09-10

SYS-7A re-audited the three workflows assigned to SYS-7 by the current
roadmap: WF-030, WF-032, and WF-049. WF-030 and WF-032 remain COMPLETE for
their current repository-local canonical contracts: approval-gated TEST
release and provider-neutral external-calendar account lifecycle respectively.
They do not claim live production provider publication or real Google/Microsoft
traffic. WF-049 is **BLOCKED — EXTERNAL DEPENDENCY**: the local Registry
provider adapter, durable submission state, failure handling, retry, and
idempotency exist, but the production Registry provider is unavailable.
No mandatory Azure-backed SYS-7 workflow, storage product gap, or duplicate
provider authority was found. SYS-7B is not started.

## SYS-8B3 Current Status - 2026-09-11

SYS-8B3 fresh acceptance closed WF-015, WF-013, and WF-042. The current
registry count is 40 COMPLETE, 8 PARTIAL, WF-040 BLOCKED — SAFETY/POLICY, and
WF-049 BLOCKED — EXTERNAL DEPENDENCY. The remaining partial workflows are
WF-006, WF-014, WF-016, WF-017, WF-045, WF-046, WF-047, and WF-048. SYS-8B4 is
the locked next phase and was not started.
