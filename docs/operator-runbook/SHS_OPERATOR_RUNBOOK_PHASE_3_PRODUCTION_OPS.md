# SHS Operator Runbook V1 - Phase 3: Production Ops

Created: 2026-06-19

Mode: documentation and audit only. No features, routes, services, pages, refactors, runtime behavior changes, deletes, moves, staging, commits, or package changes were performed.

## Goal

Document how the production team turns a Sales Handoff into a build-ready SHS project.

This phase starts after Phase 2 Sales Handoff. It ends when the active project/page has a build packet ready for implementation.

## Entry Condition

Start Phase 3 when a Phase 2 Sales Handoff has produced an approved or review-ready handoff packet with:

- Selected package.
- Client goals.
- Deliverables.
- Brand details.
- Timeline.
- Required pages/modules.
- Proposal approval status.
- Production owner, sales owner, build owner, and next action.

## Exit Condition

Build Packet Ready.

A project is build-packet-ready when:

- Production Ops project exists.
- Required page/module records exist.
- Brand profile is documented.
- Page intent is documented.
- Layout blueprint is documented.
- Visual treatment is documented.
- Asset governance is documented.
- Data binding is documented.
- Mock review is approved or ready for review.
- Screenshot QA expectations are documented.
- Any blockers are resolved or explicitly recorded.
- The build packet can be copied or downloaded for implementation.

## Current Routes / Pages

All Phase 3 surfaces already exist under `src/pages/admin/ops/` and are mounted in `src/router/AdminRoutes.jsx` behind `AuthGuard` and `protect(...)`.

| Phase Item | Route | Page | Status |
| --- | --- | --- | --- |
| Production dashboard | `admin.html#/ops/production` | `src/pages/admin/ops/OpsProductionDashboard.jsx` | Existing |
| Project setup | `admin.html#/ops/projects` | `src/pages/admin/ops/OpsProjectSetup.jsx` | Existing |
| Brand profile | `admin.html#/ops/brand-profile` | `src/pages/admin/ops/OpsBrandProfile.jsx` | Existing |
| Page intent | `admin.html#/ops/page-intent` | `src/pages/admin/ops/OpsPageIntent.jsx` | Existing |
| Layout blueprint | `admin.html#/ops/layout-blueprint` | `src/pages/admin/ops/OpsLayoutBlueprint.jsx` | Existing |
| Visual treatment | `admin.html#/ops/visual-treatment` | `src/pages/admin/ops/OpsVisualTreatment.jsx` | Existing |
| Asset governance | `admin.html#/ops/assets` | `src/pages/admin/ops/OpsAssetGovernance.jsx` | Existing |
| Data binding | `admin.html#/ops/data-binding` | `src/pages/admin/ops/OpsDataBinding.jsx` | Existing |
| Mock review | `admin.html#/ops/mock-review` | `src/pages/admin/ops/OpsMockReview.jsx` | Existing |
| Build packet | `admin.html#/ops/build-packet` | `src/pages/admin/ops/OpsBuildPacket.jsx` | Existing |
| Screenshot QA | `admin.html#/ops/screenshot-qa` | `src/pages/admin/ops/OpsScreenshotQA.jsx` | Existing |
| Learning loop | `admin.html#/ops/learning` | `src/pages/admin/ops/OpsLearningDashboard.jsx` | Existing |

Most individual Ops pages are thin wrappers around `OpsWorkflowPage`; the canonical behavior lives in `OpsProductionDashboard.jsx`, `opsData.js`, and `opsStorage.js`.

## LocalStorage State

Production Ops V1 is browser-local and persists through these `shs.ops.*` keys:

- `shs.ops.projects`
- `shs.ops.activeProjectId`
- `shs.ops.stageStatus`
- `shs.ops.buildPacketDraft`
- `shs.ops.screenshotQaNotes`
- `shs.ops.learningEvents`
- `shs.ops.pages`
- `shs.ops.activePageId`
- `shs.ops.pageWorkflowStatus`
- `shs.ops.pageBuildPacketDraft`
- `shs.ops.pageQaNotes`
- `shs.ops.pageLearningEvents`

