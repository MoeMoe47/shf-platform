# SHF Hybrid Phase 3 Service Catalog Entitlements V1

## Canonical Owner

Phase 3 introduces `apps/shs-api/src/domain/service-catalog` as the smallest shared-infrastructure domain for organization-level service catalog and entitlement governance.

This domain does not replace Identity/Auth, organization relationships, tenant resolution, user roles/permissions, Truth/Evidence, Reporting, or the Master Layer Registry. It reuses those systems and adds only the institutional answer to: which SHF infrastructure services is an organization entitled to use?

## Audit Findings

Repository audit classification:

- CANONICAL_SERVICE_CATALOG: none found before Phase 3.
- CANONICAL_ENTITLEMENT: none found before Phase 3 for organization-level institutional services.
- REUSABLE_CAPABILITY_MODEL: existing domain permissions in `auth/security-permissions.ts`, active organization context, canonical organization table, organization relationships, audit events, Reporting, Curriculum Catalog, Studio, Truth/Evidence, Career/Workforce domains.
- FEATURE_FLAG_ONLY: frontend/browser visibility and hardening registries mention feature flags but are not authoritative entitlement truth.
- USER_PERMISSION_ONLY: roles such as `org_admin`, `shf_admin`, `student`, and permissions such as `reports.view`, `curriculum.catalog.manage`, `studio.project.view`.
- TENANT_CONFIG_ONLY: `tenant:${organization_id}` runtime scoping helpers; not entitlement identity.
- PRESENTATION_ONLY: root/app UI route and admin shell labels.
- MOCK_OR_SEED: local dev demo orgs/users, test fixtures, static frontend mocks.
- LEGACY: archived and backup references under `_archive`, `_backup*`, `_frozen_checkpoints`, and built `dist`.
- CONFLICT: none found that already claimed canonical organization service entitlement ownership.
- UNKNOWN: broad docs/planning references to services/packages/plans without backend authority.

## Service Key Semantics

`service_key` is the stable machine identifier. Display names can change without altering entitlement identity. Entitlements reference `service_id`, and services are looked up by stable key at runtime.

Initial active canonical service keys are:

- `curriculum`
- `reporting`
- `project_studio`
- `truth_evidence`
- `career_workforce`

Facilities, grant support, onboarding, billing, service agreements, and SHF/SHS settlement are deferred.

## Provider Semantics

Each service has `provider_organization_id`. Current bootstrapped services are SHF-provided when `org_shf_001` exists. The schema supports future SHS or third-party providers without implementing commercial settlement.

## Entitlement Semantics

An organization service entitlement answers whether an organization may consume a catalog service under current institutional conditions. It is not a user permission and does not grant user actions by itself.

Runtime access composes:

1. authenticated actor
2. active organization context
3. organization service entitlement
4. actor permission
5. resource/domain authorization

Missing or inactive entitlement fails closed for protected network services.

## Lifecycle

Supported entitlement states:

- `ACTIVE`
- `SUSPENDED`
- `REVOKED`
- `EXPIRED`

Suspended and revoked entitlements deny access while preserving history. Effective dates are evaluated server-side when present.

## Relationship Preconditions

Relationships establish eligibility only. They do not grant services.

Current SHF-provided catalog rows can require `NETWORK_MEMBER_OF`. Granting and runtime evaluation verify that relationship for non-provider organizations.

## Organization Vs User Authority

Entitlements are organization-scoped. Roles and permissions remain user/member-scoped. Active entitlement never bypasses `requirePermission`.

Ordinary organization actors can view their own entitlement state when granted view permission, but cannot grant/suspend/revoke services.

## Tenant Boundary

Entitlements are keyed by `organization_id`, not by `tenant:${organization_id}`. Tenant context remains a runtime/resource isolation concern after active organization resolution.

## Grant Authority

The browser may submit service key, requested status, dates, and reason. The server derives actor, provider, organization scope, timestamps, and relationship validation.

Grant/suspend/revoke requires `organization.service_entitlement.manage` and either platform authority or active organization equal to the service provider organization.

## SHF Compatibility

The provider organization may consume its own active canonical services. Migration `084` also bootstraps explicit SHF entitlement rows when `org_shf_001` exists. This prevents existing SHF operation lockout while independent network organizations still require explicit entitlements.

## Representative Enforcement

Phase 3 enforces organization entitlement checks on:

- Curriculum Catalog: `curriculum`
- Reporting: `reporting`
- Studio: `project_studio`

Each route still keeps its existing user permission checks.

## Operational Events

Entitlement changes write ordinary `audit_events` rows with action types:

- `organization.service_entitlement.granted`
- `organization.service_entitlement.suspended`
- `organization.service_entitlement.revoked`

These are administrative audit facts only.

## Truth / Evidence Boundary

Entitlements are governance configuration. They do not create Evidence, impact facts, verified outcomes, completions, or Truth Spine records.

## Funding Boundary

Phase 3 does not implement grants, awards, subscriptions, invoices, restricted funds, payment, pricing, or billing.

## SHF / SHS Boundary

Provider identity is explicit for future SHF/SHS or third-party service ownership. Phase 3 does not implement SHS invoices, related-party billing, intercompany settlement, procurement, or commercial terms.

## Deferred Phase 4 Onboarding

Phase 4 may consume Organization, organization relationships, service catalog, and organization entitlements to implement candidate approval, network membership lifecycle, service provisioning, activation, suspension, graduation, and exit.
