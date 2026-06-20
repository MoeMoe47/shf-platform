# SHS Durable Launch / Signoff / Version Ledger V1

Created: 2026-06-19

Mode: local ledger scaffold and documentation only. No public SHF data mutation, SHF Impact Data Spine mutation, public report publication, route exposure, backend service, external archive change, staging, or commit was performed.

## Executive Summary

Durable Launch / Signoff / Version Ledger V1 creates the first paid-launch hardening scaffold for SHS.

The V1 implementation adds a frontend/local ledger utility at `src/system/launch/shsLaunchLedger.js`. It tracks whether a project has enough evidence to move from QA/Delivery into Launch and ClientOps activation, while preserving the private-beta safety boundary.

V1 uses localStorage only, matching the current SHS private-beta/local ops pattern. It is not production-durable and is not a paid-launch approval by itself.

UI/route status: no UI route was created in this pass. The route remains a later hardening item so this first component can stay isolated and avoid touching active Admin routing during a dirty working tree.

## Why This Exists

The Private Beta Go/No-Go Review and Launch Gate Hardening Plan identified the same first paid-launch blocker:

- No durable launch/signoff/version ledger.
- No hard evidence container for launch readiness.
- No required version baseline before ClientOps activation.
- No formal rollback requirement.
- No single status that separates supervised private beta from paid launch.

This scaffold creates that evidence container at the frontend utility layer first. Later work can attach a backend service, admin UI, route, immutable audit log, and ClientOps integration without changing the core gate rules.

## Ledger Model

`LaunchLedgerRecord`:

```json
{
  "ledger_id": "",
  "project_id": "",
  "client_name": "",
  "project_name": "",
  "package_name": "",
  "support_tier": "",
  "launch_status": "draft|qa_review|delivery_ready|launch_ready|launched|blocked",
  "qa_signoff": {},
  "operator_signoff": {},
  "delivery_signoff": {},
  "client_signoff": {},
  "version_record": {},
  "rollback_plan": {},
  "clientops_activation": {},
  "created_at": "",
  "updated_at": "",
  "private_beta_only": true,
  "public_approved": false,
  "mutated_shf_impact_data": false,
  "published_report": false
}
```

V1 exported helpers:

- `SHS_LAUNCH_LEDGER_STORAGE_KEY`
- `SHS_LAUNCH_LEDGER_VERSION`
- `createLaunchLedgerRecord(input)`
- `validateLaunchLedgerRecord(record)`
- `computeLaunchGateStatus(record)`
- `getLaunchBlockers(record)`
- `getLaunchWarnings(record)`
- `isClientOpsActivationAllowed(record)`
- `createVersionRecord(input)`
- `createSignoffRecord(input)`
- `loadLaunchLedger()`
- `saveLaunchLedger(records)`
- `upsertLaunchLedgerRecord(record)`

Storage key: `shs.launch.ledger.v1`

## Launch Gate Rules

The scaffold supports these status outputs:

- `blocked`
- `needs_review`
- `private_beta_ready`
- `paid_launch_ready`

Rules implemented:

- Missing `project_id` blocks launch gate evaluation.
- Missing `client_name` blocks launch gate evaluation.
- Missing `project_name` blocks launch gate evaluation.
- Missing `package_name` is a private-beta warning and a paid-launch blocker.
- Missing QA signoff blocks `launch_ready`.
- Missing operator signoff blocks `launch_ready`.
- Missing delivery signoff blocks `launch_ready`.
- Missing client signoff blocks paid launch, but may allow supervised private beta if `private_beta_only` is true.
- Missing version record blocks `launch_ready`.
- Missing rollback owner or last known good version blocks paid launch.
- `private_beta_only: true` blocks `paid_launch_ready`.
- `public_approved` is forced false and a true input is treated as a blocker.
- `mutated_shf_impact_data` is forced false and a true input is treated as a blocker.
- `published_report` is forced false and a true input is treated as a blocker.

## ClientOps Activation Rules

ClientOps activation is allowed only when:

- Core launch blockers are clear.
- `support_tier` exists.
- `clientops_activation.owner` exists.
- Version record exists.

ClientOps activation does not:

- Mutate SHF Impact Data Spine.
- Create public SHF impact data.
- Publish reports.
- Mark public approval.
- Bypass Truth Spine, Reports readiness, Oracle, or governance boundaries.

## Private Beta vs Paid Launch Behavior

Supervised private beta can reach `private_beta_ready` when:

- Project identity fields exist.
- QA signoff is complete.
- Operator signoff is complete.
- Delivery signoff is complete.
- Version record exists.
- Public safety flags are false.

Paid launch can reach `paid_launch_ready` only when the private-beta-ready evidence is complete and:

- `private_beta_only` is false.
- Package name exists.
- Client signoff is complete.
- Rollback plan includes owner and last known good version.
- Support tier exists.
- ClientOps activation owner exists.

This preserves the current doctrine: private beta can be operator-managed and supervised; paid launch requires hard evidence.

## Files Created

- `src/system/launch/shsLaunchLedger.js`
- `docs/paid-launch/SHS_DURABLE_LAUNCH_SIGNOFF_VERSION_LEDGER_V1.md`
- `docs/paid-launch/SHS_DURABLE_LAUNCH_SIGNOFF_VERSION_LEDGER_V1.json`

## Files Modified

None.

## UI / Route Decision

UI created: No.

Route created: none.

Reason: The ledger scaffold is safe and useful without routing. Adding `admin.html#/ops/launch-ledger` would touch AdminRoutes, AdminSidebar, and hub access during a dirty tree. The Launch Gate Hardening Plan already identifies the admin route/model as the next item after the ledger. Keeping V1 scaffold-only reduces blast radius and avoids public exposure risk.

## Validation Results

| Command | Result |
| --- | --- |
| `node --input-type=module -e "import ... from './src/system/launch/shsLaunchLedger.js'"` | PASS |
| `python3 -m json.tool docs/paid-launch/SHS_DURABLE_LAUNCH_SIGNOFF_VERSION_LEDGER_V1.json` | PASS |
| `npm run check:governance` | PASS |
| `python3 scripts/check_master_layer_registry.py` | PASS |
| `python3 scripts/check_truth_spine_freeze.py` | PASS |
| `npm run build` | PASS with existing Vite large-chunk warning |

## Remaining Risks

- V1 uses browser localStorage only and is not production-durable.
- No admin Launch Ledger UI or route was created in this pass.
- No backend ledger API, database table, signed hash, or immutable audit trail exists yet.
- Paid launch still requires production auth/session and durable persistence decisions.
- ClientOps activation evidence is represented by scaffold fields but is not wired to SHF-Next ClientOps runtime.
- Truth Spine, Reports readiness, and public approval checks are represented as governance boundaries, not automated launch ledger integrations.

## V1 Complete

Yes. Durable Launch / Signoff / Version Ledger V1 is complete as a local scaffold. It does not make SHS paid-launch-ready by itself; it supplies the first evidence model and gate logic for later Launch Gate route, backend persistence, ClientOps integration, and paid-launch readiness hardening.
