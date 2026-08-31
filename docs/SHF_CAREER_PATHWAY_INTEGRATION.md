# SHF Career Pathway Integration

Updated 2026-08-30 for SHF Ecosystem Phase 5.

## Scope

Phase 5 connects the canonical Program, Career, Career Family, Career Event, and Opportunity domains into one coherent pathway relationship: `Enrollment → Program → Career/Career Family → Career Event → Opportunity → Calendar/Opportunity Radar`. It does not redesign Calendar, Career Center, or Curriculum; does not create a second Career taxonomy; does not build AI matching; and does not build Opportunity Applications or Career Event registration.

## Pre-Implementation Audit Findings

- **`career_families`/`careers`** (migration 033): confirmed **global reference data** — no `organization_id` column, no org-scoped query anywhere in `CareerRepo`. `GET /careers`, `GET /careers/:slug` are unauthenticated/public routes.
- **`career_curriculum_requirements`**: maps a Career to curriculum lesson/grade-band recommendations. Content-requirement metadata, not learner completion, not Program-related.
- **`programs`**: organization-scoped (stewardship columns added in migration 032/Phase 4.1). **Zero rows exist in `shs_dev`** — there is no real Program data today, only hardcoded default program-id strings (e.g. `"data-center-specialization-11"`) used as query defaults in `program-repo.ts`'s specialization services.
- **No existing Program → Career reference anywhere** in the repository — confirmed by a repo-wide search for `career_id`/`career_family_id` outside the `careers` domain itself.
- **`program_specialization_assignments`/`_requests`**: `specialization_id` is a free-text column with no FK to `careers`, no enumerated vocabulary, and no shared identifier scheme with the Career taxonomy. A real but informal, pre-Career-taxonomy concept. **Deliberately not wired this phase** — per the phase brief's own "if not enough evidence exists: defer," and because the only way to connect it would be guessing a mapping from string similarity, which is explicitly forbidden (see Non-Goals).
- **Career Center already consumes real Career data**: `src/pages/PathwaysExplore.jsx` → `useCanonicalCareers()` → `src/lib/career/api.js` → `GET /careers`/`GET /careers/:slug`/`GET /careers/:slug/curriculum`. This page needed **no changes** — it was never demo-backed.

## Canonical Taxonomy (reaffirmed, unchanged)

- **Career Family** = broad occupational category (global reference data).
- **Career** = canonical occupation identity, belongs to one Career Family (global reference data).
- **Program** = institutional SHF learning/workforce program (organization-scoped).
- **Enrollment** = learner participation in a Program (unchanged from Phase 1 — this phase adds no new enrollment concept).
- **Career Event** / **Opportunity** = unchanged from Phase 4.

None of these were collapsed into a generic pathway table.

## Program → Career Relationship

**Chosen shape: a join table, `program_careers`** (many-to-many) — matching the phase brief's own preferred option (a Program may support multiple Careers; Career Family derives from Career rather than being duplicated on every mapping row).

Schema (`049_career_pathway_integration.sql`):

```
program_careers
  program_career_id  PK
  organization_id     FK organizations — denormalized from the Program's own org for direct query/tenant-safety convenience
  program_id          same-org FK to programs (organization_id, program_id)
  career_id           FK careers (global — no org scoping on this side)
  is_primary          boolean, default false — an explicit admin signal, never an algorithmic ranking
  created_by_user_id, created_at, updated_at
  UNIQUE (organization_id, program_id, career_id)
```

This connects an organization-owned Program to global Career reference data without giving Career rows fake organization ownership, and without requiring Career to become org-scoped.

## Specialization Boundary (deferred)

`program_specialization_assignments`/`_requests` remain completely untouched. No FK, no shared vocabulary, no automatic wiring was added between `specialization_id` and `careers`/`career_id`. This is a documented, deliberate deferral — connecting them would require either (a) a real product decision about whether a specialization *is* a Career, a Career sub-type, or something else entirely, or (b) guessing a mapping from name similarity, which is forbidden. Both are out of this phase's scope.

## Program API Integration

