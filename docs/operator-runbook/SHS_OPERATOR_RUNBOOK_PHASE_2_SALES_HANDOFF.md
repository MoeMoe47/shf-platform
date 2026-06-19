# SHS Operator Runbook V1 - Phase 2: Sales Handoff

Created: 2026-06-19

Mode: documentation and audit only. No features, routes, services, pages, refactors, runtime behavior changes, deletes, moves, staging, commits, or package changes were performed.

## Goal

Document how a qualified SHS lead becomes a production-ready SHS project handoff.

This phase starts after Phase 1 lead intake qualifies the opportunity. It ends when a Production Ops project is created and the handoff packet is ready for build packet work.

## Entry Condition

Start Phase 2 when a lead has reached **Ready for Sales Handoff** with:

- Qualification notes.
- Owner and next action.
- Initial package recommendation.
- Budget/timeline notes.
- Sales or operator decision that the opportunity should move toward proposal, approval, or production setup.

## Exit Condition

Production project created.

A handoff is complete when the operator has recorded:

- Package selected.
- Client goals.
- Deliverables.
- Brand details.
- Timeline.
- Required pages/modules.
- Proposal approval status.
- Handoff packet requirements.
- Production Ops project record.
- Page/module records when page work is required.

## Current Routes / Pages

### Sales Review Sources

| Route | Page | Status | Notes |
| --- | --- | --- | --- |
| `admin.html#/hub/sales-pipeline` | `src/pages/hub/HubSalesPipelinePage.jsx` | Usable sales handoff source | Tracks sales stages, estimated value, priority, due date, related opportunity, related partners, next action, notes, and local sales review events. |
| `admin.html#/hub/opportunities` | `src/pages/hub/HubOpportunitiesPage.jsx` | Usable opportunity context source | Tracks opportunity title, type, stage, estimated value, urgency, deadline, needed lanes, geography, source, buyer, next action, score, and recommended partners. |
| `admin.html#/hub/bundles` | `src/pages/hub/HubBundleBuilderPage.jsx` | Usable package context route | Linked from Sales Pipeline as Bundle Builder; useful for package and partner-bundle context. |

### Production Handoff Routes

| Route | Page | Status | Notes |
| --- | --- | --- | --- |
| `admin.html#/ops/projects` | `src/pages/admin/ops/OpsProjectSetup.jsx` | Usable project creation surface | Creates or updates Production Ops project records and page records through shared OpsProductionDashboard state. |
| `admin.html#/ops/production` | `src/pages/admin/ops/OpsProductionDashboard.jsx` | Usable production dashboard | Shows active project, active page, project pages, workflow status, metrics, and next recommended step. |
| `admin.html#/ops/build-packet` | `src/pages/admin/ops/OpsBuildPacket.jsx` | Usable build packet surface | Generates copy/download build packet text from the active project, page, workflow status, draft packet sections, and QA notes. |
| `admin.html#/ops/brand-profile` | `src/pages/admin/ops/OpsBrandProfile.jsx` | Usable brand details surface | Captures brand profile notes for the active page build packet. |
| `admin.html#/ops/page-intent` | `src/pages/admin/ops/OpsPageIntent.jsx` | Usable page intent surface | Captures page purpose, user action, proof points, conversion points, and decision support notes. |
| `admin.html#/ops/layout-blueprint` | `src/pages/admin/ops/OpsLayoutBlueprint.jsx` | Usable required pages/modules surface | Captures screen list, section order, major components, states, and responsive priorities. |
| `admin.html#/ops/mock-review` | `src/pages/admin/ops/OpsMockReview.jsx` | Usable approval surface | Captures mock review notes and status before build packet creation. |

### Missing or Incomplete Routes

| Route | Page | Status | Notes |
| --- | --- | --- | --- |
| `/sales.html#/pipeline` | `src/pages/sales/Pipeline.jsx` | Stub | Renders only `Pipeline - stub`; not sufficient as the V1 handoff source. |
| `admin.html#/sales-handoff` | Not found | Missing | No dedicated SHS Sales Handoff admin route/page was found. |

### Navigation Finding

`src/components/admin/AdminSidebar.jsx` exposes Production Ops routes directly. It does not currently expose a direct Sales Pipeline, Opportunities, or Sales Handoff link.

## LocalStorage Handoff Flows

| Key / Key Set | Source | Purpose |
| --- | --- | --- |
| `shs_hub_sales_pipeline_events_v1` | `src/pages/hub/HubSalesPipelinePage.jsx` | Stores sales pipeline review events such as sales review started, proposal created, and proposal packet created. |
| `shs_hub_opportunity_events_v1` | `src/pages/hub/HubOpportunitiesPage.jsx` | Stores opportunity review events. |
| `shs.ops.*` keys | `src/pages/admin/ops/opsStorage.js` | Stores Production Ops project, page, workflow, build packet, QA, and learning state. |

The current V1 handoff is manual: the operator reads sales/opportunity context, then creates or updates Production Ops project/page records.

## Required Handoff Fields

