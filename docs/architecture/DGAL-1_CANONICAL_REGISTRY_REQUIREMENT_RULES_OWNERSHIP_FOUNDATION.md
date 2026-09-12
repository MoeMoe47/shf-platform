# DGAL-1 — Canonical Registry, Requirement Rules & Ownership Foundation

## 1. Executive Result

DGAL-1 is complete for its repository-local scope. A bounded `documentation` domain now provides durable definitions for document types, guidance items and collections, document templates, immutable template versions, and deterministic requirement rules. The resolver is server-scoped to the actor's organization and tenant, entitlement-aware, explainable, source-traceable, deduplicated, conflict-safe, and fail-closed.

No document instances, packets, acknowledgments, signatures, e-signature provider, Document Center, Tour integration, or Companion projection was added.

## 2. Repository Baseline

| Field | Value |
|---|---|
| Repository | `/Users/mikeslate/Projects/shrv1` |
| Branch | `studio-v1-plus-development` |
| Starting HEAD | `9eaaa0cf7b54905ca5eaedcea542ed4c298cb061` |
| Upstream | `origin/studio-v1-plus-development` |
| Worktree | Pre-existing PR-1 through PR-7 changes and DGAL-0 artifacts were preserved |
| DGAL-1 changes | Migration 132, bounded documentation domain, focused tests, this report, DGAL-0 closure evidence |

## 3. DGAL-0 Findings Applied

DGAL-1 follows the DGAL-0 thin-composition decision. DGAL owns registry and composition metadata only. Service domains continue to own workflow facts and completion; Legal owns legal meaning and approval; Evidence owns evidence; Truth owns institutional projections; Retention owns lifecycle; Reporting owns report templates; Tour and Companion remain presentation layers.

## 4. DGAL-1 Gap IDs

| Gap ID | Starting Status | Closure target |
|---|---|---|
| DGAL-GAP-001 | OPEN, P1 | Durable cross-domain registry and ownership/version contract |
| DGAL-GAP-002 | OPEN, P1 | Deterministic, explainable, fail-closed requirement resolver |

## 5. Scope Boundaries

Included: registry definitions, tenant-safe metadata, template version/supersession metadata, requirement rules, server-authoritative input checks, explainable resolution, deduplication, conflict handling, and migration/test coverage.

Deferred: contextual UI, Tour/Companion integration, document instances, packets, rendering, acknowledgment execution, paper workflow, e-signature, notifications, and Document Center. These remain DGAL-2 through DGAL-6 work.

## 6. Canonical DGAL Ownership

| Concept | DGAL Owns Metadata? | Canonical Authority | DGAL Relationship |
|---|---|---|---|
| Guidance Item | Yes | DGAL registry; source domain owns facts | Register explanation/source/action reference |
| Guidance Collection | Yes | DGAL composition | Ordered references only |
| Document Type | Yes | DGAL registry plus source owner | Stable type metadata |
| Document Template | Yes | DGAL registry; Legal/service owner owns content meaning | Reference approved source/content |
| Template Version | Yes | DGAL metadata with source owner | Immutable revision/effective metadata |
| Requirement Rule | Yes | DGAL rule registry; source domain supplies authority reference | Deterministic applicability |
| Applicability Context | No | Identity, organization, entitlement, workflow domains | Read server-authoritative facts |
| Packet Definition Reference | No in DGAL-1 | Future DGAL composition | Reserved reference only |
| Tour Step | No | Tour/Experience | Future guidance reference contract |
| Orientation Completion | No | Experience or service domain | Never inferred as acknowledgment |
| Document Instance | No | Owning service/report/credential domain | Future DGAL index/reference |
| Packet Instance | No | Future DGAL-3 | Not implemented |
| Acknowledgment | No | Owning service/Legal | Requirement metadata only |
| Agreement | No | Legal/Service Agreements | Existing authority preserved |
| Signature Request/Record | No | Future DGAL-5 + Legal | No provider or lifecycle implemented |
| Manual Signature | No | Future DGAL-4/5 + Evidence | Not implemented |
| Evidence | No | Evidence domain | DGAL may reference it later |
| Retention | No | PR-2 retention/legal-hold authority | Classification metadata only |
| Legal Hold | No | Legal/PR-2 | No duplicate lifecycle |
| Service Agreement | No | Service Agreements/Legal | Requirement may reference status |
| Workflow completion | No | Service domain | Input fact only |
| Domain approval | No | Owning domain | Never granted by DGAL |

