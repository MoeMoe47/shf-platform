# Test File Recovery & Independent Reverification — 2026-08-30

## Incident

While reverting a non-functional fix attempt (an in-memory rate-limit reset
called from the wrong process — see "Rate-Limit Root Cause" below), a `sed`
command using a buggy multi-line range-delete pattern (`/resetRateLimitCountersForTests(\[/,/\]);/d`)
was run across six test files. GNU/BSD sed's regex-address range does not
close on the same line that matches both the start and end pattern unless
the end pattern is a line number — it kept deleting forward to the *next*
line matching `\]);` anywhere later in the file, destroying far more than
the single inserted line it was meant to remove.

## Files Affected

| File | Outcome |
|---|---|
| `tests/opportunities.security.test.ts` | **Restored exactly** — the file had been read in full immediately before editing; rewritten verbatim from that content. |
| `tests/live-learning.security.test.ts` | **Restored exactly** — git-tracked; restored via `git checkout HEAD`, then the one legitimate uncommitted diff (session-, `after()`-hook, `BASE_USERS` additions) was reapplied and verified against `git diff HEAD` to match byte-for-byte. |
| `tests/assignments.security.test.ts` | **Reconstructed (small gap)** — lost the tail of its `before()` fixture setup and the start of test 1. Rebuilt from strong same-file pattern evidence (12 of 13 tests were untouched and dictated the missing fixture shape); verified 13/13 passing standalone. |
| `tests/live-learning.cohort-eligibility.test.ts` | **Untouched** — the sed range closed almost immediately in this file by chance; no data lost. |
| `tests/career-events.security.test.ts` | **Reconstructed (full)** — `before()` hook and all ~10 tests were destroyed; no git history existed (file was created earlier in this session, never committed). Rebuilt from canonical sources (below). |
| `tests/career-pathway-integration.test.ts` | **Reconstructed (full)** — `before()` hook and roughly 11 of ~21 tests were destroyed; no git history existed. Rebuilt from canonical sources (below). |

Recovery paths checked and found unusable for the two fully-destroyed
files: `git fsck --dangling`/stash list (only unrelated stashes from
2026-08-16/18 existed), VS Code Local History (never captured these files —
they were written by the agent's file tools, not through VS Code's save
path), Time Machine / APFS local snapshots (none available on this
machine).

## Canonical Sources Used for Reconstruction

- `docs/SHF_CAREER_EVENTS_OPPORTUNITIES_FOUNDATION.md`, `docs/SHF_CAREER_PATHWAY_INTEGRATION.md`
- Current route/service/repo/model code: `career-events`, `opportunities`,
  `career-pathways`, `careers`, `programs`, `enrollments` domains
- `src/domain/shared/audience-eligibility.ts` (ORGANIZATION/PROGRAM/COHORT
  entitlement rules)
- `src/auth/security-permissions.ts` (role→permission maps — confirmed
  `student`/`instructor` lack `program.update`; `student` lacks
  `careerEvent.manage`)
- `src/domain/identity/repo/identity-repo.ts` (the hardcoded dev-token
  identity registry — critical: authentication does **not** read the
  `users` table at all; a dynamically-generated learner id must match its
  `phase(?:4ce|4opp|5)_\d+_(org_only|program_a|program_b|cohort_a|cohort_b)`
  regex to authenticate)
- Migrations 033 (`careers`/`career_families`), 046 (`career_events`/`opportunities`),
  049 (`program_careers`, career linkage columns)
- The 12 surviving tests in `assignments.security.test.ts` (pattern
  evidence for its reconstructed gap)

No assertion in either reconstructed file was invented without support
from one of these sources; every test was run against the real backend and
had to actually pass on real production code, not on assertions tuned to
whatever the code happened to do.

## Career Events Suite — Reconstructed Coverage (13 tests)

Audience-scope visibility (ORGANIZATION/PROGRAM/COHORT, mirroring the
proven Opportunities pattern): eligible-learner visibility, program-scope
inclusion/exclusion, cohort-scope inclusion/exclusion, cross-org denial,
DRAFT-hidden-except-creator, direct-ID cohort-entitlement bypass
resistance, non-staff-instructor denial, authorized-cohort_staff
management, student-cannot-create (403 FORBIDDEN), cross-org admin
view/manage denial, Career-linkage-does-not-bypass-Cohort-entitlement,
student-facing DTO leak check, invalid date-range rejection.

