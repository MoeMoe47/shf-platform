# Healthcare Workforce Readiness — Pass 2 Implementation Work Order

Status: DRAFT — PARALLEL PASS 2
Branch: `agent/pass2-readiness-healthcare`
Baseline: `af2faa2`
Stable key: `shu-healthcare-workforce-readiness`

## 1. Purpose

Define the controlled implementation boundary for Healthcare Workforce Readiness after completion of the Pass 2 planning artifacts.

This document is Artifact 4 of 4 for Healthcare Pass 2.

It governs future implementation work only after review approval.

It does not itself authorize production publication.

It does not create:

- source lessons
- competency definitions
- competency IDs
- proof configurations
- evidence records
- migrations
- credentials
- regulated healthcare training authority
- clinical authority
- licensure
- certification
- employer authorization

## 2. Governing Documents

Implementation must conform to:

- `docs/readiness/READINESS_PARALLEL_PASS_2_MASTER_WORK_ORDER.md`
- `docs/readiness/HEALTHCARE_WORKFORCE_READINESS_REUSE_AUDIT.md`
- `docs/readiness/HEALTHCARE_WORKFORCE_READINESS_BLUEPRINT.md`
- `docs/readiness/HEALTHCARE_WORKFORCE_READINESS_SOURCE_CURRICULUM_PLAN.md`
- `docs/readiness/HEALTHCARE_WORKFORCE_READINESS_LESSON_REUSE_MAP.md`
- `docs/readiness/HEALTHCARE_WORKFORCE_READINESS_PROOF_ACTIVITY_PLAN.md`

If implementation would conflict with a canonical system authority, implementation must stop and escalate for integration review.

## 3. Implementation Objective

Build Healthcare Workforce Readiness as a composition over existing SHU authorities.

The implementation must preferentially:

REUSE
→ CONTEXTUALIZE
→ EXTEND
→ BUILD NEW ONLY WHEN PROVEN MISSING

The implementation must not recreate universal readiness capability merely because Healthcare uses different examples.

## 4. Course Identity

Canonical stable key:

`shu-healthcare-workforce-readiness`

Proposed structure:

- 12 units
- 60 lessons

The 60-lesson count remains intentional.

Healthcare must not be expanded to 75 lessons simply to match other readiness courses.

## 5. Architecture Principle

Healthcare Workforce Readiness is a readiness course.

It is not:

- STNA training
- CNA training
- nursing education
- phlebotomy certification training
- EMT training
- paramedic training
- clinical placement
- employer onboarding
- licensure preparation authority
- clinical qualification authority

The implementation may prepare learners for those pathways.

It may not claim to replace the required external authority.

## 6. Core Source Strategy

The primary source strategy is composition over existing UCR content located under:

`src/content/lessons/shu-universal-career-readiness-student/`

Healthcare implementation must avoid copying UCR lessons wholesale into separate Healthcare lessons when composition or contextualization can accomplish the same objective.

Where practical, Healthcare should reference, compose, parameterize, or extend existing UCR content.

## 7. UCR Reuse Requirement

The following UCR capability areas must be treated as existing authority unless a later audit proves otherwise:

- reliability
- professionalism
- communication
- teamwork
- safety awareness
- scope awareness
- problem solving
- decision making
- digital responsibility
- responsible AI use
- accessibility
- inclusion
- ethics
- privacy
- career planning
- evidence
- self-advocacy
- professional presentation
- transition planning

Do not create Healthcare-specific competency authority for these merely because Healthcare examples are used.

## 8. Existing UCR Lesson Sources

High-value source lessons include:

- `ucr-03-reliability-attendance-punctuality.json`
- `ucr-04-professional-conduct-responsibility.json`
- `ucr-07-professional-appearance-presentation-context.json`
- `ucr-08-accountability-ownership-follow-through.json`
- `ucr-09-boundaries-confidentiality-digital-conduct.json`
- `ucr-11-communication-at-work.json`
- `ucr-12-listening-clarifying-confirming.json`
- `ucr-13-verbal-written-digital-communication.json`
- `ucr-14-difficult-conversations-conflict.json`
- `ucr-15-communication-across-teams-roles-cultures.json`
- `ucr-16-working-as-part-of-a-team.json`
- `ucr-17-roles-responsibilities-shared-goals.json`
- `ucr-18-coordination-handoffs-dependencies.json`
- `ucr-19-team-conflict-trust-accountability.json`
- `ucr-20-high-performing-teams-individual-contribution.json`
- `ucr-21-safety-everyones-responsibility.json`
- `ucr-22-recognizing-hazards-changing-conditions.json`
- `ucr-23-scope-authorization-knowing-when-to-stop.json`
- `ucr-24-reporting-hazards-near-misses-incidents.json`
- `ucr-25-building-strong-safety-culture.json`
- `ucr-26-define-problem-before-solving.json`
- `ucr-27-facts-assumptions-missing-information.json`
- `ucr-28-generate-options-compare-tradeoffs.json`
- `ucr-29-make-communicate-verify-decision.json`
- `ucr-30-learn-from-results-improve-process.json`
- `ucr-36-digital-tools-systems-workplace-responsibility.json`
- `ucr-37-using-ai-assistants-responsibly.json`
- `ucr-38-verify-before-you-trust-ai-output.json`
- `ucr-39-privacy-security-data-boundaries.json`
- `ucr-40-human-judgment-ownership-responsible-ai-decisions.json`
- `ucr-41-accessibility-inclusion-workplace-barriers.json`
- `ucr-42-accessible-communication-digital-content.json`
- `ucr-43-preferences-assistive-tools-inclusive-work-practices.json`
- `ucr-44-accommodations-privacy-appropriate-support.json`
- `ucr-45-self-advocacy-allyship-inclusive-workplaces.json`
- `ucr-46-ethics-integrity-professional-judgment.json`
- `ucr-47-rights-respect-fair-treatment-work.json`
- `ucr-48-confidentiality-privacy-ownership.json`
- `ucr-49-speaking-up-concerns-misconduct-conflicts.json`
- `ucr-50-accountability-honest-reporting-ethical-decisions.json`
- `ucr-51-career-exploration-interests-strengths-work-environments.json`
- `ucr-52-reading-career-paths-job-requirements.json`
- `ucr-53-employer-expectations-preparation-vs-qualification.json`
- `ucr-54-training-credentials-work-based-learning-routes.json`
- `ucr-55-build-career-plan-next-step.json`
- `ucr-56-building-a-truthful-resume.json`
- `ucr-57-turning-experience-into-strong-evidence.json`
- `ucr-58-preparing-for-interviews.json`
- `ucr-59-presenting-yourself-work-story.json`
- `ucr-60-interview-practice-follow-up-professional-presence.json`
- `ucr-61-from-activity-to-evidence.json`
- `ucr-62-what-makes-evidence-strong.json`
- `ucr-63-review-verification-competency-decisions.json`
- `ucr-64-building-a-truthful-portfolio.json`
- `ucr-65-presenting-skills-without-overclaiming.json`
- `ucr-71-from-career-goal-to-transition-plan.json`
- `ucr-72-mapping-requirements-gaps-next-steps.json`
- `ucr-73-timeline-deadlines-support-network.json`
- `ucr-74-applications-follow-up-backup-plans.json`
- `ucr-75-your-90-day-transition-action-plan.json`

## 9. Lesson Reuse Decision Summary

The approved planning target is:

- REUSE: 8 lessons
- CONTEXTUALIZE: 34 lessons
- EXTEND: 14 lessons
- MISSING: 4 lessons

Total:

60 lessons

This ratio must be preserved unless implementation discovery provides evidence for a change.

## 10. Genuinely Missing Healthcare Lessons

The lesson reuse review identified four strongest missing source objectives:

1. Healthcare Workforce Ecosystem
2. Healthcare Settings and Environments
3. Common Healthcare Workplace Hazards
4. Digital Systems in Healthcare

These are the strongest candidates for genuinely new Healthcare source lessons.

They are not automatically approved merely because they are classified MISSING.

Their implementation must still preserve canonical authority boundaries.

## 11. New Lesson Rule

A new Healthcare lesson may be created only when:

- its objective is not functionally equivalent to an existing UCR lesson
- contextualization is insufficient
- extension is insufficient
- the lesson does not create duplicate competency authority
- the lesson does not imply regulated training authority
- the lesson fits the approved 12-unit / 60-lesson structure

