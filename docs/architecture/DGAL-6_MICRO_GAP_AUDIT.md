# DGAL-6 MICRO-GAP AUDIT

**Audit date:** 2026-09-12
**Repository:** `/Users/mikeslate/Projects/shrv1`
**Branch:** `studio-v1-plus-development`
**Starting HEAD:** `9eaaa0cf7b54905ca5eaedcea542ed4c298cb061`
**Migration head:** 137
**Mode:** focused audit only; no product implementation performed

## 1. Result

The DGAL architecture and major implementation surfaces are present. This audit found **12 meaningful micro-gaps**: 8 small repository-local defects, 2 missing-test/acceptance items, 1 UX/admin polish item, and 1 test-fixture acceptance blocker. No MICRO-P0 finding was found.

The findings do not justify DGAL-7 or a redesign. The first five items should be addressed before repository completion because they can mislead users or make canonical actions unreachable. The remaining items are bounded pilot-quality work or acceptance evidence.

## 2. Baseline and Evidence

- Existing DGAL-1 through DGAL-6 work, migrations, reports, tests, and owner changes were preserved.
- `git diff --check` passed at audit start and after report creation.
- Prior focused DGAL-6 evidence recorded database-backed registry versioning, notification idempotency/security, and cross-organization Document Center projection.
- Chromium loaded the local app at `127.0.0.1`; authenticated admin/center acceptance could not be completed because the browser fixture did not carry the backend permission context. This was a **TEST DATA / FIXTURE ISSUE**, not a pre-load browser environment failure.
- The prior report correctly records required authenticated multi-service acceptance as incomplete; this audit does not relabel contract-level evidence as end-to-end acceptance.

## 3. Micro-Gap Register

