# Transportation & Commercial Mobility Readiness — Reuse Audit

Status: DRAFT — PARALLEL PASS 1
Branch: agent/readiness-transportation
Baseline: 518dda1
Stable key: `shu-transportation-commercial-mobility-readiness`

## Purpose

Determine what SHU already contains for Transportation & Commercial Mobility Readiness before creating curriculum, services, registries, schemas, competencies, or authorities.

Required rule:

Audit → Identify Canonical Authority → Reuse → Extend → Consolidate Where Necessary → Build New Only When Proven Missing.

## Executive Finding

SHU already contains transportation pathway concepts, CDL references, Universal Career Readiness transportation-contingency material, Metaverse transit and rail context, traffic runtime, a Transit / Wayfinding Hub, and provisional aviation context.

The audit did not prove the existence of a governed cross-industry Transportation & Commercial Mobility Readiness course.

The repository also does not prove authoritative live aviation, rail, transit, fleet, commercial-driving, or roadway-operations authority.

This branch must therefore reuse existing SHU platform authorities and avoid duplicating logistics or regulated-program authority.

## KEEP — CANONICAL

Reuse existing SHU authorities for:

- curriculum catalog and importer
- curriculum release lifecycle
- lesson experience
- assignments
- learner entitlement
- Prepare / Prove
- activity results
- evidence
- authorized review
- competency decisions
- Completion Policy
- Career / Career Family
- credentials
- portfolio
- accessibility and accommodations
- reporting and Truth Spine
- regulated-program classification

Do not create transportation-specific replacements for these authorities.

## REUSE

### Universal Career Readiness

Reuse and contextualize:

- professionalism
- reliability
- attendance
- punctuality
- communication
- transportation contingency planning
- teamwork
- problem solving
- time and task management
- safety culture
- authorization
- documentation
- responsible AI
- accessibility
- ethics
- evidence and self-advocacy
- career planning

### CDL Driver Pathway

Classification: REUSE AS REFERENCE

Existing pathway data includes:

- CDL Driver (Class A)
- CDL-A preparation reference
- DOT Medical reference
- valid-driver-license prerequisite reference

These may support discovery and future mapping.

They do not independently establish:

- CDL eligibility
- CDL permit status
- CDL licensure
- DOT medical qualification
- commercial driving authorization
- employer qualification
- job placement

### CDL Crosswalk

Classification: LEGACY / REFERENCE ONLY

A placeholder CDL crosswalk exists.

It does not prove a complete governed CDL curriculum.

Do not infer course completeness or authority from placeholder mappings.

### Metaverse Transit and Rail

Classification: REUSE / EXTEND

Existing transportation context includes:

- city transit path
- city rail path
- traffic runtime
- transit vehicle concepts
- Transit / Wayfinding Hub
- mobility overlay

These may support future simulation and orientation.

They do not independently establish transit operations authority.

### Aviation Context

Classification: EXTEND — REGULATED / AUTHORITY DEPENDENCY

Existing context includes:

- provisional Airport marker
- aviation operational overlay
- marine / aviation replay domain
- aviation regulated-program classification

The repository explicitly states that no authoritative live aviation operations read source is connected.

Do not represent aviation context as live operational authority.

## CONSOLIDATE

### Logistics and Freight

Logistics & Supply Chain Readiness already owns broader logistics readiness concepts.

Transportation should not duplicate logistics authority for:

- warehouse operations
- inventory
- receiving
- shipping
- supply-chain planning
- container-yard operations
- port logistics
- freight documentation

Transportation may contextualize movement, vehicles, dispatch, and mobility.

Logistics retains logistics-process authority.

### UCR Reliability

Transportation-specific attendance, schedule, and contingency examples should reuse UCR rather than recreate universal reliability competencies.

## EXTEND

Appropriate extension areas include:

- commercial driving readiness
- roadway safety awareness
- vehicle inspection awareness
- fleet operations
- dispatch
- route planning
- transit operations awareness
- bus operations awareness
- fleet maintenance awareness
- rail systems
- railroad operations awareness
- aviation careers
- airport operations awareness
- aircraft-maintenance career awareness
- UAS / drone career awareness
- traffic operations
- mobility systems
- incident coordination
- transportation accessibility
- transportation-specific proof activities

