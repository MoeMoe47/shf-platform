# Assignment Contract

The Product Registry assignment record is metadata, not identity authority and not approval authority.

Stored assignment fields:

- `assignment_id`
- `reviewer_actor_id`
- `reviewer_org_id`
- `candidate_id`
- `commercial_product_id`
- normalized allowed gates in `commercial_product_reviewer_assignment_gates`
- `effective_at`
- `expires_at`
- `assignment_status`
- `assigned_by_actor_id`
- `assignment_authority_reference`
- `reason`
- revocation metadata
- `version`
- timestamps

Assignments are scoped to one reviewer, one organization, one candidate, one canonical product id, and one or more allowed gates. `SOURCE_AUTHORITY` is modeled as an assignment gate for source-resolution work and is separate from review-gate approval.

The provisioning API allowlists request fields. Actor, assigning user, status, version, revocation fields, and audit fields are server-derived and cannot be injected by request body.

