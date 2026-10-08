# IT & Cybersecurity Readiness — Pass 2 Implementation Work Order

Status: DRAFT — PARALLEL PASS 2
Branch: `agent/pass2-readiness-cybersecurity`
Baseline: `af2faa2`
Stable key: `shu-it-cybersecurity-readiness`

## 1. Purpose

Define the controlled future implementation sequence for IT & Cybersecurity Readiness after completion of Pass 2 planning.

This is Artifact 4 of 4.

This document is planning-only.

It does not authorize:

- production publication
- database migrations
- new competency authority
- new networking authority
- new cybersecurity authority
- offensive-security activity
- production access
- administrative authority
- certification
- security clearance
- employer authorization

## 2. Governing Documents

Implementation must conform to:

- `READINESS_PARALLEL_PASS_2_MASTER_WORK_ORDER.md`
- `IT_CYBERSECURITY_READINESS_REUSE_AUDIT.md`
- `IT_CYBERSECURITY_READINESS_BLUEPRINT.md`
- `IT_CYBERSECURITY_READINESS_SOURCE_CURRICULUM_PLAN.md`
- `IT_CYBERSECURITY_READINESS_LESSON_REUSE_MAP.md`
- `IT_CYBERSECURITY_READINESS_PROOF_ACTIVITY_PLAN.md`

## 3. Implementation Objective

Build IT & Cybersecurity Readiness as a governed composition over existing SHU authorities.

Preferred implementation order:

REUSE
→ CONFIGURE
→ COMPOSE
→ CONTEXTUALIZE
→ EXTEND
→ BUILD NEW ONLY WHEN PROVEN MISSING

## 4. Course Identity

Course stable key:

`shu-it-cybersecurity-readiness`

Approved proposed structure:

- 15 units
- 75 lessons

## 5. Lesson Reuse Distribution

Current planning classification:

- REUSE: 31
- CONTEXTUALIZE: 16
- EXTEND: 19
- MISSING: 9

Total:

75

Any implementation change to this distribution requires review.

## 6. Core Composition Model

Implementation should compose:

Universal Career Readiness
→ Technical Operations
→ Networking-Fiber
→ Cybersecurity-Security
→ AI / Cloud Infrastructure where applicable
→ IT support contextualization
→ endpoint contextualization
→ defensive awareness gaps
→ canonical evidence
→ authorized review
→ canonical completion
→ canonical Career
→ canonical Portfolio

## 7. No Parallel Technical Authority

Do not create:

- second Linux competency model
- second networking competency model
- second cybersecurity competency model
- endpoint-security registry
- IT evidence engine
- cybersecurity completion engine
- IT Career authority
- SOC authority
- technical credential authority

## 8. Existing Technical Operations Authority

Existing technical operations source already covers substantial capability in:

- Linux inspection
- troubleshooting
- monitoring
- documentation
- incident reasoning
- system state
- change
- recovery
- verification
- escalation

Reuse these capabilities where functionally equivalent.

## 9. Existing Networking-Fiber Authority

Existing networking source already covers:

- network fundamentals
- topology
- IP addressing
- network paths
- switching
- Ethernet
- fiber
- monitoring
- troubleshooting
- resilience
- failure domains
- capacity
- controlled network change
- incident coordination

Do not fork this authority.

## 10. Existing Cybersecurity-Security Authority

Existing cybersecurity source already covers:

- identity
- authentication
- authorization
- least privilege
- separation of duties
- account lifecycle
- access control
- security logs
- alert interpretation
- incident documentation
- evidence preservation
- defensive incident coordination

Do not duplicate these capabilities.

## 11. Existing AI / Cloud Authority

Existing AI / Cloud curriculum may be reused for:

- cloud service concepts
- virtualization
- containers
- workload infrastructure
- compute
- storage
- networking
- physical dependencies

This course does not become cloud-engineer certification.

## 12. Nine Missing Objectives

Current MISSING objectives are:

1. What IT Work Is
2. What Cybersecurity Work Is
3. What Help Desk Work Does
4. Help Desk Scenario
5. Malware Awareness
6. Endpoint Security Review
7. Social Engineering Awareness
8. Phishing Indicators
9. Phishing Response Scenario

These are source or activity gaps.

They do not automatically create new competency authority.

## 13. Source Curriculum Location

Future source lessons must use the established curriculum source architecture under:

`src/content/lessons/`

No separate IT content engine is permitted.

## 14. Source Schema

Use the canonical lesson schema.

Do not create an IT-specific schema.

If a genuine shared-schema limitation is discovered:

- document it
- identify the canonical owner
- propose a bounded shared extension
- stop for integration review

## 15. Source Naming

Source lesson names must be:

- deterministic
- stable
- lowercase
- descriptive
- ordered
- free of unsupported certification claims
- free of employer-authorization claims

## 16. Importer Authority

Use the canonical curriculum importer.

Do not create an IT-specific importer.

## 17. Preview Requirement

Before execution:

- source parses
- schema validates
- stable key validates
- unit order validates
- lesson order validates
- preview succeeds
- preview does not create unintended catalog writes
- duplicate behavior is canonical

## 18. Draft-State Rule

Initial execution must remain:

DRAFT

No initial Pass 2 implementation may publish directly.

## 19. Duplicate Import Rule

Repeated import must not silently create duplicate course, unit, or lesson records.

Reuse canonical duplicate handling.

## 20. No UCR Clone

Do not duplicate transferable UCR lessons just to insert IT terminology.

Reuse UCR capability where functionally equivalent.

## 21. No Data Center Clone

Do not copy Data Center source wholesale into a second IT curriculum tree.

Reuse canonical technical capability through composition and approved contextualization.

## 22. Linux Implementation Boundary

Linux activities may use:

- disposable sandbox
- approved commands
- files
- processes
- services
- system state
- documentation

They must not require:

- production Linux access
- root authority
- destructive commands
- real credentials
- unauthorized system modification

## 23. Networking Implementation Boundary

Networking may use:

- synthetic topology
- supplied addressing
- simulated connectivity evidence
- path reasoning
- approved troubleshooting fixtures

Do not require:

- unauthorized scanning
- real packet interception
- production network configuration
- facility fiber work
- external target discovery

## 24. Identity Boundary

Identity instruction may use:

- fictional identities
- synthetic roles
- mock permissions
- account lifecycle scenarios
- MFA concepts
- session concepts

No real credentials are required.

## 25. Authentication Boundary

Do not require:

- password cracking
- MFA bypass
- credential stuffing
- stolen credentials
- brute force
- credential harvesting

## 26. Authorization Boundary

Learners may analyze:

- permissions
- roles
- least privilege
- separation of duties
- excessive access

Learners must not change real permissions.

## 27. Endpoint Boundary

Endpoint activity may use:

- synthetic device profile
- update state
- patch state
- endpoint-protection state
- account role
- encryption status
- synthetic alerts

No live endpoint administration is required.

## 28. Malware Boundary

Malware instruction is defensive awareness only.

Allowed:

- inert examples
- static indicators
- supplied behavior descriptions
- defensive response reasoning

Not allowed:

- malware development
- modification
- deployment
- persistence
- command-and-control
- evasion
- destructive payloads

## 29. Phishing Boundary

Phishing lessons must use:

- fictional senders
- mock messages
- inert links
- synthetic attachments
- screenshots
- static examples

Do not require:

- real phishing campaigns
- real credential collection
- real impersonation
- malicious delivery
- real organizational targeting

## 30. Security Monitoring Boundary

Monitoring instruction may use:

- synthetic logs
- synthetic alerts
- static event timelines
- fictional identities
- mock service records

No production monitoring credentials are required.

## 31. Alert Boundary

An alert is not automatically a confirmed incident.

Implementation must teach:

- signal
- context
- corroboration
- uncertainty
- evidence
- escalation

## 32. Incident Response Boundary

Incident lessons may teach:

- identification
- documentation
- evidence preservation
- authorized escalation
- containment concepts
- recovery concepts
- verification

They must not grant professional incident-response authority.

## 33. Evidence Preservation Boundary

Learners may preserve synthetic evidence.

They must not:

- alter real evidence
- destroy real evidence
- access restricted real evidence
- claim forensic authority

## 34. Offensive-Security Prohibition

No lesson, activity, proof, Arcade game, or Metaverse scenario may require learners to:

- attack a real target
- exploit vulnerabilities
- scan unauthorized systems
- crack passwords
- steal credentials
- bypass controls
- deploy malware
- establish persistence
- evade monitoring
- destroy data
- intercept unauthorized traffic

## 35. Safe Action Ceiling

