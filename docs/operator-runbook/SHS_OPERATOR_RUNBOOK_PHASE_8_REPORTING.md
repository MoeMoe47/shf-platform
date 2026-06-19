# SHS Operator Runbook V1 - Phase 8: Reporting

Created: 2026-06-19

Mode: documentation and audit only. No features, routes, services, pages, refactors, runtime behavior changes, deletes, moves, staging, commits, or package changes were performed.

## Goal

Document how SHS produces client-facing reports.

This phase starts when a ClientOps-managed client needs a report, review packet, support summary, or upgrade recommendation. It ends when the approved report is saved as PDF and delivered through the agreed client delivery path.

## Entry Condition

Start Phase 8 when:

- Phase 7 ClientOps status is actively managed.
- Client record, support tier, system health, version history, support tickets, maintenance board, and monthly review cadence are current.
- The report purpose is known.
- Report audience and delivery channel are known.
- Report facts are either private operational facts for that client or have passed required Truth Spine, Reports readiness, approval, privacy, and ownership gates.

## Exit Condition

Report delivered.

A report is delivered when:

- Report type is selected.
- Report source data is reviewed.
- Client/private boundaries are checked.
- Truth/readiness/public approval status is checked where required.
- Report approval is recorded.
- Final report is saved as PDF.
- PDF is delivered to the approved recipient/channel.
- Delivery date, recipient, report version, and owner are recorded.
- ClientOps record is updated with the delivered report.

## Current Reporting Context

| Surface | Route or File | Status | Purpose |
| --- | --- | --- | --- |
| SHRV1 Reports admin | `admin.html#/reports` | Existing | Trust-aware report readiness and governance reporting surface. |
| SHRV1 Truth Spine | `admin.html#/truth-spine` | Existing | Verification, report readiness, public approval, package metadata, and display-scope authority. |
| Reports API snapshot | `services/shf-agent-fabric/routers/reports_routes.py` | Existing | Exposes truth status and governance-layer readiness context for reports. |
| SHF-Next ClientOps Center | `/ops/clientops` | Existing in consumer app | ClientOps record, monthly review, support, maintenance, health, version history, and report/export workflow context. |
| ClientOps report helpers | `/Users/mikeslate/shf-next/src/data/clientOpsReportData.ts` | Existing in consumer app | Project snapshot, monthly review, maintenance, support ticket, system health, and upgrade opportunity exports. |
| ClientOps bridge to Reports | `src/system/routes/crossAppRouteBridge.js` | Existing | Allows ClientOps monthly/reporting workflow to open SHRV1 trust-aware reports admin. |

Client-facing reports may use ClientOps operational context, but public/funder-facing claims must not bypass Truth Spine, Reports readiness, public approval, Security / Privacy, or Data Ownership / IP checks.

## Required Data Fields

| Field | Required | Notes |
| --- | --- | --- |
| `report_id` | Yes | Stable report identifier. |
| `report_type` | Yes | Client health, monthly review, upgrade report, support summary, or approved custom type. |
| `clientops_record_id` | Yes | Active ClientOps record. |
| `client_id` | Yes | Stable client identifier. |
| `client_name` | Yes | Client-facing name. |
| `report_period` | Yes | Month, quarter, launch window, support window, or custom period. |
| `report_audience` | Yes | Client-only, internal, public-facing, funder-facing, or partner-facing. |
| `source_sections` | Yes | Client record, maintenance, tickets, health, versions, upgrades, reports, or Truth Spine packages. |
| `truth_status` | Conditional | Required when claims are public, funder-facing, or externally communicative. |
| `approval_status` | Yes | Draft, review, approved, approved with exceptions, blocked, or delivered. |
| `approved_by` | Yes | Owner approving the report before PDF delivery. |
| `pdf_saved` | Yes | True only after final report is saved as PDF. |
| `delivery_channel` | Yes | Email, client portal, shared drive, meeting handoff, or approved channel. |
| `delivered_at` | Yes | Delivery timestamp/date. |
| `delivery_owner` | Yes | Operator responsible for delivery. |
| `report_version` | Yes | Version ID or date-stamped label. |

## Report Types

### Client Health Report

Purpose: summarize whether the launched client system is stable, supported, and on track.

Include:

- Client status.
- System health.
- Open/closed support tickets.
- Maintenance board summary.
- Version changes.
- Known risks.
- Next actions.
- Support tier and owner.

Do not include internal prompts, private QA machinery, unapproved claims, or sensitive notes.

### Monthly Review Report

Purpose: give the client a recurring operating review.

Include:

- Reporting period.
- Client status.
- Support summary.
- Maintenance progress.
- System health.
- Version history highlights.
- Upgrade opportunities.
- Decisions needed.
- Next-month actions.

Monthly review output remains client-private unless explicitly approved for broader use.

### Upgrade Report

Purpose: recommend improvements, expansions, add-ons, or future work.

Include:

- Opportunity title.
- Problem or value.
- Affected module/route/package.
- Evidence from support, maintenance, monthly review, or system health.
- Estimated complexity if known.
- Client readiness.
- Recommended next step.
- Sales/proposal handoff note if applicable.

Upgrade reports are recommendations, not commitments, until approved through the correct sales, proposal, governance, and delivery flow.

### Support Summary

Purpose: summarize support activity for the report period.

Include:

- Tickets opened.
- Tickets closed.
- Current open tickets.
- Response status against support tier.
- Common issue patterns.
- Maintenance items created from tickets.
- Client action needed.
- Internal action owner.

