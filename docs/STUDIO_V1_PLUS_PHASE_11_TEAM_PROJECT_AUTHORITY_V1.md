# Studio V1+ Phase 11 Team Project Authority

## Executive result

Phase 11 adds a minimal durable Team Project Authority for Studio. Teams and memberships are scoped to an organization and tenant; Studio projects explicitly identify `INDIVIDUAL` or `TEAM` ownership. Team authority controls access and contribution only. Review, QA, Completion, Evidence, Credential, Portfolio, Deployment, Agent Package, Registry, and Notification remain separate authorities.

## Current-state audit

The repository already contained legacy institutional `teams` and `memberships`, plus generic `project_teams` and `project_team_members`. Those structures serve staff/team submission foundations and do not provide a canonical Studio learner-team owner, lifecycle, or member authorization boundary. Studio projects were individually owned through `studio_learner_id`. Phase 11 therefore adds a separate, explicit Studio team model rather than reinterpreting legacy staff teams.

## Team authority and model

Migration `082_studio_team_project_authority.sql` creates `studio_teams` and `studio_team_members`. Teams have `ACTIVE` and `ARCHIVED` status, organization/tenant scope, bounded names, creator provenance, and durable timestamps. Memberships have `LEAD` or `MEMBER` roles, `ACTIVE` or `REMOVED` status, individual user identity, join/leave timestamps, and adding-actor provenance. Duplicate active membership is prevented by the database uniqueness constraint.

Studio `projects` now carries `studio_owner_type` and nullable `studio_team_id`. The database requires `TEAM` projects to reference a Studio team and `INDIVIDUAL` projects to have no team. The creating learner remains the authenticated `studio_learner_id` and `created_by_user_id`; Team ownership does not replace human actor provenance.

## Authorization and integration boundaries

Team creation, member addition, removal, and archive-oriented management require the existing scoped `project.team.manage` authority. Team membership is checked at operation time, including project read, workspace contribution, QA access, Review submission, and related Studio reads. Cross-organization and cross-tenant requests fail closed. Client-provided team, owner, organization, tenant, role, and completion fields are ignored for authority decisions.

The current student-idea project route accepts an explicit `teamId` only after server validation of active membership and active team state. Team members may read and update the shared Studio project and submit it for Review; Studio Review remains the decision authority and Reviewer Routing remains the assignment authority. A removed member loses future access while historical project and actor fields remain durable. Assignment targeting is not reinterpreted as Team targeting in this phase; assignment-origin team policy remains deferred until its canonical contract is defined.

QA, Review, Delivery, Evidence, Completion, Credential, Portfolio, Website Deployment, Agent Package, Registry, and Notification do not receive automatic facts from team membership or team creation. A Team project may enter those domains only through their existing explicit APIs and policies. Team membership alone cannot complete learners or issue credentials. Phase 12 owns collaborative revision identity and Phase 13 owns real-time collaboration.

## APIs and UI

The minimal API is `GET /studio/teams`, `GET /studio/teams/:teamId`, `POST /studio/teams`, `POST /studio/teams/:teamId/members`, and `DELETE /studio/teams/:teamId/members/:userId`. Responses are scoped and expose only bounded member identity/role data. The Studio Teams page provides durable team/member state, manager controls, honest empty/error states, and a link from the Studio home. Existing Studio project creation accepts team ownership through the same project route; no duplicate Studio project API was created.

## Events and side effects

Team operations emit bounded `studio.team.created`, `studio.team.member_added`, and `studio.team.member_removed` outbox events with organization and tenant scope. Event identities are operation-specific and idempotent through the existing outbox contract. Team actions directly mutate only `studio_teams`, `studio_team_members`, Studio project ownership metadata when a Team project is created, and the outbox. They do not manufacture Review decisions, Evidence, Completion, Credentials, Portfolio artifacts, Deployments, Packages, Registry submissions, runtime permissions, or ClientOps facts.

## Acceptance evidence

`tests/phase11-team-live.spec.mjs` passed `1/1` against disposable PostgreSQL 16 with migrations `001–082`. It exercised manager team creation, same-organization member addition, forged ownership-field resistance, Team project creation, member read access, foreign-organization denial, member removal, post-removal access denial, durable Team ownership, and four scoped Team outbox events. API typecheck passed and migration replay applied 82 migrations with no pending, drift, or unknown migrations.

