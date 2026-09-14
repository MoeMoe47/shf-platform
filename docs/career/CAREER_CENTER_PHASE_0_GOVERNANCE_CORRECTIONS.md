# SHF Career Center Phase 0: Governance + Correctness Corrections

This phase (CCV2-P0) implements only the foundational corrections identified
by the completed "SHF Career Center V2 + Metaverse Integration Delta Audit."
It changes no Career page content, no route contracts beyond what is
documented below, and no canonical domain authority (Career, Curriculum,
Competency/Evidence, Credentials, Portfolio, Organizations, Opportunities,
Treasury, Reporting/Truth). It is a delta correction, not a redesign.

## 1. Unsupported "32 regional pathways" claim

A repository-wide search (frontend copy, docs, seed/demo content, tests,
public Career and Universe pages) found no occurrence of "32 regional
pathways," "32 pathways," or an OH/MI/PA/WV/IN pathway count anywhere in
active product copy or code. The canonical `careers`/`career_families`
tables (migration `033`) currently seed exactly one career family (Data
Center & AI Infrastructure) and one career. The only static "pathways"
dataset (`src/data/pathways.json`, 25 non-geographic thematic entries) is
legacy and already unused by the live `/pathways` page, which reads
`useCanonicalCareers()` against the real `/careers` API and renders an
honest, dynamic count (`"N pathways shown"`) with an honest empty state
("No active career pathways are published yet.") rather than a fixed claim.
**No copy correction was required because no unsupported claim exists in
active product surfaces today.** No fake pathway records were created. If
"32 regional pathways across OH, MI, PA, WV, and IN" appears in external
planning or marketing material outside this repository, that material
should be corrected or labeled as a target, separately from this repo.

## 2. Civic vs. CivicSure Universe destination correction

The canonical Universe destination registry
(`src/pages/universe-v1/universeDestinationRegistry.js`) previously used
`id: 'civic'` for a record whose entire content was CivicSure (government
program assurance/verification), leaving SHF Civic (the K-12
civic-education/city-participation product at `civic.html`) with no Universe
destination at all.

Correction: the existing CivicSure record was renamed to `id: 'civicsure'`
(no other field changed — `productionPath: '/index.html#/civicsure'` is
preserved exactly, keeping `tests/fe7CivicSure.test.mjs` and
`tests/fe8FinalIntegratedAcceptance.test.mjs` passing unmodified). A new
record with `id: 'civic'` was added for SHF Civic, pointing at
`/civic.html#/` (sourced from `civic.html`, `src/entries/civic.main.jsx`,
and `src/router/CivicRoutes.jsx`, which client-side redirects `/` to
`/dashboard`). The two records now carry distinct ids, labels, and
production paths, and each description explicitly names the other system to
prevent re-conflation.