Typical learner action ceiling:

OBSERVE
→ INTERPRET
→ ANALYZE
→ DOCUMENT
→ RECOMMEND
→ ESCALATE
→ VERIFY IN APPROVED SIMULATION

Not:

ATTACK
→ BYPASS
→ EXPLOIT
→ PERSIST
→ EVADE
→ DAMAGE

## 36. Help Desk Source Work

Help Desk implementation should add the missing user-support context around:

- intake
- clarification
- ticketing
- user communication
- troubleshooting sequence
- escalation
- verification
- handoff

Reuse existing troubleshooting authority.

## 37. Help Desk Proof Direction

Primary candidate:

Help Desk Troubleshooting Scenario

Preferred competency reuse target:

`document-structured-infrastructure-troubleshooting`

Existing proof reference:

`grade11-technical-operations-troubleshooting-documentation`

Do not create a new competency unless functional equivalence fails after review.

## 38. Endpoint Source Work

Endpoint implementation may extend existing defensive security around:

- updates
- patches
- permissions
- device protection
- endpoint monitoring
- data boundaries
- secure configuration
- escalation

## 39. Endpoint Proof Direction

Primary candidate:

Endpoint Security Review

Preferred approach:

REUSE / CONTEXTUALIZE existing security authority.

Existing access-control proof reference:

`grade11-security-access-control-analysis`

A new endpoint activity does not automatically justify a new endpoint competency.

## 40. Security Alert Triage Proof

Primary candidate:

Security Alert Triage

Canonical existing proof:

`grade11-security-log-alert-interpretation`

Canonical existing competency:

`security-log-alert-interpretation`

This should be reused directly unless repository review proves a mismatch.

## 41. Network Support Proof Disposition

Do not create a new Network Support competency.

Existing proof:

`grade11-networking-fiber-connectivity-troubleshooting`

Existing competency:

`network-connectivity-troubleshooting`

Network Support may bind to or contextualize this existing authority.

## 42. Linux Proof Disposition

Existing proof:

`grade11-technical-operations-linux-inspection`

Existing competency:

`inspect-linux-system-state-safely`

Do not create a duplicate Linux inspection proof.

## 43. Access-Control Proof Disposition

Existing proof:

`grade11-security-access-control-analysis`

Existing competency:

`security-access-control-analysis`

Reuse this where applicable.

## 44. Incident Documentation Proof Disposition

Existing proof:

`grade11-security-incident-documentation-escalation`

Existing competency:

`security-incident-documentation-escalation`

Reuse this for Unit 11 where functionally equivalent.

## 45. Prepare / Prove Authority

All formal proof work must use canonical Prepare / Prove services.

No IT-specific Prepare / Prove service is permitted.

## 46. Competency Audit Before Proof Work

Before implementing formal proof bindings:

- inspect `competency_definitions`
- inspect `PROOF_CONFIGS`
- verify exact activity IDs
- verify exact competency slugs
- compare criteria
- compare activity intent
- inspect reassessment behavior
- inspect reviewer permissions
- document final REUSE / CONTEXTUALIZE / EXTEND decision

## 47. No Fabricated Competency IDs

Do not invent competency IDs in source, config, tests, or documentation.

Only use:

- verified existing canonical identifiers
or
- explicitly approved new identifiers after review

## 48. Evidence Chain

Formal activity flow remains:

Assignment
→ Learner Access
→ Activity Result
→ Evidence
→ Authorized Review
→ Competency Decision

No step may be bypassed.

## 49. Evidence Candidate Rule

The following may create evidence candidates:

- help-desk ticket
- troubleshooting record
- Linux inspection
- topology analysis
- network troubleshooting
- access-control analysis
- endpoint review
- phishing analysis
- alert triage
- incident record
- change plan
- recovery record
- Career presentation

Evidence candidate does not equal verified competency.

## 50. Reviewer Authority

Only canonical authorized reviewers may issue competency decisions.

Technical professionals, mentors, employers, instructors, or AI systems do not automatically gain review authority.

## 51. Reassessment

Formal proof must use canonical reassessment behavior.

No IT-specific retry mechanism is permitted.

## 52. Assignment Authority

Use canonical assignment systems.

Assignment lineage must preserve:

- learner
- organization
- tenant
- release
- activity
- evidence
- reviewer
- competency decision

## 53. Assignment Integrity

