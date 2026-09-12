# Production Operations and Recovery Packet

This packet is a bounded checklist. It contains no secrets and makes no contractual RPO/RTO promise.

## Health Checklist
- [ ] `/health/live` returns `LIVE`.
- [ ] `/health/ready` returns `READY` only with database, current migration state, and required configuration.
- [ ] Request correlation ID is present in logs and response headers.
- [ ] Optional provider states are checked separately from core readiness.

## Incident Checklist
- [ ] Detect and record severity, component, correlation ID, and safe scope.
- [ ] Triage as expected user error, dependency degradation, or incident.
- [ ] Contain by disabling the affected integration or service path.
- [ ] Preserve audit/security events and avoid sensitive payload logging.
- [ ] Validate recovery, then record review and follow-up ownership.

## Backup Verification Checklist
- [ ] Confirm protected database backup completed and is not empty.
- [ ] Confirm object/evidence/report backup completed with checksums.
- [ ] Confirm backup artifacts are outside source control and access-controlled.
- [ ] Confirm failure is alerted/escalated rather than treated as healthy.

## Restore Checklist
- [ ] Use an isolated target; never restore over active production data.
- [ ] Validate migration/schema version and constraints.
- [ ] Restore database and files, then verify checksums and representative relationships.
- [ ] Verify organization scope, evidence/report references, and lineage.
- [ ] Promote only after readiness and operator approval.

## DR Drill Checklist
- [ ] Exercise database, object storage, provider outage, bad configuration, and credential compromise scenarios.
- [ ] Record measured recovery time and recovery point; do not infer an SLA.
- [ ] Validate audit history and recomputable projections after restore.
- [ ] Record gaps and corrective actions.

## Agent Fabric Emergency Stop Checklist
- [ ] Disable the server-side safe-execution gate.
- [ ] Revoke affected delegation/agent/session as applicable.
- [ ] Confirm new protected claims are denied with an attributable event.
- [ ] Preserve existing task, attempt, approval, and security evidence.

## Provider Outage Checklist
- [ ] Mark provider `DEGRADED` or `UNAVAILABLE`; never fabricate success.
- [ ] Stop unsafe retries and preserve idempotency/reconciliation state.
- [ ] Disable only the affected integration where possible.
- [ ] Re-enable after health check and bounded smoke validation.

## Ownership Boundary
Repository-local checks and runbooks are complete. Hosted monitoring, cloud failover, production deployment, and real DR exercises require the deployment owner and external infrastructure.
