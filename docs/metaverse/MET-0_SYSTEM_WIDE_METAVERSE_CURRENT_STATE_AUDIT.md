# MET-0 System-Wide Metaverse Current-State Audit

Audit date: 2026-09-14  
Repository: `/Users/mikeslate/Projects/shrv1`  
Expected branch: `studio-v1-plus-development`  
Verified branch: `studio-v1-plus-development`  
Verified HEAD: `aa81cf244091420e4d7be9b7759a3c8909e3253c`  
Accepted baseline/tag: `system-reconciliation-complete-2026-09-14`

## 1. Executive Result

The repository does **not** currently contain a canonical Silicon Heartland city-scale student metaverse implementation. It contains several strong reusable systems that can support one:

- A canonical Universe landing/directory with a single destination registry.
- Live Career, Curriculum, Arcade, SHF Civic, Treasury, Credit, Store, Employer, Portfolio, Credential, Evidence, Truth, Identity, Accessibility, and Reporting systems.
- A substantial Data Center curriculum/proof pathway with active lessons and backend-reviewed simulated infrastructure proof activities.
- Backend authorities for identity/organization scope, Arcade mastery, credential issuance, curriculum learner outcomes, evidence projection, Truth facts, and portfolio learner-result projection.

The missing core is the metaverse layer itself: no canonical city map, district registry, city office registry, learner progression/unlock contract, metaverse job/task framework, or integrated city economy currently binds those systems into a bounded Silicon Heartland city experience.

Final verdict: **MET-0 COMPLETE - READY FOR MET-1**, with P0 architecture blockers to resolve before implementation.

## 2. Repository Baseline

Verified by local git inspection:

- Branch: `studio-v1-plus-development`
- HEAD: `aa81cf244091420e4d7be9b7759a3c8909e3253c`
- Audit mode: documentation-only
- No production code changes, migrations, commit, push, delete, or owner-work rewrites performed.

Primary evidence inspected includes:

- `src/pages/universe-v1/UniverseApp.jsx`
- `src/pages/universe-v1/universeDestinationRegistry.js`
- `src/pages/universe-v1/gateway/UniverseGateway.jsx`
- `src/router/ArcadeRoutes.jsx`, `CareerRoutes.jsx`, `CivicRoutes.jsx`, `TreasuryRoutes.jsx`, `CreditRoutes.jsx`, `StoreRoutes.jsx`, `CurriculumRoutes.jsx`, `EmployerRoutes.jsx`
- `apps/shs-api/src/domain/arcade/*`
- `apps/shs-api/src/domain/prepare-prove/service/prepare-prove-service.ts`
- `apps/shs-api/src/domain/verified-evidence/*`
- `apps/shs-api/src/domain/portfolio/service/portfolio-service.ts`
- `apps/shs-api/src/domain/credentials/*`
- `src/content/curriculum/data-center-pathway-map.json`
- Data Center lesson folders under `src/content/lessons/data-center-*-student/`
- `package.json`

## 3. Existing Entry Points

True current metaverse-relevant entry points:

1. `/universe` and `/universe.html` mount the canonical Universe cinematic/directory implementation through `UniverseApp.jsx`.
2. `/universe/directory` renders the gateway/destination directory from the canonical Universe registry.
3. `/arcade.html#/metaverse/growth-observatory` and `/arcade.html#/metaverse/bfe-test` are experimental/isolated metaverse-labeled pages under Arcade.
4. `/arcade.html#/dashboard`, `/career.html#/`, `/civic.html#/`, `/treasury.html#/dashboard`, `/credit.html#/dashboard`, `/store.html#/catalog`, `/curriculum.html#/curriculum/...`, and `/employer.html#/dashboard` are independent app entry points referenced by Universe and/or relevant to future city systems.

There is no `/metaverse` top-level app, no city entry route, and no canonical city environment route.

## 4. Universe Relationship

The existing Universe is **not the student city metaverse**. It is a canonical ecosystem navigation shell with reusable destination infrastructure.

Evidence:

- `UniverseApp.jsx` states it is the single canonical implementation for the Universe landing, mounted from root and `/universe.html`.
- `universeDestinationRegistry.js` is explicitly the single destination authority for Universe navigation.
- `UniverseGateway.jsx` renders the directory from the registry and is isolated from the cinematic scene.
- Registry entries include `career`, `curriculum`, `arcade`, `civic`, `treasury`, `credit`, `store`, `employer`, CivicSure, and SHF Civic as destinations.

Correct relationship:

`Universe` can serve as the outer ecosystem gateway to a future `Metaverse/City` destination, but it is not currently a city simulation and should not be treated as the metaverse engine.

CivicSure boundary:

- Universe has `id: 'civicsure'`, title `CivicSure`, production path `/index.html#/civicsure`.
- Universe separately has `id: 'civic'`, title `SHF Civic`, production path `/civic.html#/`.
- This correctly preserves the boundary that CivicSure is not the student metaverse civic system.

## 5. Existing World/City Technology

Current implementation:

- Universe uses React DOM, CSS, static image assets, and canvas particle effects for cinematic/gateway visuals.
- Universe destination hit targets are positioned over a master image; this is spatial navigation for destinations, not a city map.
- `UniverseGateway.jsx` uses a canvas `SolarDustCanvas`, reduced-motion handling, and destination rendering from the registry.
- Archived legacy Universe code exists under `src/_archive/universe-legacy-pre-canonical-v1/`, including a React Three Fiber canvas, but it is archived and not the live implementation.

Installed/supporting libraries:

- React 19 / React Router 7 / Vite 7
- `three`, `@react-three/fiber`, `@react-three/drei`
- `globe.gl`, `react-globe.gl`, `three-globe`, `d3-geo`
- `mapbox-gl`, `maplibre-gl`
- `framer-motion`
- Existing operational maps/globes in exchange/globe components

Not found as live metaverse implementation:

- No Phaser or Babylon dependency.
- No canonical city map.
- No district/building registry.
- No 2D/3D city scene engine.
- No city office/spatial navigation registry.
- No city-scale mapbox/maplibre layer for student metaverse.

## 6. Existing Career Integration

Existing Career surfaces:

- `career.html#/` routes to public Career entry.
- Routes include dashboard, assignments, calendar, portfolio, learn, planner, pathways, pathway detail, career detail, discovery, opportunities, employers, resume, rewards, credit report, marketplace, coach, help, settings.
- Backend career pathway authority exists in `career-pathways/service/career-pathway-service.ts`.

Backend career authority:

- Program-to-career mappings are admin/program-manager managed.
- Learner pathway relevance is derived from active enrollments and program-career mappings.
- Career events support audience scoping and pathway relevance.

Data Center career readiness:

- `docs/career/records/DATA_CENTER_AI_INFRASTRUCTURE.pathway-record.json` identifies Data Center & AI Infrastructure as a pathway record.
- It lists Data Center Technician as an existing canonical career and flags Network/Electrical/HVAC/Cybersecurity/Cloud-AI technician roles as needing separate career phases.
- It explicitly prohibits job-ready, credential, employer validated, and guaranteed employment claims.

Missing:

- No code was found that unlocks metaverse jobs/tasks from credentials, milestones, mastery, badges, or certifications.
- No canonical metaverse job registry.
- No role progression framework for Data Center Technician, Network Technician, Civic Clerk, Treasury Analyst, etc.
- No employer/career demonstration route that consumes metaverse task evidence.

## 7. Existing Arcade Integration

Frontend Arcade:

- `ArcadeRoutes.jsx` defines dashboard, classical arcade, history, games, leaderboard, rewards, tournaments, notifications, help, and two metaverse-labeled routes.
- `src/data/arcade.js` contains local fallback arcade game metadata for Debt Hunter, Career Match Rush, Client Service Simulator, and Resume Builder Quest.
- `useArcadeLedger.js` records local credit ledger, wallet, and optional Polygon events, but this is frontend/local integration.

Backend Arcade:

- `apps/shs-api/src/domain/arcade/service/arcade-service.ts` provides real Arcade Activity, Attempt, and Result authority.
- Mastery is server-derived by `deriveMastery()` from activity policy. The client cannot submit a mastered boolean.
- `arcade.resulted` outbox events are enqueued to `shs-verified-evidence`.

Current classification:

- Standalone games/practice UI: yes.
- Curriculum-linked practice: partial; backend activities may carry `lessonId`, and migration `064_curriculum_resource_arcade_linkage.sql` exists, but visible game pages do not appear to drive the backend Arcade attempt/result API.
- Evidence-producing learning: yes in backend when `/arcade/attempts/:id/result` is used and evidence rules exist.
- Metaverse task engine: no.

## 8. Existing SHF Civic Integration

SHF Civic routes:

- `/civic.html#/dashboard`
- `/dashboard-ns`
- `/micro-lessons`, `/assignments`, `/lesson`, `/lesson/:id`
- `/elections`
- `/proposals`
- `/treasury-sim`, alias `/treasury`
- `/debtclock`
- `/grant-story`
- `/leaderboard`
- `/snapshots`
- `/survey`
- `/profile`
- `/journal`
- `/badges`
- `/notes`
- `/portfolio`
- `/notifications`
- `/rewards`
- `/settings`
- `/help`
- `/operator/onboarding`
- `/operator/accommodations`

Reusable civic concepts:

- Practice elections/votes.
- Proposals and proposal voting.
- Treasury simulation snapshots.
- Civic mission logs.
- Badges, points, and leaderboard.
- Civic profile activity timeline.
- Constitution journal.

Current civic authority:

- Most SHF Civic learner state is localStorage-backed (`civic:*`, `wallet:history`, `portfolio:items`, `evidence:pack`).
- No canonical student government backend authority was found.
- No city offices, office eligibility, simulated office terms, councils, ballots, or official city-level role registry exist.

CivicSure separation:

- CivicSure lives under a separate route/product and must remain public-program assurance, not the student civic simulation.

## 9. Existing Treasury/Economy

Current economy surfaces:

- Treasury app routes include dashboard, assets, ledger, transaction detail, proofs, operator, settings, help, and portfolio.
- Credit app routes include dashboard, report, reports, disputes, furnishers, consumers, verifier, settings, help, and portfolio.
- Store routes include catalog, marketplace, verify, my items, FAQ, about, and notifications.
- SHF Civic TreasurySim has a local budget allocator and snapshot system.

Current ledgers/reward stores:

- `src/shared/ledger/ledgerClient.js`: localStorage key `ledger:events:v1`, generic event ledger.
- `src/shared/credit/CreditProvider.jsx`: localStorage key `shf:credit:events`, score/tier events with best-effort POST to `/api/credit/events`.
- `src/utils/creditLedger.js`: localStorage key `shf.credit.ledger.v1`, hash-chained local ledger with credits, tokens, and `currencyDelta`.
- Civic uses `wallet:history`, `civic:kpi:*`, `civic:treasury:*`.
- Arcade frontend can append local credit ledger entries and optional wallet/Polygon events.

Current classification:

- Multiple disconnected reward/economy concepts.
- No single canonical student Treasury ledger found.
- No server-side SHF dollar/student balance authority found for the metaverse.
- No evidence that credits or SHF dollars are blockchain tokens; the safe interpretation is simulated/local or application-specific until a canonical ledger is defined.

## 10. Identity / Organization Boundary

Canonical backend identity/organization boundary:

- `req.user` is the actor source.
- `requirePermission()` requires authenticated user, active organization, tenant id, and permission.
- Domain services derive `organization_id`, `tenant_id`, `user_id`, roles, and permissions from the actor.
- Arcade, credentials, career events, prepare/prove, portfolio, and evidence services all scope by organization/tenant/user.

Important current patterns:

- Active tenant is `tenant:${organizationId}` in several services.
- Students cannot self-issue credentials.
- Students can only see their own credentials/portfolio/arcade attempts where applicable.
- Admin-tier roles can see organization-level data in bounded ways.

