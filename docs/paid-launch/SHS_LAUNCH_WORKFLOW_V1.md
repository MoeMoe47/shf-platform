# SHS Launch Workflow V1

Created: 2026-06-19

Mode: internal admin workflow implementation. No SHF Impact Data Spine mutation, public route exposure, public SHF impact data creation, external archive change, staging, or commit was performed.

## Executive Summary

SHS Launch Workflow V1 creates the first operational launch readiness page for moving projects from QA Ready to Delivery Ready, Launch Ready, Launched, and ClientOps Active.

Route: `admin.html#/ops/launch-workflow`

The page uses `src/system/launch/shsLaunchLedger.js` as the official launch readiness authority for:

- Launch gate status.
- Critical blockers.
- Warnings.
- Private beta readiness.
- Paid launch readiness.
- ClientOps activation allowance.
- Local ledger persistence.

V1 is localStorage-only and internal/admin-only.

## Files Created

- `src/pages/admin/ops/OpsLaunchWorkflowPage.jsx`
- `src/styles/opsLaunchWorkflow.css`
- `src/data/mockLaunchWorkflowData.js`
- `docs/paid-launch/SHS_LAUNCH_WORKFLOW_V1.md`
- `docs/paid-launch/SHS_LAUNCH_WORKFLOW_V1.json`

## Files Modified

- `src/system/launch/shsLaunchLedger.js`
- `src/router/AdminRoutes.jsx`
- `src/components/admin/AdminSidebar.jsx`
- `src/system/identity/hubAccessControl.js`

## Route Added

`/ops/launch-workflow`

Access: `shs_admin` only through `hubAccessControl.js`.

Public exposure: none.

## Sidebar Added

Yes.

The Launch Workflow link was added under the existing Production Ops sidebar group after Screenshot QA and before Learning.

## Ledger Integration

The page imports and uses:

- `SHS_LAUNCH_LEDGER_STORAGE_KEY`
- `computeLaunchGateStatus(record)`
- `createLaunchLedgerRecord(input)`
- `createSignoffRecord(input)`
- `createVersionRecord(input)`
- `getLaunchBlockers(record)`
- `getLaunchWarnings(record)`
- `isClientOpsActivationAllowed(record)`
- `loadLaunchLedger()`
- `saveLaunchLedger(records)`
- `upsertLaunchLedgerRecord(record)`

The workflow is localStorage-only and uses the storage key:

`shs.launch.ledger.v1`

## Private Beta Rules

Private beta readiness is supported when:

- Project ID exists.
- Client name exists.
- Project name exists.
- QA signoff exists.
- Operator signoff exists.
- Delivery signoff exists.
- SHF public safety flags remain false.

Client signoff may be missing for supervised private beta.

The Launch Ledger was adjusted so missing version record is a paid-launch/ClientOps warning instead of a private-beta blocker.

## Paid Launch Rules

Paid launch readiness requires:

- QA signoff.
- Operator signoff.
- Delivery signoff.
- Client signoff.
- Version record.
- Rollback plan.
- Package name.
- Support tier.
- ClientOps activation owner.
- `private_beta_only` set to false.
- SHF public safety flags false.

## ClientOps Activation Rules

ClientOps activation displays as allowed only when:

- Launch blockers are clear.
- Support tier exists.
- ClientOps activation owner exists.
- Version record exists.

The page does not create or mutate SHF-Next ClientOps records. It records internal Launch Workflow activation evidence only.

## Page Capabilities

The page shows:

- Total projects.
- Launch Ready count.
- Private Beta Ready count.
- Paid Launch Ready count.
- Blocked count.
- Launch records table.
- Project detail panel.
- Signoff evidence panel.
- Launch gate panel.
- ClientOps activation panel.
- Critical blockers panel.
- Warnings and paid launch warnings.

Actions:

- Create Sample Record.
- Load Sample Records.
- Save Record.
- Recalculate Gate.
- QA Ready.
- Delivery Ready.
- Launch Ready.
- Launched.
- ClientOps Active.

## Validation Results

| Command | Result |
| --- | --- |
| `node --input-type=module ... computeLaunchGateStatus(...)` | PASS |
| `npm run build` | PASS with existing Vite large-chunk warning |
| `npm run check:governance` | PASS |
| `python3 scripts/check_master_layer_registry.py` | PASS |
| `python3 scripts/check_truth_spine_freeze.py` | PASS |
| `python3 -m json.tool docs/paid-launch/SHS_LAUNCH_WORKFLOW_V1.json` | PASS |

## Remaining Risks

- Launch Workflow V1 uses localStorage only and is not production-durable.
- No backend Launch Gate API or immutable audit log exists yet.
- ClientOps activation is represented in ledger state but is not wired to SHF-Next ClientOps runtime.
- Paid launch still requires production auth/session and durable persistence decisions.
- Truth Spine, Reports readiness, and public approval are respected as boundaries but not yet automated into Launch Workflow status.

## V1 Complete

Yes. SHS Launch Workflow V1 is complete as an internal localStorage-backed admin workflow that uses the Launch Ledger scaffold as the official launch readiness authority.
