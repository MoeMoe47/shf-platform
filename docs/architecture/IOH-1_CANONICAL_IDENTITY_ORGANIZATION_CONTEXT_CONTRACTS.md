# IOH-1 — Canonical Identity / Organization Context Contracts

## 1. Executive Result

IOH-1 formalizes the backend-derived identity and organization context projection exposed through the existing auth response surface.

The projection is additive and does not create a new source of authority for identity, organizations, memberships, roles, permissions, entitlements, relationships, tenants, or workflow access.

## 2. Locked Owner Decisions

The following owner-approved decisions govern IOH-1:

| Decision | Locked Result |
| --- | --- |
| IOH-D001 | Active organization uses the hybrid model: the client may persist a preferred selector, but the backend validates selected organization authority. |
| IOH-D002 | Context contracts expose the minimum canonical organization context needed by downstream experience layers. |
| IOH-D003 | Entitlements are summarized in the primary context; detailed relationship semantics stay source-domain owned and separate. |
| IOH-D004 | Organization switching must revalidate authority, recompute context, invalidate stale org-scoped state, and preserve routes only when valid for the new context. |

## 3. Authority Laws

Authentication is not authorization.

Organization selection is not organization membership.

Membership is not relationship.

Role label is not permission.

Entitlement is not navigation visibility.

UI state is not backend authority.

Client-selected organization context never grants membership, role, permission, entitlement, relationship authority, or workflow authority.

## 4. Source Authorities

| Projection Area | Authority Source | IOH-1 Behavior |
| --- | --- | --- |
| Current user identity | Identity resolver / Identity Gateway | Projected in `user`. |
| Authorized organizations | Organization memberships | Projected in `authorized_organizations` without tenant internals. |
| Active organization | Server-resolved organization context | Projected in `active_organization_context` when available. |
| Membership state | Organization memberships | Projected as membership status for the active org and authorized org list. |
| Role context | Membership role attachment | Projected in `role_context`; not treated as permission authority. |
| Permission context | Backend role-permission registry | Projected in `permission_context`. |
| Entitlement summary | Service catalog entitlements | Projected in `entitlement_summary` as a bounded summary. |
| Organization status | Organization membership/org record | Projected as `organization_status`. |
| Session authority | Identity Gateway/session records | Projected in `session_authority_context`. |
| Relationship boundary | Organization relationships domain | Projected only as minimal references/boundary metadata. |

## 5. Context Contract Shape

The existing auth response now includes:

| Field | Purpose |
| --- | --- |
| `context_contract_version` | Stable IOH-1 contract marker. |
| `context_authority` | Indicates the payload is a backend-derived projection. |
| `user` | Sanitized authenticated user identity. |
| `memberships` | Backward-compatible membership projection. |
| `authorized_organizations` | Active organization list derived from active memberships and active organizations. |
| `preferred_organization_id` | Client preference hint or active org fallback; not authority. |
| `active_organization_context` | Server-derived active organization, role, permission, membership status, org status, entitlement summary, and relationship boundary. |
| `role_context` | Roles for the active organization context. |
| `permission_context` | Backend permission projection for the active organization context. |
| `entitlement_summary` | Bounded service entitlement projection. |
| `relationship_reference_boundary` | Minimal relationship boundary, explicitly not membership or entitlement authority. |
| `session_authority_context` | Session/provider/revocation projection. |

## 6. Entitlement Boundary

`entitlement_summary` is a projection owned by service-catalog authority.

It may include service key, service name, entitlement status, and effective-until metadata when that source-domain data is available.

It must not become the entitlement source of truth.

## 7. Relationship Boundary

The primary context payload exposes only minimal relationship references and boundary assertions:

| Boundary | Value |
| --- | --- |
| Relationships imply membership | `false` |
| Relationships imply entitlement | `false` |
| Relationship source | `organization_relationships` |
| Detailed relationship semantics | Source-domain sibling projection/endpoint when needed. |

## 8. Active Organization Semantics

The active organization remains server validated.

A stale, revoked, suspended, absent, or unauthorized selection must fail safely through existing organization-context resolution and permission guards.

IOH-1 does not implement organization switching UI.

## 9. Downstream Experience Contract

EXR and other experience layers may consume the IOH-1 projection for:

- current user display
- available organization list
- active organization display
- role and permission-aware composition
- entitlement-aware capability presentation
- safe no-org/no-role/no-service states

Experience layers must not infer backend authority from local UI state.

## 10. NCA Contract

Notifications may consume user identity, authorized organization IDs, membership state, active organization as contextual preference, role context, permission context, and organization status.

NCA must not create memberships or identity authority.

## 11. Deferred Scope

IOH-1 does not implement:

- organization switching UI
- membership administration
- role administration
- invitations
- MFA
- enterprise SSO/federation
- SCIM
- migrations

## 12. Validation

Focused validation exists in `apps/shs-api/tests/ioh1-context-contract.test.ts`.

The tests verify:

- canonical IOH-1 fields are present
- tenant internals are not exposed
- active organization context carries membership and organization status
- role, permission, entitlement, relationship, and session projections are explicit
- relationship references do not imply membership or entitlement
- absent active organization authority remains explicit and fail-safe

## 13. Files Created

| File | Purpose |
| --- | --- |
| `docs/architecture/IOH-1_CANONICAL_IDENTITY_ORGANIZATION_CONTEXT_CONTRACTS.md` | IOH-1 contract architecture artifact. |
| `apps/shs-api/tests/ioh1-context-contract.test.ts` | Focused IOH-1 response contract validation. |

## 14. Files Modified

| File | Purpose |
| --- | --- |
| `apps/shs-api/src/auth/auth-response.ts` | Adds the IOH-1 additive context projection to the existing auth response. |

## 15. Exact Next Phase

IOH-2 may harden multi-organization and active-organization runtime switching behavior after IOH-1 is accepted.