Metaverse requirement:

Future metaverse code must reuse `req.user`, active organization, tenant, roles, permissions, enrollments, assignments, mastery, and credentials. It must not create a second identity, role, school, organization, or entitlement system.

## 11. Evidence / Truth / Reporting Boundary

Existing safe path pieces:

- Arcade result -> outbox `arcade.resulted`
- Prepare/Prove competency review -> outbox `competency.reviewed`
- Verified evidence projection supports source types including `ARCADE_RESULT`, `INSTRUCTOR_VERIFICATION`, `LESSON_COMPLETION`, `STUDIO_DELIVERY`, and others.
- `projectAuthoritativeOutboxEvent()` resolves source row/learner/org from persistence, not browser input.
- `curriculum_truth_facts` can be emitted and adapted to Truth Spine facts with `toTruthSpineFact()`.
- Portfolio supports learner-result projection from curriculum outcomes/mastery.
- Portfolio direct artifact creation from evidence currently accepts only Studio delivery evidence.

Current safe conceptual path where already supported:

`Arcade/backend result or Prepare-Prove reviewed decision -> Integration Outbox -> Verified Evidence projection -> prepare_prove_evidence and/or curriculum_truth_facts -> Truth Spine adapter -> portfolio learner-result projection/skill profile -> reports`

Missing for metaverse:

- No `METAVERSE_TASK_RESULT` source type.
- No evidence rule source for metaverse job/task actions.
- No canonical metaverse action event schema.
- No direct portfolio artifact intake for Data Center prepare/prove evidence.
- No institutional report slice for metaverse city/job/civic participation.

## 12. Accessibility Boundary

Reusable accessibility systems:

- `AccessibilityProfileContext.jsx`
- `EffectiveAccessibilityContext.jsx`
- `AccessibilityPreferences.jsx` adapter
- `src/system/accessibility/accessibilityConstitution.js`
- `src/styles/curriculum-a11y.css`
- `apps/shs-api/src/domain/accessibility-content/*`
- Tests in `tests/aielPhase4CurriculumAccessibility.test.mjs`

Existing capabilities include:

- Reduced motion ownership.
- Text scale and high contrast partial support.
- Captions preference integration for lesson media.
- Keyboard/focus-emphasis concepts.
- Accessible content representations for curriculum/DGAL sources.
- Mobile/tablet responsive shell work in Career, Civic, Arcade, Curriculum styles.

Metaverse requirements:

- Keyboard navigable spatial equivalents.
- Reduced-motion static mode.
- Screen-reader destination/task list.
- Color-independent affordances.
- Captions/transcripts for any audio/video.
- Non-spatial list/task interface equivalent.
- Mobile/tablet layouts.
- Accessible substitutes for time/precision/action games.
- No mandatory 3D/canvas-only completion path.

## 13. Data Center Existing Assets

Reusable now:

- `src/content/curriculum/data-center-pathway-map.json`
- 168 Data Center lesson JSON files under `src/content/lessons/data-center-*-student/`
- Active grades 6-11 and executable grade 12 specialization slices.
- 41 Prepare/Prove proof configs in `prepare-prove-service.ts`.
- Proof activity UI wiring via curriculum lesson `proofActivity` fields.
- Data Center UI specs under `tests/ui/data-center-*.spec.mjs`.
- Career pathway record: `docs/career/records/DATA_CENTER_AI_INFRASTRUCTURE.pathway-record.json`

Requires adaptation:

- Portfolio direct artifact intake for `SIMULATED_INFRASTRUCTURE_PROOF`.
- Career records for Network/Electrical/HVAC/Cybersecurity/Cloud-AI roles.
- Data Center district destination in Universe/metaverse city registry.
- Metaverse job task definitions tied to existing proof activities.

Curriculum only:

- Grade 6-12 lesson content and pathway map.

Career only:

- Data Center & AI Infrastructure pathway record and employer validation docs.

Visual only:

- Arcade Data Center-adjacent imagery is not a Data Center district.
- Universe assets are ecosystem/celestial, not city/facility maps.