## 12. Source File Location

The implementation phase must first determine the canonical source location for Healthcare lessons.

The preferred pattern should follow existing curriculum source conventions.

Do not invent a second curriculum storage system.

A likely source location may follow the existing pattern under:

`src/content/lessons/`

The exact Healthcare directory name must be deterministic and consistent with current curriculum-import conventions.

No files should be created outside canonical curriculum source patterns merely for convenience.

## 13. Source Naming

Healthcare lesson filenames should use:

- deterministic identifiers
- stable lesson ordering
- lowercase naming
- existing repository conventions
- no credential implication
- no unsupported regulated-program claim

Filename and lesson IDs must not use fabricated external credential identifiers.

## 14. Source Schema

New or composed lesson source must follow the existing supported lesson schema.

Implementation must not create a Healthcare-only schema unless canonical curriculum architecture is proven insufficient.

If the existing schema cannot express a required Healthcare feature:

- document the exact limitation
- identify canonical owner
- propose extension
- stop for integration review

Do not build local substitutes.

## 15. Import Authority

Healthcare must use the canonical curriculum importer path.

Relevant implementation services include existing curriculum-catalog source adapter / import services.

The implementation phase must locate and use the same governed import architecture already proven for UCR.

Do not create a Healthcare-specific importer.

## 16. Import Preview

Before execute/import:

- source must parse
- source must validate
- preview must succeed
- preview must not write unintended catalog records
- stable keys must be deterministic
- lesson ordering must be deterministic
- duplicate detection must behave canonically

Preview is required before execute.

## 17. Draft-State Rule

Initial Healthcare imports must remain governed draft content.

No initial Pass 2 implementation may automatically publish Healthcare to production.

The implementation must preserve the current curriculum release/publishing authority.

## 18. Duplicate Import Rule

Repeated import of the same source must not silently create duplicate curriculum structures.

Implementation acceptance must verify canonical duplicate-handling behavior.

Healthcare must not add a local deduplication system if the existing importer already owns this behavior.

## 19. Lesson Composition Strategy

For REUSE lessons:

- use existing UCR capability directly where technically supported

For CONTEXTUALIZE lessons:

- preserve the UCR learner objective
- add Healthcare-specific scenarios or examples
- do not create new competency authority

For EXTEND lessons:

- preserve reusable UCR content
- add only the missing Healthcare-specific instructional component

For MISSING lessons:

- author genuinely new Healthcare source content
- keep regulated boundaries explicit

## 20. No Copy-Paste Curriculum Duplication

Implementation should avoid creating a Healthcare clone of UCR.

A copied lesson with changed nouns is not a new curriculum objective.

If the primary capability is already taught by UCR, the Healthcare implementation should prefer composition or contextualization.

## 21. Healthcare-Specific Content Scope

Healthcare-specific additions may include:

- healthcare workplace structure
- healthcare settings
- clinical versus nonclinical role awareness
- care-team coordination context
- healthcare handoffs
- healthcare safety culture
- scope and supervision awareness
- healthcare workplace hazard awareness
- dignity and person-centered context
- privacy/confidentiality context
- healthcare accessibility context
- digital healthcare system awareness
- Healthcare Career context
- regulated pathway transition awareness

## 22. Clinical Boundary

Healthcare lesson content may teach:

- awareness
- communication
- professionalism
- teamwork
- scope recognition
- escalation
- hazard recognition
- privacy
- accessibility
- ethics
- evidence
- career planning

It must not teach learners as qualified to:

- diagnose
- prescribe
- administer medication
- draw blood
- perform phlebotomy
- perform nursing procedures
- provide unsupervised patient care
- conduct clinical assessments
- handle regulated specimens
- operate clinical equipment independently
- perform emergency medical procedures

## 23. Regulated Pathway References

Healthcare source curriculum may reference pathways such as:

- STNA / nurse aide
- LPN
- RN
- patient care technician
- phlebotomy
- EMT
- paramedic
- respiratory therapy
- radiology
- sterile processing
- pharmacy support
- medical assistant
- health IT
- billing and coding
- administration

Such references must remain pathway education unless external regulated authority is separately established.

