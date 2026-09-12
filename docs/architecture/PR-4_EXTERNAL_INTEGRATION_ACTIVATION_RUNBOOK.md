# PR-4 External Integration Activation Runbook

This runbook activates only an already-approved provider. It contains no
secret values and does not authorize provider, merchant, legal, or production
actions by itself.

## Authority and safety

Internal organization/tenant IDs, canonical domain records, approvals, Truth,
Evidence, payment records, and entitlements remain authoritative. Provider IDs
are mappings. `PROVIDER_VERIFIED` requires evidence from the selected provider;
configuration alone is only `CONFIGURED`. Local/test/mock adapters must never
run with `NODE_ENV=production`.

## Activation sequence

1. Name the domain owner, provider, account, organization/tenant mapping, and
   approved data scope.
2. Obtain the provider account and credentials through the approved external
   process. Inject secret names through PR-1 runtime configuration; never put
   values in source, reports, logs, or frontend bundles.
3. Configure sandbox/test endpoints first, including callback destination,
   scopes, timeout, retry, and environment.
4. Run the provider-specific safe smoke test. Record provider, operation,
   external reference, correlation ID, environment, result, and timestamp.
5. Verify callback signature/authentication, duplicate delivery behavior,
   exact organization/tenant mapping, state normalization, and outage behavior.
6. Activate production only after provider owner acceptance and a separate
   production smoke/readback record. Never infer production readiness from a
   local or sandbox result.

## Required secret names

Use provider-specific runtime names such as `REGISTRY_API_KEY`,
`CALENDAR_CLIENT_SECRET`, `PAYMENT_PROVIDER_SECRET`, `PAYMENT_WEBHOOK_SECRET`,
or the existing canonical names for that adapter. Store references, not
values, in deployment configuration and rotate by replacement plus revocation
of the old credential.

## Provider checks

- Registry/WF-049: submit an approved package, read status back, verify failure
  and retry, and retain the provider reference. Do not claim completion for the
  local Registry result.
- Calendar/live learning: verify OAuth scope, account mapping, event identity,
  update/cancel, timezone, and revoked-token behavior.
- Email: verify sender identity, test delivery, bounce/failure handling, and
  sensitive-data minimization.
- Payments: use hosted/tokenized collection, signed webhooks, idempotency,
  environment separation, reconciliation, and no raw card data.
- Identity: complete provider tenant/MFA/federation evidence under PR-1; do not
  create a second identity path.
- Storage: verify private scoped access, encryption, lifecycle, checksums, and
  PR-2 backup/restore compatibility.
- MCP/models: verify allowlisted tools/resources, policy/input-security,
  approval, audit, revocation, and WF-040 restrictions.

## Disable and revoke

On compromise, provider outage, or failed acceptance: mark the integration
`UNAVAILABLE` or disabled, stop new state-changing calls, disable callbacks,
revoke/rotate credentials, preserve canonical audit/provider references, and
reconcile uncertain state. Do not delete canonical history or silently fall
back to fixtures.

## Evidence packet

Record configuration key names, environment, provider/account reference,
scopes, adapter version, test operation, correlation ID, result, failure
handling, callback verification, scope check, and owner approval. Exclude
secret values, raw tokens, payment card data, and unnecessary payloads.
