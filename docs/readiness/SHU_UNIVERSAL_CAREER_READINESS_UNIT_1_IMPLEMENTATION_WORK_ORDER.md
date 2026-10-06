# SHU UNIVERSAL CAREER READINESS — UNIT 1 IMPLEMENTATION WORK ORDER

Status: READY FOR IMPLEMENTATION
Version: 1.0
Date: 2026-10-06
Course: SHU Universal Career Readiness
Unit: Unit 1 — Entering the World of Work

## 1. Objective

Implement the first production vertical slice of SHU Universal Career Readiness without creating duplicate platform authorities.

The slice must prove:

Curriculum
→ Assessment
→ Evidence
→ Competency
→ Portfolio
→ Career
→ Completion
→ Reporting

The implementation must reuse the existing SHU curriculum, completion, competency, evidence, portfolio, career, accessibility, reporting, and governance authorities.

## 2. Governing Documents

Read before implementation:

- docs/readiness/READINESS_SYSTEM_MASTER_REUSE_AUDIT.md
- docs/readiness/READINESS_CANONICAL_COMPONENT_REGISTRY.md
- docs/readiness/READINESS_COURSE_COMPOSITION_TEMPLATE.md
- docs/readiness/READINESS_COURSE_AGENT_WORK_ORDER_TEMPLATE.md
- docs/readiness/SHU_UNIVERSAL_CAREER_READINESS_BLUEPRINT.md
- docs/readiness/SHU_UNIVERSAL_CAREER_READINESS_UNIT_1_PRODUCTION_SLICE.md

Canonical rule:

Reference → Configure → Compose → Extend → Build New Only When Proven Missing.

## 3. Pass 9 Findings

### Competency authority

Canonical competency authority already exists through:

- `competency_definitions`
- `prepare_prove_evidence`
- `learner_competency_decisions`
- Prepare/Prove services

Do not create a Readiness competency engine or registry.

### Curriculum authority

Canonical Curriculum Catalog / import architecture already supports:

- course stable keys
- unit stable keys
- lesson stable keys
- existing-course detection
- import validation
- published curriculum structure
- learner-result references

Do not create a second course registry or curriculum loader.

### Completion authority

Canonical Completion Policy already owns institutional completion requirements.

Use existing requirement types.

Do not create a Unit 1 completion engine.

### Professional-practice content

Existing Data Center curriculum contains reusable conceptual patterns around:

- authority
- escalation
- professional judgment
- communication
- evidence
- transition planning

These patterns may be generalized into Universal Career Readiness, but industry-specific content remains in Data Center.

## 4. Course Identity

Proposed stable course key:

`shu-universal-career-readiness`

Before creating or importing the course, verify no canonical course with a functional equivalent stable key already exists.

## 5. Unit Identity

Unit title:

`Entering the World of Work`

Proposed unit stable key:

`ucr-entering-world-of-work`

## 6. Required Lessons

### Lesson 1
Title:
What Changes When You Enter the Workplace?

Proposed stable key:
`ucr-01-entering-the-workplace`

Disposition:
BUILD

Outcome:
Learner explains how workplace expectations differ from school, training, and informal environments.

Core concepts:
- role expectations
- accountability
- workplace norms
- supervisor authority
- team responsibility
- consequences
- asking for clarification
- adapting to organizational expectations

Evidence candidate:
Workplace Transition Reflection

Completion:
- CONTENT
- PRACTICE
- ASSESSMENT
- REFLECTION

### Lesson 2
Title:
What Employers Expect From You

Proposed stable key:
`ucr-02-employer-expectations`

Disposition:
BUILD + REFERENCE

Outcome:
Learner identifies common employer expectations and distinguishes them from job-specific technical requirements.

Core concepts:
- reliability
- communication
- professionalism
- willingness to learn
- following procedures
- teamwork
- honesty
- quality
- safety awareness
- appropriate escalation

Evidence candidate:
Employer Expectations Scenario Analysis

Completion:
- CONTENT
- PRACTICE
- ASSESSMENT
- REFLECTION

### Lesson 3
Title:
Reliability, Attendance & Punctuality

Proposed stable key:
`ucr-03-reliability-attendance-punctuality`

Disposition:
BUILD

Outcome:
Learner explains and applies dependable attendance, punctuality, preparation, and communication behavior.

