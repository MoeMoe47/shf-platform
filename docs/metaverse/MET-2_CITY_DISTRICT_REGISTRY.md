# MET-2 City & District Registry

## Executive Result

MET-2 creates the canonical declarative Silicon Heartland city registry for future metaverse experiences.

The registry defines:

City -> Districts -> Facilities -> Destinations -> Future activity/task hooks

No visual city, 3D scene, gameplay, job simulation, Treasury transaction, migration, route, controller, or duplicate authority was created.

## Repository Baseline

- Repository: `/Users/mikeslate/Projects/shrv1`
- Branch: `studio-v1-plus-development`
- Baseline HEAD: `aa81cf244091420e4d7be9b7759a3c8909e3253c`
- MET-0 audit: `docs/metaverse/MET-0_SYSTEM_WIDE_METAVERSE_CURRENT_STATE_AUDIT.md`
- MET-1 architecture: `docs/metaverse/MET-1_CANONICAL_METAVERSE_ARCHITECTURE.md`
- MET-1 contract: `apps/shs-api/src/domain/metaverse/model/metaverse-contract.ts`

## Canonical City

| Field | Value |
| --- | --- |
| City label | Silicon Heartland |
| City ID | `silicon-heartland-city` |
| City count | 1 |
| Scope | Bounded city-scale educational metaverse |
| Real municipal authority | No |
| State/national simulation | No |
| Authorization authority | No |
| Registry mode | Declarative only |

## Registry Counts

| Item | Count |
| --- | ---: |
| Cities | 1 |
| Districts | 9 |
| Facilities | 36 |
| Destinations | 36 |
| Activities/tasks | 0 in MET-2 |

## Districts

| District | Purpose | Status |
| --- | --- | --- |
| Civic District | SHF Civic-backed simulated city government, council, elections, planning, public works, and community development | Active registry |
| Career & Education District | Career Center, curriculum, training, milestones/certifications projection, skill profile, portfolio, and pathways | Active registry |
| Data Center District | Flagship Data Center & AI Infrastructure district for future technical simulations | Active registry |
| Learning Arcade District | Arcade practice, games, simulations, and curriculum-linked play without duplicating Arcade authority | Active registry |
| Treasury & Commerce District | Treasury, credits, SHF dollars, Store, marketplace, financial literacy integration points only | Active registry |
| Technology & Innovation District | OAS, AI, autonomous systems, agent learning, Studio/Builder, and innovation labs | Active registry |
| Community District | Community programs, nonprofit/community initiatives, development, service-learning, incubator concepts | Active registry |
| Residential / Student Life District | Learner home-base/profile concepts without social-network functionality | Active registry |
| Public Realm | Shared spaces, orientation, accessible navigation, events, and public learning | Active registry |

## Universe Relationship

Universe remains the ecosystem navigation shell. It is not the metaverse and is not the city registry.

The city registry is its own bounded backend-domain registry at `apps/shs-api/src/domain/metaverse/registry/city-registry.ts`. Universe may later link into a metaverse entry point, but Universe destination records were not reused as the city registry and no Universe route is treated as a city destination.

## CivicSure Boundary

SHF Civic is the civic-learning/governance authority for student civic simulation alignment.

CivicSure is not placed inside the Civic District, is not used as student civic authority, and remains a separate public-program assurance product.

## Economy Boundary

MET-1 found economy authority unresolved. MET-2 therefore treats Treasury & Commerce as integration points only.

The registry does not create:

- balances
- wallets
- transaction authority
- transfer rules
- SHF dollar issuance
- spending authority
- real-money authority

Economy implementation remains blocked until MET-6 resolves the canonical Treasury/economy authority.

## Identity / Career / Evidence Boundaries

The registry does not duplicate identity, organization, role, entitlement, career pathway, credential, evidence, Truth Spine, portfolio, or reporting authority.

It only declares city content and integration metadata. Unlock decisions remain deferred to MET-3 and must use server-authoritative facts.

## Data Center District

The Data Center District is the most fully specified MET-2 district.

Facilities:

- Main Data Center
- Network Operations Center
- Power & Electrical Facility
- Cooling / Mechanical Plant
- Security Operations Center
- AI Compute Facility
- Data Center Training Lab

Repository alignment:

- `docs/career/records/DATA_CENTER_AI_INFRASTRUCTURE.pathway-record.json`
- `src/content/lessons/data-center-foundations-student/`
- `src/content/lessons/data-center-systems-7-student/`
- `src/content/lessons/data-center-design-8-student/`
- `src/content/lessons/data-center-technical-foundations-9-student/`
- `src/content/lessons/data-center-reliable-operations-10-student/`
- `src/content/lessons/data-center-specialization-11-student/`
- `src/content/lessons/data-center-specialization-12-student/`
- Existing pathway record notes 168 lesson JSON files and 41 prepare-prove proof activities.
- Data Center Technician is recorded as an existing canonical career alignment.
- Network, Electrical, HVAC/Mechanical, Cybersecurity, and Cloud/AI technician roles remain planned/separate career phases, not claimed as existing credentials or jobs.

Future hooks:

- technician job simulation
- networking/fiber operations
- facilities and power reasoning
- cooling/mechanical systems
- physical/cybersecurity operations
- AI/cloud infrastructure
- operations and troubleshooting
- evidence-producing tasks via future metaverse operational events

## Route Inventory

| Destination | District | Facility | Live route | Route status | Canonical owner | Metaverse role | Current implementation status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| City Hall | Civic | City Hall | `/civic.html#/dashboard` | LIVE | SHF Civic | Civic entry/orientation | Real SHF Civic route |
| Council Chamber | Civic | Council Chamber | `/civic.html#/elections` | LIVE | SHF Civic | Simulated elections/council | Real SHF Civic route |
| Clerk Office | Civic | Clerk Office | None | PLANNED | SHF Civic | Future clerk task hook | No dedicated route |
| Planning Department | Civic | Planning Department | `/civic.html#/proposals` | LIVE | SHF Civic | Planning/proposals | Real SHF Civic route |
| Public Works | Civic | Public Works | None | PLANNED | SHF Civic | Future public works hook | No dedicated route |
| Community Development Office | Civic | Community Development Office | None | PLANNED | SHF Civic/community learning | Future community development hook | No dedicated route |
| Career Center | Career & Education | Career Center | `/career.html#/` | LIVE | Career domain | Career navigation | Real Career route |
| Learning Center | Career & Education | Learning Center | `/curriculum.html#/curriculum/learning` | LIVE | Curriculum domain | Learning navigation | Real Curriculum route |
| Credential / Portfolio Center | Career & Education | Credential / Portfolio Center | `/career.html#/portfolio` | LIVE | Portfolio/Career domains | Portfolio projection access | Real Career route |
| Career Pathway Center | Career & Education | Career Pathway Center | `/career.html#/pathways` | LIVE | Career domain | Pathway navigation | Real Career route |
| Main Data Center | Data Center | Main Data Center | None | REGISTRY_ONLY | Metaverse registry plus curriculum/career alignment | Future flagship facility | No city/facility route |
| Network Operations Center | Data Center | Network Operations Center | None | REGISTRY_ONLY | Metaverse registry plus curriculum/career alignment | Future networking hook | No city/facility route |
| Power & Electrical Facility | Data Center | Power & Electrical Facility | None | REGISTRY_ONLY | Metaverse registry plus curriculum/career alignment | Future power/facilities hook | No city/facility route |
| Cooling / Mechanical Plant | Data Center | Cooling / Mechanical Plant | None | REGISTRY_ONLY | Metaverse registry plus curriculum/career alignment | Future cooling/mechanical hook | No city/facility route |
| Security Operations Center | Data Center | Security Operations Center | None | REGISTRY_ONLY | Metaverse registry plus curriculum/career alignment | Future security hook | No city/facility route |
| AI Compute Facility | Data Center | AI Compute Facility | None | REGISTRY_ONLY | Metaverse registry plus curriculum/career alignment | Future AI infrastructure hook | No city/facility route |
| Data Center Training Lab | Data Center | Data Center Training Lab | `/career.html#/pathways/data-center-ai-infrastructure` | LIVE | Career/Curriculum domains | Pathway training entry | Route pattern and pathway record exist |
| Arcade Hub | Learning Arcade | Arcade Hub | `/arcade.html#/dashboard` | LIVE | Arcade domain | Arcade entry | Real Arcade route |
| Simulation Hall | Learning Arcade | Simulation Hall | `/arcade.html#/classical-arcade` | LIVE | Arcade domain | Practice/simulation entry | Real Arcade route |
| Skills Challenge Center | Learning Arcade | Skills Challenge Center | `/arcade.html#/games` | LIVE | Arcade domain | Skills/game catalog | Real Arcade route |
| Treasury | Treasury & Commerce | Treasury | `/treasury.html#/dashboard` | LIVE | Treasury/economy authority unresolved | Treasury projection only | Real Treasury route |
| Student Economy Center | Treasury & Commerce | Student Economy Center | None | PLANNED | Unresolved economy authority | Future projection hook | No canonical economy route |
| Store / Marketplace | Treasury & Commerce | Store / Marketplace | `/store.html#/catalog` | LIVE | Store domain | Store navigation only | Real Store route |
| Financial Literacy Lab | Treasury & Commerce | Financial Literacy Lab | None | PLANNED | Curriculum/economy unresolved | Future learning hook | No dedicated route |
| OAS Center | Technology & Innovation | OAS Center | `/oas.html` | LIVE | OAS public standard | Standards context | Real public route |
| AI / Agent Lab | Technology & Innovation | AI / Agent Lab | None | PLANNED | Future curriculum/metaverse | Future student-safe lab | Existing admin workbench is not this |
| Builder / Studio | Technology & Innovation | Builder / Studio | `/curriculum.html#/studio` | LIVE | Studio/Curriculum domains | Project-building entry | Real Studio route |
| Innovation Lab | Technology & Innovation | Innovation Lab | None | PLANNED | Future metaverse/curriculum | Future project hook | No dedicated route |
| Community Center | Community | Community Center | None | PLANNED | Future community learning | Service-learning hook | No dedicated route |
| Nonprofit Network Center | Community | Nonprofit Network Center | None | PLANNED | Future community learning | Community navigation hook | No dedicated route |
| Program Incubator | Community | Program Incubator | None | PLANNED | Future community learning | Program simulation hook | No dedicated route |
| Student Hub | Student Life | Student Hub | None | REGISTRY_ONLY | Metaverse registry | Safe home-base concept | No social feature created |
| Portfolio / Profile Access | Student Life | Portfolio / Profile Access Point | `/curriculum.html#/curriculum/asl/portfolio` | LIVE | Career/Portfolio domains | Profile/portfolio access | Real Curriculum route |
| Central Plaza | Public Realm | Central Plaza | None | REGISTRY_ONLY | Metaverse registry | Orientation node | No visual route |
| Park | Public Realm | Park | None | REGISTRY_ONLY | Metaverse registry | Public learning/events node | No visual route |
| Transit / Wayfinding Hub | Public Realm | Transit / Wayfinding Hub | None | REGISTRY_ONLY | Metaverse registry | Accessible navigation node | No visual route |

