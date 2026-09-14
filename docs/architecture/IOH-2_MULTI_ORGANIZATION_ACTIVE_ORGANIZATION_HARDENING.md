# IOH-2 — Multi-Organization & Active Organization Hardening

## 1. Executive Result

IOH-2 hardens the existing server-authoritative active organization model. The repository now has a canonical transition contract around the existing active organization resolver, preferred organization remains a non-authoritative selector, and context responses include invalidation, route-validity, and safe-landing signals for downstream experience layers.

No duplicate identity, organization, membership, role, permission, entitlement, relationship, or tenant authority was introduced.

## 2. Repository Baseline

| Check | Result |
| --- | --- |
| Worktree | `/Users/mikeslate/Projects/shrv1-codex-next` |
| Branch | `codex/identity-org-hardening` |
| Starting HEAD | `95e6833f053da5f9cc501f256f4b8a0a14995dae` |
| Dependency state | `package-lock.json` present; `node_modules` was missing, then installed with `npm ci` inside this worktree only. |
| Git safety | No commit, no push, no migration. |

## 3. IOH-1 Inputs

IOH-1 supplied the additive context projection in `apps/shs-api/src/auth/auth-response.ts`. IOH-2 extends that contract to version `ioh-2.context.v1` and adds active organization transition signals.

## 4. Active Organization Resolver

The canonical authority remains `resolveActiveOrganizationContext()` in `apps/shs-api/src/auth/organization-context.ts`.

IOH-2 adds `resolveOrganizationContextTransition()` beside it. The transition helper wraps the canonical resolver and returns:

- selected organization
- selection source
- ignored preferred organization
- failure code
- safe landing reason
- stale-state invalidation
- route-validity contract

## 5. Preferred Organization

Preferred organization is a convenience selector only. It can be supplied with `x-shs-preferred-organization-id`, but the backend validates it against active membership, organization status, tenant scope, and platform authority. Stale preferred orgs are ignored.

## 6. Authorized Organization Set

`authorized_organizations` remains server-derived from active memberships and active organizations. Revoked memberships and suspended organizations do not appear in the authorized set.

## 7. Multi-Org Semantics

| Scenario | Authorized Orgs | Preferred Org | Active Org | Role | Entitlements | Expected |
| --- | --- | --- | --- | --- | --- | --- |
| Single active org | Org A | none | Org A | Org A role | Org A summary | Auto-resolve safely. |
| Multi-org explicit A | Org A, Org B | none | Org A | Admin | Service X active | Org A role/permissions/entitlements. |
| Multi-org explicit B | Org A, Org B | none | Org B | Operator | Service X absent | Org B role/permissions/entitlements. |
| Preferred authorized B | Org A, Org B | Org B | Org B | Operator | Org B summary | Preferred org accepted after server validation. |
| Preferred stale C | Org A | Org C | Org A | Org A role | Org A summary | Stale preferred org ignored. |
| No authorized org | none | any | none | none | none | Safe no-org context. |

## 8. Organization Switching

Switching is represented as a server-side context transition. Requested org is strict: if the client requests an unauthorized, revoked, suspended, nonexistent, or tenant-mismatched org, the transition fails and clears stale org-scoped state.

| From | To | Authorized? | Route Valid? | Expected Result |
| --- | --- | ---: | ---: | --- |
| Org A | Org B | Yes | Yes | Recompute role/permission/entitlement context and preserve only valid route. |
| Org A | Org B | Yes | No | Recompute context and signal safe landing. |
| Org A | Org C | No | No | Deny transition; no privilege gain; clear stale org-scoped state. |
| Org A | Suspended Org | No | No | Fail with `ORG_SUSPENDED`. |
| Org A | Revoked membership | No | No | Fail with `MEMBERSHIP_REVOKED`. |

## 9. Invalid Switch

Invalid requested orgs return `ok: false`, no active context, a safe landing reason, and invalidation instructions. The canonical resolver still throws for forbidden requested orgs.

## 10. Revoked Membership

Revoked membership is classified as `MEMBERSHIP_REVOKED`. It cannot remain active and does not appear in `authorized_organizations`.