Missing:

- City Data Center district/facility route.
- Data Center spatial asset set.
- Data Center job simulation route/engine.
- Data Center evidence-to-portfolio direct artifact flow.
- Data Center employer demonstration surface.

## 14. Route Inventory

| URL/path | Owning app | Component/page | Status | Relationship to future metaverse |
|---|---|---|---|---|
| `/universe` | Universe | `UniverseApp.jsx` | Real | Ecosystem gateway; not city metaverse |
| `/universe.html` | Universe | `UniverseApp.jsx` | Real | Alternate Universe entry |
| `/universe/directory` | Universe | `UniverseGateway.jsx` | Real | Reusable destination directory |
| `/career.html#/` | Career | `CareerHomePlaceholder.jsx` | Real | Career entry |
| `/career.html#/pathways` | Career | `PathwaysExplore.jsx` | Real | Future pathway-to-job source |
| `/career.html#/pathways/:pathwaySlug` | Career | `PathwayDetail.jsx` | Real | Future Data Center pathway source |
| `/career.html#/careers/:careerSlug` | Career | `CareerDetail.jsx` | Real | Future job profile source |
| `/career.html#/portfolio` | Career | `Portfolio.jsx` | Real | Learner career portfolio |
| `/career.html#/opportunities` | Career | `PublicOpportunities.jsx` | Real | Employer/career connection surface |
| `/career.html#/employers` | Career | `PublicEmployerDirectory` | Real | Employer directory surface |
| `/arcade.html#/dashboard` | Arcade | `ArcadeDashboard.jsx` | Real | Learning Arcade home |
| `/arcade.html#/classical-arcade` | Arcade | `ClassicalArcadeRoom.jsx` | Real | Game/practice environment |
| `/arcade.html#/games` | Arcade | `ArcadeLibrary.jsx` | Real | Arcade game catalog |
| `/arcade.html#/leaderboard` | Arcade | `Leaderboard.jsx` | Real | Progress/reward surface |
| `/arcade.html#/rewards` | Arcade | `Rewards.jsx` | Real | Rewards surface |
| `/arcade.html#/metaverse/growth-observatory` | Arcade | `GrowthObservationTower.jsx` | Placeholder/visual | Experimental metaverse-labeled node |
| `/arcade.html#/metaverse/bfe-test` | Arcade | `BFETestPage.jsx` | Experimental/brittle | Fetches hardcoded localhost BFE summary; not student metaverse |
| `/civic.html#/dashboard` | SHF Civic | `CivicDashboard.jsx` | Real | Civic learning home |
| `/civic.html#/elections` | SHF Civic | `Elections.jsx` | Local/demo civic | Reusable concept for simulated elections |
| `/civic.html#/proposals` | SHF Civic | `Proposals.jsx` | Local/demo civic | Reusable proposal/vote mechanics |
| `/civic.html#/treasury-sim` | SHF Civic | `TreasurySim.jsx` | Local/demo civic | Reusable budget simulation concept |
| `/civic.html#/snapshots` | SHF Civic | `TreasurySnapshots.jsx` | Local/demo civic | Scenario history |
| `/civic.html#/profile` | SHF Civic | `ProfileResults.jsx` | Local/demo civic | Civic profile/activity view |
| `/civic.html#/journal` | SHF Civic | `ConstitutionJournal.jsx` | Real local journal | Reflection/civic writing source |
| `/civic.html#/portfolio` | SHF Civic | `Portfolio.jsx` | Local/demo portfolio | Not canonical backend portfolio |
| `/treasury.html#/dashboard` | Treasury | `Dashboard.jsx` | Real UI | Treasury surface; no canonical student economy found |
| `/treasury.html#/ledger` | Treasury | `Ledger.jsx` | Real UI | Ledger view; app-specific |
| `/treasury.html#/assets` | Treasury | `Assets.jsx` | Real UI | Future economy display candidate |
| `/treasury.html#/proofs` | Treasury | `Proofs.jsx` | Real UI | Proof surface candidate |
| `/credit.html#/dashboard` | Credit | `Dashboard.jsx` | Real UI | Credit/reward system |
| `/credit.html#/report` | Credit | `CreditReport.jsx` | Real UI | Credit report surface |
| `/credit.html#/verifier` | Credit | `Verifier.jsx` | Real UI | Verification concept |
| `/store.html#/catalog` | Store | `StoreCatalog.jsx` | Real UI | Future spending/reward catalog candidate |
| `/store.html#/my` | Store | inline placeholder | Placeholder | Purchases missing |
| `/curriculum.html#/curriculum/learning` | Curriculum | `Learning.jsx` | Real | Canonical learning surface |
| `/curriculum.html#/curriculum/lessons/:slug` | Curriculum | `StudentUnit.jsx` | Real | Data Center lessons reachable |
| `/curriculum.html#/curriculum/instructor/prove/:evidenceId` | Curriculum | `PrepareProveReview.jsx` | Real | Competency review surface |
| `/curriculum.html#/curriculum/grade12-entry` | Curriculum | `Grade12EntryGate.jsx` | Real | Data Center specialization gate |
| `/employer.html#/dashboard` | Employer | `Dashboard.jsx` | Real UI | Employer/career demo candidate |
| `/employer.html#/portfolio` | Employer | `Portfolio.jsx` | Real UI | Employer portfolio view candidate |
| `/index.html#/civicsure` | CivicSure | CivicSure app | Real separate product | Must not merge into student civic simulation |

