# Construction & Skilled Trades Readiness — Lesson Reuse Map

Status: DRAFT — PARALLEL PASS 2
Branch: `agent/pass2-readiness-construction`
Baseline: `af2faa2`
Stable key: `shu-construction-skilled-trades-readiness`

## 1. Purpose

Map all 75 proposed Construction & Skilled Trades Readiness lessons to existing SHU curriculum and technical authority before source construction.

This is Artifact 2 of 4.

Classifications:

- REUSE
- CONTEXTUALIZE
- EXTEND
- MISSING

This document does not create:

- source lessons
- competency definitions
- competency IDs
- proof configurations
- electrical authority
- HVAC authority
- plumbing authority
- trade licensure
- apprenticeship credit
- equipment qualification

## 2. Evidence Reviewed

Primary transferable source:

`src/content/lessons/shu-universal-career-readiness-student/`

Primary technical reuse sources include:

- `src/content/lessons/data-center-specialization-11-student/`
- `src/content/lessons/data-center-specialization-12-student/`
- `src/content/lessons/data-center-reliable-operations-10-student/`
- `src/content/lessons/data-center-technical-foundations-9-student/`

Planning authorities:

- `CONSTRUCTION_SKILLED_TRADES_READINESS_REUSE_AUDIT.md`
- `CONSTRUCTION_SKILLED_TRADES_READINESS_BLUEPRINT.md`
- `CONSTRUCTION_SKILLED_TRADES_READINESS_SOURCE_CURRICULUM_PLAN.md`
- `READINESS_PARALLEL_PASS_2_MASTER_WORK_ORDER.md`

The repository did not prove an existing governed Construction & Skilled Trades source curriculum.

## 3. Reuse Rules

### REUSE

Existing source substantially teaches the same learner capability.

### CONTEXTUALIZE

Existing capability remains authoritative but construction-specific examples, risks, terminology or workflows are required.

### EXTEND

Existing content covers part of the objective, but additional construction-specific instruction is required.

### MISSING

No functionally equivalent governed source lesson was found.

MISSING does not automatically authorize:

- a new competency
- a new proof configuration
- a new authority
- a new registry
- a migration

## 4. Unit 1 — Construction Industry Foundations

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 1.1 What Construction Is | MISSING | No governed Construction source found | New construction-system orientation needed |
| 1.2 Construction Sectors and Project Types | MISSING | Skilled-trades pathway references only | New project-sector content needed |
| 1.3 Trades, Roles and Project Teams | EXTEND | `ucr-17-roles-responsibilities-shared-goals.json` | Extend to construction owner / designer / contractor / trade roles |
| 1.4 Readiness Versus Qualification | CONTEXTUALIZE | `ucr-53-employer-expectations-preparation-vs-qualification.json`; `ucr-54-training-credentials-work-based-learning-routes.json` | Construction pathway context only |
| 1.5 Construction Readiness Starting Point | CONTEXTUALIZE | `ucr-51-career-exploration-interests-strengths-work-environments.json` | Construction prompts only |

## 5. Unit 2 — Construction Professionalism and Reliability

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 2.1 Reliability on a Jobsite | CONTEXTUALIZE | `ucr-03-reliability-attendance-punctuality.json`; `ucr-31-time-attendance-reliability.json` | Jobsite context |
| 2.2 Crew Communication and Handoffs | CONTEXTUALIZE | `ucr-18-coordination-handoffs-dependencies.json`; `ucr-11-communication-at-work.json` | Trade-handoff context |
| 2.3 Professional Conduct on Site | CONTEXTUALIZE | `ucr-04-professional-conduct-responsibility.json`; `ucr-06-what-professionalism-looks-like.json` | Construction examples |
| 2.4 Accountability and Mistake Reporting | CONTEXTUALIZE | `ucr-08-accountability-ownership-follow-through.json`; `ucr-10-feedback-mistakes-continuous-improvement.json` | Jobsite safety / quality context |
| 2.5 Jobsite Reliability Reflection | REUSE | UCR reliability and professional-responsibility sequence | No new capability required |

