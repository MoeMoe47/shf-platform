# Post-V1 Hardening Plan V1

## Executive Summary

The Final Master Layer Registry V1 Completion Re-Audit confirms SHS governance V1 is complete:

- V1 governance-complete: yes
- Required layers: 57
- V1 blockers remaining: 0
- Focused governance tests: 168 passed
- Build: pass with the existing Vite large-chunk warning

The remaining work is post-V1 hardening, not V1 layer formalization. The next work should make the system safer to operate for paid launch, public launch, and production scale without changing V1 governance authority or bypassing Truth Spine, Public Approval, Security/Privacy, Data Ownership/IP, Watchtower, Reports, or the SHS to SHF boundary.

## What Post-V1 Hardening Means

Post-V1 hardening means strengthening durability, security, release discipline, test coverage, deployment readiness, and operational controls around an already complete governance foundation.

It does not mean:

- Creating new layers.
- Enabling external sends.
- Writing warehouse records.
- Mutating SHF Impact Data Spine.
- Publishing public data.
- Bypassing human approval.
- Replacing deterministic V1 review gates with production behavior.

## Hardening Categories

### A. Production Persistence Hardening

Several V1 layers are deterministic or scaffold-only by design. API Gateway, Event/Webhook, Batch/Import, Warehouse Sync, Production Automation, and Notification / Alert must remain read-only or review-only until owner-approved architecture proposals allow real delivery, persistence, or write behavior.

Operational workflows that may later need durable persistence include Launch Workflow, ClientOps records, Production Ops records, QA signoffs, release records, audit evidence, Data Approval Gateway decisions, and paid-launch ledgers.

### B. Auth / RBAC / Permission Hardening

Admin route guards, hub access control, permission guards, and cross-app route metadata are present. Paid launch should still require explicit environment-specific guidance for `ADMIN_API_KEY`, route exposure review, role/permission evidence, and public/internal route separation across SHRV1 and SHF-Next.

### C. Runtime Audit / Log Hardening

Validation and smoke checks currently append runtime rows to `services/shf-agent-fabric/var/watchtower_audit.jsonl`. Before paid launch, runtime logs need a no-surprises policy: gitignore or redirect, retention, rotation, replay linkage, and signed audit manifests.

### D. Public Approval / Publishing Hardening

Data Approval Gateway, Public Approval, Security/Privacy, Data Ownership/IP, and SHF Impact Data Spine boundaries are clear. Paid/public launch should add human approval checklists, mutation guards, and regression tests proving private SHS data never appears on public SHF surfaces.

### E. API / External Integration Hardening

API Gateway, Event/Webhook, Adapter Layer, Production Automation, and Notification / Alert are all V1-safe because they do not forward, send, write, or call external systems. Before external sends or connectors are enabled, signed delivery designs must exist for webhooks, notifications, partner feeds, retries, secrets, rate limits, audit trails, and rollback.

### F. Data Pipeline Hardening

Batch/Import, Source Registry, Data Federation, Data Aggregator, Data Normalization, Evidence Package, Data Verification, Data Approval, Public Approval, and Warehouse Sync are formalized. Post-V1 work should add end-to-end fixture coverage and connector approval packets.

### G. SHS To SHF Operational Boundary Hardening

SHS Spine is the private operational source. SHF Spine is the governed public impact spine. ClientOps, Production Ops, Sales, Website Studio, QA, support, and maintenance records must stay private unless they pass source/evidence/verification/privacy/ownership/readiness/public approval and Data Approval Gateway controls.

### H. Build / Performance Hardening

`npm run build` passes, but Vite reports existing large-chunk warnings. The heaviest candidates are mapbox/maplibre vendors, admin bundles, foundation/exchange surfaces, and report/map workflows. This is not a V1 blocker, but it should be planned before scale.

### I. Test Coverage Hardening

Focused pytest coverage is strong. Missing hardening coverage includes durable browser E2E smoke, SHF-Next cross-app route separation tests, Reports/Watchtower visibility regression tests, public/private leakage regression tests, and full API contract inventory.

### J. Deployment / Environment Hardening

