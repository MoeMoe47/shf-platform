# SYS-8B1 Canonical Public Assurance Projection / WF-012 Product Closure and Acceptance

Date: 2026-09-11  
Repository: `/Users/mikeslate/Projects/shrv1`  
Branch: `studio-v1-plus-development`  
HEAD at baseline: `0441aa4fe5f74d330a9f100f678d6353a6cac43b`

## 1. Executive Result
WF-012 is COMPLETE for its current repository-local contract. The live public
assurance explorer and detail route now consume the canonical Reporting public
projection, with centralized publication predicates, bounded fields, safe
empty/error behavior, and protected direct-ID lookup.

## 2. Repository Baseline
The worktree was preserved. Baseline dirty count was 313 entries (124 tracked,
189 untracked), including extensive owner work unrelated to this phase. No
reset, stash, clean, commit, push, deployment, or cloud provisioning occurred.

## 3. WF-012 Exact Contract
Trigger: an approved public assurance publication. Owner: Reporting/Public
Disclosure. Source: canonical eligible facts and authorized public snapshot.
Consumer: mounted public CivicSure explorer/detail. Success: current published
public-safe projection is visible. Failure: unpublished, unauthorized, revoked,
or unavailable data is suppressed without fabricated fallback. Dependencies are
Truth, Metrics, Reporting, and disclosure policy.

## 4. Existing Public Architecture
`report_publication_*` services and `shf_public_impact_projections` remain the
authority. The new bounded routes are `/public/assurance/projections` and
`/public/assurance/projections/:projectionId`.

## 5. Canonical Ownership Decision
Reporting/Public Disclosure owns the public projection. Evidence, Truth,
Metrics, CivicSure, and source domains retain their own authority.

## 6. Mock / Demo Data Audit
The active `#/explorer` and `#/explorer/projections/:id` paths no longer import
mock records, mock metrics, mock map data, or mock search data. Remaining frame
modules are not part of the active WF-012 list/detail authority and remain
TEST/frame-only.

## 7. Canonical Source Facts
The fixture used an institutionally approved GPA disclosure policy, a registered
metric, an eligible snapshot, release authorization, and a current publication.

## 8. Public-Safe Projection
List and detail share the same `CANONICAL_PUBLICATION`, `PUBLISHED`, authorized,
and current-publication predicates. The boundary adapter is the final allowlist.

## 9. Default-Deny Policy
No rows produced an honest empty state. Unknown detail identifiers returned
`404 PUBLIC_ASSURANCE_NOT_FOUND`; API failure showed an unavailable state.

## 10. Public Field Allowlist
The DTO exposes public reference, report/metric label, reporting period,
data-as-of, geography/program granularity, representation, display value,
suppression state, and publication timestamp only. Tenant IDs, private IDs,
raw evidence, security events, agent data, prompts, and internal notes are not
returned.

## 11. List API
`GET /public/assurance/projections` returned HTTP 200 and one approved projection.

## 12. Detail API
The public reference `impact_projection_c80d069b-1c37-4db8-b16c-ae5af394ae61`
returned HTTP 200 with the same bounded record.

## 13. List / Detail Agreement
The browser card linked to the returned public reference and opened the matching
detail record; PostgreSQL, list JSON, detail JSON, and rendered detail agreed.

## 14. Public Record
The published fixture displayed `Verified employment starts`, value `12`,
`2026 Q1`, `COUNTY`, and `NAMED_PROGRAM`.

## 15. Private Record
No private record was inserted into the public projection. The direct-ID
unknown/private-shaped request returned safe 404 with no existence detail.

## 16. Reviewable / Unverified Record
Reviewable or unverified source facts are not publication-authorized and are
excluded by the canonical publication predicates.

## 17. Revoked / Superseded Record
Currentness and publication status are required on every read; withdrawn or
superseded publications therefore leave the current public list/detail.

## 18. Evidence Boundary
Evidence remains upstream authority and is not created or verified by this page.

## 19. Truth Boundary
The projection consumes accepted governed facts and never writes Truth.

## 20. Reporting Boundary
Reporting/Public Disclosure owns snapshot, authorization, publication, and the
public read model; no duplicate reporting authority was introduced.

## 21. CivicSure Boundary
The page presents approved aggregate assurance data and does not imply provider
sanction, hiring readiness, or an unapproved CivicSure decision.

## 22. Organization / Tenant Privacy
Public responses omit internal organization/tenant scope and only expose
deliberately public projection fields.

## 23. Search / Filter
The mounted controls are bounded presentation controls. They do not query raw
private data; richer filtering remains unavailable until a public projection
exists.

