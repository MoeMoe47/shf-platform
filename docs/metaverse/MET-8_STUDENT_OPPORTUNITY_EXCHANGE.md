# MET-8 Student Opportunity Exchange

## Status

MET-8 adds the canonical Student Opportunity Exchange: discovery, eligibility, student/team bid, sponsor review, award, bounded project/work handoff, work submission, evidence-candidate expectation, and SHF Credit payment intent.

This is not a job board. Winning an opportunity does not create employment, payroll, a credential, verified skill, professional qualification, licensure, or job placement.

## Canonical Authority Reuse Map

- Identity and org scope: `IdentityRepo` and authenticated actor context derive user, roles, tenant, and active organization.
- Sponsor authority: `opportunityExchange.manage` plus sponsor/admin ownership checks in the Opportunity Exchange service.
- Student access: `opportunityExchange.view`, `opportunityExchange.bid`, and `opportunityExchange.submitWork`.
- Team membership: existing `studio_teams` and `studio_team_members`.
- Program/career references: existing `programs`, `enrollments`, and `careers`; `career_id` remains optional.
- Project/assignment handoff: award records own execution for MET-8, with a bounded best-effort projection into canonical `projects` only when the sponsor already has project authority.
- Evidence: accepted work is only an `OPPORTUNITY_SUBMISSION` evidence candidate; verified-evidence remains the only verification authority.
- Compensation: award creates a payment intent reference or reward agreement marker only; Treasury ledger execution is reserved for MET-9.
- Notifications: existing NCA outbox and notification service deliver bid accepted, work submitted, accepted, revision requested, and declined events.
- MET-6 communication: execution contexts reuse existing `TEAM_ROOM`, `PROJECT_ROOM`, and `HELP_SUPPORT_ROOM`; no opportunity-specific chat type exists.
- MET-7 missions: City Mission links reuse `mission_projection_id`; mission content is never duplicated.

## Opportunity Model

Durable state lives in `student_opportunities`, `student_opportunity_bids`, `student_opportunity_awards`, and `student_opportunity_submissions`.

Opportunity source types: `CAREER_PATHWAY`, `PROGRAM_MISSION`, `SIDE_MISSION`, `PROJECT`, `EVENT`, `INSTRUCTOR`, `ORGANIZATION`, `STUDENT_ENTERPRISE`, `ARCADE`, `CIVIC`, `COMMUNITY`.

Opportunity types: `PROJECT`, `CITY_MISSION`, `PROGRAM_MISSION`, `SIDE_MISSION`, `EVENT`, `CAREER_EXPERIENCE`, `STUDENT_ENTERPRISE_CONTRACT`, `COMMUNITY_PROJECT`, `ARCADE_CHALLENGE_CONTRACT`.

Difficulty tiers: `BEGINNER`, `DEVELOPING`, `ADVANCED`, `VERIFIED_SKILL`.

Participation modes: `INDIVIDUAL`, `TEAM`, `EITHER`.

Selection methods: `BEST_FIT`, `SPONSOR_SELECTS`, `ROTATION`, `LOTTERY`, `FIRST_TIME_PRIORITY`, `INSTRUCTOR_ASSIGNMENT`, `TEAM_SELECTION`.

Lifecycle states: `DRAFT`, `OPEN`, `PAUSED`, `CLOSED`, `AWARD_PENDING`, `AWARDED`, `COMPLETED`, `CANCELLED`, `ARCHIVED`.

## Eligibility

Eligibility is server-derived from opportunity status, application window, award capacity, existing bids, active enrollment, program/cohort requirements, and completed prior opportunity awards. Client-supplied eligibility, verified skill, credential, evidence ownership, bidder identity, and team membership are ignored.

Eligibility results are `ELIGIBLE`, `NOT_ELIGIBLE`, `CONDITIONALLY_ELIGIBLE`, `CLOSED`, `FULL`, and `RESTRICTED`, each with student-facing reasons and requirements remaining.

BEGINNER opportunities structurally remove prior-award/reputation gates and force `noReputationRequired`. SHF Credits never buy eligibility and cannot accelerate progression.

## Bids

