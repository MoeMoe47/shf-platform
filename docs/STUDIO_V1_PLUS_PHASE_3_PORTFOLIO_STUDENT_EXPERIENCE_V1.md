# Studio V1+ Phase 3: Portfolio Student Experience + Studio Bridge

## 1. Executive result

Phase 3 adds an authenticated student presentation layer over the durable Phase 2 Portfolio API. The curriculum Portfolio route reads canonical Portfolio records, and Studio's `What You Proved` view offers an explicit Add to Portfolio action for eligible Evidence. No migration or new authority was added.

## 2. Durable backend consumed

The frontend uses `GET /portfolio`, `GET /portfolio/artifacts`, `POST /portfolio/artifacts/from-evidence`, and `PATCH /portfolio/artifacts/:artifactId`. The backend derives learner, organization, tenant, Evidence, Studio project, delivery, exact revision, project type, and assignment lineage.

## 3. Route

The canonical student route is `/curriculum/asl/portfolio`, mounted by the existing Curriculum shell and sidebar. The existing Career route also uses the same durable page component. Legacy lesson and sidebar localStorage surfaces remain disconnected and are not imported.

## 4. API client

`src/lib/portfolio/api.js` is the authenticated client boundary. It sends only `evidenceId` for source creation and whitelists presentation fields for updates. It does not persist canonical state in browser storage.

## 5. Portfolio Home

The page presents My Work, saved artifact count, project type, finalized-version context, source verification language, visibility, and bounded presentation content. It links back to Studio.

## 6. Empty state

Learners with no artifacts see an honest What You Proved explanation and a link to My Studio Projects. No sample artifacts or inferred skills are shown.

## 7. Studio bridge

The existing Studio institutional status now performs a scoped Evidence-to-Portfolio artifact lookup. Portfolio availability is shown only after canonical Evidence exists. The status response marks each Evidence item as available or already added.

## 8. Add to Portfolio

Add to Portfolio is an explicit learner action. It posts only the Evidence identifier. The server validates finalized Student delivery, exact provenance, learner scope, and non-superseded Evidence.

## 9. Duplicate behavior

Repeated adds return the existing active artifact from the Phase 2 uniqueness boundary. The UI shows Already in Portfolio and links to the canonical route.

## 10. Artifact cards

Cards show Website or AI Agent, the learner-facing title, Verified Work or lifecycle state, finalized-version language, visibility, safe provenance explanation, and presentation content. Raw tenant, Evidence, delivery, and revision identifiers are not displayed in Beginner Mode.

## 11. Editing

Edit Presentation supports title, summary, reflection, and visibility. Updates are server-backed and failures preserve the existing artifact state.

## 12. Provenance presentation

The page explains that the artifact is connected to finalized Studio work without exposing infrastructure identifiers. Provenance remains read-only in the backend and is never included in the update payload.

## 13. Visibility

Only Private and Visible to My Organization are presented. Public and Unlisted are neither offered by the UI nor accepted by the backend. Organization visibility is not anonymous access.

## 14. Lifecycle controls

Learners can hide, show, archive, or remove a presentation through the existing PATCH lifecycle contract. These actions do not delete source work or institutional proof.

## 15. Ordering

Phase 3 keeps the existing position field available to the durable API but does not add a drag-and-drop or separate collections system. Ordering UI is deferred until a focused interaction is needed.

## 16. Competencies

Only canonical Evidence-backed outcomes may be displayed. Phase 3 does not turn competency IDs into invented labels or infer skills from project type, titles, or browser activity.

## 17. Assignment context

The backend retains assignment and release provenance where supplied by Evidence. The initial student card does not expose internal IDs; richer authorized assignment context remains a small follow-up presentation enhancement.

## 18. Stale source behavior

Artifacts remain bound to the finalized Evidence-backed revision. A later workspace revision cannot retarget or mutate an existing artifact; a later eligible Evidence source requires another explicit Add to Portfolio action.

## 19. Legacy isolation

The durable page does not read `portfolio:items`, `civic:portfolio:artifacts`, or lesson-local Portfolio values. Existing local/demo pages remain outside canonical Portfolio authority and are not migrated in Phase 3.

## 20. Companion boundary

Companion remains explanatory only. It cannot create, edit, hide, archive, remove, verify, complete, publish, deploy, register, or issue credentials for Portfolio or Studio.

## 21. Responsive behavior

The page uses a responsive grid with a single-column mobile layout, wrapped actions, bounded text fields, and no fixed-width artifact controls. Target acceptance sizes are 1440x900, 768x1024, and 390x900.

## 22. Accessibility

The page has semantic main/header/section/article headings, labeled form controls, role=status loading state, role=alert failure state, visible focus, text-based statuses, and reduced-motion CSS. Full screen-reader certification remains outside this phase.

## 23. Authorization

The backend remains authoritative for learner, organization, tenant, source eligibility, and visibility. Private artifacts are owner-scoped; organization artifacts use the existing authenticated Studio view permission and matching scope. The browser cannot inject provenance or institutional status.

## 24. Browser tests