## Future Visual Asset Slots

No images or visual assets were generated in MET-2. The registry reserves stable visual asset slots:

- `district-civic`
- `district-career-education`
- `district-data-center`
- `district-learning-arcade`
- `district-treasury-commerce`
- `district-technology-innovation`
- `district-community`
- `district-student-life`
- `district-public-realm`
- facility-level slots for all 36 initial facilities

Later visual work can map city imagery, district scenes, or facility thumbnails onto these slots without changing registry identity.

## Validator Coverage

`apps/shs-api/src/domain/metaverse/registry/city-registry-validator.ts` validates:

- exactly one canonical city
- unique district IDs
- unique facility IDs
- unique destination IDs
- facility-to-district references
- destination-to-city/district/facility references
- CivicSure exclusion
- Universe is not city registry
- Data Center district exists
- Data Center core facilities exist
- Treasury/Commerce does not create economy authority
- identity/career/evidence/truth/reporting authorities are not duplicated
- accessibility alternative exists for every destination
- planned/registry destinations do not claim live routes
- live destinations use verified route references
- city registry is declarative and not authorization authority

## Repository-Local P0/P1

P0: None introduced by MET-2.

P1:

- Economy authority remains unresolved from MET-1. Treasury & Commerce District must stay projection-only/planned until MET-6 resolves canonical economy authority.
- MET-3 is required before any learner-specific access control can be enforced from the registry.
- Data Center city/facility routes and simulations are intentionally missing until later phases.

## Final Verdict

MET-2 establishes the canonical Silicon Heartland city/district/facility/destination registry as a deterministic backend-domain contract. It is ready for MET-3 learner unlock projection if tests, typecheck, build, and diff checks pass.