## 7. Existing Authority Reuse

The resolver is designed to consume existing organization identity/tenant context, Service Catalog entitlements, onboarding state, CivicSure evidence requirements, Studio workflow state, ARAG work orders, Agent Fabric policies, Curriculum completion policies, Career pathways, Legal/service agreements, Evidence/source assets, Reporting template patterns, and PR-2 retention metadata by reference. No state machine was copied into DGAL.

## 8. Registry Architecture

The canonical bounded domain is `apps/shs-api/src/domain/documentation/`. Its repository owns SQL persistence and its service enforces registry permission, organization scope, safe action references, version transitions, and resolution semantics. The migration is `132_dgal_registry_requirement_rules.sql`.

## 9. Document Type Model

`dgal_document_types` provides stable IDs and keys, title/description, owning domain, default classification, source reference, and lifecycle status. It does not represent a generated or issued document.

## 10. Guidance Item Model

`dgal_guidance_items` stores concise explanation, source domain/reference, bounded route/action reference, audience roles, optional service and organization scope, classification, status, and version number. External URLs and scheme-based navigation are rejected.

## 11. Guidance Collection Model

`dgal_guidance_collections` plus ordered `dgal_guidance_collection_items` provide reusable ordered references. Collection membership does not imply workflow completion or legal acknowledgment.

## 12. Template Model

`dgal_document_templates` identifies a document type, owning domain, service, canonical source owner, content reference, scope, and status. It is metadata, not a renderer or content editor.

## 13. Template Version Model

`dgal_template_versions` stores stable version IDs, template/version uniqueness, revision, source reference, effective/superseded timestamps, classification, optional content hash, approval reference boundary, and creator reference. It does not store signed artifacts.

## 14. Version / Supersession Rules

Version numbers and revisions are unique per template. Activation explicitly supersedes the previous active version. The service exposes no in-place mutation path for historical versions; future changes require a new version. An active-version partial unique index prevents two active versions for one template.

## 15. Requirement Rule Model

`dgal_requirement_rules` stores owning domain, service/organization/role/workflow/resource selectors, policy reference, document/template/guidance target, requirement type, required flag, entitlement requirement, source reference, safe action reference, effective interval, priority, status, and scope. Rules contain explicit queryable fields; they do not contain executable code.

## 16. Requirement Input Context

The resolver accepts actor-derived organization/tenant context plus bounded service, entitlement, role, workflow, resource, relationship, policy, and time context. The actor's active organization and derived tenant are authoritative. A supplied organization or tenant that differs from the actor is rejected.

## 17. Requirement Resolution Algorithm

1. Resolve and validate actor organization/tenant.
2. Resolve service entitlement from the canonical entitlement tables when service context is present and no trusted entitlement status was supplied.
3. Return `UNKNOWN` when entitlement authority is unavailable.
4. Load active global and actor-organization rules valid at the requested time.
5. Apply organization type, relationship, role, service, entitlement, workflow, resource, and policy predicates.
6. Group duplicate targets, apply explicit priority, preserve all source references, and reject same-priority required/optional conflicts.
7. Return ordered, explainable requirements or explicit `NO_REQUIREMENTS`.

## 18. Explainability

Each resolved item includes rule ID/key, requirement type, required flag, title, explanation, source domain/reference(s), service/workflow/resource context, document/template/guidance references, action reference, priority, and active template version reference where available.

## 19. Unknown / Fail-Closed Semantics

`NO_REQUIREMENTS` means authoritative evaluation completed and no rule applied. `UNKNOWN` means required authority is missing or conflicting, with an explicit unresolved reason such as `service_entitlement` or `conflicting_rules:<target>`. The resolver never converts unavailable entitlement authority into an empty successful result.

