# MET-11 City Economy Orchestration

## Verdict

MET-11 adds a read-oriented City Economy Orchestration layer for the Silicon Heartland Metaverse. It connects MET-7 mission projection, MET-8 Opportunity Exchange, MET-9 Student Market/Treasury adapter, and MET-10 Work Passport without becoming a duplicate authority.

## Authority Reuse Map

| Area | Canonical authority reused | MET-11 role |
| --- | --- | --- |
| Assignments | `assignments` entitlement and next-work services | Read current assignment context through MET-7 missions. |
| Curriculum/completion policy | curriculum catalog and completion-policy engine | Display requirements and due/blocked status through mission projection. |
| Arcade | Arcade domain plus MET-7 `arcadeRelations` | Recommend practice only when source relations exist. |
| Missions | MET-7 mission projection | Select/recommend/locate missions; no mission truth writes. |
| Opportunities | MET-8 Opportunity Exchange eligibility | Contextual city markers and recommendations for eligible opportunities only. |
| Projects | Studio/project refs via MET-8 awards and MET-10 Passport | Navigate to work; no project execution authority. |
| Evidence | verified-evidence through Passport projection | Show candidate/verified state honestly; no verification writes. |
| Treasury/rewards | MET-9 Treasury adapter | Reflect balance/reward settlement; no balance mutation. |
| Market | MET-9 Student Market | Show listings/orders after learning priorities. |
| Work Passport | MET-10 Passport projection | Read claims/capability graph; no copied Passport facts. |
| Career | career refs via Passport/opportunities/missions | Inform recommendations without inventing job readiness. |
| Protected entry | MET-5 runtime entry service | Fast travel and building entry recheck authorization. |
| Registry/facilities | MET-2 city registry | District pulse, building preview, map destinations. |
| Presence/communication | MET-6 runtime presence/chat | Aggregate counts only; no identity leakage. |
| Notifications | NCA notification domain | Reused for future triggers; MET-11 does not duplicate NCA. |

## Orchestration Principles

MET-11 follows:

`SOURCE AUTHORITY -> SAFE PROJECTION -> ORCHESTRATION DECISION -> EXPERIENCE / NEXT ACTION`

It never follows client state into authority, never turns experience state into institutional fact, and never writes duplicate assignment, mission, opportunity, project, evidence, balance, market, Passport, career, credential, civic, org, or role truth.

## Learning/Economy Loop

Assignment -> Arcade Practice -> Mission -> Opportunity -> Project Work -> Evidence -> SHF Credit reward/payment -> Student Market -> Work Passport -> Career Progression -> Higher-Level Opportunity.

Each arrow is represented as navigation or projection only. The owning domain still decides completion, mastery, eligibility, award, project status, evidence verification, Treasury settlement, market fulfillment, Passport claims, and career progression.

## Program/Enrichment Loop

Program Enrollment -> Program Mission -> Side Mission -> Arcade / Challenge -> Team Activity -> Reward -> Showcase -> Program Progression.

Program Missions and Side Missions remain first-class and do not require a career pathway. Mission chain *sequencing* (e.g. "Meet AI -> Prompt Challenge -> Build Agent -> Showcase") is not a canonical MET-7 concept today — MET-7 exposes missions as a flat, actor-scoped list with `programId`, `assignmentType`, and Arcade relations, but no prerequisite/step ordering. MET-11 therefore projects program/side activity honestly as a flat, source-backed list grouped by program rather than fabricating a chain structure MET-7 does not provide. Adding real chain projection is P1 and depends on MET-7 (or curriculum) first modeling mission sequence as canonical fact; MET-11 must not invent that authority itself.

## Model

`GET /metaverse/orchestration` returns:

- learner/org identity derived from server auth
- program context
- current assignment and recommended Arcade activity
- available/recommended missions
- available/recommended opportunities
- evidence/reward/market/passport/career states
- Guided Next Action
- Daily City Briefing
- district pulses
- opportunity markers
- city events
- building previews
- fast travel destinations
- authority reuse map
- generated/expires timestamps

The projection is derived at request time. No migration was introduced.

## Guided Next Action

Supported action types include assignment continuation, Arcade practice, mission entry/submission, opportunity review/bid, project work/submission, evidence follow-up, reward claim, market visit, Passport view, career path continuation, Program Mission, Side Mission, city event, and no action.

Required fields:

- `action_type`
- `title`
- `summary`
- `reason`
- `source_type`
- `source_ref`
- optional district/facility
- `route_or_destination`
- `priority`
- `is_required`
- `is_available`
- optional `blocked_reason`

The server derives it; the client cannot forge it.

## Priority Rules

1. Required blocking action
2. Active assignment/project deadline
3. Required mission
4. Submission/revision required
5. Awarded opportunity work
6. Evidence/review follow-up
7. Program required activity
8. Available career opportunity
9. Arcade practice recommendation
10. Side Mission/enrichment
11. City event
12. Market/exploration

