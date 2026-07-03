# SHS Tracking Intelligence Layer V1

## Executive Summary

SHS Tracking Intelligence Layer V1 is the official V1.1 internal tracking spine for SHS operations. It connects local/admin-safe activity across Sales, Production, QA, ClientOps, Reports, Agents, Orchestrator, Persistence, Direct Connect, Revenue signals, and Impact proof without adding third-party analytics, public tracking, cookies, pixels, external APIs, warehouse writes, or report publishing.

The layer answers what happened, which system was touched, which client/project/report/agent/workflow was involved, whether the event is safe, whether it is useful for reports, upsells, retention, revenue, ROI, or governance, and what an operator should review next.

## Purpose

Tracking Intelligence V1 creates a local-first event spine for internal SHS operational awareness. It is not a public analytics tool and does not track public users. It records internal events, groups them into streams, derives local signals, links safe entity references, builds an activity timeline, and exposes readiness/safety state for SHS operators.

## What Was Built

- Tracking event model
- Exactly 12 tracking streams
- Local tracking storage helpers
- Tracking safety scanner
- Metrics helpers
- Local intelligence signal generation
- Activity timeline builder
- Entity linking helpers
- Tracking readiness scoring
- Admin page at `admin.html#/ops/tracking`
- Eight admin UI components
- Focused validator and package script

## Why Tracking Intelligence Matters

SHS needs an internal spine that can connect operational movement to downstream value without violating privacy or governance boundaries. Tracking Intelligence makes internal signals visible to operators before they become report candidates, upsell notes, retention risks, revenue signals, ROI context, or governance review items.

## 12 Tracking Streams

1. Sales Activity Stream
2. Production Movement Stream
3. QA Readiness Stream
4. ClientOps Lifecycle Stream
5. Reports Usage Stream
6. Agent Activity Stream
7. Orchestrator Coordination Stream
8. Direct Connect Proof Stream
9. Persistence Snapshot Stream
10. Support / Maintenance Stream
11. Revenue / Renewal Signal Stream
12. Governance / Readiness Stream

Each stream defines allowed event types, blocked event types, visibility rules, safety notes, and usefulness for reports, upsells, retention, and governance.

## Event Model

Implemented in `src/system/tracking/shsTrackingEvents.js`.

The event model includes tracking event ID, event type, event name, source, action, entity type, entity ID, client/project/report/agent/workflow references, risk level, visibility, safety status, timestamp, metadata, and operator note.

Defaults:

- Visibility defaults to `internal_only`.
- Safety status is calculated by the safety scanner.
- Sensitive metadata is stripped or blocked.
- `public_candidate_blocked` does not publish anything.
- Events cannot mark `public_approved`.
- Events cannot mutate SHF Impact Data.

## Signal Model

Implemented in `src/system/tracking/shsTrackingSignals.js`.

Local signal types:

- upgrade_opportunity
- renewal_risk
- report_engagement
- support_hotspot
- qa_blocker
- production_delay
- agent_activity_spike
- proof_gap
- governance_attention
- client_value_signal
- revenue_signal
- impact_report_candidate

Signals are derived locally from safe mock/local events. No external AI, external analytics, or third-party tracking is used.

## Metrics / Readiness

Implemented in:

- `src/system/tracking/shsTrackingMetrics.js`
- `src/system/tracking/shsTrackingReadiness.js`

Metrics include event count by stream, client, and project; open blockers; report usage count; proof readiness count; agent activity count; QA readiness count; upgrade signal count; renewal risk count; governance attention count; and tracking readiness score.

Readiness starts at 100 and subtracts:

- 25 if safety scanner is missing
- 20 if no event streams exist
- 20 if no entity linking exists
- 20 if no timeline exists
- 15 if no signal generation exists
- 15 if no report/export readiness exists
- 50 if dangerous tracking behavior exists

Ready means score is at least 80, dangerous tracking flags are false, no public approval mutation exists, no SHF Impact mutation exists, no external tracking exists, and no private secrets are persisted.

## Safety Scanner

Implemented in `src/system/tracking/shsTrackingSafety.js`.

Visible safety copy:

> SHS Tracking Intelligence V1 records internal operational events only. It does not add third-party analytics, public tracking pixels, cookies, external delivery, warehouse writes, report publishing, public approval mutation, or SHF Impact Data mutation.

Blocked categories:

- private secrets
- external auth payloads
- financial account payloads
- live connector payloads
- public approval mutation
- SHF Impact mutation
- external analytics
- cookie tracking
- pixel tracking
- webhook sending
- notification sending
- warehouse write
- report publishing

## Admin UI

Route:

`admin.html#/ops/tracking`

Page:

`src/pages/admin/tracking/ShsTrackingIntelligencePage.jsx`

Components:

- `TrackingOverviewPanel`
- `TrackingStreamPanel`
- `TrackingEventTimeline`
- `TrackingSignalPanel`
- `TrackingEntityLinkPanel`
- `TrackingReadinessPanel`
- `TrackingSafetyPanel`
- `TrackingReportUsePanel`

Local/admin-safe actions:

- create sample internal event
- run safety scan
- generate local signal summary
- filter by stream
- filter by client/project/report/agent reference
- mark signal reviewed locally
- archive local event

## Route / Access Control

Files modified:

- `src/router/AdminRoutes.jsx`
- `src/components/admin/AdminSidebar.jsx`
- `src/system/identity/hubAccessControl.js`
- `src/system/routes/crossAppRouteBridge.js`

Access:

- `/ops/tracking` is protected.
- `shs_admin` is the only allowed role.
- `client_admin` and public users remain blocked.

## SHS / SHF Boundary

Tracking Intelligence preserves the SHS / SHF boundary:

- SHS tracking events are internal operational records.
- SHF public surfaces require Data Approval Gateway.
- Tracking does not mutate SHF Impact Data Spine.
- Tracking does not mark `public_approved`.
- Impact report candidates remain review candidates only.

## Report / Upsell / Retention / Governance Usage

Tracking streams label whether they are useful for reports, upsells, retention, and governance. This helps operators identify candidates for review without publishing data, sending messages, or moving private data to public surfaces.

## What It Does Not Do

Tracking Intelligence V1 does not:

- add external tracking scripts
- add cookies
- add pixel tracking
- add third-party analytics
- call external APIs
- send webhooks
- send notifications
- write warehouse records
- mutate SHF Impact Data Spine
- mark `public_approved`
- publish reports automatically
- store private secrets, external auth payloads, financial account payloads, or live connector payloads
- track users across public surfaces
- bypass Security / Privacy, Data Ownership / IP, Data Approval Gateway, Truth Spine, Policy Engine, or Readiness Gate

## Validation Results

Validation completed in this environment:

- `python3 -m json.tool docs/SHS_TRACKING_INTELLIGENCE_LAYER_V1.json`: PASS
- `PYTHONPYCACHEPREFIX=/tmp/codex_pycache python3 -m py_compile scripts/check_shs_tracking_intelligence.py`: PASS
- `python3 scripts/check_shs_tracking_intelligence.py`: PASS
- `npm run check:shs-tracking`: PASS
- `npm run check:shs-orchestrator`: PASS
- `npm run check:shs-persistence`: PASS
- `npm run check:governance`: PASS
- `bash scripts/run_daily_governance_audit.sh`: PASS
- `bash scripts/run_paid_launch_checks.sh`: PASS
- `npm run build`: PASS_WITH_EXISTING_VITE_WARNINGS
- `git diff --check`: PASS

## Browser Smoke

Browser smoke completed against `http://127.0.0.1:5174/admin.html#/ops/tracking`:

- SHS admin loaded the Tracking Intelligence route.
- Exactly 12 stream names were visible.
- Overview, timeline, signal, entity link, readiness, safety, and report-use panels were visible.
- Create sample internal event, safety scan, mark signal reviewed locally, archive local event, stream filter, and entity filter actions passed.
- Internal-only safety copy was visible.
- Visible UI did not re-center Direct Connect around banking, account linking, Plaid-style aggregation, credentials, OAuth, payments, scraping, or live external integrations.
- `client_admin` was redirected away from `/ops/tracking` to `#/hub`.
- Existing Orchestrator, Persistence, Agents, Reports, and Direct Connect routes still loaded.

## Remaining Risks

- Tracking V1 is local/admin-first and does not provide backend persistence by itself.
- Future consent design is required before any public-surface tracking exists.
- Report candidates still require human review and Data Approval Gateway.
- Future production telemetry must keep external analytics, cookies, pixels, and warehouse writes owner-approved and disabled by default.

## V1 Complete

Status: **complete**.