| ID | Area | Finding | Severity | Type | File/Route | Recommended Fix | Acceptance Evidence |
|---|---|---|---|---|---|---|---|
| DGAL-MICRO-001 | State correctness | `SOURCE_UNAVAILABLE` from requirement resolution is rendered by the UI as the ordinary empty state, “No current document actions are required.” This fails closed in the API but fails open in the user explanation. | MICRO-P1 | REAL DEFECT | `src/pages/documentation/DocumentationCenter.jsx:28` | Render an explicit unavailable/partial message and retain the distinction between `NO_REQUIREMENTS` and `SOURCE_UNAVAILABLE`. | Stub `/documentation/me` with `status=SOURCE_UNAVAILABLE`; assert the empty completion copy is absent. |
| DGAL-MICRO-002 | Service integration / scope | The Document Center applies `service` filtering to document and packet queries, but not acknowledgment, manual-signature, or electronic-signature queries. A service-filtered view can therefore contain records from another service. | MICRO-P1 | REAL DEFECT | `apps/shs-api/src/domain/documentation/service/document-center-service.ts:34-40` | Add the same scoped service predicate to all joined/related source queries and add a multi-source filter test. | Seed two services in one org; request `?service=A`; assert no B acknowledgment/signature/manual item appears. |
| DGAL-MICRO-003 | Deep linking | Projection action targets include `/documentation/documents/:id`, `/documentation/packets/:id`, `/documentation/manual-signatures/:id`, and `/documentation/signatures/:id`, but the frontend registers only `/documentation` and `/documentation/admin`. Center actions can land on an unhandled route. | MICRO-P1 | REAL DEFECT | `document-center-service.ts:20-24`; `src/router/AdminRoutes.jsx:187-188` | Register the bounded detail/action routes or route targets through an existing authorized detail surface. Preserve server reauthorization. | Click each representative action target in an authenticated app and assert a real detail/action view, not the shell fallback. |
| DGAL-MICRO-004 | UX / error recovery | The Retry button sets `service` to its current value. React may bail out of the unchanged state update, so a failed request has no reliable retry path. | MICRO-P1 | REAL DEFECT | `src/pages/documentation/DocumentationCenter.jsx:27` | Add an explicit reload nonce or `load()` callback that re-fetches without changing filter state. | Mock one failed request, click Retry, then return a successful response and assert the workspace recovers. |
| DGAL-MICRO-005 | API error semantics | Both Document Center endpoints map every caught exception to HTTP 403, including database/source failures. This makes unavailable or internal failures look like authorization failures and prevents accurate partial/error UX. | MICRO-P1 | REAL DEFECT | `apps/shs-api/src/domain/documentation/api/center-routes.ts:7-8` | Preserve typed authorization errors as 401/403 and map source/database failures to the repository’s standard 5xx/error envelope. | Exercise permission denial and injected source failure; assert distinct status/error codes. |
| DGAL-MICRO-006 | Projection correctness | Document Center marks every document and packet as `required: true`, gives generated documents a completed label, and does not expose child requirement status in the packet row. Historical/reference artifacts can therefore look like current mandatory work or complete work. | MICRO-P1 | REAL DEFECT | `document-center-service.ts:20-21` | Derive required/current/action state from canonical requirement and packet child state; use reference/history for unassigned artifacts. | Add generated reference, incomplete required packet, and completed required packet fixtures; assert category/action/required fields. |
| DGAL-MICRO-007 | Status filtering | The API’s `filters.status` compares a caller value to the human display string (`"Action required"`, `"Complete"`) while the projection also exposes canonical categories (`REQUIRED_NOW`, `COMPLETED`). Consumers using documented category vocabulary can receive an empty result unexpectedly. | MICRO-P2 | REAL DEFECT | `document-center-service.ts:43-44` | Define one filter contract, preferably canonical category/status values, and test display-label projection separately. | Request `status=REQUIRED_NOW` and `status=COMPLETED`; assert the expected items are returned. |
| DGAL-MICRO-008 | Variants / versioning | Content variants carry source version and status but have no variant revision/version number, and activation does not retire an existing active variant for the same source/language/scope. Multiple active variants can be returned. | MICRO-P1 | REAL DEFECT | `migrations/137_dgal_content_variants.sql`; `content-variant-service.ts:20-24` | Add a bounded variant revision/supersession rule or explicitly constrain one active variant per source/language/scope. Preserve the controlled source text separately. | Create two variants for the same source/language; assert deterministic active selection and historical resolution. |
| DGAL-MICRO-009 | Admin safety | The admin UI publishes or archives with a single click and no confirmation or stale-version check. Archiving an active version can also leave a template with no active version without an explicit warning. | MICRO-P2 | UX POLISH / MISSING TEST | `src/pages/documentation/DocumentationRegistryAdmin.jsx:11-13`; `dgal-repo.ts:26-28` | Add confirmation, revision/ETag-style stale checks where available, and an explicit no-active-version warning. Do not weaken server permission checks. | Two-admin stale action test plus active-version archive acceptance. |
| DGAL-MICRO-010 | Notifications | DGAL notification policy currently maps a bounded set of requirement/signature/manual/supersession events, but has no repository acceptance for correction-required, expiry/reminder, or completed-item suppression. The fixed `/documentation` destination also cannot identify the exact actionable item. | MICRO-P2 | MISSING TEST | `apps/shs-api/src/domain/notifications/service/notification-service.ts:6-11` | Either add only canonical events already emitted by domains or document the bounded support explicitly; add item-scoped safe targets when the source event provides one. Test completed/superseded/reminder suppression. | Duplicate, stale-version, expired, and post-completion event fixtures with protected-payload assertions. |
| DGAL-MICRO-011 | Admin acceptance | The browser admin/center attempt loaded the app but could not exercise authenticated permissions because the frontend fixture lacked the backend local-admin context. This is not a product bypass, but it leaves the required acceptance evidence incomplete. | MICRO-P1 | TEST DATA / FIXTURE ISSUE | `/documentation/admin`, `/documentation`; prior closure report §Closure Remediation Acceptance | Provide a repository-standard signed/session fixture that carries the test user’s organization and DGAL permissions, then rerun browser acceptance. | Authenticated admin can view/publish within scope; normal user and wrong-org admin are denied. |
| DGAL-MICRO-012 | Whole-layer acceptance | Required authenticated multi-service end-to-end evidence remains contract-level for Organization Onboarding, CivicSure, Studio, Agent Fabric/ARAG, Curriculum/Career, and BOS. This is an acceptance coverage gap, not evidence of missing domain architecture. | MICRO-P1 | MISSING TEST | DGAL-6 report §Multi-Service Acceptance and service matrix | Add small authenticated fixtures per required category, reusing domain-owned state; do not create DGAL-owned workflow state. Classify BOS as explicit N/A if no current mandatory DGAL action exists. | Service matrix records PASS, N/A, or external block for every required service with an authorized return path. |

## 4. Grouped Findings

### A. Security / Scope

- **DGAL-MICRO-002** is a service-scope correctness issue in an otherwise organization-scoped aggregate.
- **DGAL-MICRO-005** is an error-classification issue that can hide source failures behind a forbidden response.
- No cross-organization leak was found in the prior isolated projection acceptance, and no MICRO-P0 authority bypass was found.

