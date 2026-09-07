# Post-Lock Production Email Readiness

Certificate delivery uses the shared notification boundary and a provider-neutral `OutboundMailProvider`. The certificate service resolves the learner email from the canonical learner record, renders the already-issued certificate, submits a trusted message, and records delivery status separately from issuance.

Development and automated acceptance use the safe test provider. Production requires:

```text
SHS_EMAIL_PROVIDER=generic-http
SHS_EMAIL_PROVIDER_ENDPOINT=<approved provider endpoint>
SHS_EMAIL_PROVIDER_API_KEY=<secret environment value>
```

Missing configuration returns `EMAIL_PROVIDER_NOT_CONFIGURED`; provider timeout/unavailability/rejection returns a governed failure and does not invalidate the issued certificate. API keys are sent only in the provider request authorization header, never logged, rendered, persisted in reports, or committed.

Production deployment still requires provider selection, secret management, DNS/domain authentication, bounce/complaint handling, monitoring, and approved retry policy. Those are deployment and operations prerequisites, not certificate authority changes.
