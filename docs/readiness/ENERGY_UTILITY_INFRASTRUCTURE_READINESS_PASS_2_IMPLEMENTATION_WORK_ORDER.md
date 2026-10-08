# Electrical, Energy & Utility Infrastructure Readiness — Pass 2 Implementation Work Order

Status: DRAFT — PARALLEL PASS 2
Branch: `agent/pass2-readiness-energy`
Baseline: `af2faa2`
Stable key: `shu-energy-utility-infrastructure-readiness`

## 1. Purpose

Define the controlled future implementation sequence for Electrical, Energy & Utility Infrastructure Readiness after completion of Pass 2 planning.

This is Artifact 4 of 4.

This document is planning-only.

It does not authorize:

- production publication
- database migrations
- new electrical competency authority
- electrical licensure
- energized-work authorization
- lineworker qualification
- grid-operator authority
- switching authority
- SCADA authority
- water-operator authority
- wastewater-operator authority
- apprenticeship status
- certification
- employer authorization

## 2. Governing Documents

Implementation must conform to:

- `READINESS_PARALLEL_PASS_2_MASTER_WORK_ORDER.md`
- `ENERGY_UTILITY_INFRASTRUCTURE_READINESS_REUSE_AUDIT.md`
- `ENERGY_UTILITY_INFRASTRUCTURE_READINESS_BLUEPRINT.md`
- `ENERGY_UTILITY_INFRASTRUCTURE_READINESS_SOURCE_CURRICULUM_PLAN.md`
- `ENERGY_UTILITY_INFRASTRUCTURE_READINESS_LESSON_REUSE_MAP.md`
- `ENERGY_UTILITY_INFRASTRUCTURE_READINESS_PROOF_ACTIVITY_PLAN.md`

## 3. Implementation Objective

Build Electrical, Energy & Utility Infrastructure Readiness as a governed readiness course over existing SHU authorities.

Preferred implementation order:

REUSE
→ CONFIGURE
→ COMPOSE
→ CONTEXTUALIZE
→ EXTEND
→ BUILD NEW ONLY WHEN PROVEN MISSING

## 4. Course Identity

Course stable key:

`shu-energy-utility-infrastructure-readiness`

Approved proposed structure:

- 15 units
- 75 lessons

## 5. Lesson Reuse Distribution

Current planning classification:

- REUSE: 20
- CONTEXTUALIZE: 22
- EXTEND: 10
- MISSING: 23

Total:

75

Any implementation change to this distribution requires review.

## 6. Existing Canonical Electrical Authority

The repository already contains mature electrical-infrastructure capability.

Canonical authority includes:

- electrical safety
- voltage
- current
- resistance
- power
- power-path interpretation
- load and capacity
- redundancy
- reliability
- telemetry
- electrical incident analysis
- critical-power reliability
- controlled electrical change

Energy implementation must compose over this authority rather than duplicate it.

## 7. Core Composition Model

Implementation should compose:

Universal Career Readiness
→ canonical electrical-infrastructure capability
→ energy / utility contextualization
→ grid-awareness source
→ renewable-energy awareness
→ storage / microgrid awareness
→ SCADA awareness
→ water / wastewater / public-works readiness
→ practitioner validation
→ canonical Prepare / Prove
→ canonical evidence
→ canonical completion
→ canonical Career
→ canonical Portfolio

## 8. No Parallel Authority

Do not create:

- Energy competency registry
- electrical competency registry
- grid competency registry
- utility competency registry
- renewable competency registry
- water competency registry
- separate evidence engine
- separate completion engine
- separate Career authority
- separate Portfolio authority
- electrical authorization authority
- grid operations authority
- SCADA authority
- water utility authority

## 9. Existing UCR Authority

Universal Career Readiness remains canonical for:

- reliability
- communication
- teamwork
- safety culture
- scope
- authorization
- knowing when to stop
- problem solving
- decision making
- documentation
- ethics
- evidence
- Career Planning
- portfolio
- self-advocacy
- transition planning

