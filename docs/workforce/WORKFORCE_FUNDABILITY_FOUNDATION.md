# Workforce / Fundability Foundation (Phase 6.5)

Programs are configuration and contracts on shared infrastructure, not course-specific software platforms.

Funding relationships describe potential alignment; they do not establish eligibility or guarantee funding.

Build the platform once and plug programs into it later. Authorities stay separate, and coordination is shared.

Code: `apps/shs-api/src/domain/workforce-foundation/`. Acceptance: `apps/shs-api/tests/workforce-fundability-foundation.test.ts`.

## Workforce journey and authority split

**Journey:** Explore → Learn → Practice → Simulate → Demonstrate → Verify → Connect → Qualify → Work → Advance.

| Stage | Authority |
|---|---|
| Learn | Curriculum |
| Practice | Learning Arcade (Phase 6 Arcade Integration Fabric) |
| Simulate / Perform | Missions and Metaverse (Mission Runtime, MOL) |
| Prove | Evidence and the Truth Spine |
| Connect | Career Center (Careers registry, opportunities) |
| Qualify | External training, apprenticeship and credential authorities |
| Work | Employer |
| Fund / Coordinate / Scale | Funding Registry plus BOS |

## What already existed (audit)

| Structure | Authority | Decision |
|---|---|---|
| `programs` (migrations 002, 032): org-scoped operational Program with status and owner/operator/accountable organizations | Programs | REUSE as the optional `operationalProgramId` binding. Do not duplicate. |
| `program_careers`, `careers`, `career_families`, `competency_definitions` | Career, Prepare & Prove | REUSE by reference |
| `curriculum_courses` / units / lessons | Curriculum | REUSE by reference (id, title, status only) |
| Arcade Experience Descriptors and the Phase 6 Fabric | Arcade | REUSE through `ArcadeIntegrationService.describeCapabilities` |
| Published Mission catalog (exact version) | Mission Content | REUSE |
| MOL System Registry with `MOL_CAPABILITY_MATURITY` | MOL | REUSE the maturity vocabulary and system maturity |
| `credential_definitions` (INTERNAL/EXTERNAL, `issuing_authority`) | Credentials | REUSE by reference |
| `organizations`, `organization_relationships` (INCUBATES, NETWORK_MEMBER_OF, OPERATES_FOR, SHARED_SERVICES_PROVIDER_FOR) | Identity / Organization | REUSE organizations. DEFER program partner relationship types. |
| `funding_grants` and `grant_program_allocations` | Funding (awards) | REUSE as VERIFIED evidence of funding. Do not duplicate. |
| `gpa_funding_references` / lineage | Government Program Assurance | REUSE as VERIFIED evidence of funding |
| `service_catalog` / entitlements | Service Catalog | DO NOT DUPLICATE (an org service entitlement is not a program capability) |
| Program Report Profile Registry | Reporting | REUSE through `reportProfileKey` |
| SHS System Registry (software layers) | Platform governance | DO NOT DUPLICATE (layers are not program capabilities) |
| BOS (operating-review report families) | BOS | Contract only. Do not rebuild. |
| Agent Canonical Workforce Capability Matrix | Agent Fabric (AI agents) | Unrelated (a "digital workforce"). DO NOT DUPLICATE. |

No existing structure represented a workforce program *package*, a program capability vocabulary, potential funding alignment, or integration readiness. Each of these is new. All of them are code-backed configuration; none is a table.

## Persistence decision

**No migration.** The Program, Capability, Funding, Authority and Dependency registries are version-controlled, validated configuration. They follow the precedent of the MOL System Registry, the reporting Program Report Profiles and the Arcade Experience Descriptors, and are reviewed like code.

Each registry lives in a specific place:
- **Program and Funding registries:** `registry/workforce-program-registry.ts`. Production lists are empty until Phase 7 adds the first real package.
- **Capability Registry:** `WORKFORCE_CAPABILITIES`.
- **Authority and Dependency registries:** declared per package and validated.

