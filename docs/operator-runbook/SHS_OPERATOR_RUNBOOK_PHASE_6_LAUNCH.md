# SHS Operator Runbook V1 - Phase 6: Launch

Created: 2026-06-19

Mode: documentation and audit only. No features, routes, services, pages, refactors, runtime behavior changes, deletes, moves, staging, commits, or package changes were performed.

## Goal

Document how a delivered project becomes a launched SHS client system.

This phase starts after Phase 5 marks a project Delivery Ready. It ends when the launched project has an active ClientOps record, support ownership, launch/version context, and handoff notes.

## Entry Condition

Start Phase 6 when:

- Phase 5 QA + Delivery is Delivery Ready.
- Final client-facing deliverables are approved or ready for final owner approval.
- Reports, public claims, and approval-sensitive facts have passed the required truth/readiness gates.
- Production Ops has a final launch-ready project record.
- Open QA exceptions, maintenance tasks, or post-launch watch items are documented.

## Exit Condition

ClientOps Active.

A launched project is ClientOps-active when:

- Final approval is recorded.
- Launch date is recorded.
- Client signoff is recorded.
- Support tier is assigned.
- Handoff notes are complete.
- Version launch record exists.
- ClientOps record exists.
- ClientOps owner or support owner is assigned.
- Open maintenance/watch items are transferred or explicitly closed.

## Current Launch and ClientOps Context

| Surface | Route or File | Status | Purpose |
| --- | --- | --- | --- |
| Production Ops dashboard | `admin.html#/ops/production` | Existing | Internal/admin project status and launch handoff preparation. |
| Project setup | `admin.html#/ops/projects` | Existing | Final project record context before launch handoff. |
| Build packet | `admin.html#/ops/build-packet` | Existing | Development-ready packet and final implementation source context. |
| Screenshot QA | `admin.html#/ops/screenshot-qa` | Existing | QA evidence, match notes, drift category, and delivery readiness context. |
| Reports admin | `admin.html#/reports` | Existing | Trust-aware reporting/readiness context when reports are in scope. |
| Truth Spine admin | `admin.html#/truth-spine` | Existing | Approval authority for public claims, report facts, readiness, and public approval. |
| SHF-Next ClientOps | `/ops/clientops` | Existing in consumer app | Internal ClientOps center for active records, maintenance, support, system health, version history, upgrades, monthly review, and exports. |
| Cross-app ClientOps bridge | `src/system/routes/crossAppRouteBridge.js` | Existing | Links SHF-Next `/ops/clientops` to SHRV1 Agent Fabric and Reports governance surfaces. |
| ClientOps classification | `src/system/identity/crossAppIdentityBridge.js` | Existing | Classifies `/ops/clientops` as internal ClientOps with `shs_admin` and `shs_clientops` roles. |

No dedicated SHRV1 operator Launch route was found in the audited source context. Phase 6 is therefore documented as an operator handoff gate that uses existing Production Ops, QA, Reports, Truth Spine, and ClientOps surfaces.

## Required Data Fields

| Field | Required | Notes |
| --- | --- | --- |
| `project_id` | Yes | Stable project identifier from Production Ops or handoff context. |
| `client_id` | Yes | Stable client identifier. |
| `client_name` | Yes | Client-facing name. |
| `business_name` | Yes | Organization or business name if different from client name. |
| `package_selected` | Yes | Package delivered and launched. |
| `final_approval_status` | Yes | Approved, approved with exceptions, blocked, or pending. |
| `final_approval_owner` | Yes | Internal owner responsible for launch approval. |
| `launch_date` | Yes | Planned or actual launch date. |
| `client_signoff_status` | Yes | Signed off, signed off with exceptions, blocked, or pending. |
| `client_signoff_owner` | Yes | Client-side signer or approver. |
| `support_tier` | Yes | Support tier assigned before ClientOps activation. |
| `handoff_notes` | Yes | Final context ClientOps needs to support the client. |
| `version_record` | Yes | Launch version identifier, date, summary, active modules, routes, reports, and known exceptions. |
| `clientops_record_id` | Yes | ClientOps record created for the launched client system. |
| `active_modules` | Yes | Modules/pages/features active at launch. |
| `routes` | Yes | Public, client-facing, and admin/internal routes relevant to the launch. |
| `reports` | Conditional | Required when reports are included in the delivery. |
| `open_maintenance_items` | Conditional | Required when post-launch follow-up remains. |
| `post_launch_watch_items` | Conditional | Required when risks or monitoring tasks remain. |

## Operator Checklist

1. Confirm Phase 5 exit status is Delivery Ready.
2. Open Production Ops, project setup, build packet, and screenshot QA records.
3. Confirm final approval status and final approval owner.
4. Record planned or actual launch date.
5. Capture client signoff status and signer.
6. Assign support tier before launch handoff.
7. Write handoff notes that explain what ClientOps must know to support the client.
8. Create a version launch record with version ID, date, summary, active modules, routes, reports, known exceptions, and owner.
9. Confirm report claims and public claims use Truth Spine, Reports readiness, and public approval gates when applicable.
10. Transfer the final launch-ready project record to ClientOps context.
11. Transfer client name, business name, package, support tier, active modules, routes, reports, renewal or review timing, and approved operational context.
12. Transfer open maintenance tasks or post-launch watch items.
13. Keep internal sales assumptions, draft build packets, prompts, QA machinery, screenshot drift notes, blocked/internal defects, adaptive learning notes, sensitive client context, and unapproved scope decisions private.
14. Create or confirm the ClientOps record in the active ClientOps surface.
15. Assign ClientOps owner or support owner.
16. Mark the project ClientOps Active only after final approval, launch date, client signoff, support tier, handoff notes, version record, and ClientOps record creation are complete.