## 10. Existing Electrical Proof Authority

Existing proof:

`grade11-electrical-power-path-interpretation`

Existing competency slug:

`electrical-power-path-interpretation`

Existing proof:

`grade11-electrical-load-capacity-reasoning`

Existing competency slug:

`electrical-load-capacity-reasoning`

Existing proof:

`grade11-electrical-infrastructure-incident-analysis`

Existing competency slug:

`electrical-infrastructure-incident-analysis`

Advanced proof patterns include:

`grade12-electrical-infrastructure-critical-power-reliability-analysis`

and:

`grade12-electrical-infrastructure-change-incident-coordination`

## 11. Domain-Specific Source Requirement

New readiness-level source may be needed for:

- energy infrastructure orientation
- utility orientation
- generation
- transmission
- substations
- grid coordination
- renewable-energy systems
- energy storage
- microgrids
- distributed generation
- SCADA awareness
- water systems
- wastewater systems
- public works
- utility-specific careers

## 12. Domain Validation Requirement

Utility-specific source should not be treated as production-ready until reviewed by appropriate professionals.

Potential reviewers include:

- electrical professionals
- utility professionals
- renewable-energy professionals
- substation professionals
- public-works professionals
- water / wastewater professionals
- apprenticeship partners
- safety professionals
- accessibility specialists

## 13. Practitioner Review Boundary

Practitioner review may validate:

- terminology
- realism
- workflow
- safety boundaries
- scenario design
- workplace relevance

It does not automatically create:

- competency-review authority
- licensure authority
- operating authority
- regulatory authority
- switching authority
- SCADA authority
- water-operator authority

## 14. Source Curriculum Location

Future source lessons must use the established curriculum source architecture under:

`src/content/lessons/`

Do not create a separate Energy curriculum engine.

## 15. Source Schema

Use the canonical lesson schema.

Do not create an Energy-specific schema unless a genuine shared limitation is proven and separately reviewed.

## 16. Source Naming

Lesson names and stable keys must be:

- deterministic
- stable
- descriptive
- ordered
- free of unsupported qualification claims
- free of unsupported regulatory claims
- free of unsupported employer-authorization claims

## 17. Importer Authority

Use the canonical curriculum importer.

Do not create an Energy-specific importer.

## 18. Import Preview

Before execution:

- source parses
- schema validates
- stable key validates
- unit count validates
- lesson count validates
- ordering validates
- preview succeeds
- preview causes no unintended catalog writes

## 19. Initial Import State

Initial execution must remain:

DRAFT

No direct production publication is authorized.

## 20. Duplicate Import Rule

Repeated import must not silently create duplicate:

- course
- unit
- lesson

Use canonical duplicate behavior.

## 21. UCR Reuse Rule

Do not clone UCR lessons merely to add Energy terminology.

Reuse transferable authority where functionally equivalent.

## 22. Electrical Reuse Rule

Do not clone existing electrical lessons merely because the Energy course broadens their context.

Reuse existing:

- electrical safety
- voltage
- current
- resistance
- power
- load
- capacity
- redundancy
- telemetry
- power-path reasoning
- electrical incident analysis

where functionally equivalent.

## 23. Power-Path Boundary

Utility grid-path content must not create a second power-path competency.

Generation, transmission, substation and distribution context may be layered over canonical path reasoning.

## 24. Load / Capacity Boundary

Utility load reasoning must reuse canonical electrical load/capacity authority where functionally equivalent.

Do not create grid-load authority merely for course branding.

## 25. Electrical Incident Boundary

Utility outage reasoning must reuse canonical electrical incident authority where functionally equivalent.

Do not create a second incident competency.

## 26. Electrical Safety Boundary

Learners must not:

- open energized panels
- perform live testing
- operate switchgear
- reset breakers
- work on energized conductors
- perform professional LOTO
- perform licensed electrical work

## 27. Transmission Boundary

Instruction may explain transmission systems.

Learners must not:

