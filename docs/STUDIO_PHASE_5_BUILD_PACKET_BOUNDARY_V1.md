# Studio Phase 5: Build Packet Boundary

## Purpose

The Build Packet is a deterministic, read-only work-context projection for a Studio project. It describes what the project is, its assignment/release lineage, available requirements, resources, and future builder context without becoming QA, review, delivery, Evidence, Portfolio, completion, Truth, or reporting authority.

## Canonical inputs

Assignment-origin packets use the authorized Studio project and handoff, the handoff's durable `requirements_json`, the exact curriculum release bound to the project, and the Phase 4 resource projection. Independent projects have no assignment or curriculum lineage and return empty requirements, deliverables, templates, tools, and artifact references unless a later canonical project-owned source exists.

The packet is derived on request and is not stored in a new table. Its stable presentation identity is `build_packet_<projectId>_v1`; this is a projection key, not a second project record.

## Response boundary

`GET /studio/projects/:projectId/build-packet` authenticates, resolves organization/tenant context, authorizes the project, validates assignment lineage when present, and returns:

- project identity, type, title, and current Studio lifecycle status;
- assignment, release, unit, and lesson references when assignment-originated;
- the exact handoff requirements payload;
- Phase 4 canonical resources;
- empty arrays for unsupported deliverables, templates, tools, and artifact references.

Missing or invalid assignment lineage fails closed. The service never falls back to the latest curriculum release.

## Truth boundaries

An expected requirement or deliverable is descriptive. The packet contains no requirement-satisfied, deliverable-complete, QA-passed, review-approved, delivered, Evidence, Portfolio, credential, completion, or reporting claim. Resource retrieval remains read-only and cannot mutate project state.

QA and review may consume the packet later, but their results remain separate domain facts. Evidence, Completion Policy, Truth Spine, metrics, and reporting remain SHRV1 authorities. ClientOps is not exposed by this student route.

## Student presentation

The Studio project shell presents `Project Plan / Requirements` with student language: `What you're building`, `What it needs`, and `What you'll turn in`. Empty optional data is shown honestly. Beginner mode hides technical lineage. Advanced mode may reveal assignment/release IDs and packet version, but mode changes presentation only.

## Companion boundary

The existing Companion may consume a bounded packet summary for explanation and coaching. It cannot satisfy requirements, mutate the packet, advance lifecycle, approve QA/review, create Evidence, or mark completion.

## Security

The endpoint reuses the existing Studio project permission, organization/tenant context, and project authorization. Project IDs cannot bypass authorization, and foreign projects return the existing not-found boundary. Release and handoff queries are scoped to the authorized organization and tenant.

## Deferred

Durable packet versions, canonical deliverable definitions, project artifacts, templates/tools entitlement, website-specific requirements, AI Agent Standard requirements, QA execution, review, Delivery, Evidence/Portfolio integration, and packet export/approval remain deferred.

## Phase 6 entry contract

Phase 6 may build the first builder workspace over this read-only packet contract. Builders must consume packet context and continue to write their own authoritative domain records through separately authorized APIs; packet retrieval must remain non-mutating and must preserve project/release lineage.
