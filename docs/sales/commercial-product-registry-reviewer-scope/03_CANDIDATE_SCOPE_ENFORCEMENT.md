# Candidate Scope Enforcement

Decision writes call the review service, which validates candidate/product identity, validates the gate contract, checks the actor capability, opens a transaction, rechecks active Identity membership with the required capability, locks the candidate/gate stream, and locks the matching active assignment row.

A decision is rejected unless the assignment matches:

- reviewer actor
- active organization
- candidate id
- canonical commercial product id
- gate type
- active/effective/non-expired/non-revoked state

Read paths are also scoped. A restricted reviewer sees only assigned candidates and assigned gates. Packet data, queue entries, decision history, source-resolution history, and reassessment output are filtered to the assignment scope unless the actor also has explicit `commercial_product.review.read_all` authority backed by active Identity membership.