- work on transmission lines
- issue switching commands
- enter restricted infrastructure
- claim lineworker qualification

## 28. Distribution Boundary

Instruction may explain distribution systems.

Learners must not:

- operate field distribution equipment
- perform energized service
- operate utility switching devices
- claim distribution authorization

## 29. Substation Boundary

Instruction may use:

- diagrams
- synthetic one-lines
- fictional substations
- simulation scenarios

It must not require:

- substation entry
- substation switching
- energized inspection
- live equipment operation

## 30. Transformer Boundary

Transformer concepts may be taught at readiness level.

The course does not authorize:

- installation
- repair
- live testing
- field maintenance

## 31. LOTO Boundary

Lockout/tagout may be taught conceptually.

The course must not represent classroom activity as professional LOTO qualification.

## 32. Arc-Flash Boundary

The course may teach:

- hazard awareness
- boundaries
- PPE concepts
- escalation

It must not confer:

- incident-energy calculation authority
- PPE qualification
- energized-work authorization

## 33. Grid Operations Boundary

The course may teach:

- generation
- transmission
- distribution
- grid coordination
- monitoring
- outages
- restoration concepts

It must not confer:

- system-operator status
- balancing authority
- dispatch authority
- switching authority
- control-room authorization

## 34. Renewable Boundary

Renewable instruction may cover:

- solar
- wind
- variability
- grid integration
- monitoring
- dependencies

It does not confer:

- solar installer certification
- wind technician certification
- interconnection authority
- professional engineering authority

## 35. Energy Storage Boundary

Storage instruction may cover:

- storage roles
- resilience
- balancing
- battery-system concepts
- safety awareness

Learners must not perform:

- battery disassembly
- energized service
- hazardous response
- system switching

## 36. Microgrid Boundary

Microgrid instruction may cover:

- generation
- storage
- load
- resilience
- dependencies

It must not authorize real microgrid control.

## 37. SCADA Boundary

SCADA instruction is awareness-only.

Learners may interpret:

- synthetic statuses
- alarms
- trends
- historical values
- mock screens

Learners must not:

- access production SCADA
- use real utility credentials
- issue control commands
- manipulate real infrastructure

## 38. Water Utility Boundary

Water-system instruction is readiness-level.

It does not authorize:

- pump operation
- valve operation
- treatment control
- chemical dosing
- sampling
- laboratory analysis
- regulatory decisions
- certified operator status

## 39. Wastewater Boundary

Wastewater instruction is readiness-level.

It does not authorize:

- treatment-process control
- biological-process operation
- chemical handling
- plant-control decisions
- certified operator status

## 40. Public Works Boundary

Public Works instruction may cover:

- infrastructure dependencies
- service continuity
- maintenance coordination
- incident awareness

It does not create Public Works operating authority.

## 41. Primary Proof Model

Exactly three primary proof candidates are planned:

1. Grid Path Interpretation
2. Utility Outage Scenario
3. Water Utility Incident Awareness

## 42. Renewable Comparison Disposition

Renewable Energy Comparison remains:

- supporting activity
- evidence candidate
- possible Portfolio artifact

It is not one of the initial three primary proofs.

## 43. Proof 1 — Grid Path Interpretation

Preferred implementation:

EXTEND SYNTHETIC ACTIVITY CONTEXT
→ REUSE `electrical-power-path-interpretation`
→ CANONICAL ACTIVITY RESULT
→ EVIDENCE
→ AUTHORIZED REVIEW
→ COMPETENCY DECISION

No new power-path competency is proposed.

## 44. Proof 1 Scenario Safety

Use:

- fictional generation source
- synthetic transmission stage
- fictional substation
- synthetic distribution path
- modeled downstream load
- synthetic dependency information

No live electrical operation is required.

## 45. Proof 1 Acceptance

Acceptance must verify:

- existing power-path competency reused
- no duplicate competency created
- evidence versus assumption preserved
- no live electrical work
- no switching authority
- canonical evidence chain preserved

## 46. Proof 2 — Utility Outage Scenario

