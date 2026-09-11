# SHF Career Center Phase 3 — Public Career Detail

## Canonical route

The public Career Detail route is:

`/career.html#/careers/:careerSlug`

The route uses the existing Career app hash host and the Career API's canonical
slug lookup. Unknown slugs render an accessible public not-found state instead
of redirecting to personal Career Center data.

## Source authority

Career identity is read from `GET /careers/:slug`, implemented by the existing
Career domain. Curriculum references are read from
`GET /careers/:slug/curriculum`. No Career model, static detail dataset, or
Career-local persistence was added.

## Public/private boundary

The detail page is public. It renders only public Career identity, description,
family, sector, and curriculum requirement references. It does not read or
render learner plans, resumes, portfolios, credentials, calendars, profiles,
applications, or recommendations. The personal handoff goes to
`/career.html#/dashboard` without pretending to persist a selection.

## Canonical relationships used

- Career family: `family_name` from the Career API record.
- Curriculum: requirement identifiers from the Career curriculum endpoint,
  with links to the existing Curriculum lesson route.
- Pathways: the page links to the existing public Pathways surface, but does
  not claim a Career-to-program pathway relationship because no public mapping
  endpoint is available in this phase.

## Honest unavailable states

Skills/competencies, public pathway mappings, education/training requirements,
opportunities, wages, demand, employers, and regional workforce data are not
invented. The page explains when those relationships are not published by the
current canonical public sources.

## Tests and verification

- `tests/careerPhase3Canonicalization.test.mjs` verifies the route, API usage,
  unavailable-state language, and no fabricated workforce fields.
- `tests/ui/career.spec.mjs` verifies Explore-to-Detail linking, valid detail
  rendering with mocked API responses, curriculum deep links, safe not-found
  behavior, and existing route behavior.

## Remaining gaps

Public skill projections, explicit program-career pathway projections,
education/training provider data, public opportunity visibility, regional
workforce data, and authenticated save/add-to-plan behavior remain later-phase
work. Existing backend authorities remain unchanged.