## 6. Unit 3 — Construction Safety Culture

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 3.1 Safety Is Everyone's Responsibility | CONTEXTUALIZE | `ucr-21-safety-everyones-responsibility.json`; `ucr-25-building-strong-safety-culture.json` | Construction framing |
| 3.2 Recognizing Jobsite Hazards | EXTEND | `ucr-22-recognizing-hazards-changing-conditions.json` | Add construction hazard categories |
| 3.3 Scope, Authorization and Stop-Work | CONTEXTUALIZE | `ucr-23-scope-authorization-knowing-when-to-stop.json` | Jobsite scope examples |
| 3.4 Reporting Hazards and Near Misses | CONTEXTUALIZE | `ucr-24-reporting-hazards-near-misses-incidents.json` | Construction reporting context |
| 3.5 Construction Safety Decision Scenario | CONTEXTUALIZE | UCR 21–24 plus `ucr-29-make-communicate-verify-decision.json` | Candidate proof context |

## 7. Unit 4 — Plans, Drawings and Specifications Awareness

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 4.1 Why Construction Uses Plans | MISSING | No governed construction-plan source found | New awareness lesson justified |
| 4.2 Drawing Types and Symbols | MISSING | No governed plan-reading source found | New construction drawing lesson justified |
| 4.3 Specifications and Requirements | MISSING | General requirement reasoning exists but no construction source | New construction-specification lesson justified |
| 4.4 Revisions and Controlled Documents | EXTEND | UCR documentation plus Data Center change/documentation patterns | Extend to construction revisions and controlled drawings |
| 4.5 Plan-Reading Decision Exercise | MISSING | Blueprint proposes activity but no governed source exists | New synthetic plan-reading activity justified |

## 8. Unit 5 — Measurement, Layout and Precision Awareness

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 5.1 Why Measurement Matters | EXTEND | Existing technical measurement / telemetry reasoning | Add construction dimensional context |
| 5.2 Units, Fractions and Construction Math | MISSING | No governed construction-math lesson found | New source content justified |
| 5.3 Accuracy, Tolerance and Verification | MISSING | No governed construction tolerance lesson found | New source content justified |
| 5.4 Layout and Reference Points | MISSING | No governed construction-layout source found | New awareness lesson justified |
| 5.5 Measurement Decision Scenario | EXTEND | Existing synthetic technical measurement reasoning | Add construction dimension / tolerance context |

## 9. Unit 6 — Tools, Materials and Equipment Awareness

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 6.1 Hand and Power Tool Categories | MISSING | No governed construction tool curriculum found | New awareness lesson justified |
| 6.2 Construction Materials Overview | MISSING | No governed materials source found | New source lesson justified |
| 6.3 Tool Selection and Scope | EXTEND | UCR scope / authorization authority | Add construction tool-selection context |
| 6.4 Equipment and Heavy Machinery Awareness | MISSING | Pathway/site references only | New awareness lesson justified |
| 6.5 Tool / Equipment Scope Scenario | CONTEXTUALIZE | `ucr-23-scope-authorization-knowing-when-to-stop.json` | Construction equipment scenario only |

## 10. Unit 7 — Construction Workflow and Coordination

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 7.1 From Design to Construction | MISSING | No governed project-lifecycle lesson found | New construction workflow lesson justified |
| 7.2 Sequencing and Dependencies | CONTEXTUALIZE | `ucr-18-coordination-handoffs-dependencies.json` | Trade sequence context |
| 7.3 Trade Coordination | EXTEND | UCR teamwork / dependency concepts; Data Center cross-team collaboration patterns | Add construction-specific multi-trade coordination |
| 7.4 Change, Delay and Escalation | CONTEXTUALIZE | `ucr-34-when-plans-change-lateness-absence-delays.json`; controlled-change patterns | Construction change context |
| 7.5 Construction Workflow Exercise | EXTEND | Existing dependency / coordination reasoning | Add synthetic construction workflow |

## 11. Unit 8 — Quality, Inspection and Documentation Awareness

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 8.1 What Quality Means in Construction | EXTEND | UCR quality expectations plus technical evidence-quality concepts | Construction conformance context required |
| 8.2 Defects and Nonconformance | EXTEND | UCR accountability / quality patterns | Add construction defect/nonconformance context |
| 8.3 Documentation and Traceability | CONTEXTUALIZE | UCR documentation; Data Center technical documentation/change records | Construction records context |
| 8.4 Inspection Roles and Boundaries | MISSING | No governed construction-inspection source found | New authority-boundary lesson justified |
| 8.5 Quality Decision Scenario | EXTEND | Problem solving + evidence-quality patterns | Construction requirement comparison needed |