Preferred implementation:

EXTEND SYNTHETIC INCIDENT CONTEXT
→ AUDIT FOR REUSE OF `electrical-infrastructure-incident-analysis`
→ CANONICAL ACTIVITY RESULT
→ EVIDENCE
→ AUTHORIZED REVIEW
→ COMPETENCY DECISION IF FUNCTIONALLY EQUIVALENT

## 47. Proof 2 Scenario Safety

Use:

- fictional utility
- synthetic outage map
- synthetic telemetry
- fictional affected zones
- simulated dependencies
- synthetic maintenance notes

No live utility operation is required.

## 48. Proof 2 Restoration Boundary

The learner may identify restoration considerations.

The learner must not:

- order switching
- operate utility equipment
- restore service
- issue control commands
- direct crews
- override procedures

## 49. Proof 2 Acceptance

Acceptance must verify:

- existing incident authority audited
- no duplicate incident competency
- synthetic evidence only
- service impact correctly described
- uncertainty preserved
- authorized escalation identified
- no operating authority implied

## 50. Proof 3 — Water Utility Incident Awareness

Preferred implementation:

NEW SYNTHETIC DOMAIN ACTIVITY
→ AUDIT TRANSFERABLE SAFETY / SCOPE / PROBLEM-SOLVING / DOCUMENTATION / EVIDENCE AUTHORITY
→ REUSE EXISTING COMPETENCY WHERE FUNCTIONALLY EQUIVALENT
→ CANONICAL ACTIVITY RESULT
→ EVIDENCE
→ AUTHORIZED REVIEW
→ COMPETENCY DECISION IF GOVERNED

## 51. Proof 3 Scenario Safety

Use:

- fictional water utility
- synthetic system diagram
- simulated service impact
- synthetic pressure/status values
- fictional pump-station state
- simulated power dependency
- fictional maintenance note

No real water-system operation is required.

## 52. Proof 3 Operator Boundary

Learners must not:

- operate pumps
- operate valves
- alter treatment
- adjust chemical dosing
- perform sampling
- perform lab testing
- issue public-health notices
- make regulatory decisions

## 53. Proof 3 Acceptance

Acceptance must verify:

- synthetic data only
- correct service-impact reasoning
- evidence versus assumption preserved
- prohibited actions identified
- authorized escalation identified
- no water-operator authority
- canonical evidence chain preserved

## 54. Existing Power-Path Proof Reference

Canonical proof:

`grade11-electrical-power-path-interpretation`

Canonical competency slug:

`electrical-power-path-interpretation`

This is the primary anchor for Grid Path Interpretation.

## 55. Existing Load / Capacity Proof Reference

Canonical proof:

`grade11-electrical-load-capacity-reasoning`

Canonical competency slug:

`electrical-load-capacity-reasoning`

This remains available for course lessons and supporting evidence.

## 56. Existing Incident Proof Reference

Canonical proof:

`grade11-electrical-infrastructure-incident-analysis`

Canonical competency slug:

`electrical-infrastructure-incident-analysis`

This is the primary anchor for Utility Outage Scenario.

## 57. Existing Reliability Proof Reference

Existing:

`grade12-electrical-infrastructure-critical-power-reliability-analysis`

may support advanced reasoning about:

- redundancy
- capacity
- failure domains
- telemetry
- uncertainty

## 58. Existing Controlled Change Proof Reference

Existing:

`grade12-electrical-infrastructure-change-incident-coordination`

may support reasoning about:

- authorization
- dependencies
- validation
- handoff
- escalation

It must not become switching authority.

## 59. No Grid-Operator Proof

No grid-operator proof is authorized by this work order.

## 60. No Switching Proof

No switching-authority proof is authorized.

## 61. No SCADA-Control Proof

No SCADA-control proof is authorized.

## 62. No Lineworker Proof

No lineworker qualification proof is authorized.

## 63. No Water-Operator Proof

No water-operator qualification proof is authorized.

## 64. No Wastewater-Operator Proof

