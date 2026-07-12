# SHS BOS Executive Command Center V1

## Executive summary

SHS BOS Executive Command Center V1 is the unified internal mission-control
surface for Silicon Heartland Business Operating System operations. It
aggregates safe local summaries from existing BOS layers, calculates transparent
health and readiness, ranks operator priorities, shows risks, and routes the
operator to source systems for action.

It does not replace Command Bus, Event Bus, Scheduler, Orchestrator, Registry,
Tracking, Persistence, Agent systems, Direct Connect, Reports, governance, or
business operations.

## Product naming: SHS BOS

Product name: SHS BOS

Full product name: Silicon Heartland Business Operating System

## Purpose

The Command Center answers whether SHS BOS is healthy, which layers need
attention, which safe action should happen next, and whether governance,
safety, SHS/SHF boundary, and dangerous-capability controls remain intact.

## Architectural position

The layer is an aggregation, visibility, triage, safe-preview, and navigation
surface above existing SHS BOS infrastructure. It reads safe summaries and
stores only its own local notes, reviewed priority state, filters, and executive
snapshots.

## What was built

- Executive Command Center core aggregation modules.
- Canonical layer-status and executive-snapshot models.
- Deterministic health and readiness scoring.
- Priority and risk engines.
- Safe next-action and preview-only intent builders.
- Local snapshot, note, filter, and reviewed-priority storage.
- Admin route at `admin.html#/ops/executive-command`.
- Admin page with required panels and dark BOS command-center styling.
- Validator and documentation artifacts.
- Manual governance review artifacts.

## Connected source layers

The Command Center represents 16 approved source groups:

1. System Registry
2. System Orchestrator
3. Command Bus
4. Event Bus / Message Fabric
5. Job Scheduler
6. Notification & Alert Fabric
7. Tracking Intelligence
8. Durable Persistence
9. Agent Workbench
10. Agent Workflow Engine
11. Controlled Executor
12. Production Automation
13. Direct Connect direct-source proof
14. SHS Reports
15. Governance / Truth Spine / Oracle
16. Client operations and business signals

## Layer-status model

Each source group is normalized to:

- layer id and name
- category
- admin route
- status
- readiness score
- health score
- data posture
- open items
- blockers
- warnings
- last activity and validation timestamps
- source reference
- admin-only flag
- dangerous flag summary

Missing trusted timestamps remain null or not verified.

## Executive snapshot model

Snapshots are local and admin-only. They contain overall status, readiness,
health, layer counts, runtime counts, priority/risk summaries, safe next
actions, data posture summary, safety summary, and an operator note.

Snapshots do not publish, export externally, or deliver messages.

## Health scoring

Health starts at 100 and subtracts points for unavailable layers, degraded
layers, blocked layers, stale or unknown source status, and unresolved warnings.
Every deduction is displayed in the UI.

## Readiness scoring

Readiness starts at 100 and subtracts deterministic points for critical
blockers, dangerous capability flags, governance blockers, Truth Spine
unavailability, route/identity boundary failure, blocked commands, failed jobs,
critical alerts, blocked orchestration plans, registry conflicts, low
persistence readiness, tracking review items, invalid events, agent workflow
blockers, report readiness issues, and primarily sample/unavailable data
posture.

Every deduction is visible.

## Priority engine

The priority engine ranks deterministic local priorities:

- P0 Critical
- P1 Immediate
- P2 High
- P3 Normal
- P4 Informational

It prioritizes governance blockers, safety violations, route/access failures,
critical alerts, failed jobs, blocked commands, blocked workflows, proof gaps,
report readiness, client risk, renewal risk, upgrade opportunity, revenue
signals, and informational activity.

## Risk engine

The risk engine summarizes blockers, warnings, SHS/SHF boundary posture, data
posture, and route targets. It does not inspect sensitive payloads or expose
private client data publicly.

## Runtime visibility

Runtime Fabric covers Command Bus, Event Bus, Scheduler, Notification Fabric,
Orchestrator, and Persistence with status, readiness, data posture, and open
items.

## Agent visibility

Agent visibility covers Agent Workbench, Agent Workflow Engine, and Controlled
Executor. It preserves approval and controlled-executor safety boundaries.

## Governance visibility

Governance visibility covers Truth Spine, Oracle, Master Layer Registry, Policy
Engine, Readiness Gate, public-approval guard, security/privacy, ownership/IP,
Direct Connect proof, and system registry posture.

## Business-operations visibility

Business visibility summarizes Sales, Production, QA, ClientOps, Reports,
Direct Connect proof, renewal risk, upgrade opportunity, and revenue signals as
local summary posture only.

## Data posture rules

Every layer carries one of:

- live_local
- persisted_local
- derived_local
- sample
- unavailable
- needs_review

The UI does not imply live production data when a source is local, derived,
sample, unavailable, or needs review.

## Safe actions

Supported actions are local refresh, filtering, mark reviewed, operator note,
local snapshot, snapshot comparison, navigation, command preview, orchestration
preview, safety scan, blast-radius preview, data posture view, and local
snapshot archive.

## Command and orchestration previews

Command previews create preview objects only and point to Command Bus for
review. Orchestration previews create preview objects only and point to the
Orchestrator. Neither dispatches, activates, mutates, or executes.

## Safety boundaries

SHS BOS Executive Command Center V1 provides governed visibility, triage, safe
previews, and navigation across internal operating layers. It does not
autonomously execute commands, mutate production systems, publish reports,
change public approval, mutate SHF Impact Data, send external messages, write
warehouse records, modify authentication, or create live external integrations.

All dangerous capability flags remain false.

## SHS/SHF boundary

SHS operational/private data remains inside SHS admin surfaces. SHF public
surfaces receive public-approved information only through existing approval
controls. The Command Center cannot mark public-approved, cannot mutate SHF
Impact Data, and cannot make Direct Connect anything other than direct-source
proof.

## Route/access control

Route: `admin.html#/ops/executive-command`

Access:

- shs_admin allowed
- client_admin blocked
- public/no session blocked

## Admin UI

The admin UI uses the existing internal SHS BOS command-center pattern:
compact panels, dark operational palette, blue/cyan accents, red/amber safety
states, no public marketing layout, and responsive fallback.

## Validation

Validator:

- `python3 scripts/check_shs_bos_executive_command_center.py`
- `npm run check:shs-executive-command`

Adjacent validators remain required for release confidence.

## Browser smoke

Browser smoke should verify route load, access boundaries, all panels,
16 source groups, local actions, preview-only behavior, dangerous flags false,
boundary copy, Direct Connect direct-source proof copy, and existing route
survival.

## Remaining risks

- Some source groups expose local, derived, sample, unavailable, or needs-review
  posture rather than live local source records.
- Browser smoke depends on the local Vite/admin auth environment.
- Future V2 should add richer read-only adapters only where source layers expose
  stable APIs.

## Future V2 scope

- More source-owned read-only summary APIs.
- Stronger snapshot comparison.
- More granular dependency blast-radius summaries.
- Optional governance-suite result ingestion after owner review.
- No external delivery or execution without separate governance package.

## V1 complete yes/no

Yes, V1 is complete when validation and browser smoke are recorded in the JSON
artifact for the current environment.
