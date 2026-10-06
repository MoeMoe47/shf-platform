# Security Acceptance

4F acceptance covers:

- reviewer without assignment denied
- wrong candidate denied
- wrong gate denied
- correct candidate and gate accepted
- assignment without Identity capability denied
- Identity capability without assignment denied
- generic editor and `sales.admin` denied
- inactive/revoked membership denied by canonical Identity checks
- expired, future-effective, and revoked assignments denied
- multi-organization reuse denied
- source resolver candidate scope enforced
- self-assignment denied
- unauthorized provisioning denied
- authorized provisioning and revocation audited
- assignment history preserved
- decision/source history survives expiry and revocation
- stale/supersession conflicts rejected
- duplicate active assignment rejected
- protected field injection rejected
- readiness, sellability, lifecycle, production onboarding, and human approvals unchanged
- canonical `audit_events` used
- no production fixture/product leak
- `GLOBAL_CANONICAL` candidate/product identity preserved

Focused test evidence lives in the 4F unit/integration suites and the disposable PostgreSQL acceptance suite.