No wastewater-operator qualification proof is authorized.

## 65. Prepare / Prove Authority

Formal proof work must use canonical Prepare / Prove services.

No Energy-specific proof engine is permitted.

## 66. Competency Audit Before Proof Binding

Before implementing formal proof binding:

- inspect competency definitions
- inspect `PROOF_CONFIGS`
- inspect exact criteria
- inspect evidence shape
- inspect eligibility
- inspect reviewer authority
- inspect reassessment
- compare functional equivalence
- document final recommendation

## 67. No Fabricated Competency IDs

Do not invent competency IDs.

Only use:

- verified existing identifiers
or
- explicitly approved new identifiers after separate review

## 68. Evidence Chain

Formal activity flow remains:

Assignment
→ Learner Access
→ Activity Result
→ Evidence
→ Authorized Review
→ Competency Decision

No step may be bypassed.

## 69. Evidence Candidate Rule

The following may generate evidence candidates:

- power-path analysis
- load/capacity work
- utility dependency map
- synthetic telemetry review
- outage handoff
- renewable comparison
- microgrid resilience analysis
- water-system flow diagram
- public-works incident review
- Career presentation

Evidence candidate does not equal verified competency.

## 70. Reviewer Authority

Only canonical authorized reviewers may issue competency decisions.

Utility professionals do not automatically become competency reviewers.

## 71. Reassessment

Formal proof activities must use canonical reassessment behavior.

No Energy-specific retry or decision engine is permitted.

## 72. Assignment Authority

Use canonical assignment services.

No Energy-specific assignment engine is permitted.

## 73. Tenant Isolation

Acceptance must verify another tenant cannot:

- access learner evidence
- review learner evidence
- modify learner evidence
- issue competency decisions

## 74. Completion Authority

Use canonical Completion Policy.

No Energy-specific completion engine is permitted.

## 75. Completion Separation

Acceptance must preserve:

course completion
≠ electrical licensure

course completion
≠ grid authorization

course completion
≠ lineworker qualification

course completion
≠ SCADA authority

course completion
≠ water-operator status

course completion
≠ apprenticeship completion

## 76. Career Authority

All career mappings must use canonical Career authority.

Do not hard-code unsupported claims about:

- wages
- hiring demand
- job placement
- credential requirements
- licensure
- apprenticeship eligibility
- employer qualification

## 77. Portfolio Authority

Eligible artifacts must use canonical Portfolio.

Do not create an Energy-specific portfolio system.

## 78. Credential Authority

The course must not issue or imply:

- electrical license
- lineworker credential
- utility operator credential
- grid-operator qualification
- SCADA credential
- solar installer certification
- wind technician certification
- water operator certification
- wastewater operator certification

unless separately established by the proper external authority.

## 79. Accessibility Authority

Use canonical accessibility and accommodation systems.

No domain-specific accessibility authority is permitted.

## 80. Accessibility Requirements

Draft learner experiences must support:

- semantic headings
- keyboard navigation
- screen readers
- captions
- transcripts
- reduced motion
- non-color-only meaning
- accessible one-line diagrams
- accessible grid maps
- accessible power-path diagrams
- accessible telemetry charts
- accessible SCADA-style displays
- accessible outage timelines
- accessible water-system diagrams

## 81. Responsible AI Boundary

AI may support:

- explanation
- tutoring
- scenario variation
- feedback drafts
- accessibility
- terminology support
- practice questions

AI must not:

- issue competency decisions
- operate infrastructure
- approve switching
- control SCADA
- authorize electrical work
- issue public-health decisions

## 82. Learning Arcade Boundary

Arcade may support:

- path tracing
- safety reasoning
- load/capacity reasoning
- outage analysis
- renewable comparison
- dependency reasoning

Arcade output remains an evidence candidate unless canonical policy authorizes more.

## 83. Metaverse Boundary

Metaverse may simulate:

- substations
- power facilities
- renewable sites
- utility control centers
- outages
- water infrastructure
- public works