## Deferred boundaries

Assignment TEAM targeting, team-specific Completion/Evidence participation policy, collaborative revision lineage, real-time presence, chat, task management, invitations, self-service leave/lead transfer, richer availability, and full assistive-technology certification remain deferred. These are not manufactured by Phase 11.

## Phase 12 entry contract

Phase 12 is Collaborative Revision Model. It will define multi-author revision identity, lineage, contributor attribution, concurrent edits, conflict handling, immutable submitted snapshots, ownership, and merge/version semantics. Phase 11 intentionally does not implement those behaviors.

## Final Team Project initiative verdict

Phase 11 Team Project Authority is **PARTIAL**. The durable team, membership, ownership, removal, event, and cross-organization boundaries are implemented and passed focused live acceptance. Full certification remains open for the complete Team QA → Review Routing → Review Decision flow, downstream Team Deployment/Agent Package/Registry authorization, full cross-tenant mutation coverage, and dedicated responsive/accessibility acceptance.

## PHASE 11.1 FINAL CERTIFICATION

Phase 11.1 used disposable PostgreSQL 16 environments only. Fresh migration replays applied `001–082` with `0` pending, `0` drift, and `0` unknown migrations.

### Executed evidence

* `tests/phase11.1-team-final-live.spec.mjs` passed `2/2`. The live path created Team-owned WEBSITE and AI_AGENT projects, submitted exact revisions for Review, routed and recorded canonical Review decisions, finalized delivery, performed Team-member Website TEST deployment, generated a governed Team Agent Package, submitted it to Registry, rejected same-org nonmember downstream operations, removed a member, archived the Team, and verified durable Team ownership and downstream rows. Three concurrent member-add calls produced one active membership.
* `tests/phase11.1-team-ui-live.spec.mjs` passed `2/2`. Team management passed at `1440x900`, `768x1024`, and `390x900`; overflow, member visibility, keyboard focus, Team-page ARIA snapshot, empty state, and reduced-motion checks passed.
* `tests/phase11-team-live.spec.mjs` passed `1/1` after the Phase 11.1 changes.
* `tests/phase9.4-reviewer-routing-final.spec.mjs` passed `1/1`, and `tests/phase10-notification-live.spec.mjs` passed `1/1` after the Team changes.
* Fresh isolated regressions passed for Portfolio (`4/4`), Agent Package (`1/1`), Registry (`1/1`), and Credential (`1/1`). The strongest Studio/Review path was exercised by the Team final flow and the fresh Reviewer Routing acceptance.

### Targeted production fixes

The live downstream path initially exposed a real authorization gap: Website Deployment, Agent Package, and Registry compared only `studio_learner_id` and rejected active Team members. Their source checks now accept an active, same-organization, same-tenant `studio_team_members` row while retaining manager overrides and canonical scope checks. Reviewer Routing also excludes active members of a Team-owned project from the eligible reviewer pool. Team archive now has a manager-authorized `POST /studio/teams/:teamId/archive` operation and bounded `studio.team.archived` event.

### Boundaries and side effects

The executed Team path verified individual submitting actors, explicit `TEAM` project ownership, exact Review revision binding, separate Review decision creation, TEST deployment terminology, Team provenance in Agent Package/Registry rows, removed-member denial, archive denial for new Team project creation, and no automatic Team Evidence, Completion, Credential, or Portfolio propagation. Existing Team project ownership remained durable after archive. Team events remained scoped to the organization and tenant.

### Sufficiency classification

PASS: Team Review, downstream Deployment, Agent Package, Registry, member removal, archive, concurrent add uniqueness, cross-organization/nonmember denial, responsive Team UI, accessibility baseline, migration replay, and build/validation checks. NON-BLOCKING: the historical Deployment final-acceptance failure-injection test reproduced `expected 400, received 201` twice because its provider-interception fixture did not intercept the request; the Team-owned Deployment acceptance passed and no production defect was reproduced. DEFERRED: Assignment TEAM targeting, self-service leave/lead transfer, collaborative revision, real-time collaboration, chat, task management, and Phase 14 full assistive-technology certification.