## 11. Suspended Organization

Suspended/non-active organization is classified as `ORG_SUSPENDED`. Operational access is not blindly preserved.

## 12. Role Recalculation

Roles are derived from the selected membership. Tests prove Org A `org_admin` does not leak into Org B `operator`.

## 13. Permission Recalculation

Permissions are derived from selected membership permissions or backend role permission mapping. Tests prove Org A `program.create` does not leak into Org B.

## 14. Entitlement Recalculation

Selected membership entitlement summaries are propagated into the auth context projection. Tests prove Org A `project_studio` entitlement summary does not leak into Org B.

## 15. Tenant Isolation

Tenant derivation still uses `resolveTenantForOrganization()`. Tenant mismatch returns `TENANT_ORG_MISMATCH` and safe landing reason `TENANT_MISMATCH`.

## 16. Route Validity Contract

IOH exposes `route_validity_contract` as experience input only. It includes:

- active organization
- membership status
- organization status
- role context
- permission context
- entitlement summary

EXR decides route composition and presentation.

## 17. Safe Landing Contract

Safe landing reasons include:

- `OK`
- `NO_ORG`
- `NO_ORG_SELECTED`
- `UNAUTHORIZED_ORG`
- `MEMBERSHIP_REVOKED`
- `ORG_SUSPENDED`
- `TENANT_MISMATCH`

The response explicitly states `experience_layer_decides_destination: true`.

## 18. Stale Client State

IOH-2 adds `src/system/identity/organizationContextPreference.js`, which can clear bounded org-scoped client state when the backend returns invalidation signals. It does not clear unrelated global preferences.

| Change | Old State | Required Invalidation | Safe Result |
| --- | --- | --- | --- |
| Org A to Org B | Org A data, role, entitlements | Clear org-scoped state, role, permission, entitlement context | Org B context only. |
| Membership revoked | Org A active | Clear org-scoped state | No active org / revoked state. |
| Org suspended | Org active | Clear operational state | Suspended-org safe state. |
| Stale preferred org | Preferred C | Ignore preferred C | Server fallback or no-org state. |
| Session expired | Prior auth state | Clear auth/org state | Unauthenticated state. |

## 19. Multi-Tab Decision

Classification: `CONTRACT_ONLY` for IOH-2. The invalidation contract is in place; browser cross-tab synchronization can be implemented later if EXR chooses a shared shell mechanism.

## 20. Reload Behavior

Reload calls `/auth/me`; the frontend may send preferred org as a selector. The server validates it and reconstructs active context or safely returns no-org/selection-required state.

## 21. Session Expiry

Expired or missing sessions return unauthenticated state. Active organization state is not authority without a valid session.

## 22. No-Org State

No authorized org returns a safe context with no active organization, no permissions, invalidation, and safe landing reason `NO_ORG`.

## 23. No-Role State

Unknown role produces no permission projection. It does not fall back to operator/admin.

## 24. No-Entitlement State

Authorized organization can remain valid with an empty entitlement summary. Authorization to organization and service entitlement remain distinct.

## 25. Platform Authority

Platform authority remains explicit through platform-scoped role handling in `isPlatformGlobalRole()`. IOH-2 does not model platform admins as fake memberships in every org.

## 26. Auditability

No new audit events were added. IOH-2 context transition is a projection/validation operation and does not mutate membership, role, entitlement, or relationship authority.

## 27. Privacy

Base context exposes minimum necessary organization identifiers, membership IDs/status, role labels, permissions, bounded entitlement summary, and relationship reference boundary. It does not expose full member lists or private contacts.

## 28. EXR Boundary

IOH provides organization context data, invalidation signals, route-validity inputs, and safe-landing reasons. EXR decides shell placement, navigation, route composition, and presentation.

## 29. NCA Boundary

NCA may consume authorized org IDs, recipient identity, memberships, role/permission context, and organization status. NCA must not create membership or identity authority, and active org remains contextual preference only.

## 30. Security Tests

