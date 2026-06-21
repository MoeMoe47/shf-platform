# Phase 1 Paid-Launch Hardening V1

## Executive Summary

Phase 1 starts paid-launch hardening now that the Final Master Layer Registry V1 Completion Re-Audit confirms SHS governance V1 is complete.

This pass is a hardening plan and safe implementation audit. It does not create new layers, change auth behavior, enable production persistence, enable external sends, mutate SHF Impact Data Spine, mark anything public-approved, or change runtime behavior.

Phase 1 addresses the highest-priority paid-launch blockers from the Post-V1 Hardening Plan:

- Runtime audit/log hygiene.
- Paid-launch release checklist.
- Production persistence decision record.
- Environment and `ADMIN_API_KEY` guidance.
- Daily governance audit plan.
- Public-safe release guardrails.
- Route exposure and identity hardening checklist.
- Test hardening checklist.

## V1 Governance-Complete Status

Current governance status:

- V1 governance-complete: yes.
- Required layers: 57.
- V1 blockers remaining: 0.
- Focused governance tests from final re-audit: 168 passed.
- Current `npm run check:governance`: pending this report's validation section.
- Current build: pending this report's validation section.

This means Phase 1 is not about finishing the governance foundation. It is about making the complete V1 foundation safer to operate for paid-launch review.

## Phase 1 Scope

In scope:

- Documentation and audit-only decisions.
- Runtime dirty-file risk assessment.
- Release checklist creation.
- Persistence decision record.
- Environment and secret-handling guidance.
- Daily governance audit plan.
- Public/private release guardrail review.
- Route and identity checklist.
- Test hardening checklist.

Out of scope:

- New architecture layers.
- Production database persistence.
- Auth/RBAC behavior changes.
- Backend route permission changes.
- External webhooks or notifications.
- Warehouse writes.
- SHF Impact Data Spine mutation.
- Public approval mutation.
- Runtime log deletion or rewrite.
- Git commit.

## Runtime Audit/Log Hygiene

Runtime files inspected:

| Path | Status | Paid-Launch Risk |
| --- | --- | --- |
| `services/shf-agent-fabric/var/watchtower_audit.jsonl` | Tracked by git; clean at initial inspection | Validation and API smoke can append rows and dirty the release working tree. |
| `services/shf-agent-fabric/var/watchtower_store.sqlite` | Present runtime store; not listed as tracked in this audit | Should remain out of release commits unless explicitly approved. |
| `services/shf-agent-fabric/logs/*.log` | Covered by existing `.gitignore` patterns such as `*.log`, `logs/`, and `**/logs/` | Should remain local runtime output. |
| `services/shf-agent-fabric/db/*` | Local DB/data directory exists; broad `db/` ignore exists, but prior tracked files may remain from history | Must not be interpreted as production persistence. |
| `dist/` | Ignored build output | Must not be staged for release. |

Decision for this pass:

- Do not delete runtime files.
- Do not rewrite runtime logs.
- Do not change `.gitignore` in this pass.
- Treat `watchtower_audit.jsonl` as a paid-launch cleanup decision because it is tracked and runtime-generated.

Recommendations before paid launch:

- Decide whether `watchtower_audit.jsonl` is a committed sample fixture, a generated runtime file, or an externally archived audit artifact.
- If it is runtime-only, preserve any needed sample as `watchtower_audit.sample.jsonl` or equivalent, then move future writes to an ignored runtime path or add a narrow ignore rule with owner approval.
- Add a release check: `git status --short services/shf-agent-fabric/var services/shf-agent-fabric/logs services/shf-agent-fabric/db`.
- Validation should not silently dirty tracked runtime files.

Safe cleanup command to document, not execute here:

```bash
git status --short services/shf-agent-fabric/var services/shf-agent-fabric/logs services/shf-agent-fabric/db
```

If owner later approves resetting a runtime file after validation, use an explicit path-scoped command and record why. Do not use broad reset/restore commands.

## Paid-Launch Release Checklist

Before paid launch, complete this checklist:

- `npm run check:governance` passes.
- `npm run build` passes, with any Vite large-chunk warning documented.
- Focused pytest passes for Truth Spine, Oracle, AI Guardrails, Game Theory, SHS Launch Ledger, and any newly touched route layer.
- Route smoke passes for admin, ops, reports, watchtower, and SHF-Next public/internal split routes.
- Reports and Watchtower show governance visibility for touched layers.
- SHS to SHF boundary is verified: no SHS private operational data enters public SHF surfaces.
- Public-approved mutation guard is verified: no layer directly mutates `shfImpactData` or labels records public-approved outside the gateway/human review process.
- Private SHS data exposure guard is verified.
- `ADMIN_API_KEY` exists only in environment/secret handling, never in repo, docs, route URLs, logs, or public bundles.
- Staging and production base URLs are configured outside source.
- Rollback plan exists.
- Release notes include governance checks, changed routes, affected layers, known warnings, and runtime dirty-file status.
- No archive removals, runtime logs, local DBs, `dist/`, cache files, or temporary artifacts are staged accidentally.
- Owner approval for paid launch is recorded before any paid client launch.

