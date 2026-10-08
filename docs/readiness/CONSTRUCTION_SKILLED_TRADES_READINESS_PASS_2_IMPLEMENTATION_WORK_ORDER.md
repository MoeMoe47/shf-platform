# Construction & Skilled Trades Readiness — Pass 2 Implementation Work Order

Status: DRAFT — PARALLEL PASS 2
Branch: `agent/pass2-readiness-construction`
Baseline: `af2faa2`
Stable key: `shu-construction-skilled-trades-readiness`

## 1. Purpose

Define the controlled implementation boundary for Construction & Skilled Trades Readiness after completion of the Pass 2 planning artifacts.

This document is Artifact 4 of 4 for Construction Pass 2.

It governs future implementation only after review approval.

It does not itself authorize production publication.

It does not create:

- source lessons
- competency definitions
- competency IDs
- proof configurations
- evidence records
- database migrations
- electrical authorization
- HVAC qualification
- plumbing qualification
- equipment qualification
- trade licensure
- apprenticeship credit
- certification
- employer authorization

## 2. Governing Documents

Implementation must conform to:

- `docs/readiness/READINESS_PARALLEL_PASS_2_MASTER_WORK_ORDER.md`
- `docs/readiness/CONSTRUCTION_SKILLED_TRADES_READINESS_REUSE_AUDIT.md`
- `docs/readiness/CONSTRUCTION_SKILLED_TRADES_READINESS_BLUEPRINT.md`
- `docs/readiness/CONSTRUCTION_SKILLED_TRADES_READINESS_SOURCE_CURRICULUM_PLAN.md`
- `docs/readiness/CONSTRUCTION_SKILLED_TRADES_READINESS_LESSON_REUSE_MAP.md`
- `docs/readiness/CONSTRUCTION_SKILLED_TRADES_READINESS_PROOF_ACTIVITY_PLAN.md`

If implementation conflicts with a canonical authority, work must stop for integration review.

## 3. Implementation Objective

Build Construction & Skilled Trades Readiness as a governed composition over existing SHU systems.

Implementation priority:

REUSE
→ CONTEXTUALIZE
→ EXTEND
→ BUILD NEW ONLY WHEN PROVEN MISSING

The implementation must not recreate transferable UCR capability or functionally equivalent electrical / HVAC authority.

## 4. Course Identity

Canonical stable key:

`shu-construction-skilled-trades-readiness`

Approved proposed structure:

- 15 units
- 75 lessons

The 75-lesson structure must remain stable unless later reviewed.

## 5. Course Boundary

Construction & Skilled Trades Readiness is a readiness course.

It is not:

- electrical qualification
- HVAC technician qualification
- plumbing qualification
- equipment operator qualification
- construction inspector qualification
- trade licensure
- apprenticeship completion
- contractor licensing
- engineering authority
- architectural authority
- employer authorization

The course may prepare learners to enter those pathways.

It may not claim to replace them.

## 6. Primary Source Strategy

Implementation should compose from three primary source categories:

1. Universal Career Readiness
2. functionally equivalent existing electrical / HVAC technical curriculum
3. genuinely missing construction-specific instructional content

Primary UCR source:

`src/content/lessons/shu-universal-career-readiness-student/`

Relevant technical source families include:

- `src/content/lessons/data-center-specialization-11-student/`
- `src/content/lessons/data-center-specialization-12-student/`
- `src/content/lessons/data-center-reliable-operations-10-student/`
- `src/content/lessons/data-center-technical-foundations-9-student/`

These technical lessons may supply reusable capability patterns where functionally equivalent.

They must not be copied merely because construction uses similar systems.

## 7. Lesson Reuse Decision Summary

The reviewed Pass 2 planning target is:

- REUSE: 6
- CONTEXTUALIZE: 26
- EXTEND: 19
- MISSING: 24

Total:

75 lessons

This distribution must be preserved unless implementation evidence justifies a revision.

## 8. Reuse Principle

A lesson classified REUSE should use existing authority as directly as technically feasible.

A lesson classified CONTEXTUALIZE should preserve existing capability and add construction-specific examples or scenarios.

A lesson classified EXTEND should reuse the existing foundation and add only genuinely missing construction-specific instruction.

A lesson classified MISSING may justify new source content.

MISSING does not automatically justify new competency authority.

## 9. Transferable UCR Authority