Invalid entries are rejected and reported, never repaired silently. Per-organization persisted lifecycle state is deferred to Phase 8 (generalization).

The generic fixture `PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION` is test/reference only and is never registered.

## Program Registry and ProgramPackage (Phase 7 precursor)

**Program fields:** `programId`, `name`, `lifecycle`, `programType`, `owningOrganizationId`, `authorityOwner` (required), `geography`, `audience`, and an optional `operationalProgramId`.

**References, each bounded to 24 entries and never copied:**
- `curriculumRefs`
- `arcadeExperienceRefs`
- `missionRefs`, with an exact version
- `metaverseRefs`, as MOL system ids
- `careerRefs`
- `competencyRefs`
- `credentialAuthorityRefs`
- `partnerRefs`
- `reportingRequirements`, by `reportProfileKey`

**Declarations:**
- `capabilityRefs`
- `evidenceRequirements`
- `authorityRefs`
- `fundingRefs`
- `accessibilityRequirements`
- `dependencyRefs`
- `integrationReadiness`
- optional `sensoryRefs` (`soundProfileRef`, `celebrationProfileRef`, `environmentAudioProfileRef`, `sensoryPolicyRef`). These reference Experience Layer profiles, which programs never own or copy; see `docs/experience/SENSORY_EXPERIENCE_FOUNDATION.md`.

## Lifecycle

PLANNED → DESIGN → AUTHORITY_REVIEW → **INTEGRATION_READINESS** → PARTNER_VALIDATION → PILOT_READY → PILOT → ACTIVE, plus SUSPENDED and RETIRED.

This is the package design lifecycle. It is distinct from the operational `programs.status`.

Transition rules:
- The lifecycle advances one forward step at a time, so Integration Readiness always precedes Partner Validation.
- Entering PARTNER_VALIDATION requires no readiness gaps.
- PILOT_READY, PILOT and ACTIVE require no gaps, no blocking dependencies and no overstated capability maturity.
- SUSPENDED is reachable from PARTNER_VALIDATION, PILOT_READY, PILOT or ACTIVE. Resuming to PILOT or ACTIVE is allowed only when readiness is not BLOCKED.
- RETIRED is terminal.

## Capability Registry and maturity

There are 14 capabilities, each naming its providing authority:

| Capability | Provided by |
|---|---|
| CURRICULUM_DELIVERY | Curriculum |
| LEARNING_ARCADE | Arcade Integration Fabric |
| MISSION_SIMULATION | Mission Runtime |
| MULTIPLAYER | Mission Team |
| METAVERSE_ENVIRONMENT | MOL |
| EVIDENCE_CAPTURE | Verified Evidence |
| CAREER_MAPPING | Careers |
| EMPLOYER_CONNECTION | Opportunities |
| MENTORING | External partner |
| CREDENTIAL_BRIDGE | Credentials |
| APPRENTICESHIP_BRIDGE | External authority |
| ACCESSIBILITY | Accessibility |
| REPORTING | Reporting |
| MOCC_VISIBILITY | MOCC |

**Maturity reuses MOL's vocabulary:** PLANNED, CONTRACT_DEFINED, SIMULATED, PARTIAL, LIVE, PRODUCTION.

**Honesty rules:**
- PRODUCTION requires a passed `acceptanceRef`.
- A capability that names MOL systems may not exceed those systems' own maturity.
- A capability may not be LIVE or PRODUCTION while a providing system runs a SIMULATED provider.

For example, MOL's `power-grid` system is a SIMULATED provider at CONTRACT_DEFINED maturity. A program therefore cannot honestly declare its power-grid environment above CONTRACT_DEFINED.

## Dependency model

Each dependency declares `dependencyId`, `type`, `required`, `status`, `owner`, `fallback` and `constraints`.

| Field | Values |
|---|---|
| `type` | CAPABILITY, EXTERNAL_AUTHORITY, PARTNER, SYSTEM, CREDENTIALING_BODY, EMPLOYER, FUNDING_SOURCE, METAVERSE_ENGINE, CURRICULUM_PACKAGE, EVIDENCE_WORKFLOW |
| `status` | UNKNOWN, PLANNED, AVAILABLE, DEGRADED, UNAVAILABLE |