The Phase 11.1 result remains **PARTIAL** because the focused final run did not independently execute every requested cross-tenant mutation matrix, full Team-only before/after table matrix, or every downstream denial permutation. No new migration was required. Phase 12 remains the next intended phase, but entry is gated on closing those explicit acceptance evidence gaps.

## PHASE 11.2 FINAL CERTIFICATION

Phase 11.2 performed fresh live acceptance against disposable local PostgreSQL 16 environments. No persistent, production, cloud, or `shs_dev` database was used. Migration replay reported `001–082 applied`, with `0` pending, `0` drift, and `0` unknown migrations.

### Live execution evidence

* `tests/phase11.1-team-final-live.spec.mjs` passed `3/3` after the test-only dual-role fixture correction. The run verified Team project operations, a same-human learner/reviewer-permission self-review denial with unchanged Review/Evidence/Completion counts, cross-tenant Team list/detail/member mutation/project creation/Review submission denial, concurrent remove plus duplicate add resulting in one active and one total membership row, and scoped Team operation side effects.
* `tests/phase4.1-deployment-live.spec.mjs` passed `2/2` in a fresh environment. The authoritative Deployment acceptance verified finalized Website TEST deployment, exact revision preservation, duplicate/concurrent idempotency, newer revision non-deployment, foreign access denial, and AI Agent rejection. The historical `phase4.2` failure-injection test remains a stale interception seam (`expected 400`, received `201`); it is classified as a test defect, not a reproduced production defect.
* `tests/phase11.1-team-ui-live.spec.mjs` passed `2/2` at `1440x900`, `768x1024`, and `390x900`, including overflow, Team management, focus, ARIA snapshot, empty state, and reduced-motion checks. The Studio project API now supplies the backend-derived Team name, and the project surface presents textual `Team Project` ownership when loaded.
* Fresh regressions passed: `phase11-team-live` `1/1`, Reviewer Routing `1/1`, Notification `1/1`, Portfolio/Completion `4/4`, Agent Package `1/1`, Registry `1/1`, and Credential `1/1`. The fresh authoritative Deployment suite passed `2/2`.

### Closure findings

PASS: Team Review path, individual submitting actor provenance, Team ownership persistence, self-review denial, concurrent membership uniqueness, cross-tenant Team API denial, downstream Team Deployment/Agent Package/Registry authorization, archive/history behavior, notification/routing/source-domain regressions, migration replay, and build/validation gates.

The broader active-Team-member conflict rule is enforced by Reviewer Routing eligibility: active members of a Team-owned project are excluded from its reviewer pool. The directly executed denial used the submitting member with review permission; the second-member decision permutation was not separately exercised in this phase.

NON-BLOCKING: the historical Deployment failure-injection test is stale because its interception does not match the current provider path; the authoritative fresh Deployment acceptance passed. DEFERRED: Assignment TEAM targeting, self-service leave/lead transfer, collaborative revision, real-time collaboration, chat/tasks, and Phase 14 full assistive-technology certification.

The complete operation-scoped all-table before/after matrices, formal Studio project ownership ARIA snapshot, and keyboard activation of every Team create/add/remove control were not captured by the current focused live suites. These remain explicit acceptance-evidence gaps rather than production failures. Accordingly, the Phase 11.2 initiative verdict remains **PARTIAL** pending those focused certification artifacts. No migration `083` was required.

## PHASE 11.3 FINAL EVIDENCE CERTIFICATION

Phase 11.3 reran the remaining conflict scenario in a fresh disposable PostgreSQL 16 environment. `tests/phase11.1-team-final-live.spec.mjs` passed `3/3` after extending the test-only fixture so the existing student identity also held `project.submission.review` permission.

### Executed closure evidence

The submitting Team member and a different active Team member were each denied Review decisions for the Team-owned submission. Direct counts for `studio_review_decisions`, `prepare_prove_evidence`, `curriculum_lesson_completions`, and Team membership were unchanged. The Team project and routing state remained intact. This provides live evidence for both submitter and non-submitting Team-member conflict protection.

