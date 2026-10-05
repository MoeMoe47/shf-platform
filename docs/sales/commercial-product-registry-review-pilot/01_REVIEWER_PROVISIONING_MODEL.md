# Reviewer Provisioning Model

## Existing authority

Capabilities are named in `SHS_SECURITY_PERMISSIONS` and the Product Registry governance contract. Production Identity joins active users, memberships, organizations, roles, and `role_permissions`; `resolveActiveOrganizationContext` selects the active membership's permission set. Multi-organization users must select an active organization, and permissions are taken from that organization context rather than merged across ordinary memberships.

Membership assignment, role change, and revocation are handled by the existing Identity membership service and audited to canonical `audit_events`. Revocation changes membership status/effective end or changes the assigned role. Production identity lookup runs for authenticated session requests, so subsequent requests lose capabilities after revocation. `memberships.effective_to` is filtered by production lookup, but `/identity/memberships` assignment currently accepts no expiry field.

## Profile model

The 15 profiles in `reviewer-provisioning-plan.json` are **operational provisioning profiles**: exact capability bundles used by an Identity administrator when creating or selecting an organization-scoped role. They are not global roles and create no parallel permission source. Each bundle contains read plus one gate capability; source authority receives only source resolution. No profile includes create/edit, lifecycle transition, retirement, readiness-state, sellability-state, or onboarding capability.

The current codebase has no general role-creation/role-permission administration API. An authorized Identity administrator must provision the organization-scoped role and its `role_permissions` through the existing approved Identity administration process. Do not assign a review capability to a Sales-wide role. The disposable acceptance inserts clearly test-only role fixtures, then uses the real Identity repository/context and membership service.

## Scope limitations

Product Registry is global canonical. Every user holding `commercial_product.read` can read all manifest-backed review packets. Gate capabilities apply across the candidate set; candidate-to-reviewer assignment is not checked by 4D. `assigned_candidate_ids` is therefore an operator routing record only. Do not use it as proof of API authorization. A future scoped assignment policy must be added to the canonical review authorization path before claiming candidate isolation.