## 12. Unit 9 — Electrical Systems Awareness

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 9.1 Electrical Systems in Buildings | EXTEND | Data Center electrical-infrastructure source | Add building-construction context |
| 9.2 Electrical Safety Boundaries | REUSE | `data-center-specialization-11-electrical-safety.json` | Safety / authorization boundary is functionally equivalent |
| 9.3 Power, Load and Capacity Awareness | CONTEXTUALIZE | `data-center-specialization-11-power-quantities.json`; `data-center-specialization-12-electrical-load-capacity-headroom.json` | Building context only |
| 9.4 Electrical Coordination With Other Trades | MISSING | No governed construction coordination equivalent found | New construction-specific lesson justified |
| 9.5 Electrical Scope Scenario | CONTEXTUALIZE | Existing electrical safety / escalation patterns | Construction setting only |

## 13. Unit 10 — HVAC and Mechanical Systems Awareness

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 10.1 Building HVAC Purpose | EXTEND | Data Center cooling / HVAC curriculum | Extend beyond data-center facility context |
| 10.2 Airflow and Thermal Concepts | REUSE | `data-center-specialization-11-heat-thermal-fundamentals.json`; `data-center-specialization-11-airflow-management.json` | Core thermal / airflow reasoning reusable |
| 10.3 Mechanical Equipment and Distribution | EXTEND | Existing cooling architecture / mechanical-HVAC source | Add construction building-system categories |
| 10.4 HVAC Coordination With Construction | MISSING | No governed trade-coordination lesson found | New construction-specific lesson justified |
| 10.5 HVAC Scope Scenario | CONTEXTUALIZE | Existing HVAC safety / incident / escalation patterns | Building-project context only |

## 14. Unit 11 — Plumbing and Building Systems Awareness

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 11.1 Plumbing Systems in Buildings | MISSING | Audit did not prove governed plumbing readiness content | New awareness lesson justified |
| 11.2 Water, Drainage and Flow Awareness | MISSING | No governed construction plumbing lesson found | New source content justified |
| 11.3 Plumbing Materials and Components | MISSING | No governed equivalent found | New awareness lesson justified |
| 11.4 Plumbing Coordination With Other Trades | MISSING | No governed construction plumbing-coordination source found | New lesson justified |
| 11.5 Plumbing Scope Scenario | CONTEXTUALIZE | UCR scope / authorization authority | Plumbing scenario over canonical scope reasoning |

## 15. Unit 12 — Building Envelope and Structural Awareness

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 12.1 Structural Systems Overview | MISSING | No governed structural-awareness source found | New lesson justified |
| 12.2 Loads and Support Concepts | MISSING | No governed construction structural source found | New conceptual lesson justified |
| 12.3 Building Envelope Basics | MISSING | No governed envelope source found | New lesson justified |
| 12.4 Moisture and Weather Protection Awareness | MISSING | No governed construction-envelope lesson found | New lesson justified |
| 12.5 Structural / Envelope Decision Scenario | CONTEXTUALIZE | Canonical scope / escalation reasoning | Construction-specific scenario over existing decision authority |

## 16. Unit 13 — Construction Problem Solving

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 13.1 Define the Construction Problem | CONTEXTUALIZE | `ucr-26-define-problem-before-solving.json` | Construction case only |
| 13.2 Facts, Assumptions and Missing Information | REUSE | `ucr-27-facts-assumptions-missing-information.json` | Direct functional reuse |
| 13.3 Generate and Compare Options | CONTEXTUALIZE | `ucr-28-generate-options-compare-tradeoffs.json` | Construction options |
| 13.4 Root Cause and Continuous Improvement | CONTEXTUALIZE | `ucr-30-learn-from-results-improve-process.json`; `ucr-10-feedback-mistakes-continuous-improvement.json` | Construction context |
| 13.5 Construction Problem-Solving Scenario | EXTEND | UCR 26–30 | Integrated construction requirements / scope scenario |

## 17. Unit 14 — Construction Careers and Pathways

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 14.1 Carpentry and General Construction Pathways | EXTEND | UCR Career Planning + skilled-trades pathway references | Canonical Career data required |
| 14.2 Electrical Pathways | EXTEND | UCR Career Planning + electrical pathway references | Canonical Career authority required |
| 14.3 HVAC / Mechanical / Plumbing Pathways | EXTEND | UCR Career Planning + HVAC/plumbing reference concepts | Canonical Career authority required |
| 14.4 Equipment, Inspection and Project Support Pathways | EXTEND | UCR Career Planning + pathway references | Validated Career data required |
| 14.5 Compare Skilled Trades Pathways | CONTEXTUALIZE | `ucr-51` through `ucr-55` | Construction pathway context |

