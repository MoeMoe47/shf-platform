# Workforce Program Integration Contract (Phase 8)

ProgramPackages coordinate canonical authorities; they do not replace them.

A workforce program may add content, mappings and configuration without creating a new engine when a shared platform capability already exists.

Program completion does not establish verified mastery, credential attainment, career eligibility, funding eligibility, employment eligibility or institutional truth.

A future workforce program is **content + configuration + references + validation**, not a new software platform.

| | Path |
|---|---|
| Code | `apps/shs-api/src/domain/workforce-foundation/` |
| Acceptance | `apps/shs-api/tests/workforce-program-integration-contract.test.ts` |
| Plug-in guide | `docs/workforce/WORKFORCE_PROGRAM_PLUGIN_GUIDE.md` |

No migration was added; the latest is still 156.

## Contract decision

There is no parallel model. The existing `ProgramPackage` was extended in place and is now **schemaVersion 2**. Stable field names are kept: each flat `*Refs` field is a section of the contract.

| Section | Field |
|---|---|
| identity / ownership / programProfile | `program` (`programId`, `name`, `owningOrganizationId`, `authorityOwner`, `programType`, `geography`, `audience`, `operationalProgramId`, `executionLevel`) |
| lifecycle | `program.lifecycle` (requested state) |
| curriculum | `curriculumRefs` (`courseId` or `courseStableKey`) |
| career / competencies | `careerRefs`, `competencyRefs` |
| arcade | `arcadeExperienceRefs` |
| missions | `missionRefs` (exact `missionVersion`, optional `roleRequirements`, `worldCapabilities`) |
| metaverse / mol | `destinationRefs`, `metaverseRefs` |
| capabilities | `capabilityRefs` |
| dependencies | `dependencyRefs` |
| evidence | `evidenceRequirements` |
| accessibility | `accessibilityRequirements` |
| sensory | `sensoryRefs` |
| authority / credentials | `authorityRefs`, `credentialAuthorityRefs` |
| partners | `partnerRefs` |
| funding | `fundingRefs` |
| reporting | `reportingRequirements` |
| governance | `governanceRefs` |
| integration readiness | `integrationReadiness` |

### schemaVersion

`schemaVersion` belongs to the package contract only. It is never a Mission, curriculum, descriptor, credential or sensory-profile version.

Validation fails closed on any unsupported version. Version 1 (the former `contractVersion` field) is no longer accepted.

## Reference-only rule

A package stores ids and references only. The validator rejects every unsupported field, and a deep scan fails closed (`PROHIBITED_EMBEDDED_PAYLOAD`) on embedded:
- learner identity or accommodation/diagnosis detail;
- Evidence or Truth facts;
- credential issuance, or career/job/employment eligibility;
- grant awards or financial data;
- Mission runtime or MOL world state;
- lesson or Mission bodies, payloads or scores;
- tokens or secrets.

Validation errors are structured as `{code, path, message}`. The codes are:
- `UNSUPPORTED_SCHEMA_VERSION`
- `PROHIBITED_EMBEDDED_PAYLOAD`
- `UNSUPPORTED_FIELD`
- `DUPLICATE_REFERENCE`
- `BOUNDS_EXCEEDED`
- `REQUIRED`
- `INVALID_VALUE`

## Registration and loader

Each program is a **module** (`registry/program-module.ts`) of plain data:

```
{ package, fundabilityAssessment?, artifactRefs: { arcadeActivityIds, arcadeExperienceIds, missionSources, sensoryProfileIds } }
```

Modules **reference** authority-owned artifacts. They don't contain them, provision them, or carry code: functions, class instances and accessors are rejected. Every artifact ref must exist in its owning canonical registry and be referenced by the package.

`WORKFORCE_PROGRAM_MODULES` is a static allow-list; there is no dynamic loading and no runtime scanning. Today it holds only the Data Center module.

`buildWorkforceRegistry()`:
- loads modules in deterministic `programId` order;
- rejects every entry of a duplicated `programId`;
- rejects unsupported schema versions and malformed modules;
- never coerces an invalid package.

With an explicit argument, it builds exactly what it lists.

## Validation, resolution and readiness pipeline