Construction must preferentially reuse UCR for:

- reliability
- professionalism
- accountability
- communication
- teamwork
- coordination
- safety culture
- scope awareness
- problem solving
- decision making
- time and task management
- digital responsibility
- accessibility
- ethics
- career planning
- evidence
- portfolio truthfulness
- self-advocacy
- transition planning

No Construction-specific competency authority should duplicate these unless functional-equivalence review proves a material difference.

## 10. Functionally Equivalent Electrical Reuse

Construction should inspect existing electrical-infrastructure lessons before creating new capability around:

- electrical safety
- voltage / current / power concepts
- power paths
- monitoring
- load
- capacity
- headroom
- controlled change
- escalation
- technical documentation

Reuse must be based on learner capability, not merely matching vocabulary.

## 11. Functionally Equivalent HVAC Reuse

Construction should inspect existing mechanical / HVAC lessons before creating new capability around:

- thermal fundamentals
- airflow
- environmental conditions
- cooling
- mechanical safety
- capacity
- maintenance awareness
- monitoring
- escalation
- incident reasoning

Construction may add building-project and trade-coordination context.

## 12. Currently Identified Missing Objectives

The Lesson Reuse Map currently identifies 24 MISSING lesson objectives.

These are concentrated in areas such as:

- construction-system orientation
- construction project sectors
- plans and drawings
- symbols and specifications
- plan-reading exercise
- construction math
- tolerance
- layout and reference points
- hand / power tool categories
- construction materials
- heavy-equipment awareness
- design-to-construction workflow
- inspection-role awareness
- electrical trade coordination
- HVAC trade coordination
- plumbing systems
- drainage / flow
- plumbing materials
- plumbing coordination
- structural systems
- load-path awareness
- building envelope
- moisture / weather protection

These are source-content candidates.

They are not automatically new competency candidates.

## 13. Source File Location

Implementation must first confirm the canonical source location for the course.

New content should follow existing lesson-source conventions under:

`src/content/lessons/`

The exact directory name must be deterministic and consistent with current importer behavior.

Do not create a separate Construction content system.

## 14. Source Naming

Lesson files must follow existing repository conventions.

Naming must be:

- deterministic
- stable
- lowercase
- ordered
- free of unsupported licensure claims
- free of unsupported certification claims
- free of employer authorization claims

## 15. Source Schema

Construction must use the existing supported curriculum source schema.

Do not create a Construction-specific schema unless the canonical schema is proven insufficient.

If the current schema cannot express a required feature:

- document the exact limitation
- identify the canonical owner
- propose a bounded extension
- stop for integration review

No local substitute is permitted.

## 16. Curriculum Import Authority

Construction must use the canonical curriculum importer architecture.

Do not create a Construction-only importer.

Implementation must identify and reuse the governed import services already used for UCR and other source curriculum.

## 17. Import Preview Requirement

Before execute/import:

- source must parse
- source must validate
- preview must succeed
- preview must not create unintended catalog records
- stable keys must be deterministic
- unit ordering must be deterministic
- lesson ordering must be deterministic
- duplicate behavior must remain canonical

Preview is required before execute.

## 18. Draft-State Rule

Initial Construction imports must remain DRAFT.

No initial Pass 2 implementation may publish the course directly to production.

Publication remains governed by canonical release authority.

## 19. Duplicate Import Rule

Repeated import of identical source must not silently create duplicate curriculum.

Construction must rely on canonical duplicate-handling behavior.

Do not create a local deduplication system.

## 20. No Copy-Paste UCR Clone

Construction implementation must not create 75 standalone copied UCR lessons with construction terminology substituted.

The preferred architecture is composition and contextualization.

Only genuinely different instructional objectives should become new Construction source content.

## 21. No Copy-Paste Electrical Clone

Construction must not copy Data Center electrical content wholesale.

Electrical capability should be reused where functionally equivalent.

Construction-specific additions may include:

- building trade context
- jobsite coordination
- construction sequencing
- safe observation

Electrical authority remains canonical elsewhere.

## 22. No Copy-Paste HVAC Clone

Construction must not copy Data Center HVAC content wholesale.

Mechanical / HVAC capability should be reused where functionally equivalent.

Construction-specific additions may include:

- building-project context
- routing
- space coordination
- sequencing with other trades

HVAC authority remains canonical elsewhere.

## 23. Construction Safety Scope