## 18. Unit 15 — Evidence, Portfolio and Transition

| Lesson | Classification | Existing Source / Authority | Decision |
|---|---|---|---|
| 15.1 What Construction Evidence Shows | CONTEXTUALIZE | `ucr-61-from-activity-to-evidence.json`; `ucr-62-what-makes-evidence-strong.json` | Construction artifacts only |
| 15.2 Build a Construction Readiness Portfolio | CONTEXTUALIZE | `ucr-64-building-a-truthful-portfolio.json` | Canonical Portfolio |
| 15.3 Present Skills Without Overclaiming | REUSE | `ucr-65-presenting-skills-without-overclaiming.json` | Direct capability reuse |
| 15.4 Apprenticeship, Training and Next Steps | CONTEXTUALIZE | `ucr-52`, `ucr-53`, `ucr-54`, `ucr-72` | Construction pathway context |
| 15.5 Final Construction Transition Plan | REUSE | `ucr-71` through `ucr-75` | Direct transition-framework reuse |

## 19. Classification Summary

The 75 proposed lessons currently resolve as:

- REUSE: 6
- CONTEXTUALIZE: 26
- EXTEND: 19
- MISSING: 24

Total:

75

The relatively high MISSING count reflects genuinely construction-specific content that was not found as governed source curriculum.

MISSING does not mean new competency authority.

It means new instructional source content may be required.

## 20. Strongest Direct UCR Reuse

High-confidence UCR authority includes:

- reliability
- professionalism
- communication
- teamwork
- coordination
- safety culture
- scope / authorization
- reporting
- problem solving
- facts versus assumptions
- decision making
- continuous improvement
- Career Planning
- evidence literacy
- truthful portfolio
- self-advocacy
- transition planning

These remain transferable authorities.

## 21. Electrical Reuse Finding

The repository contains substantial governed electrical-infrastructure curriculum.

Examples include:

- `data-center-specialization-11-electrical-safety.json`
- `data-center-specialization-11-power-quantities.json`
- `data-center-specialization-11-power-paths.json`
- `data-center-specialization-11-power-monitoring.json`
- `data-center-specialization-12-critical-power-architecture.json`
- `data-center-specialization-12-electrical-monitoring-telemetry.json`
- `data-center-specialization-12-electrical-load-capacity-headroom.json`
- `data-center-specialization-12-controlled-electrical-change.json`
- `data-center-specialization-12-advanced-electrical-infrastructure-project.json`

Construction must reuse this authority where functionally equivalent.

## 22. Electrical Prepare / Prove Finding

The repository contains an existing Grade 12 electrical-infrastructure proof / competency configuration:

`grade12-electrical-infrastructure-critical-power-reliability-analysis`

Construction must audit this and other electrical configurations before creating any new electrical proof authority.

Construction context alone does not justify a second electrical competency.

## 23. HVAC / Mechanical Reuse Finding

The repository contains substantial mechanical/HVAC curriculum.

Examples include:

- `data-center-specialization-11-heat-thermal-fundamentals.json`
- `data-center-specialization-11-airflow-management.json`
- `data-center-specialization-11-cooling-architecture.json`
- `data-center-specialization-11-cooling-capacity.json`
- `data-center-specialization-11-mechanical-hvac-safety.json`
- `data-center-specialization-11-cooling-reliability.json`
- `data-center-specialization-11-thermal-incident-project.json`
- `data-center-specialization-12-airflow-containment-pressure.json`
- `data-center-specialization-12-thermal-load-capacity-headroom.json`
- `data-center-specialization-12-advanced-thermal-infrastructure.json`
- `data-center-specialization-12-advanced-mechanical-hvac-project.json`

Construction must reuse functionally equivalent thermal, airflow, safety, capacity, and escalation capability.

## 24. HVAC Prepare / Prove Finding

The repository contains an existing Grade 12 mechanical/HVAC proof / competency configuration:

`grade12-mechanical-hvac-thermal-capacity-reliability-analysis`

Existing Grade 11 HVAC-related proof activity also includes:

`grade11-mechanical-hvac-thermal-airflow-interpretation`

Construction must audit these before creating any new HVAC proof configuration.

## 25. Plans and Drawings Finding

The discovery did not prove governed construction plan-reading curriculum.

Therefore content around:

- plans
- elevations
- sections
- symbols
- construction drawings
- construction specifications
- revision awareness

