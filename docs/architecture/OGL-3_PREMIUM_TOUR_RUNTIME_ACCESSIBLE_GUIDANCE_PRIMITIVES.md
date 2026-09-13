# OGL-3 — Premium Tour Runtime & Accessible Guidance Primitives

## 1. Executive Result
OGL-3 establishes the shared `TourProvider` path as the canonical runtime surface. It consumes canonical semantic step data, delegates experience state to bounded UX state helpers/API, and leaves service, DGAL, Evidence, Truth, Legal, and workflow authority outside OGL.

## 2. Repository Baseline
Branch `studio-v1-plus-development`; starting HEAD `c775466f5de6f86a7e4d4230434e0d56c17c0a7f`; migration head 138 before this phase. Pre-existing OGL-1/OGL-2 changes, test artifacts, temporary scripts, API runtime data, and audit output were preserved.

## 3. OGL-3 Gap IDs
OGL-GAP-003, OGL-GAP-004, OGL-GAP-005, and the OGL-3 execution portion of OGL-GAP-009 were assigned to this phase. OGL-GAP-006/7/8/10/11/12/13/14/15 remain later-phase scope where applicable.

## 4. Scope Boundaries
This phase changes presentation/runtime behavior and UX-state persistence only. It does not create workflow completion, acknowledgments, Evidence, Truth, approval, entitlement, or service authority.

## 5. Legacy Runtime Inventory
The shared runtime is `src/system/tour/TourProvider.jsx`, `useTour.js`, `TourOverlay.jsx`, and `TourStepCard.jsx`. The second runtime is `src/pages/hub/shared/HubBusinessTourProvider.jsx`, with page-key step definitions and session guided intent.

## 6. Canonical Runtime Decision
The shared runtime is canonical because it is already consumed outside Hub, has the DGAL request bridge, and now accepts normalized OGL steps and durable UX state. Hub remains adapter-backed until representative OGL-5 migration proves parity.

## 7. Runtime API
`useOrientationRuntime` exposes bounded `start`, `resume`, `pause`, `next`, `previous`, `skip`, `dismiss`, `restart`, `complete`, and `markWhatsChangedSeen` operations. `useTour` preserves the legacy API while delegating to it.

## 8. OGL-2 Resolver Consumption
The runtime accepts the semantic orientation/tour/resolution projection and does not re-evaluate roles, permissions, organizations, DGAL requirements, or workflow facts.

## 9. Experience State Model
States are `OFFERED`, `STARTED`, `PAUSED`, `SKIPPED`, `DISMISSED`, and `COMPLETED`. They are experience facts only.

## 10. Persistence Decision
Durable milestones use server-backed migration 139; transient overlay/focus state remains local React state. Local storage is a best-effort fallback for runtime continuity when the API is unavailable.

## 11. Organization / Destination Scoping
Server records are keyed by user, active organization, tenant, orientation/version, and tour/version. Switching organization requires a new scope and cannot reuse another organization's state.

## 12. Versioned Experience State
Exact orientation and tour versions are stored. A materially changed version has a separate state key; completing v1 does not complete v2.

## 13. Reorientation Behavior
OGL-1 policy metadata supports NONE, OPTIONAL, RECOMMENDED, and REQUIRED presentation. REQUIRED means presentation, never institutional acknowledgment.

## 14. What’s Changed
`WhatsChangedPanel` and `markWhatsChangedSeen` provide the bounded presentation and state boundary. Change text comes from contract metadata; OGL does not invent policy text.

## 15. Welcome Primitive
`OrientationWelcome` provides purpose, outcome, start, step-list, and dismiss actions.

## 16. Coachmark Primitive
`OrientationCoachmark` provides focused dialog semantics, step progress, keyboard Escape, unanchored fallback, and one primary progression action.

## 17. Spotlight Primitive
The shared overlay keeps a bounded semantic spotlight and recalculates on resize/scroll; reduced motion disables its transition.

## 18. Unanchored Step Primitive
Missing targets render the instruction as an unanchored step when policy permits.

## 19. Inline Guidance Primitive
`InlineGuidance` supports concise explanation, DGAL learn-more, Companion, and show-me actions without owning their authority.

## 20. Checklist Primitive
`OrientationChecklist` renders OGL-2 items, required/optional language, next-owner text, safe action callbacks, and collapse/reopen without equating collapse to completion.

## 21. Accessible Alternative
`OrientationAccessibleAlternative` provides an ordered, non-overlay step list and checklist representation for critical experiences.

## 22. Semantic Anchors
OGL targets support `data-ogl-anchor="..."` semantic targets, with legacy selector compatibility through the adapter boundary.

## 23. Missing Anchor Behavior
`SKIP_STEP` and `END_TOUR` are deterministic; other OGL-1 policies remain available for unanchored, paused, or required-target presentation. Missing targets never crash the host application.

## 24. Route-Aware Tours
The state model stores last route/destination and the structured action boundary remains safe. Full cross-route target orchestration remains a bounded runtime concern for consumers as they migrate.

## 25. Pause / Resume
Pause/resume are explicit UX transitions and survive refresh through scoped experience state where the API is available.

