# MET-14 Civic Government + City Operations

## Verdict

MET-14 establishes SHF Civic as the canonical city-level educational civic-government authority for Silicon Heartland. The metaverse consumes SHF Civic through an adapter/projection; it does not own elections, offices, eligibility, ballots, council votes, proposals, or civic records.

## Authority Reuse Map

- Identity, active organization, tenant, roles, and permissions: canonical auth/membership context.
- Curriculum and course prerequisites: curriculum, completion-policy, assignment, enrollment/cohort services where canonical facts exist.
- Civic offices, eligibility, candidacy, elections, ballots, terms, council, proposals, public comment, city projects, and city operations: SHF Civic domain.
- Missions: MET-7 mission projection; civic missions consume SHF Civic facts.
- Opportunity/project handoff: MET-8 Opportunity Exchange and project domain.
- Treasury and credits: MET-9 Treasury/Student Market as read/boundary source only.
- Work Passport: MET-10 projection; civic activity is source-backed experience/evidence candidate, not verified skill by default.
- Orchestration: MET-11 city next-action projection.
- Student Enterprise: MET-12 through MET-8 project/procurement boundary.
- Simulations: MET-13 registry/runtime, including civic budget tradeoff and Data Center operations contexts.
- Communication/moderation: MET-6 rooms and no-DM policy.
- Notifications: NCA notification layer.
- Evidence/portfolio/Truth Spine/reporting: existing evidence/public-approval policies only.

## SHF Civic / CivicSure Boundary

SHF Civic is the authority for student government, student offices, student elections, eligibility, ballots, certification, council operations, proposals, public comment, civic terms, and civic city operations.

CivicSure is not civic-government authority. CivicSure remains government program assurance/cases/reporting infrastructure and is excluded from MET-14 authority, persistence, routes, and metaverse adapters.

## Educational City-Level Boundary

Silicon Heartland civic government is a city-level educational simulation. It does not implement state, federal, national, or real-world election administration. It does not include real voter registration, real parties, endorsements, campaign fundraising, donor targeting, or real public-election authority.

## Neutrality Rules

MET-14 encodes neutral procedure only:

- no candidate recommendation, ranking, favored-candidate indicator, popularity ordering, predictive result, or momentum UI
- no ideology or belief profile
- no partisan scoring
- no viewpoint-based eligibility or reward
- no targeted political persuasion or microtargeting
- no fundraising or paid campaign visibility
- neutral declared ordering: alphabetic by display name for current candidate profiles

## City-Government Model

The first canonical model includes Student Mayor, City Council Representative, and City Clerk office definitions with configurable office type, representation scope, seat count, term length, election method, eligibility policy, description, and responsibilities. Committees remain configurable P1 expansion.

## Representation

Representation scopes are SCHOOL, SCHOOL_DISTRICT, PROGRAM, COHORT, CITY_AT_LARGE, and CIVIC_DISTRICT. Representation is server-derived from active organization and canonical membership/enrollment context; clients cannot self-declare constituency.

## Offices

Offices live in SHF Civic (`shf_civic_offices`). The metaverse office directory is a public-safe projection only.

## Eligibility

Eligibility is derived by SHF Civic from authenticated identity, active organization, student role, civic-course state, representation scope, and conflicting office state. SHF Credits, wealth, market success, political viewpoint, popularity, and hidden reputation scores are disallowed factors.

## Civic Course Connection

The civic flow is: enroll in civic course, learn municipal concepts, complete governed prerequisites, file candidacy, campaign forum, election, council service, city project, reflection/evidence candidate. Course completion does not equal office entitlement.

## Candidacy

Candidate filing is governed by SHF Civic. Students submit statements, platform summaries, priority topics, and artifact references. Approval/decline requires review authority; client-submitted approval is ignored.

## Campaign System and Fairness

Campaign profiles expose equal fields and limits. Candidate exposure is neutral and alphabetic in the current policy. SHF Credits cannot buy visibility. There is no targeting, fundraising, donor list, ideology classifier, or recommendation algorithm.

