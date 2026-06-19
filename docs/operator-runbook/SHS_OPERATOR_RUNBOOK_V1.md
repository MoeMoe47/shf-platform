# SHS Operator Runbook V1

Created: 2026-06-19

Mode: documentation assembly only. No runtime features, routes, services, source code, package files, deletes, moves, staging, commits, or behavior changes were performed.

## Executive Summary

SHS Operator Runbook V1 assembles the full nine-phase SHS operating lifecycle:

Lead Intake -> Sales Handoff -> Production Ops -> Build Packet -> QA + Delivery -> Launch -> ClientOps -> Reporting -> Upgrade Opportunity.

Readiness classification:

| Area | Status | Notes |
| --- | --- | --- |
| Documentation readiness | READY | All nine phase runbooks exist and have passed JSON/build/governance validation. |
| Runtime readiness | PARTIAL | Existing routes and local/demo workflows can support a supervised run, but key steps remain operator-driven. |
| Private beta readiness | NEAR_READY | A controlled private beta is reasonable after route smoke evidence and one full client-journey rehearsal. |
| Paid client readiness | NOT_READY | Blocked by production auth/session decisions, durable persistence, acceptance/signoff hardening, report delivery policy, Website Studio gaps, and leakage checks. |

Can an operator run SHS tomorrow for a private beta client?

Yes, with supervision and explicit beta constraints. The operator can run the documented workflow manually, using existing SHS/SHF governance/admin surfaces and consumer-app ClientOps context. The system should not be sold as paid launch-ready until the paid-launch blockers are closed.

## Lifecycle Overview

1. Lead Intake: qualify first interest into a sales-ready opportunity.
2. Sales Handoff: convert the qualified lead into a production-ready handoff.
3. Production Ops: turn the handoff into project/page/module planning.
4. Build Packet: create development-ready implementation instructions.
5. QA + Delivery: verify the completed build and mark Delivery Ready.
6. Launch: record final approval, signoff, launch/version context, and activate ClientOps.
7. ClientOps: manage the launched client through support, health, maintenance, versions, reviews, and upgrades.
8. Reporting: produce approved client-facing reports and deliver the final PDF.
9. Upgrade Opportunity: identify, track, and convert post-launch expansion opportunities.

## Phase 1 — Lead Intake

Purpose: Take a new SHS lead from first interest to qualified opportunity.

Entry condition: A person or organization has expressed interest in SHS, requested a demo, been referred by a partner, appeared as a growth/opportunity signal, or otherwise created enough context for operator review.

Required operator actions:

- Capture lead source, contact, organization/client details, industry, problem, budget range, and timeline.
- Recommend a package.
- Run the qualification checklist.
- Assign owner, next action, and stage.

Required data fields:

- Lead source, contact name, email/phone, organization, industry, problem, budget range, timeline, package recommendation, qualification status, owner, next action.

Required routes/pages:

- `admin.html#/hub/opportunities`
- `admin.html#/hub/sales-pipeline`

Exit condition: Ready for Sales Handoff.

Definition of Done:

- Minimum contact, organization, problem, budget/timeline, package recommendation, qualification decision, owner, next action, and stage are recorded.

Known runtime gaps:

- No dedicated first-interest lead intake route.
- Production lead source is not wired.
- Qualification remains operator-driven.

Private beta readiness: NEAR_READY.

Paid launch readiness: NOT_READY.

## Phase 2 — Sales Handoff

Purpose: Convert a qualified lead into a production-ready SHS project handoff.

Entry condition: Phase 1 lead is Ready for Sales Handoff with qualification notes, owner, next action, and package recommendation.

Required operator actions:

- Select package.
- Confirm client goals, deliverables, brand details, timeline, required pages/modules, and proposal approval status.
- Assemble handoff packet.
- Create or update the Production Ops project context.

Required data fields:

- Package selected, client goals, deliverables, brand details, timeline, required pages/modules, proposal approval status, handoff packet requirements.

Required routes/pages:

- `admin.html#/hub/sales-pipeline`
- `admin.html#/hub/opportunities`
- `admin.html#/ops/production`
- `admin.html#/ops/projects`