Client-controlled input must not allow:

- learner substitution
- organization swapping
- tenant crossing
- evidence reassignment
- reviewer substitution
- activity substitution

## 54. Tenant Isolation

Acceptance must test that another tenant cannot:

- access activity results
- access evidence
- review evidence
- mutate evidence
- issue competency decisions

## 55. Completion Authority

Use canonical Completion Policy.

No IT-specific completion engine is permitted.

## 56. Completion Separation

Acceptance must preserve:

course completion
≠ competency

competency
≠ certification

certification
≠ security clearance

course completion
≠ production access

course completion
≠ employer authorization

## 57. Career Authority

All role mappings must use canonical Career authority.

Do not hard-code unsupported claims about:

- wages
- demand
- placement
- certification requirements
- security-clearance requirements
- employer qualification
- job eligibility

## 58. Portfolio Authority

Eligible technical artifacts must use canonical Portfolio.

Do not create a separate technical or Cybersecurity portfolio system.

## 59. Credential Authority

The course must not issue or imply:

- CompTIA A+
- CompTIA Network+
- CompTIA Security+
- Cisco certification
- cloud certification
- penetration-testing certification
- security clearance
- professional SOC qualification

unless separately governed external authority establishes it.

## 60. Accessibility Authority

Use canonical accessibility and accommodation systems.

No IT-specific accessibility authority is permitted.

## 61. Accessibility Requirements

Draft experiences must support:

- semantic headings
- keyboard navigation
- screen readers
- captions
- transcripts
- reduced motion
- non-color-only meaning
- accessible topology descriptions
- accessible logs
- accessible alert tables
- accessible command output
- accessible incident timelines
- plain-language alternatives where appropriate

## 62. Responsible AI Boundary

AI may support:

- explanations
- tutoring
- scenario variation
- role-play
- feedback drafts
- accessibility
- defensive reasoning

AI must not:

- issue competency decisions
- authorize access
- execute attacks
- change production systems
- declare an incident confirmed without canonical process
- create credentials

## 63. Learning Arcade Boundary

Arcade may support:

- troubleshooting sequence
- phishing recognition
- access-control reasoning
- topology interpretation
- alert triage
- evidence classification
- incident sequencing

Arcade output remains evidence candidate material unless canonical policy says otherwise.

## 64. Metaverse Boundary

Metaverse may support:

- Help Desk
- Security Operations Center
- Network Operations Center
- simulated incidents
- infrastructure environments

Metaverse results do not independently establish competency.

## 65. SOC Boundary

The Security Operations Center may provide educational simulation.

It does not create:

- professional SOC authority
- production monitoring authority
- security clearance
- employment qualification

## 66. Source Construction Sequence

After planning approval:

Phase A — verify source path and schema

Phase B — map UCR reuse

Phase C — map Technical Operations reuse

Phase D — map Networking-Fiber reuse

Phase E — map Cybersecurity-Security reuse

Phase F — author cross-industry contextualization

Phase G — author nine proven missing objectives

Phase H — validate source

Phase I — preview import

Phase J — execute DRAFT only

Phase K — audit proof equivalence

Phase L — bind approved proofs

Phase M — build draft learner experience

Phase N — governed acceptance

Phase O — closeout

## 67. Allowed Initial File Classes

Initial implementation may change only what is needed for:

- IT & Cybersecurity source content
- course composition metadata
- narrowly required importer configuration
- targeted tests
- draft learner configuration when approved

## 68. Prohibited Initial Changes

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
- security permissions
- SOC authority
- networking authority
- Truth stores

## 69. No Migration Default

Current planning does not justify a database migration.

Initial assumption:

NO DATABASE MIGRATIONS

## 70. Shared-Service Change Gate

If implementation appears to require a shared-service change:

1. stop
2. document the limitation
3. identify the canonical owner
4. explain why composition is insufficient
5. identify affected courses
6. propose the smallest shared change
7. require integration review

## 71. Import Validation

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

## 72. Lesson Traceability

Every new source lesson must trace to:

- MISSING
or
- approved EXTEND

No unexplained new source lesson is permitted.

## 73. Reuse Validation

Acceptance must confirm:

- UCR remains canonical
- Linux remains canonical
- Networking-Fiber remains canonical
- Cybersecurity-Security remains canonical
- existing proof authority is reused
- cross-industry context does not become duplicate authority

