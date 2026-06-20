# SHS Launch Gate Hardening Plan V1

Created: 2026-06-19

Mode: implementation plan only. No runtime changes, source changes, routes, services, package edits, staging, or commits were performed.

## Goal

Convert the Launch Signoff Gate audit into a clear implementation plan for later hardening.

This plan starts from:

- Current launch readiness score: **64 / 100**
- Current ClientOps activation score: **78 / 100**
- Current private beta recommendation: **GO for supervised launch rehearsal**
- Current paid launch recommendation: **NO-GO**

## Executive Recommendation

SHS can continue supervised private-beta launch rehearsal with operator oversight. Before unsupervised private beta, SHS should add at least the launch ledger, Launch Gate surface, operator signoff, QA signoff, rollback requirement, and launch version record.

Paid launch remains blocked until all hardening items are complete and production auth/session plus durable persistence assumptions are resolved.

## Recommended Build Order

1. Durable launch/signoff/version ledger.
2. SHRV1 Launch Gate route/model.
3. Launch version record.
4. Operator signoff.
5. QA signoff.
6. Rollback requirement.
7. Delivery signoff.
8. Client signoff.
9. Support owner required.
10. ClientOps activation gate.
11. Paid launch readiness gate.

This order builds the evidence container first, then the operator surface, then required gate fields, then downstream ClientOps activation and paid-launch computation.

## Estimated Hours

| Scenario | Hours |
| --- | ---: |
| Best case | 72 |
| Likely case | 120 |
| Conservative case | 176 |

The estimate assumes local JSON-backed V1 persistence first, focused tests, governance checks, and no production auth/session implementation inside this plan. Production auth and durable database decisions remain adjacent paid-launch blockers.

## Hardening Items

### LG-01 Durable Launch / Signoff / Version Ledger

Current state: Launch, signoff, version, and ClientOps activation evidence is documented in runbooks and local/internal flows, but no durable SHRV1 ledger exists.

Required future state: Create a durable launch ledger that records launch ID, project ID, client ID, signoff records, version baseline, rollback plan, ClientOps activation status, timestamps, owners, exceptions, and immutable export/version references.

Files likely affected:

- `services/shf-agent-fabric/services/launch_gate_service.py`
- `services/shf-agent-fabric/routers/launch_gate_routes.py`
- `services/shf-agent-fabric/db/launch_gate/launch_records.json`
- `services/shf-agent-fabric/tests/test_launch_gate_routes.py`
- `docs/MASTER_LAYER_REGISTRY.md`
- `docs/TRUTH_SPINE_GUARDRAILS.md`
- `package.json`

Estimate: 14 hours.

Difficulty: Medium.

Private beta required: Yes.

Paid launch required: Yes.

Definition of Done: Launch records persist locally in SHRV1 V1 storage, expose deterministic read/write endpoints, include signoff/version/rollback fields, and are covered by focused tests and governance checks.

### LG-02 SHRV1 Launch Gate Route / Model

Current state: No dedicated SHRV1 Launch Gate route or runtime model was found. Launch is an operator process spanning Production Ops, QA, Reports, Truth Spine, and SHF-Next ClientOps.

Required future state: Add an admin-only Launch Gate surface that lists launch candidates, shows readiness, captures launch records, and blocks launch completion until required evidence is present.

Files likely affected:

- `src/pages/admin/ops/OpsLaunchGate.jsx`
- `src/pages/admin/ops/opsData.js`
- `src/router/AdminRoutes.jsx`
- `src/components/admin/AdminSidebar.jsx`
- `src/system/identity/hubAccessControl.js`
- `src/pages/admin/ops/ops-production.css`

Estimate: 18 hours.

Difficulty: Medium.

Private beta required: Yes.

Paid launch required: Yes.

Definition of Done: Admin route loads, is sidebar-discoverable, is restricted to intended admin/operator roles, shows launch readiness, and writes only to the launch gate model without changing public surfaces.

### LG-03 Operator Signoff

Current state: Operator signoff is required by runbooks but remains manual and lacks a hard field, timestamp, owner, or exception ledger.

Required future state: Require operator signoff with owner, role, timestamp, status, notes, exception acknowledgement, and verification that route smoke, leakage, build packet, QA, and governance checks are complete.

Files likely affected:

- `services/shf-agent-fabric/services/launch_gate_service.py`
- `src/pages/admin/ops/OpsLaunchGate.jsx`
- `docs/operator-runbook/SHS_OPERATOR_RUNBOOK_PHASE_6_LAUNCH.md`

Estimate: 8 hours.

Difficulty: Low.

Private beta required: Yes.

Paid launch required: Yes.

Definition of Done: A launch record cannot reach launch-ready status without completed operator signoff metadata and visible exception status.