## 15. Reusable Components

- Universe destination registry and gateway.
- React route shells for Career, Arcade, Civic, Treasury, Credit, Store, Curriculum, Employer.
- Arcade backend mastery/activity model.
- Prepare/Prove proof activity and competency review model.
- Data Center curriculum/proof configs.
- Credential definitions, eligibility, issuance, certificate services.
- Portfolio learner-result projection and skill profile.
- Verified evidence and Truth fact projection.
- Identity/permission guard and active organization/tenant model.
- Accessibility profile/effective runtime and content representation service.

## 16. Existing Backend Authorities

Do not duplicate these:

- Identity/roles/permissions: `apps/shs-api/src/auth/*`
- Organization/tenant context: actor `organization_id`, `active_organization_id`, `tenant_id`
- Career pathway authority: `career-pathways/service/career-pathway-service.ts`
- Career event audience/pathway relevance: `career-events/service/career-event-service.ts`
- Arcade mastery authority: `arcade-service.ts` and `deriveMastery()`
- Prepare/Prove evidence and competency decision authority: `prepare-prove-service.ts`
- Credential issuance authority: `credential-service.ts`, `certificate-service.ts`
- Evidence/Truth projection: `verified-evidence-service.ts`, `truth-spine-adapter.ts`
- Portfolio authority: `portfolio-service.ts`
- Accessibility authority: accessibility profile/effective contexts and AX backend domains

## 17. Missing Connections

Missing canonical connections:

- Universe destination -> city/metaverse app route.
- City/metaverse -> district/building registry.
- District/building -> app destination/task route.
- Curriculum/certification/milestone -> metaverse unlock contract.
- Unlock contract -> metaverse job/task availability.
- Metaverse task result -> evidence/Truth source type.
- Metaverse task result -> portfolio/skill profile.
- Metaverse civic actions -> student government authority.
- Metaverse economy actions -> canonical Treasury ledger.
- Data Center curriculum/proof -> Data Center district/job tasks.
- Career/employer demo -> governed metaverse evidence.
- Reporting -> metaverse participation/skill/job/civic outcomes.

## 18. Duplicate-Authority Risks

Do not create duplicate authority for:

- Identity, user profiles, active organization, tenant, roles, or permissions.
- Curriculum completion and mastery.
- Career pathway mapping.
- Credential eligibility/issuance.
- Prepare/Prove evidence and competency decisions.
- Truth Spine / verified evidence.
- Portfolio and skill profile projections.
- Treasury/economy ledger once canonicalized.
- Notification inbox.
- Accessibility preferences/accommodations/content representations.
- SHF Civic vs CivicSure product boundaries.
- Institutional reporting and public claims.