Exit condition: Production project created.

Definition of Done:

- Qualified opportunity has selected package, goals, deliverables, brand details, timeline, required pages/modules, proposal approval status, handoff packet, and Production Ops project/page context.

Known runtime gaps:

- No automated conversion from qualified sales opportunity to Production Ops project.
- Proposal approval status is not hard-enforced.
- Sales handoff remains manual/local workflow.

Private beta readiness: NEAR_READY.

Paid launch readiness: NOT_READY.

## Phase 3 — Production Ops

Purpose: Turn a sales handoff into build-ready project planning.

Entry condition: Phase 2 has produced an approved or review-ready handoff packet with selected package, goals, deliverables, brand details, timeline, required pages/modules, and proposal status.

Required operator actions:

- Set up project.
- Complete brand profile, page intent, layout blueprint, visual treatment, asset governance, data binding, mock review, screenshot QA expectations, and learning-loop notes.
- Resolve blockers or assign owner/next action.

Required data fields:

- Project setup, brand profile, page intent, layout blueprint, visual treatment, asset governance, data binding, mock review, screenshot QA, learning loop, blockers.

Required routes/pages:

- `admin.html#/ops/production`
- `admin.html#/ops/projects`
- `admin.html#/ops/brand-profile`
- `admin.html#/ops/page-intent`
- `admin.html#/ops/layout-blueprint`
- `admin.html#/ops/visual-treatment`
- `admin.html#/ops/assets`
- `admin.html#/ops/data-binding`
- `admin.html#/ops/mock-review`
- `admin.html#/ops/screenshot-qa`
- `admin.html#/ops/learning`

Exit condition: Build Packet Ready.

Definition of Done:

- Production project/page/module records are ready enough to create a build packet without redesigning or guessing scope.

Known runtime gaps:

- No durable Production Ops backend persistence.
- Project readiness remains operator-reviewed.
- Live consumer-app sync is documented but not automated.

Private beta readiness: NEAR_READY.

Paid launch readiness: NOT_READY.

## Phase 4 — Build Packet

Purpose: Document what must exist before a project is development-ready.

Entry condition: Phase 3 produced a build-packet-ready project/page/module with production planning completed.

Required operator actions:

- Confirm routes, pages, components, data requirements, assets, brand rules, QA checklist, acceptance criteria, non-goals, and Codex-ready implementation notes.
- Package the build request clearly enough for a developer or Codex run.

Required data fields:

- Routes, pages, components, data requirements, assets, brand rules, QA checklist, acceptance criteria, implementation notes, non-goals.

Required routes/pages:

- `admin.html#/ops/build-packet`
- `admin.html#/ops/production`
- `admin.html#/ops/projects`
- `admin.html#/ops/screenshot-qa`

Exit condition: Development Ready.

Definition of Done:

- Build packet contains enough route, page, component, data, asset, brand, QA, acceptance, and implementation guidance to build without redesigning or expanding scope.

Known runtime gaps:

- Build packet output is not a signed/exportable delivery artifact.
- Approval remains operator-driven.
- Durable build-packet storage is not production-grade.

Private beta readiness: NEAR_READY.

Paid launch readiness: NOT_READY.

## Phase 5 — QA + Delivery

Purpose: Verify a completed project before delivery.

Entry condition: Phase 4 is Development Ready, implementation is complete, and the build is available for QA review.

Required operator actions:

- Review desktop layout, mobile layout, navigation, forms, reports, permissions, public/private leakage, screenshot QA, functional QA, and delivery readiness.
- Record QA status, approved exceptions, blockers, owner, and next action.

Required data fields:

- Desktop status, mobile status, navigation status, form status, report readiness, permission result, leakage result, screenshot QA, functional QA, delivery owner/signoff.

Required routes/pages:

- `admin.html#/ops/screenshot-qa`
- `admin.html#/ops/mock-review`
- `admin.html#/ops/build-packet`
- `admin.html#/ops/production`
- `admin.html#/reports`
- `admin.html#/truth-spine`

Exit condition: Delivery Ready.

Definition of Done:

- Desktop, mobile, navigation, forms/interactions, reports, permissions, leakage, screenshot QA, functional QA, build, governance, and owner signoff pass or have approved exceptions.

Known runtime gaps:

- No hard Delivery Ready validation gate.
- Screenshot capture/attachment is not automated.
- Functional QA remains checklist-driven.

Private beta readiness: NEAR_READY.

Paid launch readiness: NOT_READY.

## Phase 6 — Launch

Purpose: Turn a delivered project into a launched SHS client system.

Entry condition: Phase 5 is Delivery Ready, final deliverables are approved or approval-ready, report/public claim readiness gates are satisfied where needed, and launch-ready project context exists.

Required operator actions:

- Record final approval, launch date, client signoff, support tier, handoff notes, version record, ClientOps record, owner, and open maintenance/watch items.
- Confirm report/public claims remain truth/readiness-safe.

Required data fields:

- Project ID, client ID, client name, business name, package selected, final approval status/owner, launch date, client signoff status/owner, support tier, handoff notes, version record, ClientOps record ID, active modules, routes, reports, maintenance/watch items.

Required routes/pages:

- `admin.html#/ops/production`
- `admin.html#/ops/projects`
- `admin.html#/ops/build-packet`
- `admin.html#/ops/screenshot-qa`
- `admin.html#/reports`
- `admin.html#/truth-spine`
- SHF-Next `/ops/clientops`

Exit condition: ClientOps Active.

Definition of Done:

- Final approval, launch date, client signoff, support tier, handoff notes, version launch record, ClientOps record, owner assignment, and maintenance/watch transfer are complete.

Known runtime gaps:

- No dedicated SHRV1 Launch route or hard launch gate.
- No automated Production Ops to ClientOps record creation.
- No durable launch/version backend.

Private beta readiness: NEAR_READY.

Paid launch readiness: NOT_READY.

## Phase 7 — ClientOps

Purpose: Manage a launched client after delivery.

Entry condition: Phase 6 is ClientOps Active with launch/signoff/support/version/handoff context and assigned owner.

Required operator actions:

- Keep client record, maintenance board, support tickets, system health, version history, upgrade opportunities, monthly review cadence, and handoff file current.
- Keep ClientOps private and route report/public candidates through governance.

Required data fields:

- ClientOps record ID, client ID, client name, business name, project ID, support tier, ClientOps owner, handoff file, maintenance board, support tickets, system health, version history, upgrade opportunities, monthly review, report/public impact candidate status if applicable.

Required routes/pages:

- SHF-Next `/ops/clientops`
- `admin.html#/ops/production`
- `admin.html#/reports`
- `admin.html#/truth-spine`

Exit condition: Client actively managed.

Definition of Done:

- Client record, maintenance, support, health, version, upgrade, monthly review, handoff file, owner, and governance boundaries are active.

Known runtime gaps:

- Production auth remains outside V1.
- Durable ClientOps backend persistence is not implemented in SHRV1.
- Real ClientOps-to-governance intake remains post-V1.

Private beta readiness: NEAR_READY.

Paid launch readiness: NOT_READY.

## Phase 8 — Reporting

Purpose: Produce client-facing reports.

Entry condition: Phase 7 client is actively managed and report purpose, audience, delivery channel, and source facts are known.

Required operator actions:

- Select report type.
- Gather ClientOps, Reports, and Truth Spine context.
- Draft client-facing report.
- Run report approval checks.
- Save approved final report as PDF.
- Deliver PDF through approved channel.
- Record delivery in ClientOps.

Required data fields:

- Report ID, type, ClientOps record ID, client ID/name, report period, audience, source sections, truth status if required, approval status, approved by, PDF saved, delivery channel, delivered at, owner, report version.

Required routes/pages:

- `admin.html#/reports`
- `admin.html#/truth-spine`
- `services/shf-agent-fabric/routers/reports_routes.py`
- SHF-Next `/ops/clientops`

Exit condition: Report delivered.

Definition of Done:

- Report type, source context, audience, truth/readiness requirements, approval, PDF, delivery channel, delivery metadata, ClientOps update, and delivered status are complete.