### LG-04 QA Signoff

Current state: QA criteria are defined and SHF-Next validates QA record, 100 percent score, and no critical blockers before ClientOps conversion. SHRV1 does not yet attach durable QA signoff evidence to a launch record.

Required future state: Attach QA signoff evidence to the launch record, including QA owner, score, blocker status, checklist reference, screenshot QA status, build status, and approved exceptions.

Files likely affected:

- `services/shf-agent-fabric/services/launch_gate_service.py`
- `src/pages/admin/ops/OpsLaunchGate.jsx`
- `src/pages/admin/ops/OpsScreenshotQA.jsx`
- `docs/operator-runbook/SHS_OPERATOR_RUNBOOK_PHASE_5_QA_DELIVERY.md`

Estimate: 10 hours.

Difficulty: Medium.

Private beta required: Yes.

Paid launch required: Yes.

Definition of Done: Launch readiness shows QA status and prevents paid-launch-ready state unless QA evidence is complete or formally exception-approved.

### LG-05 Delivery Signoff

Current state: Delivery Ready exists as QA/ClientOps context, but delivery signoff is not a durable SHRV1 launch gate field.

Required future state: Require delivery signoff confirming client-facing content/assets, handoff guide, build packet, support tier, and open blocker disposition.

Files likely affected:

- `services/shf-agent-fabric/services/launch_gate_service.py`
- `src/pages/admin/ops/OpsLaunchGate.jsx`
- `docs/operator-runbook/SHS_OPERATOR_RUNBOOK_PHASE_5_QA_DELIVERY.md`
- `docs/operator-runbook/SHS_OPERATOR_RUNBOOK_PHASE_6_LAUNCH.md`

Estimate: 8 hours.

Difficulty: Low.

Private beta required: No.

Paid launch required: Yes.

Definition of Done: Delivery signoff fields are required before paid-launch-ready status and show complete, blocked, or exception-approved state.

### LG-06 Client Signoff

Current state: Client signoff is required by Phase 6 runbook but currently operator-recorded and not hard-enforced.

Required future state: Require client signoff status, signer, date, approved exceptions, and client-facing notes before paid launch readiness.

Files likely affected:

- `services/shf-agent-fabric/services/launch_gate_service.py`
- `src/pages/admin/ops/OpsLaunchGate.jsx`
- `docs/operator-runbook/SHS_OPERATOR_RUNBOOK_PHASE_6_LAUNCH.md`

Estimate: 8 hours.

Difficulty: Low.

Private beta required: No.

Paid launch required: Yes.

Definition of Done: Paid-launch-ready state is blocked unless client signoff is signed off or signed off with explicitly approved exceptions.

### LG-07 Rollback Requirement

Current state: Rollback requirements are documented in the launch audit, but no rollback owner, trigger, last-known-good version, communication plan, or recovery note is required at runtime.

Required future state: Make rollback plan required for launch readiness, including rollback owner, trigger conditions, last known good version, affected routes/modules, preservation note, client communication note, support escalation path, and post-rollback review owner.

Files likely affected:

- `services/shf-agent-fabric/services/launch_gate_service.py`
- `src/pages/admin/ops/OpsLaunchGate.jsx`
- `docs/operator-runbook/SHS_OPERATOR_RUNBOOK_PHASE_6_LAUNCH.md`

Estimate: 8 hours.

Difficulty: Low.

Private beta required: Yes.

Paid launch required: Yes.

Definition of Done: Launch record cannot be marked launch-ready unless rollback plan fields are present or the launch is explicitly marked rehearsal-only.

### LG-08 ClientOps Activation Gate

Current state: SHF-Next ClientOps conversion is near-ready and validates QA readiness, but activation remains local/internal and is not represented as durable SHRV1 launch-gate evidence.

Required future state: Add ClientOps activation state to launch records, including ClientOps record ID, owner, support tier, launch date, version baseline, maintenance/watch transfer, reports/routes/modules, and activation timestamp.

Files likely affected:

- `services/shf-agent-fabric/services/launch_gate_service.py`
- `services/shf-agent-fabric/routers/launch_gate_routes.py`
- `src/pages/admin/ops/OpsLaunchGate.jsx`
- `src/system/routes/crossAppRouteBridge.js`
- `/Users/mikeslate/shf-next/src/pages/ops/ClientOpsCenter.tsx`
- `/Users/mikeslate/shf-next/src/data/clientOpsData.ts`

Estimate: 14 hours.

Difficulty: Medium.

Private beta required: No.

Paid launch required: Yes.

Definition of Done: Launch Gate records whether ClientOps is active, links to the internal ClientOps surface, and blocks paid launch until activation evidence is present.

