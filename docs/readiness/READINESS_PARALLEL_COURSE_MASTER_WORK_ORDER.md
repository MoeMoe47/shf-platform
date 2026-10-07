# SHU Parallel Readiness Course Master Work Order

Status: CANONICAL
Applies to: All SHU industry readiness course branches
Baseline: Universal Career Readiness production slice

## 1. Purpose

Build industry-specific readiness courses by composing and extending the existing SHU curriculum architecture.

These courses are not independent applications and must not create competing platform authorities.

The Universal Career Readiness implementation is the reference production pattern.

## 2. Governing Development Rule

Every course must follow:

Audit → Identify Canonical Authority → Reuse → Extend → Consolidate Where Necessary → Build New Only When Proven Missing

Required hierarchy:

1. Reference
2. Configure
3. Compose
4. Extend
5. Build New Only When Proven Missing

Functional equivalence matters more than naming.

## 3. Prohibited Duplicate Authorities

A course must not create a new authority for:

- competency
- evidence
- verification
- completion
- learner progress
- assignment
- curriculum release
- organization or tenant
- entitlement
- career
- portfolio
- credential
- reporting
- accessibility/accommodation
- Metaverse mission results
- Arcade mastery
- Truth / verified reporting

Existing canonical SHU authorities must be reused.

## 4. Universal Career Readiness Reference Pattern

Reference implementation:

`src/content/lessons/shu-universal-career-readiness-student/`

Reference architecture includes:

- static JSON curriculum source
- canonical curriculum importer
- DRAFT preview
- course/unit/lesson position metadata
- assignment-scoped learner access
- Prepare/Prove proof activity
- activity result
- evidence candidate
- evidence creation
- authorized review boundary
- competency decision boundary
- immutable curriculum release
- canonical assignment binding
- learner course visibility
- portfolio/reporting compatibility

Do not fork these systems into course-specific implementations.

## 5. Required Course Build Sequence

Every course must complete the following sequence.

### Phase A — Course Audit

Identify:

- existing curriculum content
- existing industry courses
- existing competency definitions
- existing career pathways
- existing evidence/proof activities
- existing Arcade activities
- existing Metaverse experiences
- existing employer/workforce relationships
- existing credentials
- existing completion policies
- existing program composition

Classify findings as:

- KEEP — CANONICAL
- REUSE
- EXTEND
- CONSOLIDATE
- REFACTOR
- REPLACE
- LEGACY / REFERENCE ONLY
- MISSING

No implementation begins before this audit.

### Phase B — Course Blueprint

Define:

- course title
- stable key
- audience
- purpose
- unit structure
- lesson structure
- transferable readiness concepts
- industry-contextualized concepts
- truly industry-specific concepts
- evidence opportunities
- proof activities
- career connections
- accessibility requirements
- safety boundaries

Do not invent competency IDs.

### Phase C — Source Curriculum

Create source lessons using the established student JSON pattern.

Each lesson must include appropriate:

- id
- slug
- curriculum/unit key
- coursePosition metadata
- title
- summary
- objectives
- vocabulary
- lesson sections
- practice
- assessment/quiz
- reflection
- evidenceCandidate when justified
- proofActivity only when justified

Evidence candidates are descriptive and unverified.

### Phase D — Import Validation

Validate:

- exact course stable key
- unit count
- lesson count
- deterministic unit order
- no duplicate stable keys
- no invalid candidates
- importer preview does not publish
- importer execution creates DRAFT only

### Phase E — Draft Experience

Verify:

- source preview renders
- lesson hierarchy renders correctly
- preview has no assignment authority
- preview cannot submit proof
- preview cannot create verified evidence
- preview cannot create completion
- preview cannot create competency decisions

### Phase F — Governed Production Path

Where a proof activity is justified:

Assignment
→ Learner Access
→ Activity Result
→ Evidence
→ Authorized Review
→ Competency Decision

The course must preserve this ordering.

Proof submission alone does not establish:

- competency mastery
- lesson completion
- course completion
- credential eligibility
- employment readiness

### Phase G — Disposable Acceptance

Before persistent publication, prove in a disposable environment:

1. migrations clean
2. import preview succeeds
3. DRAFT execution succeeds
4. review lifecycle succeeds
5. publish creates immutable release
6. canonical assignment binds release
7. intended learner receives access
8. unintended learner does not receive access
9. proof activity preserves assignment lineage
10. evidence preserves institutional lineage
11. evidence remains unverified until authorized review
12. no false competency decision occurs
13. no false lesson completion occurs
14. no automatic completion policy is invented
15. existing regression suites remain green

Disposable publication does not authorize persistent publication.

### Phase H — Closeout

Before commit:

- API typecheck passes
- frontend build passes
- course-specific API tests pass
- frontend contract tests pass
- existing Prepare/Prove regression passes
- `git diff --check` passes
- generated/test artifacts are removed
- staged files contain only intended work

Then create one coherent course closeout commit.

## 6. Evidence Doctrine

Canonical evidence chain:

Activity Result
→ Evidence
→ Authorized Review
→ Competency Decision

Never collapse these stages.

Evidence candidates are not verified evidence.

AI agents, Arcade activities, and Metaverse simulations may generate evidence candidates but cannot declare verified mastery.

## 7. Completion Doctrine

Use the canonical Completion Policy authority.

Do not create course-local completion logic.

Course completion and competency verification are separate concepts.

Do not automatically require Arcade or Metaverse participation unless explicitly justified by an approved completion policy.

## 8. Career Doctrine

Use canonical Career authority and curriculum-career mappings.

A readiness course may prepare learners for careers.

It must not claim that completion automatically establishes:

- employment eligibility
- occupational licensure
- certification
- job placement
- employer acceptance

unless another canonical authority explicitly establishes that fact.

## 9. Accessibility Doctrine

Accessibility is part of the course architecture, not an optional enhancement.

Reuse canonical:

- accessibility profiles
- authorized accommodations
- accessible lesson experience
- reduced-motion behavior
- assistive support boundaries

Do not create course-specific accommodation authority.

## 10. Arcade and Metaverse Doctrine

Arcade and Metaverse integrations are optional composition layers.

They may:

- provide practice
- provide simulation
- generate evidence candidates
- contextualize careers

They may not independently establish:

- verified competency
- completion
- credentials
- employment readiness

## 11. Reporting Doctrine

Use canonical reporting and Truth Spine authorities.

Do not create a Student Career Readiness Score.

Do not infer readiness from unverified activity.

Reports must distinguish:

- participation
- completion
- evidence
- verified competency
- credential
- employment outcome

## 12. Parallel Development Boundary

Each readiness worktree owns only its course-specific additions and the minimum shared extensions required by that course.

If a course discovers that a shared platform change is necessary:

1. document why the existing authority is insufficient
2. identify the canonical owner
3. classify the change as EXTEND or MISSING
4. avoid implementing a course-local substitute
5. isolate the shared change clearly for integration review

## 13. Required Course Stable Keys

Healthcare Workforce:
`shu-healthcare-workforce-readiness`

Advanced Manufacturing & Semiconductor:
`shu-advanced-manufacturing-semiconductor-readiness`

Construction & Skilled Trades:
`shu-construction-skilled-trades-readiness`

Logistics & Supply Chain:
`shu-logistics-supply-chain-readiness`

IT & Cybersecurity:
`shu-it-cybersecurity-readiness`

Biotechnology & Pharmaceutical Manufacturing:
`shu-biotech-pharma-manufacturing-readiness`

Electrical, Energy & Utility Infrastructure:
`shu-energy-utility-infrastructure-readiness`

Transportation & Commercial Mobility:
`shu-transportation-commercial-mobility-readiness`

Data Center & Critical Facilities:
`shu-data-center-critical-facilities-readiness`

Business, Financial Services & Professional Operations:
`shu-business-financial-operations-readiness`

## 14. Required First Deliverable From Every Course

Before writing curriculum content, each course must produce:

`docs/readiness/<COURSE>_REUSE_AUDIT.md`

and

`docs/readiness/<COURSE>_BLUEPRINT.md`

No lesson generation begins until both documents establish what will be reused versus extended.

## 15. Integration Gate

A course is not ready to merge merely because its UI works.

Merge readiness requires:

- architecture compliance
- no duplicate authority
- clean migrations
- passing tests
- proven assignment isolation
- proven evidence lineage
- no false verified state
- clean diff
- coherent closeout commit

Final integration review happens against the readiness baseline branch.
