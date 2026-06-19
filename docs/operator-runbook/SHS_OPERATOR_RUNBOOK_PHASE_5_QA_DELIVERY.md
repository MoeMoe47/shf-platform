# SHS Operator Runbook V1 - Phase 5: QA + Delivery

Created: 2026-06-19

Mode: documentation and audit only. No features, routes, services, pages, refactors, runtime behavior changes, deletes, moves, staging, commits, or package changes were performed.

## Goal

Document how SHS verifies a completed project before delivery.

This phase starts after implementation is complete. It ends when the project is Delivery Ready.

## Entry Condition

Start Phase 5 when:

- Phase 4 Build Packet is Development Ready.
- Implementation work is complete.
- The completed build is available for QA.
- Approved mock, build packet, route list, data assumptions, permissions, report expectations, and delivery criteria are available.

## Exit Condition

Delivery Ready.

A project is delivery-ready when:

- Desktop layout passes.
- Mobile layout passes.
- Navigation passes.
- Forms and interactions pass or are explicitly out of scope.
- Reports are truth/readiness-safe where applicable.
- Permissions and route protection pass.
- No public/private leakage is found.
- Screenshot QA is recorded.
- Functional QA passes.
- Build passes.
- Governance check passes.
- Delivery owner signs off.

## Current QA + Delivery Surfaces

| Route | Page | Status | Purpose |
| --- | --- | --- | --- |
| `admin.html#/ops/screenshot-qa` | `src/pages/admin/ops/OpsScreenshotQA.jsx` | Existing | Records mock screenshot notes, built screenshot notes, match score, QA status, and drift category. |
| `admin.html#/ops/mock-review` | `src/pages/admin/ops/OpsMockReview.jsx` | Existing | Confirms mock approval and required changes before delivery QA compares the build. |
| `admin.html#/ops/build-packet` | `src/pages/admin/ops/OpsBuildPacket.jsx` | Existing | Provides the source of truth for route, page, specification, QA checklist, and non-goals. |
| `admin.html#/ops/production` | `src/pages/admin/ops/OpsProductionDashboard.jsx` | Existing | Shows project/page workflow status and blocked pages. |
| `admin.html#/reports` | `src/pages/admin/reporting/ReportingCommandSurface.jsx` | Existing | Trust-aware reports admin/readiness surface when delivery includes reports. |
| `admin.html#/truth-spine` | `src/pages/admin/truth-spine/TruthSpinePage.jsx` | Existing | Truth/readiness authority when delivery includes public claims, report facts, or approval gates. |

## Live QA Context

`docs/SHRV1_SHF_NEXT_ROUTE_BRIDGE_AUDIT_V1.md` documents that:

- `admin.html#/ops/screenshot-qa` maps conceptually to shf-next `/ops/qa`.
- QA + Delivery live workflow belongs in shf-next.
- SHRV1 has screenshot/mock review admin steps.

Phase 5 should use SHRV1 as the admin/governance QA record and avoid treating SHRV1 as the full live QA + Delivery runtime.

## Permission Boundary

`src/system/identity/hubAccessControl.js` keeps `/ops/*` routes SHS-admin only.

`src/pages/admin/ops/opsData.js` states that clients see approved demos, deliverables, timelines, and finished systems, not internal build packets, prompts, QA machinery, or adaptive learning.

## QA Checks

### Desktop Layout

- Target route loads at approved desktop viewport.
- Layout matches approved mock or build packet direction.
- Text fits without overlap or truncation.
- Cards, tables, forms, headers, sidebars, and primary actions align correctly.
- No horizontal scrolling unless intentionally documented.
- Important states are visible and not hidden behind clipped containers.

### Mobile Layout

- Target route loads at approved mobile viewport.
- Navigation remains reachable.
- Content stacks in a readable order.
- Tap targets are usable.
- Text fits within controls and panels.
- No desktop-only layout assumptions block the primary task.

### Navigation

- Primary route loads directly.
- Sidebar/header links point to expected destinations.
- Back/return links do not send the user to unrelated fallback pages.
- Protected admin routes remain protected.
- Public routes do not enter internal shells.
- Fallback behavior is intentional and documented.

### Forms

- Required fields are visible and labeled.
- Inputs accept expected values.
- Validation/error behavior is understandable.
- Submit/save/copy/download actions work or are clearly marked non-functional for V1.
- Form state persists only where expected.
- No private data is stored or displayed on public routes.

### Reports

- Reports use trust-aware admin/reporting surfaces when applicable.
- Truth Spine status is checked for report claims when public or funder-facing.
- Report readiness, public approval, and approval-gate status are not bypassed.
- Generated/exported report content does not include internal QA notes or prompts.
- No unverified claim is communicated as verified.

### Permissions

