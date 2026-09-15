# MET-1 Canonical Metaverse Architecture

## Executive Result

MET-1 defines the Silicon Heartland Metaverse as a bounded educational experience and orchestration domain over existing canonical authorities. It does not create a city UI, district visuals, gameplay engine, economy ledger, credential authority, identity authority, or evidence/truth authority.

The locked top-level flow is:

Identity / Org Context -> Eligible Learning / Career State -> Metaverse Unlock Projection -> City / District / Facility Access -> Task / Simulation -> Operational Event -> Evidence Projection -> Verification -> Portfolio / Skill Profile -> Career Connection / Institutional Reporting

The metaverse may orchestrate experiences and emit governed operational events. It must never directly issue verified credentials, verified mastery, institutional truth, real balances, or official employment claims.

## Repository Baseline

- Repository: `/Users/mikeslate/Projects/shrv1`
- Branch: `studio-v1-plus-development`
- Baseline HEAD: `aa81cf244091420e4d7be9b7759a3c8909e3253c`
- MET-0 audit: `docs/metaverse/MET-0_SYSTEM_WIDE_METAVERSE_CURRENT_STATE_AUDIT.md`
- MET-0 result: `COMPLETE — READY FOR MET-1`

## Canonical Metaverse Authority Map

| Authority | Canonical owner | Metaverse may read | Metaverse may project | Metaverse may write | Metaverse must not own |
| --- | --- | --- | --- | --- | --- |
| Metaverse Experience | Metaverse experience orchestration | Yes | Yes | Yes | No |
| City Registry | Metaverse experience orchestration | Yes | Yes | Yes | No |
| District Registry | Metaverse experience orchestration | Yes | Yes | Yes | No |
| Facility Registry | Metaverse experience orchestration | Yes | Yes | Yes | No |
| Learner Unlock Projection | Metaverse experience orchestration | Yes | Yes | Yes | No |
| Metaverse Task Definitions | Metaverse experience orchestration | Yes | Yes | Yes | No |
| Job Simulations | Metaverse experience orchestration | Yes | Yes | Yes | No |
| Civic Simulations | SHF Civic | Yes | Yes | No | Yes |
| Economy Projection | Unresolved Treasury/economy authority | Yes | Yes | No | Yes |
| Experience Rewards | Metaverse experience orchestration | Yes | Yes | Yes | No |
| Evidence Emission | Verified evidence domain | Yes | Yes | No | Yes |
| Verification | Prepare/Prove verification and Truth domains | Yes | No | No | Yes |
| Portfolio | Portfolio domain | Yes | Yes | No | Yes |
| Reporting | Reporting and Metric Registry domains | Yes | Yes | No | Yes |
| Accessibility | Accessibility profile/effective runtime | Yes | Yes | No | Yes |
| Notifications | Notification domain | Yes | Yes | No | Yes |
| Identity | Identity/auth/org/tenant domains | Yes | No | No | Yes |
| Career Authority | Career pathways, credentials, and career events domains | Yes | Yes | No | Yes |
| Credential Issuance | Credentials domain | Yes | No | No | Yes |

## Canonical Metaverse Domain Boundary

Metaverse owns:

- city, district, and facility experience definitions
- task and simulation definitions
- unlock projection logic
- metaverse session and non-authoritative progress state
- simulation state
- non-authoritative experience rewards
- operational event emission

Metaverse does not own:

- identity, organization membership, roles, or entitlements
- curriculum completion
- career certification or pathway completion
- civic institutional authority
- credentials
- verified evidence
- Truth Spine facts
- reporting metrics
- real financial balances

## City Registry Contract

Future city content must be declarative and non-visual until later phases. The required contract fields are:

- `city_id`
- `version`
- `status`
- `districts`
- `facilities`
- `destinations`
- `activities`
- `access_requirements`
- `career_alignment`
- `curriculum_alignment`
- `civic_alignment`
- `economy_participation`
- `accessibility_alternatives`
- `evidence_capabilities`

The registry may route learners toward Universe, Arcade, Career Center, SHF Civic, Treasury views, and future metaverse activities. It must not redefine the canonical authority of those systems.

## Learner Unlock Contract

Unlock is a read-only projection derived from server-authoritative facts. Client state cannot grant access.

Unlock targets:

- district
- facility
- task
- job simulation
- civic office simulation
- advanced activity

Allowed inputs:

- organization, program, cohort
- course/unit/lesson completion
- milestone
- verified evidence
- credential or certification
- skill profile
- career pathway state
- age/grade policy where applicable
- role or permission for institutional access

Forbidden authority inputs:

- local storage
- query-string claims
- browser flags
- client-submitted mastery
- client-submitted credential claims

## Metaverse Task Contract

Required task fields:

- `task_id`
- `version`
- `title`
- `description`
- `district_id`
- `facility_id`
- `task_type`
- `required_unlocks`
- `curriculum_alignment`
- `career_alignment`
- `civic_alignment`
- `learning_objectives`
- `simulation_inputs`
- `allowed_actions`
- `completion_conditions`
- `evidence_requirements`
- `scoring_rubric_reference`
- `reward_projection`
- `accessibility_equivalent`
- `timeout_retry_policy`
- `safety_constraints`
- `status`

Task completion is an experience outcome. It is not verified mastery unless the verification authority accepts the evidence.

## Job Simulation Contract

Career simulations are educational task bundles aligned to existing career pathway and credential authorities. They must not fabricate real credentials, employment, placement, or employer validation.

Required fields:

- `job_simulation_id`
- `title`
- `pathway_alignment`
- `prerequisite_unlocks`
- `task_bundle`
- `role_boundaries`
- `allowed_actions`
- `evidence_produced`
- `verification_path`
- `portfolio_output`
- `employer_facing_interpretation`
- `simulated_not_employment_disclaimer`
- `status`

Initial role concepts covered by the contract:

- Data Center Technician
- Network Technician
- Facilities / Power Technician
- Cybersecurity Analyst
- Civic Clerk
- Treasury Analyst
- City Planner
- Project Manager
- AI / Autonomous Systems Operator

Employer-facing interpretation must describe governed learning evidence and skill demonstrations only.

## Civic Government Boundary

SHF Civic remains the canonical owner of civic-learning and simulated governance rules. The metaverse may host or visualize SHF Civic-backed experiences:

- simulated elections
- city council participation
- simulated office roles
- proposals
- treasury simulation
- planning exercises
- public works exercises

The metaverse must never imply actual governmental authority, real public office, binding public budgets, or legal civic power.

CivicSure is explicitly excluded from this student metaverse civic boundary. CivicSure remains a separate public-program assurance product and must not be merged into SHF Civic or the simulated city government.

## Economy Boundary

MET-0 found disconnected ledgers and reward systems. MET-1 therefore blocks economy implementation until a canonical economy/Treasury authority is resolved.

| Category | Canonical status | Earned | Displayed | Spent | Transferred | Reset | Reported | Audited |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Experience rewards | Metaverse-owned, non-authoritative | Yes | Yes | No | No | Yes | No | No |
| Learning credits | Unresolved canonical credit authority | Authority required | Projection only | No | No | No | Verified only | Yes |
| SHF dollars | Unresolved Treasury/economy authority | Blocked | Projection only | Blocked | No | No | Blocked until authority | Yes |
| Real-money systems | External finance/compliance authority | No | No | No | No | No | No | Yes |

The metaverse may not assume credits, SHF dollars, or rewards are blockchain tokens. It may not mint, transfer, or spend SHF dollars until the canonical authority is implemented.

## Evidence / Verification Contract

The evidence path is:

Metaverse Task -> Operational Event -> Evidence Candidate -> Evidence/Truth Projection -> Verification -> Portfolio / Skill Profile -> Reporting

Required operational event fields:

- `event_id`
- `event_type`
- `actor_id`
- `organization_id`
- `session_id`
- `city_id`
- `district_id`
- `facility_id`
- `task_id`
- `task_version`
- `timestamp`
- `attempt_id`
- `action_summary`
- `result_summary`
- `evidence_refs`
- `source_system`
- `provenance`
- `accessibility_mode`
- `verification_status`

The metaverse may emit events. It may not self-certify truth. The initial verification status for metaverse-originated evidence candidates is `UNVERIFIED`.

## Metaverse Session Contract

Required session fields:

- `session_id`
- `user_id`
- `organization_id`
- `active_role`
- `active_learning_context`
- `active_pathway`
- `city_id`
- `district_id`
- `facility_id`
- `active_task`
- `unlock_snapshot_version`
- `started_at`
- `updated_at`
- `ended_at`
- `accessibility_preferences_reference`

Session state is bounded experience state. It references canonical identity and active organization context, but it is not an identity, membership, role, entitlement, or credential authority.

## Accessibility Contract

