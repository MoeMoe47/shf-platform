# Advanced Manufacturing & Semiconductor Readiness — Lesson Reuse Map

Status: DRAFT — PARALLEL PASS 2
Branch: `agent/pass2-readiness-manufacturing`
Baseline: `af2faa2`
Stable key: `shu-advanced-manufacturing-semiconductor-readiness`

## 1. Purpose

Map all 75 proposed Advanced Manufacturing & Semiconductor Readiness lessons to existing SHU curriculum and technical authority.

Classifications:

- REUSE
- CONTEXTUALIZE
- EXTEND
- CONSOLIDATE
- REFERENCE ONLY
- MISSING

This is Artifact 2 of 4.

It does not create:

- source lesson files
- competency definitions
- competency IDs
- proof configurations
- machine authorization
- electrical authorization
- industrial maintenance qualification
- cleanroom qualification
- semiconductor fab qualification

## 2. Evidence Reviewed

Primary UCR source:

`src/content/lessons/shu-universal-career-readiness-student/`

Technical reuse sources include:

- `src/content/lessons/data-center-specialization-11-student/`
- `src/content/lessons/data-center-specialization-12-student/`
- `src/content/lessons/data-center-reliable-operations-10-student/`
- `src/content/lessons/data-center-technical-foundations-9-student/`

Planning authorities:

- `ADVANCED_MANUFACTURING_SEMICONDUCTOR_READINESS_REUSE_AUDIT.md`
- `ADVANCED_MANUFACTURING_SEMICONDUCTOR_READINESS_BLUEPRINT.md`
- `ADVANCED_MANUFACTURING_SEMICONDUCTOR_READINESS_SOURCE_CURRICULUM_PLAN.md`
- `READINESS_PARALLEL_PASS_2_MASTER_WORK_ORDER.md`

The repository search did not prove an existing governed Advanced Manufacturing & Semiconductor source curriculum.

## 3. Reuse Rules

### REUSE

Existing source substantially teaches the same capability.

### CONTEXTUALIZE

Existing capability remains authoritative; manufacturing examples or scenarios are added.

### EXTEND

Existing material covers part of the objective, but manufacturing-specific instructional content is required.

### MISSING

No functionally equivalent governed source lesson was found.

MISSING does not automatically authorize a new competency.

## 4. Unit 1 — Modern Manufacturing Foundations

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 1.1 What Modern Manufacturing Is | MISSING | UCR workplace orientation only | New manufacturing-system orientation needed |
| 1.2 Types of Manufacturing Environments | MISSING | No governed equivalent found | New manufacturing environment content needed |
| 1.3 People, Machines and Systems | EXTEND | `ucr-17-roles-responsibilities-shared-goals.json` | Extend role/system concepts to production organizations |
| 1.4 Readiness Versus Qualification | CONTEXTUALIZE | `ucr-53-employer-expectations-preparation-vs-qualification.json`; `ucr-54-training-credentials-work-based-learning-routes.json` | Reuse readiness/qualification distinction |
| 1.5 Manufacturing Readiness Starting Point | CONTEXTUALIZE | `ucr-51-career-exploration-interests-strengths-work-environments.json` | Manufacturing prompts only |

## 5. Unit 2 — Manufacturing Professionalism and Reliability

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 2.1 Reliability on a Production Team | CONTEXTUALIZE | `ucr-03-reliability-attendance-punctuality.json`; `ucr-31-time-attendance-reliability.json` | Production context only |
| 2.2 Shift Readiness and Handoffs | CONTEXTUALIZE | `ucr-18-coordination-handoffs-dependencies.json`; `ucr-34-when-plans-change-lateness-absence-delays.json` | Manufacturing shift context |
| 2.3 Professional Conduct on the Floor | CONTEXTUALIZE | `ucr-04-professional-conduct-responsibility.json`; `ucr-06-what-professionalism-looks-like.json` | Industrial examples only |
| 2.4 Accountability and Ownership | CONTEXTUALIZE | `ucr-08-accountability-ownership-follow-through.json`; `ucr-10-feedback-mistakes-continuous-improvement.json` | Production/quality framing |
| 2.5 Reliability Reflection | REUSE | UCR reliability / continuous-improvement sequence | No new capability required |