Construction may teach:

- hazard awareness
- stop-work reasoning
- reporting
- scope
- escalation
- safe documentation
- procedure discipline
- synthetic site analysis

It must not authorize learners to:

- work at height
- enter confined spaces
- operate dangerous tools
- operate heavy machinery
- defeat safeguards
- work on energized systems
- service HVAC equipment
- install plumbing
- modify structural systems
- approve field changes

## 24. Plans and Drawing Scope

Construction may teach:

- plans
- elevations
- sections
- symbols
- specifications
- revisions
- controlled-document awareness

It must not authorize learners to:

- issue design drawings
- stamp plans
- approve design changes
- direct field modifications
- act as architect or engineer

## 25. Measurement and Layout Scope

Construction may teach:

- dimensions
- units
- fractions
- tolerance
- supplied layout references
- synthetic measurement reasoning

It must not establish:

- survey authority
- inspector authority
- field-layout qualification
- real-project dimensional approval

## 26. Tool Scope

Construction may teach:

- tool categories
- intended uses
- selection reasoning
- authorization boundaries
- safe recognition

It must not establish:

- power-tool qualification
- operator authorization
- employer-specific tool qualification

## 27. Equipment Scope

Construction may teach:

- equipment categories
- function
- exclusion zones
- operator-role awareness
- escalation

It must not establish:

- forklift qualification
- crane qualification
- aerial-lift qualification
- excavator qualification
- heavy-equipment operator qualification

## 28. Quality Scope

Construction may teach:

- conformance
- requirements
- specifications
- defects
- documentation
- traceability
- inspection-role awareness

It must not authorize learners to:

- approve work
- issue inspection findings
- sign inspection records
- approve punch lists
- approve final acceptance
- act as code officials

## 29. Electrical Authority

Construction must not duplicate canonical electrical-infrastructure authority.

Relevant existing electrical curriculum should be reused or referenced where functionally equivalent.

Construction electrical context does not make Construction the owner of electrical competency.

## 30. Electrical Safety Boundary

No Construction activity may authorize:

- energized work
- electrical panel access
- live voltage measurement
- wiring
- breaker operation
- switchgear operation
- electrical troubleshooting
- electrical inspection

unless separately governed external authority exists.

## 31. HVAC Authority

Construction must not duplicate canonical mechanical/HVAC authority.

Relevant existing HVAC curriculum should be reused where functionally equivalent.

Building-project context does not create a second HVAC competency owner.

## 32. HVAC Safety Boundary

No Construction activity may authorize:

- refrigerant handling
- compressor service
- chiller service
- controls modification
- electrical HVAC repair
- commissioning
- HVAC technician qualification

## 33. Plumbing Scope

Construction may teach:

- basic supply systems
- drainage systems
- fixture concepts
- material categories
- routing awareness
- coordination

It must not authorize:

- plumbing installation
- pressure testing
- code inspection
- live-system modification
- plumbing licensure

## 34. Structural Scope

Construction may teach:

- structural system categories
- basic load-path concepts
- support awareness
- structural coordination

It must not authorize:

- structural design
- engineering calculations for real projects
- structural approval
- field modification decisions

## 35. Building Envelope Scope

Construction may teach:

- roofs
- walls
- weather barriers
- enclosure concepts
- moisture awareness

It must not establish:

- envelope inspection authority
- design authority
- remediation authority
- code-enforcement authority

## 36. Prepare / Prove Authority

Construction must use canonical:

`apps/shs-api/src/domain/prepare-prove/`

for competency, evidence and reviewer workflows.

No Construction-specific evidence service is permitted.

No Construction-specific competency registry is permitted.

No Construction-specific reviewer authority is permitted.

## 37. Competency Discovery Before Proof Work

Before implementing formal Construction proof activities:

- inspect canonical competency definitions
- inspect UCR proof configurations
- inspect electrical proof configurations
- inspect mechanical/HVAC proof configurations
- inspect safety, scope, problem-solving, decision-making and evidence competencies
- verify actual slugs from source

Do not fabricate competency IDs.

## 38. Existing Electrical Proof Authority

Existing proof / competency authority includes:

`grade12-electrical-infrastructure-critical-power-reliability-analysis`

Construction must audit it before proposing new electrical proof configuration.

Construction context alone is insufficient reason for duplication.

## 39. Existing HVAC Proof Authority