## 26. Replay / Restart
Replay uses `RESTART` and increments bounded replay metadata while retaining completed version history.

## 27. Skip / Dismiss
Skip and dismiss close only the experience. They do not acknowledge a requirement or complete a domain action.

## 28. Mobile / Responsive
The existing width-constrained card remains usable across viewport sizes; the primitive layer provides unanchored fallback rather than relying on an off-screen anchor. Mobile visual acceptance remains part of OGL-5/OGL-6 rollout evidence.

## 29. Keyboard
Native buttons, Escape handling, visible focus, and step-list navigation are used; browser shortcuts are not hijacked.

## 30. Focus Management
The overlay records and restores the prior active element and the canonical coachmark focuses itself on step change.

## 31. Screen Reader
Dialog labels, descriptions, progress, and status messaging are exposed through semantic headings, `aria-describedby`, `aria-live`, and `role="status"` fallback text.

## 32. Reduced Motion
`prefers-reduced-motion` changes scroll behavior to auto and removes spotlight transitions.

## 33. Zoom / Text Scaling
The accessible alternative uses normal document flow and the overlay uses bounded width rather than fixed-height content traps.

## 34. DGAL Coexistence
DGAL references remain source references; opening documentation does not complete tours or requirements.

## 35. Companion Coexistence
Companion remains read-only. OGL telemetry and context hooks are bounded; no Companion mutation path was added.

## 36. Safe Action Execution
Actions remain structured OGL-1/OGL-2 targets. Runtime state is not authorization; execution must reauthorize through the owning route/service.

## 37. Org Switch / Re-Resolution
Server persistence scopes every record to active organization and tenant. The runtime resets its local scope when its identity/organization scope changes.

## 38. Stale Version Handling
Exact version keys prevent v1 state from satisfying v2; server mutation rejects inactive/mismatched orientation versions.

## 39. Telemetry Boundary
`emitOrientationExperienceEvent` allowlists experience events and strips bodies/payloads. Events are not Evidence, Truth, or workflow audit authority.

## 40. Error Isolation
Runtime state is presentation-only and missing target handling is defensive; the underlying workflow remains usable when orientation is absent.

## 41. Legacy Migration
Shared consumers now pass through `useTour` and the canonical runtime state machine. Hub remains active as an adapter-backed legacy runtime; physical removal is deferred until OGL-5 migration parity.

## 42. Feature Parity Matrix
| Feature | Shared legacy | Hub legacy | Canonical status |
|---|---|---|---|
| start/next/previous | yes | yes | yes |
| skip/dismiss/replay/resume | partial | partial | bounded API/state |
| semantic targets | adapter | adapter | yes |
| missing-anchor fallback | local | local | deterministic shared policies |
| keyboard/focus/ARIA | partial | partial | shared runtime/primitives |
| reduced motion | now explicit | deferred adapter styling | canonical contract |
| versioning/What’s Changed | absent | absent | state/panel boundary |
| accessible alternative | absent | absent | reusable step-list primitive |

## 43. Runtime Retirement Decision
No runtime is deleted. Hub is deprecated for new contract work and remains adapter-backed until OGL-5 consumer migration and parity evidence.

## 44. Representative Acceptance
OGL-1 registry contracts, shared runtime state, safe telemetry, exact version scoping, and accessible primitive contracts pass native tests. API typecheck passes. The TS runner was blocked before load by the known IPC-pipe harness condition.

## 45. Security
No client role/permission is used as authorization; no arbitrary URLs or HTML are introduced; server experience mutations validate actor/org/version/catalog binding; no protected content enters telemetry.

## 46. Tests
`node --test tests/ogl1OrientationRegistry.test.mjs tests/ogl3ExperienceState.test.mjs` passed 12 tests. `npx tsx --test apps/shs-api/tests/ogl2-orientation-context.test.ts` passed 8 tests. `npm --prefix apps/shs-api run typecheck` passed.

## 47. Gap Closure Matrix
| OGL Gap ID | Severity | Starting Status | Work Performed | Tests | Final Status |
|---|---|---|---|---|---|
| OGL-GAP-003 | P1 | OPEN | Shared runtime canonicalized; Hub retained behind adapter | OGL-1 adapter tests; build/static review | RESOLVED at OGL-3 consolidation scope |
| OGL-GAP-004 | P1 | OPEN | Focus, ARIA, Escape, reduced motion, semantic anchors, accessible alternative | Native runtime/contract tests; UI validation | RESOLVED at primitive scope |
| OGL-GAP-005 | P1 | OGL-1 contract portion resolved | Migration 139, exact scoped state, replay/version boundaries | Native state tests; API typecheck | RESOLVED |
| OGL-GAP-009 | P2 | OGL-2 selection resolved | Runtime structured-target and missing-anchor boundary | Native contract tests | RESOLVED at OGL-3 scope |

## 48. Files Created
`apps/shs-api/migrations/139_ogl_orientation_experience_state.sql`; orientation experience model/repository/service; `src/system/orientation/runtime/experienceState.js`; `useOrientationRuntime.js`; `telemetry.js`; `OrientationGuidancePrimitives.jsx`; `tests/ogl3ExperienceState.test.mjs`; this report.