Metaverse results do not establish professional qualification.

## 84. MOCC Boundary

MOCC Power and Water / Wastewater / Stormwater overlays may support simulation.

They must not be represented as authoritative live utility feeds unless backed by approved sources.

## 85. Source Construction Sequence

After planning approval:

Phase A — verify source path and schema

Phase B — map UCR reuse

Phase C — map electrical-infrastructure direct reuse

Phase D — map proof reuse

Phase E — author contextualized lessons

Phase F — author 23 proven missing readiness lessons

Phase G — practitioner review

Phase H — revise terminology and boundaries

Phase I — source validation

Phase J — preview import

Phase K — execute DRAFT only

Phase L — proof-equivalence audit

Phase M — configure approved proof bindings if authorized

Phase N — build draft learner experience

Phase O — governed acceptance

Phase P — closeout

## 86. Allowed Initial File Classes

Initial implementation may change only what is needed for:

- Energy / Utility readiness source content
- course composition metadata
- narrowly required importer configuration
- targeted tests
- approved draft learner configuration

## 87. Prohibited Initial Changes

Do not change without separate review:

- database migrations
- competency registries
- evidence tables
- completion engines
- Career authority
- Portfolio authority
- credential authority
- reviewer authority
- tenant authority
- electrical authorization authority
- grid operations authority
- SCADA authority
- water operations authority
- Truth stores

## 88. No Migration Default

Current planning does not justify a database migration.

Initial assumption:

NO DATABASE MIGRATIONS

## 89. Shared-Service Change Gate

If implementation appears to require a shared-service change:

1. stop
2. document the limitation
3. identify the canonical owner
4. explain why composition is insufficient
5. identify affected courses
6. propose the smallest shared change
7. require integration review

## 90. Import Validation

Implementation must validate:

- stable key
- source parsing
- schema validity
- 15 units
- 75 lessons
- deterministic ordering
- preview
- no unintended preview writes
- DRAFT execution
- duplicate handling
- deterministic re-import

## 91. Lesson Traceability

Every new source lesson must trace to:

- MISSING
or
- approved EXTEND

No unexplained new lesson is permitted.

## 92. Reuse Validation

Acceptance must confirm:

- UCR remains canonical
- electrical-infrastructure authority remains canonical
- power-path reasoning is not duplicated
- load/capacity reasoning is not duplicated
- incident authority is not duplicated
- telemetry patterns remain shared
- Career remains canonical
- Portfolio remains canonical

## 93. Proof Configuration Validation

Before adding or extending any proof configuration, document:

- target activity
- target capability
- existing proofs reviewed
- existing competencies reviewed
- functional overlap
- missing domain context
- criteria differences
- evidence shape
- reviewer authority
- reassessment behavior
- final recommendation

## 94. Grid Path Acceptance

Acceptance must verify:

- synthetic path only
- existing power-path competency reused
- no energized work
- no switching
- evidence versus assumption preserved
- canonical evidence chain

## 95. Utility Outage Acceptance

Acceptance must verify:

- synthetic outage
- existing incident authority audited
- no live controls
- no restoration commands
- uncertainty preserved
- authorized escalation
- canonical evidence chain

## 96. Water Utility Acceptance

Acceptance must verify:

- synthetic water data
- no real treatment control
- no chemical dosing
- no sampling
- no public-health determination
- authorized escalation
- canonical evidence chain

## 97. Renewable Supporting Activity Acceptance

Renewable Energy Comparison must remain:

- supporting learning
- evidence candidate

unless separate proof review authorizes otherwise.

## 98. False Verification Test

Acceptance must prove none of these directly creates verified competency:

- lesson completion
- quiz completion
- grid simulation
- outage simulation
- renewable comparison
- water incident simulation
- Arcade result
- Metaverse result
- AI output
- portfolio upload

## 99. Unauthorized Reviewer Test

A user without canonical reviewer permission must be unable to issue a competency decision.

## 100. Cross-Tenant Test

