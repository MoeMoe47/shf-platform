# READINESS SYSTEM MASTER REUSE AUDIT

Status: COMPLETE — NO-DUPLICATE BASELINE
Date: 2026-10-06

## Executive Decision

Silicon Heartland Readiness Courses must be implemented as a composition/configuration layer over existing SHU authorities. They must not become a separate application authority, evidence system, competency system, Metaverse engine, mission runtime, completion engine, licensing system, career system, reporting system, workforce program registry, or commercial product registry.

Canonical principle:

> Reference → Configure → Compose → Extend → Build New Only When Proven Missing.

## Canonical Authority Map

| Capability | Canonical authority / path | Decision |
|---|---|---|
| Curriculum structure | `apps/shs-api/src/domain/curriculum-catalog/` | KEEP — CANONICAL |
| Student guided lesson experience | `src/components/curriculum/lesson/GuidedLessonExperience.jsx` | KEEP — CANONICAL |
| Assessment normalization/rendering | `src/utils/normalizeAssessment.js`, existing lesson components | KEEP — CANONICAL |
| Completion requirements | `apps/shs-api/src/domain/completion-policy/` | KEEP — CANONICAL |
| Competencies | existing `competency_definitions` authority | KEEP — CANONICAL |
| Verified evidence | `apps/shs-api/src/domain/verified-evidence/` | KEEP — CANONICAL |
| Portfolio | `apps/shs-api/src/domain/portfolio/` | KEEP — CANONICAL |
| Career records/pathways | `apps/shs-api/src/domain/careers/`, `career-pathways/` | KEEP — CANONICAL |
| Organizations / tenants | existing organization + tenant authority | KEEP — CANONICAL |
| Institutional service entitlements | migration 084 + service entitlement guard | KEEP — CANONICAL |
| Learning Arcade | `apps/shs-api/src/domain/arcade/` and arcade integration | KEEP — CANONICAL |
| Curriculum ↔ Arcade linkage | existing curriculum-resource Arcade linkage | KEEP — CANONICAL |
| Metaverse simulation runtime | `apps/shs-api/src/domain/metaverse/simulations/` | KEEP — CANONICAL |
| City mission projection | `apps/shs-api/src/domain/metaverse/missions/` | KEEP — CANONICAL |
| Mission content/runtime | `apps/shs-api/src/domain/mission-content/`, `mission-runtime/` | KEEP — CANONICAL |
| Metaverse destinations/city registry | existing Metaverse registry | KEEP — CANONICAL |
| MOL system registry | existing MOL authority | KEEP — CANONICAL |
| Spatial projection/coordinates | Spatial Intelligence GEO-1 authority | KEEP — CANONICAL |
| Quick Map | existing Quick Map; future Spatial Engine client | KEEP / PRESERVE |
| MOCC / city orchestration | existing Metaverse operations + orchestration | KEEP — CANONICAL |
| Workforce program composition | `apps/shs-api/src/domain/workforce-foundation/` | KEEP — CANONICAL |
| Fundability gate | `readiness-and-fundability.ts` | KEEP — CANONICAL |
| Commercial product representation | `commercial-product-registry` | KEEP — CANONICAL |
| Reporting / institutional truth | existing reporting + Truth Spine | KEEP — CANONICAL |
| Credentials | existing credentials authority | KEEP — CANONICAL |
| Accessibility platform support | existing accessibility authority + simulation alternatives | KEEP — CANONICAL |

## Readiness Course Architecture

A Readiness Course is not a new software engine.

It is a governed composition of:

- ProgramPackage
- Curriculum course/release
- Career references
- Competency references
- Completion policy
- Evidence requirements
- Optional Arcade experiences
- Optional Missions
- Optional Metaverse simulations
- Accessibility requirements
- Partner references
- Credential-authority references
- Funding references
- Reporting requirements
- Governance references

### Required product behavior

CORE = browser-based curriculum and assessments.

ENHANCE = optional Learning Arcade.

IMMERSE = optional Metaverse / mission / simulation experiences.

A learner must be able to complete a curriculum-only package when Arcade and Metaverse are not contractually required. Optional platform dependencies must degrade gracefully rather than creating false completion blockers.

## Workforce Foundation Decision

`apps/shs-api/src/domain/workforce-foundation/` is the canonical program integration layer.

It already supports:

- curriculum references
- Arcade references
- mission references
- Metaverse/MOL references
- destinations
- careers
- competencies
- platform capabilities
- evidence requirements
- authority declarations
- external credential authorities
- funding relationships
- accessibility requirements
- partner relationships
- reporting requirements
- dependencies
- lifecycle/readiness gates
- capability maturity
- execution levels
- fundability BUILD/HOLD/REJECT

Therefore do not create a separate Readiness Program Registry or Readiness Funding Engine.

## Funding & Credibility Charter Decision

The originally proposed `Course Funding & Credibility Charter` should remain a human-readable planning/review artifact, but it must PROJECT FROM or REFERENCE canonical authorities instead of creating duplicate truth.

Its sections should map to existing authorities:

- workforce need → Workforce Foundation / evidence-backed external research
- program identity → ProgramPackage
- curriculum → Curriculum Catalog
- careers → Career authority
- competencies → Competency authority
- evidence → Verified Evidence
- external credential authority → ProgramPackage credentialAuthorityRefs
- accessibility → ProgramPackage accessibilityRequirements
- partners → ProgramPackage partnerRefs
- funding → fundingRefs + Funding registry
- reporting → reportingRequirements
- delivery maturity → capabilityRefs + MOL
- commercial packaging → Commercial Product Registry
- employer review → existing Career Pathway Acceptance / employer-validation process

