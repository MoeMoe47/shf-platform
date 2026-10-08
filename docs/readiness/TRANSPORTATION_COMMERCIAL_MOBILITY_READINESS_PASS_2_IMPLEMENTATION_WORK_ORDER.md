# Transportation & Commercial Mobility Readiness — Pass 2 Implementation Work Order

Status: DRAFT — PARALLEL PASS 2
Branch: `agent/pass2-readiness-transportation`
Baseline: `af2faa2`
Stable key: `shu-transportation-commercial-mobility-readiness`

## 1. Purpose

Define the controlled implementation sequence for Transportation & Commercial Mobility Readiness after Pass 2 planning review.

This is Artifact 4 of 4.

This document is a work order.

It does not authorize implementation by itself.

## 2. Current Planning State

The Pass 2 Transportation package contains:

1. Source Curriculum Plan
2. Lesson Reuse Map
3. Proof Activity Plan
4. Implementation Work Order

Implementation remains blocked until the full four-artifact package is reviewed.

## 3. Course Shape

Target course:

15 units

75 lessons

Stable key:

`shu-transportation-commercial-mobility-readiness`

## 4. Lesson Reuse Distribution

Approved planning distribution:

- REUSE: 9
- CONTEXTUALIZE: 20
- EXTEND: 13
- MISSING: 33
- TOTAL: 75

These counts are planning decisions.

They do not authorize automatic source generation.

## 5. Primary Proof Set

Initial primary proof candidates:

1. Dispatch Disruption Scenario
2. Transit Accessibility Scenario
3. Transportation Incident Handoff

## 6. Supporting Proof Activity

Synthetic Vehicle Inspection Review remains:

SUPPORTING ACTIVITY / EVIDENCE CANDIDATE

It is not one of the initial three primary proofs.

## 7. Governing Reuse Hierarchy

Implementation must follow:

REFERENCE
→ CONFIGURE
→ COMPOSE
→ EXTEND
→ BUILD NEW ONLY WHEN PROVEN MISSING

## 8. Canonical Authority Principle

Transportation must not create duplicate authority for:

- curriculum platform behavior
- competency definitions
- Prepare / Prove
- evidence
- reviewer authority
- competency decisions
- assignments
- completion
- Career
- Portfolio
- accessibility
- accommodations
- organization context
- tenant isolation
- entitlement
- reporting
- Truth Spine
- Metaverse evidence
- Arcade evidence

## 9. Readiness-Only Principle

Transportation & Commercial Mobility Readiness remains readiness education.

The course does not independently confer:

- CDL permit status
- CDL licensure
- CDL road-test qualification
- DOT medical qualification
- commercial-driving authorization
- transit-operator qualification
- rail-operator qualification
- rail-dispatch authority
- pilot certification
- aircraft-maintenance certification
- FAA authorization
- UAS authorization
- fleet-maintenance qualification
- employer qualification

## 10. Transportation / Logistics Boundary

Transportation owns readiness context around:

- movement
- vehicles
- fleets
- dispatch
- routes
- passenger mobility
- transit
- rail
- aviation
- roadway systems
- transportation incidents

Logistics & Supply Chain Readiness retains primary ownership of:

- warehouse operations
- inventory
- port logistics
- freight documentation
- shipment-process authority
- broader supply-chain process
- logistics-process authority

## 11. Freight Boundary

Transportation may teach freight movement.

Transportation must not absorb logistics-process authority.

## 12. Source Construction Principle

Do not create all 75 lessons from scratch.

Implementation must first apply the Lesson Reuse Map.

## 13. REUSE Handling

For the 9 REUSE lessons:

- identify the exact canonical source
- confirm functional equivalence
- avoid duplicate source where composition/reference is sufficient
- preserve canonical authority
- record the reuse decision

## 14. CONTEXTUALIZE Handling

For the 20 CONTEXTUALIZE lessons:

- start from canonical transferable source
- add Transportation-specific examples
- preserve underlying competency authority
- do not fork universal concepts unnecessarily
- keep regulated-domain boundaries explicit

## 15. EXTEND Handling

For the 13 EXTEND lessons:

- identify the existing source/context being extended
- define what is genuinely new
- preserve the canonical authority beneath it
- prevent duplicate engines or competency authority

## 16. MISSING Handling

For the 33 MISSING lessons:

- create source only after confirming no equivalent exists
- create instructional source, not new institutional authority
- do not infer that a missing lesson requires a new competency
- do not infer that a missing lesson requires a migration

## 17. Canonical Source Location

Transportation source lessons should use the existing curriculum source structure under:

