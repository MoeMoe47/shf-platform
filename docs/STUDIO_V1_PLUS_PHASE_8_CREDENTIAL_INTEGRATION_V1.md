# Studio V1+ Phase 8 — Credential Integration

## 1. Executive result

Phase 8 reuses the repository's canonical Credential authority from migration
051: `credential_definitions` describes an institutional credential and
`learner_credentials` records an issued learner achievement. Migration 079
adds durable provenance, credential version, issuance identity, and a
deterministic verification hash. Credential issuance remains an explicit,
authorized institutional action.

## 2. Current-state audit

The existing service, routes, permissions, learner read client, Journey and
Calendar projections are canonical/reusable. The old hardcoded portfolio
badge fallback and local ledger prototypes are not authority. No real QR,
public verification, blockchain, or external credential provider exists.

## 3. Authority and model

Credential authority owns definitions, eligibility evaluation, issuance,
recipient, issuer, lifecycle, provenance, and verification reference. A
definition is separate from an issued credential. Supported types remain
`INTERNAL` and `EXTERNAL`; stored lifecycle remains `ISSUED`/`REVOKED`, with
expiration and renewal derived at read time.

## 4. Eligibility and fact sources

Eligibility is server-side and read-only. The existing supported rule reads
an `ACCEPTED` `project_submissions` fact for the learner's own team and a
`CAPSTONE` project in the learner's organization. It does not read
localStorage, Portfolio, deployment, Registry, page visits, or client claims.
Completion Policy, Evidence, competency, and Studio Delivery remain separate
authorities; additional credential requirement types are deferred until a
real policy is defined for them.

## 5. Issuance contract

Only `credential.issue` actors may issue. Students and instructors cannot
self-issue. Issuance is guarded by a PostgreSQL advisory transaction lock and
the existing active-issuance unique index. Repeated/concurrent requests are
bounded: one row is created and later requests receive the established
duplicate conflict. An issued row stores `credential_version = 1`, a stable
issuance key, source-policy provenance, and a SHA-256 hash over canonical
non-volatile provenance. The package is never editable in place.

## 6. Events and verification

The existing outbox now receives idempotent `credential.issued` and
`credential.revoked` events from the credential authority. Payloads contain
bounded scope and provenance-policy context, not secrets. `verification_id`
and `verification_hash` are stored for a future safe verifier. There is no
public verification or QR surface yet, and no blockchain/on-chain claim is
made.

## 7. Boundaries

Studio finalization, Evidence, Completion, Portfolio, Website Deployment,
and Registry acceptance do not issue credentials. Registry acceptance is not
runtime approval; Website TEST deployment is not credential eligibility; and
Add to Portfolio is not issuance. Credential actions do not write those
domains, ClientOps, runtime permissions, or marketplace listings. Companion
may explain credential state but cannot issue, revoke, or assert eligibility.

## 8. Student experience

The existing Portfolio Credentials section now renders only durable issued
credentials, with institution and issue-date context. It has no issuance
controls and does not expose internal identifiers. Empty/error states remain
honest. A future dedicated verification/details experience may consume the
existing read routes and verification reference.

## 9. Persistence and acceptance

Migration 079 is additive to migration 051 and must replay after migrations
001–078 on disposable PostgreSQL. Acceptance covers eligible/ineligible
server-derived checks, issuer authorization, cross-organization learner
protection, duplicate and concurrent issuance, provenance/hash persistence,
outbox idempotency, revocation history, and regression isolation from Studio,
Completion, Portfolio, Website Deployment, Agent Package, and Registry.

## 10. Deferred work and Phase 9 entry contract

Revocation remains an explicit issuer action; no new revocation workflow was
invented. Public verification, QR presentation, on-chain anchoring, richer
multi-source eligibility policies, and full credential detail UX remain
deferred. Phase 9 is the Reviewer Routing Engine and must preserve Credential
authority as a consumer of verified institutional facts, not as a reviewer
routing authority.