## 24. Empty State
An empty list displays “No approved public assurance records are currently
available” and never substitutes mock cards.

## 25. Failure State
An intercepted API failure displayed “Public assurance data is temporarily
unavailable. No sample data is shown.”

## 26. Data Freshness / Trust Labels
Rendered timestamps and status derive from the projection. The UI does not add
unverifiable freshness or readiness claims.

## 27. Mounted Consumer
The active mounted consumer is `apps/shf-web` route `#/explorer`, with detail
at `#/explorer/projections/:id` and legacy program IDs routed through the same
live detail component.

## 28. Fresh PostgreSQL
Disposable database: `shs_sys8b1_20260911`, PostgreSQL on `127.0.0.1:55445`.
Migrations 001-130 applied from scratch; pending, drift, and unknown-applied
sets were empty. Schema integrity returned `{ "ok": true, "failures": [] }`.

## 29. Fixture
The fixture used Org A, a user, registered GPA metric, approved disclosure
policy with required sign-offs, public eligibility, snapshot, release authority,
authorization, and one generated current publication. Terminal records were
generated by canonical services, not seeded as a public projection.

## 30. Authenticated / Public HTTP Decision
WF-012 is intentionally public at the read boundary; administrative publication
remains authenticated and policy-gated.

## 31. HTTP Acceptance
Positive list/detail passed. Unknown direct ID passed safe 404. The API response
was bounded and contained no private or agent fields.

## 32. Browser Acceptance
Headless browser acceptance passed: the live record appeared in the explorer,
the public-reference link opened detail, and the detail showed the canonical
metric/value. API failure produced no sample fallback.

## 33. Direct-ID Security
Direct lookup of `not-a-real-public-reference` returned HTTP 404 and the safe
not-found body.

## 34. PostgreSQL / API / UI Agreement
The projection ID, metric label, value, period, status, and public fields agreed
across the durable row, HTTP list/detail, and rendered browser detail.

## 35. Replay / Idempotency
Publication remains governed by existing idempotent publication commands and
current-publication supersession rules. No new projection replay path was added.

## 36. Update / Correction
The read model is derived from current canonical publication state; correction
and supersession are reflected by existing publication currentness rules.

## 37. Public Withdrawal
Rows not `PUBLISHED` or not current are suppressed by both list and detail.

## 38. Performance
List/detail use bounded indexed projection lookups and authorization/currentness
`EXISTS` predicates. No new N+1 or unbounded payload path was introduced.

## 39. Accessibility
Existing UI validation passed. The mounted surface retains skip navigation,
semantic headings, labeled result links, status roles, and keyboard controls.

## 40. Security
Static audit and focused tests covered source/public predicates, allowlisting,
direct-ID protection, no mock fallback, and sensitive-field omission.

## 41. Regression
Passed: public disclosure safety tests (1/1), public publication/eligibility/
snapshot tests (15/15), focused WF-012 contract test (1/1), API typecheck,
API build, root build, manifests validation, UI validation, schema integrity,
migration status, and browser acceptance.

## 42. Failure Classification
The earlier positive-fixture failures were fixture setup issues (missing metric,
policy sign-offs, release authority, and stale current publication). The prior
`tsx` IPC EPERM is a harness/environment issue. No product failure remains.

## 43. Remediation
Added the canonical public assurance list/detail service and routes, added the
public-reference allowlist field, and connected the active explorer/detail
consumer to live data with honest loading, empty, and failure states.

## 44. Files Created
- `apps/shf-web/src/services/public-assurance-client.js`
- `apps/shf-web/src/pages/civicsure/explorer/publicAssuranceViewModel.js`
- `tests/wf012PublicAssuranceProjection.test.mjs`
- this report

## 45. Files Modified
Reporting public repository/service/routes, public projection boundary, and the
active CivicSure explorer/detail/filter/category components. Systemwide registry,
dependency graph, roadmap, and SYS-8B0 ledger were updated with fresh status.

## 46. Owner Work Preservation
All pre-existing dirty and untracked work was preserved. No unrelated files were
reverted or deleted.

## 47. WF-012 Decision
**WF-012 = COMPLETE.** No HIGH or P0/P1 WF-012 product gap remains.

## 48. Remaining Partial Count
14 repository-local partial workflows remain. WF-046 was not closed by this
shared public projection seam.

## 49. Locked Burn-Down Status
The locked burn-down remains **15 -> 14 -> 11 -> 8 -> 2 -> 0**.

## 50. Exact Next Phase
**SYS-8B2 — Identity, legal authority, and cross-product isolation acceptance**
for WF-001, WF-044, and WF-050. It was not started.