## 49. Files Modified
Orientation API routes; shared `useTour`; `TourProvider`; `TourOverlay`; `TourStepCard`; tour styles; OGL-0 report.

## 50. Owner Work Preservation
Pre-existing test snapshots, temporary scripts, API runtime files, audit output, OGL-1/OGL-2 work, and unrelated owner changes were preserved. No destructive Git operation, commit, or push was performed.

## 51. Validation
Passed: orientation validation, manifests, UI validation, layer/truth/oracle checks, native tests, OGL-2 tests, API typecheck, elevated root Vite build, isolated migrations through 139, and diff check.

## 52. OGL-3 Decision
**INTERMEDIATE COMPLETE at repository runtime/primitives scope; superseded by the later browser-acceptance decision below.** The known TS harness block is not a product defect. OGL-4 has not started.

## 53. Exact Next Phase
**OGL-4 — GUIDANCE CENTER + DGAL + COMPANION INTEGRATION**

## Route Transition Orchestration Acceptance
`routeOrchestration.js` defines `STEP_ACTIVE`, `NAVIGATION_REQUESTED`, `ROUTE_TRANSITION`, `WAITING_FOR_TARGET`, `TARGET_READY`, and `TARGET_TIMEOUT`. The readiness helper is cancellable by its consumer, polls at a bounded interval, and resolves with a deterministic timeout rather than looping forever. Shared overlay consumption waits for readiness before anchoring and applies the contract missing-anchor policy after timeout.

## Target Readiness Strategy
Semantic OGL anchors are resolved through `data-ogl-anchor`; legacy selectors remain adapter-compatible. The overlay rechecks on resize/scroll and waits up to the bounded readiness window for delayed route/API-rendered targets.

## Target Timeout / Failure Handling
Delayed targets attach once available. Targets that never appear produce an honest waiting/timeout path; `SKIP_STEP` advances and `END_TOUR` exits. Other policies remain visible to the canonical step card as unanchored/required-target states. No infinite spinner or host-app crash is introduced.

## Refresh / Back Navigation
Last route/destination and current step are persisted in the scoped experience record. A remount hydrates the exact versioned record; stale route/action execution remains subject to the owning route authorization. Native route tests cover readiness and timeout; browser execution was blocked before app load.

## Org Switch During Tour
Experience keys include user and organization. Runtime state scope resets when those values change, and server reads/writes are active-organization scoped. No OGL client state grants access to the prior organization.

## Workflow Re-resolution
OGL-3 does not copy workflow state. Consumers return through structured owner actions and can request a fresh OGL-2 projection after domain work; the runtime never treats tour completion as workflow completion.

## Hub Canonical Runtime Migration
`HubWorkspaceDashboard` now opts into `canonicalRuntime`. Its existing `getHubTourSteps("workspace")` definition is passed to the shared `TourProvider`, which normalizes it into the canonical runtime state machine. Hub content is not duplicated.

## Hub Feature Parity
The migrated workspace path retains start, next, previous, finish, semantic/legacy target resolution, missing-target fallback, keyboard-native controls, version-scoped experience state, and responsive bounded card behavior. Underlying Hub workflow components remain unchanged.

## Remaining Legacy Consumers
Other Hub pages still import `HubBusinessTourProvider` without `canonicalRuntime`, including sales, reports, files/imports, bundles, growth, leadership, intake, and partner queue surfaces. They remain explicitly deferred to OGL-5 system-wide rollout.

## Runtime Retirement Status
The Hub runtime is **DEPRECATED — REMAINING CONSUMERS EXIST / ADAPTER-BACKED**. It is not deleted. The canonical workspace migration proves the execution path; OGL-5 owns remaining consumer migration and final retirement decision.

## Browser Acceptance
The initial browser attempt encountered the known macOS Mach-port failure, but the final controlled run used the repository-standard disposable fixture and successfully executed Chromium against explicit `127.0.0.1` URLs. The earlier failure is historical; final authenticated browser evidence is recorded below.

## Browser Accessibility Acceptance
The DOM contract uses semantic dialog/heading/button/status semantics, focus restoration, Escape handling, reduced-motion media behavior, and the ordered `OrientationAccessibleAlternative`. Browser assistive-technology execution is unavailable under the pre-load Chromium harness block.

## Environment / Harness Classification
The final acceptance run successfully launched Chromium and API/Vite on loopback. The earlier Mach-port failure is superseded by the successful run. No product workaround was applied; the disposable harness used its supported development-only `dev-token` fixture.

## Final OGL-3 Decision
**INTERMEDIATE COMPLETE — superseded by the later full-browser-acceptance decision below.** Deterministic route/readiness, scope, replay, accessibility-contract, Hub canonical-path, authenticated context, and authority evidence pass. No OGL-4 work has started; no commit or push was performed.

## Browser Harness Block Classification
Playwright Chromium was attempted against `127.0.0.1` and terminated before page navigation, application JavaScript initialization, or route execution with `mach_port_rendezvous_mac ... Permission denied`. This is **ENVIRONMENT/HARNESS BLOCK — NOT PRODUCT FAILURE**. No product workaround was applied.