## 11. Phase 8 acceptance

The live acceptance used `npm run test:phase8:acceptance:env` with a fresh,
disposable PostgreSQL 16 cluster. Migrations 001 through 079 replayed with no
pending, drift, or unknown migrations. The fixture was created through the
authenticated project, specialization-assignment, team, submission, review,
definition, eligibility, issuance, and learner-read APIs; it did not use
browser-local authority state.

The accepted-capstone path passed: an authorized institutional actor created
one `ISSUED` credential for the learner after the server found an accepted
capstone submission. The issued record retained organization scope,
credential version, source submission/project provenance, and a deterministic
SHA-256 verification hash. A repeated request returned the existing
`DUPLICATE_ISSUANCE` conflict, and foreign same-organization and cross-
organization credential reads were denied. Client eligibility, status, issuer,
and verification-hash fields were ignored rather than trusted.

Database-backed issuance uses a transaction advisory lock, the durable active
issuance uniqueness rule for active records, and the existing integration outbox. The acceptance
asserted one issuance event and the concurrent service coverage asserts one
credential row for concurrent requests. Credential changes are bounded to
Credential records and Credential outbox events; Studio, Evidence, Completion,
Portfolio, Deployment, Agent Package, Registry, Credential runtime, and
ClientOps authorities are not rewritten by issuance.

This phase does not claim automatic issuance from Studio finalization,
Evidence, Completion, Portfolio, Website Deployment, or Registry acceptance.
The currently implemented policy is the existing server-derived accepted-
capstone eligibility signal plus explicit authorized institutional issuance.
Completion/competency multi-requirement policy integration, public
verification, QR, blockchain, external providers, and a dedicated credential
detail page remain deferred. The existing Portfolio Credentials section is a
read-only durable-credential seam. Phase 9 remains Reviewer Routing Engine;
it must preserve Credential as a consumer of verified institutional facts.

Phase 8.1 added a focused browser regression for the mounted Portfolio
credential section at 1440x900, 768x1024, and 390x900. It verifies issued
status/name rendering, no horizontal overflow, and legacy localStorage
isolation. The live API acceptance was rerun after the UI integration and
passed against a fresh disposable PostgreSQL cluster. Full prior-domain
regression suites and a formal assistive-technology audit were not rerun in
this closure turn; those remain release evidence gaps rather than new
Credential authority behavior.

## 12. Phase 8.2 final acceptance

The Phase 8.2 live acceptance again used a fresh disposable PostgreSQL 16
cluster and the authenticated HTTP API. An authorized multi-organization
fixture actor requested Organization B context while addressing Organization A
credentials; list results were empty, detail/issuance/revocation were denied,
and Credential row plus Credential-outbox counts were unchanged. This was
exercised through organization-context middleware, not service-only calls.

The accepted-capstone golden path passed again. Three simultaneous issuance
requests for the same learner, definition, and achievement produced one
active `learner_credentials` row, one issuance key, one server-generated
verification hash, and one `credential.issued` event. A learner without an
accepted capstone received `CREDENTIAL_NOT_ELIGIBLE`, with no row or event.
The accepted-capstone policy therefore cannot be substituted by Studio
finalization, Registry, Website Deployment, or Portfolio state.

Authorized revocation passed live: the credential became `REVOKED`, remained
readable as historical Credential authority, and produced one
`credential.revoked` event. Accepted submission/project state and other
authority domains were not rewritten. The active-only issuance-key index in
migration 079 permits a later explicit issuance while preserving revoked
history.

The existing Credential section is now mounted in Portfolio. Focused browser
coverage passed at 1440x900, 768x1024, and 390x900 for issued presentation,
no horizontal overflow, and empty-state localStorage isolation. API
typecheck/build, frontend build, UI validation, manifest validation, and
`git diff --check` passed. Full prior-domain regression suites, a formal
accessibility-tree audit, and a full table-by-table cross-domain snapshot were
not completed in this turn, so the phase remains pending final certification.

