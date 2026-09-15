# MET-3 Learner Unlock Projection

## Executive Result

MET-3 defines and implements the canonical, server-authoritative Learner Unlock Projection for the Silicon Heartland Metaverse.

The system answers:

What can this learner enter, see, or do right now, and why?

The locked flow is:

Authenticated Identity -> Active Organization -> Canonical Membership / Role / Entitlements -> Curriculum / Career / Civic Facts -> Unlock Requirements Evaluator -> Learner Unlock Projection -> Explainable Decision -> Protected Metaverse Entry -> Operational Event -> Evidence Candidate if applicable

The metaverse may project access. It does not create curriculum, career, civic, identity, role, credential, economy, employment, evidence, or verification authority.

## Repository Baseline

| Field | Value |
| --- | --- |
| Repository | `/Users/mikeslate/Projects/shrv1` |
| Branch | `studio-v1-plus-development` |
| Phase HEAD at start | `34024e2fdb1aac065f085ad938c7c74d6ebac130` |
| MET-1 | `docs/metaverse/MET-1_CANONICAL_METAVERSE_ARCHITECTURE.md` |
| MET-2 | `docs/metaverse/MET-2_CITY_DISTRICT_REGISTRY.md` |
| MET-2A | `docs/metaverse/MET-2A_VISUAL_DESIGN_LOCK_ASSET_MAPPING.md` |
| MET-2B | `docs/metaverse/MET-2B_PRESENCE_COMMUNICATION_STUDENT_SAFETY_ARCHITECTURE.md` |

## Canonical Source Authority Audit

| Fact | Repository-local source | Status |
| --- | --- | --- |
| Identity | `apps/shs-api/src/auth/current-user.ts`, auth middleware, production identity contracts | FOUND |
| Organization / tenant | `apps/shs-api/src/auth/organization-context.ts`, `tenant-context.ts` | FOUND |
| Membership | auth memberships plus `apps/shs-api/src/domain/enrollments/repo/enrollment-repo.ts` user/org checks | FOUND |
| Role / permission | `apps/shs-api/src/auth/security-permissions.ts` | FOUND |
| Service entitlement | `apps/shs-api/src/auth/service-entitlement-guard.ts`, service catalog | FOUND |
| Program enrollment | `apps/shs-api/src/domain/enrollments/repo/enrollment-repo.ts` | FOUND |
| Cohort | `apps/shs-api/src/domain/enrollments/model/enrollment.ts` and repo | FOUND |
| Assignments | `apps/shs-api/src/domain/assignments/` | FOUND |
| Curriculum progress/outcomes | `apps/shs-api/src/domain/curriculum/model/learner-result.ts` | FOUND |
| Assessments | curriculum learner outcomes and completion-policy assessment adapters | FOUND |
| Evidence | `apps/shs-api/src/domain/verified-evidence/`, prepare/prove services | FOUND |
| Credentials | `apps/shs-api/src/domain/credentials/model/credential.ts` | FOUND |
| Career pathway/milestones | `apps/shs-api/src/domain/career-pathways/`, journey milestone services | FOUND |
| SHF Civic eligibility/state | Civic routes/domains exist; dedicated eligibility adapter is not yet proven | UNRESOLVED |
| Project/team membership | `apps/shs-api/src/domain/studio-team/service/studio-team-service.ts`, projects | FOUND |
| Accessibility accommodation | `apps/shs-api/src/domain/accessibility-profile/`, accessibility accommodations | FOUND |

No duplicate APIs or persistence tables were invented in MET-3.

## Unlock Projection Contract

Canonical unlock decision fields:

- `unlock_id`: deterministic projection key
- `user_id`
- `organization_id`
- `tenant_id`
- `city_id`
- optional `district_id`
- optional `facility_id`
- optional `activity_id`
- `resource_type`
- `resource_id`
- `access_level`
- `decision`
- `reason_code`
- `reason_text`
- `source_authorities`
- `source_facts`
- `requirements`
- `requirements_satisfied`
- `requirements_remaining`
- optional `next_action`
- `computed_at`
- optional `expires_at`
- `revalidation_policy`
- `projection_version`

Allowed decisions:

| Decision | Semantics |
| --- | --- |
| `AVAILABLE` | Learner may enter or use the resource now under canonical policy. |
| `LOCKED` | Resource exists for the learner, but prerequisites remain unsatisfied. |
| `HIDDEN` | Resource should not be enumerated to the learner in this context. |
| `RESTRICTED` | Resource is limited to authorized role, civic state, staff, org, or policy scope. |
| `ASSIGNED` | Learner may enter because a canonical instructor, assignment, team, or program context assigned it. |
| `COMPLETED_ACCESSIBLE` | Learner may revisit a completed experience if policy allows; this is not verified mastery. |
| `TEMPORARILY_UNAVAILABLE` | Resource is closed, expired, outside its time window, or operationally unavailable. |