## Workflow Pipeline

Production Ops uses these workflow stages:

- Sales discovery
- Quick demo/mock
- Approval
- Scope confirmation
- Build-ready packet
- Codex implementation
- Screenshot QA
- Functional QA
- Delivery
- Adaptive learning loop

Each stage can be:

- Not Started
- In Progress
- Ready for Review
- Approved
- Blocked

## Operator Checklist

1. Open `admin.html#/ops/projects`.
2. Create or update the Production Ops project from the Phase 2 handoff packet.
3. Create page/module records for each required deliverable.
4. Select the active project and active page/module.
5. Complete Brand Profile.
6. Complete Page Intent.
7. Complete Layout Blueprint.
8. Complete Visual Treatment.
9. Complete Asset Governance.
10. Complete Data Binding.
11. Complete Mock Review and set mock status.
12. Record Screenshot QA expectations.
13. Check the page-level workflow status board for blockers.
14. Open `admin.html#/ops/build-packet`.
15. Confirm the generated build packet includes project, page, workflow, specs, screenshot QA, acceptance checklist, and non-goals.
16. Set Build Packet status to Ready for Review when complete.
17. Record any production lesson in `admin.html#/ops/learning`.

## Required Production Sections

### Project Setup

Route: `admin.html#/ops/projects`

Required outputs:

- Project name.
- Client/internal type.
- Brand system.
- Owner.
- Priority.
- Confidentiality.
- Status.
- Current stage.
- Page/module records.

Done when the project is created or updated and at least one page/module record exists when page work is required.

### Brand Profile

Route: `admin.html#/ops/brand-profile`

Required outputs:

- Audience.
- Tone.
- Vocabulary.
- Trust signals.
- Logo usage.
- Visual constraints.
- Approved references.
- Prohibited references.

Done when the brand profile is specific enough to prevent visual drift and accidental public style borrowing.

### Page Intent

Route: `admin.html#/ops/page-intent`

Required outputs:

- Primary user action.
- First-visit explanation.
- Repeated-use behavior.
- Proof points.
- Conversion points.
- Decision support zones.

Done when every required page/module has a clear operator or client action.

### Layout Blueprint

Route: `admin.html#/ops/layout-blueprint`

Required outputs:

- Screen list.
- Section order.
- Major components.
- Responsive priorities.
- Empty, loading, active, success, and review states.
- Layout constraints.

Done when the implementation path is buildable without redesigning during coding.

### Visual Treatment

Route: `admin.html#/ops/visual-treatment`

Required outputs:

- Color direction.
- Density.
- Motion.
- Imagery.
- Component feel.
- Surfaces not to borrow from.

Done when the visual direction is approved for this project and does not disturb public Foundation, Solutions, Sales, Hub, or Exchange pages.

### Asset Governance

Route: `admin.html#/ops/assets`

Required outputs:

- Asset list.
- Source.
- Usage rights.
- Replacement status.
- Approval owner.
- Internal-only versus client-approved classification.

Done when no placeholder or internal-only asset can leak into final delivery by accident.

### Data Binding

Route: `admin.html#/ops/data-binding`

Required outputs:

- Field inventory.
- Static/mock/computed/imported/future API classification.
- Backend assumptions.
- Truth/reporting implications.
- Deferred integrations.

Done when the project states what data is real, mock, static, future, or requires governance before publication.

### Mock Review

Route: `admin.html#/ops/mock-review`

Required outputs:

- Page purpose review.
- Audience fit.
- Executive clarity.
- Visual credibility.
- Approval notes.
- Required changes.
- Mock status.

Done when the mock is approved or ready for review before the build packet is marked ready.

### Screenshot QA