## Production Persistence Decision Record

The following layers remain deterministic, scaffold-only, review-only, or no-write in V1. They need owner-approved persistence design before production writes, delivery, sends, or durable records:

| Layer | V1 Decision | Future Persistence Need |
| --- | --- | --- |
| Source Registry | Review-only until approved design | Durable source ownership, provenance, eligibility, source audit records. |
| Data Federation | Review-only until approved design | Durable federation groups, source conflicts, lineage, partner trust state. |
| Data Aggregator | Review-only until approved design | Durable intake batches, aggregation traces, blocked/draft intake records. |
| Data Normalization | Scaffold-only until approved design | Durable normalized payload versions, aliases, schema mappings, provenance. |
| Evidence Package | Review-only until approved design | Durable evidence bundles, package hashes, review packets. |
| Data Verification | Review-only until approved design | Durable readiness decisions, blockers, warnings, and history. |
| Data Approval | Review-only until approved design | Durable approval-readiness packets tied to human gateway decisions. |
| Public Approval | Review-only; cannot mark records public-approved in V1 | Durable release decisions with owner, privacy, IP, readiness, and rollback evidence. |
| Warehouse Sync | No production warehouse writes in V1 | Destination contracts, retries, audit, rollback, and sync ownership. |
| Event/Webhook | No external webhook sends in V1 | Delivery design, signing, retries, rate limits, dead-letter handling, audit. |
| Notification/Alert | No external email/SMS/message sends in V1 | Channel approval, consent, templates, provider secrets, retries, opt-out. |
| Production Automation | No production automation execution in V1 | Operator approval, dry-run, rollback, audit, identity-bound execution. |

This record prevents local JSON, sqlite, jsonl, or deterministic service output from being treated as production persistence.

## Environment / ADMIN_API_KEY Guidance

Local dev:

- Use ignored local `.env` files only.
- Never commit `.env`, `.env.*`, raw tokens, or copied terminal output containing secrets.
- Do not place `ADMIN_API_KEY` in URL query strings or route bridge values.

Staging:

- Use environment-managed secrets or secret manager injection.
- Configure SHRV1 and SHF-Next base URLs through environment variables such as `VITE_SHRV1_BASE_URL` and `VITE_SHF_NEXT_BASE_URL`.
- Confirm CORS/proxy/API Gateway policy before external exposure.
- Rotate any shared or demo key before staging is used for paid-client review.

Production:

- Use managed secrets only.
- No raw key values in repo, docs, screenshots, logs, route URLs, client bundles, reports, or command snippets.
- Rotate `ADMIN_API_KEY` before paid launch if it has appeared in local logs, shared terminals, screenshots, or issue text.
- Backend admin/API routes must have explicit protection and deployment review before public network exposure.

Cross-app route guidance:

- Cross-App Route Bridge should contain base URLs and paths only.
- Route bridge metadata must not carry secrets, tokens, roles, permissions, or authorization headers.
- SHRV1 admin/governance routes remain internal/admin.
- SHF-Next public routes remain public only where classified as public.
- SHF-Next internal ops and foundation-admin surfaces remain internally noticed or gated where applicable.

## Daily Governance Audit Plan

Daily audit is documented but not scheduled in this task.

Recommended daily commands/checks:

- `npm run check:governance`
- `npm run build`
- `python3 scripts/check_master_layer_registry.py`
- `python3 scripts/check_truth_spine_freeze.py`
- `python3 scripts/check_duplicate_layer_cleanup.py`
- Route/admin smoke check.
- Reports/Watchtower visibility check.
- SHS to SHF boundary check.
- Runtime dirty-file check.
- Public-approved mutation guard.
- SHS private data exposure guard.

Daily report naming:

- `docs/DAILY_GOVERNANCE_AUDIT_YYYY_MM_DD.md`
- `docs/DAILY_GOVERNANCE_AUDIT_YYYY_MM_DD.json`

Optional future command shape:

```bash
npm run check:governance && npm run build && git status --short
```

Do not create a scheduler until owner approves automation scope, output location, runtime side effects, and reporting cadence.

## Public-Safe Release Guardrails

Paid-launch guardrails:

- Truth Spine remains the only authority for verification, report readiness, trust packages, and public approval preconditions.
- Public Approval and Data Approval Gateway remain the only correct public release path.
- No layer may directly mutate `shfImpactData`.
- No layer may mark records `public_approved` outside the approved gateway/human review path.
- SHS private operational data remains blocked from SHF public surfaces unless governed, de-identified or aggregated where needed, verified, privacy-reviewed, ownership-reviewed, readiness-approved, public-approved, and gateway-approved.
- Security/Privacy and Data Ownership/IP are required before public release.
- Reports and Watchtower may expose readiness and risk metadata, but they must not convert draft/unverified data into public facts.
- AI, Oracle, Game Theory, LOO, automation, webhook, notification, and warehouse layers must not publish or approve public data.

