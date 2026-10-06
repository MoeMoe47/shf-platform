# Dry-Run And Activation

Dry-run returns:

- operator identity and organization;
- reviewer identity and memberships;
- current reviewer capabilities;
- proposed candidate and gate;
- `effective_at`;
- `expires_at`;
- existing assignment conflicts;
- expected queue impact;
- confirmation that no mutation occurred.

Example dry-run:

```bash
npx tsx apps/shs-api/scripts/commercial-product-real-review-pilot.ts \
  --operator user_real_operator \
  --user user_real_reviewer \
  --org org_real \
  --candidate cc-001 \
  --gate LEGAL \
  --effective-at 2026-10-06T14:00:00.000Z \
  --expires-at 2026-10-13T14:00:00.000Z \
  --authority-reference pilot-authz://operator-ticket/123 \
  --reason "Controlled 4H pilot assignment"
```

Activation uses the same command plus `--confirm`. There is no bulk mode and no wildcard mode.