## Access Levels

Unlocks are independent scopes, not one boolean:

- `CITY_ACCESS`
- `DISTRICT_ACCESS`
- `FACILITY_ACCESS`
- `ACTIVITY_ACCESS`
- `SIMULATION_ACCESS`
- `SOCIAL_SPACE_ACCESS`
- `CIVIC_SESSION_ACCESS`
- `JOB_SIMULATION_ACCESS`
- `CAREER_EXPERIENCE_ACCESS`

A learner may have district access without every facility/activity being unlocked.

## Unlock Reason Model

Supported reason codes:

- `ENROLLED`
- `ASSIGNED`
- `COURSE_PROGRESS`
- `LESSON_COMPLETE`
- `MILESTONE_REACHED`
- `ASSESSMENT_PASSED`
- `VERIFIED_OUTCOME`
- `CREDENTIAL_VERIFIED`
- `CAREER_PATHWAY_ELIGIBLE`
- `COHORT_MEMBER`
- `TEAM_MEMBER`
- `INSTRUCTOR_GRANTED`
- `CIVIC_ELIGIBLE`
- `ROLE_ALLOWED`
- `SERVICE_ENTITLED`
- `ORGANIZATION_POLICY`
- `PREREQUISITE_MISSING`
- `NOT_ENROLLED`
- `CREDENTIAL_REQUIRED`
- `ASSIGNMENT_REQUIRED`
- `ROLE_RESTRICTED`
- `SERVICE_NOT_ENTITLED`
- `SUSPENDED`
- `REVOKED`
- `EXPIRED`
- `ACTIVITY_CLOSED`
- `CROSS_ORG_DENIED`
- `CLIENT_AUTHORITY_DENIED`
- `CAMERA_AUTHORITY_DENIED`

Reason text is learner-safe and must not reveal private policy notes, hidden instructor notes, private assessment details, internal risk flags, accommodations, protected staff/admin data, or unrelated student data.

## Requirements Model

Requirement operators:

- `ALL_OF`
- `ANY_OF`
- `NONE_OF`

Requirement types:

- membership
- organization
- role
- entitlement
- enrollment
- cohort
- learning path
- course progress
- lesson completion
- assignment
- assessment threshold
- verified evidence
- outcome
- credential
- career pathway milestone
- team membership
- instructor assignment
- civic eligibility
- time window
- organization policy

Requirements are evaluated server-side. Client state and camera coordinates are never authority.

## District Unlock Policy

| District | Category | Policy |
| --- | --- | --- |
| Civic District | `ROLE_GATED` | District orientation may be visible; civic sessions/actions delegate to SHF Civic eligibility/state. |
| Career & Education District | `OPEN_CORE` | Authenticated organization members may see the district; pathway/facility depth may use curriculum/career facts. |
| Data Center District | `PATHWAY_GATED` | District visibility is broad educational context; simulations/facilities require Data Center enrollment, lessons, assignments, or pathway facts. |
| Learning Arcade District | `OPEN_CORE` | Authenticated organization members may see the district; specific challenges may be curriculum gated. |
| Treasury & Commerce District | `ACTIVITY_GATED` | Navigation is projection-only; economy actions remain blocked until canonical economy authority is resolved. |
| Technology & Innovation District | `ACTIVITY_GATED` | District visibility is broad; Studio/team/AI activities may be assignment/team/entitlement gated. |
| Community District | `ACTIVITY_GATED` | District visibility is broad; service-learning activities may be cohort, program, or policy gated. |
| Residential / Student Life District | `OPEN_CORE` | Authenticated organization members may see student-life navigation; social features remain MET-2B policy gated. |
| Public Realm | `OPEN_CORE` | Authenticated organization members may see and enter orientation/public-realm navigation. |

## Facility Unlock Policy

Every MET-2 facility resolves as an independent `FACILITY_ACCESS` projection.