Evidence observed:

- `src/data/shfImpactData.js` states private SHS client data must never appear in SHF public map/report outputs.
- `src/system/spines/shsSpine.js` blocks SHS private operational categories from SHF transfer unless public-approved and gateway-approved.
- Reports and Watchtower route summaries include public approval and no-publish/no-mutate boundary notes for V1 layers.

## Route Exposure / Identity Checklist

Paid-launch route and identity checklist:

- Review SHRV1 admin routes in `src/router/AdminRoutes.jsx` and `src/components/admin/AdminSidebar.jsx`.
- Confirm `/ops/*` Production Ops routes remain `shs_admin` only in `src/system/identity/hubAccessControl.js`.
- Confirm public SHS/WebMaker routes do not inherit admin-only shells or leak internal metadata.
- Confirm SHF-Next `/studio/templates` and `/studio/templates/browse` remain public browsing routes only.
- Confirm SHF-Next `/ops/*` and `/foundation/data-approval` remain internally noticed or gated where applicable.
- Confirm Cross-App Identity Bridge route classifications match current public/internal decisions.
- Confirm Cross-App Route Bridge uses safe base URLs and blocks secrets in route URLs.
- Confirm backend admin/API routes requiring `ADMIN_API_KEY` have staging/production protection documented before external exposure.
- Confirm route smoke evidence has no blank fallbacks and no public/private leakage findings before paid launch.

Evidence observed:

- `hubAccessControl.js` keeps `/ops/production`, `/ops/projects`, `/ops/build-packet`, `/ops/screenshot-qa`, `/ops/launch-workflow`, and related ops routes `shs_admin` only.
- `crossAppRouteBridge.js` classifies SHRV1 governance/admin routes separately from SHF-Next public and internal-notice routes.
- `crossAppRouteBridge.js` uses forbidden URL patterns to avoid secrets/tokens in route bridge URLs.

## Test Hardening Checklist

Paid-launch test hardening should include:

- Focused pytest bundle for Truth Spine, Oracle, AI Guardrails, Game Theory, and SHS Launch Ledger.
- Focused pytest bundle for all newly touched Agent Fabric route layers.
- Browser smoke for admin command surfaces, Production Ops, ClientOps, Reports, Watchtower, and Launch Workflow.
- Route smoke for SHRV1 admin routes and SHF-Next public/internal split routes.
- Reports/Watchtower visibility regression covering truth metadata, public approval context, and layer readiness summaries.
- `shfImpactData` public-approved guard regression test.
- SHS private data exposure guard regression test.
- API endpoint contract inventory for all V1 route families.
- Runtime dirty-file regression check after validations.
- Build artifact and bundle warning review before release signoff.

## Validation Results

Validation completed:

- `python3 -m json.tool docs/PHASE1_PAID_LAUNCH_HARDENING_V1.json`: PASS
- `npm run check:governance`: PASS
- `python3 scripts/check_master_layer_registry.py`: PASS, 57 official registry rows/layers checked
- `python3 scripts/check_truth_spine_freeze.py`: PASS
- `python3 scripts/check_duplicate_layer_cleanup.py`: PASS, 3 high-risk duplicates archived and 3 official replacements present
- `npm run build`: PASS with the existing Vite large-chunk warning

Optional broad route pytest was not run in this docs-only hardening pass:

- `python3 -m pytest services/shf-agent-fabric/tests/test_*routes.py`

## Git Safety

This task should change only:

- `docs/PHASE1_PAID_LAUNCH_HARDENING_V1.md`
- `docs/PHASE1_PAID_LAUNCH_HARDENING_V1.json`

This task does not include:

- Git commit.
- Git staging.
- Runtime log deletion.
- Runtime log reset.
- Source behavior changes.
- Package changes.
- Service/router changes.
- External archive changes.

## Remaining Risks

- `services/shf-agent-fabric/var/watchtower_audit.jsonl` is tracked and can be dirtied by validation or API smoke.
- Paid launch still needs owner-approved production persistence decisions for operational records and governance evidence.
- `ADMIN_API_KEY` handling is documented here but not enforced by a new production secret-management implementation.
- Daily governance audit is documented but not scheduled.
- Broad route/browser smoke and full API contract coverage remain hardening work, not implemented in this docs-only pass.
- Vite large-chunk warning remains a known non-blocking build/performance warning.

## Phase 1 Complete

Phase 1 complete: yes.

This report completes the Phase 1 paid-launch hardening plan and safe implementation audit. It does not implement risky production behavior changes.
