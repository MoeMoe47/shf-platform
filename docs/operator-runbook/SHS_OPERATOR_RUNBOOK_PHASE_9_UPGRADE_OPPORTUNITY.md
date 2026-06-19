# SHS Operator Runbook V1 - Phase 9: Upgrade Opportunity

Created: 2026-06-19

Mode: documentation and audit only. No features, routes, services, pages, refactors, runtime behavior changes, deletes, moves, staging, commits, or package changes were performed.

## Goal

Document how SHS identifies, tracks, and converts upgrade opportunities.

This phase starts when ClientOps, reporting, support, system health, monthly review, or operator observation reveals a possible upgrade. It ends when the upgrade is tracked for proposal/sales follow-up or closed with a reason.

## Entry Condition

Start Phase 9 when:

- Phase 7 ClientOps status is actively managed.
- A trigger event, ClientOps signal, health/report signal, support trend, client request, or operator observation suggests additional value.
- The upgrade can be described as a client benefit, risk reduction, expansion, support improvement, reporting improvement, automation improvement, or package/module addition.
- The signal is not already an active support ticket, maintenance task, or approved proposal.

## Exit Condition

Upgrade tracked or closed.

An upgrade opportunity is complete for V1 when:

- Trigger event is recorded.
- ClientOps signal is recorded.
- Health/report signal is recorded if applicable.
- Recommended upgrade is documented.
- Revenue opportunity is estimated or marked unknown.
- Proposal next step is assigned or explicitly not needed.
- Follow-up status is set.
- Opportunity is either tracked for next action or closed with a reason.

## Current Upgrade Opportunity Context

| Surface | Route or File | Status | Purpose |
| --- | --- | --- | --- |
| SHF-Next ClientOps Center | `/ops/clientops` | Existing in consumer app | Tracks active records, maintenance, support tickets, system health, version history, upgrade opportunities, monthly review, and exports. |
| ClientOps report helpers | `/Users/mikeslate/shf-next/src/data/clientOpsReportData.ts` | Existing in consumer app | Supports monthly review and upgrade opportunity exports. |
| SHRV1 Hub Opportunities | `admin.html#/hub/opportunities` | Existing | Tracks opportunity title, type, stage, estimated value, urgency, deadline, buyer, next action, score, and recommended partners. |
| SHRV1 Hub Sales Pipeline | `admin.html#/hub/sales-pipeline` | Existing | Tracks sales stages, estimated value, priority, due date, related opportunity, next action, notes, and sales review events. |
| SHRV1 Reports admin | `admin.html#/reports` | Existing | Trust-aware report and readiness context when an upgrade is based on report signal. |
| SHRV1 Truth Spine | `admin.html#/truth-spine` | Existing | Truth/readiness/public approval authority when upgrade claims become report, proposal, or public-facing claims. |

Upgrade opportunities begin as private SHS operational signals. They become sales/proposal work only after operator review and owner-approved next action.

## Required Data Fields

| Field | Required | Notes |
| --- | --- | --- |
| `upgrade_opportunity_id` | Yes | Stable identifier for the opportunity. |
| `clientops_record_id` | Yes | Active ClientOps record. |
| `client_id` | Yes | Stable client identifier. |
| `client_name` | Yes | Client-facing name. |
| `trigger_event` | Yes | Event that created the signal. |
| `clientops_signal` | Yes | ClientOps source: ticket, maintenance, health, version, review, request, or observation. |
| `health_report_signal` | Conditional | Required when health or reporting data supports the upgrade. |
| `recommended_upgrade` | Yes | Upgrade name and scope. |
| `problem_or_value` | Yes | What the upgrade fixes, improves, or unlocks. |
| `revenue_opportunity` | Yes | Estimate, package/tier, range, or unknown. |
| `proposal_next_step` | Yes | Discovery, proposal draft, sales review, client review, defer, or close. |
| `follow_up_status` | Yes | New, needs discovery, proposal recommended, proposal sent, accepted, deferred, closed. |
| `owner` | Yes | Operator or sales owner. |
| `next_action_date` | Conditional | Required unless closed. |
| `close_reason` | Conditional | Required when closed. |

## Trigger Event

Common trigger events:

- Client asks for a new page, module, report, automation, integration, or workflow.
- Support tickets repeat around the same issue.
- Maintenance board reveals recurring manual work.
- System health review identifies fragility, missing monitoring, or performance risk.
- Monthly review shows expansion need or client growth.
- Report delivery identifies a better client-facing package.
- Version history shows repeated patching that should become a formal upgrade.
- Operator identifies a value gap during ClientOps review.

The trigger event should be specific enough that a future operator can understand why the opportunity exists.

## ClientOps Signal

ClientOps signal should identify the source record or workflow that created the opportunity.

Examples:

- Support ticket pattern.
- Maintenance board item.
- System health warning.
- Monthly review recommendation.
- Version history change.
- Client request.
- Handoff file note.
- ClientOps owner observation.

ClientOps signals remain internal/private until included in an approved proposal or client-facing report.

## Health / Report Signal

Health/report signal should be recorded when the opportunity is supported by system status or reporting evidence.

Examples:

- Health score degraded.
- Broken route or recurring defect.
- Monthly review trend.
- Client health report recommendation.
- Support summary pattern.
- Upgrade report recommendation.
- Truth/readiness gap affecting a client-facing report.

If the signal includes external or public-facing claims, use Truth Spine and Reports readiness before communicating those claims outside the internal team.