`src/content/lessons/`

Do not create a competing Transportation content engine.

## 18. Lesson Schema Rule

Use the existing canonical lesson schema.

Do not create a Transportation-specific lesson schema unless a later architecture review proves the canonical schema cannot represent the required content.

## 19. Importer Rule

Use the existing curriculum importer/service pattern.

Do not create a Transportation-specific importer.

## 20. Import Preview Requirement

Before any execute action, preview must:

- parse the package
- validate lesson shape
- validate stable key
- validate unit ordering
- validate lesson ordering
- validate lesson count
- detect duplicates
- detect invalid source references
- avoid unintended catalog writes

## 21. Lesson Count Validation

Importer preview must confirm:

15 units

75 lessons

## 22. Unit Ordering

Expected unit order:

1. Understanding Transportation & Mobility
2. Professionalism in Transportation Work
3. Safety, Scope and Authorization
4. Commercial Driving Readiness
5. Vehicle Inspection Awareness
6. Fleet Operations
7. Dispatch and Route Planning
8. Transit and Passenger Mobility
9. Rail Systems Awareness
10. Aviation and Airport Operations Awareness
11. Aircraft Maintenance and UAS Career Awareness
12. Traffic and Roadway Operations
13. Transportation Incident Coordination
14. Transportation Careers and Pathways
15. Evidence, Portfolio and Transition

## 23. Initial Publication State

Initial imported Transportation curriculum must remain:

DRAFT

No automatic production publication is authorized.

## 24. Deterministic Import Requirement

Re-importing the same approved source package should behave deterministically.

## 25. Duplicate Handling

Importer validation must detect duplicate:

- course stable key
- unit key
- lesson key
- lesson slug
- source identity

before execute.

## 26. No Unintended Catalog Writes

Preview must not write course/catalog records unintentionally.

## 27. Governed Execute

Any execute step must be explicit and governed.

## 28. No Migration Default

No database migration is authorized by this planning package.

## 29. Migration Stop Condition

If implementation appears to require a migration:

STOP

Document:

- why the existing schema is insufficient
- what authority owns the data
- why composition/configuration cannot solve it
- migration risk
- rollback plan
- affected tests

Then obtain separate approval.

## 30. No New Registry Default

Do not create:

- Transportation competency registry
- CDL registry
- Transit registry
- Rail registry
- Aviation registry
- UAS registry
- Logistics registry

## 31. Competency Rule

A lesson may be new while its competency remains existing.

Do not fabricate competency IDs.

## 32. Prepare / Prove Rule

Canonical Prepare / Prove remains authoritative.

No Transportation-specific proof engine is permitted.

## 33. Proof Binding Gate

Before implementing any primary proof:

- inspect `competency_definitions`
- inspect canonical Prepare / Prove configuration
- inspect relevant existing proof activities
- establish functional equivalence
- identify exact reviewer authority
- document evidence shape
- document reassessment behavior

## 34. No Fabricated Competency Slugs

Transportation implementation must not invent competency slugs to make proof wiring convenient.

## 35. Primary Proof 1

Dispatch Disruption Scenario

Source-plan lesson:

`7.5 Dispatch Disruption Scenario`

Reuse-map status:

EXTEND

## 36. Dispatch Proof Purpose

Evaluate readiness around:

- route reasoning
- schedule reasoning
- disruption analysis
- passenger/customer impact
- communication
- contingency planning
- escalation
- handoff
- uncertainty

## 37. Dispatch Proof Data

Use only synthetic:

- routes
- schedules
- drivers
- vehicle identifiers
- traffic events
- weather conditions
- dispatch messages
- passenger requirements

## 38. Dispatch Proof Authority Boundary

The learner must not:

- direct a real driver
- issue live dispatch commands
- change real transportation schedules
- access real regulated dispatch systems
- approve commercial-driving eligibility
- direct emergency response

## 39. Dispatch Competency Strategy

Audit canonical transferable authority first for:

- problem solving
- decision making
- communication
- handoff
- contingency planning
- evidence

Do not create a dispatch competency by default.

## 40. Primary Proof 2

Transit Accessibility Scenario

Source-plan lesson:

`8.5 Transit Accessibility Scenario`

Reuse-map status:

EXTEND

## 41. Transit Accessibility Purpose

Evaluate readiness around:

- passenger mobility
- accessibility
- barrier identification
- respectful communication
- available options
- service constraints
- escalation

## 42. Accessibility Authority

Canonical accessibility/accommodation authority remains controlling.

Transportation provides context only.

## 43. Passenger Privacy