Known runtime gaps:

- No hard SHRV1 client-report approval gate.
- PDF delivery is a runbook rule, not runtime-enforced.
- Durable report delivery records remain post-V1.

Private beta readiness: NEAR_READY.

Paid launch readiness: NOT_READY.

## Phase 9 — Upgrade Opportunity

Purpose: Identify, track, and convert upgrade opportunities.

Entry condition: Phase 7 client is actively managed and a trigger event, ClientOps signal, health/report signal, support trend, client request, or operator observation suggests additional value.

Required operator actions:

- Record trigger event, ClientOps signal, health/report signal, recommended upgrade, client value, revenue opportunity, owner, proposal next step, follow-up status, and close reason if closed.
- Convert strong opportunities to Hub Opportunities or Hub Sales Pipeline when appropriate.

Required data fields:

- Upgrade opportunity ID, ClientOps record ID, client ID/name, trigger event, ClientOps signal, health/report signal, recommended upgrade, problem/value, revenue opportunity, proposal next step, follow-up status, owner, next action date, close reason if closed.

Required routes/pages:

- SHF-Next `/ops/clientops`
- `admin.html#/hub/opportunities`
- `admin.html#/hub/sales-pipeline`
- `admin.html#/reports`
- `admin.html#/truth-spine`

Exit condition: Upgrade tracked or closed.

Definition of Done:

- Trigger, signals, upgrade, revenue, proposal next step, follow-up, owner, next action/close reason, and tracked/closed state are recorded.

Known runtime gaps:

- No dedicated SHRV1 upgrade opportunity conversion route.
- No automated ClientOps upgrade-to-Hub Opportunity conversion.
- Revenue/proposal fields remain checklist-driven.

Private beta readiness: NEAR_READY.

Paid launch readiness: NOT_READY.

## Master Operator Checklist

1. Confirm private-beta constraints are disclosed: local/demo persistence, route-boundary notices, and no production auth guarantee.
2. Create or identify the lead.
3. Qualify the lead and set owner/next action.
4. Select package and confirm proposal approval status.
5. Create the production handoff.
6. Build Production Ops project/page/module context.
7. Complete brand, page, layout, visual, asset, data, mock, and QA planning.
8. Generate or assemble the build packet.
9. Build or hand off to implementation.
10. Run desktop, mobile, navigation, form, permissions, report, and leakage QA.
11. Record Delivery Ready status or blockers.
12. Record final approval, launch date, client signoff, support tier, handoff notes, and launch version.
13. Create/confirm ClientOps record.
14. Manage maintenance, support tickets, health, version history, monthly review, and upgrades.
15. Produce approved client reports and save final deliverables as PDF.
16. Track upgrade opportunities or close them with a reason.
17. Run `npm run build` and `npm run check:governance` before owner go/no-go.

## Client Journey Checklist

| Step | Working now | Manual operator required | Missing runtime support | Route or doc reference |
| --- | --- | --- | --- | --- |
| Lead | Yes | Yes | Dedicated first-interest intake route | Phase 1; `admin.html#/hub/opportunities` |
| Discovery | Yes | Yes | Production discovery record/persistence | Phase 1; Phase 2 |
| Proposal | Partial | Yes | Contract/payment/proposal approval hard gate | Phase 2; `admin.html#/hub/sales-pipeline` |
| Handoff | Yes | Yes | Automated opportunity-to-production conversion | Phase 2 |
| Production Project | Yes | Yes | Durable project authority | Phase 3; `admin.html#/ops/projects` |
| Build Packet | Partial | Yes | Exportable/approvable artifact | Phase 4; `admin.html#/ops/build-packet` |
| QA | Yes | Yes | Acceptance evidence and automated screenshot capture | Phase 5; `admin.html#/ops/screenshot-qa` |
| Launch | Partial | Yes | Hard launch/signoff gate | Phase 6 |
| ClientOps Record | Yes | Yes | Durable ClientOps persistence | Phase 7; SHF-Next `/ops/clientops` |
| Monthly Review | Yes | Yes | Delivery/approval ledger | Phase 7; Phase 8 |
| Upgrade Opportunity | Yes | Yes | Automated sales/proposal conversion | Phase 9 |