## Recommended Upgrade

The recommended upgrade should include:

- Upgrade title.
- Upgrade category.
- Package/module affected.
- Current limitation.
- Proposed improvement.
- Client benefit.
- Internal complexity.
- Dependencies.
- Risks.
- Required owner decision.

Recommended upgrades are not commitments. They remain opportunities until sales/proposal review approves the next step.

## Revenue Opportunity

Revenue opportunity should be estimated conservatively.

Record:

- Revenue type: one-time, monthly, annual, retainer, support tier, package upgrade, or unknown.
- Estimated value or range.
- Confidence: low, medium, high, or unknown.
- Source of estimate.
- Related package/tier.
- Renewal or expansion timing.
- Reason the client may buy.

If revenue is unknown, record `unknown` rather than inventing a number.

## Proposal Next Step

Proposal next step should be one of:

- Needs discovery.
- Draft proposal.
- Sales review.
- Client review.
- Convert to Hub Opportunity.
- Convert to Sales Pipeline item.
- Defer.
- Close.

When the upgrade is strong enough for sales follow-up, create or update the relevant opportunity context in Hub Opportunities or Hub Sales Pipeline.

## Follow-Up Status

Use these statuses:

- `new`
- `needs_discovery`
- `proposal_recommended`
- `proposal_drafted`
- `proposal_sent`
- `accepted`
- `deferred`
- `closed_won`
- `closed_lost`
- `closed_no_action`

Follow-up status should always include owner and next action unless the opportunity is closed.

## Operator Checklist

1. Confirm the client is actively managed in ClientOps.
2. Record the trigger event.
3. Identify the ClientOps signal source.
4. Identify health/report signal if applicable.
5. Confirm the signal is not already covered by an active support ticket, maintenance item, or approved proposal.
6. Describe the recommended upgrade.
7. Document the client value and current limitation.
8. Estimate revenue opportunity or mark unknown.
9. Assign owner and proposal next step.
10. Set follow-up status and next action date.
11. If client-facing claims are included, check Reports and Truth Spine readiness.
12. If moving to sales, create or update Hub Opportunities or Hub Sales Pipeline context.
13. If not moving forward, close with reason.
14. Exit only when the opportunity is tracked for next action or closed.

## Governance Boundary

Upgrade opportunities are private SHS operational records by default.

They must not:

- Become public SHF impact claims.
- Mutate SHF Impact Data Spine.
- Be represented as approved proposals before owner approval.
- Use unverified public claims as sales facts.
- Publish ClientOps private data publicly.
- Bypass Truth Spine or Reports readiness when used in client-facing reports.

Upgrade opportunities may become proposal or report candidate material only through the appropriate sales, reporting, privacy, ownership, and governance gates.

## Definition of Done

Phase 9 is done when:

- Trigger event is recorded.
- ClientOps signal is recorded.
- Health/report signal is recorded or marked not applicable.
- Recommended upgrade is documented.
- Revenue opportunity is estimated or marked unknown.
- Proposal next step is assigned.
- Follow-up status is set.
- Owner and next action are assigned unless closed.
- Opportunity is tracked in ClientOps, Hub Opportunities, or Hub Sales Pipeline when moving forward.
- Closed opportunities include close reason.
- Final status is Upgrade tracked or closed.

## Findings

- ClientOps audit identifies upgrade opportunities as a ClientOps functional area.
- Phase 8 reporting already treats upgrade reports as recommendations, not commitments, until approved through sales, proposal, governance, and delivery flow.
- Hub Opportunities and Hub Sales Pipeline provide existing SHRV1 context for opportunity and proposal follow-up.
- ClientOps upgrade signals are internal/private and should not become public SHF data or public claims without governance.
- Upgrade conversion is currently operator-driven and not hard runtime-enforced in SHRV1.

## Launch Blockers

- No dedicated SHRV1 upgrade opportunity conversion route was identified.
- No automated ClientOps upgrade-to-Hub Opportunity conversion exists in SHRV1.
- Revenue estimate and proposal next step are checklist-driven rather than hard-validated.
- ClientOps upgrade records currently rely on the consumer app context and manual operator workflow.
- Production auth and durable opportunity persistence remain post-V1.

## Post-V1 Improvements

- Add a structured upgrade opportunity model when owner approves runtime work.
- Add one-click conversion from ClientOps upgrade opportunity to Hub Opportunity or Sales Pipeline item.
- Add proposal readiness fields and owner approval state.
- Add revenue range and confidence validation.
- Add upgrade close reason analytics.
- Add governed report/proposal package generation for accepted upgrade opportunities.

## V1 Complete?

Yes for Phase 9 runbook documentation.

No for runtime product completeness. Upgrade opportunities can be tracked manually today, but upgrade conversion, proposal handoff, and durable revenue tracking are not hard-enforced in SHRV1 V1.

## Validation

| Command | Result | Notes |
| --- | --- | --- |
| `python3 -m json.tool docs/operator-runbook/SHS_OPERATOR_RUNBOOK_PHASE_9_UPGRADE_OPPORTUNITY.json` | PASS | JSON report is valid. |
| `npm run build` | PASS | Build passed with the existing Vite large-chunk warning. |
| `npm run check:governance` | PASS | Master registry, proposal, Truth Spine, Oracle, AI Guardrails, Game Theory, data/governance layers, and duplicate cleanup checks passed. |