## 20. Requirement Deduplication

Rules targeting the same template, document type, or guidance item are deduplicated deterministically by priority and rule key. All contributing source references remain in the output. A higher-priority rule wins presentation metadata; it does not erase provenance.

## 21. Requirement Conflict Handling

Same-target rules with equal priority and conflicting required flags return `UNKNOWN` with a conflict reason. No database or load-order accident decides mandatory status.

## 22. Organization / Tenant Scope

Tenant-scoped rows require matching `organization_id` and `tenant_id = tenant:<organization_id>`. Queries include global rows and only the actor's matching scoped rows. Service methods reject client attempts to widen organization context.

## 23. Service / Entitlement Scope

Service-specific rules require active entitlement unless explicitly configured as pre-entitlement. Missing entitlement authority is unresolved; known non-active entitlement prevents protected service requirements from being presented as actionable.

## 24. Role / Permission Scope

Rule role selectors are matched against server-derived actor roles. Registry writes require `documentation.registry.manage`; no organization admin is implicitly made a global template publisher.

## 25. Workflow / Resource Scope

Workflow stage/type, resource type, relationship, and policy selectors are optional explicit predicates. DGAL does not invent those facts or approve the underlying workflow/resource.

## 26. Source Domain References

Every rule requires an owning domain and source reference. The schema supports source authorities such as CivicSure, Studio, Agent Fabric, ARAG, onboarding, Curriculum, Career, BOS, Legal, and SHF programs without making those domains subordinate to DGAL.

## 27. Legal Boundary

Legal owns legal meaning, enforceability, official agreement content, approval, and legal hold decisions. DGAL only registers references and requirement metadata.

## 28. Evidence Boundary

There is no DGAL evidence table. Future document or acknowledgment instances will reference canonical Evidence/source assets.

## 29. Truth Boundary

Registry and resolution results are not Truth facts and do not write Truth Spine projections.

## 30. Retention Boundary

Classification fields prepare future document metadata for PR-2. DGAL does not implement retention, archival, deletion, export, or legal hold.

## 31. Reporting Boundary

Reporting remains owner of report templates/rendering/artifacts. DGAL does not clone or migrate report templates.

## 32. Credential Boundary

Certificates and diplomas remain Credentials-owned. DGAL may reference them in future guidance but does not issue them.

## 33. Tour Boundary

No TourProvider or broad tour behavior changed. Bounded action references and contextual keys are available for DGAL-2 integration.

## 34. Companion Boundary

Learning Companion was not modified. Its future projection can consume deterministic DGAL results as explanation-only presentation data.

## 35. Safe Action / Return Target Contract

Action references are optional bounded internal references. Absolute URLs, protocol-relative URLs, `javascript:`, and `data:` references are rejected. Route execution and exact return behavior remain DGAL-2 concerns.

## 36. Security / Privacy

The implementation prevents cross-organization scoped reads through actor context checks and scoped SQL predicates, rejects unsafe action references, defaults classification to `INTERNAL`, keeps public status explicit, and does not expose source payloads or Evidence content.

## 37. Audit Events

DGAL-1 does not create a second audit ledger. Registry mutation audit integration remains bounded for the registry write surface and can use the existing audit-event authority in the subsequent API integration work; the current service has no public write route.

## 38. Database / Migration

Migration 132 creates the registry/rule tables, foreign/reference links, lifecycle checks, scope-pair checks, active-version uniqueness, safe-action checks, effective-date checks, and resolution indexes. It was applied successfully to isolated database `dgal1_acceptance_20260912` through the complete migration chain.

## 39. API Surface

No production route was added. The service/repository boundary is ready for later bounded internal/API exposure with explicit registry permissions. DGAL-2 and later phases own user-facing projection surfaces.

## 40. Test Coverage

`apps/shs-api/tests/dgal-registry-requirements.test.ts` covers version supersession, deterministic resolution, source preservation during deduplication, entitlement unknown state, cross-org rejection, missing actor context, equal-priority conflicts, and unsafe action references. The migration was run in isolation and API typecheck passed.