The same run passed cross-tenant Team list/detail/member-add/member-remove/project-create/Review-submit denial, concurrent remove/add invariants, and bounded Team operation deltas. The fresh authoritative Deployment suite remained green at `2/2`; migration replay remained `001–082 applied` with no pending, drift, or unknown migrations. API typecheck/build, frontend build, UI validation, manifest validation, and `git diff --check` passed.

### Final sufficiency classification

PASS: Team conflict-of-interest protection, Team authority containment, Team ownership persistence, cross-tenant mutation protection, and directly affected Team/Review behavior.

BLOCKED: complete all-table before/after matrices for `TEAM_CREATE`, `MEMBER_ADD`, `TEAM_PROJECT_CREATE`, and `MEMBER_REMOVE`; formal ARIA snapshot on the actual Studio Team-owned project surface; and end-to-end keyboard activation for Team creation, member add, member removal, and navigation into a Team-owned project. The focused live suites were executed, but their current fixtures do not expose the required project navigation and full operation snapshot assertions. No production defect was reproduced, and no migration `083` was added.

NON-BLOCKING/DEFERRED: stale historical Deployment interception test, Assignment TEAM targeting, self-service leave/lead transfer, collaborative revisions, real-time collaboration, and Phase 14 full assistive-technology certification.

Because the required evidence artifacts above remain unexecuted, the final Phase 11.3 certification verdict is **PARTIAL**. Phase 12 is not started.

## PHASE 11.4 FINAL EVIDENCE HARNESS CERTIFICATION

Phase 11.4 performed a fresh focused Team acceptance run against disposable local PostgreSQL 16. `tests/phase11.1-team-final-live.spec.mjs` passed `3/3`. The run included submitting and non-submitting active Team-member Review denial, institutional side-effect containment, cross-tenant Team list/detail/member/project/Review denial, concurrent remove/add uniqueness, and bounded Team operation deltas. Migration replay again applied `001–082` with no pending, drift, or unknown migrations.

The existing Team UI suite passed `2/2` at `1440x900`, `768x1024`, and `390x900`, including Team management, focus visibility, ARIA Team-page semantics, empty state, and reduced motion. The Studio project API and surface now expose backend-derived textual Team ownership; this change was included in the successful frontend build and validation gates.

### Required evidence classification

PASS: Team conflict protection, focused Team authority containment, Team ownership semantics in the API/UI implementation, Team core regression, migration status, API typecheck/build, frontend build, UI validation, manifest validation, and `git diff --check`.

BLOCKED: complete all-table before/after matrices for `TEAM_CREATE`, `MEMBER_ADD`, `TEAM_PROJECT_CREATE`, and `MEMBER_REMOVE`; formal ARIA snapshots on both Team-owned and Individual-owned Studio project surfaces; and keyboard-only create/add/remove/project-navigation flows. The existing live suites were executed, but do not currently provide those complete snapshot and keyboard activation assertions. No production defect was reproduced, and no production source or migration was changed in Phase 11.4.

NON-BLOCKING/DEFERRED: Assignment TEAM targeting, self-service leave/lead transfer, collaborative revisions, concurrent editing, real-time collaboration, chat/comments/tasks, and Phase 14 full assistive-technology certification.

The final Phase 11.4 verdict remains **PARTIAL** because the requested evidence harness closure was not complete. Phase 12 remains unstarted.

### Phase 11.4 execution addendum

The new test-only helper `tests/helpers/team-authority-snapshot.mjs` was executed against the live disposable database. `tests/phase11.4-evidence-live.spec.mjs` completed its DB test PASS: isolated Team creation, member addition, Team project creation, and member removal windows captured complete inventories across the available Team, Studio, QA, Review, routing, institutional-result, downstream, notification, and outbox tables. The observed deltas were bounded to Team/outbox or project/workspace/outbox rows; Team ownership was verified as `TEAM:<team_id>` and removal preserved the historical membership row.

