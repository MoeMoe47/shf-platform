# Daily Governance Audit Template V1

## Executive Summary

Daily Governance Audit Template V1 defines the repeatable daily check for SHS/SHF after V1 governance completion. It packages the core governance, build, runtime hygiene, git safety, public/private boundary, public approval, security/privacy, ownership/IP, and route/identity checks into one operator-owned template.

This is a docs/template/checklist task with a safe optional runner scaffold. It does not create a scheduler, cron job, service, router, webhook, notification, persistence layer, public approval mutation, SHF Impact Data Spine mutation, or runtime behavior change.

## When To Run

Run this audit:

- At the start of each operating day.
- Before paid-launch review.
- Before client, funder, partner, or production-adjacent demos.
- After any governance, route, report, Watchtower, ClientOps, Production Ops, SHF Impact, or cross-app identity change.
- Before staging release packages.

## Who Owns It

Primary owner: SHS operator or release operator.

Review owners when relevant:

- Governance owner for Master Layer Registry, Truth Spine, Public Approval, and source-to-public safety.
- Technical owner for build/runtime hygiene.
- Security/privacy owner before public release.
- Data Ownership/IP owner before public release.
- Product owner for route exposure and public/private boundary review.

## Daily Command Set

Run:

```bash
npm run check:governance
python3 scripts/check_master_layer_registry.py
python3 scripts/check_truth_spine_freeze.py
python3 scripts/check_duplicate_layer_cleanup.py
python3 scripts/check_runtime_log_hygiene.py --strict
npm run build
git status --short
git diff --name-status
git diff --stat
```

If strict runtime hygiene fails because a tracked runtime audit/log file is dirty, review the diff and then use the documented cleanup command:

```bash
bash scripts/clean_runtime_audit_logs.sh
```

Do not use broad restore/reset commands for runtime cleanup.

## Daily Manual Checks

Reports and Watchtower visibility:

- Check `/reports/snapshot` when a local/live Agent Fabric server is already available.
- Check `/watchtower/summary` when a local/live Agent Fabric server is already available.
- Do not start servers as part of the default daily runner.
- Confirm Reports and Watchtower still expose governance/readiness/risk visibility for touched layers.

SHS to SHF boundary:

- Confirm SHS Spine remains the upstream private/operational spine.
- Confirm SHF Spine remains the downstream public-approved impact spine.
- Confirm private SHS data does not appear in public SHF surfaces.
- Confirm transfer requires the governance chain.

Public-approved mutation guard:

- Confirm no unauthorized layer mutates `public_approved`.
- Confirm `src/data/shfImpactData.js` remains public-approved filtered.
- Confirm the Data Approval Gateway remains required before public impact visibility.

Security/privacy and Ownership/IP:

- Confirm public release candidates have Security / Privacy clear status.
- Confirm public release candidates have Data Ownership / IP clear status.
- Confirm no secrets or real keys appear in diffs, screenshots, reports, logs, or docs.

Route/identity:

- Confirm admin routes remain internal/protected.
- Confirm public routes do not expose internal notices or client/private data.
- Confirm SHF-Next public/internal route split remains intact if SHF-Next is in scope.
- Confirm `ADMIN_API_KEY` remains environment-only.

## Daily Report Naming

Store dated reports in:

```text
docs/daily-audits/
```

Use:

```text
docs/daily-audits/DAILY_GOVERNANCE_AUDIT_YYYY_MM_DD.md
docs/daily-audits/DAILY_GOVERNANCE_AUDIT_YYYY_MM_DD.json
```

This template does not create a dated report automatically.

## Status Definitions

| Status | Meaning |
| --- | --- |
| `PASS` | Required check completed and no blocker was found. |
| `PASS_WITH_WARNINGS` | Check completed with known or reviewed non-blocking warnings. |
| `FAIL` | Check failed or a blocking condition was found. |
| `NOT_RUN` | Check was not run and must not be treated as passing. |
| `OWNER_REVIEW_REQUIRED` | Operator found an item requiring owner decision before release. |

## Governance Validation Checklist