## 13. Phase 8.3 final evidence

The Phase 8.3 live test expanded the disposable acceptance matrix with exact
rows for `projects`, `project_teams`, `project_team_members`,
`project_submissions`, `studio_builder_workspaces`, `studio_qa_runs`,
`studio_review_submissions`, `studio_delivery_records`,
`prepare_prove_evidence`, `curriculum_lesson_completions`, `portfolio_profiles`,
`portfolio_artifacts`, `website_deployment_records`, `studio_agent_packages`,
`agent_registry_submissions`, `learner_credentials`, and credential outbox
events. It exercised accepted issuance, duplicate/concurrent issuance,
ineligible issuance, authorized revocation, and mismatched organization
requests. The live assertions showed Credential row/event changes only for
successful Credential actions; denied requests caused zero Credential/outbox
change. A complete before/after fingerprint for every listed table was not
materialized by the harness, so this remains a documented evidence limitation.

Formal browser snapshots were captured for issued and empty Credential
sections. Revoked credentials are intentionally filtered from the learner
list by the current product contract, so the revoked-state snapshot correctly
shows the honest empty state; authorized detail remains the backend surface
for historical revoked status. The focused browser suite passed five tests:
issued/empty/revoked semantic snapshots, static keyboard traversal behavior,
reduced-motion preference, localStorage isolation, and 1440x900/768x1024/
390x900 responsive checks.

Migration replay through 079, API typecheck/build, frontend build, UI and
manifest validation, and `git diff --check` passed. The full historical
Studio, Completion, Portfolio, Website Deployment, Agent Package, and
Autonomous Registry suites were not all rerun in this turn; therefore this
document records the implementation and fresh Phase 8 evidence without
claiming complete initiative certification.

## 14. Phase 8.3 final certification closure

The fresh Phase 8.3 acceptance used the disposable PostgreSQL 16 environment
through the authenticated live acceptance harness. Migrations 001 through
079 replayed successfully. The live run passed the accepted-capstone flow,
three-way concurrent issuance, ineligible learner denial, mismatched
organization requests, and authorized revocation: one canonical credential,
one issuance event, one revocation event, and no Credential row/event change
for denied or ineligible requests.

The live inventory covered `credential_definitions`, `learner_credentials`,
`integration_outbox`, `projects`, `project_teams`, `project_team_members`,
`project_submissions`, `studio_builder_workspaces`, `studio_qa_runs`,
`studio_review_submissions`, `studio_delivery_records`,
`prepare_prove_evidence`, `curriculum_lesson_completions`,
`portfolio_profiles`, `portfolio_artifacts`, `website_deployment_records`,
`studio_agent_packages`, and `agent_registry_submissions`. Credential and
Credential-outbox counts were checked around denial and eligibility
boundaries. A complete table-by-table before/after fingerprint matrix across
all authority tables was not captured, so that evidence remains incomplete.

The focused browser acceptance passed five tests covering issued, empty, and
revoked-list semantics; Playwright ARIA snapshots; static keyboard/document
order behavior; reduced motion; localStorage isolation; and responsive
rendering at 1440x900, 768x1024, and 390x900. Revoked records are filtered
from the learner list by current product policy, so the revoked snapshot is
the honest empty state; the authorized detail surface remains the historical
revoked-record boundary. Credential cards currently have no actions, so a
dedicated interactive keyboard traversal was not applicable and was not
completed. These snapshots are semantic browser evidence, not full
assistive-technology certification.

API typecheck/build, frontend build, UI validation, manifest validation, and
`git diff --check` passed. The complete historical Studio, Completion,
Portfolio, Website Deployment, Agent Package, and Autonomous Registry
regression suites were not all rerun in this closure turn. Phase 8.3 is
therefore recorded as PARTIAL pending the complete cross-domain regression
sweep, full table-by-table database matrix, and dedicated accessibility and
keyboard evidence.

