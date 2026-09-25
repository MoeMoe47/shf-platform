# SHU Canonical Data Gap Report V1

Date: 2026-09-25. Companion to `SHU_ECOSYSTEM_EXPERIENCE_V1.md`.

SHU discovery is built on canonical data only. This report lists what the
owning domains must publish for SHU to show real Programs, Projects,
Opportunities, organization relationships and real-world Places. **No data was
seeded in this phase.** SHU already ingests every item below as soon as it is
published (adapter projectors exist and are covered by tests).

## What canonical data exists today (live, `shs-api` on :8091)

| Collection | Endpoint | Records |
|---|---|---|
| Careers | `GET /careers` | 1 (Data Center Technician) |
| Career → curriculum requirements | `GET /careers/:slug/curriculum` | 1 requirement |
| Career → programs | `GET /careers/:slug/programs` | 0 |
| Programs | `GET /programs` | 0 (taxonomy only: `GET /programs/taxonomy`) |
| Organizations | `GET /organizations` | 2 real + 1 fixture (`partner-1`, excluded) |
| Organization relationships | `GET /organization-relationships` | 0 |
| Opportunities | `GET /opportunities`, `GET /public/career/opportunities` | 0 |
| Employers | `GET /public/career/employers` | 0 |
| Career events | `GET /career-events` | 0 |
| Projects (ecosystem) | none (`/projects/*` are learner submissions) | — |
| Real-world places | none | — |

Non-API canonical sources in use: the Curriculum pathway map (1 pathway, 13
courses) and the Metaverse registries (9 virtual districts, 36 facilities).

## 1. Programs

**Gap.** `/programs` returns no records, so SHU shows the curriculum pathway
and courses as a labeled `curriculum-as-program` projection.

**Needed in `shs-api` `/programs`** (per record): `program_id` (stable; reuse
curriculum ids where a program *is* that curriculum so SHU routes stay the
same), `title`, `description`, `status`, `category_id` (from
`/programs/taxonomy`), operating `organization_id`, delivery location
(`place_id` or address/region), eligibility/audience, and links:
`GET /programs/:id/careers` (populated), program ↔ curriculum course ids.

**SHU behavior when published.** Canonical programs are projected first and
replace any projection with the same id without changing its route.

## 2. Projects

**Gap.** No ecosystem project registry exists. The directory's "Central Ohio
Data Center Corridor" card is illustrative and has no canonical record.

**Needed.** A project authority (new `shs-api` resource or another owning
domain) exposing: `project_id`, `title`, `description`, `project_type`,
`status`, owning/operating `organization_id`, `place_id`/location, dates and
milestones **with provenance** (source document, verified-by), and relations to
programs, careers (workforce needs) and opportunities.

**SHU wiring.** Load it in `discoverySources.js` as `sources.projects`
(`projectProject` already maps `project_id|id|slug`, `title|name`,
`description`, `status`, `location|region`) and set `status.projects` from the
fetch result.

## 3. Opportunities

**Gap.** Both opportunity endpoints and the Metaverse opportunity exchange are
empty; the directory's scholarship/training "opportunities" are illustrative.

**Needed** (per record): `opportunity_id`, `title`, `description`,
`opportunity_type` (job, apprenticeship, internship, scholarship, training
seat…), `status` and open/close dates, `organization_id` / employer id,
related `program_id` / `career_slug`, `location`, and a real application URL or
in-app route. Publish employers (`/public/career/employers`) for career detail
"Employers".

## 4. Organization relationships

**Gap.** `/organization-relationships` is empty, and organizations carry no
links to programs, projects or places. Only SHF ↔ its registry destination
(exact title match) is derivable today. SHS is not linked to a registry
destination because no destination title matches "Silicon Heartland Solutions"
exactly (the `bos` record's title is "SHS Business Operating System").

**Needed.** Relationship records with `organization_id`,
`related_organization_id`, `relationship_type` (partner, funder, operator…),
status and provenance; plus an explicit `destination_id` field on organizations
(or on registry records) so SHU need not rely on title matching.

## 5. Real-world Places

**Gap.** No real-world place source exists. SHU shows only Metaverse districts,
always labeled virtual.

**Needed.** A place authority with `place_id`, `name`, `place_type` (campus,
facility, city, county, region), `city` / `county` / `state` (or geometry),
`status`, and relations to organizations, programs, projects and opportunities.
If a real place has a Metaverse representation, publish an explicit mapping
(`metaverse_district_id` / `metaverse_facility_id`) rather than inferring it
from names.

**SHU wiring.** Load as `sources.places`; `projectRealWorldPlace` keeps these
distinct (`projection: 'real-world-place'`, tag "Real-world").

## Related integration gaps found during the audit

- **Metaverse is not a registry destination.** Places link to `/metaverse`
  directly; there is no `universeDestinationRegistry` record for it and no
  per-district deep link (district selection is in-page state).
- **Curriculum has no public per-course route.** Program detail actions open the
  Curriculum Hub (`/curriculum.html#/dashboard`).
- **API base configuration.** `src/lib/apiClient.js` defaults to
  `http://127.0.0.1:8000` when `VITE_API_BASE` is unset (it is unset in `.env*`),
  while the live API is on `:8091` behind Vite's `/api` proxy. SHU discovery
  uses the `/api` proxy; other apps using `apiClient` (e.g. the Career Center's
  `useCanonicalCareers`) may not reach the API in this dev setup.
- **Organization fixture.** `partner-1` / "Demo Partner Organization" is served
  by the organization seed; SHU excludes it explicitly.
- **Program ownership.** The pathway is titled "SHF … Pathway" but carries
  `owner: "curriculum"` and no organization id, so SHU does not draw an
  SHF → program edge.