The browser test was attempted twice. The first attempt exposed a fixture role mismatch; changing to the provisioned instructor identity did not expose the Team manager form, and the second attempt timed out waiting for the labeled `Team name` control. This is classified as a TEST FIXTURE/UI HARNESS BLOCKER. No production defect was reproduced. The existing Team UI suite remains the authoritative PASS for responsive layout, focus, Team ARIA baseline, empty state, and reduced motion, but the new keyboard activation path and formal Studio project ownership snapshots remain unproven.

Final Phase 11.4 classification: PASS for the four live DB matrices and consolidated bounded mutation evidence; BLOCKED for formal Team/Individual project ARIA contrast and complete keyboard create/add/remove/project navigation. No production source or migration changed in Phase 11.4. The initiative verdict remains **PARTIAL** and Phase 12 remains unstarted.

## PHASE 11.5 BROWSER FIXTURE + FINAL ACCESSIBILITY CERTIFICATION

Phase 11.5 first reproduced the prior browser blocker in a fresh disposable PostgreSQL 16 environment. `admin_A` was present in the browser bootstrap and had the canonical `project.team.manage` permission, but `/curriculum.html#/studio/teams` rendered the student view: the Team page heading was present while the `Team name` field and manager form were absent. The cause was a production integration defect, not missing database fixture data: the live curriculum entry mounted `AuthProvider` and `RootProviders` but not the existing `UserProvider`, so `StudioTeams` received the context default role `student`.

The smallest safe fix mounted the existing `UserProvider` around the curriculum route tree in `src/entries/curriculum.main.jsx`. No authorization bypass, browser mock, API interception, or migration was added. After the fix, the same disposable fixture exposed the real manager form and authenticated API requests remained server-authorized.

### Fresh browser evidence

`tests/phase11.4-evidence-live.spec.mjs` passed `2/2` in a fresh disposable environment. The first test captured and asserted the complete operation-scoped Team authority DB matrices. The second test executed the repaired browser fixture and passed all of the following: manager form availability, keyboard-only Team creation, keyboard-only member add, keyboard-only member removal, backend membership verification, backend-derived Team-owned project creation, formal Team-owned Studio project ARIA snapshot, formal Individual-owned Studio project ARIA snapshot, textual Team-versus-Individual ownership contrast, and keyboard-only navigation from the canonical Studio project list into the Team-owned project. The run replayed migrations `001–082` with no pending, drift, or unknown migrations.

The Team-owned accessibility tree exposed the Studio project heading, project name, `Team Project`, and the resolved Team name through the actual `.studio-page` surface. The Individual-owned snapshot exposed its project identity and did not expose `Team Project`. Ownership was therefore distinguishable programmatically without color, icon-only meaning, tooltip-only meaning, or raw Team IDs.

The existing `tests/phase11.1-team-ui-live.spec.mjs` was rerun after the fix and passed `2/2`, including desktop/tablet/mobile layout, focus visibility, Team-page ARIA semantics, empty state, and reduced-motion behavior. No mature downstream domain was changed by Phase 11.5; the fresh Phase 11.2–11.4 PASS evidence for Reviewer Routing, Studio/Review, Notifications, Completion, Portfolio, Deployment, Agent Package, Registry, Credential, and DB containment is reused.

### Defect and certification result

Production defect found: missing `UserProvider` mount in the curriculum entry. Production defect fixed: existing provider mounted at the application boundary. Regression evidence: the Phase 11.5 browser/evidence suite and Phase 11.1 Team UI suite both passed after the fix. Fixture/test defects: the prior custom browser bootstrap and stale direct form wait were corrected by reusing the established `pageFor` authentication path and canonical hash route; accessible selectors are now used for the tested controls.

Final Phase 11.5 classification: PASS for manager fixture availability, Team and Individual ownership accessibility snapshots, ownership contrast, keyboard Team creation/add/removal/project navigation, reduced motion, focused Team UI regression, and validation. No material Team authority or accessibility risk remains. DEFERRED/non-blocking: Assignment TEAM targeting, self-service leave/lead transfer, collaborative revisions, real-time collaboration, chat/comments/tasks, and Phase 14 full assistive-technology certification. Phase 12 remains unstarted and is the next entry contract.

Final Phase 11.5 Team Project initiative verdict: **COMPLETE**.
