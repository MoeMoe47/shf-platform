# Paid-Launch Release Checklist V1

## Executive Summary

Paid-Launch Release Checklist V1 packages the recurring SHS/SHF release gate into one reusable checklist for paid releases, client demos, funder demos, partner demos, internal deployments, and production-adjacent launches.

This is a docs/checklist package plus one safe script runner. It does not change runtime behavior, auth, routes, services, routers, persistence, webhooks, notifications, SHF Impact Data Spine, public approval, or external archives.

## When To Use This Checklist

Use this checklist before:

- Paid client release.
- Client demo.
- Funder demo.
- Partner demo.
- Internal deployment.
- Production-adjacent launch.
- Any release that could expose public/private boundaries, governance status, SHS operational data, SHF public impact data, or admin/internal surfaces.

## Required Paid-Launch Checks

Governance:

- `npm run check:governance`
- `python3 scripts/check_master_layer_registry.py`
- `python3 scripts/check_truth_spine_freeze.py`
- `python3 scripts/check_duplicate_layer_cleanup.py`
- `python3 scripts/check_runtime_log_hygiene.py --strict`

Build:

- `npm run build`
- Confirm the existing Vite large-chunk warning is unchanged and documented as non-blocking.

Runtime log hygiene:

- Run `python3 scripts/check_runtime_log_hygiene.py`.
- Run `python3 scripts/check_runtime_log_hygiene.py --strict`.
- If known tracked runtime audit dirt exists, run `bash scripts/clean_runtime_audit_logs.sh`.
- Confirm `git status --short` contains only intended release docs/code.

Tests:

- Run focused pytest route bundle for touched Agent Fabric layers.
- Run layer endpoint tests for any changed backend route family.
- Confirm Reports/Watchtower visibility for touched layers.
- Confirm public-approved mutation guard.
- Confirm SHS private data exposure guard.

Routes and identity:

- Confirm admin routes are protected.
- Confirm public routes do not show internal notices.
- Confirm internal SHS routes stay internal.
- Confirm SHF-Next public/internal separation is preserved when SHF-Next is in scope.
- Confirm Cross-App Identity Bridge decisions are respected.
- Confirm Cross-App Route Bridge decisions are respected.

Data boundaries:

- Confirm SHS Spine feeds SHF only through governance.
- Confirm SHS private/client data does not enter SHF public surfaces.
- Confirm SHF Impact Data Spine uses public-approved filtering.
- Confirm `public_approved` is not mutated by unauthorized layers.
- Confirm Data Approval Gateway remains required.

Public-safe release:

- Confirm Security / Privacy is clear before public release.
- Confirm Data Ownership / IP is clear before public release.
- Confirm Public Approval remains candidate/review-only unless explicitly approved.
- Confirm scaffold layers do not directly publish public data.
- Confirm non-report layers do not directly publish reports.

Environment:

- Confirm `ADMIN_API_KEY` exists in environment/secret handling, not repo.
- Confirm local/staging/production environment separation.
- Confirm SHRV1 and SHF-Next base URLs are configured outside source.
- Confirm no secrets in git diff.
- Confirm no raw keys in docs.

External delivery:

- Confirm Event/Webhook does not send external webhooks in V1.
- Confirm Notification/Alert does not send notifications in V1.
- Confirm Production Automation does not execute automation in V1.
- Confirm Warehouse Sync does not write warehouse records in V1.

Release packaging:

- `git status --short`
- `git diff --name-status`
- `git diff --stat`
- `git log --oneline -10`
- Prepare release note summary.
- Prepare rollback note.
- Record owner approval checkbox before release.

## Optional Deeper Checks

- `python3 -m pytest services/shf-agent-fabric/tests/test_*routes.py`
- Browser smoke for admin routes, Production Ops, ClientOps, Reports, Watchtower, Launch Workflow, and public SHF surfaces.
- SHF-Next `npm run build` when SHF-Next routes or bridge decisions are in scope.
- SHF-Next `npm run lint` if available and SHF-Next is in scope.
- Secrets scan over staged diff and docs.
- Manual review of generated release notes with owner.
- Route smoke evidence refresh.
- Public/private leakage audit refresh.

The broad pytest route bundle is intentionally not in the default script because it can be expensive. It should be run when backend route behavior, layer endpoints, reports, or Watchtower visibility change.

## Blocking Conditions

A release is blocked if any of the following are true:

- `npm run check:governance` fails.
- Master Layer Registry check fails.
- Truth Spine freeze check fails.
- Duplicate cleanup check fails.
- Strict runtime log hygiene check fails and known tracked runtime dirt is not cleaned.
- `npm run build` fails.
- Unexpected new Vite/build warning appears and is not reviewed.
- Focused tests fail for touched route/layer work.
- Reports or Watchtower lose required visibility metadata.
- SHS private/client data appears on a public SHF surface.
- `public_approved` is mutated outside the approved gateway/human review path.
- Data Approval Gateway is bypassed for public data.
- Security / Privacy or Data Ownership / IP blocks public release.
- `ADMIN_API_KEY` or another secret appears in repo, docs, diff, logs, or public bundle.
- Admin/internal route becomes public.
- Public route shows internal notice or internal operational metadata.
- External webhook, notification, automation, or warehouse write is enabled in V1 without owner approval.
- Release lacks rollback note.
- Owner approval is missing.

## Known Non-Blocking Warnings