| Facility group | Policy |
| --- | --- |
| Civic facilities | Active organization membership for orientation; session/action entry delegates to SHF Civic. |
| Career & Education facilities | Active organization membership for navigation; credential/pathway-specific actions use canonical career/curriculum/credential facts. |
| Main Data Center, NOC, Power/Electrical, Cooling/Mechanical, SOC, AI Compute | Active organization membership plus Data Center enrollment/program/pathway facts for facility entry. |
| Data Center Training Lab | Active organization membership for live pathway route; deeper activities use curriculum/career requirements. |
| Learning Arcade facilities | Active organization membership for navigation; challenge/activity rules can require course/lesson context. |
| Treasury / Student Economy / Store / Financial Literacy | Active organization membership for projection/navigation; economy transactions remain blocked until canonical authority exists. |
| OAS Center | Active organization membership or public route policy; OAS is not a credential authority. |
| AI / Agent Lab | Future activities may require service entitlement and organization policy. |
| Builder / Studio | Active organization membership; project actions require assignment/team/project facts. |
| Innovation Lab | Active organization membership plus future project/team/assignment rules. |
| Community facilities | Active organization membership; service-learning activities may require program/cohort/policy. |
| Student Hub / Portfolio Access | Active organization membership; social communication follows MET-2B policy, portfolio authority remains external. |
| Public Realm facilities | Active organization membership and accessible non-spatial navigation equivalence. |

Credentials are not required merely to view educational context unless the target resource itself is explicitly credential-gated by canonical credential authority.

## Activity / Simulation Unlock Policy

Activities require deeper rules than visual navigation:

- Learning Arcade challenge: course/lesson or assignment context may be required.
- Data Center simulation: relevant lesson/unit, assignment, and assessment pass may be required.
- Career job simulation: career milestone, assignment, verified skill, or instructor eligibility policy may be required.
- Civic session: SHF Civic eligibility/state is authoritative.
- Project experience: team/project membership may be required.
- Social Commons: MET-2B communication, presence, moderation, and safety policy applies.

Entering a simulation is not equivalent to being qualified for real employment.

## Career Job Simulation Boundary

`METAVERSE_JOB_SIMULATION` is an educational simulation.

It is not:

- employment
- job placement
- payroll eligibility
- real hiring
- professional licensure
- employment certification

Allowed learner-facing phrasing:

“Unlocked because you completed X and reached pathway milestone Y.”

Disallowed phrasing without external canonical authority:

“You are qualified for employment.”

## Verified Mastery Boundary

Locked semantics:

- task completion != assessment pass
- assessment pass != verified outcome
- verified outcome != credential unless credential authority says so
- credential != employment eligibility
- simulation completion != professional qualification

The metaverse consumes these facts. It does not declare them.

## Revocation / State Change

Unlock projections must change when canonical authority changes:

- enrollment removed
- cohort membership revoked
- team removed
- role revoked
- service entitlement revoked
- organization suspended
- user suspended
- credential expired/revoked
- assignment removed
- course closed
- civic eligibility removed

Protected entry boundaries must recheck server-side. The client must not retain stale access indefinitely.

## Explainable Locked State

Examples:

- `AVAILABLE`: “Available because you are enrolled in Data Center Foundations.”
- `LOCKED`: “Complete Lesson 4 and pass the safety assessment to unlock this simulation.”
- `ASSIGNED`: “Your instructor assigned this experience.”
- `RESTRICTED`: “This area is limited to authorized Civic Council participants.”
- `TEMPORARILY_UNAVAILABLE`: “This activity is currently closed.”

Explanations must be useful, short, and safe. They must not expose hidden policy internals or unrelated people’s data.

## Next Action Projection

Locked decisions may include:

- `next_action_type`
- `next_action_resource_id`
- `next_action_label`
- `route_reference`

Supported examples:

- Start prerequisite lesson
- Complete assigned assessment
- Join assigned team
- Request instructor review
- Return when event opens
- Open assignment

No next action is manufactured if the canonical system provides none.

## Camera Integration

Camera is visual navigation only.

| Level | Unlock behavior |
| --- | --- |
| City overview | May show districts regardless of deeper unlocks unless policy says hidden. |
| District view | May show facilities with state indicators. |
| Facility view | May show activities as available/locked/restricted. |
| Activity entry | Requires server-authoritative access check before entry. |

Camera coordinates do not alter decision state.

## UI Projection

Each UI state provides semantic label, icon/state token, explanation, optional next action, and accessible text:

- `AVAILABLE`
- `LOCKED`
- `RESTRICTED`
- `ASSIGNED`
- `TEMPORARILY_UNAVAILABLE`
- `HIDDEN`
- `COMPLETED_ACCESSIBLE`

The UI must not depend on color alone.

## Accessibility

Spatial access and program access are independent.

Authorized learners using non-spatial navigation must reach the same experiences as map/camera users. Unlock contracts support:

- list-based district navigation
- list-based facility navigation
- semantic unlock status
- screen-reader explanation
- keyboard entry
- reduced-motion transition
- accessible next-action link