is currently primarily MISSING or EXTEND.

Synthetic drawings may be created for instruction.

They must not establish design authority.

## 26. Measurement and Layout Finding

Existing technical curricula contain measurement, telemetry, calculation, and evidence reasoning.

The discovery did not prove governed construction measurement / layout curriculum.

Therefore construction-specific instruction may be needed for:

- construction units
- fractions
- dimensions
- tolerance
- layout concepts
- reference points

This must remain classroom-safe and non-authorizing.

## 27. Tools and Equipment Finding

The discovery did not prove governed Construction source curriculum for:

- hand tools
- power tools
- heavy equipment
- tool selection
- construction equipment categories

Therefore several objectives are MISSING.

New content must remain awareness-level unless separate governed training authority exists.

## 28. Quality Finding

The repository contains transferable quality, accountability, evidence-quality, documentation, and verification concepts.

It does not prove governed construction inspection or construction quality authority.

Therefore Construction should:

- reuse general quality reasoning
- reuse evidence-quality concepts
- add construction conformance context
- preserve inspection authority as external / authorized

## 29. Plumbing Finding

The Pass 1 reuse audit explicitly did not prove governed plumbing readiness content.

Therefore Construction may require new instructional source for:

- plumbing system awareness
- supply / drainage concepts
- component categories
- trade coordination

No plumbing qualification or licensure authority is created.

## 30. Structural Finding

The discovery did not prove governed construction structural-awareness curriculum.

Therefore high-level source content may be required for:

- structural system categories
- basic load-path awareness
- support concepts

No engineering authority is created.

## 31. Building Envelope Finding

The discovery did not prove governed building-envelope readiness source.

Therefore Construction may require new source content for:

- enclosure concepts
- walls / roofs
- weather barriers
- moisture awareness
- weather protection

No inspection or design authority is created.

## 32. Skilled-Trades Pathway References

The repository contains pathway concepts such as:

- HVAC Technician Trainee
- Construction Tech / Site & Drones
- electrical-related skilled-trades references

These remain reference concepts.

They do not automatically establish:

- validated Career truth
- curriculum authority
- apprenticeship availability
- credential requirements
- employer commitments

## 33. Prepare / Prove Rule

Construction-specific Prepare / Prove authority was not proven.

Before creating any proof configuration:

1. audit UCR competency definitions
2. audit electrical competency definitions
3. audit mechanical/HVAC competency definitions
4. audit existing proof configs
5. determine functional equivalence
6. reuse existing authority where sufficient

No competency ID may be fabricated.

## 34. Candidate Proof Implications

Three primary candidate proof areas remain appropriate:

### Construction Safety / Scope Decision Scenario

Likely reuse:

- Workplace Safety Awareness
- scope / authorization
- hazard reporting
- decision making
- escalation

### Construction Problem-Solving / Quality Scenario

Likely reuse:

- Problem Solving
- Decision Making
- facts / assumptions
- documentation
- evidence quality

Construction-specific conformance context may require extension.

### Evidence / Career Self-Advocacy Presentation

Strong direct UCR reuse candidate.

A construction-specific self-advocacy competency should not be created if UCR is functionally equivalent.

## 35. Electrical Authority Boundary

Construction must not create a second electrical-infrastructure authority.

Construction may contextualize:

- building electrical systems
- trade coordination
- safe observation
- escalation

It must not authorize:

- energized work
- live measurements
- panel access
- wiring
- electrical troubleshooting
- electrical inspection

## 36. HVAC Authority Boundary

Construction must not create a second mechanical/HVAC authority.

Construction may contextualize:

- building HVAC purpose
- routing
- space coordination
- trade sequencing

It must not authorize:

- refrigerant handling
- controls modification
- mechanical service
- commissioning
- technician qualification

## 37. Plumbing Authority Boundary

Construction may teach plumbing-system awareness.

It must not establish:

- plumbing licensure
- installation authorization
- inspection authority
- pressure-test authority
- live-system modification authority

## 38. Structural / Design Boundary

Construction may teach awareness of:

- structural systems
- support concepts
- drawings
- specifications
- building envelope

It must not establish:

- architectural authority
- engineering authority
- plan-stamping authority
- structural approval authority
- field-change authority

## 39. Tool / Equipment Boundary

Construction may teach equipment recognition and authorization awareness.

It must not establish:

- forklift qualification
- crane qualification
- aerial-lift qualification
- heavy-equipment qualification
- power-tool authorization

## 40. Evidence Boundary