## Final Approval

Final approval should confirm:

- Delivery Ready status is not blocked.
- Approved exceptions are documented.
- Client-facing content and assets are approved.
- Report/public claim readiness is approved where applicable.
- Launch date and support tier are agreed.
- ClientOps owner accepts the handoff.

## Launch Date

The launch date should include:

- Planned launch date.
- Actual launch date once executed.
- Launch window or timing note if needed.
- Owner responsible for launch confirmation.
- Known constraints, blackout windows, or post-launch monitoring notes.

## Client Signoff

Client signoff should include:

- Signoff status.
- Signoff owner or signer.
- Date of signoff.
- Approved exceptions or unresolved items.
- Any client-facing delivery note that ClientOps needs for support.

## Support Tier

Support tier should be assigned before ClientOps activation.

Minimum support-tier record:

- Tier name.
- Support owner.
- Response expectations.
- Maintenance cadence.
- Monthly review cadence if applicable.
- Upgrade/revision pathway if applicable.

## Handoff Notes

Handoff notes should summarize:

- What launched.
- What was intentionally excluded.
- What ClientOps must monitor.
- Known exceptions.
- Open maintenance or watch items.
- Report cadence or monthly review expectations.
- Contacts, escalation path, and support owner.

Handoff notes must not expose internal prompts, private sales assumptions, QA machinery, adaptive learning notes, or unapproved claims.

## Version Record

The version record should include:

- Version ID.
- Launch date.
- Project/client identifiers.
- Package delivered.
- Active modules.
- Active routes.
- Included reports.
- Approved exceptions.
- Known limitations.
- Support tier.
- Owner.

This version record is the baseline for future maintenance, support tickets, upgrades, monthly review, and client reporting.

## ClientOps Record Creation

ClientOps record creation should happen after final approval and before the phase exits.

The record should include:

- Client identity and business identity.
- Package and active modules.
- Support tier and owner.
- Launch/version record.
- Routes and reports.
- Open maintenance tasks.
- Post-launch watch items.
- Monthly review cadence if applicable.
- Approved operational context only.

ClientOps remains an SHS internal/private operational surface. It is not public SHF impact data and must not mutate SHF Impact Data Spine, publish public reports, mark public approval, or bypass governance.

## Governance Boundary

Production Ops and ClientOps data may become report-candidate or public-impact-candidate material only through the governed SHS-to-SHF path:

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

Phase 6 is done when:

- Final approval is recorded.
- Launch date is recorded.
- Client signoff is recorded.
- Support tier is assigned.
- Handoff notes are complete and private-safe.
- Version launch record exists.
- ClientOps record exists.
- ClientOps owner/support owner is assigned.
- Open maintenance or watch items are transferred.
- Reports/public claims remain truth/readiness-safe.
- Project status is ClientOps Active.

## Findings

- The launch-readiness audit states SHS/SHF V1 is private-beta ready with operator controls, but not paid-client or public-launch ready.
- Existing SHRV1 Production Ops, Build Packet, Screenshot QA, Reports, and Truth Spine surfaces can support a manual launch handoff.
- Existing docs define the lifecycle as Sales / Handoff -> Production Ops -> Development Library / Build Packet -> QA + Delivery -> Launch -> ClientOps.
- SHF-Next `/ops/clientops` is the documented active ClientOps surface for portfolio records, maintenance, support tickets, system health, version history, upgrade opportunities, monthly review, and exports.
- ClientOps is internal/private and should not be exposed on public SHF routes.
- Launch and ClientOps activation are currently operator-enforced, not hard runtime gates.

## Launch Blockers

- No dedicated SHRV1 Launch route or hard launch gate was found.
- No automated Production Ops to ClientOps record creation exists in SHRV1.
- No durable launch/version record backend was identified for SHRV1 Operator Runbook V1.
- Client signoff, final approval, and support tier are checklist-driven rather than hard-validated.
- Production auth and durable persistence remain outside this runbook phase.

## Post-V1 Improvements

- Add a structured Launch gate surface or model when owner approves runtime work.
- Add one-click ClientOps record creation from a launch-ready project.
- Add durable version records for launched client systems.
- Add required final approval, client signoff, support tier, and owner fields.
- Add launch/browser smoke evidence capture.
- Add governed ClientOps-to-report candidate intake when real reporting workflows require it.

## V1 Complete?

Yes for Phase 6 runbook documentation.

No for runtime product completeness. Launch can be run manually today using existing governance/admin surfaces, but ClientOps activation is not hard-validated or durably persisted in SHRV1.

## Validation

| Command | Result | Notes |
| --- | --- | --- |
| `python3 -m json.tool docs/operator-runbook/SHS_OPERATOR_RUNBOOK_PHASE_6_LAUNCH.json` | PASS | JSON report is valid. |
| `npm run build` | PASS | Build passed with the existing Vite large-chunk warning. |
| `npm run check:governance` | PASS | Master registry, proposal, Truth Spine, Oracle, AI Guardrails, Game Theory, data/governance layers, and duplicate cleanup checks passed. |
