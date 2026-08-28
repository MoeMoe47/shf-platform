# Organization, Tenant, and Membership Architecture

Status: Phase 2 organization relationship and program stewardship baseline.

## Canonical Organization

The persisted `organizations` table is the canonical organization identity for SHS/SHF institutional architecture. Organization means a legal, institutional, or operational entity. Compatibility views and development fixtures may continue to exist, but they must map toward the persisted organization identifier and must not become a second organization registry.

Canonical organization identity is referenced by memberships, programs, cases, operational events, Evidence attribution, Truth attribution, and reporting scope.

## Tenant Semantics

`organization_id` and `tenant_id` are distinct concepts:

- `organization_id` is business and institutional identity.
- `tenant_id` is the technical isolation and execution context.

The current runtime preserves the existing one-tenant-per-organization behavior by deriving the default tenant as `tenant:${organization_id}` through `tenantIdForOrganization()`. New code should use the tenant helper rather than scattering string construction. A later platform phase may change the mapping without changing organization identity.

When active organization context is constructed, any supplied tenant value must match the centralized mapping for the selected organization. Browser-supplied tenant values are never authority and must not override the server-derived tenant. A mismatched tenant/organization pair fails closed as invalid organization context.

## Membership Semantics

A membership is the ordinary authority relationship between a user and an organization. Active organization context is valid only when the authenticated actor has an active membership in that organization or explicit platform-global authority.

Membership checks fail closed when:

- the membership is missing;
- the membership status is not active;
- the organization status is not active;
- a multi-organization actor omits an active organization;
- an actor asks for an unauthorized organization.

## Role and Permission Scope

Roles are evaluated in the active organization context. Roles from one organization must not authorize actions in another organization.

For single-organization actors, the server may select the only active organization implicitly. For multi-organization actors, requests must provide an active organization header (`x-shs-organization-id` or `x-organization-id`) and the server validates membership before granting scoped roles and permissions.

`super_admin` and roles marked with `role_scope_type = platform` are the only explicit platform-global roles in this phase. Ordinary organization-admin roles remain organization-scoped.

## Active Organization Context

Request context exposes:

- `actor_user_id`
- `active_organization_id`
- `tenant_id`
- `membership_id`
- `organization_scoped_roles`
- `organization_scoped_permissions`

Frontend state is not authority. Browser-local role or organization values may help UX, but server-side membership and active context resolution determine authorization.

## Program and Case Isolation

Program and case reads, lists, and state changes are organization-scoped. Queries and updates must predicate on the active organization. Client-supplied `organization_id` is ignored for creation where a server actor is present.

## Organization Relationships

Organization relationships describe institutional structure between two canonical organizations. They do not create organization identity, tenant identity, membership, roles, or permissions.

The canonical relationship record is `organization_relationships`:

- `relationship_id`
- `source_organization_id`
- `target_organization_id`
- `relationship_type`
- `status`
- `effective_from`
- `effective_to`
- `created_by`
- `created_at`
- `updated_by`
- `updated_at`
- `metadata_version`

Initial relationship types are intentionally narrow:

- `INCUBATES`
- `NETWORK_MEMBER_OF`
- `OPERATES_FOR`
- `SHARED_SERVICES_PROVIDER_FOR`

Vague relationship labels such as `RELATED` or `PARTNER` are not authority-bearing relationship types. Unknown relationship types fail closed.

## Relationship Lifecycle

Relationship lifecycle values are:

- `PROPOSED`
- `ACTIVE`
- `SUSPENDED`
- `ENDED`

Only an `ACTIVE` relationship within its effective date range may be recognized by stewardship validation. Proposed, suspended, ended, future-dated, expired, unknown, or invalid relationships grant no authority. End dates cannot precede start dates. Historical relationships are preserved as records and must not be rewritten to change prior facts.

Authoritative relationship transitions are server controlled. Clients request only the next status and command metadata; they do not provide the current status. The explicit Phase 2 transition matrix is:

```text
PROPOSED -> ACTIVE
PROPOSED -> ENDED
ACTIVE -> SUSPENDED
ACTIVE -> ENDED
SUSPENDED -> ACTIVE
SUSPENDED -> ENDED
ENDED -> no further transitions
```