Focused source contract coverage verifies durable API use, localStorage isolation, supported visibility, explicit Add to Portfolio, Already in Portfolio, and the canonical route. Existing authenticated Studio browser coverage remains the end-to-end source for finalized Evidence state; an environment with disposable PostgreSQL and authenticated fixture data is required for a full live Portfolio browser run.

## 25. Side effects

Portfolio actions can change only Portfolio records and bounded Portfolio outbox events. They do not create Evidence, Completion, Credentials, Truth facts, Deployment, Registry, or ClientOps records.

## 26. Phase 4 entry contract

Phase 4 is Public Website Deployment Authority + Provider Contract. It must preserve `Finalized != Deployed`, `Portfolio != Deployment`, and `Evidence != Deployment`, and must not expand Phase 3 visibility beyond Private and Organization without a new canonical authority decision.

## 27. Phase 3.1 live acceptance

Phase 3.1 acceptance uses `scripts/run-phase8-acceptance-env.mjs`, which creates an isolated PostgreSQL 16 cluster and database under the system temporary directory, replays migrations `001` through `075`, seeds the canonical Phase 8 identities and organization fixture, and starts isolated API and Vite processes. No persistent owner database is used. Each run drops the temporary database and stops the cluster.

The new `tests/phase3.1-portfolio-live.spec.mjs` drives the real authenticated Website and AI Agent Studio flows: create a project, save a workspace revision, run QA, submit and approve the exact review submission, finalize delivery, project Evidence, add the Evidence-backed Artifact, reload the durable Portfolio, and edit presentation fields. The clean serial run passed all three tests. Website coverage proved title/summary/visibility persistence after reload, duplicate add idempotency, organization-visible detail access, learner-private list isolation, and no deployment, Registry, or credential implication. AI Agent coverage proved durable Portfolio persistence, governed project type presentation, 390px layout, and absence of Registry/certification/production claims. The same run proved foreign learner and foreign organization artifact detail/update denial, including malformed identifier handling.

The live database checks observed one Portfolio profile and one Artifact per Evidence source, the expected Evidence projection, unchanged completion and credential counts, and bounded Portfolio outbox events. The Website flow also confirmed that Portfolio writes do not alter the Studio project or its institutional source facts. The canonical Phase 2.1 PostgreSQL acceptance remains passing for schema, uniqueness, provenance, visibility, superseded Evidence, removal containment, and event behavior.

The earlier live-spec failures were test assertion defects: an incorrect `integration_outbox.event_name` column, a race before awaiting review submission, assumptions about default presentation title, a learner list assertion where organization visibility is exposed by detail scope, and a boundary-language assertion matching the UI's truthful explanation of credentials. These were corrected in the acceptance spec only; no production defect was reproduced or fixed.

The earlier Phase 3.1 acceptance did not independently complete the assignment-origin path, a dedicated tablet run, or a dedicated keyboard/accessibility audit. Those gaps are closed by the Phase 3.2 acceptance below. Full screen-reader certification remains outside this phase.

## 28. Phase 3.2 final acceptance

Phase 3.2 used the same disposable PostgreSQL 16 harness with the `--phase9-master-fixture` option. Migrations `001` through `075` applied cleanly with no pending, drift, or unknown migrations. The acceptance fixture added a published assignment, active completion policy, required `STUDIO_PROJECT` Website requirement, learner target, evidence rule, and existing Studio permissions using canonical tables; the learner then created the assignment-origin handoff through the authenticated Studio API.

The live assignment golden path passed: assignment handoff and repeated Start Project were idempotent, the project retained its assignment and release lineage, the learner saved a revision, passed QA, submitted the exact revision, received instructor approval, finalized delivery, prepared Evidence, and added that Evidence to durable Portfolio. The artifact retained the Evidence, Studio project, exact revision, and assignment references. Completion was evaluated by the existing completion service; Portfolio addition created no additional completion, credential, delivery, or unrelated institutional side effect.

The controlled PATCH failure returned a truthful alert, did not show the edited title as canonical success, and a retry persisted the title after reload with no duplicate artifact and exactly one update event. A four-test serial Playwright run passed. The same canonical Portfolio page passed at `1440x900`, `768x1024`, and `390x900`, with no horizontal overflow, visible controls, wrapped content, keyboard-operable editing, no Public or Unlisted options, and reduced-motion emulation. Playwright accessibility-tree snapshots exposed the Portfolio heading, labeled presentation fields, and Visibility control. This is an accessibility baseline, not full VoiceOver/NVDA certification.

The run rechecked fake `portfolio:items`, `civic:portfolio:artifacts`, and lesson-local Portfolio storage and none appeared in the durable page. Same-organization private reads, foreign-organization reads/writes, forged provenance, and unsupported visibility remained denied. Database inspection showed only the expected Portfolio profile/artifact and bounded Portfolio events after the Portfolio action; completion, credentials, and Studio delivery counts remained unchanged. No production defect was reproduced, so no production source fix was required. Phase 3 is ready for the separately scoped Phase 4 deployment authority contract.