Paid launch needs centralized staging/production guidance for env vars, secrets, base URLs, CORS/proxy/API Gateway, logging destinations, rollback, release signoff, and no-runtime-dirtiness release checks.

## Hardening Matrix

| ID | Area | Classification | Risk | Blocking Paid | Blocking Public | Action |
| --- | --- | --- | --- | --- | --- | --- |
| PV1-001 | Runtime audit/logs | MUST_BEFORE_PAID_LAUNCH | High | Yes | Yes | Clean or ignore runtime `watchtower_audit.jsonl` safely. |
| PV1-002 | Runtime audit/logs | MUST_BEFORE_PAID_LAUNCH | High | Yes | Yes | Add production-safe audit retention policy. |
| PV1-003 | Runtime audit/logs | SHOULD_BEFORE_PUBLIC_LAUNCH | Medium | No | Yes | Add signed audit manifests. |
| PV1-004 | Auth/RBAC | MUST_BEFORE_PAID_LAUNCH | Critical | Yes | Yes | Add environment-specific `ADMIN_API_KEY` guidance. |
| PV1-005 | Auth/RBAC | MUST_BEFORE_PAID_LAUNCH | High | Yes | Yes | Add route exposure review for admin/internal/public routes. |
| PV1-006 | Auth/RBAC | MUST_BEFORE_PAID_LAUNCH | Medium | Yes | Yes | Add staging/production base URL guidance for cross-app route bridge. |
| PV1-007 | Public approval | MUST_BEFORE_PAID_LAUNCH | Critical | Yes | Yes | Add public publishing human approval checklist. |
| PV1-008 | Public approval | MUST_BEFORE_PAID_LAUNCH | Critical | Yes | Yes | Require Security/Privacy and Data Ownership/IP before public approval. |
| PV1-009 | Public approval | SHOULD_BEFORE_PUBLIC_LAUNCH | High | No | Yes | Add public-approved mutation test guard for `shfImpactData`. |
| PV1-010 | SHS to SHF boundary | SHOULD_BEFORE_PUBLIC_LAUNCH | Critical | No | Yes | Add SHS private data never public regression test. |
| PV1-011 | External integration | SHOULD_BEFORE_PUBLIC_LAUNCH | High | No | Yes | Add webhook delivery design before enabling external sends. |
| PV1-012 | External integration | SHOULD_BEFORE_PUBLIC_LAUNCH | High | No | Yes | Add notification delivery design before enabling external sends. |
| PV1-013 | Data pipeline | SHOULD_BEFORE_PUBLIC_LAUNCH | High | No | Yes | Add warehouse sync design before enabling writes. |
| PV1-014 | Data pipeline | SHOULD_BEFORE_PUBLIC_LAUNCH | Medium | No | Yes | Add adapter connector approval process. |
| PV1-015 | Persistence | MUST_BEFORE_PAID_LAUNCH | Critical | Yes | Yes | Add production persistence decision record. |
| PV1-016 | Persistence | MUST_BEFORE_PAID_LAUNCH | High | Yes | Yes | Keep deterministic V1 review layers read-only until approved. |
| PV1-017 | Test coverage | MUST_BEFORE_PAID_LAUNCH | High | Yes | Yes | Add E2E smoke tests for admin surfaces. |
| PV1-018 | Test coverage | SHOULD_BEFORE_PUBLIC_LAUNCH | High | No | Yes | Add E2E smoke tests for SHF-Next public/internal route separation. |
| PV1-019 | Test coverage | POST_LAUNCH_HARDENING | Medium | No | No | Add API contract tests for all V1 layer endpoints. |
| PV1-020 | Test coverage | MUST_BEFORE_PAID_LAUNCH | Medium | Yes | Yes | Add Reports/Watchtower visibility regression tests. |
| PV1-021 | Build/performance | POST_LAUNCH_HARDENING | Medium | No | No | Add Vite chunk/code-splitting plan. |
| PV1-022 | Deployment | MUST_BEFORE_PAID_LAUNCH | Critical | Yes | Yes | Add backup/rollback strategy. |
| PV1-023 | Deployment | MUST_BEFORE_PAID_LAUNCH | High | Yes | Yes | Add release checklist. |
| PV1-024 | Deployment | MUST_BEFORE_PAID_LAUNCH | High | Yes | Yes | Add staging vs production environment guidance. |
| PV1-025 | Data pipeline | POST_LAUNCH_HARDENING | Medium | No | No | Harden data pipeline fixture coverage. |
| PV1-026 | Auth/RBAC | OPTIONAL_POLISH | Low | No | No | Polish role/permission check packaging. |
| PV1-027 | External integration | POST_LAUNCH_HARDENING | Medium | No | No | Add partner feed intake approval packet. |
| PV1-028 | Build/performance | OPTIONAL_POLISH | Low | No | No | Document admin bundle optimization candidates. |

