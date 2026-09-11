# CivicSure Wave 0 Canonical Authority Contract

This document is the Wave 0 boundary for Government Program Assurance (GPA).
It prevents future assurance work from creating competing institutional
authorities. No migration or replacement domain is implied by this contract.

## Five Decisions

| Authority | Canonical owner | Persistence | Write path | Read path | Event authority |
| --- | --- | --- | --- | --- | --- |
| Institutional Truth | Existing SHS Truth Spine | Truth Spine ledger/package | Truth Spine contract, with GPA determination handoff | Truth Spine packages and approved consumers | Truth Spine truth events |
| Agent Fabric | Shared Agent Fabric; API AI Governance is the durable control plane | Existing AI Governance/MCP/session stores and runtime ledger | Governed AI/MCP services | Governed sessions, tools, and activity records | Agent Fabric activity events |
| Metrics | Platform Metric Registry | Registry definitions; GPA result records for scoped calculations | Platform registry owner changes definitions; GPA registration routes resolve the read-only registry adapter | Registry definitions plus GPA results | Metric Registry/result events |
| Public projection | Reporting / Public Disclosure | Approved snapshots and published projections | Eligibility, disclosure, publication authorization, then projection | Published projection APIs only | Reporting publication/revocation events |
| External source/reconciliation | External system for source records; GPA for source authority and reconciliation | GPA source scope, provenance, reconciliation, quality, and rejected-record records | GPA source/reconciliation services | Scoped assurance services and approved projections | Source/reconciliation events |

## Truth Boundary

GPA owns claims, evidence linkage, admissibility, verification, reconciliation,
and the government-assurance determination. An accepted determination carries a
`truthSpineHandoff` reference created by
`government-assurance/adapters/truth-spine-boundary.ts`. Accepted metric Truth
promotion publishes the existing `IntegrationOutboxRepo` event
`government_assurance.truth_determination.accepted`; the signed Agent Fabric
internal-ingestion consumer then projects it through the existing evidence
projection into `services/truth_spine_service.py`. The handoff is not a second
Truth ledger. Agent Fabric's current evidence/Truth persistence remains a
development-only JSONL implementation and is not production-ready.

`gpa_truth_facts` is retained for historical compatibility and GPA lineage. It
must not be expanded as an independent institutional Truth authority. AI,
Reporting, Oracle, frontend state, and curriculum state cannot determine Truth.

## Agent Fabric Boundary

GPA verified, reported, and derived context is admitted through Agent Fabric
session/delegation, input-security, model, and tool controls. Agent output is
advisory only. Government findings, Truth, public disclosure, payment release,
and consequential decisions remain owned by GPA or the external domain owner
and require authorized human action.

`services/shf-agent-fabric` remains runtime infrastructure where distinct. The
API `ai-governance`, `input-security`, `mcp`, and simulation services remain the
control-plane contract. CivicSure must not create agent identity, session,
delegation, MCP, model, or prompt-security persistence.

## Metric Boundary

`gpa_metric_results` stores scoped calculations and assurance observations.
Metric semantics, versions, ownership, effective dates, and public eligibility
belong to the Platform Metric Registry contract at
`services/shf-agent-fabric/contracts/reporting/metric_registry.v1.json`, which
is validated and consumed by `services/metric_registry_service.py`. Production
GPA metric-registration routes use
`government-assurance/adapters/metric-registry-boundary.ts` to resolve an
active canonical metric ID/version before writing the scoped GPA registration.
GPA metadata preserves the canonical registry reference and definition digest;
results never redefine metric semantics. New metrics must first be added to the
platform registry through its owner-controlled change process.

## Public Projection Boundary

Official public output follows:

`Truth/Metric -> Public Eligibility -> Disclosure Review -> Publication Authorization -> Versioned Snapshot -> Published Projection API`.

`/government-assurance/public/summary` requires an explicit organization or
jurisdiction scope and reads only `CANONICAL_PUBLICATION` / `PUBLISHED`
Reporting projections for a report family registered in
`report-public-governance-registry.ts`. Unregistered report families return
`NOT_PUBLISHED` without querying projection rows. It never reads
`gpa_truth_facts`. The current CivicSure Explorer mock data remains demo-only
and is not an official reporting source.

The bounded GPA family `report.gpa.program_assurance_public_summary.v1` is
registered in Reporting and uses the existing eligibility, disclosure,
snapshot, authorization, publication, and projection path. It is an aggregate
view over the canonical workforce verified-employment metric and does not
create a GPA publication authority.

## Truth Spine Production Persistence

In production the Truth Spine boundary uses the Truth Spine-owned PostgreSQL
`truth_spine_records` table. Records are append-only by payload digest and
retain tenant, organization, entity, and full payload lineage. JSON/JSONL is
explicitly limited to development and tests; production mode fails closed
without configured PostgreSQL Truth Spine storage.

## Source and Reconciliation Boundary

External systems remain systems of record. GPA records source system identity,
source record identity, provenance, source authority, freshness, mapping,
quality, rejected records, and reconciliation cases. Competing observations
remain preserved. A material reconciliation case must be `RESOLVED` before it
can support a GPA accepted Truth determination. Silent overwrite is prohibited.

## Canonical Event Vocabulary

The following names identify state transitions; consumers may emit derived
notifications but may not redefine the transition:

- `government_assurance.truth_determination.accepted`
- `truth.accepted` / `truth.published` (Truth Spine)
- `metric.result.calculated` (Metric Registry/GPA result)
- `reconciliation.resolved` / `source.conflict.opened`
- `agent.recommendation.generated` (advisory only)
- `gpa.decision.recorded`
- `report.publication.approved` / `report.published` / `report.revoked`

## Non-Authorities

Frontend local storage, temporary frontend stores, mock/demo explorer fixtures,
Oracle process-local state, aggregation fixtures, dashboard-derived values,
report presentation models, and Agent Fabric recommendations are not canonical
Truth, metric, public, source, or government-decision authorities.

## Wave 0 Acceptance Tests

- accepted Truth requires passed verification, provenance, and resolved material reconciliation;
- AI, Reporting, and Oracle actors cannot determine Truth;
- metric definitions carry the Platform Metric Registry contract while results remain scoped;
- public GPA reads require scope and published Reporting projections;
- public DTOs exclude tenant, workflow, evidence, and internal authority fields;
- source conflicts remain durable and unresolved conflicts fail closed;
- Agent Fabric results cannot become Truth, public approval, or a government decision;
- existing tenant/org isolation and compatibility tests remain green.

## Transition Status

Wave 0 establishes compatibility boundaries without destructive migration.
The accepted GPA determination event now has a connected Truth Spine consumer
path. Durable Truth Spine persistence is owned by the Truth Spine adapter;
`gpa_truth_facts` remains compatibility lineage only. GPA has a read-only
adapter to the canonical Metric Registry; registry authoring remains
owner-controlled and outside this compatibility boundary.