## 74. Proof Configuration Validation

Before adding any proof configuration, document:

- target activity
- target capability
- existing proof configs reviewed
- existing competency reviewed
- functional overlap
- missing context
- criteria differences
- evidence shape
- reviewer authority
- reassessment behavior
- final decision

## 75. Help Desk Acceptance

Acceptance must verify:

- synthetic user
- synthetic ticket
- bounded troubleshooting
- no production credentials
- no unauthorized administration
- clear escalation
- verification
- canonical evidence chain

## 76. Endpoint Acceptance

Acceptance must verify:

- synthetic endpoint
- no real administration
- defensive-only activity
- no malware execution
- no credential attack
- least-privilege reasoning
- safe recommendation
- canonical evidence chain

## 77. Alert Triage Acceptance

Acceptance must verify direct reuse or governed binding of:

`grade11-security-log-alert-interpretation`

No duplicate generic alert-triage competency should appear.

## 78. Network Acceptance

Acceptance must verify reuse of:

`grade11-networking-fiber-connectivity-troubleshooting`

when network troubleshooting is used.

## 79. Linux Acceptance

Acceptance must verify reuse of:

`grade11-technical-operations-linux-inspection`

when Linux inspection is used.

## 80. Access-Control Acceptance

Acceptance must verify reuse of:

`grade11-security-access-control-analysis`

where applicable.

## 81. Incident Acceptance

Acceptance must verify reuse of:

`grade11-security-incident-documentation-escalation`

where applicable.

## 82. False-Verification Test

Acceptance must prove that none of these directly creates verified competency:

- lesson completion
- quiz completion
- sandbox completion
- help-desk ticket
- endpoint review
- phishing exercise
- Arcade result
- Metaverse result
- AI output
- portfolio upload

## 83. Unauthorized Reviewer Test

A user without canonical reviewer permission must be unable to issue a competency decision.

## 84. Cross-Tenant Test

A user from another tenant must not be able to access or review the learner's technical evidence.

## 85. Reassessment Test

Any formal proof must follow canonical reassessment behavior.

## 86. Production-Access Test

Acceptance must prove that the learner experience does not require:

- production systems
- real employer systems
- production network credentials
- production SOC credentials
- production endpoint access
- paid cloud infrastructure

## 87. Offensive-Security Test

Acceptance must confirm there is no learner instruction for:

- unauthorized scanning
- exploitation
- password cracking
- credential theft
- malware deployment
- persistence
- evasion
- destructive action
- unauthorized interception

## 88. Phishing Safety Test

Acceptance must confirm phishing activities use only synthetic or inert content.

## 89. Data Privacy

Use fictional or synthetic:

- users
- organizations
- emails
- IP addresses where possible
- identities
- credentials
- tickets
- logs
- alerts
- endpoint names
- incident records

Do not introduce unnecessary sensitive data.

## 90. Career Validation

Career content must be verified through canonical Career authority before production claims.

## 91. Employer Review

Future IT / cybersecurity professionals may validate:

- terminology
- workflow realism
- support practices
- defensive-security context
- escalation paths
- workplace expectations

Professional review does not automatically confer competency-review authority.

## 92. Accessibility Acceptance

Acceptance must verify equivalent access to:

- ticket exercises
- command output
- network diagrams
- log tables
- alert dashboards
- endpoint profiles
- incident timelines
- proof submission

## 93. Draft Learner Flow

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

## 94. Vocabulary Strategy

Potential vocabulary includes:

- operating system
- process
- service
- endpoint
- network
- topology
- IP address
- authentication
- authorization
- least privilege
- MFA
- log
- alert
- incident
- evidence
- escalation
- patch
- phishing
- social engineering
- rollback
- recovery

Vocabulary knowledge does not establish competency.

## 95. Assessment Strategy

Assessments may evaluate:

- understanding
- reasoning
- safe scope
- troubleshooting sequence
- log interpretation
- evidence use
- network reasoning
- endpoint reasoning
- phishing awareness
- escalation
- technical communication
- Career planning

They must not claim professional qualification.

## 96. Work-Based Learning Boundary

Future work-based learning must use canonical opportunity and assignment authority.

The course must not independently create:

- internships
- employment placement
- security clearance
- privileged access
- production-system authorization

## 97. Feature Flags

Use existing feature/configuration patterns if draft gating is needed.