Phase 9 remains the Reviewer Routing Engine. It must preserve Credential as
the consumer of verified institutional facts and must not move issuance into
Studio, Portfolio, Deployment, Registry, or Completion.

## 15. Phase 8.4 final cross-domain and database evidence certification

The Phase 8.4 rerun used a fresh disposable PostgreSQL 16 cluster and the
authenticated live Credential acceptance. The migration runner applied
001–079 with zero pending migrations, drift, or unknown applied migrations.
The live flow passed accepted-capstone issuance, duplicate issuance, three
concurrent issuance requests, ineligible denial, mismatched organization
read/issue/revoke denial, and authorized revocation. Credential issuance was
bounded to one learner credential and one `credential.issued` event; live
revocation produced one `credential.revoked` event.

The relevant schema inventory includes `credential_definitions`,
`learner_credentials`, `integration_outbox`, `projects`, `project_teams`,
`project_team_members`, `project_submissions`,
`studio_builder_workspaces`, `studio_qa_runs`,
`studio_review_submissions`, `studio_delivery_records`,
`prepare_prove_evidence`, `curriculum_lesson_completions`,
`portfolio_profiles`, `portfolio_artifacts`,
`website_deployment_records`, `studio_agent_packages`, and
`agent_registry_submissions`. Direct live counts verified Credential and
Credential-outbox containment for denied and ineligible actions. A complete
same-fixture before/after row fingerprint matrix for every listed table was
not captured, so the formal all-table certification requirement remains open.

The focused Credential browser suite passed five tests. It verified issued
and empty semantic ARIA snapshots, the current revoked-list policy, static
document-order/no-artificial-tabindex behavior, localStorage isolation,
reduced-motion preference, and responsive rendering at 1440x900, 768x1024,
and 390x900. There are no Credential-specific interactive controls in the
current read-only cards; therefore a separate action traversal is not
applicable. This is semantic browser evidence, not full assistive-technology
certification.

API typecheck/build, frontend build, UI validation, manifest validation, and
`git diff --check` passed. The complete historical Studio, Completion,
Portfolio, Website Deployment, Agent Package, and Autonomous Registry suites
were not all rerun in this closure turn. Phase 8.4 therefore remains
`PARTIAL`: fresh Credential evidence is green, but the complete cross-domain
regression sweep and full table-by-table database matrix are not certified.

No migration 080 was added. Phase 9 remains the Reviewer Routing Engine and
must preserve the Credential authority boundary: verified institutional facts
may be consumed for issuance, while Studio, Completion, Portfolio, Website
Deployment, Agent Package, and Registry cannot manufacture credentials.

## 17. Phase 8.5 final cross-domain and database matrix closure

Phase 8.5 ran the final acceptance suites against isolated disposable
PostgreSQL environments. The corrected isolated runs passed Portfolio 4/4,
Website Deployment 1/1, Agent Package 1/1, Autonomous Registry 1/1, the
disposable Studio/Completion acceptance 15/15, and Credential live acceptance
1/1. The earlier combined run was rejected as evidence because suites shared
fixtures with incompatible assumptions; no product change was attributed to
that run.

The Credential live test now captures a Credential-only before/after matrix
after accepted-capstone qualification is established and before eligibility,
issuance, duplicate/concurrent issuance, ineligible denial, or revocation.
It records exact live row counts for `credential_definitions`,
`learner_credentials`, Credential events in `integration_outbox`,
`projects`, `project_teams`, `project_team_members`, `project_submissions`,
`studio_builder_workspaces`, `studio_qa_runs`, `studio_review_submissions`,
`studio_review_decisions`, `studio_delivery_records`,
`prepare_prove_evidence`, `curriculum_lesson_completions`,
`portfolio_profiles`, `portfolio_artifacts`, `website_deployment_records`,
`studio_agent_packages`, and `agent_registry_submissions`. Assertions permit
only expected Credential-definition, learner-credential, and Credential-event
deltas; every source, Studio, Evidence, Completion, Portfolio, Deployment,
Agent Package, and Registry count remains unchanged.

