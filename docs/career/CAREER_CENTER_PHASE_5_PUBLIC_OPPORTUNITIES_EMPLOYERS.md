# SHF Career Center Phase 5: Public Opportunities + Employer Projection

## Canonical routes

The public Career app uses `/career.html#...` with `/opportunities`,
`/opportunities/:opportunityId`, `/employers`, and `/employers/:employerId`.
The protected `/opportunities` API routes remain unchanged in meaning.

## Publication policy

The canonical `opportunities` table now has `public_visibility`, defaulting to
`PRIVATE`. An authorized opportunity manager may publish a record only when it
is `OPEN`, organization-scoped, has no program or cohort restriction, and has
an HTTP(S) or validated internal destination. Public reads additionally
require an active organization and an unexpired application deadline. A
private, draft, closed, cancelled, archived, program-scoped, or cohort-scoped
record is not exposed anonymously. The existing authenticated learner
eligibility checks remain separate.

This required migration 113 because the previous schema could not distinguish
`OPEN` from intentional public publication. Existing rows remain private.

## Public DTO and employer boundary

Public opportunity responses contain only the public identifier, title,
description, type, dates, delivery/location, destination, public organization
name/type/identifier, and canonical Career reference when present. Tenant,
creator, audience, program, cohort, workflow, and permission fields are not
returned.

The employer directory is an Organizations projection. It lists only active
organizations with at least one public opportunity and uses the truthful label
`Opportunity Provider`; it does not create or imply a separate employer or
partner registry. Employer Hub remains authenticated/pilot-only.

## UI boundaries

The public list supports opportunity-type filtering, loading/error/empty
states, and detail links. Details use external destinations when supplied and
do not claim to submit or track applications. Career and Pathway details link
to opportunities only through the canonical Career relationship included in
the public DTO. No salary, wage, demand, placement, matching, application,
regional, or employer-partnership claims are displayed.

## Verification

Contract coverage is in `tests/careerPhase5PublicProjection.test.mjs` and the
existing opportunity security suite remains the authority for learner,
cross-organization, cohort, and program access. Root build, API typecheck,
manifest validation, UI validation, focused Career browser tests, and
`git diff --check` are required before release.