## 6. Unit 3 — Manufacturing Safety Culture

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 3.1 Safety Is Everyone's Responsibility | CONTEXTUALIZE | `ucr-21-safety-everyones-responsibility.json`; `ucr-25-building-strong-safety-culture.json` | Industrial framing |
| 3.2 Recognizing Industrial Hazards | EXTEND | `ucr-22-recognizing-hazards-changing-conditions.json` | Add manufacturing hazard categories |
| 3.3 Scope, Authorization and Stop-Work | CONTEXTUALIZE | `ucr-23-scope-authorization-knowing-when-to-stop.json` | Manufacturing scope examples |
| 3.4 Reporting Hazards and Near Misses | CONTEXTUALIZE | `ucr-24-reporting-hazards-near-misses-incidents.json` | Production reporting examples |
| 3.5 Safety Decision Scenario | CONTEXTUALIZE | UCR 21–24; `ucr-29-make-communicate-verify-decision.json` | Candidate proof context |

## 7. Unit 4 — Quality Foundations

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 4.1 What Quality Means in Manufacturing | EXTEND | `ucr-02-employer-expectations.json`; `ucr-10-feedback-mistakes-continuous-improvement.json` | Manufacturing quality requires additional content |
| 4.2 Requirements and Specifications | MISSING | No governed manufacturing equivalent found | New specification/conformance lesson justified |
| 4.3 Defects, Nonconformance and Escalation | EXTEND | UCR safety/escalation + accountability concepts | Add manufacturing nonconformance context |
| 4.4 Documentation and Traceability | CONTEXTUALIZE | UCR documentation; Data Center technical documentation patterns | Reuse documentation authority |
| 4.5 Quality Decision Exercise | EXTEND | UCR decision making + evidence-quality patterns | Manufacturing conformance scenario needed |

## 8. Unit 5 — Measurement and Metrology Awareness

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 5.1 Why Measurement Matters | EXTEND | Data Center telemetry/measurement patterns | Manufacturing measurement purpose requires extension |
| 5.2 Accuracy, Precision and Tolerance | MISSING | No governed manufacturing-metrology lesson found | New concept lesson justified |
| 5.3 Measurement Tools Overview | MISSING | No governed equivalent found | New awareness lesson justified |
| 5.4 Recording and Interpreting Measurements | EXTEND | Data Center synthetic telemetry / measurement evidence | Extend to manufacturing measurement records |
| 5.5 Measurement Decision Scenario | EXTEND | Existing evidence-based technical reasoning | Add tolerance/conformance scenario |

## 9. Unit 6 — Production Flow and Standard Work

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 6.1 From Material to Finished Product | MISSING | No governed manufacturing-process lesson found | New production-flow lesson justified |
| 6.2 Standard Work and Work Instructions | MISSING | General procedure-following exists but no manufacturing source | Manufacturing standard-work lesson justified |
| 6.3 Sequence, Dependencies and Bottlenecks | CONTEXTUALIZE | `ucr-18-coordination-handoffs-dependencies.json`; Data Center capacity/bottleneck concepts | Manufacturing process context |
| 6.4 Following Controlled Processes | EXTEND | UCR scope/procedure discipline | Add controlled-process and deviation context |
| 6.5 Production Flow Exercise | EXTEND | Existing systems/dependency reasoning | Manufacturing workflow activity required |

## 10. Unit 7 — Tools, Machines and CNC Awareness

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 7.1 Manufacturing Equipment Categories | MISSING | Pathway references only | New equipment-awareness lesson justified |
| 7.2 Machine Controls and Human Responsibility | EXTEND | UCR scope/authorization; responsible automation | Add machine-control context |
| 7.3 CNC Concepts | MISSING | CNC pathway references are reference-only | New readiness-level CNC lesson justified |
| 7.4 Tooling and Setup Awareness | MISSING | No governed source lesson found | New awareness lesson justified |
| 7.5 Machine-Scope Scenario | CONTEXTUALIZE | `ucr-23-scope-authorization-knowing-when-to-stop.json` | Machine scenario over existing scope capability |