A user from another tenant must be unable to access or review the learner's Energy readiness evidence.

## 101. Reassessment Test

Any formal proof must follow canonical reassessment behavior.

## 102. Electrical Authority Test

Acceptance must confirm the course does not grant:

- electrical licensure
- electrician qualification
- energized-work authorization
- professional LOTO authority
- switchgear authorization

## 103. Grid Authority Test

Acceptance must confirm the course does not grant:

- grid-operator authority
- balancing authority
- dispatch authority
- transmission operating authority
- distribution switching authority

## 104. SCADA Authority Test

Acceptance must confirm the course does not grant:

- SCADA credentials
- SCADA control permission
- production-system access

## 105. Water Authority Test

Acceptance must confirm the course does not grant:

- water operator authority
- wastewater operator authority
- treatment authority
- sampling authority
- lab authority

## 106. Live Data Test

Acceptance must confirm synthetic or explicitly authorized data is used.

Do not fabricate live:

- grid conditions
- outage states
- SCADA states
- water-system states
- wastewater-system states

## 107. Data Privacy

Use fictional or synthetic:

- utilities
- customers
- substations
- feeders
- device IDs
- outage records
- maintenance notes
- water-system data
- operational records

Do not introduce unnecessary sensitive data.

## 108. Career Validation

Career content must be validated through canonical Career authority before production claims.

## 109. Employer / Practitioner Review

Industry reviewers may validate:

- terminology
- workflow realism
- electrical boundaries
- grid concepts
- renewable context
- water/public-works context
- escalation paths

They do not automatically obtain competency-decision authority.

## 110. Accessibility Acceptance

Acceptance must verify equivalent access to:

- one-line diagrams
- grid-path exercises
- telemetry exercises
- SCADA-style screens
- outage timelines
- renewable comparison
- water-system diagrams
- proof submission

## 111. Draft Learner Flow

When authorized, use the canonical lesson flow:

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

## 112. Vocabulary Strategy

Potential vocabulary includes:

- generation
- transmission
- distribution
- substation
- transformer
- load
- capacity
- redundancy
- telemetry
- grid
- renewable
- energy storage
- microgrid
- SCADA
- outage
- restoration
- drinking water
- wastewater
- public works

Vocabulary knowledge does not establish professional qualification.

## 113. Assessment Strategy

Assessments may evaluate:

- understanding
- terminology
- safety boundaries
- systems thinking
- evidence use
- path tracing
- load/capacity reasoning
- outage reasoning
- renewable comparisons
- utility dependencies
- Career planning

They must not claim professional authorization.

## 114. Work-Based Learning Boundary

Future work-based learning must use canonical opportunity and assignment authority.

The course must not independently create:

- apprenticeship enrollment
- utility employment
- substation access
- grid control access
- SCADA access
- water-plant access
- electrical authorization

## 115. Feature Flags

Use existing feature/configuration patterns if draft gating is needed.

Do not create a new governance system for unfinished course surfaces.

## 116. Release Boundary

Initial implementation remains:

DRAFT

Persistent production publication is not authorized by this work order.

## 117. Disposable Acceptance

Where possible, acceptance should use disposable data and environments.

Test data must not contaminate persistent institutional truth.

## 118. Acceptance Dataset

Acceptance should include at least:

- one learner
- one tenant
- one organization
- one assignment
- one REUSE lesson
- one CONTEXTUALIZE lesson
- one EXTEND lesson
- one MISSING/new lesson
- one Grid Path scenario
- one Utility Outage scenario
- one Water Utility scenario
- one unauthorized reviewer attempt
- one cross-tenant denial

## 119. Acceptance Outcomes

Acceptance should prove:

- correct stable key
- 15 units
- 75 lessons
- correct composition
- DRAFT import
- canonical assignments
- canonical evidence lineage
- authorized review
- no false competency
- no false electrical qualification
- no false grid authorization
- no false SCADA authority
- no false water-operator authority
- canonical completion
- canonical Career
- canonical Portfolio
- accessibility