Route: `admin.html#/ops/screenshot-qa`

Required outputs:

- Mock screenshot notes.
- Built screenshot notes.
- Match score.
- QA status.
- Drift category.
- Viewport/route notes.

Done when screenshot QA expectations are recorded before implementation and post-build QA can use the same criteria.

### Learning Loop

Route: `admin.html#/ops/learning`

Required outputs:

- Project.
- Active page.
- Workflow stage.
- Learning category.
- Learning note.

Done when important build packet, visual drift, data binding, approval, QA, and time-saver lessons are captured for future production cycles.

## Build Packet Ready Criteria

- Active project exists.
- Active page/module exists.
- Project owner, priority, confidentiality, status, and stage are set.
- Page route, page type, audience, primary goal, and status are set.
- Brand profile is filled.
- Page intent is filled.
- Layout blueprint is filled.
- Visual treatment is filled.
- Asset rules are filled.
- Data binding is filled.
- Mock review is filled and status is Ready for Review or Approved.
- Screenshot QA expectations are filled.
- Acceptance checklist is present.
- Non-goals and protected public surfaces are explicit.
- No workflow stage is blocked without a blocker note.
- Build packet can be copied or downloaded.

## Governance Boundaries

- Production Ops is an internal/private pre-launch SHS surface.
- Production Ops must not mutate SHF Impact Data Spine directly.
- Production Ops must not publish public reports directly.
- Production Ops must not mark records public-approved.
- Production Ops build packets, prompts, QA machinery, screenshot drift notes, and adaptive learning remain internal.
- Public claims, reports, funder-facing proof, or impact records must pass the appropriate governance path before publication.

## Findings

- All requested Phase 3 surfaces already exist under `src/pages/admin/ops/`.
- All `/ops/*` routes are mounted in `AdminRoutes.jsx` and protected through admin routing.
- Most individual Ops pages are thin wrappers around `OpsWorkflowPage`, so the canonical behavior lives in `OpsProductionDashboard.jsx`, `opsData.js`, and `opsStorage.js`.
- The Build Packet surface can copy or download a generated internal page build packet.
- The current Production Ops workflow is localStorage-backed and browser-local.
- The Production Ops governance audit classifies Production Ops as internal/private pre-launch source material, not public SHF impact data.

## Launch Blockers

- Production Ops V1 uses localStorage rather than durable backend persistence.
- No automated import from Phase 2 Sales Handoff into Production Ops project/page records.
- Build Packet Ready is operator-enforced, not hard-blocked by validation logic.
- Screenshot QA can store notes and status, but browser screenshot capture/attachment is not automated.
- Learning loop is internal and local; it is not yet aggregated into a durable production knowledge base.

## Post-V1 Improvements

- Add durable Production Ops persistence when the workflow stabilizes.
- Create a direct Sales Handoff to Production Ops project conversion.
- Add readiness validation before Build Packet can be marked Ready for Review.
- Attach screenshots and approved mock references to page records.
- Add explicit blocker notes per workflow stage.
- Connect post-launch approved records to ClientOps through a governed handoff.
- Route public claims, reports, and impact records through Truth Spine and approval gates when they leave internal Production Ops.

## V1 Complete?

Yes for Phase 3 runbook documentation.

No for runtime product completeness. The runbook can be used by an operator today, but Build Packet Ready remains operator-enforced and browser-local rather than backed by durable persistence and hard validation.

## Validation

| Command | Result | Notes |
| --- | --- | --- |
| `python3 -m json.tool docs/operator-runbook/SHS_OPERATOR_RUNBOOK_PHASE_3_PRODUCTION_OPS.json` | PASS | JSON report is valid. |
| `npm run build` | PASS | Build completed; existing Vite large-chunk warning remains. |
| `npm run check:governance` | PASS | Governance checks passed, including registry, Truth Spine, Oracle, AI Guardrails, Game Theory, and duplicate cleanup checks. |