Existing proof / competency authority includes:

`grade12-mechanical-hvac-thermal-capacity-reliability-analysis`

Existing HVAC-related proof activity also includes:

`grade11-mechanical-hvac-thermal-airflow-interpretation`

Construction must audit these before proposing new HVAC proof configuration.

## 40. Primary Proof Candidate Set

Exactly three primary proof candidates are currently planned:

1. Construction Safety / Scope Decision Scenario
2. Construction Problem-Solving / Quality Scenario
3. Construction Evidence & Career Self-Advocacy Presentation

No additional primary proof should be added without review.

## 41. Safety / Scope Proof

Preferred implementation outcome:

reuse or contextualize existing safety / scope / decision authority.

Electrical and HVAC scenario elements must reuse their canonical technical safety boundaries.

Only if functional-equivalence review proves insufficiency may an extension be proposed.

## 42. Problem-Solving / Quality Proof

Preferred implementation outcome:

reuse canonical Problem Solving and Decision Making authority.

Construction-specific plan, specification, measurement and quality context may require an extension to the evidence prompt.

The proof must not establish:

- design authority
- inspection authority
- engineering authority
- field-change authority

## 43. Evidence / Career Proof

Preferred implementation outcome:

direct reuse or contextualization of UCR Evidence & Self-Advocacy authority.

Construction should primarily contribute:

- course artifacts
- skilled-trades context
- qualification-boundary prompts
- pathway context
- next-step planning

No Construction-specific self-advocacy competency should be created if UCR is sufficient.

## 44. Evidence Chain

Implementation must preserve:

Activity Result
→ Evidence
→ Authorized Review
→ Competency Decision

No path may jump directly from:

- lesson completion
- quiz
- plan-reading exercise
- measurement exercise
- Arcade result
- Metaverse result
- AI output

to verified competency.

## 45. Evidence Candidate Rule

The following may generate evidence candidates:

- plan-reading artifacts
- measurement worksheets
- hazard analyses
- coordination maps
- quality scenarios
- electrical reasoning
- HVAC reasoning
- plumbing system maps
- structural diagrams
- presentations
- reflections
- Arcade output
- Metaverse output

Evidence candidate status must remain distinct from verified competency.

## 46. Reviewer Authority

Reviewer authorization must use existing governed permissions.

Professional experience alone does not automatically grant review authority.

This includes:

- construction professionals
- licensed tradespeople
- contractors
- engineers
- architects
- inspectors
- instructors
- employers
- mentors

External experts may validate content without becoming competency reviewers.

## 47. Completion Authority

Construction must use canonical Completion Policy.

No Construction-specific completion engine is permitted.

Completion does not automatically establish:

- competency
- certification
- apprenticeship status
- trade licensure
- electrical authorization
- HVAC qualification
- plumbing qualification
- equipment authorization
- employer authorization

## 48. Career Authority

Construction career mapping must use canonical Career authority.

Source curriculum must not hard-code unsupported:

- wages
- demand
- job growth
- licensure requirements
- apprenticeship availability
- union status
- employer qualification
- placement rates

Career facts require governed source authority.

## 49. Portfolio Authority

Construction may send eligible artifacts to canonical Portfolio where supported.

Do not create a Construction-specific portfolio.

If Portfolio cannot accept a desired artifact:

- document the gap
- identify Portfolio as owner
- request bounded integration review

## 50. Credential Authority

Construction readiness must not issue or imply regulated or employer qualifications.

Any future SHU completion certificate must not be described as:

- electrician certification
- HVAC certification
- plumbing certification
- equipment certification
- inspection certification
- apprenticeship completion
- trade licensure

unless separately governed authority exists.

## 51. Accessibility Authority

Construction must use canonical accessibility and accommodation systems.

No Construction-specific accessibility authority is permitted.

## 52. Accessibility Requirements

Every lesson must support, where applicable:

- semantic structure
- keyboard operation
- screen-reader compatibility
- captions / transcripts
- reduced motion
- non-color-only meaning
- accessible plans
- accessible drawings
- accessible diagrams
- accessible process flows
- accessible measurement data
- plain-language support
- accommodation compatibility

## 53. Accessible Technical Content

Technical graphics such as:

- plans
- elevations
- sections
- site diagrams
- trade coordination maps
- electrical diagrams
- HVAC diagrams
- plumbing diagrams
- structural diagrams
- envelope diagrams