- Admin/private routes remain SHS-admin only where required.
- Client/admin/operator roles are not widened by the delivery change.
- `ProtectedHubRoute` and `AuthGuard` behavior is not bypassed.
- `PermissionGuard` checks remain intact for reports, audit, identity, aggregation, and truth surfaces.
- No secret, role override, or permission metadata appears in public UI.

### Public/Private Leakage

- Public routes do not display internal build packets.
- Public routes do not display prompts, QA machinery, adaptive learning, role metadata, or private notes.
- Client-facing deliverables show only approved copy, assets, reports, and demos.
- Production Ops and ClientOps private data do not mutate SHF Impact Data Spine directly.
- Public claims pass Truth Spine/public approval when required.

### Screenshot QA

- Mock screenshot notes are recorded.
- Built screenshot notes are recorded.
- Match score is recorded.
- Drift category is recorded.
- QA status is set.
- Any mismatch has a correction note or approved exception.

### Functional QA

- Primary user path works end to end.
- Buttons, links, toggles, tabs, filters, copy, download, and save actions behave as expected.
- State updates persist where expected.
- Empty/loading/error/success/review states are acceptable.
- Console has no critical errors in the tested workflow.
- Build passes.

### Delivery Readiness

- Known blockers are resolved or explicitly approved.
- Open QA items have owner and next action.
- Launch/client handoff notes are complete.
- Client-facing content and assets are approved.
- Reports/public claims have readiness approval where needed.
- Final delivery owner signs off.

## Operator Checklist

1. Open the completed project/page and the Phase 4 build packet.
2. Run desktop layout review against the approved mock and packet.
3. Run mobile layout review against the approved mock and packet.
4. Verify navigation, route loading, fallback behavior, and protected route boundaries.
5. Verify forms and save/submit/copy/download behaviors.
6. Verify reports through trust-aware reporting surfaces when reports are in scope.
7. Verify permissions and role boundaries.
8. Check public/private leakage on public, client-facing, and admin/private routes.
9. Record screenshot QA notes, match score, drift category, and QA status in `admin.html#/ops/screenshot-qa`.
10. Run functional QA for the primary user path and important edge states.
11. Run build and governance validation.
12. Record delivery readiness, blockers, owner, next action, and approved exceptions.
13. Exit only when Delivery Ready is true or blockers are explicitly documented.

## Delivery Ready Criteria

- Desktop layout passes or has approved exception.
- Mobile layout passes or has approved exception.
- Navigation passes.
- Forms and interactions pass or are explicitly out of scope.
- Reports are truth/readiness-safe where applicable.
- Permissions and route protection pass.
- No public/private leakage is found.
- Screenshot QA is recorded.
- Functional QA passes.
- Build passes.
- Governance check passes.
- Delivery owner signs off.

## Findings

- SHRV1 has an existing screenshot QA admin surface at `admin.html#/ops/screenshot-qa`.
- SHRV1 Production Ops records screenshot notes, match score, drift category, and QA status.
- SHRV1 `/ops/*` QA/admin surfaces are SHS-admin only through hub access control.
- SHF-Next is documented as the live QA + Delivery owner for `/ops/qa`, while SHRV1 owns admin/governance screenshot/mock review surfaces.
- Reports and public claims must use trust-aware Reports and Truth Spine readiness paths when delivery includes report output.
- Delivery Ready is currently operator-enforced, not a hard runtime readiness gate.

## Launch Blockers

- No hard Delivery Ready validation gate exists in SHRV1.
- Screenshot QA stores notes and scores, but screenshot capture/attachment is not automated in SHRV1.
- Functional QA is checklist-driven rather than tool-enforced.
- No durable QA backend persistence exists for SHRV1 Production Ops V1.
- Cross-app sync to shf-next `/ops/qa` is documented but not automated.

## Post-V1 Improvements

- Add a structured Delivery Ready readiness model.
- Add screenshot attachment support for mock and built screenshots.
- Add automated route smoke checks for desktop and mobile.
- Add structured form/navigation/report/permission QA records.
- Add cross-link or export from SHRV1 screenshot QA to shf-next `/ops/qa`.
- Add required owner/signoff fields before Delivery Ready can be set.

## V1 Complete?

Yes for Phase 5 runbook documentation.

No for runtime product completeness. QA can be run manually today, but Delivery Ready is not hard-validated or durably persisted.

## Validation

| Command | Result | Notes |
| --- | --- | --- |
| `python3 -m json.tool docs/operator-runbook/SHS_OPERATOR_RUNBOOK_PHASE_5_QA_DELIVERY.json` | PASS | JSON report is valid. |
| `npm run build` | PASS | Build completed; existing Vite large-chunk warning remains. |
| `npm run check:governance` | PASS | Governance checks passed, including registry, Truth Spine, Oracle, AI Guardrails, Game Theory, and duplicate cleanup checks. |