## Non-Browser Route Orchestration Evidence
`routeOrchestration.js` models the bounded transition states and `waitForTarget` covers delayed readiness and deterministic timeout. Native tests prove Route A to Route B continuity metadata, target readiness, timeout, and organization scope preservation.

## Re-Resolution Acceptance
`requiresContextResolution` returns true for organization, destination, service, workflow revision, or permission revision changes and false for unchanged context. This is a selection signal only; OGL-2 remains the context authority and action execution remains reauthorized by the owning route.

## Hub Canonical Runtime Evidence
`HubWorkspaceDashboard` passes `canonicalRuntime` to `HubBusinessTourProvider`; that branch renders shared `TourProvider`, which delegates to `useOrientationRuntime`. Native registry adapter tests, build output, import inspection, and the 11-test OGL suite prove the representative path does not execute the legacy Hub overlay.

## Hub Visual-Parity Scope
The migrated workspace retains the existing Hub step source/order and controls, with canonical semantic/legacy target normalization and accessible fallback. Final Chromium inspection at 375px confirmed the first-step dialog was readable, within the viewport, and exposed the intended controls. Pixel-perfect historical screenshot equivalence is not claimed.

## Accessibility Acceptance
Repository-level evidence covers native controls, dialog headings/descriptions, status announcements, Escape, focus restoration, semantic anchors, reduced-motion branch, and ordered non-tour alternative. Assistive-technology certification remains outside this harness result.

## Mobile/Responsive Acceptance
The canonical card uses bounded viewport-relative width and unanchored fallback; the accessible step list uses normal flow. Responsive browser screenshots are harness-blocked, but the responsive code path is included in the successful production build.

## Remaining Browser-Only External Evidence
No browser execution blocker remains for the bounded OGL-3 acceptance. Pixel-perfect historical comparison and external assistive-technology certification remain outside scope.

## Final Acceptance Classification Update
The later controlled run on `127.0.0.1:5193` successfully launched Chromium and loaded the SHF app and Hub route. Therefore the earlier Mach-port failure is not the current browser result. The page reported no browser-visible application error, while Vite logged an unavailable `/auth/me` proxy target at `127.0.0.1:8091`. Classify this as **ENVIRONMENT / OPERATIONAL SETUP BLOCK — API NOT RUNNING**, not a browser or product defect. Authenticated browser acceptance remains unverified until the repository-standard API fixture is running.

## Auth Fixture / API Acceptance Setup
The repository-standard `scripts/run-phase8-acceptance-env.mjs` harness was used. It created a disposable PostgreSQL cluster/database, replayed migrations through 139 with no pending migrations or drift, seeded supported Phase 8 identities, started the API and Vite on explicit `127.0.0.1` loopback ports, and removed the disposable environment after the run. No production auth bypass or persistent database was used.

## Authenticated Browser Acceptance
Chromium executed against the harness frontend with `Bearer dev-token:learner_A1`. `GET /auth/me` returned the authenticated learner, Org A membership, tenant context, student role, and canonical permissions. `GET /orientation/context?destinationId=curriculum` returned `RESOLVED`, the student orientation contract, DGAL reference, Companion topics, safe action, and `FIRST_TIME_ORIENTATION` presentation.

## Shared Runtime Browser Acceptance
The authenticated browser loaded the SHF Admin Hub shell at 375px. The canonical `Start Hub tour` control was present, and dispatching the same `dgal:tour-request` event used by the Hub canonical branch rendered the shared `TourProvider` overlay with the expected first workspace step, `Step 1 of 13`, dialog semantics, Skip, Back, and Next controls. No page error or host-app crash occurred.

## Hub Runtime Browser Acceptance
`HubWorkspaceDashboard` remained on the `canonicalRuntime` branch. The browser rendered the intended workspace tour content and ordered steps through `TourProvider`/`useOrientationRuntime`; no legacy `HubTourOverlay` was rendered for this consumer. The disposable fixture did not alter Hub workflow authority.

## Hub Visual Parity
Functional browser inspection confirmed the existing workspace tour title/content, step order, target selector contract, progress, and controls. The browser run used a 375px viewport and showed no clipping in the rendered first-step dialog. Pixel-perfect comparison against historical screenshots is outside the bounded OGL-3 requirement and is not claimed.

## Cross-Route Browser Acceptance
The authenticated browser/runtime smoke completed the canonical Hub route execution and overlay readiness path. Route-transition state-machine, delayed-target, timeout, org-scope, and re-resolution behavior remain covered by native OGL tests and OGL-2 resolver tests; no browser regression was observed in the accepted route entry.

## Context Re-Resolution Browser Acceptance
The API acceptance proved authenticated actor, organization, tenant, role, permission, and orientation context resolution against the disposable database. Runtime re-resolution predicates and cross-organization invalidation remain deterministic code/test evidence; no client role or permission claim was trusted.

## Resume / Replay Browser Acceptance
The browser verified the authenticated runtime entry and canonical stateful overlay path. Durable start/progress/resume/replay/version/org/idempotency behavior remains covered by migration 139 and the native OGL experience-state suite. Opening or skipping an experience remains separate from workflow completion and acknowledgment.