## 24. Career Authority

Career facts must use canonical Career authority.

Healthcare source content must not hard-code unsupported claims about:

- wages
- employer demand
- job growth
- credential eligibility
- license requirements
- placement rates
- guaranteed employment

If current external facts are required, they must enter through an approved and maintainable source process.

## 25. Commercial Registry Boundary

Commercial Healthcare candidate records may be used for reference during discovery.

They must not become curriculum authority.

Commercial product registry records do not establish:

- curriculum authority
- clinical authority
- credential authority
- licensure authority
- regulated-program approval

## 26. Fixture Boundary

Fixture or mock records referencing:

- CNA
- STNA
- phlebotomy
- Healthcare Workforce

must not be treated as proof of governed training authority.

Fixtures may assist discovery only.

## 27. Prepare / Prove Authority

Healthcare must reuse:

`apps/shs-api/src/domain/prepare-prove/`

as the canonical competency / evidence / review architecture.

No separate Healthcare proof service is permitted.

No Healthcare evidence table is permitted.

No Healthcare competency registry is permitted.

## 28. Competency Discovery Before Proof Implementation

Before implementing any Healthcare proof activity:

- inspect current competency definitions
- inspect existing proof configurations
- inspect UCR proof configurations
- inspect functionally equivalent safety / communication / evidence competencies
- identify reusable slugs only when verified from source

Do not fabricate competency IDs.

## 29. Proof Candidate Set

Exactly three primary proof candidates are planned:

1. Healthcare Handoff Exercise
2. Healthcare Safety / Scope Decision Scenario
3. Healthcare Evidence & Career Self-Advocacy Presentation

No additional primary proof activity should be added without review.

## 30. Healthcare Handoff Proof

Implementation must first determine whether existing communication / handoff competency authority is sufficient.

Preferred outcome:

reuse or contextualize existing competency/proof authority.

Only if existing proof configuration is materially insufficient may an extension be proposed.

The proof must remain workplace communication readiness.

It must not represent nursing or clinical handoff qualification.

## 31. Safety / Scope Proof

Implementation must first determine whether existing safety, scope, decision, and escalation competency authority is sufficient.

Preferred outcome:

reuse or contextualize canonical safety / scope capability.

The scenario must remain synthetic and readiness-level.

It must not evaluate regulated clinical performance.

## 32. Evidence / Career Self-Advocacy Proof

This is the strongest direct UCR reuse candidate.

Implementation should first attempt to reuse the existing UCR evidence / self-advocacy competency and proof path.

Healthcare should primarily supply:

- Healthcare artifacts
- regulated-boundary prompts
- pathway transition context

Do not create a Healthcare-specific self-advocacy competency if UCR is functionally equivalent.

## 33. Evidence Chain

Implementation must preserve:

Activity Result
→ Evidence
→ Authorized Review
→ Competency Decision

No code path may skip directly from:

- lesson completion
- quiz
- simulation
- Arcade result
- Metaverse result
- AI result

to verified competency.

## 34. Evidence Candidate Rule

The following may create evidence candidates:

- written exercises
- scenario responses
- presentations
- reflections
- portfolio artifacts
- simulation output
- Arcade results
- Metaverse activities

Evidence candidate status must not be mislabeled as verified.

## 35. Reviewer Authority

Reviewer authorization must use the existing canonical permission model.

Implementation must not create reviewer authority based solely on:

- being a healthcare professional
- being an instructor
- being an employer
- being a mentor
- being an AI agent
- being a peer

unless the canonical system explicitly authorizes that role.

## 36. External Subject-Matter Review

Healthcare-specific content should later receive appropriate subject-matter review.

Potential reviewers may include:

- experienced healthcare workers
- nurses
- clinical educators
- workforce partners
- regulated-training partners
- accessibility specialists

Such review validates content.

It does not create evidence-verification authority automatically.

## 37. Completion Authority

Healthcare must use canonical Completion Policy.

No Healthcare completion service is permitted.

No local completion calculation is permitted.

No source lesson may claim that completion itself establishes:

- competency
- certification
- licensure
- clinical qualification
- employer qualification

## 38. Completion Requirement Types

Any later Healthcare completion configuration must use supported canonical requirement types.

