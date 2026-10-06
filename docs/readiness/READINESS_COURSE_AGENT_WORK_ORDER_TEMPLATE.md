# READINESS COURSE AGENT WORK ORDER TEMPLATE

Status: CANONICAL AGENT EXECUTION CONTRACT
Version: 1.0
Date: 2026-10-06

## Mandatory First Step

Before changing code, read:

1. `docs/readiness/READINESS_SYSTEM_MASTER_REUSE_AUDIT.md`
2. `docs/readiness/READINESS_CANONICAL_COMPONENT_REGISTRY.md`
3. `docs/readiness/READINESS_COURSE_COMPOSITION_TEMPLATE.md`

These documents are authoritative for this work.

## Governing Rule

> Reference → Configure → Compose → Extend → Build New Only When Proven Missing.

Do not create a new shared authority, registry, runtime, schema, service, evidence store, completion engine, career system, Metaverse engine, map authority, workforce-program registry, fundability engine, or commercial registry if a canonical implementation already exists.

## Assignment

Course / pathway:
`<COURSE_NAME>`

Program:
`<PROGRAM_NAME>`

Target learners:
`<AUDIENCE>`

Course stable key:
`<COURSE_STABLE_KEY>`

ProgramPackage:
`<PROGRAM_PACKAGE_ID>`

## Required Work Sequence

### Step 1 — Reuse Verification

Identify existing canonical assets for:

- curriculum
- competencies
- completion
- assessment
- evidence
- portfolio
- careers
- Arcade
- Missions
- Metaverse
- accessibility
- organizations
- entitlements
- reporting
- credentials
- Workforce Foundation
- commercial product representation

Classify each as:

- KEEP — CANONICAL
- REUSE
- EXTEND
- CONSOLIDATE
- REFACTOR
- REPLACE
- LEGACY / REFERENCE ONLY
- MISSING

Do not code until the classifications are documented.

### Step 2 — Content Duplication Audit

Search for functional equivalents of every proposed lesson/topic.

Do not rely only on exact names.

Prefer consolidation and reuse of existing transferable content.

### Step 3 — Compose CORE First

Build/configure the browser-based curriculum so the course works without optional technology.

Required lesson flow should use the canonical lesson experience.

### Step 4 — Competency Mapping

Map lessons and assessments to canonical competencies.

Create a new competency only when no functional equivalent exists.

### Step 5 — Completion Configuration

Use Completion Policy.

Never add an independent course-completion mechanism.

### Step 6 — Evidence Mapping

Define evidence candidates and verification path.

Never mark a learner as verified/mastered directly from course UI or simulation state.

### Step 7 — Career Mapping

Use canonical career/pathway relationships.

Do not create duplicate career data.

### Step 8 — ENHANCE Layer

Map optional Learning Arcade experiences.

Declare:
- required/recommended
- activity IDs
- mastery rules
- fallback behavior

### Step 9 — IMMERSE Layer

Map optional Simulation / Mission experiences.

Use:
- Simulation Runtime for bounded occupational exercises
- Mission Runtime for broad scenario/world/team experiences

Reference canonical Metaverse destinations and MOL systems.

### Step 10 — Accessibility

Verify accessible equivalents, especially for every spatial or timed experience.

### Step 11 — ProgramPackage

Create or extend the ProgramPackage using references only.

Do not embed authority-owned payloads.

### Step 12 — Validation / Fundability

Run canonical:
- integration readiness
- capability maturity
- dependency checks
- lifecycle evaluation
- fundability gate

Do not overstate maturity.

### Step 13 — Tests

Add/update only tests required to prove the course integrates with shared authorities.

Do not weaken existing guards.

## Required Deliverables

The agent must produce:

1. implementation summary
2. files changed
3. reuse matrix
4. new-content list
5. canonical references used
6. competency mapping
7. evidence mapping
8. Arcade mapping
9. Mission/Simulation mapping
10. accessibility status
11. dependency/fallback matrix
12. ProgramPackage status
13. fundability status
14. lifecycle status
15. tests run/results
16. known gaps
17. no-duplicate attestation

## No-Duplicate Attestation

The final report must explicitly state:

> I did not create a competing shared authority for Curriculum, Completion, Competency, Evidence, Portfolio, Career, Arcade, Metaverse, Mission Runtime, Spatial Intelligence, Workforce Foundation, Fundability, Reporting/Truth, Service Entitlements, Credentials, or Commercial Product Registry.

If that statement cannot be made truthfully, the work is not complete.

## Stop / Escalate Conditions

Stop implementation and report the conflict if:

- a required capability appears missing but may belong in a shared authority;
- a schema migration would duplicate existing data;
- the course requires changes to shared evidence/completion/career/Metaverse authority;
- a new registry/runtime/engine is proposed;
- a regulatory or credential claim lacks external authority;
- a funding or employer-validation claim is unsupported;
- optional technology would become a mandatory learner blocker without explicit ProgramPackage authority.

## Final Status

Use exactly one:

- READY FOR INTEGRATION
- READY FOR INTEGRATION WITH CONDITIONS
- BLOCKED — SHARED AUTHORITY DECISION REQUIRED
