# READINESS CANONICAL COMPONENT REGISTRY

Status: LOCKED NO-DUPLICATE CONTRACT
Date: 2026-10-06

## Governing Rule

> Readiness Courses compose canonical SHU systems. They do not create competing authorities.

All future course agents must follow:
Reference → Configure → Compose → Extend → Build New Only When Proven Missing.

## Canonical Registry

| Need | Canonical system | Agent permission |
|---|---|---|
| Course / Unit / Lesson | Curriculum Catalog | CONFIGURE / ADD CONTENT |
| Guided lesson UI | GuidedLessonExperience | REUSE / EXTEND SHARED ONLY |
| Assessment | existing assessment contract/renderers | CONFIGURE |
| Practice | existing result domains | CONFIGURE |
| Reflection | existing result domains | CONFIGURE |
| Completion | Completion Policy Engine | CONFIGURE POLICY ONLY |
| Competencies | Competency authority | REFERENCE / ADD CANONICAL DEFINITIONS |
| Evidence | Verified Evidence | PRODUCE CANDIDATES / NEVER REBUILD |
| Portfolio | Portfolio authority | PROJECT ONLY |
| Career | Careers / Career Pathways | REFERENCE / MAP |
| Organizations | Organization authority | NEVER REBUILD |
| Tenant context | Tenant authority | NEVER REBUILD |
| Entitlements | Service Catalog / Entitlements | EXTEND CATALOG |
| Arcade | Arcade authority | ADD ACTIVITIES / NEVER REBUILD RUNTIME |
| Arcade mastery | server-side Arcade mastery | NEVER DUPLICATE |
| Metaverse destinations | canonical destination registry | REFERENCE ONLY |
| MOL systems | MOL System Registry | REFERENCE ONLY |
| Metaverse simulation | simulation runtime | ADD DEFINITIONS / NEVER REBUILD |
| Missions | mission content/runtime | ADD PUBLISHED MISSIONS / NEVER REBUILD |
| City mission projection | Metaverse missions | REUSE |
| Spatial projection | Spatial Intelligence | CONSUME |
| Quick Map | existing Quick Map | PRESERVE / CONSUME |
| MOCC | Metaverse operations/orchestration | REQUEST / OBSERVE |
| Accessibility | existing accessibility + simulation alternatives | REUSE / DECLARE REQUIREMENTS |
| Workforce program | Workforce Foundation ProgramPackage | CONFIGURE |
| Fundability | Workforce Foundation fundability gate | REUSE |
| Program readiness | Workforce Foundation readiness/lifecycle | REUSE |
| Reporting | Reporting + Truth Spine | REFERENCE / PROJECT |
| Commercial product | Commercial Product Registry | REGISTER PRODUCT |
| Buyer access | Service Entitlements | CONFIGURE |
| Credentials | Credentials authority | REFERENCE / BRIDGE |
| Employer validation | Career pathway acceptance / validation process | REUSE / COMPLETE REAL REVIEW |

## Required Readiness Course Agent Rules

1. Read this registry before changing code.
2. CORE curriculum must work without Arcade or Metaverse unless a valid program configuration explicitly requires them.
3. Optional Arcade and Metaverse capabilities must have safe fallback/degradation behavior.
4. Every course-specific capability must reference canonical competencies and careers where applicable.
5. Do not store verified evidence in course JSON.
6. Do not store runtime Metaverse/world state in course JSON.
7. Do not embed learner accommodation or identity data in ProgramPackage.
8. Do not claim credential, licensure, employment eligibility, or job readiness from course/simulation completion.
9. Do not create new shared components unless the registry classifies the capability as missing.
10. Any necessary shared-platform change must be isolated and reviewed before individual course agents consume it.

## CORE / ENHANCE / IMMERSE

### CORE
Browser curriculum:
- lesson
- vocabulary
- check
- practice
- assessment
- reflection
- evidence requirement
- career connection
- completion

### ENHANCE
Optional:
- Learning Arcade activities
- challenges
- skill practice

### IMMERSE
Optional:
- Metaverse simulations
- Missions
- multi-program scenarios

All three must map back to shared canonical competencies/evidence rules.

## Simulation Selection Rule

Use Simulation Runtime for bounded task-based learning exercises.

Use Mission Runtime for broad scenario/world/team experiences.

Use City Mission projection to represent a real assignment inside Metaverse space.

## Spatial Rule

Never author canonical geography inside readiness course content.

Reference destination IDs and canonical systems. Spatial presentation remains owned by Spatial Intelligence / Metaverse registries.

## Funding Rule

Do not invent funding eligibility.

Use:
- funding source registry
- funding relationships
- Workforce Foundation fundability
- documented external research
- verified awards/assurance records where available

## Commercial Rule

SHF operates/proves charitable programming.
SHS represents and sells modular products through the Commercial Product Registry and Service Entitlements, subject to legal/IP/fair-value/conflict controls.

## Agent Stop Conditions

STOP and escalate to Integration/QA when:
- a needed capability appears to require a second authority;
- an existing canonical system appears insufficient;
- a schema migration would duplicate existing data;
- the agent needs to modify shared completion/evidence/career/Metaverse authority;
- a new coordinate/map/runtime/registry is proposed;
- a regulatory/credential claim lacks an external authority;
- a readiness/funding claim is unsupported.
