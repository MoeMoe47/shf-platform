# Data Center & AI Infrastructure — CPAS-1 Pilot Audit v1

This is the first pathway run through the [SHF Career Pathway Acceptance Standard v1](./SHF_CAREER_PATHWAY_ACCEPTANCE_STANDARD_V1.md) (CPAS-1). It produced the populated record at `docs/career/records/DATA_CENTER_AI_INFRASTRUCTURE.pathway-record.json`. This document is the evidence trail behind that record's classification. No curriculum, backend, or Career Center page content was changed to produce this audit — it is read-only evidence gathering plus specification authorship.

> **Correction (Phase 2, 2026-09-14):** while building the Employer Validation Package, deeper verification of `apps/shs-api/src/domain/prepare-prove/service/prepare-prove-service.ts` found 41 real, DB-backed proof/competency activities across all 6 specializations (grades 11-12) — not the single migration-seeded competency this audit originally reported for Domains 4-7 (Competencies, Practice, Assessment, Evidence). The original finding undercounted because it inspected only migration-seeded rows, not the in-code registry that upserts rows on demand. Domain *status* classifications (all PARTIAL) are unchanged, and the overall Pathway Status (PREPARE) and Validation Status (NOT REVIEWED) are unchanged — the correction affects the depth of evidence within PARTIAL, not the gate outcome. Rows 4-7 below are marked `[Corrected by Phase 2]` and the record JSON has been updated to match.

## 1. Data Center Program Inventory (verified fresh this pass)

- **Career identity (backend, canonical):** exactly 1 row in `career_families` (`career_family_data_center_ai_infrastructure`, "Data Center & AI Infrastructure"), exactly 1 row in `careers` (`career_data_center_technician`, "Data Center Technician"), exactly 1 row in `career_curriculum_requirements` (linking to `data-center-foundations` / `data-center-foundations-introduction`, DISCOVER stage, grades 6-8) — all seeded in MIGRATION `033_career_workforce_foundation.sql`, replayed byte-identically in `047_reconcile_missing_030_032_033_schema.sql`. Confirmed no other migration (checked all 142) ever inserts additional rows into these three tables.
- **Curriculum content:** 168 lesson JSON files under `src/content/lessons/data-center-*-student/`, exactly: grade 6 (10), grade 7 (10), grade 8 (10), grade 9 (14), grade 10 (14), grade 11 (58), grade 12 (52). Pathway architecture in `src/content/curriculum/data-center-pathway-map.json` (707 lines): 4 stages (DISCOVER grades 6-8, EXPLORE grades 9-10, PREPARE_PROVE grades 11-12, TRANSITION — no grade band, not implemented), 13 course records, 6 specializations (`technical-operations`, `networking-fiber`, `electrical-infrastructure`, `mechanical-hvac`, `cybersecurity-security`, `ai-cloud-infrastructure`).
- **Career-content tagging:** 56 of 168 lesson files carry a `careerConnection.careerId` field, always `data-center-technician` — real content-level career tagging that is more extensive than the single backend requirement row, but not yet mirrored into `career_curriculum_requirements`.
- **`program_careers` (career-pathways domain, MIGRATION `049_career_pathway_integration.sql`):** table exists, 0 rows (the underlying `programs` table has 0 rows across all 142 migrations).
- **Competency (`prepare-prove`, MIGRATION `034_prepare_prove_evidence_competency.sql`, replayed in `048`):** exactly 1 `competency_definitions` row (`competency_prepare_prove_monitoring_finding`, domain `data-center-technical-operations`, evidence requirement `SIMULATED_INFRASTRUCTURE_MONITORING`). No `career_id` column exists on this table — the link to Data Center is a free-text `domain` string, not a foreign key.
- **Assessment:** no DB-backed assessment/rubric table distinct from the one competency's evidence review. All other "assessment" is client-side `quiz`/`rubric` fields inside the 168 lesson JSON files.
- **Evidence → Portfolio:** `POST /portfolio/artifacts/from-evidence` (`apps/shs-api/src/domain/portfolio/api/routes.ts`) is real, but its `eligibleSource()` query (`portfolio-service.ts`) requires `source_type='STUDIO_DELIVERY'` — it does not accept the Data Center competency's `SIMULATED_INFRASTRUCTURE_MONITORING` evidence type.
- **Credential:** a real, detailed, `status: "ACTIVE"` certificate-profile config exists — `foundation.data-center-ai-infrastructure-pathway` (`apps/shs-api/src/domain/credentials/model/certificate-profile.ts`), `certificateType: PROGRAM_COMPLETION`, referencing `canonicalProgramReference: "data-center-specialization-11"`. It is not operational: no `credential_definitions` row is seeded for it, its `eligibilityRuleKey` (`foundation.program_completion.v1`) has no implementing evaluator anywhere in `apps/shs-api/src`, and its `programReference` points at a `programs` table row that was never inserted. A separate `grade12-eligibility-policy.ts` and several services (`specialization-request-service.ts`, `capstone-entry-service.ts`, `curriculum-completion-service.ts`) already operate against the `data-center-specialization-11` id by convention, and `program_course_assignments` (MIGRATION `037`) is a real table — but the foundational `Program` row itself does not exist.
- **Arcade, Opportunities, Organizations/Employer, Universe/Metaverse, Treasury:** all confirmed absent for Data Center specifically this pass (see Domain 10 below for citations). One unrelated, pre-existing Store catalog card references Data Center (see §9).
- **Accessibility layer:** a real, substantial, platform-wide Curriculum accessibility system exists (`src/styles/curriculum-a11y.css`, `src/context/EffectiveAccessibilityContext.jsx`, tested in `tests/aielPhase4CurriculumAccessibility.test.mjs`) covering text scale, contrast, focus emphasis, target size, and reduced motion — Data Center content inherits this as part of the Curriculum app shell, but no test or content exercises it by name. A newer AX-3 content-accessibility service (`apps/shs-api/src/domain/accessibility-content`) exists with a real Data Center import adapter (`curriculum-import-source-adapter.ts`, unit-tested against the real 168 files), but there is no evidence that import was ever executed against a live database.