| Attack/Failure | Expected Control | Test Evidence |
| --- | --- | --- |
| Unauthorized org switch | Denied, no context mutation | `IOH-2 requested organization is strict...` |
| Stale preferred org | Ignored, fallback only if safe | `preferred organization is non-authoritative...` |
| Revoked membership | `MEMBERSHIP_REVOKED` | `revoked memberships...` |
| Suspended org | `ORG_SUSPENDED` | `suspended organizations...` |
| Org A role leak | Role recomputed | `switches active organization...` |
| Org A permission leak | Permission recomputed | `switches active organization...` |
| Org A entitlement leak | Entitlement recomputed | `switches active organization...` |
| Tenant mismatch | `TENANT_ORG_MISMATCH` | `tenant boundaries...` |
| Client org spoof | Canonical resolver denies | `requested organization is strict...` |
| No-org state | Safe no-org | `no-org and no-role states...` |

## 31. Positive Tests

Positive tests cover single-org fallback through existing org/tenant tests, multi-org switching, authorized preferred org, stale preferred fallback, switch A to B, reload with preferred org, role recomputation, entitlement recomputation, permission recomputation, and canonical context response shape.

## 32. Regression Tests

IOH-1 contract tests pass against `ioh-2.context.v1`. Production identity provider and Auth0 provider contract tests pass. Broader org/tenant tests are runnable after `npm ci`.

## 33. Validator

`scripts/validate-ioh-multi-org-context.mjs` validates:

- active org resolver exists
- preferred org is non-authoritative
- authorized org list canonical
- roles/permissions/entitlements recompute per org
- revoked/suspended/no-org states are represented
- stale client state invalidation exists
- route-validity contract exists
- EXR/NCA boundaries are documented

Run with `npm run ioh:multi-org:validate`.

## 34. Migration State

NO_MIGRATION_EXPECTED. Existing identity, membership, organization, tenant, role, permission, and entitlement data can represent IOH-2 context.

## 35. P0 / P1 Findings

| Severity | Count | Notes |
| --- | ---: | --- |
| P0 | 0 | No confirmed auth bypass, tenant isolation failure, or cross-org authority grant. |
| Repository-local P1 | 0 | IOH-2 runtime context hardening is represented and validated locally. |

## 36. Files Created

| File | Purpose |
| --- | --- |
| `apps/shs-api/tests/ioh2-multi-org-context.test.ts` | Focused IOH-2 resolver/context tests. |
| `src/system/identity/organizationContextPreference.js` | Frontend preferred-org and stale-state invalidation adapter. |
| `scripts/validate-ioh-multi-org-context.mjs` | IOH-2 validator. |
| `docs/architecture/IOH-2_MULTI_ORGANIZATION_ACTIVE_ORGANIZATION_HARDENING.md` | IOH-2 report. |

## 37. Files Modified

| File | Purpose |
| --- | --- |
| `apps/shs-api/src/auth/organization-context.ts` | Adds transition contract, preferred org handling, invalidation, route validity. |
| `apps/shs-api/src/auth/auth-response.ts` | Projects IOH-2 context, safe landing, route validity, selected entitlement summary. |
| `apps/shs-api/src/auth/auth-middleware.ts` | Passes preferred org selector through server validation. |
| `apps/shs-api/src/domain/identity/service/auth0-session-service.ts` | Reconstructs context from validated preferred org for reload/session path. |
| `src/system/identity/authClient.js` | Sends preferred org header as selector only. |
| `src/system/identity/authState.js` | Normalizes IOH-2 context fields. |
| `src/auth/auth-context.jsx` | Exposes IOH context fields and applies invalidation. |
| `apps/shs-api/tests/ioh1-context-contract.test.ts` | Updates contract version expectation. |
| `package.json` | Adds `ioh:multi-org:validate`. |

## 38. Git State

Working tree contains IOH-0, decision lock, IOH-1, and IOH-2 artifacts plus IOH-1/IOH-2 source/test changes. No commit or push was performed.

## 39. IOH-2 Decision

IOH-2 is complete when tests, validator, type/build checks, and `git diff --check` pass. The active organization model remains server-authoritative; preferred organization is a selector only.

## 40. Exact Next Phase

IOH-3 — Membership / Role Administration, only after explicit owner instruction.
