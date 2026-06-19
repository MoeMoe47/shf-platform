# SHS Operator Runbook V1 - Phase 4: Build Packet

Created: 2026-06-19

Mode: documentation and audit only. No features, routes, services, pages, refactors, runtime behavior changes, deletes, moves, staging, commits, or package changes were performed.

## Goal

Document what must exist before a project is development-ready.

This phase starts after Phase 3 Production Ops has created a build-packet-ready project/page. It ends when Codex or a developer can implement from the packet without redesigning, guessing scope, or changing protected surfaces.

## Entry Condition

Start Phase 4 when Phase 3 has produced:

- Production Ops project.
- Active page/module record.
- Brand profile.
- Page intent.
- Layout blueprint.
- Visual treatment.
- Asset governance notes.
- Data binding notes.
- Mock review status.
- Screenshot QA expectations.
- Known blockers or confirmation that no blockers remain.

## Exit Condition

Development Ready.

A packet is development-ready when it includes:

- Routes.
- Pages.
- Components.
- Data requirements.
- Assets.
- Brand rules.
- QA checklist.
- Acceptance criteria.
- Codex-ready implementation notes.
- Explicit non-goals and protected surfaces.

## Current Build Packet Surface

| Route | Page | Status | Notes |
| --- | --- | --- | --- |
| `admin.html#/ops/build-packet` | `src/pages/admin/ops/OpsBuildPacket.jsx` | Existing | Wrapper around `OpsWorkflowPage` with `pageKey="buildPacket"`. |
| `admin.html#/ops/projects` | `src/pages/admin/ops/OpsProjectSetup.jsx` | Existing | Creates/selects project and page/module records. |
| `admin.html#/ops/brand-profile` | `src/pages/admin/ops/OpsBrandProfile.jsx` | Existing | Feeds brand rules into the packet. |
| `admin.html#/ops/page-intent` | `src/pages/admin/ops/OpsPageIntent.jsx` | Existing | Feeds page purpose and user action into the packet. |
| `admin.html#/ops/layout-blueprint` | `src/pages/admin/ops/OpsLayoutBlueprint.jsx` | Existing | Feeds routes, pages, modules, components, states, and layout constraints into the packet. |
| `admin.html#/ops/visual-treatment` | `src/pages/admin/ops/OpsVisualTreatment.jsx` | Existing | Feeds visual treatment and protected style boundaries into the packet. |
| `admin.html#/ops/assets` | `src/pages/admin/ops/OpsAssetGovernance.jsx` | Existing | Feeds asset source, rights, approval, and replacement notes into the packet. |
| `admin.html#/ops/data-binding` | `src/pages/admin/ops/OpsDataBinding.jsx` | Existing | Feeds data requirements and governance implications into the packet. |
| `admin.html#/ops/mock-review` | `src/pages/admin/ops/OpsMockReview.jsx` | Existing | Feeds mock review and approval status into the packet. |
| `admin.html#/ops/screenshot-qa` | `src/pages/admin/ops/OpsScreenshotQA.jsx` | Existing | Feeds screenshot QA expectations into the packet. |
| `admin.html#/ops/learning` | `src/pages/admin/ops/OpsLearningDashboard.jsx` | Existing | Captures reusable implementation lessons. |

## Library And QA Context

`docs/SHRV1_SHF_NEXT_ROUTE_BRIDGE_AUDIT_V1.md` documents that:

- `admin.html#/ops/build-packet` maps conceptually to shf-next `/ops/library/build-packets`.
- `admin.html#/ops/screenshot-qa` maps conceptually to shf-next `/ops/qa`.
- SHRV1 currently provides admin/governance review surfaces.
- shf-next is documented as the live Development Library and QA + Delivery route owner for those live ops routes.

Phase 4 should therefore treat SHRV1 as the build packet review/gate surface and avoid pretending that SHRV1 owns a full live Development Library runtime.

## Current Generated Packet Sections

The current `createBuildPacket(...)` generator in `src/pages/admin/ops/OpsProductionDashboard.jsx` produces:

- PROJECT.
- PAGE.
- PAGE WORKFLOW STATUS.
- SPECIFICATION.
- SCREENSHOT QA.
- ACCEPTANCE CHECKLIST.
- NON-GOALS.

This is enough for V1 review if operators fill the source fields thoroughly.

## Required Packet Contents

### Routes

Required:

- Target route.
- Entry file/app surface.
- Navigation location.
- Admin/public/internal classification.
- Fallback behavior.
- Protected routes that must not change.

### Pages

Required:

- Page name.
- Page type.
- Audience.
- Primary goal.
- Page status.
- Required states.
- Empty, loading, error, success, and review states.

### Components

Required:

- Component list.
- Existing reusable components.
- New components allowed.
- Component ownership.
- Interaction behavior.
- Responsive behavior.

### Data Requirements

Required:

- Field inventory.
- Data source.
- Static/mock/computed/imported/future API classification.
- localStorage keys if used.
- Persistence expectation.
- Truth/reporting/public approval requirement.

### Assets

Required:

- Asset list.
- File paths or source links.
- Approval status.
- Usage rights.
- Replacement rules.
- Internal-only/client-approved classification.

### Brand Rules

Required:

- Brand system.
- Tone.
- Colors.
- Density.
- Typography guidance.
- Imagery rules.
- Surfaces not to borrow from.

### QA Checklist

Required:

- Route loads.
- No blank screen.
- Desktop screenshot.
- Mobile screenshot.
- Text fit.
- Sidebar/navigation visibility.
- localStorage persistence if applicable.
- No unintended public route changes.
- No protected governance bypass.
- Build passes.

### Acceptance Criteria

Required:

- Functional pass conditions.
- Visual pass conditions.
- Data pass conditions.
- Access/permission pass conditions.
- Governance pass conditions.
- Explicit non-goals.

### Codex-Ready Implementation Notes

Required:

- Allowed files.
- Files not to touch.
- Scope boundaries.
- Existing patterns to reuse.
- Test commands.
- Rollback notes.
- Known risks.

## Operator Checklist

1. Open `admin.html#/ops/build-packet` and select the active project/page.
2. Confirm project name, owner, priority, confidentiality, and page route are present.
3. Confirm routes include target path, entry surface, admin/public/internal classification, navigation, and fallback expectations.
4. Confirm pages include page name, type, audience, primary goal, required states, and page status.
5. Confirm components include existing components to reuse, new components allowed, ownership, interaction, and responsive behavior.
6. Confirm data requirements include field inventory, source, mock/static/future API classification, persistence, and governance implications.
7. Confirm assets include paths/sources, rights, approval status, replacement rules, and client-approved/internal-only classification.
8. Confirm brand rules include tone, density, colors, imagery, typography guidance, and forbidden style borrowing.
9. Confirm QA checklist includes route load, screenshots, text fit, navigation, persistence, build, governance, and no unintended public route changes.
10. Confirm acceptance criteria are measurable and include functional, visual, data, access, and governance pass conditions.
11. Confirm Codex-ready notes include allowed files, protected files, scope boundaries, test commands, rollback notes, and known risks.
12. Set Build Packet status to Ready for Review only when the packet can be implemented without guessing or redesigning.
13. Exit Phase 4 only when Development Ready is true or blockers are explicitly recorded.

## Development Ready Criteria

- Build packet is copied/downloadable from `admin.html#/ops/build-packet`.
- Target routes and protected route boundaries are explicit.
- Required pages and modules are explicit.
- Required components and reuse expectations are explicit.
- Data requirements and persistence expectations are explicit.
- Asset list and approval status are explicit.
- Brand rules and visual constraints are explicit.
- QA checklist is complete.
- Acceptance criteria are measurable.
- Allowed files and protected files are listed.
- Non-goals are explicit.
- Truth Spine/public approval/reporting gates are called out for public claims or reports.
- No blocking stage remains unresolved.

## Findings

- SHRV1 has an existing Build Packet route at `admin.html#/ops/build-packet`.
- The generated packet currently includes project, page, workflow status, specification, screenshot QA, acceptance checklist, and non-goals.
- The current generator is strong for page-level work but depends on operators filling detailed route/component/data/asset/brand notes into the existing draft fields.
- SHRV1 has admin/governance review surfaces for build packet and screenshot QA.
- shf-next is documented as the live Development Library and QA + Delivery route owner for `/ops/library/build-packets` and `/ops/qa`.
- Build Packet Ready is an operator gate today rather than a hard validation gate.

## Launch Blockers

- No hard validation prevents Build Packet Ready when route/component/data/asset/brand fields are incomplete.
- No durable backend persistence for build packets in SHRV1; V1 uses browser localStorage through Production Ops.
- No automated sync from SHRV1 build packet review to shf-next Development Library.
- Screenshot attachments and mock references are notes, not managed file attachments.
- Allowed files/protected files are not structured fields in the current generator.

## Post-V1 Improvements

- Add structured Build Packet readiness validation.
- Add dedicated fields for routes, pages, components, data requirements, assets, brand rules, QA checklist, acceptance criteria, and Codex-ready notes.
- Add durable build packet persistence.
- Add cross-link/export from SHRV1 build packet to shf-next `/ops/library/build-packets`.
- Attach approved mock screenshots and built screenshots.
- Add explicit allowed-files and protected-files sections to the generator.
- Add a Development Ready status that cannot be set while required sections are missing.

## V1 Complete?

Yes for Phase 4 runbook documentation.

No for runtime product completeness. The packet can guide development today, but Development Ready is still operator-enforced rather than validated by a hard readiness gate.

## Validation

| Command | Result | Notes |
| --- | --- | --- |
| `python3 -m json.tool docs/operator-runbook/SHS_OPERATOR_RUNBOOK_PHASE_4_BUILD_PACKET.json` | PASS | JSON report is valid. |
| `npm run build` | PASS | Build completed; existing Vite large-chunk warning remains. |
| `npm run check:governance` | PASS | Governance checks passed, including registry, Truth Spine, Oracle, AI Guardrails, Game Theory, and duplicate cleanup checks. |