## 2. Pathway Acceptance Record Specification

See `docs/career/SHF_CAREER_PATHWAY_ACCEPTANCE_RECORD_SCHEMA_V1.json` — the smallest appropriate specification, authored as a docs/JSON artifact with no new backend authority (per the Standard's Canonical Domain Boundaries section). No repository evidence showed an existing domain that already owns "cross-domain pathway acceptance status" as a concept, so this is genuinely new metadata — but it lives in documentation, not a database, in this phase.

## 3. Acceptance Gates

See the Standard, §"Acceptance Gates." Applied to Data Center below.

## 4. Data Center 12-Domain Acceptance Matrix

| # | Domain | Status | Repository Evidence | Gap | Required Action |
|---|---|---|---|---|---|
| 1 | Career Definition | PARTIAL | `career_families`/`careers` (MIGRATION 033) define Data Center Technician accurately, non-fabricated; 56/168 lessons content-tag `careerConnection.careerId`. | Only 1 of 6 specializations (Data Center Technician) has a canonical Career record; the other 5 (Network/Electrical/HVAC/Cybersecurity/Cloud-AI Technician) are explicitly self-flagged `"NEEDS SEPARATE CAREER PHASE"` in `data-center-pathway-map.json`. | Run a Career Phase for the remaining 5 specialization roles, or scope this pathway's CPAS-1 record to Data Center Technician only until they exist. |
| 2 | Labor Relevance | PARTIAL | Data Center Technician is a real, plausible entry-level occupation description (`careers` table); curriculum content is technically coherent with real data-center operations concepts. | No independent/sourced labor-market evidence (no SOC/wage/employment data anywhere connected to `careers`); relevance is internally asserted, not externally confirmed — that confirmation is Domain 9's job. | Do not add fabricated labor data; pursue Domain 9 (External Recognition) instead — labor relevance and employer validation are the same underlying gap here. |
| 3 | Curriculum | PARTIAL | 168 real, well-structured lesson files across 7 grade bands; consistent schema; explicit non-overclaiming language throughout sampled content. | Content is static JSON, not imported into the canonical `curriculum_lessons`/`units`/`courses` tables (a real import adapter exists — `curriculum-import-source-adapter.ts` — but no evidence it was ever executed); only 1/168 lessons is wired via `career_curriculum_requirements`. | Execute the existing import adapter against a real database, or explicitly decide static-JSON delivery is the intended production path; wire more of the 56 career-tagged lessons into `career_curriculum_requirements`. |
| 4 | Competencies | PARTIAL | **[Corrected by Phase 2, 2026-09-14]** 41 named proof/competency configs exist in `apps/shs-api/src/domain/prepare-prove/service/prepare-prove-service.ts` (`PROOF_CONFIGS`), each upserted into the real `competency_definitions` table on first read — spanning all 6 specializations at grades 11-12 (6-7 per specialization), not just the 1 migration-seeded row this audit originally found. | Still no `career_id` FK links any of these to Data Center — only a free-text `domain` string; whether any real learner has completed one in a live database is unverified (repo inspection only). | Add a real Career↔Competency contract (not free-text). The competency *map* itself is far more complete than originally assessed. |
| 5 | Practice | PARTIAL | **[Corrected by Phase 2]** `practice`/`lab` fields present across many lessons; 31 of 168 lesson files carry a populated `proofActivity` field wired to the real 41-activity backend pipeline via a generic `ProofActivity` component (`src/components/curriculum/lesson/GuidedLessonExperience.jsx`), covering all 6 specializations, not one. | The flagship Grade-12 capstone project is explicitly `ARCHITECTURE_DEFINED_NON_EXECUTABLE` — cannot be completed end-to-end today (distinct from the real, working `*-project.json` proof activities, which are not the same thing as the capstone). Access to proof activities is gated by `program_specialization_assignments`/`program_course_assignments` records whose live population was not verified. | Do not represent the capstone as available until executable; verify live gating-record population before claiming students can actually reach these activities today. |
| 6 | Assessment | PARTIAL | **[Corrected by Phase 2]** Every lesson has client-side `quiz`/`rubric` content; a real, DB-backed, permission-gated, reviewer-verified assessment workflow (`DEMONSTRATED`/`EVIDENCE_INSUFFICIENT`/`NEEDS_REVIEW`) exists for 41 activities across all 6 specializations, not 1. | No canonical assessment/rubric table beyond the prepare-prove workflow; all other assessment remains unverified client-side content; live usage unverified from static inspection. | Decide whether client-side quiz results should ever become canonical evidence; the practical-assessment bridge is more built-out than originally assessed but still unverified in live use. |
| 7 | Evidence | PARTIAL | **[Corrected by Phase 2]** Real `prepare_prove_evidence` pipeline with a genuine reviewer decision workflow, covering 41 activities across all 6 specializations (corrected activity-type name: `SIMULATED_INFRASTRUCTURE_PROOF`, not `SIMULATED_INFRASTRUCTURE_MONITORING` as originally recorded). | None of these evidence records can currently flow into Portfolio (`eligibleSource()` requires `STUDIO_DELIVERY`) — this gap is broader than originally stated (41 blocked pipelines, not 1) but the underlying limitation is unchanged. | Extend Portfolio's evidence-source acceptance (or add an adapter) so Data Center's real evidence types can become portfolio artifacts — a Curriculum/Portfolio integration task, not a new authority. |
| 8 | Credential Strategy | PARTIAL | A real, detailed, honestly-labeled certificate-profile config exists (`foundation.data-center-ai-infrastructure-pathway`), including 6 external-alignment entries each correctly self-labeled `NOT ISSUED / PLANNED`. | Zero operational path: no eligibility evaluator, no `credential_definitions` row, and it references a `programs` row that does not exist. | Decide whether to build the missing `Program` row + eligibility evaluator, or treat this config as aspirational-only until then; do not present it as an active credential. |
| 9 | External Recognition | MISSING | `data-center-pathway-map.json`'s own `boundaries.employerStatus` field states: `"DEFERRED: partner categories are planning references, not commitments."` No organization relationship, no state authority, no industry-standard review found anywhere. | No employer, state authority, or industry body has reviewed or engaged with this pathway. | This is the actual work of Phase 1G (Employer Validation Gap Map, below) — not something a documentation phase can close. |
| 10 | Work-Based Learning | MISSING | Confirmed zero hits for "data-center" in: Arcade (`src/pages/arcade/`, `src/data/arcadeHomeFixtures.js`), Opportunities (MIGRATION `046_career_events_opportunities_foundation.sql`, `apps/shs-api/seeds/`), Organizations (MIGRATION `032_organization_relationships_program_stewardship.sql`, `085_organization_onboarding_lifecycle.sql`), Universe/Metaverse (current `src/pages/universe-v1/universeDestinationRegistry.js`, post-Phase-0 correction). `data-center-pathway-map.json`'s own `transition.notYetImplemented` field lists: `credentials, internships, apprenticeships, employment matching, readiness scoring`. | No opportunity, employer relationship, or placement mechanism of any kind exists. | This is Phase 1H territory (Career Launch Gap Map) — no work-based-learning route can be built in this phase per the DO NOT IMPLEMENT list. |
| 11 | Accessibility + SEL | PARTIAL | Real, tested, platform-wide Curriculum accessibility layer (text scale, contrast, focus, target size, reduced motion — `src/styles/curriculum-a11y.css`, `tests/aielPhase4CurriculumAccessibility.test.mjs`) applies to all Curriculum content including Data Center. SEL: `reflectionPrompt` present in all 168/168 lessons. | Zero Data-Center-specific accessibility verification; zero per-lesson accessibility metadata; SEL is limited to reflection only — no explicit teamwork/persistence/goal-setting fields (see §7/§8 below for full breakdown). | See §7 (Accessibility Findings) and §8 (SEL Findings) for the itemized gap list. |
| 12 | Outcome / Next Step | PARTIAL | Every lesson has a real `nextSlug` field; transition-labeled lessons (e.g. `data-center-specialization-12-career-postsecondary-transition.json`) honestly frame options "without promises." | The pathway map's own TRANSITION stage has no grade band and is not implemented — there is no real *external* next step defined beyond "more lessons." | Do not claim a defined external next step exists; treat TRANSITION-stage work as the natural home for whatever Domains 9/10 eventually produce. |

## 5. Current Data Center Classification

**Pathway Status: PREPARE**

**Validation Status: NOT REVIEWED**

This deliberately does not match the prompt's own suggested illustrative example ("INDUSTRY REVIEW IN PROGRESS") — no evidence of any employer, industry reviewer, or state authority engagement of any kind was found anywhere in the repository for this pathway. "In progress" would overstate what has actually happened, which is nothing yet. `NOT REVIEWED` is the accurate call per the Standard's own instruction not to force an expected result.

Explicit answers:
- **Is curriculum complete?** Content-wise, yes — 168 real lessons across all 7 grade bands. Canonically (DB-backed, wired to the career record), no — only 1/168 lessons is linked via `career_curriculum_requirements`, and the content has not been imported into the curriculum-catalog tables the newer accessibility-content tooling reads from.
- **Are target occupations clear?** Yes for Data Center Technician (canonical). No for the other 5 specialization-implied roles (self-flagged as needing a separate Career phase).
- **Are competencies explicitly mapped?** Only one, narrowly (`competency_prepare_prove_monitoring_finding`), and only linked by a free-text domain string, not a real FK.
- **Is practical work defined?** Yes in content (`practice`/`lab` fields) and yes for one real DB-backed evidence type; the Grade-12 capstone is defined but not executable.
- **Are assessments sufficient?** Sufficient as learning-support content (every lesson has a quiz); not canonically verified beyond the one competency.
- **Is evidence defined?** Yes for one competency, with a real reviewer workflow.
- **Is portfolio output defined?** Defined in principle but not functionally connected — Portfolio's evidence intake currently rejects this pathway's evidence type.
- **Is a credential strategy defined?** Yes, on paper, honestly labeled as not-yet-issued; not operational.
- **Is an external credential aligned?** Listed as potential alignments only (CompTIA A+/Network+/Security+, etc.), explicitly `NOT ISSUED / PLANNED`.
- **Has any employer reviewed it?** No.
- **Has any employer formally validated it?** No.
- **Is there a work-based-learning partner?** No — only non-committal "partner category" references.
- **Is there an internship?** No.
- **Is there an apprenticeship?** No.
- **Is there a pre-apprenticeship route?** No.
- **Is there a job-shadow/employer-project route?** No.
- **Is there a real Opportunity record?** No.
- **Is there Arcade integration?** No.
- **Is there Metaverse integration?** No.
- **Is there accessibility review?** A real, platform-wide review/testing effort exists for Curriculum generally; none specific to Data Center content.
- **Is SEL/readiness integrated?** Minimally — reflection only, in every lesson.
- **What is the learner's real next step today?** Continue to the next lesson (`nextSlug`) through grade 12; beyond that, nothing external is defined yet — the pathway map's own TRANSITION stage is unimplemented.

## 6. Allowed / Prohibited Public Claims

See the populated record's `outcome.allowed_claims` / `outcome.prohibited_claims` (`docs/career/records/DATA_CENTER_AI_INFRASTRUCTURE.pathway-record.json`) for the canonical list. Reproduced here for visibility:

**Allowed**, because repository evidence supports them: foundational Data Center & AI Infrastructure exploration/preparation for grades 6-12; 168 lessons across 7 grade bands and 6 specializations; hands-on/practical activities including a working simulated-monitoring practice-and-review pipeline; reflection in every lesson; accurate, non-overclaiming career-connection content tied to the real Data Center Technician occupation; benefit from SHF's platform-wide accessibility features; explicit safety design distinguishing simulated practice from professional work; a documented (not-yet-issued) completion-certificate concept.

**Prohibited / not yet supported**: job-ready/workforce-ready; industry certified / any named external certification; employer validated / industry validated; state recognized / state licensure pathway; guaranteed internship/apprenticeship/employment/placement; "Career Launch" as a designation; "in-demand" or other unsourced labor-market claims; any specific short program-duration claim; employer/industry partnership claims; implying the Grade-12 capstone is completable today.

## 7. Accessibility Findings

| Item | Status | Evidence |
|---|---|---|
| Keyboard navigation | PARTIAL | `GuidedLessonExperience.jsx` (the canonical lesson renderer) relies on native focusable elements; no custom keydown/tabIndex handling found, and sufficiency was not independently verified in this pass. |
| Screen-reader compatibility | PARTIAL | 10 `aria-*` attributes, 5 `role=` attributes, 1 `aria-live`, 1 `sr-only` class found in `GuidedLessonExperience.jsx` — real but modest; not comprehensively verified. |
| Captions/transcripts | NOT APPLICABLE (for current content) | The platform accessibility-profile model (`accessibility-profile.ts`) has real `captionPreference`/`transcriptPreference` fields and generic test coverage (`<track>` default state), but Data Center lesson content has zero embedded video/audio — confirmed by direct grep in the curriculum-import adapter's own code comment ("zero occurrences of media in any real Data Center file"). Nothing currently needs captioning. |
| Contrast | PARTIAL | Real HIGH-contrast, WCAG-AA-oriented CSS mode exists platform-wide for Curriculum (`curriculum-a11y.css`), tested generically (`aielPhase4CurriculumAccessibility.test.mjs`); not verified against Data Center pages specifically. |
| Reduced motion | PARTIAL | `prefers-reduced-motion` handling confirmed present in `lesson.css`, `curriculum-dashboard.css`, `curriculum-shell.css` — generic to Curriculum, not Data-Center-specific. |
| Responsive/mobile use | MISSING (not verified) | Not directly audited in this pass; no evidence found either way. Flagged for a dedicated follow-up rather than assumed. |
| Alternate activity formats | MISSING | No alternate-format field or content found in any of the 168 lesson JSON files. |
| Printable/offline formats | MISSING | No evidence of print/offline support for Curriculum lessons (unlike, e.g., Resume Builder's print CSS elsewhere in the app). |
| Deaf learner support | PARTIAL | Caption/transcript-preference infrastructure exists platform-wide; not exercised because no media exists in Data Center content yet; no documented Deaf-specific accommodation pathway beyond the generic accessibility profile. |
| Blind/low-vision support | PARTIAL | Real ARIA/contrast/text-scale/text-to-speech infrastructure exists; comprehensive screen-reader flow through an actual Data Center lesson was not independently verified in this pass. |
| Neurodiverse learner support | PARTIAL | Reduced motion plus `readingSupport`/`readAloudPreference` fields in the accessibility-profile model suggest real consideration; no Data-Center-specific verification. |
| Physical-access considerations for hands-on work | MISSING | No documented accommodation strategy was found for learners who cannot perform the physical hands-on/hardware tasks this pathway is built around (the curriculum's own safety block defers hazardous physical work to qualified partners, but does not address an alternate route for a physically-limited learner). |

No item above is marked COMPLETE, per the standard's own rule not to award COMPLETE without evidence — every real capability found is platform-wide and generically tested, not verified against Data Center specifically.

## 8. SEL / Readiness Findings

| Item | Status | Evidence |
|---|---|---|
| Reflection | PRESENT | `reflectionPrompt` field in all 168/168 lesson files. |
| Confidence | PARTIAL | Only indirectly supported via reflection; no dedicated confidence-building mechanism found. |
| Persistence | MISSING | No explicit field or content found. |
| Communication | MISSING (curriculum-wide) / mentioned at capstone-architecture level only | `grade12Architecture.capstone` references team roles, but the capstone itself is non-executable. |
| Teamwork | Same as communication | Capstone-architecture-level only, non-executable. |
| Responsible decision-making | MISSING (as learner-facing SEL content) | The competency review process itself models evidence-based decision-making, but only for reviewers, not as SEL content for learners. |
| Professional identity | PARTIAL | Touched indirectly in transition-lesson objectives (e.g. "distinguish learning completion from reviewed competency," `data-center-specialization-12-career-postsecondary-transition.json`). |
| Goal setting | MISSING | No explicit field found anywhere in sampled or searched content. |
| Handling mistakes | MISSING (as learner-facing content) | Not present as explicit SEL content; the reviewer-decision states (`NEEDS_REVIEW`/`EVIDENCE_INSUFFICIENT`) are backend workflow states, not learner-facing framing. |
| Asking for help | MISSING | No explicit field found. |

SEL support here is real but minimal — universal reflection, nothing more, consistent with the Standard's instruction that SEL be supportive rather than a scored/clinical framework (which this correctly avoids by not attempting one at all).

## 9. Duplicate/Unsupported-Claim Flag Found During This Audit

Not part of the original 12-domain scope, but surfaced during integration checks and worth recording: `src/data/catalogOfferings.js` contains an unrelated Store catalog card (`id: "data-center-career-pathway"`, title "Data Center Career Pathway") describing "A 12-week workforce pathway leading to in-demand data center careers," with `detailHref: null`. This does not match the real pathway (a multi-year, grade-banded K-12 program, not a 12-week course) and asserts "in-demand" without sourced labor data. This phase does **not** touch that file (out of the strict Phase 1 scope, and editing Store content is not part of this mission) — flagged here so it is captured in the prohibited-claims list and can be corrected in a future, appropriately-scoped pass.

## 10. Employer Validation Gap Map (PREPARE → EMPLOYER-VALIDATED)

| Review area | SHF provides | Employer reviews | Employer response recorded | Evidence required for validation |
|---|---|---|---|---|
| Target occupation | Career record + description (`careers` table) | Confirms the occupation and its entry-level framing are accurate | Written confirmation or correction, dated, attributed | A named reviewer + organization, with a recorded decision |
| Curriculum | 168 lessons, pathway map, grade progression | Reviews scope/sequencing against real entry-level expectations | Scope adequacy rating + notes | Documented review artifact referencing specific lesson/course ids |
| Competency map | The one existing competency (and any expansion) | Confirms competencies match real on-the-job skills | Gap list of missing competencies | A reviewed, employer-annotated competency map |
| Tools/equipment | Content description of tools/environment referenced in lessons | Confirms tools/equipment match real current industry practice | Notes on outdated/missing tools | Employer sign-off per tool/equipment category |
| Safety | Existing safety block (adult supervision, hazardous work deferred) | Confirms safety framing matches real industry safety standards | Safety adequacy rating | Documented safety review, ideally citing an industry safety standard |
| Practical activities | `practice`/`lab` content + the one working simulated-evidence pipeline | Confirms practical activities resemble real entry-level tasks | Realism rating + gap notes | Employer-observed or employer-reviewed practical-activity sample |
| Assessment | Per-lesson quizzes + the one DB-backed competency review | Confirms assessment rigor is appropriate for entry-level readiness | Rigor rating | Employer review of assessment approach/sample items |
| Evidence | `prepare_prove_evidence` records for the one competency | Confirms evidence requirements reflect real workplace verification practice | Adequacy rating | Employer review of the evidence requirement definition |
| Professional practice | Safety/professionalism content in curriculum | Confirms professional-practice expectations are realistic | Notes | Employer sign-off |
| Entry-level relevance | Full curriculum + competency + evidence package | Confirms overall relevance to an actual entry-level hire | Relevance rating | A documented relevance statement |
| Missing skills | N/A — this is the employer's output | Identifies skills SHF's curriculum does not yet cover | A gap list | The gap list itself, incorporated into future curriculum planning |
| Credential recommendations | The existing (inert) certificate-profile config + external-alignment list | Recommends which external credentials are realistic/worth pursuing | A prioritized recommendation list | Employer or industry-body recommendation, documented |
| Work-based-learning feasibility | Nothing yet (confirmed MISSING, Domain 10) | Assesses whether their organization could offer any accepted WBL route | A feasibility statement | A documented feasibility response, even if the answer is "not yet" |

Moving from `NOT REVIEWED` to `EMPLOYER REVIEWED` requires at least one row above to have a real, dated, attributed employer response. Moving to `EMPLOYER VALIDATED` requires all rows to have one. `MULTIPLE-EMPLOYER VALIDATED` requires the same from more than one independent employer.

## 11. Career Launch Gap Map (EMPLOYER-VALIDATED → CAREER LAUNCH)

| Item | Current State | What Is Needed |
|---|---|---|
| Real work-based-learning route | None (confirmed MISSING, Domain 10) | One accepted route type (Registered Apprenticeship, youth/pre-apprenticeship, paid/structured internship, co-op, employer project, job shadow, interview/hiring pathway) actually offered by a real partner |
| Partner organization | None | A real `organizations` domain record with an actual relationship to this pathway |
| Opportunity type | None | A real `opportunities` domain record (internship/apprenticeship/job/etc.) referencing this career |
| Learner eligibility | Undefined | Explicit, documented eligibility criteria (grade, competency status, evidence completion) |
| Placement capacity | Unknown | A stated, real capacity number from the partner, not assumed |
| Application/selection process | None | A defined, fair selection process, documented |
| External acceptance decision | None | A real acceptance/rejection record per applicant, owned by Opportunities/Organizations, not fabricated by Career Center |
| Start tracking | None | A real start-date record tied to the Opportunity |
| Completion tracking | None | A real completion record, canonically owned by whichever domain the work-based-learning experience lives in |
| Credential strategy | Config exists but inert (Domain 8) | An operational eligibility evaluator + seeded `credential_definitions` row, or an honest decision to keep it aspirational until built |
| Outcome tracking | None | A governed Reporting/Truth-eligible outcome record — not a client-side or `localStorage` number (see the Phase 0 governance correction for why this matters) |
| Reporting requirements | None | Whatever Reporting/Truth's existing governance requires for a public outcome claim |
| Permitted public claims at Career Launch | N/A yet | Only what all of the above actually supports — "Career Launch" itself must not be claimed until every row here is real |

Per the DO NOT IMPLEMENT list, none of the systems in this table are built in this phase.

## 12. Data Center & AI Infrastructure Employer Validation Package — Outline

A future, separate effort should assemble a real package with these sections. No employer names, endorsements, or validation outcomes are invented here — each section below states only what SHF currently has to draw on, honestly.

1. **Executive Overview** — draw from `data-center-pathway-map.json`'s stage/scope summary.
2. **Target Entry-Level Roles** — Data Center Technician (canonical); the other 5 specialization-implied roles, clearly marked as not-yet-canonical.
3. **Program Purpose** — draw from the pathway map's stated purpose and boundaries block.
4. **Curriculum Summary** — the 168-lesson, 7-grade-band structure; 13 course records; 6 specializations.
5. **Competency Map** — the one existing competency, explicitly presented as a starting point, not a complete map.
6. **Practical Activities** — `practice`/`lab` content plus the one real simulated-monitoring evidence pipeline.
7. **Student Learning Journey** — DISCOVER → EXPLORE → PREPARE_PROVE, with TRANSITION honestly marked not-yet-implemented.
8. **Assessment Model** — per-lesson quizzes plus the one DB-backed competency review; state plainly that this is not yet a comprehensive assessment system.
9. **Evidence / Portfolio Examples** — the one working evidence type; disclose the current Portfolio-intake gap rather than implying it's solved.
10. **Credential Strategy** — the existing certificate-profile config and external-alignment list, explicitly labeled inert/not-yet-operational.
11. **Safety / Professional Practice** — the existing safety block (adult supervision, hazardous-work deferral).
12. **Accessibility / Learner Support** — the real platform-wide Curriculum accessibility layer, with an honest note that Data-Center-specific verification has not been done.
13. **Learning Arcade Strategy** — state plainly: none exists today; this section is a placeholder for future work, not a claim.
14. **Proposed Metaverse Simulation Strategy** — state plainly: none exists today; proposal-only, no destination or simulation has been built (and none should be, per this phase's scope).
15. **Proposed Work-Based-Learning Model** — draw from §11 (Career Launch Gap Map) as the proposal, not as an existing program.
16. **Employer Validation Questionnaire** — draw directly from §10 (Employer Validation Gap Map)'s review areas.
17. **Employer Feedback Record** — a template only, to be populated once real feedback exists; must never contain placeholder/fabricated feedback.
18. **Validation / Sign-Off Record** — a template only, `validation_status: NOT REVIEWED` until real sign-off exists.
19. **Partnership Options** — the pathway map's existing partner *categories* (data center operators, community colleges, apprenticeship providers, unions), explicitly labeled as categories, not commitments.
20. **Review / Renewal Schedule** — populate from the pathway acceptance record's `governance.next_review_date` once a reviewer sets one.

## 13. Canonical Authority Verification

No new Career, Curriculum, Competency/Evidence, Credential, Employer/Organization, Opportunities, Portfolio, Reporting/Truth, Treasury, or Metaverse authority was created by this phase. Every fact in the pathway record and this audit references an existing canonical id (career id, competency id, curriculum id, credential-profile id) rather than restating or duplicating that domain's content. The one genuinely new artifact — the pathway acceptance record itself — is a documentation-only cross-domain index; see the Standard's recommendation that any future live version live inside the existing `careers` domain rather than as a new top-level domain.