## Private Beta Operating Procedure

Before client call:

- Confirm beta constraints, route list, operator owner, and client journey rehearsal account.
- Prepare lead intake, package recommendation, and discovery questions.
- Confirm no public/funder-facing claims will be made without Truth Spine/readiness approval.

During discovery:

- Capture contact, organization, industry, problem, budget, timeline, package fit, and qualification status.
- Record owner and next action.
- If qualified, move to Sales Handoff.

After client approval:

- Confirm package, deliverables, brand details, required pages/modules, proposal approval status, and handoff packet.
- Create Production Ops context.

During production:

- Complete project setup, brand profile, page intent, layout blueprint, visual treatment, asset governance, data binding, mock review, screenshot QA, and build packet.
- Keep internal prompts, QA notes, and private client data out of public routes.

Before delivery:

- Run QA + Delivery checklist.
- Confirm desktop/mobile/nav/forms/reports/permissions/leakage/screenshot/functional QA.
- Record Delivery Ready or blockers.

After launch:

- Record final approval, launch date, client signoff, support tier, version record, handoff notes, and ClientOps record.
- Transfer maintenance/watch items and assign owner.

First monthly review:

- Review client health, support tickets, maintenance, version history, upgrade opportunities, and report needs.
- Produce approved PDF report if needed.
- Track upgrade opportunity or close with reason.

## Launch Blockers

### Private Beta Blockers

- Run and document one complete SHS client journey rehearsal from lead to upgrade opportunity.
- Record browser smoke evidence for critical SHS/shf-next public and internal routes.
- Explicitly document beta constraints around local/demo persistence and access boundaries.
- Decide which Website Studio marketplace CTAs remain beta-only or need safe next-step labels.

### Paid Launch Blockers

- Production auth/session enforcement for paid-client launch.
- Durable persistence or approved paid-beta storage policy.
- Website Studio cannot yet complete Select Template -> Configure Brand -> Generate Site Packet -> Deliver Site.
- Build Packet output is not yet signed/exportable/approvable.
- QA Delivery Ready -> Launch -> ClientOps acceptance/signoff is not hard-enforced.
- ClientOps monthly report approval and delivery ledger are not finalized.
- Public/private copy and data leakage scan is still required.

### Post-V1 Improvements

- Move local workflows toward durable services where needed.
- Add observability, deploy monitoring, and automated route smoke checks.
- Add structured launch gate, report approval model, and PDF/version enforcement.
- Add one-click ClientOps upgrade-to-sales opportunity conversion.
- Add visible internal-only governance banners in consumer-app ClientOps/Production Ops after owner approval.

## Paid Launch Gaps

Paid launch remains NOT_READY because:

- Production auth/session model is not defined.
- Lifecycle persistence is local/demo-grade.
- Report delivery policy and delivery ledger are not hard-enforced.
- Website Studio generation path is incomplete.
- Build packet approval/export is incomplete.
- Client acceptance/signoff is operator-driven.
- Public/private leakage scan is still required.

## Final Recommendation

Is SHS operator-runbook ready?

Yes. Operator documentation is READY.

Is SHS private beta operator-ready?

Nearly. SHS is NEAR_READY for a controlled private beta with operator supervision, explicit beta constraints, route smoke evidence, and one full rehearsal.

Is SHS paid client launch-ready?

No. SHS is NOT_READY for paid client launch.

Next task:

Run and document one complete SHS private-beta client journey rehearsal from Lead Intake through Upgrade Opportunity, including route smoke evidence and a blocker log.

## Validation

| Command | Result | Notes |
| --- | --- | --- |
| `python3 -m json.tool docs/operator-runbook/SHS_OPERATOR_RUNBOOK_V1.json` | PASS | JSON report is valid. |
| `npm run build` | PASS | Build passed with the existing Vite large-chunk warning. |
| `npm run check:governance` | PASS | Master registry, proposal, Truth Spine, Oracle, AI Guardrails, Game Theory, data/governance layers, and duplicate cleanup checks passed. |