## Accessibility Browser Acceptance
Browser DOM inspection confirmed the guided dialog, heading/content structure, named controls, progress text, and keyboard-native controls. Repository tests additionally cover Escape, focus restoration, reduced motion, semantic anchors, timeout fallback, and the ordered accessible alternative. External assistive-technology certification is not claimed.

## Mobile / Responsive Browser Acceptance
The authenticated run used a 375px Chromium viewport. The first-step overlay rendered within the viewport with readable content and reachable controls. The bounded responsive fallback and accessible step-list path remain covered by runtime code and native tests; 320px and tablet pixel certification are outside this narrow acceptance run.

## Role / Permission Browser Acceptance
The authenticated response identified `learner_A1` as a student in `phase8_org_a`; the returned context was the curriculum student contract rather than admin content. Server API resolution remains authoritative, and forged client role/permission claims are covered by OGL-2 negative tests.

## Remaining Operational Limitations
Production signature-provider activation, provider credentials/webhooks, production notification delivery, Legal/institutional approval, real organization UAT, and deployment/access proof remain operational or external concerns. They do not block repository-local OGL-3 implementation acceptance. Browser pixel comparison and assistive-technology certification remain outside this bounded run.

## Final OGL-3 Decision
**PARTIAL — repository implementation and authenticated browser smoke are healthy, but the complete OGL-3 browser acceptance matrix is not closed by this bounded run.** The standard disposable auth/database fixture ran successfully, authenticated context resolved, Chromium loaded the application on `127.0.0.1`, and the migrated Hub consumer executed through the canonical runtime. Cross-route continuation, delayed-target browser fixture, replay/resume browser flow, accessible-alternative browser flow, and browser role/org matrix remain unexecuted here. OGL-1 contracts, OGL-2 context authority, migration 139 state, accessibility boundaries, service authority, and WF-040 remain intact. OGL-4 has not started; no commit or push was performed.

## Final Browser Acceptance Closure Run
The repository-standard disposable Phase 8 fixture was started successfully with PostgreSQL, API, and Vite on explicit `127.0.0.1` loopback ports. Migrations through 139 reported no pending migrations, drift, or unknown applied migrations. The authenticated API checks passed for `learner_A1`, Org A, tenant `tenant:phase8_org_a`, student role, curriculum context, and negative protected-destination requests. The disposable browser spec was removed after execution and is not part of the product surface.

### Product Defects Found
The browser run exposed two bounded repository-local defects and they were fixed in the existing OGL runtime: experience-state requests now use the configured `VITE_SHS_API_BASE` with `/api` fallback, matching the Vite proxy/API route contract; and the active tour dialog now receives focus and listens for Escape at the window boundary while restoring the launching focus. Native OGL tests, API typecheck, and the subsequent authenticated Chromium Hub run passed after these changes.

### Browser Evidence Actually Accepted
The final Chromium run authenticated against the disposable fixture and rendered `HubWorkspaceDashboard` through the canonical runtime at 375px. The first step displayed with the expected content and `Step 1 of 13`; Next and Back worked; the dialog exposed an accessible name, focus was placed in the dialog, Escape closed it, and Skip closed the experience without a host-app error. The API context and cross-organization negative checks passed in the same fixture.

### Browser Evidence Still Open
This run did not honestly execute a production-backed cross-route tour, a fixture-controlled delayed-target route, browser refresh resume/replay with a supported user control, a rendered accessible-alternative surface, or a full browser role/org matrix. The repository has deterministic tests for route readiness, timeout, re-resolution, replay/state scoping, accessibility metadata, and forged-role filtering, but those tests do not substitute for the six browser flows requested. No browser-only environment block explains these omissions; they are missing supported acceptance surfaces/data in the current repository.

## Final OGL-3 Decision
**PARTIAL — OGL-3 is not complete.** The authenticated fixture is healthy and Chromium loads the application. Hub canonical-runtime smoke, API authentication/context, 375px rendering, keyboard Escape behavior, and bounded deterministic runtime evidence pass. The remaining browser acceptance matrix is not closed: full shared-runtime representative flow, cross-route continuation, delayed-target browser flow, browser resume/replay, accessible-alternative browser flow, and complete role/org browser coverage remain unproven. The two defects found during this run were fixed narrowly. OGL-4 and SEA have not started; no commit or push was performed.

## Final Six-Flow Browser Acceptance Closure
The same disposable Phase 8 fixture was rerun with explicit loopback API/frontend ports and Chromium. Preflight passed for `learner_A1` (`student`, `phase8_org_a`, `tenant:phase8_org_a`), curriculum OGL context, protected-destination denial, and an independent Org B context. The run was diagnostic and intentionally recorded unsupported flows instead of substituting synthetic browser behavior.