Do not create a new governance system for unfinished course surfaces.

## 98. Release Boundary

Initial implementation remains:

DRAFT

Persistent production publication is not authorized by this work order.

## 99. Disposable Acceptance

Where possible, acceptance should use disposable data and environments.

Test data must not contaminate persistent institutional truth.

## 100. Acceptance Dataset

Acceptance should include at least:

- one learner
- one tenant
- one organization
- one assignment
- one REUSE lesson
- one CONTEXTUALIZE lesson
- one EXTEND lesson
- one MISSING/new lesson
- one Help Desk scenario
- one Endpoint Security scenario
- one Security Alert Triage path
- one networking reuse path
- one unauthorized reviewer attempt
- one cross-tenant denial

## 101. Acceptance Outcomes

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
- no false certification
- no production access
- no offensive-security path
- canonical completion
- canonical Career
- canonical Portfolio
- accessibility

## 102. Regression Requirement

Implementation must not break:

- Universal Career Readiness
- Data Center Technical Operations
- Networking-Fiber
- Cybersecurity-Security
- AI / Cloud Infrastructure
- Prepare / Prove
- Completion Policy
- Career
- Portfolio
- accessibility
- tenant isolation
- Reporting / Truth

## 103. Clean Diff Requirement

Before commit:

- only intended files changed
- no temporary files
- no secrets
- no local configuration
- no accidental generated output
- no unrelated code
- no unnecessary lockfile changes

## 104. Whitespace Requirement

Before commit:

- inspect untracked files explicitly
- run `git diff --cached --check` after staging
- resolve all formatting issues

## 105. Test Requirement

Run targeted tests for every implementation area touched.

If a canonical service changes, run its relevant regression suite.

## 106. Stop Conditions

Stop implementation if:

- new authority appears necessary
- database migration appears necessary
- a second networking model appears necessary
- a second cybersecurity model appears necessary
- offensive-security scope appears
- production access appears necessary
- reviewer authority becomes ambiguous
- evidence lineage cannot be preserved
- Completion would need a local engine
- source schema appears insufficient

## 107. Planning Package

The complete IT & Cybersecurity Pass 2 planning package is:

1. `IT_CYBERSECURITY_READINESS_SOURCE_CURRICULUM_PLAN.md`
2. `IT_CYBERSECURITY_READINESS_LESSON_REUSE_MAP.md`
3. `IT_CYBERSECURITY_READINESS_PROOF_ACTIVITY_PLAN.md`
4. `IT_CYBERSECURITY_READINESS_PASS_2_IMPLEMENTATION_WORK_ORDER.md`

After full package review, these four documents may be staged and committed together.

## 108. Implementation Status

Current status:

PLANNING ONLY

No source construction is authorized yet.

No proof creation is authorized yet.

No competency creation is authorized.

No migration is authorized.

No production publication is authorized.

## 109. Integration Principle

IT & Cybersecurity Readiness should become a composition layer over existing technical authority.

It should not become another technical authority island.

## 110. Final Architecture

Preferred future model:

UCR
→ TECHNICAL OPERATIONS
→ NETWORKING-FIBER
→ CYBERSECURITY-SECURITY
→ AI / CLOUD WHERE APPROPRIATE
→ CROSS-INDUSTRY IT CONTEXT
→ HELP DESK EXTENSION
→ ENDPOINT EXTENSION
→ DEFENSIVE PHISHING / MALWARE AWARENESS
→ CANONICAL PREPARE / PROVE
→ CANONICAL COMPLETION
→ CANONICAL CAREER
→ CANONICAL PORTFOLIO
→ GOVERNED REPORTING

## 111. Current Decision

IT & CYBERSECURITY PASS 2 IMPLEMENTATION WORK ORDER — DRAFT FOR REVIEW

PLANNING PACKAGE COMPLETE IN DRAFT FORM

IMPLEMENTATION REMAINS BLOCKED PENDING FULL PACKAGE REVIEW

Core decisions:

- 15 units
- 75 lessons
- REUSE 31
- CONTEXTUALIZE 16
- EXTEND 19
- MISSING 9
- exactly 3 primary proof candidates
- direct reuse of existing alert-triage authority
- reuse existing networking proof authority
- reuse existing Linux proof authority
- reuse existing access-control authority
- reuse existing incident-documentation authority
- no offensive-security expansion
- no production access
- no duplicate technical authority
