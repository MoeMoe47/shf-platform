# SHS Operator Runbook V1 - Phase 7: ClientOps

Created: 2026-06-19

Mode: documentation and audit only. No features, routes, services, pages, refactors, runtime behavior changes, deletes, moves, staging, commits, or package changes were performed.

## Goal

Document how SHS manages a launched client after delivery.

This phase starts after Phase 6 marks the project ClientOps Active. It ends when the launched client is actively managed through a ClientOps record, maintenance board, support queue, health review, version history, upgrade pathway, monthly review cadence, and handoff file.

## Entry Condition

Start Phase 7 when:

- Phase 6 Launch exit condition is complete.
- Final approval, launch date, client signoff, support tier, handoff notes, version record, and ClientOps record are available.
- ClientOps owner or support owner is assigned.
- Open maintenance or post-launch watch items are transferred.
- Public claims, reports, and approval-sensitive facts remain behind Truth Spine, Reports readiness, and public approval gates where applicable.

## Exit Condition

Client actively managed.

A client is actively managed when:

- Client record is current.
- Maintenance board is active.
- Support tickets are triaged.
- System health is reviewed on cadence.
- Version history is current.
- Upgrade opportunities are tracked.
- Monthly review cadence is established.
- Handoff file is complete and private-safe.
- ClientOps owner is assigned.
- Any report/public impact candidate follows governed intake.

## Current ClientOps Context

| Surface | Route or File | Status | Purpose |
| --- | --- | --- | --- |
| SHF-Next ClientOps Center | `/ops/clientops` | Existing in consumer app | Active ClientOps records, maintenance board, support tickets, system health, version history, upgrade opportunities, monthly review, and exports. |
| ClientOps data model | `/Users/mikeslate/shf-next/src/data/clientOpsData.ts` | Existing in consumer app | Local ClientOps records and operational data model. |
| ClientOps report helpers | `/Users/mikeslate/shf-next/src/data/clientOpsReportData.ts` | Existing in consumer app | Project snapshot, monthly review, maintenance, support ticket, system health, and upgrade opportunity exports. |
| SHRV1 Production Ops | `admin.html#/ops/production` | Existing | Pre-launch and launch handoff context before ClientOps takes over. |
| SHRV1 Reports | `admin.html#/reports` | Existing | Trust-aware reporting/readiness context for report candidate material. |
| SHRV1 Truth Spine | `admin.html#/truth-spine` | Existing | Truth/readiness/public approval authority for claims and public-facing facts. |
| ClientOps bridge | `src/system/routes/crossAppRouteBridge.js` | Existing | Links SHF-Next `/ops/clientops` to SHRV1 Agent Fabric and Reports governance surfaces. |
| ClientOps identity boundary | `src/system/identity/crossAppIdentityBridge.js` | Existing | Classifies `/ops/clientops` as internal ClientOps for `shs_admin` and `shs_clientops`. |

ClientOps is an SHS internal/private operational surface. It is not public SHF impact data, does not mutate SHF Impact Data Spine, and may feed SHF only through governed SHS-to-SHF review.

## Required Data Fields

| Field | Required | Notes |
| --- | --- | --- |
| `clientops_record_id` | Yes | Stable ClientOps record identifier. |
| `client_id` | Yes | Stable client identifier. |
| `client_name` | Yes | Client-facing name. |
| `business_name` | Yes | Organization or business name. |
| `project_id` | Yes | Launched project identifier. |
| `support_tier` | Yes | Support tier assigned during launch. |
| `clientops_owner` | Yes | Internal owner managing the account. |
| `handoff_file` | Yes | Final launch handoff, version baseline, support context, and private-safe notes. |
| `maintenance_board` | Yes | Active maintenance queue and cadence. |
| `support_tickets` | Yes | Ticket queue, status, owner, priority, and response expectation. |
| `system_health` | Yes | Health status, checked date, owner, issues, and next check. |
| `version_history` | Yes | Launch version and post-launch changes. |
| `upgrade_opportunities` | Yes | Improvements, expansions, renewals, and owner decisions. |
| `monthly_review` | Yes | Review cadence, notes, risks, wins, and next actions. |
| `reports` | Conditional | Required when client-facing reports are included. |
| `report_candidate_status` | Conditional | Required when ClientOps material may feed reports. |
| `public_impact_candidate_status` | Conditional | Required only after governance review. |