## 120. Regression Requirement

Implementation must not break:

- Universal Career Readiness
- Prepare / Prove
- Completion Policy
- Career
- Portfolio
- accessibility
- tenant isolation
- Reporting / Truth
- existing Data Center electrical-infrastructure curriculum
- Construction readiness reuse of electrical authority

## 121. Clean Diff Requirement

Before commit:

- only intended files changed
- no temporary files
- no secrets
- no local configuration
- no accidental generated output
- no unrelated code
- no unnecessary lockfile changes

## 122. Whitespace Requirement

Before commit:

- inspect untracked files explicitly
- run `git diff --cached --check` after staging
- resolve all formatting issues

## 123. Test Requirement

Run targeted tests for every implementation area touched.

If a canonical shared service changes, run its relevant regression suite.

## 124. Stop Conditions

Stop implementation if:

- new regulatory authority appears necessary
- database migration appears necessary
- electrical authorization appears necessary
- grid operations authority appears necessary
- SCADA control appears necessary
- water-treatment authority appears necessary
- hazardous live electrical activity appears necessary
- evidence lineage cannot be preserved
- Completion would need a local engine
- source schema appears insufficient

## 125. Planning Package

The complete Electrical, Energy & Utility Infrastructure Pass 2 planning package is:

1. `ENERGY_UTILITY_INFRASTRUCTURE_READINESS_SOURCE_CURRICULUM_PLAN.md`
2. `ENERGY_UTILITY_INFRASTRUCTURE_READINESS_LESSON_REUSE_MAP.md`
3. `ENERGY_UTILITY_INFRASTRUCTURE_READINESS_PROOF_ACTIVITY_PLAN.md`
4. `ENERGY_UTILITY_INFRASTRUCTURE_READINESS_PASS_2_IMPLEMENTATION_WORK_ORDER.md`

After full package review, these four documents may be staged and committed together.

## 126. Implementation Status

Current status:

PLANNING ONLY

No source construction is authorized yet.

No proof creation is authorized yet.

No competency creation is authorized.

No migration is authorized.

No production publication is authorized.

## 127. Integration Principle

Electrical, Energy & Utility Infrastructure Readiness should become a governed readiness layer over SHU's shared systems.

It must not become a second electrical authority or independent utility-operations authority.

## 128. Final Architecture

Preferred future model:

UCR
→ CANONICAL ELECTRICAL-INFRASTRUCTURE SOURCE
→ CANONICAL ELECTRICAL PROOFS
→ ENERGY / UTILITY CONTEXTUALIZATION
→ GRID-AWARENESS SOURCE
→ RENEWABLE / STORAGE / MICROGRID AWARENESS
→ SCADA AWARENESS
→ WATER / WASTEWATER / PUBLIC-WORKS READINESS
→ PRACTITIONER VALIDATION
→ CANONICAL PREPARE / PROVE
→ CANONICAL COMPLETION
→ CANONICAL CAREER
→ CANONICAL PORTFOLIO
→ GOVERNED REPORTING

## 129. Current Decision

ELECTRICAL, ENERGY & UTILITY INFRASTRUCTURE PASS 2 IMPLEMENTATION WORK ORDER — DRAFT FOR REVIEW

PLANNING PACKAGE COMPLETE IN DRAFT FORM

IMPLEMENTATION REMAINS BLOCKED PENDING FULL PACKAGE REVIEW

Core decisions:

- 15 units
- 75 lessons
- REUSE 20
- CONTEXTUALIZE 22
- EXTEND 10
- MISSING 23
- exactly 3 primary proof candidates
- Grid Path reuses existing power-path authority
- Utility Outage audits existing incident authority
- Water Utility Incident is a new synthetic domain activity
- Renewable Energy Comparison remains supporting
- no electrical licensure
- no energized-work authorization
- no grid-operator authority
- no switching authority
- no SCADA authority
- no water-operator authority
- no wastewater-operator authority
- practitioner validation required
- canonical evidence and review preserved
