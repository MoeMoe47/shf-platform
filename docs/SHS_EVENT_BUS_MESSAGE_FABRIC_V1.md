# SHS BOS Event Bus / Message Fabric V1

## Executive Summary

SHS BOS Event Bus / Message Fabric V1 is the local-first internal message fabric for Silicon Heartland Business Operating System. It lets SHS BOS layers communicate through structured local events instead of direct hard-coded coupling.

This layer is an internal architecture and operations layer. It does not use Kafka, Redis, RabbitMQ, webhooks, external APIs, network delivery, external brokers, production mutation, autonomous execution, report publishing, public approval mutation, SHF Impact Data Spine mutation, warehouse writes, auth mutation, or credential storage.

## Purpose

The Event Bus answers:

- Which SHS BOS layer emitted an internal event?
- Which local channel should carry it?
- Which local subscribers should see it?
- Is the payload schema valid?
- Is the payload safe?
- What would replay show?
- Which event types are blocked or need review?
- Which local subscriber registry entries exist?

## Event Model

Each event includes:

- `event_id`
- `event_type`
- `event_name`
- `source_layer`
- `target_layers`
- `entity_type`
- `entity_id`
- `risk_level`
- `visibility`
- `payload`
- `safety_status`
- `timestamp`
- `operator_note`

Visibility is always `internal_only`.

## Event Channels

Event Bus V1 includes exactly 10 channels:

1. `orchestrator.events`
2. `tracking.events`
3. `persistence.events`
4. `registry.events`
5. `agent.events`
6. `workflow.events`
7. `report.events`
8. `direct_connect.events`
9. `governance.events`
10. `system.events`

## What Was Built

- Event model and channel definitions.
- Local schema validator.
- Local publish/subscribe transport.
- Event router.
- Subscriber registry.
- LocalStorage-backed event and subscriber storage.
- Replay preview.
- Safety scanner.
- Metrics helper.
- Readiness scoring.
- Admin UI at `admin.html#/ops/event-bus`.
- Focused validator and package script.

## Core Files

- `src/system/event-bus/shsEventBusTypes.js`
- `src/system/event-bus/shsEventSchemas.js`
- `src/system/event-bus/shsEventBus.js`
- `src/system/event-bus/shsEventRouter.js`
- `src/system/event-bus/shsEventSubscribers.js`
- `src/system/event-bus/shsEventStorage.js`
- `src/system/event-bus/shsEventReplay.js`
- `src/system/event-bus/shsEventSafety.js`
- `src/system/event-bus/shsEventMetrics.js`
- `src/system/event-bus/shsEventReadiness.js`

## Admin UI

Route:

`admin.html#/ops/event-bus`

Page:

`src/pages/admin/event-bus/ShsEventBusPage.jsx`

Components:

- `EventBusOverviewPanel`
- `EventChannelPanel`
- `EventTimelinePanel`
- `EventSubscriberPanel`
- `EventReplayPanel`
- `EventSafetyPanel`
- `EventReadinessPanel`

Local/admin-safe actions:

- publish sample safe event
- subscribe local layer
- unsubscribe local layer
- replay preview
- run safety scan
- archive local event

## Route / Access Control

Files modified:

- `src/router/AdminRoutes.jsx`
- `src/components/admin/AdminSidebar.jsx`
- `src/system/identity/hubAccessControl.js`
- `src/system/routes/crossAppRouteBridge.js`
- `package.json`

Access:

- `/ops/event-bus` is protected.
- `shs_admin` is the only allowed role.
- `client_admin` and public users remain blocked.

## Safety Guardrails

Visible safety copy:

> SHS BOS Event Bus / Message Fabric V1 routes internal local events only. It does not use external brokers, send network messages, mutate production data, publish reports, change public approval, write warehouse records, modify auth, or store credentials.

Dangerous capability flags remain false:

- `external_broker_enabled`
- `network_delivery_enabled`
- `webhook_send_enabled`
- `notification_send_enabled`
- `production_mutation_enabled`
- `public_approval_mutation_enabled`
- `shf_impact_data_mutation_enabled`
- `report_publish_enabled`
- `warehouse_write_enabled`
- `auth_mutation_enabled`
- `credential_storage_enabled`
- `autonomous_execution_enabled`

## What It Does Not Do

Event Bus / Message Fabric V1 does not:

- use Kafka
- use Redis
- use RabbitMQ
- use external brokers
- send webhooks
- send notifications
- call external APIs
- deliver network messages
- mutate production data
- mutate SHF Impact Data Spine
- mark `public_approved`
- publish reports
- write warehouse records
- modify auth
- store credentials, tokens, API keys, OAuth data, private keys, or secrets
- enable autonomous execution

## Validation Results

Validation passed in this environment:

- `python3 -m json.tool docs/SHS_EVENT_BUS_MESSAGE_FABRIC_V1.json` - PASS
- `python3 scripts/check_shs_event_bus.py` - PASS
- `npm run check:shs-event-bus` - PASS
- `npm run check:shs-orchestrator` - PASS
- `npm run check:shs-tracking` - PASS
- `npm run check:shs-persistence` - PASS
- `npm run check:governance` - PASS
- `bash scripts/run_daily_governance_audit.sh` - PASS
- `bash scripts/run_paid_launch_checks.sh` - PASS
- `npm run build` - PASS with existing Vite circular-chunk and large-chunk warnings
- `git diff --check` - PASS

## Browser Smoke

Browser smoke passed against `http://127.0.0.1:5174/admin.html#/ops/event-bus`:

- `admin.html#/ops/event-bus` loads.
- 10 channels are visible.
- Sample publish works.
- Subscriber panel works.
- Subscribe local layer works.
- Unsubscribe local layer works.
- Replay preview works.
- Safety panel blocks dangerous payloads.
- Archive local event works.
- `client_admin` is redirected to `admin.html#/hub` and cannot see the internal Event Bus surface.
- Public/no-session access is source-verified as blocked through `ProtectedHubRoute` and `/ops/event-bus` being `shs_admin` only in `hubAccessControl`.
- Orchestrator, Tracking, Persistence, and Registry routes still load.

## Remaining Risks

- Event Bus V1 is local/browser storage only.
- Replay is preview-only.
- Subscriber delivery is local in-memory preview only.
- Future production message fabric must add owner-reviewed persistence, audit controls, monitoring, and broker integration only after a separate approval package.

## V1 Complete

Status: complete after validation and browser smoke.