Do not require real passenger medical or disability records.

Use fictional or synthetic passenger scenarios.

## 44. Transit Accessibility Prohibited Actions

Learners must not:

- diagnose disability
- decide legal accommodation eligibility
- override accommodation processes
- promise unsupported service
- access private medical records
- issue transit operating commands

## 45. Transit Accessibility Competency Strategy

Reuse canonical:

- accessibility
- communication
- problem solving
- evidence

where functionally equivalent.

Do not create a Transportation accessibility competency.

## 46. Primary Proof 3

Transportation Incident Handoff

Source-plan lesson:

`13.5 Transportation Incident Handoff`

Reuse-map status:

EXTEND

## 47. Incident Proof Purpose

Evaluate readiness around:

- facts
- assumptions
- incident documentation
- service impact
- passenger impact
- evidence sources
- handoff
- escalation
- scope

## 48. Incident Scenario Data

Use synthetic:

- vehicle status
- route status
- timestamps
- passenger impact
- dispatch messages
- witness notes
- incident notes
- supplied evidence

## 49. Incident Prohibited Actions

Learners must not:

- investigate real collisions
- determine fault
- issue law-enforcement conclusions
- direct emergency responders
- operate recovery equipment
- access live fleet systems
- issue live dispatch commands

## 50. Incident Competency Strategy

Audit canonical authority for:

- incident reporting
- communication
- evidence
- facts versus assumptions
- escalation

Do not create a Transportation incident competency by default.

## 51. Supporting Vehicle Inspection Activity

Synthetic Vehicle Inspection Review remains supporting.

## 52. Vehicle Inspection Source Requirement

Core vehicle inspection instructional source must be developed before a formal proof is considered.

## 53. Vehicle Inspection Scope

Learners may:

- review supplied synthetic condition information
- identify visible concerns
- distinguish observation from diagnosis
- document observations
- identify stop/escalate decisions

## 54. Vehicle Inspection Prohibited Actions

Learners must not:

- perform official vehicle inspection
- approve a vehicle for service
- certify a pre-trip inspection
- repair a vehicle
- diagnose mechanical faults beyond supplied evidence
- claim driver qualification

## 55. Commercial Driving Unit Boundary

Commercial-driving lessons may teach:

- role awareness
- pathway concepts
- vehicle-class awareness
- DOT medical awareness
- licensing awareness
- professional conduct

## 56. Commercial Driving Prohibited Claims

Do not claim that SHU course completion provides:

- CDL permit
- CDL license
- CDL road-test qualification
- DOT medical qualification
- commercial-driving authorization
- employer driver qualification

## 57. CDL Reference Validation

Existing CDL references must be treated as reference material unless canonical authority is separately proven.

## 58. External CDL Validation

Before production publication, CDL-related terminology should receive appropriate external/practitioner validation.

## 59. Fleet Operations Boundary

Fleet lessons may teach:

- fleet roles
- availability concepts
- scheduling
- maintenance-status awareness
- fuel/energy considerations
- coordination

## 60. Fleet Maintenance Boundary

Learners do not perform regulated maintenance.

Course completion does not establish fleet-maintenance qualification.

## 61. Dispatch Boundary

Dispatch lessons remain readiness/simulation instruction.

No live regulated dispatch authority is created.

## 62. Transit Boundary

Transit lessons may teach:

- system structure
- routes
- stops
- schedules
- passenger mobility
- accessibility
- safety
- incident awareness

They do not confer transit-operator qualification.

## 63. Rail Boundary

Rail lessons may teach:

- infrastructure
- stations
- tracks
- signaling awareness
- passenger rail
- freight rail
- operating roles
- maintenance roles
- safety boundaries

## 64. Rail Prohibited Authority

Transportation must not confer:

- rail-operating authority
- rail-dispatch authority
- rail-maintenance qualification

## 65. Aviation Boundary

Aviation lessons may teach:

- airport systems
- ground operations awareness
- passenger movement
- cargo movement
- safety culture
- support roles
- career pathways

## 66. Aviation Prohibited Authority

Transportation must not confer:

- pilot certification
- aircraft-maintenance certification
- FAA authorization
- aircraft-dispatch authority
- air-traffic-control authority

## 67. Aircraft Maintenance Boundary

Aircraft-maintenance content remains awareness-level unless a future separately governed program establishes appropriate authority.

## 68. UAS Boundary

UAS lessons may teach:

- career awareness
- mission-planning awareness
- airspace awareness
- regulatory awareness

## 69. UAS Prohibited Authority

Course completion must not be represented as UAS operating authorization.

