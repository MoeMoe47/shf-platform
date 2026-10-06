# Operator Provisioning

Canonical operator path:

1. Locate the existing real user in Identity.
2. Verify active organization.
3. Verify active membership and effective window.
4. Verify role permissions contain `commercial_product.read`.
5. Verify gate capability, such as `commercial_product.review_legal`.
6. Verify operator has `commercial_product.review_assignment.manage`.
7. Verify candidate exists in the controlled review manifest.
8. Verify candidate/product identity matches.
9. Verify single gate scope.
10. Verify `effective_at` and required `expires_at`.
11. Run dry-run.
12. Activate with explicit `--confirm` only after operator approval.
13. Verify audit event.
14. Verify reviewer queue visibility.

The operator script is `apps/shs-api/scripts/commercial-product-real-review-pilot.ts`.

It requires explicit `--operator`, `--user`, `--org`, `--candidate`, `--gate`, `--effective-at`, `--expires-at`, `--authority-reference`, and `--reason`. It defaults to dry-run. Mutation requires `--confirm`.

It never creates users or memberships.