A required dependency that is not AVAILABLE **blocks** readiness. An optional dependency that is not AVAILABLE **degrades** readiness (status DEGRADED, with its fallback reported) and never blocks.

## Authority model

Every `authorityRef` answers:
- who owns the truth (`owner`);
- who may read (`mayRead`), request (`mayRequest`) and verify (`mayVerify`);
- who may not control (`mayNotControl`);
- and the authority `levels`: ADVISE, TEACH, SUPERVISE, VERIFY, ISSUE.

ISSUE requires an explicit `issuanceBasis` of LEGAL, CONTRACTUAL or INTERNAL_CREDENTIAL_DEFINITION. An internal (SHF/SHS) authority may only use INTERNAL_CREDENTIAL_DEFINITION.

Credential issuance is never inferred from owning, operating or funding a Program. With no declared issuer, `describeAuthority` reports `NOT_DECLARED` and `owningOrganizationIsIssuer: false`.

- **Credential authority boundary.** SHF/SHS may prepare learners. State-approved or other authorized bodies issue regulated credentials. External authorities are referenced as STATE_APPROVED_TRAINING_PROVIDER, REGISTERED_APPRENTICESHIP_SPONSOR, CREDENTIAL_ISSUER, LICENSING_AUTHORITY or EMPLOYER_QUALIFICATION_PROCESS, with status PLACEHOLDER, IDENTIFIED or CONFIRMED. No credential is invented.
- **Employer authority boundary.** Partners reference existing `organizations` (no duplicate identity), with role EMPLOYER_PARTNER, TRAINING_PARTNER, CREDENTIAL_AUTHORITY, APPRENTICESHIP_SPONSOR, MENTOR_PARTNER, FUNDING_PARTNER or FACILITY_PARTNER. CONFIRMED requires an `agreementRef`. A partner never implies employment or hiring; the employer owns the hiring decision.

## Funding Registry, alignment and architecture

A funding source records:
- `fundingSourceId`, `name`, `jurisdiction`, `authority`, `status`;
- `sourceType`: GRANT, WORKFORCE, EMPLOYER, APPRENTICESHIP, PHILANTHROPY, SPONSORSHIP, INSTITUTIONAL_PURCHASE or COMMERCIAL;
- `eligibleProgramTypes` and `eligibleCostCategories`;
- `matchRequired`: true, false or UNKNOWN;
- `reportingRequirements` and `evidenceRequirements`.

A program's `fundingRefs` carry an alignment of UNKNOWN, POTENTIAL or VERIFIED:
- **VERIFIED** must reference an existing record owned by the funding authorities: a `funding_grants` grant or a `gpa_funding_references` reference. Verification is resolved org-scoped. An unresolvable VERIFIED claim is reported (`verificationResolved: false`); it is never upgraded or erased.
- Every projection carries `eligibilityEstablished: false` and `fundingGuaranteed: false`.

Funding buckets are attached to each capability:
- **SHARED_INFRASTRUCTURE:** core platform, Arcade, MOL, Evidence, Identity, accessibility, reporting.
- **DESTINATION_PROGRAM:** for example, a district, station, hospital or facility.
- **CROSS_DESTINATION_MISSION.**

No billing, accounting, payments or treasury is involved.

## Fundability gate (BUILD / HOLD / REJECT)

`evaluateFundabilityGate` is deterministic and rule-based. It returns reason codes, never scores, odds or rankings.

**Inputs per component:**
- workforce relevance, measurable outcomes, evidence pathway, employer relevance and authority clarity (each MET, PARTIAL, NOT_MET or UNKNOWN);
- implementation risk (LOW, MEDIUM, HIGH or UNKNOWN);
- reuse count across programs (recorded and validated; it never lowers the BUILD bar).

**Derived inputs:**
- funding-lane count: the distinct source types aligned POTENTIAL or VERIFIED;
- blocking dependencies;
- integration readiness.