## 70. Traffic and Roadway Boundary

Roadway instruction may teach:

- roadway systems
- intersections
- traffic flow
- work zones
- mobility data
- public-safety coordination

## 71. Traffic-Control Boundary

Learners do not control real:

- signals
- intersections
- traffic-management systems
- roadway operations

## 72. Traffic Runtime Rule

Existing traffic runtime may support synthetic educational experiences.

Runtime behavior is not automatically curriculum authority.

## 73. Transit / Wayfinding Hub Rule

The Transit / Wayfinding Hub may support:

- contextualization
- simulation
- route reasoning
- accessibility scenarios

It is not a second curriculum authority.

## 74. Metaverse Rule

Existing Metaverse Transportation elements may support:

- transit routes
- rail routes
- traffic scenarios
- fleet movement
- simulated dispatch
- aviation orientation
- incident scenarios

## 75. Metaverse Evidence Rule

Metaverse output remains an evidence candidate unless canonical policy authorizes more.

## 76. No Metaverse Qualification

Metaverse participation does not establish:

- CDL qualification
- driver qualification
- transit qualification
- rail qualification
- aviation qualification
- UAS authorization
- fleet-maintenance qualification

## 77. Arcade Rule

Arcade may support:

- route planning
- disruption analysis
- passenger mobility
- traffic reasoning
- inspection awareness
- safety decisions

## 78. Arcade Evidence Rule

Arcade results remain evidence candidates unless canonical policy authorizes more.

## 79. AI Rule

AI may support:

- tutoring
- explanations
- scenario variation
- draft feedback
- accessibility assistance

## 80. AI Prohibited Authority

AI must not:

- issue competency decisions
- approve CDL status
- approve DOT medical status
- approve driver eligibility
- approve vehicle safety
- dispatch live vehicles
- control transit
- control rail
- control aircraft
- authorize UAS operation

## 81. Evidence Chain

All proof-capable implementation must preserve:

Activity Result
→ Evidence
→ Authorized Review
→ Competency Decision

## 82. Evidence Candidate Rule

Lesson output is not automatically verified evidence.

## 83. Reviewer Authority

Only canonical authorized reviewers may issue competency decisions.

## 84. Practitioner Review Separation

Practitioner validation and competency review are separate.

A Transportation practitioner may validate:

- terminology
- realism
- workflow
- safety
- scenario design

without automatically receiving competency-review authority.

## 85. Reassessment

Use canonical reassessment behavior.

No Transportation-specific reassessment engine is permitted.

## 86. Assignment Authority

Use canonical assignment services.

No Transportation assignment engine is permitted.

## 87. Assignment Immutability

Preserve canonical assignment-binding rules.

Do not silently rebind learner assignments.

## 88. Tenant Isolation

Transportation records must respect canonical:

- organization context
- tenant context
- membership
- permissions
- reviewer boundaries

## 89. Cross-Tenant Negative Test

A user from another tenant must not be able to:

- read learner evidence
- alter activity results
- review evidence
- issue competency decisions

## 90. Completion Authority

Use canonical Completion Policy.

## 91. Completion / Competency Separation

Course completion is not competency verification.

## 92. Completion / Credential Separation

Course completion is not:

- CDL licensure
- DOT medical qualification
- transit qualification
- rail qualification
- aviation certification
- UAS authorization
- fleet-maintenance qualification

## 93. Career Authority

Use canonical Career authority.

## 94. Career Validation

Before production claims, validate candidate career mappings for:

- CDL Driver
- commercial driver
- transit operator
- bus operator
- dispatcher
- fleet coordinator
- fleet technician
- rail operations
- rail maintenance
- airport operations
- aircraft maintenance
- UAS / drone roles
- traffic operations
- transportation operations technician

## 95. Career Claim Restrictions

Do not publish unsupported:

- wage claims
- growth claims
- placement claims
- licensing claims
- certification claims
- qualification claims
- employer eligibility claims

## 96. Portfolio Authority

Use canonical Portfolio.

## 97. Portfolio Rule

Eligible Transportation artifacts may be displayed in canonical Portfolio.

Portfolio display does not create professional qualification.

## 98. Accessibility Requirements

All lessons should support appropriate accessible alternatives for:

- maps
- route diagrams
- traffic diagrams
- transit diagrams
- rail diagrams
- airport diagrams
- vehicle-condition diagrams
- timelines
- tables
- incident scenarios
- mobility data

## 99. Accessibility Acceptance

Accessibility testing should include:

- keyboard operation
- focus order
- screen reader labels
- text alternatives
- captions
- transcripts
- non-color-only status
- readable tables
- accessible route descriptions

