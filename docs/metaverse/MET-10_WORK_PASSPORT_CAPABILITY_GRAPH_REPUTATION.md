# MET-10 Work Passport + Capability Graph + Reputation

## Authority Reuse Map

MET-10 is a read-only projector. It does not own skills, credentials, assessments, evidence, course completion, career qualification, employment, civic authority, SHF Credits, balances, or enrollment.

| Fact | Canonical authority reused | MET-10 use |
| --- | --- | --- |
| Verified evidence and evidence candidates | `verified-evidence`, `prepare_prove_evidence`, Truth Spine adapters | `VERIFIED_EVIDENCE` and candidate claims with source refs |
| Verified capability | Reviewed/verifier-backed Evidence or credential/assessment authority | `VERIFIED_SKILL` only when canonical verified support exists |
| Credentials/certificates | `credentials` domain | Active credential claims; revoked/expired omitted |
| Curriculum/course/lesson completion | `curriculum`, `completion-policy`, `programs` | Source-confirmed experience only |
| Assignments and MET-7 missions | `assignments`, `completion-policy`, MET-7 mission projection | Mission/program/side-mission experience |
| Studio projects and submissions/review | `projects`, `studio`, `studio-team` | Project and team experience; no quality inference |
| Portfolio artifacts | `portfolio` domain | Presentation artifact claim; Evidence still owns verification |
| Career pathways/progress | `careers`, `career-pathways`, career events | Career connection without job-ready/employment claims |
| MET-8 Opportunity Exchange | `metaverse/opportunities` | Award/completion history and safe eligibility projection |
| MET-9 Market | `metaverse/market`, Treasury for balance | Operational fulfillment facts only; no credits-as-skill |
| Arcade mastery/evidence signals | `arcade` and Evidence rules where configured | Practice/mastery signal or evidence candidate; not skill authority |
| Team participation | `studio-team` | Source-backed membership/role only |
| Program/cohort enrollment | `enrollments`, `programs` | P1 richer projection; no enrollment authority in MET-10 |
| Operational events/reporting | NCA/reporting/GPA as existing | P1 notifications and longitudinal analytics |
| Truth Spine/Metric Registry | GPA/truth-spine/metric-registry adapters | Source traceability only |
| Identity/org/tenant scope | auth middleware and permission guard | Server-derived learner/org scope |

## Work Passport Purpose

The Work Passport is a learner-facing projection of verifiable achievements and experience. It answers what source-backed work, evidence, credentials, projects, missions, opportunities, practice signals, team participation, career progress, and reliability facts exist for the learner.

## Claim Model

Implemented in `apps/shs-api/src/domain/metaverse/passport/model/passport-contract.ts`.

Claims include `passportClaimId`, `learnerUserId`, `organizationId`, `claimType`, `title`, `summary`, `sourceType`, `sourceRef`, `sourceAuthority`, `status`, `verificationLevel`, dates, evidence/artifact/skill/career/program/mission/project/opportunity refs, metadata, visibility, and creation time.

## Verification Levels

Supported levels are `VERIFIED`, `SOURCE_CONFIRMED`, `EVIDENCE_CANDIDATE`, `ACTIVITY_COMPLETED`, and `UNVERIFIED`. The UI renders these labels as text, not color-only badges.

## Source Authorities

Supported source authorities are `VERIFIED_EVIDENCE`, `ASSESSMENT`, `CREDENTIAL`, `CURRICULUM`, `CAREER`, `METAVERSE_MISSION`, `OPPORTUNITY_EXCHANGE`, `LEARNING_ARCADE`, `PORTFOLIO`, `STUDIO_PROJECT`, `PROGRAM`, `STUDIO_TEAM`, and `MARKET`. MET-10 is not a source authority.

## Capability Graph

The graph connects learner, skill, evidence, project, mission, credential, career pathway, opportunity, team, and program nodes. Edges are explanatory only, with relationships such as `VERIFIED_BY`, `EVIDENCED_BY`, `APPLIED_IN`, `COMPLETED_IN`, and `PROGRESSED_TOWARD`. The UI includes an accessible list/tree equivalent.

## Boundaries

Verified skill: only reviewed/verifier-backed canonical evidence currently creates `VERIFIED_SKILL`.

Arcade: Arcade contributes practice/mastery signals or evidence candidates only.

Mission: Program, City, and Side Missions contribute experience/history only.

Opportunity: awards/completions are student opportunity history, not employment, credentials, or verified skills.

Market: fulfilled orders are operational history only. SHF Credit balances are not capability.

Portfolio/project reuse: portfolio artifacts are projected with provenance; Portfolio never owns evidence verification.

Career connection: career facts are projected without declaring job-ready or employment placement.

## Reputation Model

MET-10 uses transparent reliability facts instead of a global score. Current dimensions include opportunity follow-through, team participation, and market fulfillment. Reliability is separate from skill and credits.

## Privacy

Views are `SELF`, bounded `SPONSOR`, and `PUBLIC`. Public view strips learner identity and reliability facts. Sponsor view is eligibility-safe and bounded. Private operational details do not automatically become public.

## Beginner Fairness

The eligibility projection keeps `beginnerEligibleWithoutReputation: true`. BEGINNER opportunities must not require historical reputation; MET-8 remains the eligibility authority.

## MET-8 Eligibility Reuse

MET-8 may consume `/metaverse/passport/eligibility/:learnerUserId` as a safe projection. The projection has `noCircularDependency: true` and does not override canonical facts.

## Persistence

No migration was created. MET-10 derives projections at read time and catches missing optional source tables closed. Durable duplicate evidence, credential, career, or skill truth is not written.

## Notifications

No notification spam was added. P1: reuse NCA for meaningful events such as newly verified capability, credential revoked/added, or approved passport publication.

## Accessibility

The UI uses semantic sections, buttons for source inspection, text verification labels, keyboard-operable controls, accessible source details, and a list/tree equivalent for the graph. Mobile panel layout is included.

## Security

Routes require auth, active org context, and existing permissions. Learner identity for `/me` is server-derived. Sponsor reads are bounded. Public-safe view strips private data. The service does not trust client-supplied learner ID, verification level, reliability, credential, or evidence authority for self view.

## Browser Acceptance

P1. No stable MET-10 live fixture exists yet that contains all source facts across evidence, credential, mission, opportunity, market, portfolio, career, and team history. Exact P1: add a browser fixture with one learner and one sponsor covering verified evidence source inspection, completed project, Program/Side Mission, opportunity completion, career connection, reliability fact, sponsor-safe view, mobile path, and no console errors.

## P0/P1 Gaps

P0: none known in repository-local implementation.

P1:
- richer public sharing/publication approval workflow
- advanced graph visualization
- richer sponsor matching views
- future student-enterprise history
- longitudinal capability analytics
- deeper live browser fixture coverage
- richer program/cohort enrollment projection