The canonical chain remains:

Activity Result
→ Evidence
→ Authorized Review
→ Competency Decision

No Construction lesson, simulation, Arcade result, or Metaverse result may bypass this chain.

## 41. Completion Boundary

Construction uses canonical Completion Policy.

Completion does not automatically establish:

- competency
- apprenticeship status
- trade qualification
- licensure
- certification
- equipment authorization
- electrical authorization
- HVAC qualification
- plumbing qualification
- employer authorization

## 42. Career Boundary

Career mappings must use canonical Career authority.

Construction pathway references must not be treated as validated Career truth unless canonical Career records establish them.

## 43. Portfolio Boundary

Construction evidence artifacts must use canonical Portfolio authority where applicable.

No Construction-specific portfolio is permitted.

## 44. Accessibility Boundary

All reused, contextualized, extended, and new lessons must preserve canonical accessibility and accommodation systems.

Special attention is required for:

- plans
- drawings
- diagrams
- measurements
- layouts
- trade maps
- process sequences

Accessible alternatives must preserve the same learning objective.

## 45. Arcade Boundary

Construction Arcade activities may support:

- safety reasoning
- sequencing
- measurement
- quality
- trade coordination
- building-system awareness

Arcade results remain evidence candidates unless canonical policy explicitly authorizes more.

## 46. Metaverse Boundary

Construction Metaverse scenarios may support:

- site orientation
- hazard recognition
- trade coordination
- system awareness
- electrical-room observation
- HVAC mechanical-room observation
- simulated inspections

Metaverse output remains evidence candidate material.

It does not directly establish competency.

## 47. Source Construction Implication

If approved, implementation should not mean creating 75 completely independent lessons from scratch.

Preferred model:

existing UCR
→ existing electrical / HVAC authority
→ construction contextualization
→ bounded extensions
→ approximately 24 currently identified missing source objectives
→ canonical evidence / completion / Career systems

The physical number of new source files will depend on the composition mechanism.

## 48. Reference-Only Material

The following must not be treated as curriculum authority:

- pathway fixture records
- skilled-trades images
- career marketing assets
- site/drone pathway references
- commercial records
- employer-planning records
- Metaverse imagery

They may assist discovery.

They do not establish competency or credential authority.

## 49. No Migration Rule

Nothing in this reuse map proves the need for:

- new competency tables
- new evidence tables
- new construction registries
- new electrical tables
- new HVAC tables
- new Career tables

No database migration is authorized.

## 50. Acceptance Gate

This reuse map is ready for approval only if review confirms:

- all 75 lessons are classified
- classifications total 75
- UCR transferable capability is reused
- Data Center electrical authority is reused where functionally equivalent
- Data Center HVAC authority is reused where functionally equivalent
- no second electrical authority is created
- no second HVAC authority is created
- plumbing remains non-qualifying
- structural content remains non-engineering
- tool / equipment content remains non-authorizing
- no competency IDs are fabricated
- pathway concepts remain reference-only
- Prepare / Prove remains canonical
- Completion Policy remains canonical
- Career remains canonical
- Portfolio remains canonical
- evidence candidates remain distinct from verified competency

## 51. Pass 2 Artifact Relationship

Construction Pass 2 sequence:

1. `CONSTRUCTION_SKILLED_TRADES_READINESS_SOURCE_CURRICULUM_PLAN.md`
2. `CONSTRUCTION_SKILLED_TRADES_READINESS_LESSON_REUSE_MAP.md`
3. `CONSTRUCTION_SKILLED_TRADES_READINESS_PROOF_ACTIVITY_PLAN.md`
4. `CONSTRUCTION_SKILLED_TRADES_READINESS_PASS_2_IMPLEMENTATION_WORK_ORDER.md`

Artifact 1 exists as an uncommitted planning document.

This document is Artifact 2.

Implementation remains blocked.

## 52. Current Decision

CONSTRUCTION & SKILLED TRADES PASS 2 LESSON REUSE MAP — DRAFT FOR REVIEW

Current architecture decision:

REUSE UCR
→ REUSE FUNCTIONALLY EQUIVALENT ELECTRICAL / HVAC AUTHORITY
→ CONTEXTUALIZE FOR CONSTRUCTION
→ EXTEND WHERE CONSTRUCTION WORKFLOW IS GENUINELY DIFFERENT
→ BUILD NEW ONLY WHERE SOURCE CONTENT IS PROVEN MISSING

No implementation is authorized by this document.