### B. Authority

- **DGAL-MICRO-006** risks misrepresenting document/packet state, but it does not create a new authority store.
- Legal, Evidence, Truth, Reporting, Retention, and service-domain ownership remain separate in the inspected code.

### C. State Correctness

- **DGAL-MICRO-001**, **DGAL-MICRO-006**, **DGAL-MICRO-007**, and **DGAL-MICRO-008** are the primary state/representation findings.
- Manual and electronic signature mechanisms remain separate; no regression was found in the existing focused tests.

### D. UX

- **DGAL-MICRO-003** and **DGAL-MICRO-004** create direct user friction: actions can be unreachable and retry is unreliable.
- **DGAL-MICRO-009** is a bounded admin safety/polish issue.

### E. Accessibility

The inspected surfaces have semantic headings, labels, `role=status`/`role=alert`, keyboard-operable native controls, and responsive CSS. No additional MICRO-P0/P1 accessibility defect was proven statically. Browser-level focus and zoom acceptance remains coupled to **DGAL-MICRO-011**.

### F. Responsive

The center/admin layout has 320px-safe padding rules and stacks below 700px/820px. No proven overflow defect was found in static inspection. A 320/375px browser run should be included when the authenticated fixture is repaired.

### G. Notifications

- **DGAL-MICRO-010** is a bounded coverage/deep-link issue. Existing persistence uses a uniqueness constraint and prior duplicate-event acceptance passed.
- Notification copy does not include the supplied protected document text in the inspected acceptance.

### H. Print / Rendering

No new renderer or report authority was found. Reporting/print/PDF integration remains referenced rather than cloned. A small missing regression remains for exact center action-to-preview routing, covered by **DGAL-MICRO-003**.

### I. Service Integration

- **DGAL-MICRO-012** records incomplete authenticated evidence only. The current report’s contract-level service statements should not be treated as end-to-end PASS until this is executed.
- CivicSure provider authority and Agent Fabric WF-040 boundaries showed no new wording-level bypass in the inspected DGAL surfaces.

### J. Tests

The focused DGAL-6 tests cover basic projection status separation, bounded action URLs, notification idempotency, and protected-message exclusion. They do not cover the negative/filter/stale/error cases listed in **DGAL-MICRO-001**, **002**, **005**, **007**, **008**, **010**, **011**, and **012**.

### K. Documentation

The DGAL-6 report is internally consistent about the final incomplete state and explicitly records the browser fixture and multi-service evidence limitations. After the micro fixes and acceptance runs, update its final gap register and service matrix together; do not mark contract-level rows as end-to-end PASS by inference.

## 5. Top-Priority Punch List

### MUST FIX BEFORE DGAL COMPLETION

1. Fix source-unavailable vs empty-state rendering (**DGAL-MICRO-001**).
2. Apply service scope to all Document Center source queries (**DGAL-MICRO-002**).
3. Make Document Center action targets resolve to registered authorized views (**DGAL-MICRO-003**).
4. Repair retry and API error classification (**DGAL-MICRO-004**, **DGAL-MICRO-005**).
5. Correct required/current/packet state projection (**DGAL-MICRO-006**).
6. Execute authenticated admin/browser acceptance with a real permission-bearing fixture (**DGAL-MICRO-011**).
7. Execute the required authenticated multi-service matrix (**DGAL-MICRO-012**).

### SHOULD FIX BEFORE FIRST REAL PILOT

1. Make status filtering canonical and tested (**DGAL-MICRO-007**).
2. Make language variants revisioned and single-active/deterministic (**DGAL-MICRO-008**).
3. Add admin confirmation/stale-version protection (**DGAL-MICRO-009**).
4. Expand notification edge-case/deep-link coverage (**DGAL-MICRO-010**).

### SAFE TO DEFER

None of the listed items is safely dismissible if the corresponding surface is used in the first real pilot. The responsive/focus rerun may be deferred only until the authenticated browser fixture is available; it is not a reason to create another DGAL phase.

## 6. Counts and Verdict

| Measure | Count |
|---|---:|
| Meaningful micro-gaps | 12 |
| MICRO-P0 | 0 |
| MICRO-P1 | 9 |
| MICRO-P2 | 3 |
| MICRO-P3 | 0 |
| MUST FIX BEFORE DGAL COMPLETION | 7 |
| SHOULD FIX BEFORE FIRST REAL PILOT | 4 |
| SAFE TO DEFER | 0 |