Core concepts:
- arriving ready
- attendance
- punctuality
- call-off procedures
- communicating delays
- schedule awareness
- transportation contingency planning
- reliability
- impact on coworkers/customers

Evidence candidate:
Personal Reliability Plan

Completion:
- CONTENT
- PRACTICE
- ASSESSMENT
- EVIDENCE
- REFLECTION

Important:
Do not reuse technical-system "reliability" competencies as employee-reliability competencies.

### Lesson 4
Title:
Professional Conduct & Responsibility

Proposed stable key:
`ucr-04-professional-conduct-responsibility`

Disposition:
CONSOLIDATE + BUILD

Outcome:
Learner applies professional conduct and accountability principles to realistic workplace situations.

Core concepts:
- respectful conduct
- accountability
- ownership
- workplace boundaries
- confidentiality
- appropriate device/social behavior
- following instructions
- mistakes and corrective action
- escalation
- accepting feedback

Evidence candidate:
Professional Conduct Scenario Response

Completion:
- CONTENT
- PRACTICE
- ASSESSMENT
- EVIDENCE
- REFLECTION

Reusable conceptual source:
`data-center-specialization-11-safety-professional-practice`

Generalize:
- authority
- scope
- escalation
- stop-before-you-act
- professional judgment

Do not copy Data Center infrastructure hazards into the universal lesson.

### Lesson 5
Title:
Your First 30 Days at Work

Proposed stable key:
`ucr-05-first-30-days`

Disposition:
BUILD + EXTEND

Outcome:
Learner creates a realistic plan for succeeding during the first month in a new workplace.

Core concepts:
- onboarding
- learning expectations
- asking questions
- note-taking
- learning procedures
- feedback
- workplace relationships
- reliability habits
- documenting progress
- planning next steps

Evidence candidate:
First-30-Days Workplace Plan

Completion:
- CONTENT
- PRACTICE
- ASSESSMENT
- EVIDENCE
- REFLECTION

## 7. Competency Decision

Do not create competency definitions until exact functional-equivalent lookup is performed against canonical competency records.

Candidate competency concepts:

- Professional Reliability
- Employer Expectation Awareness
- Professional Responsibility
- Workplace Transition Planning

If no functional equivalent exists, new competency records may be proposed through the existing `competency_definitions` authority.

Any new competency must include:

- stable slug
- title
- description
- domain
- version
- criteria
- evidence requirements
- ACTIVE/DRAFT state as appropriate
- reviewer-required boundary where evidence produces governed decisions

No student Career Readiness Score may be introduced.

## 8. Lesson Content Shape

Use the existing student lesson content conventions already present in the repository.

Each lesson should include, as appropriate:

- id
- slug
- nextSlug
- title
- curriculum
- gradeBand / audience metadata
- estMinutes
- summary
- objectives
- vocab
- sections
- practice
- quiz / assessment-compatible content
- lab or application activity when appropriate
- reflectionPrompt
- careerConnection

Do not make local JSON quiz state the institutional competency authority.

## 9. Assessment Boundary

Knowledge checks:
Formative only.

Practice:
Application/rehearsal.

Institutional assessment:
Use server-backed canonical assessment/result flow when the result contributes to completion or evidence.

Do not infer verified competency from:
- opening a lesson
- completing a local quiz
- clicking Mark Complete
- Arcade score alone
- Metaverse completion alone

## 10. Evidence Plan

Unit 1 target artifacts:

1. Workplace Transition Reflection
2. Employer Expectations Scenario Analysis
3. Personal Reliability Plan
4. Professional Conduct Scenario Response
5. First-30-Days Workplace Plan

Artifacts become evidence candidates only.

Canonical chain:

Activity Result
→ Evidence
→ Authorized Review
→ Competency Decision

Portfolio may project canonical evidence/results; it must not become evidence authority.

## 11. Completion Plan

Use canonical Completion Policy.

Default lesson policy:

- CONTENT
- PRACTICE
- ASSESSMENT
- REFLECTION

Lessons 3, 4, and 5 additionally require:

- EVIDENCE

Do not add:
- ARCADE
- METAVERSE
- LIVE_ATTENDANCE

to the default CORE requirement unless an explicit ProgramPackage/institutional policy later requires it.