## 19. Gap Register

| Gap | Title | Current state | Desired state | Severity | Dependency | Phase | Duplicate-authority risk | Acceptance requirement |
|---|---|---|---|---|---|---|---|---|
| MET-GAP-001 | Canonical metaverse architecture missing | No top-level metaverse/city contract | Approved architecture defining city scope, authorities, app boundaries | P0 | Identity, Evidence, Universe | MET-1 | High | Architecture doc maps every authority and forbids duplicates |
| MET-GAP-002 | City/district registry missing | Universe has destination registry only | City registry with districts, buildings, destination links, access state | P0 | MET-1 | Medium | Registry covers Data Center, Career, Arcade, Civic, Treasury, Store |
| MET-GAP-003 | Learner unlock contract missing | Credentials/mastery exist but no unlock bridge | Server-side unlock derivation from verified milestones/credentials | P0 | Credentials, Arcade, Prepare/Prove | MET-3 | High | Unlocks are derived, scoped, auditable, non-self-issued |
| MET-GAP-004 | Metaverse task event schema missing | No metaverse source type | `METAVERSE_TASK_RESULT` or equivalent evidence source | P0 | Evidence/Truth | MET-4/MET-9 | High | Task result projects to evidence/truth via existing pipeline |
| MET-GAP-005 | Canonical economy ledger missing | Multiple localStorage ledgers | One server-side simulated economy ledger for credits/SHF dollars | P0 | Identity, Treasury | MET-6 | High | Ledger has org/tenant/user scope, earning/spending rules, no token claims |
| MET-GAP-006 | Civic government authority missing | Civic local/demo election/proposal state | Simulated student government model with eligibility, ballots, offices, terms | P1 | SHF Civic, Identity | MET-5 | High | Explicit educational-simulation disclaimers and scoped roles |
| MET-GAP-007 | Metaverse job framework missing | Career roles documented but no task engine | Job/task registry with role requirements, task definitions, evidence outputs | P1 | MET-3, MET-4 | MET-4 | Medium | Data Center Technician and at least two other roles demonstrable |
| MET-GAP-008 | Data Center district missing | Curriculum/pathway exists, no district/facility | Dedicated Data Center district/facility route and registry entry | P1 | MET-2 | MET-7 | Low | District links curriculum, jobs, proof tasks, portfolio |
| MET-GAP-009 | Arcade frontend not wired to backend authority | Backend Arcade exists; visible games mostly local/demo | Arcade UI calls backend attempts/results for mastery where applicable | P1 | Arcade API | MET-8 | Medium | A game/task emits backend Arcade result and evidence |
| MET-GAP-010 | Portfolio direct Data Center evidence gap | Portfolio artifacts accept Studio evidence only | Prepare/Prove/metaverse evidence can produce portfolio artifacts or learner-result entries | P1 | Portfolio, Evidence | MET-9 | Medium | Reviewed Data Center proof appears in portfolio/skill profile |
| MET-GAP-011 | Career/employer demonstration gap | Employer/Career pages exist separately | Governed demos expose learning evidence without employment claims | P2 | Portfolio, Career | MET-4/MET-9 | Medium | Employer view labels evidence as educational demonstration |
| MET-GAP-012 | Accessibility equivalent task model missing | Accessibility layer exists; metaverse tasks absent | Every spatial/game task has accessible equivalent | P1 | AX runtime | MET-10 | High | Keyboard, reduced motion, screen reader, non-spatial path verified |
| MET-GAP-013 | Reporting metaverse slice missing | Reporting exists; no metaverse metrics | Institutional report includes city/job/civic/metaverse evidence summaries | P2 | Evidence, Metrics | MET-12 | Medium | Report uses verified facts, not local UI state |
| MET-GAP-014 | City offices/roles missing | Civic has pages but no office registry | Mayor/Council/Treasurer/Clerk/etc. simulated role registry | P2 | MET-5 | MET-5 | Medium | Offices cannot imply real government authority |
| MET-GAP-015 | Store/purchase authority missing | Store purchase pages are placeholders | Simulated purchase/catalog rules integrated with economy ledger | P2 | MET-6 | MET-6 | Medium | Purchase state server-scoped and reversible/auditable |
| MET-GAP-016 | Universe-to-metaverse entry missing | Universe lists apps but no city destination | Universe destination record for bounded Silicon Heartland City | P2 | MET-1/MET-2 | MET-2 | Low | Registry entry points to real city app, not placeholder |
| MET-GAP-017 | Data Center visual assets missing | Curriculum assets exist; no facility asset set | Facility/district visuals with accessible alternatives | P3 | MET-7 | MET-7 | Low | Assets render and have non-spatial equivalents |
| MET-GAP-018 | Role progression missing | Credentials/mastery exist, no role ladder | Progression levels tied to verified learning evidence | P2 | MET-3 | MET-4 | High | Progression derived from canonical outcomes only |