- Existing Vite large-chunk warning is non-blocking if unchanged and documented.
- Non-strict runtime hygiene inside `npm run check:governance` is informational; strict mode is the release gate.
- Optional broad pytest route bundle may be deferred when no backend route behavior changed, but focused touched-layer tests remain required.

## Route / Identity Checklist

- SHRV1 admin routes remain admin/internal.
- `/ops/*` remains internal SHS/admin workflow.
- Public SHS/WebMaker surfaces do not expose internal controls.
- SHF-Next public template and foundation routes remain public where classified public.
- SHF-Next `/ops/*` and `/foundation/data-approval` remain internal/noticed or gated where applicable.
- Cross-App Identity Bridge route classifications match current decisions.
- Cross-App Route Bridge contains no secrets, tokens, role payloads, or authorization data.
- Backend admin/API routes requiring `ADMIN_API_KEY` are not publicly exposed without deployment review.

## Data Boundary Checklist

- SHS Spine is private operational source context.
- SHF Spine is governed public impact context.
- SHS data crosses to SHF only through governance.
- SHS private/client data is blocked from public SHF surfaces.
- SHF Impact Data Spine uses public-approved filtering.
- Data Approval Gateway remains required before public use.
- Public reports use only verified/readiness-approved/public-approved data where applicable.

## Public-Safe Checklist

- Truth Spine verification is intact.
- Oracle remains decision support only.
- Public Approval remains the public release gate.
- Security / Privacy review is clear.
- Data Ownership / IP review is clear.
- Reports communicate verified/readiness-approved information only.
- Watchtower observes coverage and risk; it does not decide truth.
- AI, LOO, Game Theory, automation, Event/Webhook, Notification/Alert, and Warehouse Sync do not publish or approve public data.

## External Delivery Checklist

- Event/Webhook sends no external webhooks in V1.
- Notification/Alert sends no notifications in V1.
- Production Automation executes no automation in V1.
- Warehouse Sync writes no warehouse records in V1.
- Adapter and partner-feed work remains review/classification only unless owner-approved.

## Environment Checklist

- `ADMIN_API_KEY` is present only in environment/secret handling.
- No raw keys in docs, diffs, screenshots, logs, or public bundles.
- Local, staging, and production env values are separated.
- `VITE_SHRV1_BASE_URL` and `VITE_SHF_NEXT_BASE_URL` or deployment equivalents are configured outside source.
- CORS/proxy/API Gateway exposure is reviewed before external access.

## Release Packaging Checklist

Run:

```bash
git status --short
git diff --name-status
git diff --stat
git log --oneline -10
```

Prepare:

- Release type.
- Release scope.
- Changed files summary.
- Governance results summary.
- Build results summary.
- Runtime log hygiene result.
- Test results summary.
- Known non-blocking warnings.
- Rollback note.
- Owner approval line.

## Owner Approval Checklist

- [ ] Owner approved release type and scope.
- [ ] Owner approved any public-facing demo or paid client release.
- [ ] Owner approved rollback plan.
- [ ] Owner approved release note summary.
- [ ] Owner approved any public-approved data movement.
- [ ] Owner approved any runtime log de-tracking, sample/template conversion, or ignore rule change.
- [ ] Owner approved any production persistence, webhook, notification, automation, or warehouse-write enablement.

## Rollback Checklist

- Document the exact git commit or artifact being released.
- Document last known good commit or artifact.
- Document route or feature toggle rollback path where applicable.
- Document data rollback policy; do not mutate SHF Impact Data Spine without approved restore plan.
- Document runtime log cleanup state before and after release.
- Document owner responsible for rollback decision.
- Document client/funder/partner communication note if rollback affects a demo.

## Optional Script

Created:

```bash
bash scripts/run_paid_launch_checks.sh
```

The script runs safe checks only:

- `npm run check:governance`
- `python3 scripts/check_master_layer_registry.py`
- `python3 scripts/check_truth_spine_freeze.py`
- `python3 scripts/check_duplicate_layer_cleanup.py`
- `python3 scripts/check_runtime_log_hygiene.py --strict`
- `npm run build`
- `git status --short`

It does not commit, delete, start servers, enable external sends, or run broad pytest by default.

## Validation Results

Validation completed:

- `python3 -m json.tool docs/PAID_LAUNCH_RELEASE_CHECKLIST_V1.json`: PASS
- `npm run check:governance`: PASS, including non-strict runtime-log hygiene check
- `python3 scripts/check_master_layer_registry.py`: PASS, 57 official registry rows/layers checked
- `python3 scripts/check_truth_spine_freeze.py`: PASS
- `python3 scripts/check_duplicate_layer_cleanup.py`: PASS, 3 high-risk duplicates archived and 3 official replacements present
- `python3 scripts/check_runtime_log_hygiene.py`: PASS, checked 22 runtime paths and found 0 dirty tracked runtime files
- `npm run build`: PASS with the existing Vite large-chunk warning
- `bash scripts/run_paid_launch_checks.sh`: PASS; script completed safe checks and reported only the three new checklist artifacts in git status

## Files Changed

- `docs/PAID_LAUNCH_RELEASE_CHECKLIST_V1.md`
- `docs/PAID_LAUNCH_RELEASE_CHECKLIST_V1.json`
- `scripts/run_paid_launch_checks.sh`

## Complete

Complete: yes.