A downstream OGL rollout-coverage manifest
(`src/system/orientation/rolloutCoverage.js`) and its orientation contracts
(`src/system/orientation/orientationRegistry.js`) cross-validate 1:1 against
Universe destination ids; both were updated in the same way (the existing
CivicSure-only coverage entry and its two orientation contracts renamed from
`civic` to `civicsure`; a new, intentionally minimal `NOT_APPLICABLE`
coverage entry added for `civic`/SHF Civic, since no OGL-owned guided
workflow exists for it and inventing one is out of this phase's scope).

Verification: `tests/universeRegistryPhase0Governance.test.mjs` (new)
asserts the `civic` destination resolves to SHF Civic and never to
CivicSure, that `civicsure` remains distinct, and that no destination id
collides with another. `tests/fe7CivicSure.test.mjs`,
`tests/fe8FinalIntegratedAcceptance.test.mjs`, and
`tests/ogl5RolloutCoverage.test.mjs` continue to pass unmodified in
assertion content (only the coverage/orientation `destinationId` values they
transitively depend on were relabeled to match the corrected registry).

## 3. Impact / outcome governance correction

`src/pages/CareerPathways.jsx` (the live personal `/planner` route) rendered
hardcoded, non-canonical cohort figures from `src/data/impact.js` ("Avg time
to first paycheck," "Avg cost after aid," "90-day employment") inside an
"Impact Snapshot" card, and exposed a browser query-param (`?admin=1`) plus
`localStorage` mechanism that let anyone locally edit and persist arbitrary
replacement figures for that same card, with no real authentication.

No existing governed backend projection covers these specific cohort-outcome
metrics today (the governed reporting clients under `src/shared/reporting/`
cover different, narrower metrics — e.g. verified curriculum lesson
completions, workforce-employment-started counts — not time-to-paycheck,
cost-after-aid, or 90-day employment rate). Per "govern facts, not
ambition," Option B was applied: the override mechanism (the admin toggle,
the Alt+I shortcut, the JSON editor modal, and the `localStorage`-backed
override/default figures) was removed entirely, and the Impact Snapshot card
now renders a bounded, honest state — "Verified outcome data is not
currently available." — with no fabricated numbers. No new Truth or
Reporting authority was created; the surface simply stopped presenting
unverified figures as fact.

Verification: `tests/careerImpactGovernance.test.mjs` (new) asserts the
override mechanism, its storage keys, and the fabricated default figures are
absent from the live component, and that the bounded unavailable state is
present. `tests/ui/career-pathways-dark-mode.spec.mjs` was updated to
verify the replacement state (not the removed admin modal) renders correctly
in dark mode and that the admin controls are gone.

`src/pages/CareerPlanner.jsx` contains the same pre-existing pattern but is
not reachable from any live route (`tests/careerPhase1Canonicalization.test.mjs`
already asserts `CareerRoutes.jsx` never imports it) — it was left unchanged
as out-of-scope dead code, consistent with this phase's non-goal of touching
anything beyond the identified live governance gap.

## 4. Career dashboard canonicalization

`/dashboard` (`CareerDashboard.jsx`) is the canonical personal Career
dashboard. This is not a new decision made by this phase — it is already
encoded in the repository and is reaffirmed here:

- `src/router/paths.js` names it explicitly: `CAREER_DASHBOARD = "/dashboard"`,
  and `CAREER_ROUTE_CONTRACT.personal.dashboard` points at it.
- `CareerSidebar.jsx` lists it first, under "MY CAREER," labeled
  "My Career Center."
- `tests/careerPhase1Canonicalization.test.mjs` already asserts `dashboard`
  is a real route and that it does not show fabricated portfolio counts.

`/dashboard-ns` (`CareerDashboardNorthstar.jsx`) is **not** an undocumented
duplicate or legacy leftover — it is Career's instance of a deliberate,
repository-wide "Northstar" preview-dashboard pattern that also exists,
identically shaped, for Debt, Credit, Civic, Employer, Sales, and Treasury
(each has its own `dashboard` + `dashboard-ns` pair, several with a
`DashboardSwitcher.jsx`). Career's own Northstar surface already
self-discloses as non-production in its own copy — "Demo-only seed
snapshot," "not a production readiness, placement, or outcome record" — and
`tests/careerPhase1Canonicalization.test.mjs` already pins that disclosure.
`CareerSidebar.jsx` labels it distinctly ("Northstar Demo," ⭐ icon) rather
than presenting it as an alternative primary dashboard.

Decision: given this is an intentional, tested, cross-app convention rather
than an accidental duplicate, no redirect was added and no route was
removed — doing either would break parity with the identical pattern in
five other apps and would remove a working, already-labeled preview
surface. Both routes remain live. This decision is recorded here rather
than changing behavior, per the audit's own instruction to document instead
of blindly merging when repository evidence shows the "duplicate" was
intentional.

## 5. Universe / Metaverse baseline test coverage

`tests/universeRegistryPhase0Governance.test.mjs` (new) adds the first
coverage for the canonical Universe destination registry as it actually
exists today (a frontend-only static navigation contract, no backend API):
every destination has a unique id and a well-formed shape (string id, a
`/universe/...` route, a required `productionPath` for same-origin/
independent-app destination types, and non-empty `sourceEvidence`); the
Career and Arcade destinations are present and reuse the existing registry
records; and the Civic/CivicSure separation from Section 2 holds. No backend
API was invented to satisfy this — Universe has none today, and none was
added.

## Verification

`node --test tests/universeRegistryPhase0Governance.test.mjs
tests/careerImpactGovernance.test.mjs tests/fe7CivicSure.test.mjs
tests/fe8FinalIntegratedAcceptance.test.mjs tests/ogl5RolloutCoverage.test.mjs
tests/careerPhase1Canonicalization.test.mjs tests/careerPhase3Canonicalization.test.mjs
tests/careerPhase5PublicProjection.test.mjs tests/careerPublicDesignSystem.test.mjs
tests/fe4StudentCareerExperience.test.mjs tests/fe3ShfPublicExperience.test.mjs
tests/fe5RoleExperiences.test.mjs tests/fe6ShsBosStudio.test.mjs
tests/ecosystemRuntimeRouting.test.mjs` — all pass. No migration, no
database state, and no canonical domain schema changed in this phase.