must have accessible text or structured alternatives.

## 54. Assignment Authority

Construction must use canonical assignment authority.

Tests must confirm correct:

- learner
- organization
- tenant
- course
- release
- activity
- competency
- evidence lineage

No Construction-specific assignment system is permitted.

## 55. Assignment Immutability

Implementation must preserve existing assignment-binding rules.

Client-controlled identifiers must not enable:

- reassignment
- cross-organization contamination
- cross-tenant evidence mutation
- reviewer substitution

## 56. Tenant Isolation

Construction implementation must preserve canonical tenant and organization isolation.

Cross-tenant access to curriculum assignment, evidence or review records must fail.

## 57. Reporting Authority

Construction reporting must use canonical Reporting / Truth architecture.

No Construction-specific truth store is permitted.

Reporting must distinguish:

- participation
- completion
- evidence
- reviewed evidence
- competency
- credential
- external qualification

## 58. No Readiness Score

Construction must not introduce a Student Career Readiness Score, trade readiness score, apprenticeship score, jobsite readiness score, or similar institutional truth.

Progress must use canonical facts and outcomes.

## 59. Arcade Boundary

Learning Arcade may support:

- sequencing
- safety reasoning
- measurement reasoning
- plan awareness
- quality reasoning
- trade coordination
- building-system awareness

Arcade results remain evidence candidates unless canonical policy explicitly authorizes otherwise.

## 60. Metaverse Boundary

Construction Metaverse environments may support:

- site orientation
- plan-to-site exploration
- trade sequencing
- electrical-room observation
- mechanical-room observation
- plumbing-system awareness
- structural-system awareness
- simulated inspections

Metaverse output must not directly establish competency or trade authorization.

## 61. AI Boundary

AI may support:

- explanations
- scenario generation
- practice
- feedback drafts
- document interpretation exercises
- accessibility support

AI must not independently:

- verify competency
- approve field changes
- approve inspections
- authorize trade work
- issue licensure
- issue certification
- determine apprenticeship status
- replace qualified reviewer authority

## 62. Source Construction Sequence

After approval:

Phase A — verify source directory and schema

Phase B — map direct UCR reuse

Phase C — map electrical reuse

Phase D — map HVAC reuse

Phase E — implement Construction contextualization

Phase F — implement bounded extensions

Phase G — author only proven missing Construction source content

Phase H — validate source

Phase I — preview import

Phase J — inspect resulting DRAFT structure

Phase K — audit Prepare / Prove functional equivalence

Phase L — bind only approved proof activities

Phase M — build draft learner experience

Phase N — governed acceptance

Phase O — closeout

## 63. Allowed Initial File Classes

Initial implementation may add or modify only files required for:

- Construction curriculum source
- curriculum composition metadata
- narrowly scoped importer configuration if genuinely required
- targeted tests
- draft learner-experience configuration when later authorized

Shared canonical services should remain unchanged unless integration review approves an extension.

## 64. Prohibited Initial Changes

Do not add or modify:

- database migrations
- new competency registries
- new evidence tables
- new completion engines
- new credential authority
- new Career authority
- new Portfolio authority
- new accessibility authority
- new tenant authority
- new Truth store
- new Construction publishing service
- new electrical authority
- new HVAC authority

without separate integration review.

## 65. No Migration Default

The current planning package does not justify a database migration.

Initial Construction implementation therefore assumes:

NO DATABASE MIGRATIONS

Any proposed migration requires new evidence and explicit review.

## 66. Shared-Service Change Gate

If Construction appears to require a shared-system change:

- document the exact limitation
- identify affected source path
- explain why composition cannot solve it
- identify canonical owner
- propose bounded extension
- document other impacted courses
- stop for integration review

No local substitute is permitted.

## 67. Import Validation Tests

Implementation must test:

- source parse
- schema validity
- stable key
- 15-unit structure
- 75-lesson structure
- deterministic unit ordering
- deterministic lesson ordering
- preview behavior
- no unintended preview writes
- draft-state execution
- duplicate handling
- deterministic re-import behavior

## 68. Reuse Validation

Review must confirm:

- UCR transferable authority remains canonical
- electrical authority is reused where functionally equivalent
- HVAC authority is reused where functionally equivalent
- Construction extensions do not duplicate authority
- newly authored content maps only to justified MISSING or EXTEND decisions