**Decision rules:**
- **REJECT** when any of these holds:
  - there is no workforce need;
  - there is no measurable outcome;
  - authority is unclear;
  - there is neither an evidence path nor an employer path;
  - risk is HIGH with zero funding lanes.
- **BUILD** requires all of these:
  - every qualitative criterion is MET;
  - there are 3 or more plausible funding lanes (no exception for shared infrastructure or reuse);
  - there are no blocking dependencies;
  - integration is not BLOCKED;
  - risk is LOW or MEDIUM.
- **HOLD** applies otherwise, with every unmet condition listed.

A BUILD decision does not establish eligibility.

## Integration readiness

The checklist has 12 questions:

1. CURRICULUM
2. ARCADE
3. MISSIONS
4. METAVERSE
5. EVIDENCE
6. CAREER
7. EXTERNAL_CREDENTIAL_AUTHORITY
8. ACCESSIBILITY
9. PARTNERS
10. FUNDING_LANES
11. CAPABILITY_MATURITY
12. BLOCKING_DEPENDENCIES

How answers are judged:
- An ANSWERED claim must be backed by references that resolve through their owning authorities. Otherwise it is reported as a GAP with reason DECLARED_ANSWER_UNSUPPORTED.
- NOT_APPLICABLE requires a justification. It is not allowed for ACCESSIBILITY, CAPABILITY_MATURITY or BLOCKING_DEPENDENCIES.

The resulting status is READY, DEGRADED (optional dependencies only) or BLOCKED.

## Connections

- **Curriculum:** course id, title and status. No course content is copied.
- **Arcade Fabric:** experience ids resolve through Phase 6. There is no program-specific Arcade infrastructure.
- **Missions:** exact published versions in the owning organization.
- **MOL / Metaverse:** MOL system ids and MOL's own maturity and mode. Generic contexts (traffic, water, weather, incident, power, data center) are MOL systems, not course engines.
- **Careers:** careers and competencies by id, with `jobEligibilityInferred: false`.

## Evidence and Truth boundaries

Evidence requirements (INDIVIDUAL_DEMONSTRATION, TEAM_PERFORMANCE_CONTEXT, SUPERVISOR_VERIFICATION, EXTERNAL_CREDENTIAL_VERIFICATION) are declarations with `createsEvidence: false`. The Verified Evidence authority decides.

Reporting metrics are either OPERATIONAL_METRIC or VERIFIED_INSTITUTIONAL_TRUTH. The latter is attributed to the Truth Spine and is never verified by this registry.

The foundation never claims:
- grant eligibility or guaranteed funding;
- employment placement;
- credential attainment;
- job readiness;
- economic impact.

## BOS and MOCC

**BOS** can later read readiness, capability maturity, dependency risk, partner readiness and evidence readiness from the foundation's service projections. Nothing in BOS is rebuilt.

**MOCC:** `moccSystemImpact(actor, molSystemId)` is read-only (`controls: []`), aggregate and learner-agnostic. It answers which programs depend on a system, which capabilities and Missions are affected, which funding buckets apply, and who the authority owner is.

## Service (internal; no public routes)

`WorkforceFoundationService` exposes:
- `resolveProgram`
- `describeProgramReadiness`
- `evaluateLifecycle`
- `evaluateFundability`
- `resolveCapabilities`
- `resolveDependencies`
- `describeAuthority`
- `listFundingRelationships`
- `moccSystemImpact`

Packages are visible only to their owning organization. Optional authority reads degrade to `UNAVAILABLE`. The service writes nothing.

## Phase 7 readiness

Phase 7 adds the Silicon Heartland Data Center Community & Workforce Initiative as the first registered `ProgramPackage`:
- its funding sources go in `WORKFORCE_FUNDING_SOURCES`;
- references go to its real curriculum courses, Arcade descriptors, published Missions, MOL systems (power-grid, data-center), careers, competencies, external authorities and partners;
- it uses the existing Data Center program report profile.

No new engine is needed.
