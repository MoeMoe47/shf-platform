# Silicon Heartland Data Center Community & Workforce Initiative — Reference Implementation (Phase 7)

The Data Center reference implementation proves the shared workforce platform. It does not create a Data Center-specific software authority.

Simulation completion does not establish credential attainment, employment eligibility, or verified mastery.

One shared platform → one real ProgramPackage → many canonical authorities → no duplicated systems.

Acceptance: `apps/shs-api/tests/data-center-reference-implementation.test.ts`. No migration was added (the latest is still 156).

## A. Existing Data Center asset map (audit)

| Asset | Path | Authority | Canonical | Maturity | Phase 7 use |
|---|---|---|---|---|---|
| Lesson content: 7 student folders (foundations, systems-7, design-8, technical-foundations-9, reliable-operations-10, specialization-11, specialization-12) | `src/content/lessons/data-center-*-student` | Curriculum (source) | Yes | Content complete; imported per organization | Referenced through the import aggregate |
| Course import aggregate `data-center` | `curriculum-import-source-adapter.ts` | Curriculum | Yes | LIVE import path | `curriculumRefs: [{ courseStableKey: "data-center" }]` |
| Career family and career `career_data_center_technician` | migrations 033/047 | Careers | Yes, seeded | LIVE | `careerRefs` |
| Competency `competency_prepare_prove_monitoring_finding` (domain `data-center-technical-operations`, review required) | migrations 034/048 | Prepare & Prove / Evidence | Yes, seeded | LIVE | `competencyRefs`, `evidenceRequirements` |
| Operational program id `data-center-specialization-11` (+ six Grade 12 tracks) | `programs/service/*` | Programs | Code constant; **no `programs` row is seeded** | PARTIAL | `operationalProgramId` (reported unresolved) |
| Report profile `foundation.data-center-ai-infrastructure-pathway` | `reporting/program-report-profile-registry.ts` | Reporting | Yes | LIVE | `reportingRequirements` |
| MOL `power-grid` (SIMULATED, CONTRACT_DEFINED), `data-center` (UNAVAILABLE, PLANNED), scenario `INFRASTRUCTURE_FAILURE` | `src/system/metaverse/mol` | MOL | Yes | As stated | `metaverseRefs`, Mission world context |
| Destinations `main-data-center`, `cooling-mechanical-plant`, `power-electrical-facility`, `network-operations-center`, `security-operations-center` | `metaverseCanonicalDestinationRegistry.js` | Metaverse | Yes | Presentation | Mission `environmentRefs`, descriptor references |
| Mission world capabilities `POWER_CONTEXT`, `DATA_CENTER_CONTEXT` (and incident, weather) | `mission-content/model/mission-world.ts` | Mission Content | Yes | Contract | Mission `metaverseContext` |
| 4A/4G fixtures `fixture-infrastructure-cooling-response` / `-world-response` | `mission-content/fixtures` | Test fixtures | No (never promoted) | — | Shape reference only |
| Employer validation package and outreach (status PREPARE / NOT REVIEWED) | `docs/career/data-center-employer-validation` | Career Center (process) | Docs only; no organization records | PLANNED | Recorded as a gap; no partner invented |
| Arcade activities, Learning descriptors, published Missions, partners, credentials, funding records for Data Center | — | — | **None existed** | — | Built (activity, descriptor, Mission source) or recorded as a gap |

## B. Data Center authority map

| Domain | Authority | Phase 7 |
|---|---|---|
| Program | `workforce-foundation` ProgramPackage registry (owned by `org_shf_001`) | First registered package |
| Curriculum | curriculum-catalog (import by stable key) | Referenced |
| Career / Competency | careers / competency_definitions | Referenced (seeded) |
| Arcade | arcade_activities + Arcade Experience Descriptor catalog + Phase 6 Fabric | Canonical activity + descriptor |
| Mission / Mission Team | Mission Content (Studio workflow) / Mission Runtime / Phase 5 teams | Canonical Mission source, published per organization |
| MOL / Metaverse | MOL System Registry, destination registry | Referenced, honestly labeled |
| Evidence / Truth | verified-evidence (frozen) / Truth Spine | Non-verified candidates only |
| Credential | credential_definitions, external authorities | None declared (`NOT_DECLARED`) |
| Employer | Employer (hiring) | Not yet identified |
| Funding | funding_grants / GPA references | No records; no claims |
| Accessibility / Sensory | Accessibility preferences / Experience Layer sensory registry | Data Center sensory profile |
| Reporting | Program Report Profile registry | Existing profile |
| BOS | Reads `bosProgramProjection` (read-only) | Contract demonstrated |

## C. Gap classification