## 69. Lesson Count Validation

Acceptance must verify exactly:

- 15 units
- 75 lessons

Any deviation requires an updated planning decision.

## 70. New-Content Validation

Each newly authored Construction lesson must trace back to:

- MISSING classification
or
- approved EXTEND classification

No new lesson should appear without a reuse decision.

## 71. Proof Configuration Audit

Before adding any Construction proof configuration, document:

- target capability
- existing competencies reviewed
- existing proof configurations reviewed
- electrical / HVAC overlap
- functional overlap
- missing capability
- proposed evidence shape
- reviewer authority
- safety boundary
- reassessment behavior
- final reuse decision

Possible decisions:

- REUSE
- CONTEXTUALIZE
- EXTEND
- NEW CANDIDATE

## 72. Proof ID Rule

Proof identifiers must come from:

- verified existing configuration
or
- explicitly approved new configuration

Do not invent proof IDs in planning and later treat them as canonical.

## 73. Evidence-Lineage Test

Formal proof implementation must prove:

learner
→ assignment
→ curriculum release
→ activity result
→ evidence
→ reviewer
→ competency decision

Lineage must remain auditable.

## 74. False-Verification Test

Acceptance must prove that none of these directly creates verified competency:

- lesson completion
- quiz completion
- plan-reading exercise
- measurement exercise
- quality exercise
- electrical simulation
- HVAC simulation
- Arcade success
- Metaverse success
- AI output
- portfolio upload

without canonical authorized review.

## 75. Cross-Tenant Test

Tests must verify that another tenant or organization cannot:

- view Construction learner evidence
- review it
- mutate it
- bind it to another assignment
- issue a competency decision against it

## 76. Reviewer-Permission Test

Unauthorized users must be unable to make canonical competency decisions.

Construction must reuse existing reviewer controls.

## 77. Reassessment Test

If formal proofs are implemented, tests must use canonical reassessment behavior.

No Construction-specific retry workflow is permitted.

## 78. Completion Separation Test

Acceptance must verify:

course completion
≠ competency decision

competency decision
≠ certification

certification
≠ licensure

licensure
≠ employer authorization

## 79. Construction Safety Acceptance

Review must confirm that no implemented content requires learners to:

- perform hazardous field work
- climb or work at height
- operate dangerous machinery
- work on energized electrical systems
- service HVAC systems
- modify plumbing systems
- make structural changes
- approve real field changes

## 80. Plans / Design Boundary Acceptance

Review must confirm:

- plan interpretation remains educational
- no architectural authority
- no engineering authority
- no plan-stamping claim
- no field-change authority
- no design approval authority

## 81. Measurement Boundary Acceptance

Review must confirm:

- measurement activities are classroom-safe or synthetic
- no survey authority
- no field-layout qualification
- no inspection qualification
- no live hazardous measurement

## 82. Tool Boundary Acceptance

Review must confirm:

- tools remain awareness-level unless separately governed
- no power-tool certification
- no employer tool authorization
- no hazardous operation requirement

## 83. Equipment Boundary Acceptance

Review must confirm:

- no forklift qualification
- no crane qualification
- no aerial-lift qualification
- no heavy-equipment qualification
- no operator authorization claim

## 84. Electrical Boundary Acceptance

Review must confirm:

- electrical authority remains canonical
- no energized work
- no panel access
- no live measurement
- no wiring
- no electrician qualification
- no electrical inspection authority

## 85. HVAC Boundary Acceptance

Review must confirm:

- HVAC authority remains canonical
- no refrigerant handling
- no service authority
- no controls modification
- no commissioning
- no HVAC technician qualification

## 86. Plumbing Boundary Acceptance

Review must confirm:

- no plumbing licensure
- no installation authority
- no pressure-test authority
- no code-inspection authority
- no live-system modification

## 87. Structural Boundary Acceptance

Review must confirm:

- no structural design authority
- no real-project engineering calculations
- no structural approval
- no field correction authority

## 88. Quality / Inspection Boundary Acceptance

Review must confirm that no learner activity is represented as:

- official inspection
- code enforcement
- punch-list approval
- final acceptance
- authorized nonconformance disposition

## 89. Career Validation

Before production Career claims are accepted, later review must validate:

- role names
- training requirements
- licensure requirements
- credential requirements
- apprenticeship requirements
- employer-specific variation
- state or federal authority where applicable