| Flow | Representative / Route | Browser Executed | Result | Exact Evidence | Defect/Blocker |
|---|---|---:|---|---|---|
| Shared runtime full flow | HubWorkspaceDashboard, `admin.html#/hub`, `instructor_A_authorized` | YES | FAIL | Shared canonical overlay rendered; Step 1/13, Next, Back, Escape, and Skip worked at 375px. | No separately mounted supported Student/CivicSure/Agent Fabric shared representative was available in the fixture; Hub is the only browser-mounted canonical consumer. |
| Cross-route continuation | Hub workspace | NO | BLOCKED | No production Hub tour step declares a supported route-B transition; deterministic route tests pass. | Missing repository acceptance route/data, not a Chromium harness failure. |
| Delayed target | Hub workspace | NO | BLOCKED | Deterministic `waitForTarget` delayed/timeout tests pass. | No fixture-controlled delayed-target browser route exists. |
| Resume | Hub workspace | YES | FAIL | Browser reload returned to the page with no active overlay; no `/orientation/experience` request was emitted. | Hub provider omits authenticated user/org scope, so durable browser resume is not exercised. |
| Replay | Hub workspace | YES | FAIL | The surface exposes only `Start Hub tour`; no supported replay/restart control or persisted Hub state was available. | Hub experience state is not wired to the server-backed catalog/runtime scope. |
| Accessible alternative | Hub workspace | YES | FAIL | Dialog had named semantics and keyboard controls, but no Step list/accessible-alternative control appeared. | Accessible alternative is contract/runtime-supported but not mounted in this representative consumer. |
| Role matrix | Curriculum context API + Hub browser | YES | PASS at API scope | Student received curriculum orientation; Agent Fabric was denied with 403; client role forgery is covered by 8 OGL-2 tests. | Full browser role UI comparison not available on the mounted representative. |
| Org matrix | Org A/Org B context API | PARTIAL | PASS at server scope | Org A and Org B returned distinct authorized contexts; deterministic org-scoping tests pass. | No browser organization switch control was available in the mounted Hub acceptance route. |
| Hub regression | Hub workspace | YES | PASS | Canonical runtime rendered intended content, Step 1/13 and Step 2/13, Next/Back/Skip/Escape, no page error, 375px fit. | Durable Hub persistence remains a blocker above. |
| 375px mobile regression | Hub workspace | YES | PASS | Overlay content and controls were readable and reachable at 375px with no critical horizontal overflow observed. | Shared/alternative mobile flows remain unmounted. |

## Product Defects Found and Fixed
The prior browser run exposed and the bounded fix addressed two defects: experience-state requests used an unproxied `/orientation` path instead of the configured API base, and Escape/focus handling did not work when focus remained on the launcher. Native OGL tests, API typecheck, build, and the subsequent Hub browser smoke passed after the fix. The closure diagnostic additionally exposed the unresolved Hub scope/catalog wiring and missing mounted accessible alternative described in the table above; those were not silently reclassified as fixture or harness failures.

## Fixture Defects Found and Fixed
None. The repository-standard fixture started, migrated through 139 without drift, authenticated users, and supplied Org A/Org B API contexts. No fixture-only files were changed.

## Final OGL-3 Decision
**PARTIAL — the six-flow browser closure gate is not satisfied.** Browser execution is healthy, but cross-route and delayed-target browser evidence lacks supported acceptance routes; Hub browser resume/replay is not wired to authenticated server state; and the mounted representative has no accessible-alternative flow. These are repository-local acceptance/product integration gaps, not environment blocks. OGL-4 and SEA have not started; no commit or push was performed.

## Bounded Remediation — Hub Experience State and Accessible Alternative
The Hub root cause was twofold: the canonical wrapper initially passed an incomplete authenticated scope/catalog identity into the runtime, and the launch control passed its DOM click event into the numeric runtime start-index API. That persisted `step-[object Object]1`, making a valid STARTED record impossible to resume. Hub now binds the authenticated user, active membership organization, tenant, canonical orientation/tour IDs, and exact versions; the launch command strips DOM events before invoking runtime commands.

The experience-state repository now handles migration 139's expression-based unique index with a bounded insert-or-update path. STARTED, progress, COMPLETED, and RESTART requests are authenticated, version-bound, organization-scoped, idempotent, and do not touch workflow state. The runtime hydrates the current step from the server record after reload, exposes Resume for incomplete state, and exposes Replay for completed state while retaining completion history and bounded replay count.

The accessible step-list primitive is mounted from the canonical tour controls. It renders structured Hub step content, uses a focusable fixed scroll surface, provides a keyboard-reachable close control, and does not complete the tour or any institutional workflow. The runtime surface is rendered at document level so dashboard stacking contexts cannot intercept controls.

## Cross-Route and Delayed-Target Acceptance Fixtures
No production cross-route or delayed-target acceptance fixture was added in this remediation. Existing deterministic route-orchestration tests cover `STEP_ACTIVE` through `WAITING_FOR_TARGET`, delayed readiness, timeout fallback, scope preservation, and context re-resolution. Browser evidence remains open because the repository has no supported test-only Route A/Route B or fixture-controlled delayed-target acceptance surface. These are remaining OGL-3 P1 acceptance gaps, not Chromium harness failures.

## Production Safety of Acceptance Fixtures
No acceptance-only route, production seed, auth bypass, arbitrary URL action, or new migration was introduced. Migration 139 remains current and isolated migration runs report no pending migrations or drift.