Do not invent Healthcare-specific requirement types unless canonical completion architecture is proven insufficient.

## 39. Arcade Boundary

Healthcare Learning Arcade content may be used for practice.

Arcade must remain optional unless canonical Completion Policy explicitly requires a governed activity.

Arcade results must not automatically become verified competency.

## 40. Metaverse Boundary

The Metaverse Hospital may support:

- orientation
- role exploration
- communication scenarios
- handoff scenarios
- safety awareness
- accessibility analysis

Metaverse results are evidence candidates only unless canonical policy explicitly governs a later projection.

The Metaverse must not become a second evidence authority.

## 41. AI Boundary

AI may assist with:

- explanations
- scenario variation
- practice
- feedback drafts
- accessibility support
- reflection prompts

AI must not independently:

- verify competency
- issue credentials
- determine clinical readiness
- grant licensure
- determine employment eligibility
- replace authorized review

## 42. Accessibility Authority

Healthcare source and experience implementation must use canonical accessibility / accommodation systems.

No Healthcare-specific accessibility authority is permitted.

## 43. Accessibility Requirements

Every implemented Healthcare lesson must support appropriate:

- semantic structure
- keyboard access
- screen-reader compatibility
- captions / transcripts
- reduced motion
- non-color-only meaning
- readable typography
- accessible tables
- accessible scenarios
- plain-language support
- accommodation compatibility

## 44. Accessible Proof Requirements

Formal proof activities must support equivalent evidence modes where canonical policy permits.

The evaluation target must remain the underlying capability rather than presentation modality.

Accessibility must not reduce the substantive proof standard.

## 45. Assignment Authority

Healthcare must use canonical assignment authority.

Future tests must confirm:

- correct learner
- correct organization
- correct tenant
- correct course
- correct release
- correct proof activity
- correct evidence lineage

No local assignment model is permitted.

## 46. Assignment Immutability

Implementation must preserve existing assignment-binding rules.

Healthcare code must not allow reassignment or cross-organization evidence contamination through client-controlled identifiers.

## 47. Organization / Tenant Isolation

Healthcare must preserve canonical organization and tenant isolation.

No Healthcare feature may bypass tenant-scoped authority.

Cross-tenant lesson, evidence, assignment, or review access must fail.

## 48. Portfolio Authority

Healthcare may feed eligible evidence into canonical Portfolio authority where supported.

Healthcare must not create a second portfolio store.

If current Portfolio intake does not support a desired evidence type:

- document the gap
- identify Portfolio as owner
- propose integration extension
- do not create a local substitute

## 49. Credential Authority

Healthcare readiness must not issue regulated Healthcare credentials unless canonical credential policy and external authority explicitly support them.

Course completion certificates, where later permitted, must not be described as:

- STNA certification
- CNA certification
- nursing licensure
- phlebotomy certification
- EMT certification
- clinical qualification

## 50. Reporting Authority

Healthcare reporting must use canonical Reporting / Truth architecture.

No Healthcare-specific truth store is permitted.

Reports must distinguish:

- participation
- completion
- evidence
- reviewed evidence
- competency decision
- credential
- external qualification

## 51. No Readiness Score

Healthcare must not introduce a Student Career Readiness Score or clinical readiness score.

Progress may be represented through canonical facts and governed outcomes.

No unsupported composite readiness score may become institutional truth.

## 52. Source Curriculum Construction Sequence

After this work order is approved, implementation should proceed in this order:

Phase A — Verify source directory / schema

Phase B — Map reusable UCR content

Phase C — Implement composition / contextualization model

Phase D — Author only proven missing Healthcare content

Phase E — Validate source files

Phase F — Preview import

Phase G — Inspect resulting draft structure

Phase H — Audit Prepare / Prove equivalence

Phase I — Implement approved proof bindings only

Phase J — Build draft learner experience

Phase K — Run governed acceptance

Phase L — Closeout

## 53. Allowed Initial File Classes

Initial implementation may modify or add only files required for:

- Healthcare source curriculum
- Healthcare source composition metadata
- supported curriculum importer configuration if needed
- narrowly scoped tests
- Healthcare draft-experience configuration if later approved

Shared canonical services should remain unchanged unless a proven deficiency requires integration review.