No unsupported static fixture should become authoritative Career truth.

## 90. Apprenticeship Boundary

Construction curriculum may explain apprenticeship as a pathway.

It must not claim:

- guaranteed apprenticeship placement
- apprenticeship credit
- apprenticeship completion
- union membership
- automatic eligibility

unless separately validated.

## 91. Employer Validation

Future employer review may validate:

- workplace realism
- jobsite expectations
- safety expectations
- communication
- quality expectations
- trade coordination
- pathway relevance

Employer review does not itself create curriculum, competency, credential, or apprenticeship authority.

## 92. Trade Professional Validation

Appropriate licensed or experienced professionals may review:

- electrical context
- HVAC context
- plumbing awareness
- plan interpretation
- tool / equipment terminology
- construction sequencing
- quality context

Such review validates content quality, not learner competency authority.

## 93. Accessibility Acceptance

Draft learner experience must be checked for:

- keyboard access
- semantic structure
- screen-reader compatibility
- captions / transcripts
- reduced motion
- color-independent meaning
- accessible plans
- accessible drawings
- accessible diagrams
- accessible process maps
- accessible measurement tables
- accommodation compatibility

## 94. Safe Simulation Requirement

Technical scenarios should default to:

- synthetic plans
- simulated measurements
- fictional project data
- modeled jobsite conditions
- non-operational equipment representations
- synthetic electrical values
- synthetic HVAC conditions

Live hazardous environments should not be required for initial acceptance.

## 95. Draft Learner Experience

When draft experience construction is later authorized, use the canonical flow:

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

Not every optional step must appear in every lesson.

## 96. Vocabulary Strategy

Technical vocabulary may include:

- plan
- elevation
- section
- specification
- tolerance
- layout
- conformance
- nonconformance
- electrical load
- airflow
- drainage
- structural system
- building envelope

Vocabulary recognition does not establish trade qualification.

## 97. Assessment Strategy

Construction assessments may evaluate:

- understanding
- classification
- scenario reasoning
- measurement interpretation
- plan interpretation
- workflow reasoning
- safety reasoning
- quality reasoning
- scope awareness
- technical documentation
- evidence literacy
- career planning

They must not claim to evaluate regulated or employer qualification.

## 98. Work-Based Learning Boundary

Future work-based-learning opportunities must use canonical opportunity, assignment and evidence authorities.

Construction curriculum must not invent apprenticeship placement authority.

## 99. Data Privacy

Construction source implementation should not require unnecessary sensitive personal data.

Synthetic project and technical scenarios should be the default.

## 100. Security

Implementation must reuse existing authentication, authorization, organization, tenant and evidence-permission boundaries.

No Construction-specific bypass is permitted.

## 101. Feature Flags

If draft Construction experience requires feature gating, use existing configuration patterns.

Do not introduce a new governance authority merely to hide unfinished work.

## 102. Release Boundary

Initial Construction implementation remains:

DRAFT

Production publication is not authorized by this Pass 2 implementation work order.

Publication requires later acceptance and canonical release authority.

## 103. Disposable Acceptance Environment

Acceptance should use isolated or disposable test data where possible.

Test assignments, evidence and decisions must not contaminate production institutional truth.

## 104. Acceptance Dataset

Acceptance should include at least:

- one Construction learner
- one valid tenant / organization
- one valid assignment
- one REUSE lesson path
- one CONTEXTUALIZE path
- one EXTEND path
- one MISSING/new source lesson path
- one electrical-context scenario
- one HVAC-context scenario
- one proof candidate path if approved
- one unauthorized reviewer attempt
- one cross-tenant denial case

## 105. Acceptance Outcomes

Construction acceptance should prove:

- correct stable key
- correct 15-unit structure
- correct 75-lesson structure
- correct reuse mapping
- correct draft import
- correct assignment isolation
- correct evidence lineage
- correct reviewer authorization
- no false verified state
- correct Completion separation
- preserved accessibility
- preserved trade boundaries

## 106. Clean Diff Requirement

Before commit:

- only intended Construction files may change
- no unrelated canonical files
- no temporary debug files
- no secrets
- no local-environment files
- no accidental generated output
- no unnecessary lockfile churn

## 107. Whitespace Requirement

Before commit:

- run `git diff --check`
- explicitly check new / untracked files for trailing whitespace
- confirm deterministic formatting