| Class | Items |
|---|---|
| REUSE | Career, competency, report profile, MOL systems and scenario, destinations, Mission world capabilities, Phase 6 Fabric, Phase 5 teams, Phase 6.5 contracts |
| CONNECT | Curriculum by stable key; operational program id; sensory profile → ProgramPackage |
| EXTEND | 6.5 `curriculumRefs` accepts `courseStableKey`; Arcade references must have a real activity row; BOS projection; MOCC sensory refs; explicit `buildSensoryRegistry` lists; sound `source` prefixes and `soundAssetStatus`; `buildSensoryEvent` |
| BUILD | Canonical Arcade activity + provisioning; canonical Learning descriptor; canonical Mission source; Data Center sensory profile; ProgramPackage |
| DEFER | Client Mission player; cooling and network MOL systems/capabilities; partners; credential authority; funding sources; operational `programs` row; achievements; leaderboard |
| QUARANTINE | 4A/4G Mission fixtures (shape reference only) |
| DO NOT DUPLICATE | Career/curriculum/Arcade/MOL registries, report profile, Evidence/Truth, identity |

## D. Capability maturity

| Capability | Maturity | Basis |
|---|---|---|
| CURRICULUM_DELIVERY | PARTIAL | Content and import path exist; import is per organization |
| LEARNING_ARCADE | PARTIAL | Descriptor + Fabric launch; no client player |
| MISSION_SIMULATION, MULTIPLAYER | PARTIAL | Real published Mission and team path; no client player |
| METAVERSE_ENVIRONMENT | PLANNED | `data-center` system is PLANNED; `power-grid` is SIMULATED at CONTRACT_DEFINED |
| EVIDENCE_CAPTURE | PARTIAL | Candidates only; verification is the Evidence authority's |
| CAREER_MAPPING | LIVE | Seeded career registry |
| EMPLOYER_CONNECTION, CREDENTIAL_BRIDGE | PLANNED | No partner or issuer |
| ACCESSIBILITY, REPORTING | PARTIAL | Contracts and profile exist |
| MOCC_VISIBILITY | CONTRACT_DEFINED | Read-only projection only |

Mission world contexts:

| Context | Provider |
|---|---|
| POWER_CONTEXT | SIMULATED (allowed explicitly) |
| DATA_CENTER_CONTEXT | UNAVAILABLE (optional; degrades) |
| COOLING_CONTEXT, NETWORK_CONTEXT | No MOL system exists, so none was invented. Cooling is Mission-declared scenario content. |

## ProgramPackage

> **Phase 8:** the package is migrated to `schemaVersion: 2` and registered as `DATA_CENTER_PROGRAM_MODULE`. The generic pipeline still evaluates it at INTEGRATION_READINESS, STANDALONE and HOLD, with partners, credential authority and funding visible as gaps.


`DATA_CENTER_COMMUNITY_WORKFORCE` is defined in `apps/shs-api/src/domain/workforce-foundation/registry/programs/data-center-community-workforce.ts` and registered in `WORKFORCE_PROGRAM_PACKAGES`.

**Lifecycle: `INTEGRATION_READINESS`.**
- Readiness is BLOCKED by honest gaps: PARTNERS, EXTERNAL_CREDENTIAL_AUTHORITY and FUNDING_LANES.
- Required dependencies `dep.employer-validation` (PLANNED) and `dep.client-mission-player` (PLANNED) also block it.
- Partner Validation and Pilot Ready are therefore refused.
- Optional dependencies degrade without blocking: the MOL data-center system, cooling context, credential authority and funding.

## Arcade activity and descriptor

**Activity:** `arcade_activity_data_center_cooling_incident_v1` (slug `data-center-cooling-incident`, SCENARIO, PASSED_FLAG). It is defined in `arcade/catalog/canonical-arcade-activities.ts`.
- It is provisioned into each environment through the Arcade authority, not by migration and not with a fabricated system user. Use `provisionCanonicalArcadeActivity` or `POST /arcade/activities/canonical/:activityId/provision`, which requires `arcade.activity.manage`.
- Provisioning is idempotent and refuses a drifted row or a slug conflict.

**Descriptor:** `experience.learning.data-center-cooling-incident`, in `src/shared/arcade/experience/canonicalArcadeExperienceDescriptors.js`.
- Family `learning`, provenance `canonical_descriptor`.
- References Mission `data-center-cooling-failure-response` at exact version 1.
- Fabric capabilities: MISSION_LAUNCH, MULTIPLAYER, CAREER_LINK, CURRICULUM_LINK, EVIDENCE_CANDIDATE, METAVERSE_CONTEXT, REPLAY. There is no leaderboard (no authoritative score) and no achievements (no store).
- `launchable: true`, because the Fabric launch is real. `playable: false`, because there is no client Mission player. `launch.route` is the existing `/learning` entry surface.

## Mission

`data-center-cooling-failure-response` v1 is in `mission-content/catalog/canonical-mission-sources.ts`. It is source content, published per organization through Studio draft → review → publish. There is no second engine.