## 12. Career Mapping

Career connection should demonstrate transfer across multiple pathways.

Initial examples:
- Data Center
- Healthcare
- Fire / Emergency Services
- Creator / Media
- Freight / Logistics
- Public Works
- Broadband / Fiber
- Aviation
- Software / Cybersecurity

Do not duplicate Career records.

Use canonical career IDs/mappings where they exist.

## 13. Accessibility

CORE must work without optional immersive technology.

Required:
- keyboard access
- screen-reader compatibility
- reduced motion
- no flashing dependency
- captions/transcripts for media
- color-independent meaning
- accommodation for timed interactions
- plain browser alternative for spatial/immersive activity

## 14. Arcade

Do not build Arcade activities in the first implementation pass.

After CORE acceptance, audit for functional equivalents and optionally map:

- Shift Start Challenge
- On-Time or Too Late?
- Workplace Expectations Match
- Professional Choice Scenario
- First-Week Decision Challenge

Arcade remains ENHANCE.

## 15. Metaverse

Do not build Metaverse content in the first implementation pass.

Later optional simulation:

First Day at Work

Potential sequence:
- arrive
- locate supervisor
- review assignment
- respond to a schedule/task change
- ask a clarifying question
- perform a handoff
- document learning

Must use canonical Simulation Runtime and provide a non-spatial equivalent.

Metaverse remains IMMERSE.

## 16. ProgramPackage

Universal Career Readiness should eventually be represented through the existing Workforce Foundation ProgramPackage model.

Do not create a Readiness Package Registry.

Required composition references should point to canonical authorities.

Optional Arcade / Metaverse / Mission dependencies must degrade safely.

## 17. Reporting

Use canonical reporting facts.

Allowed examples:
- participation
- lesson/course completion
- assessment results
- evidence records
- competency decisions
- career connections

Do not report:
- Student Career Readiness Score
- job eligibility
- credential eligibility
- professional qualification
- guaranteed employability

## 18. Files Allowed in First CORE Implementation

The implementation agent may create or modify only files directly necessary for:

- Universal Career Readiness curriculum definition
- Unit 1 lesson content
- canonical curriculum/import registration or mapping
- canonical completion configuration
- canonical competency definitions only if audit proves missing
- tests specific to Unit 1 integration

The agent must not modify unrelated ecosystem systems.

## 19. Stop Conditions

STOP and report instead of implementing if:

- a functional-equivalent course already exists
- a functional-equivalent competency already exists but mapping is unclear
- implementation would require a new evidence authority
- implementation would require a new completion engine
- implementation would require a new portfolio authority
- implementation would require a new Career authority
- implementation would require a new Arcade runtime
- implementation would require a new Metaverse runtime
- implementation would create a readiness score
- canonical authority ownership is ambiguous
- required schema/API contracts contradict this work order

## 20. Required Tests

At minimum verify:

- course/unit/lesson stable keys resolve
- five lessons load in canonical lesson experience
- lesson sequencing works
- assessments submit through canonical path
- completion policy evaluates correctly
- required evidence is enforced where configured
- no evidence requirement is silently satisfied by local state
- career mappings resolve or show bounded unavailable state
- accessibility fallback works
- optional Arcade/Metaverse absence does not break CORE
- no student readiness score appears
- no unsupported job/credential claims are produced

## 21. Definition of Done

Unit 1 is complete only when:

- all five lessons exist
- content duplication audit remains satisfied
- competency mappings are explicit
- completion policies are canonical
- evidence chain is canonical
- portfolio projection is canonical
- career connections use canonical mappings
- reporting uses canonical facts
- accessibility passes
- CORE works without Arcade/Metaverse
- tests pass
- governance/claim boundaries pass
- implementation documentation names all reused authorities
- no duplicate authority was created

## 22. Required Final Agent Report

The implementation agent must return:

1. files created
2. files modified
3. canonical authorities reused
4. competencies reused
5. competencies newly created, with justification
6. completion policies configured
7. evidence paths configured
8. career mappings configured
9. tests executed and results
10. unresolved gaps
11. no-duplicate attestation

Final status must be exactly one of:

READY FOR INTEGRATION QA

READY FOR INTEGRATION QA WITH CONDITIONS

BLOCKED — AUTHORITY OR CONTRACT CONFLICT