## 100. Source Construction Sequence A

Freeze the approved four-artifact planning package.

## 101. Source Construction Sequence B

Create an implementation inventory for all 75 lessons.

Record:

- lesson number
- classification
- canonical anchor
- source action
- safety boundary
- evidence behavior

## 102. Source Construction Sequence C

Resolve the 9 REUSE lessons.

## 103. Source Construction Sequence D

Resolve the 20 CONTEXTUALIZE lessons.

## 104. Source Construction Sequence E

Resolve the 13 EXTEND lessons.

## 105. Source Construction Sequence F

Construct the 33 MISSING source lessons.

## 106. Source Construction Sequence G

Validate all lesson files against canonical schema.

## 107. Source Construction Sequence H

Run curriculum import preview.

## 108. Source Construction Sequence I

Verify:

- 15 units
- 75 lessons
- stable ordering
- deterministic identifiers
- no duplicate slugs
- no unintended writes

## 109. Source Construction Sequence J

Execute initial import as DRAFT only after review approval.

## 110. Source Construction Sequence K

Implement the three approved primary proof scenarios only after competency/proof binding audit.

## 111. Source Construction Sequence L

Implement Synthetic Vehicle Inspection as supporting unless separately approved as a primary proof.

## 112. Source Construction Sequence M

Integrate canonical:

- assignments
- evidence
- reviewer workflow
- completion
- Career
- Portfolio
- accessibility

## 113. Source Construction Sequence N

Run Transportation / Logistics boundary regression tests.

## 114. Source Construction Sequence O

Run regulated-domain safety review.

## 115. Source Construction Sequence P

Run governed acceptance and prepare closeout evidence.

## 116. Import Acceptance Tests

Acceptance should verify:

- valid course stable key
- correct lesson count
- correct unit count
- stable ordering
- valid lesson structure
- preview safety
- duplicate detection
- deterministic re-import
- DRAFT status
- no unintended publication

## 117. Proof Acceptance Tests

Proof acceptance should verify:

- exact scenario assignment
- activity result creation
- evidence creation
- reviewer authorization
- competency decision authority
- reassessment behavior
- tenant isolation
- no automatic competency from lesson completion

## 118. Regulated-Domain Negative Tests

Tests should demonstrate that the system does not imply or issue:

- CDL licensure
- DOT medical qualification
- commercial-driving authorization
- transit-operating authority
- rail-operating authority
- rail-dispatch authority
- pilot certification
- aircraft-maintenance certification
- FAA authorization
- UAS authorization
- fleet-maintenance qualification

## 119. Logistics Regression Tests

Verify Transportation does not take ownership of:

- warehouse operations
- inventory
- port logistics
- freight documentation
- broader logistics-process authority

## 120. Current Decision

TRANSPORTATION & COMMERCIAL MOBILITY READINESS PASS 2 IMPLEMENTATION WORK ORDER — DRAFT FOR REVIEW

Planning package:

SOURCE CURRICULUM PLAN
→ COMPLETE IN DRAFT

LESSON REUSE MAP
→ COMPLETE IN DRAFT

PROOF ACTIVITY PLAN
→ COMPLETE IN DRAFT

IMPLEMENTATION WORK ORDER
→ COMPLETE IN DRAFT

Course shape:

15 UNITS
→ 75 LESSONS

Reuse distribution:

REUSE 9
→ CONTEXTUALIZE 20
→ EXTEND 13
→ MISSING 33

Primary proofs:

DISPATCH DISRUPTION SCENARIO
→ PRIMARY

TRANSIT ACCESSIBILITY SCENARIO
→ PRIMARY

TRANSPORTATION INCIDENT HANDOFF
→ PRIMARY

SYNTHETIC VEHICLE INSPECTION REVIEW
→ SUPPORTING ACTIVITY / EVIDENCE CANDIDATE

Authority decisions:

- UCR remains canonical for transferable readiness
- Prepare / Prove remains canonical
- evidence authority remains canonical
- Completion Policy remains canonical
- Career remains canonical
- Portfolio remains canonical
- accessibility remains canonical
- Transportation does not duplicate Logistics-process authority
- no fabricated competency IDs
- no new evidence engine
- no new completion engine
- no new Transportation registry
- no database migration authorized
- no CDL authority
- no DOT medical authority
- no commercial-driving authorization
- no transit-operating authority
- no rail-operating authority
- no aviation authority
- no UAS authority
- no fleet-maintenance authority
- no production publication authorized

Implementation remains blocked pending full Pass 2 package review.