**Scenario.** A simulated power event (MOL `INFRASTRUCTURE_FAILURE`) causes a cooling failure.

**Objectives:**

| Role | Objective |
|---|---|
| Facility | Acknowledge the alarm |
| Facility | Diagnose the cooling fault |
| Electrical | Verify the power path |
| Electrical | Confirm backup power |
| Facility | Apply the simulated response |
| Coordinator (optional) | Report status |
| Coordinator (optional) | Escalate |

**Team roles** are simulation roles only:
- FACILITY_TECHNICIAN (required)
- ELECTRICAL_TECHNICIAN (required)
- INCIDENT_COORDINATOR (optional)

A network role is not used because the scenario has no network component.

**Safety notes** state that it is simulation only, with no real procedures, licensure or authority. A scripted shift supervisor is the only character; the Mission Director is off.

## Evidence, credential, partner and funding boundaries

- **Evidence:** a Mission result is a TEAM_PERFORMANCE, non-verified candidate (`isVerifiedEvidence: false`, `individualEvidenceInferred: false`). The seeded competency requires review. A test confirms that no Evidence, competency decision, credential or Truth row is written.
- **Credential:** `NOT_DECLARED`. SHF is never inferred as issuer.
- **Partners:** none. Employer validation outreach is NOT REVIEWED and no organization record exists.
- **Funding:** no funding source records exist, so `fundingRefs` is empty and nothing is POTENTIAL or VERIFIED. Registering POTENTIAL alignment needs an explicit owner decision and, for VERIFIED, a real `funding_grants` or GPA record.

## Fundability result (Phase 6.5 gate, unchanged)

**Decision: HOLD.** Reasons:
- WORKFORCERELEVANCE_PARTIAL
- EMPLOYERRELEVANCE_PARTIAL
- AUTHORITYCLARITY_PARTIAL
- INSUFFICIENT_FUNDING_LANES (0 lanes)
- DEPENDENCIES_NOT_MATURE
- INTEGRATION_NOT_READY

The inputs and their basis are in `DATA_CENTER_FUNDABILITY_ASSESSMENT`. `eligibilityEstablished` is false.

## Sensory profile

The profile is in `src/shared/experience/sensory/profiles/dataCenterSensoryProfile.js` and is registered in the production sensory registry.

**Sounds.** There are 11 **registered sounds with no audio files** (`asset:pending:*`, `soundAssetStatus = PENDING_ASSET`): server room, cooling fans, electrical hum, UPS warning, generator startup, alarm, mission start, escalation, recovery, success and quiet success music.

**Flow:**

| State | Source event | Presentation |
|---|---|---|
| NORMAL | Environment audio profile for `main-data-center` | Ambience, reacting to MOL world events only |
| INCIDENT | MOL `POWER_FAILURE` (the `molEventId` is the source) | CRITICAL_ALERT |
| ESCALATION | Mission `incident-escalated` (role-attributed) | ALERT |
| RECOVERY | MOL `POWER_RESTORED` | Acknowledgement |
| MISSION SUCCESS | Mission success | TIER_3, restrained: no camera, no particles, no flashing |
| Activity mastery | Arcade activity mastery | TIER_2 |

There is no TIER_4 entry: no authoritative milestone source exists, and a TIER_4 claim is rejected.

**Training policy** `policy.data-center-training`: CALM or STANDARD intensity, maximum TIER_3, no camera, no flashing, captions always.

Alerts outrank the success celebration. With no-audio, no-flashing and haptics-off, the alert keeps its signage, a visual alert and a caption.

## Reporting, BOS and MOCC

- **Reporting:** all reporting requirements resolve to `foundation.data-center-ai-infrastructure-pathway`. OPERATIONAL_METRIC is kept separate from VERIFIED_INSTITUTIONAL_TRUTH (owned by the Truth Spine).
- **BOS:** `bosProgramProjection` is read-only. It exposes readiness, fundability, capability maturity, dependency risk, partner readiness and authority clarity.
- **MOCC:** `moccSystemImpact` is read-only. It names the program, MOL systems, affected Missions, authority owner, funding bucket and sensory refs, with no learner identity and no commands.

## Known gaps

- No client Mission player.
- No MOL cooling or network systems, and the `data-center` system has no provider.
- No partner organizations or agreements.
- No external credential authority.
- No funding records.
- No operational `programs` row for `data-center-specialization-11`.
- Curriculum must be imported per organization.
- The canonical activity and Mission must be provisioned and published per environment and organization.

## Phase 8 implications

- Generalize per-organization package instantiation and persisted lifecycle.
- Add program-partner relationship types.
- Provide an admin flow to provision canonical activities and submit canonical Mission sources.
- Ingest the BOS projection.
- Make reusable sensory profiles per destination.

The Data Center package shows that the next program (Fire, STNA, Water…) needs only configuration and canonical content: its own descriptor, Mission source, references and sensory profile. It needs no new engine.