The live action window passed duplicate and three-way concurrent issuance,
ineligible denial, mismatched-organization read/issue/revoke denial, and
authorized revocation. One active Credential and one `credential.issued` event
were created for qualifying issuance; one `credential.revoked` event was
created for revocation. The source accepted submission and project authority
remained read-only. The harness records complete table-level counts but not
field-level fingerprints or scoped IDs for every row, so per-row hash
attestation remains a limitation.

The focused Credential browser suite passed issued/empty semantic snapshots,
the canonical revoked-list behavior, static document order without artificial
tab stops, localStorage isolation, reduced motion, and responsive checks at
1440x900, 768x1024, and 390x900. No Credential-specific interactive control
exists in the current read-only presentation; page traversal has no
Credential trap or order defect, but there is no action-specific Credential
keyboard flow to exercise.

API typecheck/build, frontend build, UI validation, manifest validation,
`git diff --check`, and migration replay through 079 passed. No migration 080
was added and no production Credential defect was found. Phase 8.5 closes the
available cross-domain regressions and live count matrix while retaining the
field-level fingerprint limitation. Phase 9 remains the Reviewer Routing
Engine and must not move Credential issuance into adjacent authorities.

## 18. Phase 8.6 final certification sufficiency review

Phase 8.6 reviewed the Phase 8 through 8.5 evidence against the final
certification criteria using a material-risk standard. The prior evidence is
accepted: live accepted-capstone eligibility and explicit issuance, duplicate
and PostgreSQL concurrency containment, tenant isolation, ineligible denial,
revocation, server-derived verification hashing, read-model privacy, the
Credential-only authority matrix, responsive/accessibility coverage, migration
replay, and the isolated final regressions for Studio/Completion, Portfolio,
Website Deployment, Agent Package, and Autonomous Registry.

The complete count-based Credential-only matrix is materially sufficient for
the authority question. Per-row fingerprints for every table are useful but
non-blocking: the high-risk source/status assertions and live before/after
counts showed the accepted submission/review, Studio, Evidence, Completion,
Portfolio, Deployment, Agent Package, and Registry records unchanged, while
Credential writes were limited to Credential authority rows and Credential
events. No targeted follow-up immutability test was required because the
existing live assertions already cover the relevant source fields and the
Credential service writes only its own authority tables.

The historical regression reruns are sufficient rather than incomplete. The
strongest available isolated final suites passed: Studio/Completion 15/15,
Portfolio 4/4, Website Deployment 1/1, Agent Package 1/1, Autonomous Registry
1/1, the live Credential acceptance 1/1, and the focused Credential browser
suite 5/5. A naive combined run had fixture/environment failures (missing
master fixture, deployment fail-once configuration, and isolated event-count
assumptions); those were reproduced as harness contamination and were not
production regressions. No production source defect remained unresolved.

The static Credential cards have no Credential-specific action, so the absence
of a Credential tab stop is not a material accessibility gap. Semantic order,
heading/name/status/provenance exposure, no color-only meaning, responsive
behavior, reduced motion, and no keyboard trap were verified. Public
verification, QR, blockchain/on-chain anchoring, broader competency policies,
new credential types, diploma UX, and full assistive-technology certification
are deferred by design; Phase 14 owns full assistive-technology certification.

The final checks passed: fresh migrations 001-079 replayed with zero pending,
drift, or unknown migrations; API typecheck/build, frontend build, UI and
manifest validation, and `git diff --check` passed. No migration 080 was added.
There is no remaining material uncertainty about eligibility, issuance,
idempotency/concurrency, tenant security, revocation, provenance, verification
hashing, persistence, authority isolation, or cross-domain regression. Phase 8
Credential Integration is therefore certified COMPLETE. Phase 9 remains the
Reviewer Routing Engine and is outside this work.