## 54. Prohibited Initial Changes

Do not modify or add:

- database migrations
- new evidence tables
- new competency registries
- new completion engines
- new credential authority
- new Career authority
- new Portfolio authority
- new accessibility authority
- new tenant authority
- new entitlement authority
- new Truth store
- new Healthcare-specific publishing service

without a separate reviewed integration decision.

## 55. Shared-Service Change Gate

If Healthcare appears to require a shared canonical system change, document:

- exact limitation
- exact affected source path
- why local composition cannot solve it
- canonical owner
- proposed extension
- migration impact if any
- test impact
- other courses affected

Then stop implementation pending integration review.

## 56. No Migration Default

The current Pass 2 planning package does not justify a database migration.

Therefore initial Healthcare implementation must assume:

NO DATABASE MIGRATIONS

A migration may be proposed only after evidence proves canonical persistence is insufficient.

## 57. Import Validation Tests

Healthcare implementation must test:

- source parse
- schema validity
- stable key
- unit ordering
- lesson ordering
- lesson identifiers
- preview behavior
- no unintended writes during preview
- draft-state import
- duplicate handling
- deterministic re-import behavior

## 58. UCR Reuse Tests

Tests or review checks should confirm:

- UCR source remains canonical
- Healthcare does not create duplicate copies unnecessarily
- contextualized content preserves original capability intent
- Healthcare-specific additions remain bounded
- reusable UCR content is referenced consistently

## 59. Lesson Count Test

Acceptance must verify:

- 12 units
- 60 lessons

Any deviation requires an explicit planning update.

## 60. Missing-Lesson Test

Review must verify that new source content is limited to justified missing objectives.

At minimum, each newly created Healthcare lesson must document its reuse decision.

## 61. Proof Configuration Audit

Before adding any Healthcare proof config, produce a documented comparison of:

- candidate Healthcare capability
- existing competency/proof configuration
- functional overlap
- missing criteria
- evidence shape
- reviewer role
- decision

Possible decisions:

- REUSE
- CONTEXTUALIZE
- EXTEND
- NEW CANDIDATE

## 62. Proof ID Rule

Proof IDs may only be selected from:

- verified existing proof configuration IDs
- new IDs approved after canonical review

Do not invent IDs in planning documents and then treat them as implemented authority.

## 63. Evidence-Lineage Test

Acceptance must prove that any implemented formal proof preserves:

learner
→ assignment
→ curriculum release
→ activity result
→ evidence
→ reviewer
→ competency decision

No broken or ambiguous lineage is acceptable.

## 64. False-Verification Test

Acceptance must demonstrate that:

- completing a lesson does not create competency
- submitting proof does not create competency
- evidence creation does not create competency
- simulation success does not create competency
- AI output does not create competency
- Arcade success does not create competency
- Metaverse success does not create competency

without the canonical authorized review path.

## 65. Cross-Tenant Test

Where proof/evidence implementation exists, tests must verify that another organization or tenant cannot:

- view the learner's evidence
- review the learner's evidence
- mutate the learner's evidence
- bind the evidence to another assignment

## 66. Reviewer-Permission Test

Tests must verify that unauthorized users cannot make canonical competency decisions.

Healthcare must reuse existing review permission controls.

## 67. Reassessment Test

If formal Healthcare proofs are implemented, tests must verify existing reassessment behavior rather than creating a Healthcare-only retry model.

## 68. Completion Separation Test

Acceptance must verify:

course completion
≠ competency decision

and:

competency decision
≠ credential

and:

credential
≠ external licensure or employer authorization

## 69. Career Boundary Test

Healthcare Career presentation must not state unsupported:

- wages
- credential status
- licensure eligibility
- guaranteed employment
- employer approval

Static fixture data must not be presented as authoritative current Career truth.

## 70. Accessibility Acceptance

Healthcare draft experience must be reviewed for:

- keyboard operation
- semantic structure
- screen-reader compatibility
- caption/transcript support where applicable
- reduced-motion behavior
- color-independent meaning
- accessible scenarios
- accommodation compatibility

## 71. Safety Acceptance

Healthcare content review must confirm:

- no procedural clinical instruction presented as qualification
- no dangerous hands-on procedure requirement
- no real patient information
- no unsupervised clinical simulation represented as authorization
- no misleading credential claims

## 72. Regulated-Claim Search

Before closeout, repository diff must be reviewed for problematic claims including:

- certified
- licensed
- qualified
- credentialed
- state approved
- clinical ready
- job ready
- employer approved
- guaranteed employment

Such terms are not universally prohibited, but every occurrence must be supported and scoped accurately.

## 73. Healthcare Pathway Validation

Before production Career/pathway claims are approved, later review must verify:

- role naming
- training requirement source
- credential requirement source
- state-specific requirements where applicable
- employer-specific variation
- regulatory authority

This is outside initial source-construction authorization.

## 74. Draft Learner Experience

When draft experience construction is later authorized, use the canonical lesson experience:

Orient
→ Check-In
→ Learn
→ Vocabulary-in-Context
→ Check Understanding
→ Practice
→ Learning Arcade
→ Apply
→ Assess
→ Reflect
→ Evidence
→ Career Connection
→ Completion Check
→ Next

Not every optional element must appear in every Healthcare lesson.

## 75. Healthcare Context Rules

Contextualization should use synthetic and safe examples.

Do not use:

- real patient records
- real medical advice
- real diagnoses
- real medication decisions
- personally identifiable clinical data
- unsafe procedural instructions

## 76. Vocabulary Strategy

Healthcare vocabulary may include workforce and environment terminology necessary for readiness.

Vocabulary must not imply that recognition of terminology establishes regulated competence.

## 77. Assessment Strategy

Healthcare assessments may evaluate:

- understanding
- classification
- scenario reasoning
- communication
- scope awareness
- ethical judgment
- accessibility reasoning
- career planning
- evidence literacy

Assessments must not claim to test regulated clinical competence.

## 78. Reflection Strategy

Reflection may support learning and evidence creation.

Reflection alone must not become verified competency.

## 79. Work-Based Learning Boundary

Future work-based-learning connections must use canonical opportunity / assignment / evidence authorities.

Healthcare source curriculum must not invent placement authority.

## 80. Employer Validation

Employer review may later validate:

- relevance
- workplace realism
- communication expectations
- safety expectations
- hiring-readiness signals

Employer validation does not replace regulated training authority.

## 81. Clinical Educator Validation

Clinical or regulated-program educators may validate:

- scope boundaries
- terminology
- pathway distinctions
- scenario realism
- unsafe implication risks

Their validation should be recorded as content review, not automatically as learner evidence authority.

## 82. Data Privacy

No Healthcare source implementation should require collection of real health information from learners or patients.

Synthetic scenarios should be the default.

## 83. Security

Healthcare implementation must reuse existing authentication, authorization, organization, tenant, and evidence-permission boundaries.

No healthcare-specific security bypass is permitted.

## 84. Feature Flags

If Healthcare draft experience requires a feature flag, use existing feature/configuration patterns.

Do not introduce a new governance authority merely to hide unfinished Healthcare work.

## 85. Release Boundary

Initial Healthcare implementation should remain:

DRAFT

No production release should occur during the first construction pass.

Publication requires later acceptance and canonical release authority.

## 86. Disposable Acceptance Environment

Acceptance should use disposable or isolated test data where possible.

Testing must not pollute institutional production truth.

Any temporary test assignments, evidence, or decisions must be clearly scoped and removable.

## 87. Acceptance Dataset

Acceptance scenarios should include at least:

- one Healthcare learner
- one valid assignment
- one valid organization/tenant
- one reusable lesson path
- one contextualized lesson path
- one extended lesson path
- one new Healthcare lesson path
- one proof candidate path if proof implementation is approved
- one unauthorized reviewer attempt
- one cross-tenant denial case

## 88. Acceptance Outcomes

Healthcare acceptance should demonstrate:

- correct course identity
- correct 12-unit structure
- correct 60-lesson structure
- correct reuse behavior
- correct draft import
- correct assignment isolation
- correct evidence lineage
- correct reviewer authorization
- no false verified state
- correct completion separation
- accessible learner experience
- correct regulated-boundary language

## 89. Clean Diff Requirement

Before commit:

- only intended Healthcare implementation files may be changed
- no unrelated canonical files
- no generated artifacts unless required
- no local environment files
- no secrets
- no accidental lockfile churn
- no temporary debug files

## 90. Whitespace Requirement

Before commit:

- run `git diff --check`
- inspect new/untracked files for trailing whitespace
- confirm deterministic formatting

## 91. Test Requirement

Run all targeted Healthcare tests plus any shared tests impacted by touched canonical systems.

If a shared canonical service changes, its existing test suite must also pass.

## 92. Regression Requirement

Healthcare implementation must not break:

- UCR
- Prepare / Prove
- Completion Policy
- Portfolio
- Career
- accessibility
- assignment isolation
- reporting
- tenant boundaries

## 93. Implementation Commit Strategy

Prefer small coherent commits separated by purpose where useful.

Do not mix:

- curriculum source
- importer changes
- proof architecture
- unrelated UI
- unrelated backend changes

in one uncontrolled commit.

## 94. Stop Conditions

Stop implementation immediately if:

- a new authority appears necessary
- a migration appears necessary
- regulated training authority is unclear
- an existing UCR capability would be duplicated
- proof functional equivalence is unresolved
- evidence lineage cannot be preserved
- completion would be locally reimplemented
- cross-tenant isolation is uncertain
- source schema cannot express the design safely

## 95. Integration Review Triggers

Integration review is required if Healthcare needs changes to:

- canonical curriculum schema
- importer
- Prepare / Prove shared configuration model
- competency registry behavior
- Completion Policy
- Portfolio intake
- Career authority
- accessibility infrastructure
- organization/tenant authority
- evidence/Truth projection
- credential authority

## 96. No Local Substitute Rule

If a canonical authority is insufficient:

do not build a Healthcare-local substitute.

Instead:

- document the deficiency
- identify canonical owner
- propose bounded extension
- request integration review

## 97. Expected Initial Implementation Shape

The preferred Healthcare implementation should primarily consist of:

- composition of existing UCR capability
- Healthcare context metadata / source content
- a small set of genuinely new Healthcare lessons
- limited Healthcare-specific activities
- reuse of canonical import
- reuse of canonical evidence
- reuse of canonical completion
- reuse of canonical Career
- reuse of canonical accessibility

This should be substantially smaller than writing 60 independent lessons from scratch.

## 98. Implementation Success Definition

Healthcare Pass 2 implementation is successful when the course exists as a governed draft composition that:

- preserves canonical authority
- reuses UCR aggressively
- adds Healthcare-specific learning only where necessary
- maintains clinical / regulated boundaries
- produces no false verified states
- can be assigned and tested safely
- can later proceed to governed review and publication

## 99. Planning Package Completion

The Healthcare Pass 2 planning package consists of:

1. `HEALTHCARE_WORKFORCE_READINESS_SOURCE_CURRICULUM_PLAN.md`
2. `HEALTHCARE_WORKFORCE_READINESS_LESSON_REUSE_MAP.md`
3. `HEALTHCARE_WORKFORCE_READINESS_PROOF_ACTIVITY_PLAN.md`
4. `HEALTHCARE_WORKFORCE_READINESS_PASS_2_IMPLEMENTATION_WORK_ORDER.md`

After this document is mechanically and substantively reviewed, the four documents may be committed together as the Healthcare Pass 2 planning package.

Implementation should not begin before that review.

## 100. Current Decision

HEALTHCARE PASS 2 IMPLEMENTATION WORK ORDER — DRAFT FOR REVIEW

PLANNING PACKAGE COMPLETE IN DRAFT FORM

IMPLEMENTATION REMAINS BLOCKED PENDING REVIEW AND COMMIT

The intended future implementation model is:

REUSE UCR
→ COMPOSE HEALTHCARE CONTEXT
→ EXTEND ONLY WHERE NECESSARY
→ BUILD ONLY PROVEN MISSING CONTENT
→ REUSE CANONICAL PREPARE / PROVE
→ REUSE CANONICAL COMPLETION
→ REUSE CANONICAL CAREER
→ PRESERVE CLINICAL / REGULATED BOUNDARIES
→ TEST IN DRAFT
→ GOVERNED ACCEPTANCE
→ CLOSEOUT