SCHEMA VALIDATION → REGISTRY RESOLUTION → AUTHORITY VALIDATION → CAPABILITY VALIDATION → DEPENDENCY VALIDATION → INTEGRATION READINESS → PARTNER VALIDATION → PILOT READINESS → (future) ACTIVATE.

### Resolution

`resolveProgramIntegration(actor, programId)` resolves every section read-only through its authority:

| Section | Authority |
|---|---|
| Curriculum | curriculum-catalog |
| Career / competency | Registries |
| Arcade | Phase 6 Fabric, plus the activity row |
| Missions | Published catalog: exact version, roles and world capabilities checked against the published definition |
| Metaverse | Canonical destination registry |
| MOL | MOL System Registry |
| Credentials | `credential_definitions` |
| Partners | Organizations, plus `service_agreements` / `organization_relationships` |
| Funding | `funding_grants` / GPA |
| Reporting | Report profiles |
| Sensory | Experience Layer registry |
| Governance | Repository `docs/*.md`, or ACTIVE service entitlements |

Packages are visible only to their owning organization.

### Validation report

`validateProgramIntegration(actor, programId)` returns a deterministic report. There are no timestamps and no learner data. It has 16 sections:

1. schema
2. references
3. authority
4. capabilities
5. dependencies
6. integrationReadiness
7. executionLevel
8. partners
9. credentials
10. funding
11. reporting
12. accessibility
13. sensory
14. governance
15. lifecycle
16. fundability

Each section has `status`, `issues`, `warnings`, `resolvedRefs` and `unresolvedRefs`. The status vocabulary is RESOLVED, UNRESOLVED, UNAVAILABLE, BLOCKED or DEGRADED.

The report also carries `createsEvidence: false`, `createsCredential: false`, `establishesEligibility: false` and `writes: []`.

## Lifecycle: requested vs evaluated

The path is PLANNED → DESIGN → AUTHORITY_REVIEW → INTEGRATION_READINESS → PARTNER_VALIDATION → PILOT_READY → PILOT → ACTIVE, plus SUSPENDED and RETIRED.

The declared `program.lifecycle` is a **request**. `evaluateProgramLifecycle` returns `requestedState`, `evaluatedState`, `allowed` and `blockingReasons`. The evaluated state is the highest gate readiness supports, never above the request and never silently upgraded.

| Gate | Requires |
|---|---|
| AUTHORITY_REVIEW | A declared program authority |
| INTEGRATION_READINESS | No unresolved internal issuer claim |
| PARTNER_VALIDATION | No readiness gaps, no overstated maturity, no overstated execution level |
| PILOT_READY | No blocking dependencies, required capability requirements met, at least one CONFIRMED partner with an ACTIVE relationship |
| PILOT / ACTIVE | An activation record. None exists in Phase 8, so these are never reached from configuration alone (`ACTIVATION_RECORD_REQUIRED`). |

### Activation concept (read-only)

`evaluateActivation` lists the conditions a future activation needs:
- the package is registered and validates;
- required references resolve;
- the lifecycle allows activation;
- the organization is authorized;
- dependencies meet policy;
- entitlements are present.

It writes nothing (`activationRecord: "NOT_PERSISTED"`).

## Execution levels and provider modes

**Execution levels:**
- **STANDALONE**: approved SIMULATED stand-ins only.
- **HYBRID**: LIVE engines mixed with stand-ins.
- **LIVING_WORLD**: the future regional simulation.

The evaluated level comes from MOL provider modes. A declared level above the evaluated one is `EXECUTION_LEVEL_OVERSTATED`. LIVING_WORLD is `LIVING_WORLD_AUTHORITY_UNAVAILABLE` until a regional simulation authority exists.

**Provider modes** are reused from MOL: LIVE, SIMULATED, HYBRID, TEST, UNAVAILABLE. They describe *how* a capability is supplied. They are not maturity; for example, `maturity: CONTRACT_DEFINED` with `mode: SIMULATED` is valid.

## Capability requirement contract

Each capability declares:
- `capability` (its id);
- `required`;
- `maturity` (current) and `minimumMaturity`;
- `providerAuthority`, which must equal the registered authority;
- `allowedProviderModes`, which never includes UNAVAILABLE;
- `fallbackPolicy`: NONE, SIMULATED_STAND_IN or OMIT;
- `degradationPolicy`: BLOCK or DEGRADE.