## 11. Unit 8 — Manufacturing Problem Solving

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 8.1 Define the Manufacturing Problem | CONTEXTUALIZE | `ucr-26-define-problem-before-solving.json` | Manufacturing case only |
| 8.2 Facts, Assumptions and Missing Data | REUSE | `ucr-27-facts-assumptions-missing-information.json` | Direct reuse |
| 8.3 Generate and Compare Options | CONTEXTUALIZE | `ucr-28-generate-options-compare-tradeoffs.json` | Manufacturing examples |
| 8.4 Root Cause and Continuous Improvement | CONTEXTUALIZE | `ucr-30-learn-from-results-improve-process.json`; UCR 10 | Manufacturing context |
| 8.5 Manufacturing Problem-Solving Scenario | EXTEND | UCR 26–30 | Integrated manufacturing proof scenario |

## 12. Unit 9 — Maintenance and Equipment Reliability Awareness

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 9.1 Why Equipment Reliability Matters | EXTEND | Data Center reliability-systems-thinking content | Extend beyond critical facilities |
| 9.2 Preventive and Predictive Maintenance Concepts | CONTEXTUALIZE | `data-center-specialization-11-preventive-maintenance.json`; `data-center-reliable-operations-10-preventive-maintenance.json` | Reuse conceptual maintenance discipline |
| 9.3 Inspection and Condition Awareness | EXTEND | Data Center monitoring/trend concepts | Add manufacturing equipment context |
| 9.4 Maintenance Documentation and Handoffs | CONTEXTUALIZE | Data Center documentation/change records + UCR handoffs | Contextualize |
| 9.5 Maintenance Escalation Scenario | CONTEXTUALIZE | UCR scope/escalation + Data Center preventive-maintenance boundary | Reuse safe escalation model |

## 13. Unit 10 — Automation and Robotics Awareness

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 10.1 Why Manufacturing Automates | MISSING | No governed manufacturing automation lesson found | New lesson justified |
| 10.2 Industrial Robotics Overview | MISSING | Robotics assets/pathway concepts only | New awareness lesson justified |
| 10.3 Sensors, Inputs and Outputs | MISSING | Data Center sensors exist but not industrial I/O instruction | New manufacturing-specific lesson justified |
| 10.4 Human Oversight and Automated Systems | CONTEXTUALIZE | `ucr-37-using-ai-assistants-responsibly.json`; `ucr-40-human-judgment-ownership-responsible-ai-decisions.json` | Reuse human-oversight capability |
| 10.5 Automation Escalation Scenario | EXTEND | Scope/escalation + technical monitoring patterns | Manufacturing automation scenario needed |

## 14. Unit 11 — Digital Manufacturing and Responsible AI

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 11.1 Digital Systems on the Factory Floor | EXTEND | `ucr-36-digital-tools-systems-workplace-responsibility.json` | Add manufacturing system categories |
| 11.2 Data Accuracy and Production Records | CONTEXTUALIZE | UCR digital responsibility / honest reporting | Production record context |
| 11.3 Cybersecurity Awareness in Manufacturing | CONTEXTUALIZE | UCR privacy/security + existing cybersecurity authority | No new cyber authority |
| 11.4 Responsible AI in Manufacturing | CONTEXTUALIZE | UCR 37–40 | Manufacturing context only |
| 11.5 Digital Responsibility Scenario | EXTEND | UCR digital/AI sequence | Integrated factory scenario |