## Phase 1: Paid-Launch Blockers

Count: 14.

- PV1-001: Clean or ignore runtime `watchtower_audit.jsonl` safely.
- PV1-002: Add production-safe audit retention policy.
- PV1-004: Add environment-specific `ADMIN_API_KEY` guidance.
- PV1-005: Add route exposure review for admin/internal/public routes.
- PV1-006: Add staging/production base URL guidance for cross-app route bridge.
- PV1-007: Add public publishing human approval checklist.
- PV1-008: Require Security/Privacy and Data Ownership/IP before public approval.
- PV1-015: Add production persistence decision record.
- PV1-016: Keep deterministic V1 review layers read-only until approved.
- PV1-017: Add E2E smoke tests for admin surfaces.
- PV1-020: Add Reports/Watchtower visibility regression tests.
- PV1-022: Add backup/rollback strategy.
- PV1-023: Add release checklist.
- PV1-024: Add staging vs production environment guidance.

## Phase 2: Public-Launch Blockers

Count: 8.

- PV1-003: Add signed audit manifests.
- PV1-009: Add public-approved mutation test guard for `shfImpactData`.
- PV1-010: Add SHS private data never public regression test.
- PV1-011: Add webhook delivery design before enabling external sends.
- PV1-012: Add notification delivery design before enabling external sends.
- PV1-013: Add warehouse sync design before enabling writes.
- PV1-014: Add adapter connector approval process.
- PV1-018: Add E2E smoke tests for SHF-Next public/internal route separation.

## Phase 3: Production Scale Hardening

Count: 4.

- PV1-019: Add API contract tests for all V1 layer endpoints.
- PV1-021: Add Vite chunk/code-splitting plan.
- PV1-025: Harden data pipeline fixture coverage.
- PV1-027: Add partner feed intake approval packet.

## Phase 4: Polish And Optimization

Count: 2.

- PV1-026: Polish role/permission check packaging.
- PV1-028: Document admin bundle optimization candidates.

## Validation Results

Validation completed for this plan-only audit:

- `python3 -m json.tool docs/POST_V1_HARDENING_PLAN_V1.json`: PASS
- `npm run check:governance`: PASS
- `python3 scripts/check_master_layer_registry.py`: PASS, 57 official registry rows/layers checked
- `python3 scripts/check_truth_spine_freeze.py`: PASS
- `python3 scripts/check_duplicate_layer_cleanup.py`: PASS, 3 high-risk duplicates archived and 3 official replacements present
- `npm run build`: PASS with the existing Vite large-chunk warning

Optional broad route pytest was not run because this task only created hardening-plan documentation:

- `python3 -m pytest services/shf-agent-fabric/tests/test_*routes.py`

## Git Safety

This is a planning/audit task only. It should change only:

- `docs/POST_V1_HARDENING_PLAN_V1.md`
- `docs/POST_V1_HARDENING_PLAN_V1.json`

No source, router, service, package, auth, database, endpoint, runtime behavior, archive, staging, or commit action is part of this plan.

## Recommended Next Action

Start Phase 1 with runtime audit/log hygiene and paid-launch release checklist packaging, then document production persistence and environment/`ADMIN_API_KEY` decisions before enabling any paid launch behavior.

## Complete

Complete: yes. Post-V1 Hardening Plan V1 is complete as a governance-safe planning document. It does not implement runtime changes or add new architecture.