Maturity uses MOL's scale. Effective maturity is the declared maturity capped by every providing MOL system. Below the minimum, the result is `MINIMUM_MATURITY_UNMET`. Providing systems must supply the capability in an allowed mode; otherwise the result is `PROVIDER_MODE_NOT_ALLOWED` or `PROVIDER_UNAVAILABLE`.

Unmet requirements **block** only for a required capability with a BLOCK policy. Otherwise they **degrade**.

## Dependency contract

A dependency has `dependencyId`, a category (`type`), an owner authority (`owner`), `required`, `status`, `fallback` and `constraints`. The evaluated result carries `blocking` / `degradesReadiness` and a reason (`REQUIRED_DEPENDENCY_BLOCKING` / `OPTIONAL_DEPENDENCY_DEGRADED`).

- A required dependency that is not AVAILABLE blocks; it never silently degrades.
- An optional dependency degrades; it never blocks.

## Authority integrations

- **Curriculum.** Ids or stable keys only. Lesson bodies are never copied.
- **Career.** Career and competency ids. Projections keep `jobEligibilityInferred: false`.
- **Arcade.** Descriptor refs resolve through the Phase 6 Fabric, and the activity row must exist. The program layer owns no runtime start, result, leaderboard, achievement or Evidence.
- **Mission.** `missionId` plus exact version, with optional role and world-capability requirements checked against the published definition. No "latest" and no implicit upgrades.
- **MOL / Metaverse.** Destination, environment and MOL system ids only. World state, geometry and routes stay with Metaverse and MOL.
- **Evidence.** Requirements only (`createsEvidence: false`): INDIVIDUAL_DEMONSTRATION (individual behavior), TEAM_PERFORMANCE_CONTEXT (team behavior), SUPERVISOR_VERIFICATION, EXTERNAL_CREDENTIAL_VERIFICATION, PERFORMANCE_EVENT, ASSESSMENT_RESULT, REFLECTION, INSTRUCTOR_VERIFICATION. Mission and Arcade create candidates, the Verified Evidence authority verifies, and the Truth Spine receives only authorized verified facts.
- **Credentials.** Statuses are PLACEHOLDER, IDENTIFIED and CONFIRMED; CONFIRMED needs a `credentialDefinitionId` that resolves. An internal ISSUE claim must cite an existing INTERNAL credential definition, or authority review blocks. Program completion, Mission success and Arcade results never issue credentials.
- **Partners.** Categories: EMPLOYER, TRAINING_PROVIDER, COLLEGE, K12, WORKFORCE_BOARD, APPRENTICESHIP, UNION_TRADE_ORGANIZATION, PUBLIC_AGENCY, COMMUNITY_ORGANIZATION, MENTOR, FUNDING_PARTNER, CREDENTIAL_AUTHORITY, FACILITY_PARTNER. CONFIRMED requires a `relationshipRef` to an **ACTIVE** `service_agreements` or `organization_relationships` row linking the two organizations. There is no partner database, and a partner never implies employment.
- **Funding.** Alignment is UNKNOWN, POTENTIAL or VERIFIED; VERIFIED requires a real `funding_grants` or GPA record, otherwise the funding section is BLOCKED. A package never implies an award, eligibility, guaranteed or committed funding, or available cash.
- **Fundability.** The Phase 6.5 gate is unchanged. A module may carry a `fundabilityAssessment` (inputs plus basis); without one, fundability is NOT_ASSESSED, never assumed.
- **Accessibility.** Required platform support only: KEYBOARD, REDUCED_MOTION, REDUCED_SENSORY, NO_AUDIO, CAPTIONS, SCREEN_READER, NO_FLASHING, HAPTICS_OFF, VISUAL_ALERTS. There is never learner accommodation data.
- **Sensory.** `soundProfileRef`, `celebrationProfileRef`, `environmentAudioProfileRef` and `sensoryPolicyRef` are references only. Packages hold no assets, effects or program-owned sensory authority.
- **Reporting.** Report profile keys. OPERATIONAL_METRIC is separate from VERIFIED_INSTITUTIONAL_TRUTH, which belongs to the Truth Spine.