Relationship transitions must load the stored current status, validate it against this matrix, and update atomically with an expected-current-status predicate. A stale or concurrent update returns a safe conflict. Every transition records audit evidence containing the authoritative before status, after status, actor, active organization, relationship ID, and timestamp through the existing audit table.

The database prevents materially duplicate active relationships for the same source organization, target organization, relationship type, and overlapping effective time window. Historical `ENDED` relationships remain valid and insertable.

## Program Stewardship

A program is a mission activity or service, not an organization. Program stewardship attaches organization responsibility to a program without merging program identity and organization identity.

The `programs` model is extended with:

- `program_classification`
- `owner_organization_id`
- `operator_organization_id`
- `accountable_organization_id`

Initial classifications are:

- `SHF_OWNED`: institutionally owned and governed by SHF. The owner and accountable organization are normally SHF; operator may be SHF or another explicitly authorized organization.
- `SHF_INCUBATED`: developed under SHF incubator support. Incubation does not make the program an independent legal organization and does not grant every SHF user access.
- `INDEPENDENT_NETWORK`: belongs to an independent network organization. Network participation does not grant SHF ordinary administrative authority over that organization.

Owner and operator are distinct. Owner privileges do not automatically become operator privileges, and operator privileges do not automatically become owner privileges. Accountable organization is explicit and must remain within the approved stewardship context.

## Authority Boundaries

Organization relationships do not automatically grant permissions. Every protected operation still requires:

```text
authenticated user
→ active organization context
→ active membership or explicit platform-global authority
→ scoped role
→ required permission
→ authorized resource scope
```

Forbidden implicit access:

- network membership does not grant SHF admin access;
- incubation does not grant every SHF user cross-organization access;
- shared-service participation does not grant unrestricted record access;
- browser-supplied relationship or stewardship claims grant no authority;
- expired, inactive, suspended, ended, future, or unknown relationships grant no authority.

Program reads are allowed only when the active organization is directly represented in the program stewardship scope. Program operational transitions are scoped to the operator or accountable organization. Cross-organization stewardship at creation requires an active recognized relationship or explicit platform-global authority.

Program lifecycle transitions are also server-authoritative. Clients request the target status only. The service reads the persisted current status, validates the existing program transition matrix, and writes with a compare-and-set predicate over the authorized program and expected stored status. Concurrent attempts from the same original status cannot both succeed. Transition audit records use the existing audit boundary and contain the authoritative before and after statuses.

## Truth, Evidence, and Reporting

This phase preserves the existing operational event, Evidence, Truth, Metric Registry, Report Registry, and Reporting Service contracts. Organization attribution remains actor-derived from active organization context. Network aggregation and funder reporting remain out of scope.

## Migration and Deployment Requirements

Phase 2 introduces additive schema through `032_organization_relationships_program_stewardship.sql`. It must be reviewed and applied through the approved migration process before production code depends on the new persistent columns or table. This implementation and its tests do not run production migrations and do not mutate real persistent data.

Legacy program rows may have null stewardship columns until migrated or backfilled. Runtime reads preserve legacy organization scoping by treating `organization_id` as the fallback owner/operator/accountable scope for existing rows.

Migration 032 is safe to apply before seed data: relationship permissions are attached to `role_org_admin` only when that role already exists. Deployments that require organization admins to manage relationship records must ensure role seed/backfill ordering through the approved deployment process, then verify the permission rows. Before applying the duplicate-active exclusion constraint to an existing database, operators must run the included precheck path and resolve overlapping active relationship records rather than silently merging data.

Remaining deployment requirements before relying on this phase in production are: apply migrations through isolated validation first, confirm PostgreSQL supports the `btree_gist` extension required by the active-overlap exclusion constraint, verify role permission rows exist after seed/backfill ordering, and run repository-level SQL isolation checks against disposable infrastructure.

## Deferred Later-Phase Concepts

The following are explicitly deferred:

- fiscal sponsorship
- fiscal sponsorship accounting
- fund custody
- consolidated funder reporting
- shared-service entitlements
- shared-service billing
- network impact aggregation
- funder reporting
- organization onboarding automation
- related-party governance
- conflict-of-interest workflow
- SHF/SHS intercompany authority
- automatic tenant creation
- automatic role assignment