## Role / Org Evidence
The standard fixture continued to authenticate `instructor_A_authorized`; server-side resolver and experience-state evidence cover unauthorized-role filtering, forged-role rejection, and distinct Org A/Org B scope. The Hub surface has no organization switch control, so browser org switching is not applicable there; API and deterministic cross-org tests remain the authoritative acceptance evidence.

## Browser Acceptance After Remediation
The authenticated Chromium Hub flow passes through start, semantic Step 1, Next to Step 2, server-backed progress, reload, server-backed Resume, accessible Step list, completion, persisted COMPLETED state, and Replay back to Step 1. The same flow passes at the 375px viewport. Browser evidence for cross-route continuation and fixture-controlled delayed target remains unavailable because safe acceptance routes do not currently exist.

## Product Defects Found and Fixed in This Remediation
1. Experience-state persistence used invalid `ON CONFLICT` inference against migration 139's expression index; the repository now uses bounded conflict-ignore plus scoped update.
2. Hub start passed the click event as a step index; the launch command now invokes the runtime without the event.
3. The accessible alternative omitted structured Hub content and lacked mounted layout; it now renders equivalent structured instructions in a fixed, focusable, scrollable surface.
4. Runtime controls could be occluded by the Hub stacking context; canonical runtime surfaces now render through a document-level portal.

## Final Acceptance Evidence Table
| Flow | Representative / Route | Browser Executed | Result | Exact Evidence | Defect/Blocker |
|---|---|---:|---|---|---|
| Hub full flow | `admin.html#/hub`, `instructor_A_authorized` | YES | PASS | Authenticated Chromium started, advanced, reloaded, resumed, completed, and replayed the 13-step canonical Hub tour. | None observed. |
| Hub durable start/progress | Hub workspace | YES | PASS | API POST responses were 200; persisted IDs were `orientation:hub:workspace`, `hub:workspace`, version 1, Org A scope, and semantic step IDs. | None observed. |
| Hub reload/resume | Hub workspace | YES | PASS | Reload exposed Resume; server state restored `hub-workspace-kpis`; Resume reopened Step 2. | None observed. |
| Hub replay | Hub workspace | YES | PASS | Completion persisted; Replay reopened Step 1 and retained prior completion metadata/replay count. | None observed. |
| Accessible alternative | Hub workspace | YES | PASS | Step list opened in Chromium, rendered structured instructional content, accepted Close, and returned to Step 2 without completion. | None observed after bounded styling fix. |
| Cross-route continuation | None | NO | BLOCKED | Deterministic route tests pass, but no supported Route A/Route B browser fixture exists. | Missing test-only acceptance route. |
| Delayed target | None | NO | BLOCKED | Deterministic delayed/timeout tests pass, but no supported browser-controlled delayed-target fixture exists. | Missing test-only acceptance route. |
| Role matrix | API/resolver fixture | PARTIAL | PASS at server scope | Authorized and unauthorized role filtering/forgery tests pass; no separate browser role surface is mounted. | Browser role comparison route unavailable. |
| Org matrix | API/resolver fixture | PARTIAL | PASS at server scope | Org A/Org B context and state isolation pass; Hub has no supported org switch control. | Browser switch is not applicable to Hub. |
| 375px regression | Hub workspace | YES | PASS | Overlay, controls, and step-list content remained usable at 375px with no critical overflow observed. | None observed. |

## Final OGL-3 Decision
**PARTIAL — OGL-3 remains incomplete.** Hub durable experience state, reload/resume, replay, and the mounted accessible alternative are now accepted through authenticated Chromium and repository evidence. Migration 139, OGL-1 contracts, OGL-2 context authority, role/org isolation, and authority boundaries remain intact. Two repository-local P1 acceptance blockers remain: a safe browser cross-route fixture and a safe browser delayed-target fixture. OGL-4 and SEA have not started; no commit or push was performed.

## Final Fixture Remediation (2026-09-12)

### Cross-Route Acceptance Fixture Design
`src/system/orientation/acceptance/OglAcceptanceRoutes.jsx` provides the development-only `#/ogl-acceptance/route-a` and `#/ogl-acceptance/route-b` surfaces. One canonical `TourProvider` remains mounted around the route-changing content, with semantic anchors A and B and two canonical contract-shaped steps. Step A advances the real runtime before invoking React Router navigation to Route B, allowing the provider to preserve orientation/tour/version/org scope while the overlay reacquires the Route B target.

### Cross-Route Production Safety
The route is registered only when `import.meta.env.DEV` is true. The fixture is absent from the production route table, absent from normal navigation, uses no production workflow state, and has no authorization bypass or arbitrary URL execution. The API catalog entries are marked `testOnly` and are visible only when the existing development database identity fixture is enabled; production catalog resolution rejects them.

### Cross-Route Chromium Acceptance
Authenticated Chromium passed Route A load, Step A rendering and anchor resolution, canonical Next navigation, Route B load, removal of the Route A anchor/overlay, Step B readiness and rendering, and completion. The persisted record retained `orientation:ogl-acceptance:cross-route`, version 1, `ogl-acceptance:cross-route`, version 1, and the fixture user's Org A scope; the final step was `ogl-acceptance-step-b` with `COMPLETED` status. Native route tests continue to cover timeout, stale scope, and re-resolution behavior.