Every metaverse experience must have:

- keyboard-operable path
- screen-reader equivalent
- reduced-motion mode
- non-spatial alternate interaction
- color-independent state
- captions/transcripts for audio/video
- mobile/tablet compatibility
- accessible task equivalent where spatial mechanics are inaccessible

Accessibility alternatives must preserve the learning objective and evidence equivalence where feasible.

## Security / Safety Boundary

Required protections:

- client spoofing
- fabricated unlocks
- fabricated completion
- replay attacks
- duplicate evidence
- cross-organization access
- role escalation
- economy manipulation
- unsafe external links
- unauthorized task execution
- stale unlock snapshots

Unlock snapshots must be versioned and revalidated against server-authoritative facts. Cross-organization access must always be explicit.

## Canonical Architecture Diagram

```text
Identity / Organization
  canonical owner: identity/auth/org/tenant domains
  metaverse: read only
        |
        v
Curriculum / Career / SHF Civic / Economy Authorities
  canonical owner: existing domain authorities
  metaverse: read/project only, economy blocked until resolved
        |
        v
Metaverse Unlock Projection
  canonical owner: metaverse experience orchestration
  source facts: server-authoritative only
        |
        v
City Registry
  canonical owner: metaverse experience orchestration
  scope: city/district/facility definitions, no visual city yet
        |
        v
District / Facility
  canonical owner: metaverse experience orchestration
  scope: access and destination definitions
        |
        v
Task / Job / Civic Simulation
  canonical owner: metaverse for task structure
  civic rules: SHF Civic
  career truth: career/credential authorities
        |
        v
Operational Event
  canonical owner: metaverse emission only
  status: evidence candidate
        |
        v
Evidence
  canonical owner: evidence/truth domains
        |
        v
Verification
  canonical owner: verification/truth domains
        |
        v
Portfolio / Skill Profile
  canonical owner: portfolio/career domains
        |
        v
Reporting
  canonical owner: reporting/metric registry domains
```

## P0 Gap Remediation

| Gap | MET-1 decision | Owner | Resulting contract | Acceptance test | Remaining dependency |
| --- | --- | --- | --- | --- | --- |
| MET-GAP-001 | Metaverse is orchestration, not duplicate authority | Metaverse experience orchestration | Authority map and domain boundary | Canonical domains are `mustNotOwn` | MET-2+ implement against boundary |
| MET-GAP-002 | City/district/facility content uses declarative registry | Metaverse experience orchestration | City registry required fields | Access, alignment, accessibility, evidence fields required | MET-2 creates registry records |
| MET-GAP-003 | Unlocks derive from server-authoritative facts | Metaverse experience orchestration | Learner unlock contract | Client state/local storage cannot grant access | MET-3 implements server projection |
| MET-GAP-004 | Tasks emit events but cannot self-certify truth | Metaverse experience orchestration plus evidence/verification authorities | Task and evidence contracts | Completion != verified mastery | MET-4/MET-9 implement source/event projection |
| MET-GAP-005 | Economy remains separated and unresolved | Unresolved Treasury/economy authority | Economy boundary | Rewards, credits, SHF dollars, and real money remain distinct | MET-6 resolves canonical economy authority |

All MET-0 P0 gaps are resolved architecturally in MET-1. Implementation remains intentionally deferred.

## Implementation Preparation

Created minimal bounded contracts in `apps/shs-api/src/domain/metaverse/model/metaverse-contract.ts` and deterministic contract tests in `apps/shs-api/tests/metaverse-architecture-contract.test.ts`.

No route, controller, persistence layer, migration, visual UI, game engine, district visual, economy transaction, credential issuance, or evidence authority was added.

## Recommended Next Phases

1. MET-2 City and District Registry
2. MET-3 Learner Unlock Projection
3. MET-4 Career Job Simulation Framework
4. MET-5 Civic Government Simulation Integration
5. MET-6 Treasury / Credits / SHF Dollar Economy Authority Resolution
6. MET-7 Data Center District
7. MET-8 Learning Arcade Integration
8. MET-9 Evidence / Portfolio / Verification
9. MET-10 Accessibility / Responsive / Alternate Interaction
10. MET-11 Full City Experience
11. MET-12 System-Wide Acceptance

## Final Verdict

MET-1 establishes the canonical architecture and executable contracts required before implementation begins. The repository is ready for MET-2 if the new deterministic validators, backend typecheck/build, and `git diff --check` pass.
