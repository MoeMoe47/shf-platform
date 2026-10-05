# Operator Procedure

1. Generate/re-generate packets from the reviewed 4B manifest and frozen 4A onboarding manifest with `npx tsx apps/shs-api/scripts/generate-commercial-product-review-packets.mjs`. Use `REVIEW_PACKET_GENERATED_AT` when a reproducible timestamp is required.
2. Confirm candidate identity, packet version, source status, and reviewer authority. Send only references to the proper human or authoritative external-system owner.
3. Collect the decision, authority reference, evidence references, scope, reviewed/effective time, and expiry/stale threshold from that authority.
4. Have an authorized operator call the internal decision service with the exact gate capability. Do not use a generic Sales edit permission.
5. Record source resolution separately using `commercial_product.review_source_authority`; resolved source needs a canonical authority and supporting evidence.
6. For a changed decision, read the full history and explicitly supersede the latest row. Never edit the prior decision.
7. Run reassessment, inspect required, blocked, and stale gates, source status, and eligibility reason.
8. Repeat only for remaining review work. A completed review still does not imply SELL_NOW or GREEN.
9. Request separate authorization for any future production onboarding. 4C performs no automatic execution.

Current boundary: the service is internal and has no API route or operator CLI for applying decisions. Integration must add authenticated routing and organization/permission propagation in a separately approved phase. Tests use unmistakably test-only authority references and disposable PostgreSQL only.