## Elections, Ballot, Voter Eligibility

Student elections are simulated/institutional elections only. Ballots are generated server-side from the current election, approved candidates, and server-derived voter eligibility. Candidate injection is rejected. Window checks reject early and late voting.

## Ballot Privacy

The migration separates participation (`shf_civic_vote_participation`) from vote choice (`shf_civic_vote_choice_vault`). Public projections, notifications, and ordinary audit events must not expose individual vote choice. Results are aggregate only.

## Certification, Ties, Vacancies

Client-provided results are rejected. Tally and certification are server-derived and governed. Current tie policy is deterministic: RUNOFF_REQUIRED. Terms are source-backed by certified election or governed appointment/special-election source. Expired terms lose council-vote authority.

## Council, Proposals, Council Voting

Council sessions support agendas, minutes, public comment, proposal referral, and council voting. Council votes are separate from election ballots and may be roll-call public. Active office-holder authority is required and duplicate council votes are rejected.

Proposals include city project, budget, infrastructure, program, community, accessibility, sustainability, technology, education, event, and market-policy simulation categories. Transitions are governed; clients cannot forge status.

## Public Comment

Public comment is moderated and supports written accessible alternatives. Moderation is viewpoint-neutral and focused on harassment, threats, private data, impersonation, prohibited content, and spam.

## Budget and SHF Credits

Civic budgets are simulated city allocations. They do not debit learner wallets. SHF Credits cannot buy votes, office, eligibility, council authority, or campaign visibility.

## City Projects and Student Enterprise

Approved civic proposals create a bounded city project path through MET-8 Opportunity Exchange/project authority. Council does not directly award Student Enterprise work unless a future governed procurement simulation explicitly permits it.

## Data Center Connection

Data Center is modeled as a city asset for educational decisions about sustainability, energy use, cooling infrastructure, workforce programming, community impact, and public technology investment. Civic votes do not override technical/safety authority.

## Learning Arcade

Arcade may provide practice for council procedure, budgeting, negotiation, public speaking, and infrastructure tradeoffs. Arcade practice does not grant office, election victory, or civic authority unless a future explicit non-political prerequisite is canonically defined.

## Career Connection and Student Civic Work

Civic participation can describe connections to public administration, planning, project management, communications, technology policy, budgeting, public works, data analysis, accessibility, and community work. It does not imply employment or placement. Student civic jobs/projects route through governed project/opportunity/simulation authority.

## Work Passport

Work Passport may project source-backed civic experience, council service, city project completion, civic program completion, public-speaking projects, and community projects. Holding office or winning an election does not create a verified skill or credential by default.

## Program Support and Side Missions

Programs can package civic course, procedure simulation, council activity, candidate filing, forum, election, council service, city project, and showcase. Real mission sequencing remains P1 where not canonical. Side Missions include accessibility audits, stakeholder interview simulations, neighborhood proposals, budget scenarios, public-space improvements, civic events, sustainability inspection, and public information materials.

## City Operations

City operations are educational/runtime state, not real municipal systems. Initial areas include DATA_CENTER, ACCESSIBILITY, and TECHNOLOGY, with states such as NORMAL, PLANNED, ACTIVE_PROJECT, ATTENTION_REQUIRED, SIMULATED_INCIDENT, and RESOLVED.

## Civic Missions, MET-11, MET-13

MET-7 civic missions consume SHF Civic facts. MET-11 now includes SHF Civic next actions after required academic/project/evidence work, so civic activity does not outrank required learning. MET-13 simulation reuse remains intact through the civic budget tradeoff simulation and Data Center operations simulation.

## Communication, Notifications, Public-Safe Views