`GET /programs/:id` now includes a `careers: [...]` array (full Career objects, each with an `isPrimary` flag) — a single additive field on the existing response, not a second Program API. `GET /programs/:id/careers` is also available as a focused, list-only view of the same relationship. Multiple Careers are always returned in full; none are ever arbitrarily chosen as "the" Career for a Program.

Management: `POST /programs/:id/careers` (`{ careerId, isPrimary? }`) and `DELETE /programs/:id/careers/:careerId`, both gated by the existing `program.update` permission (`org_admin`/`program_manager`/admin-tier roles only — no new permission was created). Duplicate mappings are rejected (`409 DUPLICATE_MAPPING`); an unknown Career is rejected (`400 CAREER_NOT_FOUND`); a cross-organization Program is rejected (`404 PROGRAM_NOT_FOUND`, since the lookup is organization-scoped) — a student/instructor attempting either write gets `403` from the existing permission guard before reaching any pathway-specific logic.

## Career API Integration

`GET /careers/:slug/programs` — a focused relationship endpoint (mirroring the existing `GET /careers/:slug/curriculum` pattern), returning only the calling actor's **own organization's** Programs linked to that Career. This endpoint requires authentication (`program.read`) even though the base `GET /careers/:slug` route is public — Career taxonomy is global and safely public, but which *Programs* an organization runs is institutionally sensitive and must never leak cross-organization. No circular/bloated payload was added to the base Career response.

## Enrollment → Career Derivation

**No `learner_career` row was created.** A learner's pathway Career(s) are always derived server-side, on read, from: `ACTIVE Enrollment → Program → program_careers → Career(s)`. `GET /careers/pathway/me` performs this derivation and returns `{ careerIds: [...], careerFamilyIds: [...] }`.

- Only `ACTIVE` enrollments contribute — `PENDING`/`WITHDRAWN`/`CANCELLED`/`COMPLETED` do not, matching every other Enrollment-derived entitlement in this codebase (Assignments, Live Learning, Career Events, Opportunities).
- Multiple `ACTIVE` enrollments' Careers are **unioned and deduplicated** — never ranked, never collapsed to one.
- Career Family ids are derived from the resulting Careers' own `career_family_id` — never stored redundantly.

## Career Event / Opportunity Linkage

Both `career_events` and `opportunities` gained two optional columns: `career_id`, `career_family_id` (migration 049), with a database `CHECK` enforcing **at most one** of the two is ever set (Career Family should derive from Career when a specific Career is linked — the same "don't duplicate truth" principle as `program_careers`). Both may be `NULL` for a general/unlinked record — a Career Event or Opportunity is never forced into a Career association it doesn't have. Server-side validation at creation confirms the referenced Career/Career Family actually exists before the record is written.

**Single column, not a join table — a deliberate choice, not an oversight.** Unlike `Program → Career` (where the audit found a real, evidenced need for many-to-many — a Program legitimately spans several specializations/careers), no equivalent evidence exists for Career Events or Opportunities: every concrete example in this phase's own brief is a single relationship ("Data Center Technician Site Visit → Career: Data Center Technician," "Data Center Operations Internship → Data Center Technician"), and `career_family_id` already covers the one legitimate "broader than one Career" case ("Healthcare Career Fair → Career Family: Healthcare") without needing a multi-row join. A `career_event_careers`/`opportunity_careers` join table remains straightforward to add later, additively, if a real multi-Career-per-record need is ever evidenced — this phase used the smallest model the actual evidence supported, per its own instruction not to build ahead of proven need.

## Relevance vs. Entitlement — the Critical Boundary

**Career association is a relevance/category signal. Audience scope (`ORGANIZATION`/`PROGRAM`/`COHORT`) remains the sole access-control authority, unchanged from Phase 4.** Linking a Career Event or Opportunity to a Career never widens or narrows who can see or join it — `canViewSession`-equivalent checks in `career-event-service.ts`/`opportunity-service.ts` never reference `careerId`/`careerFamilyId`. A `COHORT`-scoped event with a Career match still requires the full canonical Cohort/Enrollment entitlement chain; a mismatched-pathway learner with genuine `ORGANIZATION`-scope access still sees the record. This is tested explicitly (`career-pathway-integration.test.ts`, tests 21/26).

