# SHF Career / Workforce Foundation Phase 1

## Canonical ownership

Career identity is owned by the SHS API Career domain and the PostgreSQL
`career_families` and `careers` tables. The Career Center is a presentation
consumer. `src/data/careers.js`, `src/data/career-pathways.json`, and
`src/data/pathways.json` remain compatibility/demo inputs only and are not
authoritative career records.

Employers remain canonical `organizations`; Phase 1 does not create an
employer registry. Programs remain owned by the existing Programs domain.

## Taxonomy and grade bands

`career_families` is the canonical family vocabulary. The first proof family
is `data-center-ai-infrastructure`. A career may carry an optional sector
label, but sector does not replace the family relationship.

Career records reference Curriculum identifiers through
`career_curriculum_requirements`. Curriculum continues to own lesson content,
assignments, and completion. Requirement rows may be `required` or
`recommended` and carry validated grade 6–12 bands plus a developmental stage:

- grades 6–8: `DISCOVER`
- grades 9–10: `EXPLORE`
- grades 11–12: `PREPARE_PROVE`
- post-graduation: `TRANSITION`
- adult entry: `ADULT_ACCELERATED`

This phase does not implement sequencing, placement, prior-learning credit,
credentials, or readiness scoring.

## Competency and evidence boundary

A competency is a separately defined, assessable capability. Curriculum may
reference a competency and Career may require one, but lesson completion is not
competency verification. Browser state may display progress; it cannot create
an institutional `VERIFIED` competency or readiness state. Future verified
states must be projections over approved assessment/evidence records.

## Participant and privacy boundary

Phase 1 uses existing users, memberships, and Programs. A separate participant
registry and cohort/enrollment model remain deferred. Employer organization
membership does not grant access to student records or Portfolio data. Any
future employer sharing must be an explicit, scoped, permissioned operation;
there is no implicit youth visibility path.

## Completion proof and deployment

The existing Curriculum completion service remains authoritative for lesson
completion and writes `curriculum_lesson_completions` plus the trusted-reporting
outbox event. This phase does not reinterpret localStorage completion as
institutional fact. Migration `033_career_workforce_foundation.sql` is
forward-only and must run after migrations 001–032 using the repository
migration runner. It seeds only the minimal Data Center family/career proof and
one recommended grade-band reference; it does not backfill legacy static data.

Phase 3/4 integration uses the same ownership boundary: the Career API reads
PostgreSQL career records, active Career Center hooks adapt those responses for
legacy presentation components, and API failure does not silently fall back to
static career data. `src/data/pathways.json`, `src/data/career-pathways.json`,
and `src/data/careers.js` are retained only as legacy/demo artifacts; they are
not production Career authorities. The authenticated completion proof reaches
the canonical completion route and writes one `lesson.completed` outbox event
transactionally. Downstream delivery or reporting projection requires its own
governed consumer verification.

## Full-stack verification

Run `node --import tsx scripts/run-phase5-full-stack-e2e.mjs` to exercise the
Career-to-Curriculum browser flow against a disposable PostgreSQL cluster,
temporary API, and temporary Vite server. The runner allocates unused loopback
ports, applies migrations 001–033, seeds only disposable `shs-core` learner
records, and tears down all processes and temporary files even on failure. It
does not use or alter the fixed port 8091 service. The test proves the
authenticated completion row and canonical `lesson.completed` outbox event,
then exercises the existing trusted-reporting dispatcher against an isolated
ingestion receiver. It does not create a Data Center-specific reporting
pipeline or claim a final reporting projection.