| Field | Required | Notes |
| --- | --- | --- |
| Package selected | Yes | Final selected SHS package or package bundle approved for proposal/handoff. |
| Client goals | Yes | Plain-language goals the project must achieve for the client or internal buyer. |
| Deliverables | Yes | Pages, dashboards, forms, reports, portals, automations, or handoff artifacts. |
| Brand details | Yes | Brand system, audience, tone, references, logo/assets, prohibited references, and approval owner. |
| Timeline | Yes | Target start, review dates, approval date, build window, QA window, and delivery date. |
| Required pages/modules | Yes | Pages, routes, modules, components, workflows, and data assumptions. |
| Proposal approval status | Yes | Draft, internal review, sent to client, client approved, approved with changes, blocked, or declined. |
| Handoff packet requirements | Yes | Scope, non-goals, assets, route list, data assumptions, allowed files, protected files, QA expectations, owner, and next action. |
| Production project ID | Yes | Production Ops project record created in `admin.html#/ops/projects`. |

## Operator Checklist

1. Open the qualified opportunity from Phase 1.
2. Confirm selected package or package bundle.
3. Confirm client goals in measurable, plain-language terms.
4. List deliverables and mark each as in scope, out of scope, or deferred.
5. Capture brand details: audience, tone, logo/assets, references, constraints, and approval owner.
6. Confirm timeline: start, review, approval, build, QA, and delivery dates.
7. List required pages/modules with route, audience, goal, and data assumptions.
8. Confirm proposal approval status and whether approval includes changes.
9. Create or update the Production Ops project in `admin.html#/ops/projects`.
10. Create page records for each required page/module.
11. Fill Brand Profile, Page Intent, Layout Blueprint, Visual Treatment, Assets, Data Binding, and Mock Review notes.
12. Generate or review the Build Packet in `admin.html#/ops/build-packet`.
13. Exit only when the Production Ops project exists and the handoff packet is ready for build packet work.

## Handoff Packet Requirements

- Qualified lead or opportunity source.
- Selected package and any included sub-packages.
- Client goals and success criteria.
- Deliverables list with in-scope, out-of-scope, and deferred items.
- Brand details and approved/prohibited references.
- Timeline and approval milestones.
- Required pages/modules with route, audience, primary goal, and status.
- Proposal approval status and approving owner.
- Data assumptions: static, mock, computed, imported, future API, or verified source.
- Truth/reporting requirement if client-facing claims or reports will be published.
- Allowed files or surfaces to change.
- Protected files or surfaces that must not change.
- QA expectations: route load, desktop/mobile screenshots, text fit, screenshot match, localStorage persistence, and no unintended public route changes.
- Production owner, sales owner, build owner, and next action.

## Definition of Done

Phase 2 is complete when:

- Package selected is documented.
- Client goals are documented.
- Deliverables are documented.
- Brand details are documented.
- Timeline is documented.
- Required pages/modules are documented.
- Proposal approval status is documented.
- Handoff packet requirements are satisfied or blockers are recorded.
- Production Ops project is created or updated.
- At least one page/module record exists when the project requires page work.
- Build Packet is ready for review or marked blocked with reason.

## Findings

- Hub Sales Pipeline is the strongest current source for sales handoff context.
- Hub Opportunities provides useful opportunity and package context before handoff.
- Admin Production Ops has usable project setup, page records, workflow stages, build packet generation, screenshot QA, and learning surfaces.
- Production Ops state is persisted in browser localStorage through `opsStorage.js`.
- The handoff between Sales Pipeline and Production Ops is manual today.
- The Sales app Pipeline page exists but is a stub.
- No dedicated Sales Handoff route or single handoff record schema was found.

## Launch Blockers

- No automated conversion from qualified sales opportunity to Production Ops project.
- No dedicated Sales Handoff page.
- Sales Pipeline and Opportunities use separate localStorage event logs from Production Ops project/page state.
- Proposal approval status is not represented as a single canonical handoff field across sales and production.
- AdminSidebar exposes Production Ops but not direct Sales Pipeline or Sales Handoff navigation.

## Post-V1 Improvements

- Create a dedicated Sales Handoff route once the current manual process is stable.
- Add a one-click Create Production Project action from Sales Pipeline won/approved items.
- Create a canonical handoff packet schema shared by Hub Sales and Production Ops.
- Add proposal approval status to the production project record.
- Add direct navigation from AdminSidebar to Sales Pipeline or future Sales Handoff.
- Add validation that blocks build packet approval until package, goals, deliverables, brand, timeline, pages/modules, approval status, and QA expectations are filled.
- Connect Truth Spine requirements when the handoff includes public claims, reports, or funder-facing proof.

## V1 Complete?

Yes for Phase 2 runbook documentation.

No for runtime product completeness. The runbook can be used by an operator today, but the product still lacks a dedicated Sales Handoff page and an automated opportunity-to-production-project conversion.

## Validation

| Command | Result | Notes |
| --- | --- | --- |
| `python3 -m json.tool docs/operator-runbook/SHS_OPERATOR_RUNBOOK_PHASE_2_SALES_HANDOFF.json` | PASS | JSON report is valid. |
| `npm run build` | PASS | Build completed; existing Vite large-chunk warning remains. |
| `npm run check:governance` | PASS | Governance checks passed, including registry, Truth Spine, Oracle, AI Guardrails, Game Theory, and duplicate cleanup checks. |