## Ownership

| Program package may own | Platform owns |
|---|---|
| Program configuration, program-specific mapping refs, Mission catalog selection, sensory refs, funding alignment declarations, partner declarations, integration requirements | Identity, authorization, Curriculum, Career, Arcade runtime, Mission runtime, multiplayer, MOL, Evidence verification, Truth Spine, credentials, Funding Registry, reporting, sensory execution, MOCC, BOS, Agent Fabric |

## Canonical program artifact set

A complete program may provide:

1. ProgramPackage
2. curriculum refs
3. Arcade activity refs
4. Arcade descriptor refs
5. Mission refs
6. Metaverse destination refs
7. MOL capability refs
8. career refs
9. competency refs
10. Evidence requirements
11. sensory profile refs
12. accessibility requirements
13. authority declarations
14. partner refs
15. credential refs
16. funding refs
17. reporting refs
18. governance refs

Not every artifact exists at every lifecycle stage.

## BOS and MOCC

**BOS readiness packet** (`bosProgramReadinessPacket`), read-only and advisory. It contains:
- program and lifecycle (requested and evaluated);
- fundability;
- integration readiness, capability maturity and dependencies;
- authority, partner, credential and funding gaps;
- reporting and sensory readiness;
- risk.

**MOCC program packets** (`moccProgramPackets`, per program), bounded aggregates only:
- programId and status (evaluated lifecycle);
- execution level and affected systems;
- required and degraded capabilities;
- blocking dependencies;
- active Mission types (id@version);
- authority owner, sensory profile refs and funding buckets.

There is no learner identity, no health or accommodation detail, and no write or control path.

## No-custom-engine rule and new-engine justification gate

A workforce program may introduce program-specific content and configuration, but it must not create a new runtime engine when an existing platform capability already exists.

Examples:
- **Fire** reuses Mission Runtime, Arcade Runtime, the MOL incident system, Evidence, Sensory and Multiplayer.
- **Healthcare** reuses Mission Runtime, Arcade Runtime, Evidence, Career, Accessibility and Sensory.
- **Water** reuses MOL, Mission Runtime, Arcade, Evidence and Sensory.

How this is enforced:
- Modules are plain data.
- The registry has no per-program branch.
- Tests reject program-specific engine files and special-cased program ids.

A **new engine** is justified only by a genuinely new domain authority. The proposal must show:
- the unique domain authority, and the data/state it alone owns;
- why existing engines cannot represent it;
- event contracts and command contracts;
- audit requirements;
- simulation mode and fallback behavior;
- authority boundaries and lifecycle;
- tests;
- MOCC integration.

No new engine by convenience.

## Persistence

Code-backed configuration remains the cleanest model: packages are versioned, reviewed and statically loaded. Per-organization activation and lifecycle state would be the first real need for persistence. Phase 8 deliberately has no activation record, so no migration is added.

## Examples

**Data Center (real).** `DATA_CENTER_COMMUNITY_WORKFORCE` evaluates honestly:
- lifecycle INTEGRATION_READINESS, execution level STANDALONE, fundability HOLD;
- partners, credential authority and funding remain visible gaps;
- the data-center MOL system is a degraded optional provider.

See `DATA_CENTER_REFERENCE_IMPLEMENTATION.md`.

**Fire & Emergency Services (conceptual, not registered).** It would be:
- a module whose package references fire curriculum stable keys, an emergency-response Learning descriptor and activity, and published incident Missions (exact versions, roles such as incident command and engine company);
- MOL `incident`, `road-traffic` and `ocean-environment` systems at their honest maturity, typically STANDALONE or HYBRID;
- external credential authorities (state certification) as IDENTIFIED;
- partners such as fire departments via ACTIVE relationships;
- a Fire sensory profile.

There is no Fire engine.

**Healthcare / STNA (conceptual, not registered).** It would be:
- a module referencing nurse-aide curriculum, a clinical-skills Learning descriptor and published care Missions;
- careers, competencies and Evidence requirements (INSTRUCTOR_VERIFICATION, EXTERNAL_CREDENTIAL_VERIFICATION);
- the state nurse-aide registry as an external credential authority;
- accessibility requirements;
- a calm sensory policy.

There is no healthcare engine.
