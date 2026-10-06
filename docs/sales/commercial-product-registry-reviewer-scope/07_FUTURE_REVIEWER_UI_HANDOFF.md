# Future Reviewer UI Handoff

No Reviewer UI was started in 4F.

Future UI work should use the existing authenticated API operations:

- `GET /commercial-product-reviewer-assignments/mine` for a reviewer to see active assignment scope.
- `GET /commercial-product-reviews` for the scoped queue.
- `GET /commercial-product-reviews/:candidateId/packet` for scoped packet detail.
- `POST /commercial-product-reviews/:candidateId/decisions` for gate decisions.
- `POST /commercial-product-reviews/:candidateId/source-resolutions` for source tasks.

Provisioning UI, if built later, must be limited to users with `commercial_product.review_assignment.manage`, must not permit self-assignment, and must not expose raw actor/org/status/revocation/version/audit injection fields.

The UI must not represent assignment as approval. It should display expiry, revocation, gate scope, candidate identity, and organization context prominently.