### LG-09 Support Owner Required

Current state: Support tier is present in runbooks and SHF-Next QA/ClientOps context, but support owner is not clearly hard-required in the current data model.

Required future state: Require support owner or ClientOps owner before ClientOps Active and paid launch readiness.

Files likely affected:

- `services/shf-agent-fabric/services/launch_gate_service.py`
- `src/pages/admin/ops/OpsLaunchGate.jsx`
- `/Users/mikeslate/shf-next/src/data/clientOpsData.ts`
- `/Users/mikeslate/shf-next/src/pages/ops/ClientOpsCenter.tsx`

Estimate: 6 hours.

Difficulty: Low.

Private beta required: No.

Paid launch required: Yes.

Definition of Done: Launch and ClientOps activation records expose support owner and reject paid-launch-ready status when owner is missing.

### LG-10 Launch Version Record

Current state: SHF-Next ClientOps creates a basic `v1-launch` version history entry. The launch audit requires richer launch version metadata and approval/signoff references.

Required future state: Require launch version record with version ID, launch date, project/client IDs, package, active modules, routes, reports, known exceptions, support tier, launch owner, rollback note, and approval reference.

Files likely affected:

- `services/shf-agent-fabric/services/launch_gate_service.py`
- `src/pages/admin/ops/OpsLaunchGate.jsx`
- `/Users/mikeslate/shf-next/src/data/clientOpsData.ts`
- `/Users/mikeslate/shf-next/src/pages/ops/ClientOpsCenter.tsx`

Estimate: 10 hours.

Difficulty: Medium.

Private beta required: Yes.

Paid launch required: Yes.

Definition of Done: Every launch record includes a complete version baseline and the UI clearly displays missing version fields before launch readiness.

### LG-11 Paid Launch Readiness Gate

Current state: Private-beta go/no-go is documented, but no single runtime status computes paid launch readiness from approvals, rollback, ClientOps activation, Truth/Reports readiness, and persistence/auth assumptions.

Required future state: Add deterministic readiness calculation that separates rehearsal-ready, private-beta-ready, and paid-launch-ready states and blocks paid launch when required evidence, auth, persistence, public approval, report readiness, or ClientOps activation is incomplete.

Files likely affected:

- `services/shf-agent-fabric/services/launch_gate_service.py`
- `services/shf-agent-fabric/routers/launch_gate_routes.py`
- `services/shf-agent-fabric/tests/test_launch_gate_routes.py`
- `src/pages/admin/ops/OpsLaunchGate.jsx`
- `services/shf-agent-fabric/routers/reports_routes.py`
- `services/shf-agent-fabric/routers/watchtower_routes.py`

Estimate: 16 hours.

Difficulty: Medium.

Private beta required: No.

Paid launch required: Yes.

Definition of Done: Paid launch readiness is computed from required fields, exposes exact blockers, appears in Reports/Watchtower context if safe, and is covered by tests.

## Private Beta Required Items

- LG-01 Durable launch/signoff/version ledger.
- LG-02 SHRV1 Launch Gate route/model.
- LG-03 Operator signoff.
- LG-04 QA signoff.
- LG-07 Rollback requirement.
- LG-10 Launch version record.

Private beta can continue as supervised rehearsal before these are implemented, but unsupervised private beta should wait for these items.

## Paid Launch Required Items

All listed hardening items are paid-launch required:

- LG-01 Durable launch/signoff/version ledger.
- LG-02 SHRV1 Launch Gate route/model.
- LG-03 Operator signoff.
- LG-04 QA signoff.
- LG-05 Delivery signoff.
- LG-06 Client signoff.
- LG-07 Rollback requirement.
- LG-08 ClientOps activation gate.
- LG-09 Support owner required.
- LG-10 Launch version record.
- LG-11 Paid launch readiness gate.

Additional paid-launch blockers outside this plan:

- Production auth/session hardening.
- Durable production persistence decision.
- Final report delivery policy.
- Public/private leakage automation.

## Go / No-Go

Private beta: **GO for supervised launch rehearsal.** Harden before unsupervised private beta.

Paid launch: **NO-GO** until all paid-launch-required hardening items are complete and production auth/session plus durable persistence assumptions are resolved.

## Validation Results

| Command | Result |
| --- | --- |
| `python3 -m json.tool docs/private-beta/SHS_LAUNCH_GATE_HARDENING_PLAN_V1.json` | PASS |
| `npm run check:governance` | PASS |

## Final Statement

This plan does not implement the Launch Gate. It converts the audit findings into a sequenced hardening plan so later implementation can proceed without inventing new architecture or bypassing Truth Spine, Reports, ClientOps, Watchtower, or existing SHS private-beta constraints.