`pathwayRelevant: boolean` is a separate, purely informational field computed at read time (`isPathwayRelevant()` in `career-pathway-service.ts`): true only when the record's own `careerId`/`careerFamilyId` is present in the actor's derived pathway, computed once per list/read (not once per record — no N+1 derivation), and populated **only for student-tier reads** (admin/instructor responses never carry it, since it's a per-learner signal, not a property of the record). It is never true for a record with no Career/Career Family linkage — a non-matching or unlinked record remains fully visible/available, just never mislabeled as relevant.

No AI, no embeddings, no opaque scoring, no "match percentage" anywhere in this implementation — `isPathwayRelevant()` is a single deterministic boolean membership check.

## Opportunity Radar / Calendar Impact

**No UI change.** `pathwayRelevant`, `careerId`, and `careerFamilyId` are carried through into each Calendar event's `metadata` object (`mapCareerEvent`/`mapOpportunityDeadline` in `useLearningCalendarEvents.js`) as inert additional fields — no rendering component (`OpportunityRadarCard.jsx`, `CalendarEventDetail.jsx`, `TodayPanel.jsx`) reads them yet, so this phase adds zero visible change to Calendar, Opportunity Radar, or Career Center. The data is real and available for a future, deliberate UI enhancement (e.g. a "Relevant to your pathway" label) without requiring another backend change when that's built. Calendar's existing deterministic identity (`createCalendarEventId`) and dedup (`dedupeCalendarEvents`) are untouched — one Career Event or Opportunity deadline still produces exactly one Calendar event regardless of Career linkage.

## Curriculum Requirement Boundary

`career_curriculum_requirements` (Career → curriculum content mapping) and the new `program_careers` (Program → Career institutional-offering mapping) are kept strictly distinct — the former is a content/requirement relationship owned by the Career taxonomy itself; the latter is an institutional pathway-offering relationship owned by the Program. Neither was changed to reference or duplicate the other. Curriculum completion logic (`CurriculumCompletionService`, Phase 3.1) was not touched.

## Direct-ID / Tenant Security

`POST/DELETE /programs/:id/careers` verify the Program belongs to the actor's own organization before any mutation (`assertProgramInOrganization`) — a client-supplied `program_id` for another organization is rejected with `404`, never silently redirected or exposed. `GET /careers/:slug/programs` filters Programs to the actor's own organization only, even though Career itself is public/global. Career existence is validated server-side (`assertCareerExists`) — an unknown `career_id` is rejected before any row is written, never silently accepted.

**Learner pathway derivation has no client-suppliable `program_id` at all.** `GET /careers/pathway/me` accepts no request body or query parameters — `deriveLearnerPathway()` derives `programIds` exclusively from the authenticated actor's own `ACTIVE` enrollments (`enrollmentRepo.listActiveEnrollmentsForLearner(actor.organization_id, actor.user_id)`, both arguments server-derived from the session, never from the request). There is no code path by which a learner could supply a `program_id` to expand their own derived pathway — the attack surface doesn't exist, rather than being blocked by a check.

**Management permission is role-based, not ad hoc.** `program.update` (gating `POST/DELETE /programs/:id/careers`) is granted only to `org_admin`, `program_manager`, and the platform `super_admin` role — confirmed directly against `SHS_ROLE_PERMISSION_MAP`. `instructor` does not hold this permission, so an instructor's mutation attempt is rejected by the existing `requirePermission` guard before reaching any pathway-specific code, with no special-casing needed.

## Non-Goals

- Opportunity Applications, Career Event registration, hiring outcomes, employment placement reporting.
- AI/ML-based career matching, embeddings, "match score" — this phase is exclusively rules-based and explainable.
- Wiring `program_specialization_assignments`/`_requests` to Careers (deferred — see above).
- Fuzzy/name-based automatic Program → Career backfill for existing Programs (`shs_dev` has zero Program rows anyway, so there was nothing to backfill even if this were allowed).
- Any Career Center visual redesign — `PathwaysExplore.jsx` already worked against real data and needed no change.
- Calendar/Opportunity Radar UI changes — pathway metadata is wired through but not yet surfaced.