## 41. DGAL-GAP-001 Closure

RESOLVED. Durable tables and repository methods now cover document types, guidance items/collections, templates, versions, ownership, scope, status, source references, classification, and supersession. Focused tests prove stable IDs/version behavior and migration 132 proves the physical schema.

## 42. DGAL-GAP-002 Closure

RESOLVED. `DgalService.resolveDocumentationRequirements` provides deterministic server-scoped rule resolution, active entitlement input, explainable output, source preservation, deduplication, conflict detection, and explicit `UNKNOWN` versus `NO_REQUIREMENTS` semantics. Focused tests cover matching, irrelevant service exclusion, unknown authority, cross-org rejection, conflicts, and safe references.

## 43. Files Created

- `apps/shs-api/migrations/132_dgal_registry_requirement_rules.sql`
- `apps/shs-api/src/domain/documentation/model/dgal.ts`
- `apps/shs-api/src/domain/documentation/repo/dgal-repo.ts`
- `apps/shs-api/src/domain/documentation/service/dgal-service.ts`
- `apps/shs-api/tests/dgal-registry-requirements.test.ts`
- `docs/architecture/DGAL-1_CANONICAL_REGISTRY_REQUIREMENT_RULES_OWNERSHIP_FOUNDATION.md`

## 44. Files Modified

- `docs/architecture/DGAL-0_SYSTEM_WIDE_DOCUMENTATION_GUIDANCE_AGREEMENT_LAYER_AUDIT.md` — closure evidence only for DGAL-GAP-001 and DGAL-GAP-002.

## 45. Owner Work Preservation

Pre-existing PR-1 through PR-7 source changes, readiness reports, runtime artifacts, DGAL-0 report, and unrelated owner work were preserved. No reset, clean, stash, commit, push, or deletion was performed.

## 46. Validation

| Check | Result |
|---|---|
| `npx tsx --test apps/shs-api/tests/dgal-registry-requirements.test.ts` | PASS, 6/6 |
| `npm --prefix apps/shs-api run typecheck` | PASS |
| Isolated migration 132 via complete chain | PASS; applied through 132 with no pending/drift |
| Root manifests/UI/build/layer/truth/oracle/diff checks | PASS; build emitted only existing Vite chunk-size warnings |
| Combined onboarding/entitlement/agreement/Evidence/reporting/Studio regression batch | 36/40 passed; 4 shared-database contamination failures |
| Fresh isolated `organization-onboarding.test.ts` | PASS, 7/7 |
| Fresh isolated `service-agreements.test.ts` | PASS, 15/15 |

The combined batch's four failures did not reproduce on fresh isolated databases and were not caused by DGAL-1. No browser acceptance, new route, external provider, or later DGAL phase was started.

## 47. DGAL-1 Decision

DGAL-1 is COMPLETE. Both repository-local P1 gaps are resolved, the foundation is durable and test-backed, and the required authority boundaries remain explicit.

### Closure Matrix

| DGAL Gap ID | Starting Status | Work Performed | Tests | Final Status | Evidence |
|---|---|---|---|---|---|
| DGAL-GAP-001 | OPEN — P1 | Added migration 132 and bounded documentation registry for types, guidance, collections, templates, versions, ownership, scope, classification, and status | Version/supersession test; isolated migration; typecheck | RESOLVED | `dgal_document_types`, `dgal_guidance_items`, `dgal_guidance_collections`, `dgal_document_templates`, `dgal_template_versions`; 132 applied cleanly |
| DGAL-GAP-002 | OPEN — P1 | Added deterministic server-scoped requirement rule model and explainable resolver with entitlement checks, deduplication, conflict detection, safe references, and unknown state | 6 focused tests including unknown/fail-closed, cross-org, irrelevant service, source preservation, conflict, unsafe reference | RESOLVED | `DgalService.resolveDocumentationRequirements`; `dgal_requirement_rules`; focused suite 6/6 |

## 48. Exact Next Phase

**DGAL-2 — Contextual Guidance, Tour Integration & Companion Projection**

DGAL-2 has not started.
