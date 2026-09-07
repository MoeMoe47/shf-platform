# SHU Universal Reporting U4: BOS and AI Governance

## Status

U4 extends the U1 Shared Reporting contract with read-only BOS and AI Governance projections. The sole artifact authority remains `apps/shs-api/src/domain/reporting/`; no migration 108 is required.

## Product boundary

AI Governance is represented under the existing `bos` product key. This follows the repository's shared BOS/Agent Fabric operational substrate and avoids inventing a second durable product identity. AI-specific families remain distinct through their `agent-`, `policy-`, `mcp-`, and `ai-` family names and trusted branding metadata.

## BOS families

Registered families:

- `operating-review`
- `workflow-performance`
- `governance-control`
- `release-assurance-evidence`
- `control-exception`

The adapter reads Operational Awareness, BOS Conductor, ARAG-1, and policy authorities only within organization and tenant scope. It reports canonical workflow, control, exception, approval, and release facts; it cannot change them.

## AI Governance families

Registered families:

- `agent-session`
- `policy-enforcement`
- `mcp-tool-access`
- `ai-security-event`
- `governed-ai-activity`

The adapter reads implemented Agent Governance, Input Security Gateway, MCP Gateway, activity-ledger, and session authorities. It reports bounded identity, classification, decision, approval, and provenance metadata. It does not expose raw prompts, retrieved content, request payloads, credentials, tokens, connection strings, or secret references.

## ARAG-1 boundary

Release Assurance reports read `arag_release_requests`, approvals, assurance packets, policy decisions, and release status. Reporting does not approve, authorize, execute, rollback, or otherwise mutate a release. A report is not a release decision.

## Privacy and classification

U4 reports default to `INTERNAL` and do not accept caller-controlled downgrades. Restricted security details are represented as status, classification, hashes, references, and bounded summaries. `PUBLIC` classification remains separate from Public Disclosure and never publishes an artifact.

Human, agent, delegated principal, service, and model/provider metadata remain separate where canonical data provides that distinction. Human approvals retain approver, decision, rationale, and timestamp references. AI policy results and security events remain owned by their source authorities.

## Rendering and storage

All families use the U1 shared renderer, HTML/PDF/JSON formats, product-scoped storage, safe `BOS` filenames, immutable snapshots, hashes, scoped retrieval, and history. No second renderer or artifact authority was introduced.

## Validation

U4 validation covers exact registry resolution, all ten family projections, product/family isolation, scope, secret/content omission, U1/U2/U3 regression, API typecheck/build, root build, UI validation, diff checking, and disposable migration replay through migration 107.

## U5 readiness

Future U5 work may add Registry, Solutions, Legal, and explicitly governed cross-product compositions. Registry must remain separate from OAS and Trust Bureau. Legal records remain Legal-owned with privilege and retention controls. Cross-product reports require explicit source-domain composition contracts, reconciled classification, and complete provenance; Shared Reporting must not become a universal query authority.