## 15. Unit 12 — Clean Manufacturing and Controlled Environments

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 12.1 Why Controlled Environments Exist | MISSING | No governed cleanroom source found | New readiness lesson justified |
| 12.2 Contamination Sources and Behaviors | MISSING | No governed equivalent found | New contamination-awareness lesson justified |
| 12.3 Cleanroom Zones and Access Awareness | MISSING | No governed cleanroom-access curriculum found | New awareness lesson justified |
| 12.4 Procedure Discipline in Controlled Environments | EXTEND | UCR procedure/scope discipline | Add controlled-environment context |
| 12.5 Controlled-Environment Decision Scenario | EXTEND | UCR scope/escalation + safety reasoning | New scenario, existing authority |

## 16. Unit 13 — Semiconductor Manufacturing Foundations

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 13.1 What Semiconductors Are | MISSING | No semiconductor source curriculum found | New foundational lesson justified |
| 13.2 From Wafer to Device | MISSING | No governed wafer/process lesson found | New high-level process lesson justified |
| 13.3 Fab Environments and Roles | MISSING | Career/pathway references only | New readiness lesson justified |
| 13.4 Precision, Yield and Process Control | MISSING | Quality/metrology concepts exist but semiconductor context is absent | New contextual foundation needed |
| 13.5 Semiconductor Readiness Scenario | EXTEND | Quality + scope + contamination + documentation reasoning | Integrate existing capability in semiconductor context |

## 17. Unit 14 — Manufacturing Careers and Pathways

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 14.1 Production and Operator Pathways | EXTEND | UCR Career Planning + manufacturing pathway references | Canonical Career data required |
| 14.2 Quality and Metrology Pathways | EXTEND | UCR Career Planning + reference concepts | Canonical Career data required |
| 14.3 Maintenance and Automation Pathways | EXTEND | UCR Career Planning + technical references | Canonical Career data required |
| 14.4 Semiconductor and Clean Manufacturing Pathways | EXTEND | UCR Career Planning; semiconductor reference concepts | Validated Career data required |
| 14.5 Compare Manufacturing Pathways | CONTEXTUALIZE | `ucr-51` through `ucr-55` career sequence | Manufacturing options only |

## 18. Unit 15 — Evidence, Transition and Career Readiness

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 15.1 What Manufacturing Evidence Shows | CONTEXTUALIZE | `ucr-61-from-activity-to-evidence.json`; `ucr-62-what-makes-evidence-strong.json` | Manufacturing artifacts only |
| 15.2 Build a Manufacturing Readiness Portfolio | CONTEXTUALIZE | `ucr-64-building-a-truthful-portfolio.json` | Canonical Portfolio |
| 15.3 Present Skills Without Overclaiming | CONTEXTUALIZE | `ucr-65-presenting-skills-without-overclaiming.json` | Manufacturing examples |
| 15.4 Training, Apprenticeship and Next Steps | CONTEXTUALIZE | `ucr-52`, `ucr-53`, `ucr-54`, `ucr-72` | External requirements remain external |
| 15.5 Final Manufacturing Transition Plan | REUSE | `ucr-71` through `ucr-75` transition sequence | Direct framework reuse |

## 19. Classification Summary

The 75 proposed lessons currently resolve as:

- REUSE: 3
- CONTEXTUALIZE: 28
- EXTEND: 24
- MISSING: 20

Total:

75

The relatively higher MISSING count compared with Healthcare is expected because Advanced Manufacturing introduces genuinely new technical domains that are not present in UCR.

MISSING does not mean new competency authority.

It means new source instructional content may be required.

## 20. Strongest Direct UCR Reuse

High-confidence UCR reuse includes:

- reliability
- professionalism
- accountability
- communication
- handoffs
- teamwork
- safety culture
- scope / authorization
- reporting hazards
- problem solving
- facts versus assumptions
- decision making
- continuous improvement
- digital responsibility
- responsible AI
- accessibility
- Career Planning
- evidence literacy
- truthful portfolio
- transition planning

These remain transferable authorities.

## 21. Strongest Data Center Technical Reuse

Existing Data Center curriculum provides useful functionally similar patterns for:

- preventive maintenance
- trend analysis
- monitoring
- telemetry
- reliability
- documentation
- escalation
- technical handoffs
- capacity / bottleneck reasoning
- electrical safety boundaries
- synthetic technical scenarios
- evidence-quality reasoning
- completion-versus-competency separation

Examples include:

- `data-center-specialization-11-preventive-maintenance.json`
- `data-center-reliable-operations-10-preventive-maintenance.json`
- `data-center-specialization-11-environmental-monitoring.json`
- `data-center-specialization-11-power-monitoring.json`
- `data-center-specialization-11-reliability-systems-thinking.json`
- `data-center-specialization-12-evidence-quality-defense.json`
- `data-center-specialization-12-runbooks-operational-handoffs.json`
- `data-center-specialization-12-change-risk-escalation.json`

These should be reused for capability patterns where functionally equivalent.

They should not be copied as if manufacturing and data centers are the same domain.

## 22. Electrical Authority Boundary

Manufacturing must not create a second electrical-infrastructure authority.

Existing Data Center electrical curriculum already includes:

- electrical safety
- power quantities
- power paths
- monitoring
- load / capacity
- controlled electrical change

Manufacturing may reference those concepts where relevant.

Machine-context electrical examples do not establish manufacturing ownership of electrical competency.

## 23. Maintenance Authority Boundary

Existing Data Center maintenance content proves that SHU already has safe maintenance-awareness patterns.

Manufacturing may extend those patterns to industrial equipment.

It must not convert readiness into:

- repair qualification
- lockout/tagout qualification
- energized-work qualification
- industrial electrician authority
- equipment-service authorization

## 24. Quality and Metrology Finding

The repository contains general quality language and evidence-quality concepts.

The discovery did not prove a governed manufacturing quality/metrology source curriculum.

Therefore:

- general quality behavior should reuse UCR
- evidence quality should reuse canonical evidence concepts
- manufacturing conformance and metrology content may require new instructional source
- product-release authority must remain external

## 25. CNC Finding

The repository contains Advanced Manufacturing / CNC pathway references.

The discovery did not prove governed CNC source lessons or CNC operational authority.

Therefore CNC readiness should remain:

- conceptual
- workflow-oriented
- safety-bounded
- non-operational

CNC pathway references remain REFERENCE ONLY until canonical source authority is established.

## 26. Automation and Robotics Finding

Robotics assets and general automation concepts exist.

The discovery did not prove a governed manufacturing robotics/automation curriculum.

Therefore manufacturing may create bounded source content for:

- industrial robotics overview
- automation purpose
- sensors / inputs / outputs awareness
- human oversight
- safe escalation

It must not create production programming or controls authority.

## 27. Cleanroom Finding

The Pass 1 audit explicitly found no governed cleanroom readiness curriculum or cleanroom proof configuration.

Therefore cleanroom-specific instructional content is currently MISSING.

Future content must remain:

- awareness-level
- synthetic
- non-qualifying
- non-access-authorizing

## 28. Semiconductor Finding

The Pass 1 audit explicitly found no semiconductor-specific readiness course, fab/wafer source curriculum, semiconductor proof configuration, or validated semiconductor Career mapping.

Therefore semiconductor source content is primarily MISSING or EXTEND.

It must remain contextualized readiness until external or canonical authority establishes more.

## 29. Prepare / Prove Finding

The discovery did not prove manufacturing-specific Prepare / Prove configurations.

Therefore:

- do not fabricate competency IDs
- do not assume manufacturing-specific competencies are required
- audit existing competency definitions first
- audit UCR proof configurations first
- audit technical Data Center proof configurations where functionally equivalent
- reuse existing authority wherever possible

## 30. Candidate Proof Implications

Three primary candidate proof areas remain appropriate:

### Manufacturing Safety / Scope Decision Scenario

Likely reuse:

- Workplace Safety Awareness
- scope / authorization
- problem solving
- decision making
- escalation

### Manufacturing Problem-Solving / Quality Scenario

Likely reuse:

- Problem Solving
- Decision Making
- evidence quality
- documentation
- technical reasoning

Potential extension may be required for manufacturing conformance context.

### Evidence / Career Self-Advocacy Presentation

Strong direct UCR reuse candidate.

No manufacturing-specific self-advocacy competency should be created if UCR is functionally equivalent.

## 31. Source Construction Implication

If approved, future Manufacturing implementation should not mean writing 75 completely independent lessons.

Expected model:

existing UCR
→ existing technical patterns
→ manufacturing contextualization
→ bounded extensions
→ approximately 20 currently identified genuinely missing source objectives
→ canonical evidence / completion / Career systems

The exact number of new physical source files will depend on the composition mechanism chosen during implementation.

## 32. Reference-Only Material

The following must not be treated as curriculum authority:

- pathway fixture records
- CNC career references
- manufacturing eligibility records
- public images
- robotics promotional assets
- archived manufacturing references
- commercial candidate records
- employer/workforce eligibility data

These may assist discovery.

They do not establish training or competency authority.

## 33. Evidence Boundary

The canonical chain remains:

Activity Result
→ Evidence
→ Authorized Review
→ Competency Decision

No Manufacturing lesson, simulation, Arcade activity, or Metaverse scenario may bypass this chain.

## 34. Completion Boundary

Manufacturing uses canonical Completion Policy.

Completion does not automatically establish:

- competency
- CNC qualification
- maintenance qualification
- electrical authorization
- robotics qualification
- cleanroom qualification
- semiconductor fab qualification
- apprenticeship status
- certification
- employer authorization

## 35. Career Boundary

Career mappings must use canonical Career authority.

Manufacturing pathway references must not be treated as validated current Career truth unless canonical Career records establish them.

## 36. Accessibility Boundary

All reused, contextualized, extended, and new lessons must preserve canonical accessibility and accommodation systems.

Technical diagrams, process flows, machine layouts, telemetry, and measurement activities require accessible equivalents.

## 37. Acceptance Gate

This reuse map is ready for approval only if review confirms:

- all 75 lessons have a reuse classification
- classification totals equal 75
- UCR transferable capability is reused
- Data Center technical capability is reused where functionally equivalent
- manufacturing does not duplicate electrical authority
- manufacturing does not duplicate cybersecurity authority
- pathway fixtures remain reference-only
- no competency IDs are fabricated
- cleanroom content remains non-qualifying
- semiconductor content remains non-qualifying
- CNC content remains non-operational
- Prepare / Prove remains canonical
- Career remains canonical
- Completion Policy remains canonical
- evidence candidates remain distinct from verified competency

## 38. Pass 2 Artifact Relationship

Manufacturing Pass 2 sequence:

1. `ADVANCED_MANUFACTURING_SEMICONDUCTOR_READINESS_SOURCE_CURRICULUM_PLAN.md`
2. `ADVANCED_MANUFACTURING_SEMICONDUCTOR_READINESS_LESSON_REUSE_MAP.md`
3. `ADVANCED_MANUFACTURING_SEMICONDUCTOR_READINESS_PROOF_ACTIVITY_PLAN.md`
4. `ADVANCED_MANUFACTURING_SEMICONDUCTOR_READINESS_PASS_2_IMPLEMENTATION_WORK_ORDER.md`

Artifact 1 exists as an uncommitted planning document.

This document is Artifact 2.

Implementation remains blocked.

## 39. Current Decision

ADVANCED MANUFACTURING & SEMICONDUCTOR PASS 2 LESSON REUSE MAP — DRAFT FOR REVIEW

Current architecture decision:

REUSE UCR
→ REUSE FUNCTIONALLY EQUIVALENT TECHNICAL CONTENT
→ CONTEXTUALIZE FOR MANUFACTURING
→ EXTEND WHERE INDUSTRY WORKFLOW REQUIRES IT
→ BUILD NEW ONLY WHERE SOURCE CONTENT IS PROVEN MISSING

No implementation is authorized by this document.