One assumption was corrected during verification: an early draft assumed
active `cohort_staff` grants **view** access to a still-DRAFT event. The
real, current `canView()` (`career-event-service.ts:137-145`) restricts
DRAFT visibility to the creator or an admin-tier actor — cohort_staff is a
**management** entitlement, not a view entitlement — identical in shape to
the already-verified "CLOSED opportunity is visible only to its creator"
rule in `opportunities.security.test.ts`. This was a reconstruction
mistake on my part, not a production regression; the test was corrected to
match verified real behavior instead.

## Career Pathway Suite — Reconstructed Coverage (19 tests, covering the user's 24-item checklist)

Program→Career management (link/unlink permission and validation: admin
success, student/instructor denial, unknown-Career/-Program rejection,
duplicate-mapping rejection, cross-org denial, Program read exposing the
relation, multi-Career-per-Program never collapsed); learner pathway
derivation (ACTIVE-enrollment derivation with Career Family, no-enrollment
empty pathway, multi-Program union with cross-Program dedup, WITHDRAWN /
CANCELLED / PENDING / COMPLETED all correctly excluded — confirmed against
`enrollment-repo.ts:139-147`'s strict `status='ACTIVE'` filter, with no
special-cased "historical" treatment for COMPLETED — a control check
using the same enrollment row flipped to ACTIVE proves the negative
results aren't coincidental); query-string pathway-spoofing resistance;
Career Event/Opportunity relevance surfacing, non-relevant-record
visibility, relevance-never-substitutes-for-audience-scope, and a
backend-level no-duplicate-record guarantee under overlapping pathway
relationships (Calendar-level dedup itself is a frontend concern already
covered by `eventContract.js`'s own tests, out of scope here).

Several items in the user's 24-item checklist were naturally covered by a
single combined test where the underlying assertions are inseparable
(e.g., Career Family derivation is asserted together with Career-id
derivation in test 11, since both come from one API response) — noted in
each test's own numbering/comment rather than forced into artificially
separate tests.

## Fixture Strategy

Every fixture id is `RUN`-prefixed (`phase4ce_<ts>`, `phase5_<ts>`) except
for a small set of cross-file shared static identities
(`user_admin_001`, `user_instructor_001`, `user_other_admin_001`,
`user_no_assignment_001`) that other domains' security suites also share —
all such rows are inserted with `ON CONFLICT ... DO NOTHING`, so they are
idempotent regardless of which file creates them first. Because
`career-pathway-integration.test.ts` must now pass **independently** (not
only as part of the full suite), it inserts `user_no_assignment_001` into
`users` itself rather than relying on an earlier-run file having done so.

## Cleanup Verification

Both reconstructed files' `cleanup()` functions delete only rows scoped to
their own `RUN`-prefixed ids/titles, in FK-dependency order (career_events/
opportunities → program_careers → enrollments → programs → career_curriculum_requirements
→ careers → career_families), called from both `before()` and `after()`.
Verified against `shs_dev` after a full-suite run: zero leftover rows
matching any `phase4ce_%`/`phase5_%` pattern across `programs`,
`career_events`, `opportunities`, `program_careers`, `enrollments`,
`careers`, `career_families`; total `program_careers` row count in
`shs_dev` remains 0 (no fake Program→Career mappings introduced).

## Rate-Limit Root Cause (Phase 5.1 Part A)

Reproduced precisely: `consumeRateLimit()`'s non-production path
(`src/security/rate-limit.ts:64-77`) stores counts in a single
process-global `Map` (`globalThis.__shs_rate_limit_memory_store`) with a
fixed 60-request/60-second window per `(limiterClass, identityKey)` key.
Six HTTP-integration test files share a small set of static fixture
identities (`user_admin_001` etc.) across a single long-lived dev-server
process. Their combined mutation volume crosses the default `max=60`
partway through whichever file happens to execute at that cumulative
boundary in a given run — reproduced with the exact 3-test failure
signature in `opportunities.security.test.ts`, and independently
reproduced landing on different tests in `assignments.security.test.ts`
and `career-events.security.test.ts` once the reconstructed files were
added to the mix, confirming the mechanism (not the specific failing
tests) is the real, general cause.

An initial fix attempt exported a test-only `resetRateLimitCountersForTests()`
and called it from each file's `before()` — this was **incorrect**: the
in-memory `Map` lives in the **server** process, not the **test-runner**
process, so a reset called from a test file mutates a different process's
memory and has no effect. That function and its call sites were reverted
entirely (not left in as dead code).

**Fix actually applied**: added `test:server` (and `test`) npm scripts to
`apps/shs-api/package.json` that start the dev server with
`SHS_RATE_LIMIT_AUTHENTICATED_USER_MAX=5000` — the *existing*,
already-sanctioned `SHS_RATE_LIMIT_<CLASS>_MAX` environment override
(`rate-limit.ts:17-29`), used here for its intended purpose: per-environment
limit tuning. This:
- adds zero new routes, zero new attack surface, zero production code changes
- leaves the production path untouched — `assertProductionRateLimitConfigured`
  still requires explicit values in production regardless of this script
- leaves the interactive-development default (60/60s, unset env var) untouched
- is provably scoped to test-server startup only (`test:server` is never
  invoked in production or by `npm start`)

Verified: full backend suite (311 tests, 6 env-gated skips) passes twice
from clean invocations (fresh disposable DB each time) with 0 unexpected
failures, using this npm script.

## Second Discovery: A Pre-Existing Fixture-Seeding Race

During repeated fresh-disposable-DB verification runs, a second,
unrelated, pre-existing race surfaced twice (not caused by the
reconstruction): `duplicate key value violates unique constraint
"users_organization_id_email_key"`. Every HTTP-integration test file
seeds a small set of cross-file-shared fixture users via
`INSERT ... ON CONFLICT (user_id) DO NOTHING` — an arbiter that only
protects against a `user_id` collision. The `users` table also carries a
`UNIQUE(organization_id, email)` constraint that the same statement does
not declare as its conflict target. On a completely virgin, never-before-
seeded database, two files' `before()` hooks racing to insert the
identical well-known row (e.g. `user_admin_001`) for the first time can —
in a rare PostgreSQL interleaving — raise a real `23505` error on that
second constraint before either transaction commits, even though both are
inserting identical values. This never occurs on a reused database (like
`shs_dev`, or any disposable DB after its first successful seed), which is
why it went unnoticed in every prior phase's fresh-DB verification.

This is test-only fixture code, not production code, so it was in scope to
fix directly: added `tests/helpers/seed-retry.ts` (`withSeedRetry`, retries
up to 3 times on error code `23505`) and applied it to every base-user
seeding statement in the six HTTP-integration test files
(`opportunities.security.test.ts`, `career-events.security.test.ts`,
`career-pathway-integration.test.ts`, `assignments.security.test.ts`,
`live-learning.cohort-eligibility.test.ts`; `live-learning.security.test.ts`
seeds no users itself and was left untouched). Verified with 5 additional
consecutive fresh-disposable-DB full-suite runs after the fix, all clean
(305/311 pass, 0 fail, 6 skipped), on top of the 2 official runs recorded
below.

## Production Code Changes

**None.** No service, repository, route, migration, auth/permission, or
frontend file was modified to make a reconstructed test pass. The one
career-events assumption that didn't match reality (see above) was fixed
by correcting the *test*, after confirming the real behavior was
intentional and consistent with an already-verified precedent elsewhere in
the codebase.

## Verification Summary

- `career-events.security.test.ts` standalone: 13/13 pass (re-confirmed after the seed-retry fix)
- `career-pathway-integration.test.ts` standalone: 19/19 pass (re-confirmed after the seed-retry fix)
- Cross-domain regression group (7 files): 98/98 pass
- Phase 4/5 domain regression group (8 files): 114/115 pass, 1 skipped (env-gated)
- 5 additional consecutive fresh-disposable-DB full-suite runs after the seed-retry fix: all 305/311 pass, 0 fail, 6 skipped
- Official fresh disposable DB (`shs_phase51_official`): migrations 001-049 clean,
  `db:schema:integrity` PASS, `db:schema:integrity:strict` PASS (49
  migrations, 1675 objects, 0 failures); reconstructed suites standalone
  pass; full suite run 1: 305/311 pass, 0 fail, 6 skipped; full suite run
  2 (same DB): 305/311 pass, 0 fail, 6 skipped; DB
  created→migrated→tested→dropped→confirmed removed
- `shs_dev`: migration status clean, curated + strict integrity PASS,
  full suite 305/311 pass, zero leftover test debris, zero
  `program_careers` rows (no fake mappings)
- `npm run typecheck`: clean