New charter data should only be introduced when no canonical field exists.

## Course Credibility Score Decision

Do not create a second numeric authority that competes with:
- Workforce Foundation integration readiness
- BUILD/HOLD/REJECT fundability
- Career Pathway Acceptance status
- Commercial Product readiness/sellability
- existing verified evidence

Use a **Course Credibility Scorecard** as a derived review view, not as a source of truth. If a numeric presentation is retained, it must be clearly derived from canonical domain statuses and must never become learner/job-readiness truth.

## Universal Career Readiness Content Decision

Build Universal Career Readiness as the owner of transferable workplace competencies, while reusing/generalizing existing content.

### Consolidate / reuse
- professional communication
- technical communication foundations
- teamwork/collaboration
- career exploration/planning
- evidence literacy
- portfolio literacy
- accessibility/accommodation awareness
- ethics foundations
- career/postsecondary transition

### Build missing universal content
- attendance
- punctuality
- workplace conduct
- employer expectations
- time management
- conflict resolution
- customer/service mindset
- workplace rights
- workplace responsibilities
- general workplace safety culture
- general problem solving
- digital literacy
- AI workplace literacy
- resume/interview learner instruction

### Keep industry-specific
- electrical safety
- HVAC/mechanical safety
- cybersecurity safety
- fireground safety
- clinical safety
- occupation-specific procedures
- regulated/credential-specific requirements

## Data Center Decision

Do not build a second Data Center Readiness curriculum.

Existing Data Center content already covers grades 6–12, including:
- foundations
- infrastructure systems
- design
- technical foundations
- reliable operations
- networking/fiber
- electrical
- mechanical/HVAC
- cybersecurity
- AI/cloud
- technical communication
- evidence
- career transition
- advanced operations

Data Center Readiness should be a curated ProgramPackage/pathway composition using existing curriculum plus Universal Career Readiness and validated competency/career mappings.

The existing Data Center Workforce ProgramPackage is the reference implementation for other workforce programs.

Current honest Data Center gaps include:
- employer validation not yet reviewed/confirmed
- no canonical funding source records
- no external credential authority
- no client Mission player
- planned/unavailable Data Center MOL environment
- regional labor-market evidence not yet recorded canonically

## Mission vs Simulation Decision

Use **Simulation Runtime** for bounded occupational exercises with:
- explicit objective
- task steps
- retry policy
- completion rules
- assessment boundary
- evidence outputs
- accessible non-spatial equivalent

Use **Mission Runtime** for broader scenario/world experiences involving:
- mission definitions
- roles
- world capabilities
- adaptive conditions
- multiplayer/team contexts
- cross-system scenarios
- city/world orchestration

Use **City Mission projection** when projecting a real canonical assignment into Metaverse experience space.

Do not treat Mission or Simulation completion as verified skill, credential, job readiness, or career eligibility by itself.

## Spatial / Quick Map Decision

Spatial Intelligence owns projection behavior, coordinate metadata, selection, viewport/camera state, map interactions, path presentation, and temporal projection.

Domain systems continue to own canonical records, workflow, approvals, missions, incidents, events, evidence, permissions, and publication eligibility.

Quick Map is a client, not an authority.

Do not create:
- a second coordinate system
- a second Quick Map
- a second Digital Twin
- invented coordinate transforms
- invented geometry
- a Readiness-specific map authority

Important existing condition: Quick Map and master-city currently use different normalized coordinate spaces; no transform may be assumed without an explicit governed transform.

## Commercial Packaging Decision

Use existing Service Catalog/Entitlements + Commercial Product Registry.

Supported packaging can include:
- Curriculum Only
- Curriculum + Arcade
- Curriculum + Metaverse
- Curriculum + Arcade + Metaverse
- Full Institutional Platform
- pathway-specific packages
- implementation services
- managed services
- professional services
- content licenses

Upgrades must preserve identity, rosters, evidence, progress, and canonical learner records.

## Explicit No-Duplicate Prohibitions

Future Readiness agents may not create:
- second curriculum catalog
- second lesson engine
- second assessment engine
- second completion engine
- second competency registry
- second evidence store
- second portfolio authority
- second career registry
- second organization/tenant model
- second entitlement/licensing authority
- second Arcade runtime/mastery authority
- second Metaverse simulation engine
- second mission runtime
- second city/destination registry
- second MOL registry
- second Quick Map
- second Digital Twin
- second coordinate authority
- second MOCC
- second workforce-program registry
- second fundability engine
- second reporting truth model
- second commercial product registry

## Build Order After Audit

1. Freeze this no-duplicate baseline.
2. Create/confirm canonical Readiness Course composition contract.
3. Build Universal Career Readiness content only where genuinely missing.
4. Extend career/competency mappings.
5. Extend canonical evidence UI.
6. Add direct Arcade activity launch where missing.
7. Add optional Metaverse simulation/mission references.
8. Extend Service Catalog entitlements for modular packages.
9. Produce Funding & Credibility Charter as a projection/review artifact.
10. Use Data Center as the first reference implementation.
11. Validate with Integration/QA before parallel course agents begin.

## Final Audit Status

READY TO DESIGN THE SHARED READINESS COURSE COMPOSITION TEMPLATE.

No new shared subsystem should be built unless this audit or a future targeted audit classifies the capability as MISSING.