## Operator Checklist

1. Confirm Phase 6 exit status is ClientOps Active.
2. Open or create the active ClientOps record.
3. Confirm client identity, business identity, project ID, package, support tier, active modules, routes, reports, and owner.
4. Attach or confirm the handoff file.
5. Transfer launch version record into version history.
6. Create or update maintenance board items.
7. Triage open support tickets and assign owner, priority, status, and next action.
8. Record current system health and next health check date.
9. Track upgrade opportunities, renewal timing, and expansion candidates.
10. Establish monthly review cadence and next review date.
11. Confirm reports use trust-aware Reports and Truth Spine readiness when report/public claims are in scope.
12. Keep ClientOps private operational records out of public SHF surfaces.
13. Treat ClientOps exports as local ClientOps artifacts unless governed intake is explicitly approved.
14. Mark the client actively managed only when ClientOps record, maintenance, support, health, version, upgrade, review, and handoff file are current.

## Client Record

The ClientOps record is the active account container.

It should include:

- Client name.
- Business or organization name.
- Project ID and client ID.
- Package and active modules.
- Support tier.
- ClientOps owner.
- Active routes and reports.
- Launch date and version baseline.
- Current status.
- Monthly review cadence.
- Renewal or upgrade timing if known.

## Maintenance Board

The maintenance board tracks post-launch work that is not an urgent support ticket.

Each item should include:

- Item title.
- Source.
- Priority.
- Owner.
- Status.
- Due date or cadence.
- Related route/module.
- Client-visible impact.
- Notes and closure criteria.

## Support Tickets

Support tickets track client-reported issues, urgent fixes, and direct support requests.

Each ticket should include:

- Ticket ID.
- Request source.
- Priority.
- Owner.
- Status.
- Response expectation based on support tier.
- Affected route/module.
- Reproduction notes or client context.
- Resolution notes.
- Follow-up date.

Support tickets must not expose private notes, internal prompts, or unapproved claims to public/client-facing outputs.

## System Health

System health checks should include:

- Overall status.
- Last checked date.
- Next check date.
- Owner.
- Build/deploy status if available.
- Known risks.
- Broken routes or errors if found.
- Report/public claim readiness if in scope.
- Support ticket and maintenance summary.

## Version History

Version history should start with the Phase 6 launch version record.

Each version entry should include:

- Version ID.
- Date.
- Summary.
- Changed routes/modules.
- Reports affected.
- Client approval status when applicable.
- Known exceptions.
- Rollback or recovery note if applicable.
- Owner.

Version history is the baseline for support, maintenance, upgrades, monthly review, and future delivery decisions.

## Upgrade Opportunities

Upgrade opportunities should track:

- Opportunity title.
- Source: client request, operator observation, monthly review, support trend, or system health issue.
- Value or problem solved.
- Package or module affected.
- Client readiness.
- Estimate or complexity if known.
- Owner.
- Next action.
- Status.

Upgrade opportunities are not commitments until approved through the correct sales, proposal, governance, and delivery flow.

## Monthly Review

Monthly review should summarize:

- Client status.
- Support tickets opened/closed.
- Maintenance progress.
- System health.
- Version changes.
- Report/export status if applicable.
- Upgrade opportunities.
- Risks and blockers.
- Owner recommendations.
- Next-month actions.

Monthly review output must stay private unless a report/export is explicitly approved and passes required trust/readiness gates.

## Handoff File

The handoff file should remain the compact operational reference for the launched client.

It should include:

- Launch summary.
- Client and project identifiers.
- Support tier and owner.
- Active modules, routes, and reports.
- Version baseline.
- Open maintenance items.
- Post-launch watch items.
- Monthly review cadence.
- Known exceptions.
- Client contacts and escalation path where appropriate.

The handoff file must exclude internal sales assumptions, draft build packets, implementation prompts, QA machinery, screenshot drift notes, blocked/internal defects, adaptive learning notes, sensitive unapproved context, and public claims that have not passed readiness gates.

## Governance Boundary

ClientOps feeds SHS operational truth by default. Raw ClientOps records remain in SHS unless downstream governance explicitly allows transfer.

ClientOps data may cross into SHF or public reporting only after applicable review through:

- Adapter Layer.
- Batch / Import.
- Source Registry.
- Data Federation.
- Data Aggregator.
- Data Normalization.
- Evidence Package.
- Data Verification.
- Truth Spine.
- Oracle where applicable.
- Data Approval.
- Readiness Gate.
- Security / Privacy.
- Data Ownership / IP.
- Public Approval.
- Verified Aggregation.
- Data Approval Gateway.
- SHF Impact Data Spine only after approval.

Direct SHF public exposure, direct SHF Impact Data Spine mutation, direct public approval, and direct public report publishing remain blocked.

## Definition of Done

Phase 7 is done when:

- Client record is current.
- Maintenance board is active.
- Support tickets are triaged.
- System health review is current.
- Version history includes launch baseline and post-launch changes.
- Upgrade opportunities are tracked.
- Monthly review cadence is active.
- Handoff file is complete and private-safe.
- ClientOps owner is assigned.
- Report/public impact candidates remain behind governance gates.
- Client status is actively managed.

## Findings

- The ClientOps governance audit identifies `/ops/clientops` in SHF-Next as the active ClientOps surface.
- ClientOps functional areas include active records, maintenance board, support tickets, system health, version history, upgrade opportunities, monthly review, SHS monthly report preview/export, and multiple operational exports.
- ClientOps is internal/private and not public SHF impact data.
- SHRV1 admin ops routes are protected under admin routing, while SHF-Next `/ops/clientops` is classified as internal ClientOps with `shs_admin` and `shs_clientops` roles.
- ClientOps exports remain local ClientOps artifacts unless governed intake occurs.
- Reports and Watchtower expose governance context without making ClientOps public.

## Launch Blockers

- Production auth is still outside this runbook phase.
- ClientOps currently depends on consumer-app local/internal workflow context rather than SHRV1 durable ClientOps backend persistence.
- No dedicated ClientOps formal V1 governance check exists unless ClientOps becomes an official governance-enforced layer rather than an ops surface.
- Real ClientOps-to-governance intake is not implemented and should only be added at approved boundaries.
- Visible ClientOps governance banner in SHF-Next remains a future owner-approved consumer-app change.

## Post-V1 Improvements

- Add durable ClientOps persistence when owner approves runtime work.
- Add structured ClientOps monthly review model.
- Add support ticket and maintenance board exports with governance labels.
- Add visible internal-only ClientOps governance banner in SHF-Next.
- Add Source Registry intake mapping for ClientOps exports when real governed intake is implemented.
- Add automated checks that prevent ClientOps records from appearing on public routes.

## V1 Complete?

Yes for Phase 7 runbook documentation.

No for runtime product completeness. ClientOps can be operated manually through the documented internal surface, but production auth, durable persistence, and governed ClientOps-to-SHF intake remain post-V1.

## Validation

| Command | Result | Notes |
| --- | --- | --- |
| `python3 -m json.tool docs/operator-runbook/SHS_OPERATOR_RUNBOOK_PHASE_7_CLIENTOPS.json` | PASS | JSON report is valid. |
| `npm run build` | PASS | Build passed with the existing Vite large-chunk warning. |
| `npm run check:governance` | PASS | Master registry, proposal, Truth Spine, Oracle, AI Guardrails, Game Theory, data/governance layers, and duplicate cleanup checks passed. |
