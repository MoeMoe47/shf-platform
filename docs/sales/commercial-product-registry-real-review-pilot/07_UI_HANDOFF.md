# UI Handoff

The frozen SHF-Next reviewer UI at commit `044e679` consumes the governed backend.

Operator verification sequence:

1. Reviewer authenticates normally.
2. Reviewer opens `/ops/sales/products/reviews`.
3. Reviewer sees only assigned candidate/gate work.
4. Reviewer opens the review packet.
5. Reviewer reviews evidence references.
6. Reviewer manually submits a decision or source resolution.
7. Reviewer sees decision/source history.
8. Reassessment updates.
9. No production onboarding action exists.

Do not modify SHF-Next in 4H.
