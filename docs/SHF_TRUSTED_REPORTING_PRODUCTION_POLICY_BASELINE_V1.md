# SHF Trusted Reporting Production Operational Policy Baseline v1

Date: 2026-08-26  
Status: `APPROVED_SHF_BASELINE_V1`

## 1. Purpose

This record establishes the approved v1 operational policy values for SHF
Trusted Reporting. It governs operational protection and recovery targets; it
does not change reporting architecture, institutional authority, or Truth.

## 2. Approved operational values

| Policy | Approved value |
|---|---:|
| Public read rate limit | `120 / 60 seconds` |
| Login rate limit | `10 / 300 seconds` |
| Authenticated-user rate limit | `60 / 60 seconds` |
| Governance-mutation rate limit | `10 / 60 seconds` |
| Expensive-operation rate limit | `5 / 300 seconds` |
| Internal ingestion rate limit | `300 / 60 seconds / authenticated producer` |
| `SHS_MONITOR_BACKLOG_MAX_PENDING` | `100` |
| `SHS_MONITOR_BACKLOG_MAX_OLDEST_AGE_SECONDS` | `900` |
| `SHS_MONITOR_BACKLOG_NO_SUCCESS_AGE_SECONDS` | `900` |
| `SHS_MONITOR_QUARANTINE_DELTA_THRESHOLD` | `1` |
| Expired rate-limit window retention | `1 day` |
| Delivered outbox retention | `30 days` |
| Cleanup batch size | `100` |

These values apply to SHF Trusted Reporting and shared technical infrastructure
supporting it. They are not automatically SHS commercial-reporting policy.

## 3. Approved recovery targets

The approved policy targets are `RPO 15 minutes`, `RTO 60 minutes`, backup
retention `35 days`, and restore validation `quarterly`. Azure configuration and
runtime restore proof remain pending and are not implied by this approval.

## 4. Explicitly unapproved privacy/legal values

Expired-session retention, revoked-session retention, participant-linked
retention, identity-history retention, recipient-related retention, and
institutional audit retention/deletion remain `PRIVACY_REVIEW_REQUIRED` and/or
`LEGAL_REVIEW_REQUIRED`. No numeric proposal in an earlier packet is approved
by this document.

## 5. Institutional-history no-delete rule

Truth, Evidence, Sources, governance history, snapshots, publications, audit
history, identity links, and migration history remain protected from automatic
deletion. Existing safe no-delete behavior remains authoritative.

## 6. Policy versus deployment

`POLICY APPROVAL != DEPLOYMENT CONFIGURATION != RUNTIME PROOF`. The approved
values may be supplied to future environments through existing configuration,
but Azure resources, production startup, backup settings, and restore results
remain separately governed.

## 7. Environment scope

The baseline is intended for SHF production. Staging and development may use
explicit test values for validation, but must not inherit production values or
share production state, data, secrets, or identity configuration implicitly.

## 8. SHF/SHS authority boundary

Shared PostgreSQL, identity, Agent Fabric, rate limiting, monitoring, and
deployment primitives are technical infrastructure only. SHF governance and
publication authority does not grant SHS commercial-reporting authority, and
SHS administration does not grant SHF public-impact authority.

## 9. Future tuning procedure

Operational tuning must identify the policy ID, proposed change, observed load
or false-positive evidence, approving owner, effective date, and rollback
configuration. Tuning must preserve fail-closed security and must not alter
institutional reporting semantics.

## 10. Deferred Azure implementation

Azure remains `DEFERRED_EXTERNAL_INFRASTRUCTURE`. Future work must separately
configure Azure Container Apps, PostgreSQL, monitoring, backup/restore, and
environment-specific values. No deployment is claimed here.

## 11. Deferred Auth0 configuration

Auth0 remains `DEFERRED_EXTERNAL_CONFIGURATION`. This baseline does not
configure an Auth0 tenant, users, callbacks, secrets, or live identity proof.

## 12. Required privacy/legal review

Privacy and legal owners must decide the pending session, identity-linked,
participant-linked, recipient, and institutional-audit retention boundaries.
Until approved, protected canonical history remains no-delete and unapproved
session cleanup durations must not be treated as institutional policy.

## Configuration status

All approved application-owned rate, monitoring, and operational-retention
values map to existing configuration points. Recovery targets are policy-only;
their deployment configuration and restore validation remain
`DEPLOYMENT_CONFIGURATION_PENDING` and `RUNTIME_DRILL_PENDING`.