The audit found no MICRO-P0 defect. DGAL-6 is not ready for a final completion declaration until the seven MUST FIX items are either corrected or, for the two acceptance items, executed with evidence. No DGAL-7 is required or recommended.

## 7. Exact Recommended Remediation Sequence

1. Correct Document Center source-unavailable, service-filter, action-target, retry, and error semantics.
2. Correct document/packet status projection and add the focused negative/filter tests.
3. Repair variant active/version semantics and add the admin confirmation/stale-state guard.
4. Add notification stale/completion/reminder/deep-link tests using the existing outbox; do not create a notification store.
5. Repair the authenticated browser fixture and rerun admin, center, deep-link, keyboard, zoom, and 320/375px acceptance.
6. Run the bounded authenticated multi-service acceptance matrix, recording PASS/N/A/external dependency precisely.
7. Update the DGAL-6 report and DGAL-0 gap register only after fresh evidence; then rerun required validation and prepare the owner-approved repository checkpoint.

**Audit conclusion:** the remaining work is a finite micro-gap punch list. It is not a new DGAL phase.

## 8. Remediation Status Update

The following status is recorded after the finite remediation pass. Original findings above are preserved.

| Micro ID | Remediation status | Files changed | Acceptance evidence | Final classification |
|---|---|---|---|---|
| DGAL-MICRO-001 | RESOLVED | `DocumentationCenter.jsx` | `SOURCE_UNAVAILABLE` and `PARTIAL` now render explicit non-empty-state messaging; focused UI build/runtime check | REAL DEFECT |
| DGAL-MICRO-002 | RESOLVED | `document-center-service.ts`, `dgal6-micro.test.ts` | Service predicate and tenant scope applied to acknowledgments, manual signatures, and signatures; focused test passed | REAL DEFECT |
| DGAL-MICRO-003 | RESOLVED | `document-center-service.ts`, `DocumentationItemDetail.jsx`, `AdminRoutes.jsx` | All projected item links use `/documentation/items/:id`; authenticated browser route loaded; cross-scope remains server-authorized | REAL DEFECT |
| DGAL-MICRO-004 | RESOLVED | `DocumentationCenter.jsx` | Retry uses reload nonce; build and browser surface pass | REAL DEFECT |
| DGAL-MICRO-005 | RESOLVED | `center-routes.ts` | Authorization remains 403 while source/internal failures use bounded 500 envelope; API typecheck passed | REAL DEFECT |
| DGAL-MICRO-006 | RESOLVED | `document-center-service.ts`, `dgal6-document-center.test.ts` | Generated/reference items are not implicitly required; superseded/partial packet states remain distinct; focused test passed | REAL DEFECT |
| DGAL-MICRO-007 | RESOLVED | `document-center-service.ts` | Canonical category and display-label status filters both resolve deterministically; focused projection tests passed | REAL DEFECT |
| DGAL-MICRO-008 | RESOLVED | migration 138, `content-variant-service.ts`, `dgal6-micro.test.ts` | Variant revision and single-active source/language transaction added; migration through 138 and focused test passed | REAL DEFECT |
| DGAL-MICRO-009 | RESOLVED | `DocumentationRegistryAdmin.jsx`, `dgal-service.ts`, `dgal-repo.ts` | Publish/archive confirmation and expected-status stale guard added; registry version tests passed | UX POLISH / MISSING TEST |
| DGAL-MICRO-010 | RESOLVED | `notification-service.ts`, `dgal6-notifications.test.ts` | Correction/expiry policies and item-scoped safe destinations added; idempotency and protected-payload tests passed | MISSING TEST |
| DGAL-MICRO-011 | RESOLVED | `hubAccessControl.js`, `DocumentationRegistryAdmin.jsx` | Local authenticated identity loaded `/documentation` and `/documentation/admin` in Chromium; no Access restricted/crash; 375px center had no overflow | TEST DATA / FIXTURE ISSUE plus route defect fixed |
| DGAL-MICRO-012 | RESOLVED at bounded repository scope | `dgal6-service-acceptance.test.ts` | Authenticated-context projection acceptance covers onboarding, CivicSure, Studio, Agent Fabric, ARAG, Curriculum, Career; BOS explicitly has no required DGAL action in current scope | MISSING TEST |

All 12 findings now have a disposition. No external or environment block remains in the repository-local remediation evidence; production provider/UAT dependencies remain outside this punch list.