Optional market activity cannot outrank required learning work.

## Daily City Briefing

The briefing renders only source-backed facts:

- Today: required missions/deadlines
- Opportunities: eligible open opportunities
- City: Program Mission and Side Mission activity
- Economy: Treasury balance/order state through MET-9
- Progress: Passport claims through MET-10

No fake motivational metrics are generated.

## District Pulse

District pulses count only real source-backed data:

- active missions
- eligible open opportunities
- active projects from Passport/project projection
- city events
- market listings
- program activity
- learner-relevant count
- required/next-action flags

## Opportunity Markers

Opportunity markers are generated from MET-8 student-facing opportunities after eligibility evaluation. Ineligible opportunities produce no “available” marker.

## City Events

Events are an experience-layer projection from Program, Mission, Opportunity, Arcade, Market, Career, Civic, Community, or System sources. No standalone canonical event authority exists yet; richer event authority remains P1.

## Building Previews

Building previews show facility name, missions, eligible opportunity count, event/program activity, learner next action, authorized aggregate presence, status, and enter action. They never expose participant identities.

## Fast Travel

Fast travel is navigation only. `POST /metaverse/orchestration/fast-travel` reuses MET-5 `MetaverseEntryService`; it cannot bypass unlock, protected entry, mission/opportunity eligibility, entitlement, org scope, or revoked membership.

## Mini-Map / Non-Spatial Alternative

The frontend adds a compact mini-map with text equivalent district activity and fast-travel controls. Existing location navigator and lists remain available, so map navigation is never the only path.

## Cross-Domain Flows

- Assignment -> Arcade -> Mission: MET-7 assignment/arcade relations are reused; no duplicate assignments or Arcade assignments.
- Mission -> Opportunity: eligible MET-8 opportunities appear only when eligibility says so; no automatic award.
- Opportunity -> Project: accepted work remains MET-8/Studio authority; MET-11 navigates.
- Project -> Evidence: evidence state is reflected from Passport/verified-evidence; no skill is marked verified by MET-11.
- Evidence -> Reward: Treasury settlement is reflected, not mutated.
- Opportunity compensation: payment intent/settlement stays MET-8/MET-9.
- Market: balance/orders/listings are shown after learning priorities; market cannot buy grade, skill, credential, career eligibility, civic authority, or reputation.
- Passport refresh: Passport remains derived; facts are not copied into MET-11 persistence.
- Career: recommendations can reference source-backed career progress only.

## Notifications

MET-11 does not duplicate NCA. Low-urgency items appear in briefing. Actionable future triggers should use the notification domain.

## Presence / Communication

MET-11 reuses MET-6 aggregate presence. No new DM system is introduced.

## Privacy

The projection is org-scoped and learner-scoped. It does not expose private assignment state of other learners, private bids, private Passport reliability facts, contact info, market orders, or protected educational records.

## Accessibility

The frontend includes:

- semantic Next Action
- screen-reader briefing sections
- keyboard buttons for next action, fast travel, mini-map, and building preview
- non-spatial navigator/list alternatives
- mobile layout
- reduced-motion compatibility inherited from the city shell
- non-color text labels for state

## Security

Auth and active organization context are required. Fast travel fails closed through protected entry. Client authority fields are ignored by the runtime entry service and are not sent by the orchestration client.

## Performance

The frontend uses one bounded orchestration projection for HUD state instead of independently loading every domain for orchestration. TTL is one minute; authorization is still rechecked for protected entry.

## Persistence

No migration. Durable MET-11 truth is not persisted. Allowed future UX state is limited to dismissed briefing items, UI preference, last visited district, and navigation preference.

## Browser Acceptance

Automated browser acceptance depends on full learner fixtures across assignment, mission, opportunity, project, Treasury, market, and Passport. Current implementation includes the browser path and frontend assertions. Full multi-domain live journey remains P1 if fixtures are incomplete.

## P0 Gaps

None identified in repository-local implementation.

## P1 Gaps

- richer canonical event authority
- richer recommendation engine
- richer mini-map visuals
- advanced cross-domain invalidation
- multi-user browser fixtures
- student-enterprise integration
- dynamic time-of-day/Living City polish
- sound/ambient systems
- true mission chain/sequence projection (blocked on MET-7 not modeling mission prerequisite/step order yet; see Program/Enrichment Loop)
- no dedicated MET-11 unit tests for org isolation / cross-tenant enumeration / revoked-membership fast-travel denial — these are covered structurally (actor-derived scope only, no client-supplied org/user override anywhere in the orchestration routes) and transitively by MET-3/MET-5/MET-7/MET-8 canonical source tests, but do not have a MET-11-local regression test
