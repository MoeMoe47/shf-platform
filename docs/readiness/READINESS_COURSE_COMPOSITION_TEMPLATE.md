# READINESS COURSE COMPOSITION TEMPLATE

Status: CANONICAL SHARED BUILD CONTRACT
Version: 1.0
Date: 2026-10-06

## 1. Purpose

This template defines how every Silicon Heartland Readiness course or workforce pathway must be composed.

It does not create new shared authorities.

All implementations must comply with:

- `docs/readiness/READINESS_SYSTEM_MASTER_REUSE_AUDIT.md`
- `docs/readiness/READINESS_CANONICAL_COMPONENT_REGISTRY.md`

Canonical rule:

> Reference → Configure → Compose → Extend → Build New Only When Proven Missing.

## 2. Readiness Product Model

Every Readiness offering is composed from the same SHU platform:

### CORE
Required browser-based curriculum experience.

May include:
- Orient
- Check-In
- Learn
- Vocabulary-in-Context
- Check Understanding
- Practice
- Apply
- Assess
- Reflect
- Evidence
- Career Connection
- Completion Check
- Next

### ENHANCE
Optional Learning Arcade experiences.

### IMMERSE
Optional Metaverse simulations, Missions, and living-world experiences.

CORE must remain independently usable unless a ProgramPackage explicitly makes another capability required.

## 3. Course Identity

For each course define:

- Course name
- Course stable key
- Program / pathway
- Audience
- Grade / learner band
- Geography
- Owning organization
- ProgramPackage ID
- Course lifecycle
- Delivery modes
- Estimated instructional time
- Prerequisites
- External authority boundaries
- Credential boundaries
- Claims allowed
- Claims prohibited

## 4. ProgramPackage Binding

The course must reference the existing Workforce Foundation ProgramPackage contract.

Declare only references to canonical authorities:

- curriculumRefs
- arcadeExperienceRefs
- missionRefs
- metaverseRefs
- destinationRefs
- careerRefs
- competencyRefs
- capabilityRefs
- evidenceRequirements
- authorityRefs
- credentialAuthorityRefs
- fundingRefs
- accessibilityRequirements
- partnerRefs
- reportingRequirements
- dependencyRefs
- integrationReadiness
- sensoryRefs
- governanceRefs

Do not embed authority-owned payloads.

## 5. Curriculum Structure

Use the canonical hierarchy:

Organization Program
→ Student Learning Path
→ Course
→ Unit
→ Lesson
→ Activity / Learning Arcade
→ Assessment
→ Evidence
→ Outcome
→ Portfolio / Skill Profile
→ Progress
→ Career Connection
→ Verified Reporting

Each course should define:

### Course
- title
- summary
- target audience
- learning outcomes
- career context
- delivery expectations

### Unit
- title
- purpose
- competencies
- evidence expectations
- career relationships

### Lesson
Follow the canonical Lesson Experience Blueprint:

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

Optional stages may be unavailable when not entitled or not applicable, but the underlying canonical sequence must not be replaced with a course-specific engine.

## 6. Competency Contract

Every course competency must:

- reference an existing canonical competency when one exists;
- add a new canonical competency only when no functional equivalent exists;
- avoid duplicate competency names or authorities;
- identify expected demonstration;
- identify acceptable evidence sources;
- distinguish transferable vs industry-specific vs career-specific competency.

### Competency hierarchy

Universal
→ Industry
→ Career-specific

Universal competencies should not be recreated inside individual industry courses.

## 7. Evidence Contract

Course content may produce evidence candidates.

Course content must not independently declare verified mastery.

Allowed evidence pathways may include:

- assessment result
- individual demonstration
- Arcade result
- simulation evidence candidate
- project artifact
- Studio delivery
- reflection
- instructor verification
- supervisor verification
- external credential verification

Canonical Evidence authority determines verification.

## 8. Completion Contract

Use the canonical Completion Policy Engine.

Supported requirement concepts include:

- CONTENT
- ARCADE
- PROJECT
- STUDIO_PROJECT
- LIVE_ATTENDANCE
- INSTRUCTOR_VERIFICATION
- EVIDENCE
- ASSESSMENT
- REFLECTION
- PRACTICE

Do not create a course-specific completion engine.

Optional technology must not silently become a completion requirement.

## 9. Learning Arcade Mapping

For every Arcade experience define:

- canonical Arcade activity / experience ID
- lesson relationship
- competency relationship
- required vs recommended
- practice vs assessment boundary
- mastery model
- fallback when Arcade is unavailable

Arcade mastery is not automatically verified competency mastery.

## 10. Metaverse Simulation Mapping

Use Simulation Runtime for bounded occupational exercises.

Every simulation should define:

- simulation/activity ID
- source authority
- district
- facility
- objective
- task steps
- prerequisites
- retry policy
- completion condition
- assessment boundary
- evidence outputs
- team mode
- accessible non-spatial alternative
- career connection
- ProgramPackage relationship
- fallback when unavailable

Simulation completion alone must not establish:

- verified skill
- credential attainment
- course completion unless routed through Completion Policy
- career eligibility
- job readiness
- civic authority

## 11. Mission Mapping

Use Mission Runtime for larger scenario/world/team experiences.

Define:

- mission ID
- exact version
- roles
- world capabilities
- program relationship
- competency relationships
- career relationships
- evidence candidate pathways
- dependency requirements
- accessibility/fallback behavior

Do not create a second mission runtime.

## 12. Spatial / Destination Mapping

Reference canonical destination IDs.

Do not embed or invent:

- coordinates
- geometry
- map transforms
- destination identity
- traffic state
- emergency state
- publication authority
- world state

Spatial Intelligence and Metaverse authorities retain ownership.

## 13. Career Mapping

Each course must identify:

- career pathway IDs
- career IDs
- career-stage relationship
- required/recommended curriculum relationships
- employer relevance
- external training/credential next steps
- career boundaries

Do not create a second career database or resume/portfolio authority.

## 14. Accessibility Requirements

At minimum evaluate:

- keyboard operation
- reduced motion
- reduced sensory
- no-audio alternative
- captions
- screen-reader support
- no flashing
- visual alerts
- mobile/tablet suitability where applicable
- non-spatial alternative for spatial tasks
- timed-interaction accommodation

Declare requirements through canonical accessibility contracts.

## 15. Delivery Modes

Every course must state support for:

- Classroom
- Hybrid
- Independent

Default CORE expectation:
- Chromebook/browser viable
- limited-bandwidth aware
- no VR requirement

Metaverse:
- desktop/laptop first
- tablet where supported
- VR optional

## 16. Partner / Practitioner Validation

Record:

- practitioner reviewers
- employer reviewers
- advisory participants
- workforce partners
- training partners
- credential authorities
- apprenticeship/union partners where applicable

A declared partner is not a confirmed partner.

Do not mark employer validation complete until real employer review is documented through the canonical validation process.

## 17. Funding Alignment

Use Workforce Foundation funding relationships.

Potential lanes may include:

- grants
- workforce funding
- employer contributions
- apprenticeship
- philanthropy
- sponsorship
- institutional purchase
- commercial SHS revenue

Funding alignment does not establish eligibility or guarantee funding.

Every major program should pass the canonical Fundability Gate.

## 18. Reporting Requirements

Define which canonical metrics are required, such as:

- enrollment
- participation
- completion
- demonstration
- evidence
- career connection
- credential progression
- employment outcome

Operational metrics are not automatically verified institutional truth.

Truth Spine remains the verification boundary.

## 19. SHF / SHS Product Boundary

SHF:
- charitable programming
- pilots
- community delivery
- model validation
- impact evidence

SHS:
- licenses
- implementation services
- managed services
- institutional packages
- commercial support

Use canonical Service Entitlements and Commercial Product Registry.

Do not create separate course-specific licensing authority.

## 20. Course Credibility Review

Credibility review may present these dimensions:

1. Workforce Need
2. Recognized Pathway
3. Employer Validation
4. Practitioner Review
5. Standards / Credential Alignment
6. Learning Outcomes
7. Assessment Quality
8. Evidence / Portfolio
9. Funding Alignment
10. Next-Step Partner

This is a derived review view.

It must not become a competing source of truth for:
- Program lifecycle
- Fundability
- learner readiness
- job readiness
- credential eligibility
- verified competency

## 21. Required Fallback Matrix

Every optional dependency must declare:

| Capability | Required? | Minimum maturity | Normal provider | Fallback | If unavailable |
|---|---:|---|---|---|---|
| Arcade |  |  |  |  |  |
| Metaverse |  |  |  |  |  |
| Mission |  |  |  |  |  |
| Multiplayer |  |  |  |  |  |
| Employer connection |  |  |  |  |  |
| Credential bridge |  |  |  |  |  |

Required unavailable dependencies BLOCK.
Optional unavailable dependencies DEGRADE.

## 22. Definition of Done

A course is not production-ready until:

- canonical authorities identified;
- duplicate-authority audit passed;
- curriculum imported/validated;
- competencies mapped;
- completion policy configured;
- assessments validated;
- evidence pathway defined;
- accessibility requirements satisfied;
- career mappings resolved;
- optional Arcade references resolved or safely degraded;
- optional Metaverse references resolved or safely degraded;
- required Mission versions published;
- dependencies classified;
- partner validation state honest;
- external credential boundaries explicit;
- reporting requirements defined;
- fundability assessment completed;
- ProgramPackage validates;
- requested lifecycle does not exceed evaluated lifecycle;
- QA tests pass;
- no unsupported claims remain.

## 23. Agent Stop Rule

An implementation agent must stop and escalate to Integration/QA if it believes it needs:

- a new shared authority;
- a new registry duplicating an existing registry;
- a new evidence store;
- a new completion engine;
- a new career authority;
- a new map/coordinate authority;
- a new Arcade runtime;
- a new Metaverse runtime;
- a new Mission runtime;
- a new workforce-program registry;
- a new fundability engine;
- a new reporting truth model.

No course-specific workaround may bypass this rule.