Bid states are `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `SHORTLISTED`, `ACCEPTED`, `DECLINED`, `WITHDRAWN`, and `EXPIRED`.

Student-friendly bid fields include approach/proposal summary, estimated completion days, individual/team mode, portfolio/evidence references, requested compensation, and availability. The frontend never sends `student_id`; team IDs are verified against canonical team membership before acceptance.

Submitted bids are immutable through the public API except governed sponsor review actions and student withdrawal while in allowed states.

## Sponsor Review And Award

Sponsors may shortlist, decline, or accept only bids tied to opportunities they own, unless the actor is an admin-tier manager in the same org. Students cannot create arbitrary public opportunities.

Accepting a bid creates an immutable award snapshot containing opportunity, bid, student/team, scope, deliverables, compensation, due date, sponsor, and organization. The award does not create employment, payroll, credential, verified skill, licensure, or job placement.

Award states are `AWARDED`, `ACTIVE`, `SUBMITTED`, `UNDER_REVIEW`, `COMPLETED`, `CANCELLED`, and `EXPIRED`.

## Project / Assignment Handoff

The existing project authority is only safely composable in some cases. MET-8 therefore uses the award as the bounded durable execution record. When the awarding sponsor already has canonical `project.create`, the adapter may create a schedule-visible `projects` row as a non-blocking convenience.

P1: unify Opportunity awards with the broader project/assignment authority once that authority supports arbitrary educational opportunity work beyond current capstone/studio constraints.

## Submission And Review

Awarded students or active team members may submit artifact references and comments. Submission states are `SUBMITTED`, `NEEDS_REVISION`, `ACCEPTED`, and `DECLINED`.

Sponsor review may accept, request revision, or decline. Accepted work creates only an evidence-candidate expectation and a payment intent marker when applicable.

## Evidence Boundary

`OPPORTUNITY_SUBMISSION` is addressable as a source type for verified-evidence rules. The Exchange never calls verified-evidence write authority directly and never asserts verified skill or credential state.

## Compensation And Treasury Boundary

Compensation types are `SHF_CREDITS`, `PROGRAM_POINTS`, `NON_MONETARY`, `NONE`, and `FUTURE_EXTERNAL_PAYMENT_REFERENCE`.

MET-8 creates only an inert payment intent reference, such as `payment_intent_<award_id>`, or no reference for non-compensated work. Treasury balances and ledgers are untouched until MET-9.

## Program And Side Mission Support

Program Mission and Side Mission opportunities are first-class and do not require `career_id`. Program-backed sources require a real program in the sponsor organization. City Mission opportunities may reference a real MET-7 `mission_projection_id`.

## Notifications

NCA events are emitted for bid acceptance, work submission, accepted work, revision request, and declined work. Recipients are explicit actors from the award/submission payload, not broad role audiences.

## Accessibility

The frontend provides a non-spatial Opportunity Exchange panel in the metaverse shell. It supports keyboard navigation, screen-reader eligibility labels, semantic deadlines and deliverables, non-color-only status, and mobile layout. Map markers show only real runtime counts derived from the server response.

## Security

The implementation fails closed for unauthenticated access, missing active org context, unauthorized publish, cross-org reads, forged bidder identity, forged sponsor/org, forged team membership, forged evidence references, closed/expired opportunity bids, duplicate bids, unauthorized bid acceptance, forged awards, forged payment completion, and opportunity enumeration across orgs.

## Persistence

Migration `144_student_opportunity_exchange.sql` adds the durable Exchange tables. It does not duplicate the external opportunities board, Treasury ledger, verified-evidence facts, MET-6 rooms, or MET-7 mission projections.

## Browser Acceptance

The frontend is wired to runtime APIs only. End-to-end browser acceptance needs a multi-user seeded fixture that allows a sponsor and learner to create/review/bid/submit through the UI. Until that fixture is available, source-level frontend tests and live API tests cover the governed boundaries.

## P0 Gaps

None known in the repository-local implementation after focused validation.

## P1 Gaps

- Rich team picker backed by a canonical "my teams" API.
- Full browser fixture for sponsor and learner personas in one acceptance script.
- Advanced matching/recommendations.
- Full Work Passport integration.
- Treasury execution in MET-9.
- Richer reputation signals that preserve beginner access.
- Future-governed student-enterprise sponsorship.
- Broader project/assignment authority reuse once canonical execution support generalizes.