Rooms are CIVIC_CHAMBER, PROJECT_ROOM, TEAM_ROOM, and HELP_SUPPORT_ROOM under MET-6 boundaries. Student DMs remain disabled. Notifications reuse NCA and must not favor a candidate. Public-safe views include offices, approved candidate profiles, election schedule, aggregate certified results, office holders, agendas, minutes, proposals, and project status. They omit private voter choice, protected education records, contact info, private eligibility reasons, moderation data, and internal review notes.

## Accessibility

Civic Hall includes keyboard-accessible forms, radio-button ballot controls, semantic fieldsets/legends, screen-reader descriptions, non-color status text, written public-comment alternative, mobile layout, and non-spatial access. Voting does not require drag/drop or precise spatial interaction.

## Privacy / Minor Safety

Candidate profiles omit personal address, phone, email, exact private schedules, and unnecessary personal data. External uncontrolled communication is not introduced.

## Security

Tests cover auth, active org, server-derived identity/constituency/eligibility, CivicSure exclusion, cross-org denial, candidate injection rejection, duplicate/replay voting, early/late voting, private vote choice, server-derived tally/certification, deterministic tie handling, term authority, duplicate council vote rejection, server-derived proposal authors, governed proposal transitions, credit boundaries, public-safe projection, no contact leaks, no DMs, NCA reuse, MET-13 reuse, MET-11 bounded priority, no duplicate civic authority, and ballot audit privacy.

## Persistence

Migration `148_civic_government_city_operations.sql` creates canonical SHF Civic tables:

- `shf_civic_offices`
- `shf_civic_candidacies`
- `shf_civic_elections`
- `shf_civic_vote_participation`
- `shf_civic_vote_choice_vault`
- `shf_civic_terms`
- `shf_civic_proposals`
- `shf_civic_council_sessions`
- `shf_civic_council_votes`
- `shf_civic_public_comments`
- `shf_civic_city_projects`
- `shf_civic_city_operations`

No CivicSure tables are referenced.

All SHF Civic HTTP writes use `DurableShfCivicService` and `ShfCivicRepository`, which scope every read/write by organization and tenant before reaching PostgreSQL. Candidacy filing/review, election creation and lifecycle, ballot participation and protected choice storage, certification, office-term assignment, proposal transitions, council votes, public comments, and city-project references are transaction-scoped. Database uniqueness protects one-person/one-ballot, idempotency, and one council vote per proposal/office holder. Certification locks the election, derives aggregate counts from protected choice hashes, rejects ties from silently assigning a term, and assigns a term only for a unique certified winner.

The metaverse civic adapter remains projection-only. It does not write civic truth, and CivicSure is not imported or queried by any canonical civic path. A new service/repository instance reads the same canonical rows after restart; no civic route depends on process-local stores.

## Browser Acceptance

Manual/browser acceptance was not completed in this pass because no full MET-14 multi-user fixture was available for learner/reviewer/election close/certification/council office-holder handoff. Frontend contract tests verify Civic Hall rendering, office directory, representation/course state, neutral candidate profiles, accessible ballot controls, public-safe vote confirmation, proposal/public-comment surfaces, city operations, SHF Credit boundary, CivicSure exclusion, mobile layout, and absence of partisan/recommendation UI.

## Durable Persistence / Restart Safety

The focused persistence contract covers candidacy round-trip and approval, election lifecycle round-trip, protected ballot participation with duplicate/replay rejection, persisted aggregate tally and certification, source-backed office terms, proposal lifecycle, council vote uniqueness, public comments, and civic project linkage. Ordinary public projections omit vote choice, contact data, and private eligibility reasons; ballot-cast audit payloads contain no choice.

## P0 Gaps

No repository-local P0 is known from the focused implementation and tests. Live migration status remains environment-dependent when `DATABASE_URL` is not configured.

## P1 Gaps

- full multi-user browser fixture for learner, reviewer, election close/certification, office-holder session, and project handoff
- richer committees and parliamentary procedure
- richer multi-school/district fixtures
- advanced public hearing tools
- real mission sequencing authority when canonical sequencing exists
- advanced election methods beyond simple auditable methods
- richer city project implementation and public transparency/reporting