## 108. Test Requirement

Run targeted Construction tests plus any shared tests impacted by canonical service changes.

If shared authority changes, existing shared tests must also pass.

## 109. Regression Requirement

Construction must not break:

- UCR
- Data Center curriculum
- electrical infrastructure
- mechanical / HVAC curriculum
- Prepare / Prove
- Completion Policy
- Portfolio
- Career
- accessibility
- assignment isolation
- reporting
- tenant boundaries

## 110. Implementation Commit Strategy

Prefer coherent commits by purpose.

Do not combine unrelated:

- source curriculum
- proof architecture
- importer changes
- UI changes
- backend changes

into one uncontrolled commit.

## 111. Stop Conditions

Stop implementation if:

- a new authority appears necessary
- a migration appears necessary
- electrical ownership becomes ambiguous
- HVAC ownership becomes ambiguous
- UCR would be duplicated
- Data Center technical capability would be duplicated
- proof equivalence remains unresolved
- evidence lineage cannot be preserved
- completion would be locally reimplemented
- tenant isolation is uncertain
- source schema cannot safely express the design

## 112. Integration Review Triggers

Integration review is required for proposed changes to:

- curriculum schema
- importer
- Prepare / Prove shared configuration model
- competency registry behavior
- Completion Policy
- Portfolio
- Career
- accessibility infrastructure
- tenant / organization authority
- evidence / Truth projection
- credential authority
- electrical authority
- HVAC authority

## 113. No Local Substitute Rule

If a canonical authority is insufficient:

do not create a Construction-local substitute.

Instead:

- document the deficiency
- identify canonical owner
- propose a bounded extension
- request integration review

## 114. Expected Initial Implementation Shape

Preferred implementation should primarily consist of:

- UCR reuse
- electrical reuse where functionally equivalent
- HVAC reuse where functionally equivalent
- Construction contextualization
- bounded Construction extensions
- approximately 24 currently identified missing instructional objectives
- reuse of canonical importer
- reuse of Prepare / Prove
- reuse of Completion Policy
- reuse of Career
- reuse of Portfolio
- reuse of accessibility

It should not become 75 entirely independent new lessons unless the composition architecture requires physical source representation.

## 115. Implementation Success Definition

Construction Pass 2 implementation is successful when the course exists as a governed DRAFT composition that:

- preserves canonical authority
- reuses UCR appropriately
- reuses electrical authority where functionally equivalent
- reuses HVAC authority where functionally equivalent
- adds genuine Construction content where missing
- preserves trade and safety boundaries
- produces no false verified state
- maintains assignment and tenant isolation
- can proceed to governed acceptance

## 116. Planning Package Completion

The Construction Pass 2 planning package consists of:

1. `CONSTRUCTION_SKILLED_TRADES_READINESS_SOURCE_CURRICULUM_PLAN.md`
2. `CONSTRUCTION_SKILLED_TRADES_READINESS_LESSON_REUSE_MAP.md`
3. `CONSTRUCTION_SKILLED_TRADES_READINESS_PROOF_ACTIVITY_PLAN.md`
4. `CONSTRUCTION_SKILLED_TRADES_READINESS_PASS_2_IMPLEMENTATION_WORK_ORDER.md`

After mechanical and substantive review, these four documents may be committed together.

Implementation must not begin before that review.

## 117. Current Decision

CONSTRUCTION & SKILLED TRADES PASS 2 IMPLEMENTATION WORK ORDER — DRAFT FOR REVIEW

PLANNING PACKAGE COMPLETE IN DRAFT FORM

IMPLEMENTATION REMAINS BLOCKED PENDING REVIEW AND COMMIT

Intended future implementation model:

REUSE UCR
→ REUSE FUNCTIONALLY EQUIVALENT ELECTRICAL / HVAC AUTHORITY
→ COMPOSE CONSTRUCTION CONTEXT
→ EXTEND ONLY WHERE NECESSARY
→ BUILD ONLY PROVEN MISSING CONTENT
→ REUSE CANONICAL PREPARE / PROVE
→ REUSE CANONICAL COMPLETION
→ REUSE CANONICAL CAREER
→ PRESERVE ELECTRICAL / HVAC / PLUMBING / DESIGN / EQUIPMENT BOUNDARIES
→ TEST IN DRAFT
→ GOVERNED ACCEPTANCE
→ CLOSEOUT