Do not require drag gestures, precise camera movement, or visual map interpretation.

## Privacy

Unlock projections may expose only what the learner needs to understand access.

Do not expose:

- hidden instructor notes
- private assessment details
- internal risk flags
- private accommodations
- protected staff/admin data
- unrelated student data

## Security

Required controls:

- Forged unlock state: client claims rejected.
- Client-modified route: protected entry rechecks server projection.
- Direct URL bypass: entry requires an allow decision.
- Stale unlock cache: expired projections fail entry and require revalidation.
- Cross-org resource access: denied.
- Revoked membership: restricted.
- Privilege escalation: roles/permissions are canonical.
- Forged credential: only canonical credential facts satisfy credential requirements.
- Forged course completion: only canonical curriculum facts satisfy progress requirements.
- Hidden facility enumeration: hidden/restricted state can suppress enumeration where policy requires.
- Replayed eligibility decision: expiry and protected-entry recheck required.
- Organization suspension: restricted.

Every gated resource must be rechecked server-side at protected entry boundaries.

## Cache / Revalidation Policy

Unlock projection may be cached for performance. Authority remains canonical.

Invalidation/revalidation events:

- enrollment changes
- assignment changes
- lesson completion
- assessment result
- evidence verification
- outcome verification
- credential issuance/revocation
- role changes
- cohort/team changes
- entitlement changes
- organization/user suspension
- civic eligibility change

Do not rely on client cache for authority.

## Operational Event Boundary

Metaverse may emit:

- `metaverse.resource.viewed`
- `metaverse.resource.entered`
- `metaverse.activity.started`
- `metaverse.activity.completed`
- `metaverse.unlock.denied`
- `metaverse.next_action.selected`

These are operational facts. They do not automatically become:

- verified mastery
- outcome
- credential
- employment eligibility
- civic authority

## Minimal Implementation

Added bounded projection contracts under:

`apps/shs-api/src/domain/metaverse/unlocks/`

Files:

- `unlock-contract.ts`
- `unlock-requirements.ts`
- `unlock-policy.ts`
- `unlock-resolver.ts`
- `unlock-explanation.ts`
- `unlock-authority-adapter.ts`

No migration, persistence table, route, credential authority, curriculum authority, career authority, civic authority, or UI was created.

## Validation Coverage

Deterministic tests prove:

1. identity/org context required
2. client cannot grant unlock
3. camera position cannot grant unlock
4. cross-org resource denied
5. district access and facility access are independent
6. activity access requires server decision
7. enrollment can unlock approved learning resource
8. missing prerequisite produces `LOCKED`
9. instructor assignment can produce `ASSIGNED`
10. task completion alone does not create verified mastery
11. simulation completion does not create job eligibility
12. civic access delegates to SHF Civic authority
13. credential requirement uses canonical credential fact
14. revoked membership invalidates access
15. revoked entitlement invalidates gated access
16. suspension invalidates protected entry
17. stale projection requires revalidation
18. locked decision provides safe explanation
19. next action only appears when supported
20. accessible non-spatial route receives same authorization
21. no duplicate curriculum authority
22. no duplicate career authority
23. no duplicate civic authority
24. no duplicate credential authority
25. direct URL cannot bypass protected entry
26. operational events do not create verified outcomes automatically

## P0/P1 Gap Register

P0 gaps:

- None remain for MET-3.

P1 gaps:

| Gap ID | Classification | Description | Disposition |
| --- | --- | --- | --- |
| MET-3-GAP-P1-001 | Missing canonical adapter | Dedicated SHF Civic eligibility adapter is not yet proven in repository code. | Keep civic unlock delegated to SHF Civic; implement adapter in later civic integration phase. |
| MET-3-GAP-P1-002 | Missing implementation dependency | Production invalidation wiring is not implemented. | Future runtime must revalidate on authority-change events. |
| MET-3-GAP-P1-003 | Incomplete next-action integration | Next actions are contractual and exemplar only for MET-3. | Bind to canonical route/action providers when production UI/API is built. |
| MET-3-GAP-P1-004 | Missing persistence/runtime entry enforcement | MET-3 adds pure resolver contracts, not production protected routes. | Future entry APIs must call resolver before protected entry. |

## Repository-Local P0/P1

P0: None.

P1:

- `MET-3-GAP-P1-001` Dedicated SHF Civic eligibility adapter unresolved.
- `MET-3-GAP-P1-002` Production invalidation wiring not implemented.
- `MET-3-GAP-P1-003` Next-action integration remains future UI/API work.
- `MET-3-GAP-P1-004` Production protected entry APIs remain future runtime work.