These extensions must reuse canonical SHU platform authorities.

## SAFETY BOUNDARY

Readiness education may include:

- synthetic vehicle inspections
- route planning
- dispatch scenarios
- traffic-system interpretation
- fleet documentation
- safety decision-making
- simulated incidents
- accessibility planning
- career exploration

It must not independently authorize learners to:

- drive commercial motor vehicles
- operate buses
- operate rail equipment
- operate aircraft
- maintain aircraft
- dispatch regulated transportation operations
- control live traffic systems
- perform regulated vehicle maintenance
- operate UAS where external rules or authorization are required
- perform safety-sensitive transportation duties

Those permissions belong to their owning employer, training, licensing, medical, regulatory, or credential authorities.

## CDL BOUNDARY

This course may teach CDL pathway awareness and readiness concepts.

Course completion must not be represented as:

- CDL permit
- CDL license
- CDL road-test qualification
- DOT medical qualification
- commercial driving authorization
- employer driver qualification

External licensing and employer processes own those facts.

## AVIATION BOUNDARY

Aviation remains a regulated domain.

Readiness content may cover:

- airport operations awareness
- aviation career exploration
- aircraft systems at a high level
- maintenance-role awareness
- aviation safety culture
- UAS career awareness

It must not establish:

- pilot certification
- aircraft-maintenance certification
- FAA authorization
- air-traffic-control authority
- airport operations authority
- live aviation dispatch authority

## METAVERSE BOUNDARY

Existing transportation and aviation Metaverse elements may support:

- transit orientation
- traffic scenarios
- rail context
- airport orientation
- route planning
- mobility accessibility
- simulated dispatch
- transportation incident scenarios

Metaverse outputs may generate evidence candidates only.

Do not represent provisional or simulated transportation data as live operations.

## LEGACY / REFERENCE ONLY

Treat the following as reference unless canonical authority is separately proven:

- static CDL wage or growth claims
- static credential claims
- placeholder CDL mappings
- old sales/demo transportation references
- provisional Airport marker
- provisional aviation overlay
- Arcade transportation-themed content
- unrelated uses of the word dispatch

## MISSING

This audit did not prove the existence of:

- governed Transportation & Commercial Mobility Readiness course
- transportation-specific source curriculum
- CDL-readiness source curriculum
- transportation-specific competency definitions
- vehicle-inspection proof configuration
- commercial-driving readiness proof activities
- fleet-operations proof activities
- transit-operations proof activities
- rail-readiness proof activities
- aviation-readiness proof activities
- UAS-readiness proof activities
- authoritative live transit operations feed
- authoritative live rail operations feed
- authoritative live aviation operations feed
- validated transportation career mappings
- employer / operator validation for this course
- approved external credential bridge

These gaps do not authorize duplicate SHU platform systems.

## Career Boundary

Potential career contexts may include:

- CDL Driver
- commercial driver
- transit operator
- bus operator
- dispatcher
- fleet technician
- fleet coordinator
- transportation operations technician
- rail operations pathway
- aircraft maintenance pathway
- airport operations pathway
- UAS / drone pathway
- traffic operations pathway

These remain candidate contexts until canonical Career authority is audited.

Do not fabricate career records or competency IDs.

## Duplicate Authority Prohibitions

This branch must not create a new:

- transportation competency registry
- logistics registry
- evidence engine
- verification authority
- completion engine
- assignment system
- career registry
- credential authority
- CDL licensing authority
- aviation authority
- rail authority
- transit authority
- employer qualification authority
- organization / tenant authority
- entitlement system
- accessibility authority
- Metaverse coordinate authority
- readiness score
- Truth-like reporting system

## Audit Decision

Transportation & Commercial Mobility Readiness is viable as an SHU industry-readiness course.

Current architectural direction:

Universal Career Readiness
→ Transportation & Commercial Mobility contextualization
→ vehicle / fleet / transit / rail / aviation readiness
→ governed learner evidence
→ career connection
→ employer / operator / technical training
→ external licensing, certification, medical qualification, or authorization where applicable

Proceed to blueprint only after preserving these boundaries.
