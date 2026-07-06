# SHS BOS Job Scheduler V1

## Executive Summary

SHS BOS Job Scheduler V1 is the local-first scheduling infrastructure for Silicon Heartland Business Operating System. It gives SHS operators an internal admin-safe way to preview background jobs, delayed tasks, recurring maintenance templates, retry plans, timeout handling, and local job history.

This V1 scheduler is not a cron server, external worker, autonomous executor, production mutation engine, notification system, webhook sender, warehouse writer, report publisher, or credential store.

## Purpose

The Scheduler answers:

- Which local jobs are queued, delayed, paused, completed, or blocked?
- Which recurring maintenance templates exist?
- What retry plan would apply?
- Which timeout limit is declared?
- Which jobs are blocked by safety guardrails?
- What local history exists for operator review?

## What Was Built

- Local job model.
- Job definitions and recurring templates.
- Local job scheduler state.
- Local job queue helpers.
- Retry preview policy.
- Local job history.
- Job safety scanner.
- Metrics helper.
- Readiness scoring.
- Admin UI at `admin.html#/ops/scheduler`.
- Focused validator and package script.

## Core Files

- `src/system/job-scheduler/shsJobTypes.js`
- `src/system/job-scheduler/shsJobDefinitions.js`
- `src/system/job-scheduler/shsJobScheduler.js`
- `src/system/job-scheduler/shsJobQueue.js`
- `src/system/job-scheduler/shsJobRetryPolicy.js`
- `src/system/job-scheduler/shsJobHistory.js`
- `src/system/job-scheduler/shsJobSafety.js`
- `src/system/job-scheduler/shsJobMetrics.js`
- `src/system/job-scheduler/shsJobReadiness.js`

## Admin UI

Route:

`admin.html#/ops/scheduler`

Page:

`src/pages/admin/scheduler/ShsJobSchedulerPage.jsx`

Local/admin-safe actions:

- create local job
- delay job
- create recurring job template
- pause job
- resume job
- retry preview
- mark complete locally
- block dangerous job
- view history

## Route / Access Control

Files modified:

- `src/router/AdminRoutes.jsx`
- `src/components/admin/AdminSidebar.jsx`
- `src/system/identity/hubAccessControl.js`
- `src/system/routes/crossAppRouteBridge.js`
- `package.json`

Access:

- `/ops/scheduler` is protected.
- `shs_admin` is the only allowed role.
- `client_admin` and public users remain blocked by route guard.

## Safety Guardrails

Visible safety copy:

> SHS BOS Job Scheduler V1 coordinates local admin-safe job previews only. It does not run a cron server, start external workers, execute dangerous automation, mutate production data, publish reports, send webhooks or notifications, write warehouse records, modify auth, or store credentials.

Dangerous capability flags remain false:

- `cron_server_enabled`
- `external_worker_enabled`
- `autonomous_execution_enabled`
- `production_mutation_enabled`
- `public_approval_mutation_enabled`
- `shf_impact_data_mutation_enabled`
- `report_publish_enabled`
- `webhook_send_enabled`
- `notification_send_enabled`
- `warehouse_write_enabled`
- `auth_mutation_enabled`
- `credential_storage_enabled`

## What It Does Not Do

Job Scheduler V1 does not:

- run a cron server
- start external workers
- execute autonomous dangerous jobs
- mutate production data
- mutate SHF Impact Data Spine
- mark `public_approved`
- publish reports
- send notifications or webhooks
- write warehouse records
- modify auth
- store credentials, tokens, API keys, OAuth data, private keys, or secrets

## Validation Results

Validation results from this environment:

- `python3 -m json.tool docs/SHS_JOB_SCHEDULER_V1.json` - PASS
- `python3 scripts/check_shs_job_scheduler.py` - PASS
- `npm run check:shs-job-scheduler` - PASS
- `npm run check:shs-command-bus` - NOT_FOUND; package script is not defined in `package.json`
- `npm run check:shs-event-bus` - PASS
- `npm run check:governance` - PASS
- `bash scripts/run_daily_governance_audit.sh` - PASS
- `bash scripts/run_paid_launch_checks.sh` - PASS
- `npm run build` - PASS with existing Vite circular-chunk and large-chunk warnings
- `git diff --check` - PASS

## Remaining Risks

- Scheduler V1 is local/browser storage only.
- Retry behavior is preview-only.
- Recurring jobs are templates only and do not run in the background.
- Future production scheduling needs separate owner approval, durable persistence, audit logging, monitoring, and worker isolation.

## V1 Complete

Status: complete with `check:shs-command-bus` documented as not found.