- [ ] `npm run check:governance` passes.
- [ ] `python3 scripts/check_master_layer_registry.py` passes.
- [ ] `python3 scripts/check_truth_spine_freeze.py` passes.
- [ ] `python3 scripts/check_duplicate_layer_cleanup.py` passes.
- [ ] `python3 scripts/check_runtime_log_hygiene.py --strict` passes.
- [ ] Truth Spine remains the anti-drift authority.
- [ ] Master Layer Registry remains the architecture gate.
- [ ] Duplicate cleanup guard remains passing.

## Build Validation Checklist

- [ ] `npm run build` passes.
- [ ] Existing Vite large-chunk warning is unchanged and documented.
- [ ] Any new build warning is classified as blocker or owner review.
- [ ] Build output is not staged.

## Runtime Hygiene Checklist

- [ ] No dirty tracked runtime logs.
- [ ] No runtime audit files staged accidentally.
- [ ] No local DB, JSONL, log, cache, or `dist/` output staged accidentally.
- [ ] If runtime files are dirty, review and run `bash scripts/clean_runtime_audit_logs.sh`.
- [ ] Confirm cleanup does not delete files and only restores the known tracked runtime audit file.

## Git Safety Checklist

- [ ] `git status --short` reviewed.
- [ ] `git diff --name-status` reviewed.
- [ ] `git diff --stat` reviewed.
- [ ] No unexpected runtime files are dirty.
- [ ] No archive removals are mixed into unrelated work.
- [ ] No real secrets, keys, auth headers, tokens, private client data, or generated artifacts are staged.
- [ ] Existing intentional staged work is identified before new staging or commit activity.

## Reports / Watchtower Visibility Checklist

- [ ] `/reports/snapshot` checked manually/API when server is already available.
- [ ] `/watchtower/summary` checked manually/API when server is already available.
- [ ] Reports still show Truth/public approval/readiness metadata where applicable.
- [ ] Watchtower still shows coverage/risk/readiness metadata where applicable.
- [ ] Neither Reports nor Watchtower promotes draft, unverified, private, or public-unapproved data into public fact.

## SHS To SHF Boundary Checklist

- [ ] SHS Spine remains upstream operational/private source context.
- [ ] SHF Spine remains downstream governed/public impact context.
- [ ] SHS private/client data is blocked from public SHF surfaces.
- [ ] SHS to SHF transfer requires governance, verification, privacy, ownership, readiness, public approval, and Data Approval Gateway controls as applicable.
- [ ] `src/system/spines/shsSpine.js` still blocks private categories from SHF transfer.
- [ ] `src/data/shfImpactData.js` still states public SHF output uses public-approved data only.

## Public-Approved Mutation Guard Checklist

- [ ] No unauthorized layer mutates `public_approved`.
- [ ] No layer directly mutates SHF Impact Data Spine as a shortcut to publication.
- [ ] Data Approval Gateway remains required before public impact visibility.
- [ ] Public Approval remains review/gate authority and does not get bypassed.
- [ ] Truth Spine remains required for verified, report-ready, and public-ready claims.

## Security / Privacy And Ownership/IP Checklist

- [ ] Public release candidates require Security / Privacy clear status.
- [ ] Public release candidates require Data Ownership / IP clear status.
- [ ] No PII, sensitive data, client private data, or unsupported ownership/IP appears in public surfaces.
- [ ] No `ADMIN_API_KEY`, bearer token, auth header, API key, client secret, private key, or real credential appears in diffs.
- [ ] `.env`, `.env.*`, `.env.local`, logs, local DBs, and generated artifacts remain uncommitted.

## Route / Identity Checklist

- [ ] Admin routes remain internal/protected.
- [ ] `/ops/*` remains internal SHS/admin workflow.
- [ ] Public routes do not expose internal notices, role metadata, client data, or admin controls.
- [ ] SHF-Next public/internal route split remains intact if checked.
- [ ] Cross-App Route Bridge contains URLs and paths only, not secrets, roles, permissions, or authorization data.
- [ ] `ADMIN_API_KEY` remains server-side/environment-only.

## Known Non-Blocking Warnings

- Existing Vite large-chunk warning is non-blocking only if unchanged and documented.
- Default daily script does not call live APIs.
- Default daily script does not create dated reports.
- Non-strict runtime hygiene inside `npm run check:governance` is informational; strict runtime hygiene is the release/daily gate.

## Blocker Definitions

Block daily release progress if any of these occur:

- Governance check fails.
- Master Layer Registry check fails.
- Truth Spine freeze check fails.
- Duplicate cleanup check fails.
- Strict runtime hygiene fails and dirty tracked runtime files are not reviewed/cleaned.
- Build fails.
- New build warning appears without review.
- Secret or real key appears in diff, docs, logs, screenshots, or reports.
- Public route exposes private SHS/client/internal data.
- Admin/internal route becomes public.
- Public-approved mutation bypasses the approved chain.
- SHF Impact Data Spine is mutated directly outside approved data flow.
- Security/Privacy or Data Ownership/IP blocks public release.
- Reports/Watchtower lose governance visibility for touched layers.

## Owner Review Checklist

Use `OWNER_REVIEW_REQUIRED` when:

- A new route/layer/system is proposed.
- A public-facing change touches SHS or SHF impact data.
- A private-to-public data transfer is proposed.
- A production persistence assumption appears.
- A webhook, notification, automation, warehouse write, or external connector is proposed.
- A secret exposure may have occurred.
- A runtime audit/log file needs a tracking/retention decision.
- A new build warning appears.

## Optional Script Usage

This task creates:

```bash
scripts/run_daily_governance_audit.sh
```

Run:

```bash
bash scripts/run_daily_governance_audit.sh
```

The script:

- Uses `set -euo pipefail`.
- Runs governance checks.
- Runs strict runtime hygiene.
- Runs build.
- Prints git status.
- Does not start servers.
- Does not call live APIs.
- Does not create dated reports.
- Does not commit.
- Does not delete files.
- Does not clean runtime logs automatically.

If strict runtime hygiene fails, the script tells the operator to review and run:

```bash
bash scripts/clean_runtime_audit_logs.sh
```

## Example Daily Report Skeleton

```markdown
# Daily Governance Audit YYYY-MM-DD

## Status

Status: NOT_RUN

## Command Results

- npm run check:governance: NOT_RUN
- python3 scripts/check_master_layer_registry.py: NOT_RUN
- python3 scripts/check_truth_spine_freeze.py: NOT_RUN
- python3 scripts/check_duplicate_layer_cleanup.py: NOT_RUN
- python3 scripts/check_runtime_log_hygiene.py --strict: NOT_RUN
- npm run build: NOT_RUN

## Manual Checks

- Reports snapshot: NOT_RUN
- Watchtower summary: NOT_RUN
- SHS to SHF boundary: NOT_RUN
- Public-approved mutation guard: NOT_RUN
- Security / Privacy and Data Ownership / IP: NOT_RUN
- Route / identity boundary: NOT_RUN

## Known Warnings

- Existing Vite large-chunk warning: reviewed / unchanged / changed.

## Blockers

- None recorded.

## Owner Review Items

- None recorded.

## Next Actions

- None recorded.
```

## Validation Results

Validation completed for Daily Governance Audit Template V1:

| Command | Result |
| --- | --- |
| `python3 -m json.tool docs/DAILY_GOVERNANCE_AUDIT_TEMPLATE_V1.json` | PASS |
| `bash -n scripts/run_daily_governance_audit.sh` | PASS |
| `python3 scripts/check_master_layer_registry.py` | PASS |
| `python3 scripts/check_truth_spine_freeze.py` | PASS |
| `python3 scripts/check_duplicate_layer_cleanup.py` | PASS |
| `python3 scripts/check_runtime_log_hygiene.py --strict` | PASS, 0 dirty tracked runtime files |
| `npm run check:governance` | PASS |
| `npm run build` | PASS with existing Vite large-chunk warning |

## Files Changed

Daily Governance Audit Template V1 creates or maintains:

- `docs/DAILY_GOVERNANCE_AUDIT_TEMPLATE_V1.md`
- `docs/DAILY_GOVERNANCE_AUDIT_TEMPLATE_V1.json`
- `docs/daily-audits/README.md`
- `scripts/run_daily_governance_audit.sh`

No runtime behavior, routes, services, auth, persistence, webhooks, notifications, SHF Impact Data Spine records, public approval state, or scheduler/cron configuration is changed by this template package.

## V1 Complete

Yes. Daily Governance Audit Template V1 is complete as a docs/template/checklist package plus a safe optional runner scaffold.