Support summaries must separate client-facing facts from internal troubleshooting notes.

## Report Approval

Before delivery, the operator must confirm:

- Report type and audience are correct.
- Client/private data is not exposed beyond the intended audience.
- Public/funder-facing claims are verified, report-ready, and public-approved where required.
- Truth Spine status and report readiness are included in snapshots/exports when applicable.
- Security / Privacy and Data Ownership / IP concerns are resolved or blocked.
- Reports do not use draft, missing-source, or low-coverage claims as final facts.
- Report owner approves the final version.

If report approval is blocked, the report must remain draft/internal and must not be saved as the final delivery PDF.

## Save as PDF Rule

The final client-facing report must be saved as PDF before delivery.

PDF rule:

- Save only the approved final report as PDF.
- Use a date-stamped or versioned filename.
- Do not save draft reports as delivery PDFs.
- Do not deliver screenshots, raw exports, JSON, CSV, or internal notes as the final client-facing report unless separately approved.
- If JSON/CSV exports are generated for internal traceability, keep them internal unless the owner approves delivery.
- Record the PDF filename, report version, saved date, and delivery owner in ClientOps.

## Delivery Process

1. Select report type.
2. Confirm audience and delivery channel.
3. Pull source context from ClientOps, Reports, and Truth Spine where applicable.
4. Draft the report.
5. Check client/private and public/private boundaries.
6. Check report approval requirements.
7. Resolve blockers or mark the report blocked.
8. Record approval owner and approval status.
9. Save final approved report as PDF.
10. Deliver PDF through the approved channel.
11. Record delivery date, recipient/channel, report version, and owner.
12. Update the ClientOps record with the delivered report and next action.

## Operator Checklist

1. Confirm ClientOps record is active.
2. Select client health, monthly review, upgrade report, support summary, or approved custom report.
3. Confirm report period and audience.
4. Gather ClientOps record, maintenance board, support tickets, system health, version history, upgrade opportunities, and handoff file context.
5. Open SHRV1 Reports admin when trust/readiness context is required.
6. Open Truth Spine when public claims, report-ready facts, package metadata, or public approval are required.
7. Draft client-facing content.
8. Remove internal prompts, private sales assumptions, QA machinery, adaptive learning notes, sensitive context, and unapproved claims.
9. Run report approval checklist.
10. Record approval status and approver.
11. Save final approved report as PDF.
12. Deliver PDF through the approved delivery channel.
13. Record delivery in ClientOps.
14. Exit only when report status is Report delivered.

## Governance Boundary

Reports communicate only verified and readiness-approved information.

ClientOps may feed reports only as governed report-candidate input after applicable source, verification, approval, privacy, ownership, readiness, public approval, and gateway controls.

Reports must not:

- Publish ClientOps private data publicly.
- Use draft, missing-source, or low-coverage claims as final facts.
- Recalculate Truth Spine verification status.
- Recalculate public approval status.
- Override Security / Privacy or Data Ownership / IP blockers.
- Deliver public/funder-facing claims without required public approval.

## Definition of Done

Phase 8 is done when:

- Report type is selected.
- ClientOps source context is reviewed.
- Report audience is documented.
- Truth/readiness/public approval requirements are checked.
- Report approval is recorded.
- Final approved report is saved as PDF.
- PDF is delivered through approved channel.
- Delivery date, recipient/channel, owner, and version are recorded.
- ClientOps record is updated.
- Report status is Report delivered.

## Findings

- SHRV1 Reports snapshot includes Truth Spine report-ready, verified, public-approved, and coverage status.
- Truth Spine Guardrails state Reports must include Truth Spine status and may communicate only verified, report-ready, and public-approved claims where applicable.
- ClientOps audit states ClientOps may feed reports only as governed report-candidate input after source, verification, approval, privacy, ownership, readiness, public approval, and gateway controls.
- SHF-Next ClientOps has monthly/report/export context, while SHRV1 owns trust-aware Reports and Truth Spine governance surfaces.
- Client-facing report delivery is currently operator-driven and PDF-based, not hard runtime-enforced in SHRV1.

## Launch Blockers

- No hard SHRV1 client-report approval gate was identified.
- PDF delivery is a runbook rule, not a runtime-enforced workflow.
- ClientOps report generation lives in the consumer app context and is not durably persisted by SHRV1 V1.
- Public/funder-facing report claims still require complete Truth Spine and public approval coverage.
- Production auth and durable report delivery records remain post-V1.

## Post-V1 Improvements

- Add a structured report approval model when owner approves runtime work.
- Add report delivery records to durable ClientOps persistence.
- Add automatic Truth Spine package attachment to report exports.
- Add PDF filename/version enforcement.
- Add public/private leakage checks before report delivery.
- Add report-recipient and delivery-channel audit trail.

## V1 Complete?

Yes for Phase 8 runbook documentation.

No for runtime product completeness. Client-facing reports can be prepared and delivered manually under this runbook, but report approval, PDF delivery, and durable report records are not hard-enforced in SHRV1 V1.

## Validation

| Command | Result | Notes |
| --- | --- | --- |
| `python3 -m json.tool docs/operator-runbook/SHS_OPERATOR_RUNBOOK_PHASE_8_REPORTING.json` | PASS | JSON report is valid. |
| `npm run build` | PASS | Build passed with the existing Vite large-chunk warning. |
| `npm run check:governance` | PASS | Master registry, proposal, Truth Spine, Oracle, AI Guardrails, Game Theory, data/governance layers, and duplicate cleanup checks passed. |