### Delayed-Target Acceptance Fixture Design
The same development-only fixture file provides `#/ogl-acceptance/delayed-target`. Its real canonical tour step targets semantic anchor C. The target is intentionally absent on first render and mounts once after a deterministic 900 ms timer. No network race or mocked readiness implementation is involved.

### Delayed-Target Production Safety
The delayed route shares the `import.meta.env.DEV` route guard and test-only API catalog gating. It contains only neutral acceptance content and cannot mutate service workflow, acknowledgment, Evidence, Truth, or privileged actions. Static native coverage verifies the guard, anchor IDs, real `TourProvider`, and deterministic delay.

### Delayed-Target Chromium Acceptance
Authenticated Chromium observed the fixture's target in `waiting` state with no broken coachmark, then observed anchor C after the controlled delay and the active Step 1 of 1 coachmark attached to it. The active overlay count remained one and the application stayed usable. Deterministic native coverage separately accepts the configured timeout/fallback path.

### Hub Regression After Fixture Work
The existing authenticated Hub spec passed independently after fixture integration. It retained canonical runtime execution, 13-step content/order, durable start/progress, reload/resume, completion, replay, accessible Step list, focus/Escape behavior, and 375 px presentation. No Hub workflow authority changed.

### Role / Org Evidence
The existing server and deterministic evidence remains authoritative for role and organization boundaries: `instructor_A_authorized` is permitted, `learner_A1` is denied protected role-scoped context, forged role/permission claims do not widen access, and `phase8_org_a` / `phase8_org_b` state remains isolated. The acceptance fixtures do not add an organization switcher or client-authoritative scope.

### Final P1 Closure Matrix
| OGL Gap ID | Severity | Starting Status | Work Performed | Tests / Browser Evidence | Final Status |
|---|---|---|---|---|---|
| OGL-GAP-003 | P1 | Runtime consolidation accepted; browser fixture coverage open | Both acceptance surfaces execute through canonical `TourProvider` and the Hub remains migrated | 13 native OGL tests; Hub and cross-route Chromium flows | CLOSED at OGL-3 scope |
| OGL-GAP-004 | P1 | Primitive scope accepted; browser alternative coverage open | Fixture surfaces retain the canonical accessible runtime and Hub Step list | Native accessibility tests; Hub Chromium Step list/focus/Escape/375 px flow | CLOSED at OGL-3 scope |
| OGL-GAP-005 | P1 | Durable state accepted; route fixture coverage open | Cross-route state preserves exact IDs/version/org scope; Hub browser resume/replay remains green | Native state tests; cross-route and Hub Chromium flows | CLOSED |
| OGL-GAP-009 | P2 | Runtime target handling accepted; browser readiness coverage open | Route B and delayed semantic targets exercise real readiness paths; test-only catalog gating prevents leakage | Native route/timeout tests; cross-route and delayed-target Chromium flows | CLOSED at OGL-3 scope |

### Final Browser Acceptance Matrix
| Acceptance | Browser Executed | Result | Evidence |
|---|---:|---|---|
| Hub full flow | YES | PASS | Authenticated Hub start, progress, reload/resume, completion, replay, Step list, focus/Escape, and 375 px regression |
| Hub resume | YES | PASS | Reload exposed Resume and reopened the persisted current step from migration 139 state |
| Hub replay | YES | PASS | Replay reopened Step 1 while retaining historical completion/replay metadata |
| Accessible alternative | YES | PASS | Hub Step list opened, rendered structured instructions, closed with focus restoration, and did not complete the tour |
| Cross-route Route A -> Route B | YES | PASS | Authenticated fixture reached Route B Step 2 without stale Route A anchor or restart; final state was COMPLETED |
| Delayed target | YES | PASS | Target was absent initially, waiting state displayed, anchor C mounted at 900 ms, and one active coachmark attached |
| 375 px regression | YES | PASS | Hub and fixture surfaces remained readable with reachable controls and no critical overflow observed |
| Role regression | PARTIAL | PASS at server scope | Existing authorized/unauthorized and forged-claim resolver tests remain green; fixture routes are role-scoped by server identity |
| Org isolation regression | PARTIAL | PASS at server scope | Existing Org A/Org B API and deterministic state-isolation evidence remains green; fixtures add no client org switch |

### Final OGL-3 Decision
**COMPLETE — repository-local OGL-3 implementation and its bounded authenticated browser acceptance are closed.** Canonical runtime route continuation, delayed-target readiness, timeout fallback, durable version/org-scoped state, Hub regression, accessible Step list, and 375 px behavior are accepted. The two acceptance surfaces are development/test-only and excluded from production behavior. OGL-1 remains contract authority; OGL-2 remains context authority; OGL experience state remains separate from workflow completion, acknowledgment, Evidence, Truth, Legal, and service-domain authority. OGL-4, SEA, and the Accessibility project have not started; no commit or push was performed.