## 20. Recommended Build Phases

Recommended finite sequence:

1. MET-0 Current-State Audit - this document.
2. MET-1 Canonical Metaverse Architecture - define authorities, data contracts, boundaries, and prohibited duplicates.
3. MET-2 City & District Registry - create city/district/building registry, including Data Center district, without task logic yet.
4. MET-3 Learner Progression / Unlock Contract - server-derived access from credentials, mastery, assignments, verified milestones.
5. MET-4 Career Job Simulation Framework - job/task registry and task result contract.
6. MET-5 SHF Civic Government Simulation - offices, eligibility, elections, councils, proposals, student-government disclaimers.
7. MET-6 Treasury / Credits / SHF Dollar Economy Integration - canonical simulated ledger and Store/Treasury/Credit reconciliation.
8. MET-7 Data Center District - facility/district UI and first Data Center job tasks tied to existing proof activities.
9. MET-8 Learning Arcade Integration - backend Arcade attempts/results from visible games and metaverse tasks.
10. MET-9 Evidence / Portfolio / Verification - metaverse source type, evidence projection, portfolio/skill-profile/report bridge.
11. MET-10 Accessibility / Responsive / Alternate Interaction - full equivalent interaction layer.
12. MET-11 Full City Experience - connect districts, jobs, civic, treasury, career, arcade into a bounded city loop.
13. MET-12 System-Wide Acceptance - route, API, evidence, accessibility, economy, reporting, and boundary acceptance.

## 21. P0/P1 Blockers

P0 blockers:

- MET-GAP-001: Canonical metaverse architecture missing.
- MET-GAP-002: City/district registry missing.
- MET-GAP-003: Learner unlock contract missing.
- MET-GAP-004: Metaverse task event schema missing.
- MET-GAP-005: Canonical economy ledger missing.

P1 blockers:

- MET-GAP-006: Civic government authority missing.
- MET-GAP-007: Metaverse job framework missing.
- MET-GAP-008: Data Center district missing.
- MET-GAP-009: Arcade frontend not wired to backend authority.
- MET-GAP-010: Portfolio direct Data Center evidence gap.
- MET-GAP-012: Accessibility equivalent task model missing.

## 22. Final Verdict

The Silicon Heartland ecosystem has enough reusable infrastructure to begin a metaverse architecture phase, but it does not yet have a metaverse. Universe is a canonical ecosystem gateway and destination registry, not the city simulation. The Data Center pathway is the strongest ready content domain, with real curriculum and simulated proof activities, but it still needs district/job/task/evidence integration.

Proceed to MET-1 with strict authority reuse:

- Reuse identity/org/tenant boundaries.
- Reuse Arcade, Prepare/Prove, Credentials, Evidence/Truth, Portfolio, Accessibility, Career, and Treasury authorities.
- Keep CivicSure separate from SHF Civic.
- Treat all student city government and jobs as simulated educational structures with no real government, credential, employment, or currency claims.

MET-0 COMPLETE - READY FOR MET-1
