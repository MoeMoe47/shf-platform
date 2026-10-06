# Identity Integration

Identity owns users, organization memberships, roles, and capabilities. 4F does not create duplicate user tables, membership tables, roles, or permission registries.

Reviewer assignment checks use canonical Identity state:

- The actor must be authenticated and have active organization context.
- `tenant_id` must match `tenant:${active_organization_id}`.
- The user, organization, and membership must be active.
- Membership effective dates are evaluated at the server/database boundary.
- Required capabilities are read from canonical role permissions, with the existing role-permission map as fallback where appropriate.

Review writes require both the gate capability and active assignment. Assignment creation/revocation requires the separate `commercial_product.review_assignment.manage` capability. `sales.admin`, `commercial_product.edit`, and gate-review permissions do not imply assignment-management authority.

